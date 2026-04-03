import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '@app/core/auth/auth.service';
import { AppointmentService } from '@app/services/appointment.service';
import { UserService } from '@app/services/user.service';
import { ReportService } from '@app/services/report.service';
import { ProgressSpinnerComponent } from '@app/utils/progress-spinner/progress-spinner.component';
import { ResultDialogModalComponent } from '@app/utils/result-dialog-modal/result-dialog-modal.component';
import { RESULT_OK } from '@app/core/constants/api-endpoints';
import { USER_ROLES } from '@app/core/constants/user-roles';
import { Appointment } from '@app/models/appointment.model';
import { User } from '@app/models/user.model';
import { MedicalReport } from '@app/models/medical-report.model';
import { debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-report-dialog',
  templateUrl: './report-dialog.component.html',
  styleUrls: ['./report-dialog.component.scss']
})
export class ReportDialogComponent implements OnInit {
  form: FormGroup;
  patients: User[] = [];
  doctors: User[] = [];
  appointments: Appointment[] = [];

  isLoadingPatients = false;
  isLoadingDoctors = false;
  isLoadingAppointments = false;
  isSubmitting = false;

  selectedFile: File | null = null;
  currentReport: MedicalReport | null = null;
  mode: 'create' | 'edit' = 'create';
  isDoctor = false;
  isAdmin = false;
  isSegreteria = false;

  constructor(
    private dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode?: 'create' | 'edit'; report?: MedicalReport } | null,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private userService: UserService,
    private reportService: ReportService
  ) {
    this.form = this.fb.group({
      patientSearch: [''],
      patientId: [null, Validators.required],
      doctorSearch: [''],
      doctorId: [null],
      appointmentId: [null, Validators.required],
      summary: [''],
      notes: [''],
      cost: [null, [Validators.required, Validators.min(0)]],
      file: [null, Validators.required]
    });
  }

  get isEditMode(): boolean {
    return this.mode === 'edit' && !!this.currentReport?.id;
  }

  ngOnInit(): void {
    const roles = this.authService.getRoles();
    this.isDoctor = roles.includes(USER_ROLES.MEDICO);
    this.isAdmin = roles.includes(USER_ROLES.ADMIN);
    this.isSegreteria = roles.includes(USER_ROLES.SEGRETERIA);

    this.mode = this.data?.mode ?? 'create';
    this.currentReport = this.data?.report ?? null;

    if (this.isEditMode && this.currentReport) {
      this.form.patchValue({
        patientId: this.currentReport.patientId,
        doctorId: this.currentReport.doctorId ?? null,
        appointmentId: this.currentReport.appointmentId ? Number(this.currentReport.appointmentId) : null,
        summary: this.currentReport.summary || '',
        notes: this.currentReport.notes || '',
        cost: this.currentReport.cost,
        file: this.currentReport.fileName || 'file-presente'
      });
      this.form.get('file')?.clearValidators();
      this.form.get('file')?.updateValueAndValidity({ emitEvent: false });

      this.loadAppointmentsForPatient(this.currentReport.patientId);
      this.userService.getUserById(this.currentReport.patientId).subscribe({
        next: (patient: User) => {
          if (patient) {
            this.form.patchValue({ patientSearch: this.displayPatient(patient) }, { emitEvent: false });
          }
        }
      });

      // also fetch doctor display label if present
      if (this.currentReport.doctorId) {
        this.userService.getUserById(this.currentReport.doctorId).subscribe({
          next: (doctor: User) => {
            if (doctor) {
              this.form.patchValue({ doctorSearch: this.displayPatient(doctor) }, { emitEvent: false });
            }
          }
        });
      }

      // In edit mode pre-selezioniamo e disabilitiamo i campi che non devono essere modificati
      this.form.get('patientSearch')?.disable({ emitEvent: false });
      this.form.get('patientId')?.disable({ emitEvent: false });
      this.form.get('doctorSearch')?.disable({ emitEvent: false });
      this.form.get('doctorId')?.disable({ emitEvent: false });
      this.form.get('appointmentId')?.disable({ emitEvent: false });
    }

    this.setupPatientSearch();
    this.setupDoctorSearch();
    // preload patients so the autocomplete is populated on focus
    if (!this.isLoadingPatients) {
      this.isLoadingPatients = true;
      this.userService
        .searchPatients('')
        .pipe(finalize(() => (this.isLoadingPatients = false)))
        .subscribe((patients: User[]) => (this.patients = patients || []));
    }

    // preload doctors if the current user can select doctors (ADMIN or SEGRETERIA)
    if (!this.isLoadingDoctors && !this.isDoctor && (this.isAdmin || this.isSegreteria)) {
      this.isLoadingDoctors = true;
      this.userService
        .searchDoctors('')
        .pipe(finalize(() => (this.isLoadingDoctors = false)))
        .subscribe((doctors: User[]) => (this.doctors = doctors || []));
    }
  }

  private setupPatientSearch(): void {
    const ctrl = this.form.get('patientSearch');
    if (!ctrl) {
      return;
    }

    ctrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value: string | User) => {
          if (typeof value !== 'string') {
            return of([]);
          }
          const term = value.trim();
          this.isLoadingPatients = true;
          return this.userService
            .searchPatients(term)
            .pipe(finalize(() => (this.isLoadingPatients = false)));
        })
      )
      .subscribe((patients: User[]) => {
        this.patients = patients || [];
      });
  }

  private setupDoctorSearch(): void {
    const ctrl = this.form.get('doctorSearch');
    if (!ctrl) return;

    ctrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value: string | User) => {
          if (typeof value !== 'string') {
            return of([]);
          }
          const term = value.trim();
          this.isLoadingDoctors = true;
          if (!term) {
            return this.userService.searchDoctors('').pipe(finalize(() => (this.isLoadingDoctors = false)));
          }
          return this.userService.searchDoctors(term).pipe(finalize(() => (this.isLoadingDoctors = false)));
        })
      )
      .subscribe((doctors: User[]) => {
        this.doctors = doctors || [];
      });
  }

  onPatientSelected(user: User): void {
    if (!user || user.id == null) {
      return;
    }
    this.form.patchValue({ patientId: user.id, appointmentId: null });
    this.appointments = [];
    this.loadAppointmentsForPatient(user.id);
  }

  onDoctorSelected(user: User): void {
    if (!user || user.id == null) return;
    this.form.patchValue({ doctorId: user.id });
    const patientId = this.form.value.patientId;
    if (patientId) {
      this.loadAppointmentsForPatient(patientId);
    }
  }

  displayPatient(user: User | string | null): string {
    if (!user || typeof user === 'string') {
      return typeof user === 'string' ? user : '';
    }
    return `${user.firstName} ${user.lastName} (${user.username})`;
  }

  private loadAppointmentsForPatient(patientId: number): void {
    const loggedDoctorId = this.authService.getUserId();
    const selectedDoctorId = this.form.value.doctorId;
    const doctorId = this.isDoctor ? loggedDoctorId : (selectedDoctorId ?? null);
    this.isLoadingAppointments = true;
    this.appointmentService
      .filter({ doctorId: doctorId, patientId })
      .pipe(finalize(() => (this.isLoadingAppointments = false)))
      .subscribe({
        next: (appointments) => {
          this.appointments = appointments || [];

          // If editing, ensure the appointmentId is present and selected.
          // The appointment could be inactive (soft-deleted) and therefore not returned by the standard filter.
          if (this.isEditMode && this.currentReport?.appointmentId) {
            const targetId = Number(this.currentReport.appointmentId);
            const found = this.appointments.find(a => Number(a.id) === targetId);
            if (found) {
              this.form.patchValue({ appointmentId: targetId }, { emitEvent: false });
            } else {
              // try to fetch the appointment including inactive and add it
              this.appointmentService.getById(targetId, true).subscribe({
                next: (appt) => {
                  if (appt) {
                    this.appointments = [...this.appointments, appt];
                    this.form.patchValue({ appointmentId: targetId }, { emitEvent: false });
                  }
                },
                error: () => {
                  // ignore, keep appointments as-is
                }
              });
            }
          }
        },
        error: () => {
          this.appointments = [];
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.form.patchValue({ file: this.selectedFile.name });
    } else {
      this.selectedFile = null;
      this.form.patchValue({ file: null });
    }
  }

  submit(): void {
    if (this.form.invalid || (!this.isEditMode && !this.selectedFile)) {
      this.form.markAllAsTouched();
      return;
    }

    // use getRawValue to read disabled controls in edit mode
    const raw = this.form.getRawValue();
    const selectedAppointmentId = Number(raw.appointmentId);
    const selectedAppointment = this.appointments.find((appointment) => Number(appointment.id) === selectedAppointmentId);
    let doctorId = null as number | null;
    if (this.isDoctor) {
      doctorId = this.authService.getUserId();
    } else {
      doctorId = raw.doctorId ?? selectedAppointment?.doctorId ?? this.currentReport?.doctorId ?? null;
    }

    if (!doctorId) {
      this.dialog.open(ResultDialogModalComponent, {
        width: '400px',
        data: {
          titolo: 'Selezione incompleta',
          messaggio: 'Non è stato possibile determinare il medico associato all\'appuntamento selezionato.'
        }
      });
      return;
    }

    const { patientId, appointmentId, summary, notes, cost } = raw;

    const formData = new FormData();
    formData.append('patientId', String(patientId));
    formData.append('doctorId', String(doctorId));
    formData.append('appointmentId', String(appointmentId));
    if (summary) {
      formData.append('summary', summary);
    }
    if (notes) {
      formData.append('notes', notes);
    }
    formData.append('cost', String(cost));
    if (this.selectedFile) {
      formData.append('file', this.selectedFile as Blob, this.selectedFile?.name || 'report.pdf');
    }

    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });
    this.isSubmitting = true;

    const request$ = this.isEditMode && this.currentReport?.id
      ? this.reportService.update(this.currentReport.id, formData)
      : this.reportService.create(formData);

    request$
      .pipe(
        finalize(() => {
          spinnerRef.close();
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (res) => {
          const resultDialog = this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: res.resultMessageHeader,
              messaggio: res.resultMessage
            }
          });

          resultDialog.afterClosed().subscribe(() => {
            if (res.result === RESULT_OK) {
              this.dialogRef.close(true);
            }
          });
        },
        error: (err) => {
          this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: this.isEditMode ? 'Modifica referto non riuscita' : 'Creazione referto non riuscita',
              messaggio: err?.error?.resultMessage || (this.isEditMode
                ? 'Errore durante la modifica del referto.'
                : 'Errore durante la creazione del referto.')
            }
          });
        }
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
