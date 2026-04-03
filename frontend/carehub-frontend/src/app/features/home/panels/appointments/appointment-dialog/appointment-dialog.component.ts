import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService } from '@app/services/appointment.service';
import { Appointment } from '@app/models/appointment.model';
import { AppointmentPayload } from '@app/models/appointment-payload.model';
import { AvailabilitySlot } from '@app/models/availability-slot.model';
import { UserService } from '@app/services/user.service';
import { AvailabilityService } from '@app/services/availability.service';
import { User } from '@app/models/user.model';
import { of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs/operators';
import { ProgressSpinnerComponent } from '@app/utils/progress-spinner/progress-spinner.component';
import { ResultDialogModalComponent } from '@app/utils/result-dialog-modal/result-dialog-modal.component';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { RESULT_OK } from '@app/core/constants/api-endpoints';
import { DialogMode, DIALOG_MODES } from '@app/core/constants/dialog-modes';
import { AuthService } from '@app/core/auth/auth.service';
import { USER_ROLES } from '@app/core/constants/user-roles';
import { TimeSlot } from '@app/models/time-slot.model';

interface AppointmentDialogData {
  mode?: DialogMode;
  appointment?: Appointment;
}

@Component({
  selector: 'app-appointment-dialog',
  templateUrl: './appointment-dialog.component.html',
  styleUrls: ['./appointment-dialog.component.scss']
})
export class AppointmentDialogComponent implements OnInit {
  appointment: Appointment | null = null;
  form: FormGroup;
  loading = false;
  mode: DialogMode = DIALOG_MODES.create;
  dialogModes = DIALOG_MODES;
  today: Date = new Date();

  filteredDoctors: User[] = [];
  filteredPatients: User[] = [];
  isLoadingDoctors = false;
  isLoadingPatients = false;
  visitTypes: string[] = [];
  selectedVisitType: string | null = null;
  availableSlots: AvailabilitySlot[] = [];
  isLoadingSlots = false;
  isPatient = false;
  isDoctor = false;
  doctorSpecialization: string | null = null;
  doctorVisitType: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<AppointmentDialogComponent>,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private userService: UserService,
    private availabilityService: AvailabilityService,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentDialogData
  ) {
    this.today.setHours(0, 0, 0, 0);

    this.form = this.fb.group({
      patientId: [null, Validators.required],
      patientSearch: [''],
      doctorId: [null, Validators.required],
      doctorSearch: [''],
      visitType: [null, Validators.required],
      appointmentDay: [null, Validators.required],
      appointmentTime: [null, Validators.required],
      availabilityId: [null],
      status: ['PRENOTATO', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.mode = this.data?.mode ?? DIALOG_MODES.create;
    this.appointment = this.data?.appointment ?? null;

    const roles = this.authService.getRoles();
    this.isPatient = roles.includes(USER_ROLES.PAZIENTE);
    this.isDoctor = roles.includes(USER_ROLES.MEDICO);

    // Se l'utente è un paziente, precompiliamo il patientId con il suo id
    // in modalità creazione e impediamo la scelta di un altro paziente.
    if (this.isPatient && this.mode === DIALOG_MODES.create) {
      const currentUserId = this.authService.getUserId();
      if (currentUserId) {
        this.form.patchValue({ patientId: currentUserId });
        this.userService.getUserById(currentUserId).subscribe((patient: User) => {
          if (patient) {
            const label = `${patient.firstName} ${patient.lastName} (${patient.username})`;
            this.form.patchValue({ patientSearch: label }, { emitEvent: false });
          }
        });
      }
    }

    // Se l'utente è un medico, in creazione precompiliamo il doctorId con il suo id
    // e impediamo la scelta di un altro medico.
    if (this.isDoctor && this.mode === DIALOG_MODES.create) {
      const currentDoctorId = this.authService.getUserId();
      if (currentDoctorId) {
        this.form.patchValue({ doctorId: currentDoctorId });
        this.userService.getUserById(currentDoctorId).subscribe((doctor: User) => {
          if (doctor) {
            const label = `${doctor.firstName} ${doctor.lastName} (${doctor.username})`;
            this.form.patchValue({ doctorSearch: label }, { emitEvent: false });
            this.applyDoctorSpecialization(doctor.specialization || null);
          }
        });
      }
    }

    if (this.isDoctor && (this.mode === DIALOG_MODES.edit || this.mode === DIALOG_MODES.view)) {
      const currentDoctorId = this.authService.getUserId();
      if (currentDoctorId) {
        this.userService.getUserById(currentDoctorId).subscribe((doctor: User) => {
          if (doctor) {
            this.applyDoctorSpecialization(doctor.specialization || null);
          }
        });
      }
    }

    if ((this.mode === DIALOG_MODES.edit || this.mode === DIALOG_MODES.view) && this.appointment) {
      this.form.patchValue({
        patientId: this.appointment.patientId,
        doctorId: this.appointment.doctorId,
        visitType: this.appointment.visitType,
        appointmentDay: this.appointment.appointmentDay ? new Date(this.appointment.appointmentDay) : null,
        appointmentTime: this.normalizeTime(this.appointment.appointmentTime),
        availabilityId: this.appointment.availabilityId ?? null,
        status: this.appointment.status,
        notes: this.appointment.notes || ''
      });
      if (this.mode === DIALOG_MODES.view) {
        this.form.disable();
      }

      if (this.appointment.patientId != null) {
        this.userService.getUserById(this.appointment.patientId).subscribe((patient: User) => {
          if (patient) {
            const label = `${patient.firstName} ${patient.lastName} (${patient.username})`;
            this.form.patchValue({ patientSearch: label }, { emitEvent: false });
          }
        });
      }

      if (this.appointment.doctorId != null) {
        this.userService.getUserById(this.appointment.doctorId).subscribe((doctor: User) => {
          if (doctor) {
            const label = `${doctor.firstName} ${doctor.lastName} (${doctor.username})`;
            this.form.patchValue({ doctorSearch: label }, { emitEvent: false });
          }
        });
      }

      if (!this.isViewMode && this.appointment.doctorId && this.appointment.appointmentDay) {
        this.loadAvailableSlots(true);
      }
    }

    if (!this.isViewMode) {
      this.isLoadingPatients = true;
      this.userService
        .searchPatients('')
        .pipe(finalize(() => (this.isLoadingPatients = false)))
        .subscribe((patients: User[]) => {
          this.filteredPatients = patients || [];
        });
    }

    if (this.isDoctor) {
      // Per i medici carichiamo solo i tipi di visita relativi alla loro specializzazione
      this.userService.getVisitTypeByDoctorId(this.authService.getUserId()!).subscribe({
        next: (types) => {
          this.visitTypes = types || [];
          this.form.patchValue({ visitType: this.visitTypes.length === 1 ? this.visitTypes[0] : null }, { emitEvent: false });
          this.form.get('visitType')?.disable({ emitEvent: false });
        },
        error: () => {
          this.visitTypes = [];
        }
      });
    } else {
      this.appointmentService.getVisitTypes().subscribe({
        next: (types) => {
          this.visitTypes = types || [];
          // this.syncDoctorVisitType();
        },
        error: () => {
          this.visitTypes = [];
        }
      });
    }



    const visitTypeControl = this.form.get('visitType');
    if (visitTypeControl) {
      visitTypeControl.valueChanges.subscribe((value: string | null) => {
        this.selectedVisitType = value;

        if (this.isDoctor) {
          // Per i medici il dottore è sempre quello loggato; al cambio tipo visita
          // ricarichiamo solo gli slot disponibili.
          this.loadAvailableSlots();
          return;
        }

        // reset doctor selection when visit type changes
        this.form.patchValue({ doctorId: null, doctorSearch: '' });
        this.filteredDoctors = [];

        if (!this.isViewMode && value) {
          this.isLoadingDoctors = true;
          this.userService
            .searchDoctorsByVisitType('', value)
            .pipe(finalize(() => (this.isLoadingDoctors = false)))
            .subscribe((doctors: User[]) => {
              this.filteredDoctors = doctors || [];
            });
        }
      });
    }

    const doctorSearchControl = this.form.get('doctorSearch');
    if (doctorSearchControl && !this.isDoctor) {
      doctorSearchControl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((value: string | User) => {
            if (typeof value !== 'string') {
              return of([]);
            }
            const term = value.trim();

            // Se non c'è testo, mostra tutti i medici (o tutti per quella visita)
            if (!term) {
              this.isLoadingDoctors = true;
              const visitType = this.selectedVisitType;
              const search$ = visitType
                ? this.userService.searchDoctorsByVisitType('', visitType)
                : this.userService.searchDoctors('');

              return search$.pipe(finalize(() => (this.isLoadingDoctors = false)));
            }

            if (term.length < 2) {
              this.filteredDoctors = [];
              return of([]);
            }

            this.isLoadingDoctors = true;
            const visitType = this.selectedVisitType;
            const search$ = visitType
              ? this.userService.searchDoctorsByVisitType(term, visitType)
              : this.userService.searchDoctors(term);

            return search$.pipe(finalize(() => (this.isLoadingDoctors = false)));
          })
        )
        .subscribe((doctors: User[]) => {
          this.filteredDoctors = doctors;
        });
    }

    const patientSearchControl = this.form.get('patientSearch');
    if (patientSearchControl) {
      patientSearchControl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((value: string | User) => {
            if (typeof value !== 'string') {
              return of([]);
            }
            const term = value.trim();

            // Se non c'è testo, mostra tutti i pazienti
            if (!term) {
              this.isLoadingPatients = true;
              return this.userService.searchPatients('')
                .pipe(finalize(() => (this.isLoadingPatients = false)));
            }

            if (term.length < 2) {
              this.filteredPatients = [];
              return of([]);
            }

            this.isLoadingPatients = true;
            return this.userService.searchPatients(term).pipe(
              finalize(() => (this.isLoadingPatients = false))
            );
          })
        )
        .subscribe((patients: User[]) => {
          this.filteredPatients = patients;
        });
    }

    const doctorIdControl = this.form.get('doctorId');
    if (doctorIdControl && !this.isViewMode) {
      doctorIdControl.valueChanges.subscribe(() => this.loadAvailableSlots());
    }
  }

  get isViewMode(): boolean {
    return this.mode === DIALOG_MODES.view;
  }

  displayUser = (user?: User | string | null): string => {
    if (!user) {
      return '';
    }
    if (typeof user === 'string') {
      return user;
    }
    return `${user.firstName} ${user.lastName}`;
  };

  onDoctorOptionSelected(user: User): void {
    if (!user) {
      return;
    }
    this.form.patchValue({ doctorId: user.id });
  }

  onPatientOptionSelected(user: User): void {
    if (!user) {
      return;
    }
    this.form.patchValue({ patientId: user.id });
  }

  onSlotSelected(slot: TimeSlot | AvailabilitySlot | null): void {
    if (!slot) {
      this.form.patchValue({ availabilityId: null, appointmentTime: null }, { emitEvent: false });
      return;
    }

    const timeValue = slot.time || ('availableTime' in slot ? slot.availableTime : null);
    this.form.patchValue({
      availabilityId: slot,
      appointmentTime: this.normalizeTime(timeValue)
    }, { emitEvent: false });

  }

  formatVisitType(value?: string | null): string {
    if (!value) {
      return '';
    }
    return value
      .toLowerCase()
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private applyDoctorSpecialization(specialization: string | null): void {
    if (!this.isDoctor) {
      return;
    }

    this.doctorSpecialization = specialization ? specialization.toUpperCase() : null;
    // this.syncDoctorVisitType();
  }

  // private syncDoctorVisitType(): void {
  //   if (!this.isDoctor || !this.doctorSpecialization) {
  //     return;
  //   }

  //   const mappedVisitType = this.resolveVisitTypeBySpecialization(this.doctorSpecialization);
  //   if (!mappedVisitType) {
  //     return;
  //   }

  //   this.doctorVisitType = mappedVisitType;
  //   this.selectedVisitType = mappedVisitType;
  //   this.form.patchValue({ visitType: mappedVisitType }, { emitEvent: false });
  //   if (!this.isViewMode) {
  //     this.form.get('visitType')?.disable({ emitEvent: false });
  //   }
  // }

  private resolveVisitTypeBySpecialization(specialization: string): string | null {
    const normalized = specialization.toUpperCase();
    const exactMatch = this.visitTypes.find((visitType) => visitType.toUpperCase().endsWith(`_${normalized}`));
    if (exactMatch) {
      return exactMatch;
    }

    return this.visitTypes.find((visitType) => visitType.toUpperCase().includes(normalized)) || null;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    // Se l'utente è un medico, forziamo sempre il doctorId al medico loggato
    // indipendentemente da cosa ci sia nel form.
    if (this.isDoctor) {
      const currentDoctorId = this.authService.getUserId();
      if (currentDoctorId) {
        this.form.patchValue({ doctorId: currentDoctorId }, { emitEvent: false });
      }
    }

    const values = this.form.getRawValue();
    const dayString = this.formatDay(values.appointmentDay);
    const timeString = this.normalizeTime(values.appointmentTime);
    const availabilityValue = values.availabilityId;
    const availabilityId = availabilityValue && typeof availabilityValue === 'object' ? availabilityValue.id : availabilityValue;

    if (!dayString || !timeString) {
      return;
    }

    this.loading = true;
    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

    const payload: AppointmentPayload = {
      patientId: values.patientId,
      doctorId: values.doctorId,
      visitType: values.visitType,
      appointmentDay: dayString,
      appointmentTime: timeString,
      availabilityId,
      status: values.status,
      notes: values.notes
    };

    const request$ = this.mode === DIALOG_MODES.create
      ? this.appointmentService.create(payload)
      : (this.appointment && this.appointment.id != null)
        ? this.appointmentService.update(this.appointment.id, payload)
        : this.appointmentService.create(payload);

    request$.subscribe({
      next: (res: SimpleResult) => {
        this.loading = false;
        spinnerRef.close();

        const resultDialogRef = this.dialog.open(ResultDialogModalComponent, {
          width: '400px',
          data: {
            titolo: res.resultMessageHeader,
            messaggio: res.resultMessage
          }
        });

        resultDialogRef.afterClosed().subscribe(() => {
          if (res.result === RESULT_OK) {
            this.dialogRef.close(true);
          }
        });
      },
      error: (err) => {
        this.loading = false;
        spinnerRef.close();
        this.dialog.open(ResultDialogModalComponent, {
          width: '400px',
          data: {
            titolo: 'Operazione appuntamento non riuscita',
            messaggio: err?.error?.resultMessage || 'Si è verificato un errore durante il salvataggio dell\'appuntamento.'
          }
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }

  onAppointmentDateChange(date: Date | null): void {
    if (date) {
      this.form.patchValue({ appointmentDay: date, appointmentTime: null, availabilityId: null }, { emitEvent: false });
    }
    this.loadAvailableSlots();
  }

  private loadAvailableSlots(preserveSelection = false): void {
    if (this.isViewMode) {
      return;
    }

    const doctorId = this.form.value.doctorId;
    const date: Date = this.form.value.appointmentDay;

    if (!doctorId || !date) {
      this.availableSlots = [];
      this.form.patchValue({ availabilityId: null, appointmentTime: null }, { emitEvent: false });
      return;
    }
    const dateStr = this.formatDay(date);
    if (!dateStr) {
      this.availableSlots = [];
      this.form.patchValue({ availabilityId: null, appointmentTime: null }, { emitEvent: false });
      return;
    }
    const currentAvailability = this.form.value.availabilityId;
    const currentAvailabilityId = currentAvailability && typeof currentAvailability === 'object'
      ? currentAvailability.id
      : currentAvailability;
    const currentTime = this.normalizeTime(this.form.value.appointmentTime);

    this.isLoadingSlots = true;
    this.availableSlots = [];
    if (!preserveSelection) {
      this.form.patchValue({ availabilityId: null, appointmentTime: null }, { emitEvent: false });
    }

    const isActive = true;
    const notBooked = true;

    this.availabilityService
      .getSlotsForDoctorAndDate(doctorId, dateStr, isActive, notBooked)
      .pipe(finalize(() => (this.isLoadingSlots = false)))
      .subscribe((slots: TimeSlot[]) => {
        let available = (slots || []) as AvailabilitySlot[];

        // In creazione mostriamo solo gli slot liberi (server-side quando richiesto).
        if (this.mode === DIALOG_MODES.create) {
          available = available.filter(s => !s.booked);
        } else if (this.mode === DIALOG_MODES.edit) {
          // In modifica includiamo sempre lo slot già prenotato
          // relativo all'appuntamento corrente, ma nascondiamo gli
          // altri slot prenotati.
          available = available.filter(s => {
            const isBooked = s.booked === true;
            if (!isBooked) {
              return true;
            }
            const sameId = currentAvailabilityId && s.id === currentAvailabilityId;
            const sameTime = currentTime && this.normalizeTime(s.availableTime) === currentTime;
            return sameId || sameTime;
          });
        }

        this.availableSlots = available;

        const matched = this.findMatchingSlot(currentAvailabilityId, currentTime);
        if (matched) {
          this.form.patchValue({
            availabilityId: matched,
            appointmentTime: this.normalizeTime(matched.availableTime)
          }, { emitEvent: false });
        } else if (this.mode === DIALOG_MODES.edit && currentAvailabilityId) {
          // If the currently booked slot is not present in the server response (because
          // we requested only notBooked slots), try to fetch it individually and include it.
          this.availabilityService.getAvailabilityById(currentAvailabilityId).subscribe(slot => {
            if (slot) {
              // add the slot to the list and select it
              this.availableSlots = [...this.availableSlots, slot];
              const matched2 = this.findMatchingSlot(currentAvailabilityId, currentTime);
              if (matched2) {
                this.form.patchValue({
                  availabilityId: matched2,
                  appointmentTime: this.normalizeTime(matched2.availableTime)
                }, { emitEvent: false });
              }
            }
          });
        }
      });
  }

  private findMatchingSlot(availabilityId?: number | null, appointmentTime?: string | null): AvailabilitySlot | null {
    if (!this.availableSlots || !this.availableSlots.length) {
      return null;
    }

    if (availabilityId) {
      const byId = this.availableSlots.find((s: AvailabilitySlot) => s.id === availabilityId);
      if (byId) {
        return byId;
      }
    }

    if (appointmentTime) {
      const normalized = this.normalizeTime(appointmentTime);
      const byTime = this.availableSlots.find((s: AvailabilitySlot) => this.normalizeTime(s.availableTime) === normalized);
      if (byTime) {
        return byTime;
      }
    }

    return null;
  }

  private normalizeTime(time: string | null | undefined): string | null {
    if (!time) {
      return null;
    }
    const str = time.toString();
    if (str.length === 5) {
      return str;
    }
    if (str.length >= 8) {
      return str.substring(0, 5);
    }
    return str;
  }

  private formatDay(date: Date | null): string | null {
    if (!date) {
      return null;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
