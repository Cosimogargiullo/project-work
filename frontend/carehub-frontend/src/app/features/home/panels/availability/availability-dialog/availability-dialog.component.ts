import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AvailabilityService } from '@app/services/availability.service';
import { UserService } from '@app/services/user.service';
import { AuthService } from '@app/core/auth/auth.service';
import { USER_ROLES } from '@app/core/constants/user-roles';
import { User } from '@app/models/user.model';
import { of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ProgressSpinnerComponent } from '@app/utils/progress-spinner/progress-spinner.component';
import { ResultDialogModalComponent } from '@app/utils/result-dialog-modal/result-dialog-modal.component';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { RESULT_OK } from '@app/core/constants/api-endpoints';
import { DialogMode, DIALOG_MODES } from '@app/core/constants/dialog-modes';
import { AvailabilitySlot } from '@app/models/availability-slot.model';
import { TimeSlot } from '../../../../../models/time-slot.model';
import { AvailabilityPayload } from '@app/models/availability-payload.model';

interface AvailabilityDialogData {
  mode?: DialogMode;
  doctorId?: number;
  doctorName?: string;
  date?: string;
}

@Component({
  selector: 'app-availability-dialog',
  templateUrl: './availability-dialog.component.html',
  styleUrls: ['./availability-dialog.component.scss']
})
export class AvailabilityDialogComponent implements OnInit {
  availabilityForm: FormGroup;
  timeSlots: TimeSlot[] = [];
  filteredDoctors: User[] = [];
  spinnerRef: MatDialogRef<ProgressSpinnerComponent> | null = null;
  isDoctor = false;

  today: Date = new Date();

  mode: DialogMode = DIALOG_MODES.create;
  dialogModes = DIALOG_MODES;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AvailabilityDialogComponent>,
    private dialog: MatDialog,
    private availabilityService: AvailabilityService,
    private userService: UserService,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: AvailabilityDialogData
  ) {
    this.today.setHours(0, 0, 0, 0);

    this.availabilityForm = this.fb.group({
      doctorId: [null, Validators.required],
      doctorSearch: [''],
      availableDay: [this.today, Validators.required],
      durationMinutes: [60, [Validators.required, Validators.min(1)]],
      startTime: ['09:00', Validators.required],
      endTime: ['18:00', Validators.required],
    });
  }

  ngOnInit(): void {
    this.mode = this.data?.mode ?? DIALOG_MODES.create;

    // Ensure the reactive form control disabled state matches the dialog mode
    const doctorControl = this.availabilityForm.get('doctorSearch');
    if (doctorControl) {
      if (this.mode === DIALOG_MODES.edit) {
        doctorControl.disable({ emitEvent: false });
      } else {
        doctorControl.enable({ emitEvent: false });
      }
    }

    // disable availableDay in edit mode (date cannot be changed)
    const dateControl = this.availabilityForm.get('availableDay');
    if (dateControl) {
      if (this.mode === DIALOG_MODES.edit) {
        dateControl.disable({ emitEvent: false });
      } else {
        dateControl.enable({ emitEvent: false });
      }
    }

    // Ruolo corrente: se sono medico, nascondo il campo di ricerca e imposto l'id
    const roles = this.authService.getRoles();
    this.isDoctor = roles.includes(USER_ROLES.MEDICO);
    if (this.isDoctor) {
      const uid = this.authService.getUserId();
      if (uid) {
        this.availabilityForm.patchValue({ doctorId: uid });
        // Recupero nome del medico per mostrare nel dialog quando è disabilitato
        this.userService.getUserById(uid).subscribe({
          next: (u: User) => {
            if (u) {
              this.availabilityForm.patchValue({ doctorSearch: `${u.firstName} ${u.lastName}` });
            }
          },
          error: () => {
            // Ignoro l'errore e lascio il campo vuoto
          }
        });
      }
      // Disabilito la ricerca medico: non modificabile
      doctorControl?.disable({ emitEvent: false });
      this.availabilityForm.get('doctorId')?.disable({ emitEvent: false });
    }

    // Se siamo in modalità edit o view, precompiliamo i dati
    if (this.mode === DIALOG_MODES.edit || this.mode === DIALOG_MODES.view) {
      this.initFromExistingData();
    }

    if (this.mode !== DIALOG_MODES.view) {
      this.userService
        .searchDoctors('')
        .subscribe((doctors: User[]) => {
          this.filteredDoctors = doctors || [];
        });

      const searchControl = this.availabilityForm.get('doctorSearch');
      if (searchControl) {
        searchControl.valueChanges
          .pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((value: string | User) => {
              if (typeof value !== 'string') {
                return of([]);
              }
              const term = value.trim();
              if (!term) {
                return this.userService.searchDoctors('');
              }
              if (term.length < 2) {
                this.filteredDoctors = [];
                return of([]);
              }
              return this.userService.searchDoctors(term);
            })
          )
          .subscribe((doctors: User[]) => {
            this.filteredDoctors = doctors;
          });
      }
    }
  }

  private initFromExistingData(): void {
    if (!this.data.doctorId || !this.data.date) {
      return;
    }

    this.loadSpinner(true);

    this.availabilityService.getSlotsDetailsByDoctorAndDate(this.data.doctorId, this.data.date).subscribe({
      next: (availability: AvailabilityPayload) => {
        this.loadSpinner(false);

        if (!availability || !availability.slots) {
          return;
        }

        const doctorId = availability.doctorId ?? null;
        const doctorName = this.data.doctorName ?? '';
        const dateValue = availability.availableDay ? new Date(availability.availableDay) : null;

        this.availabilityForm.patchValue({
          doctorId,
          doctorSearch: doctorName,
          availableDay: dateValue,
          durationMinutes: 60
        });

        const slots: unknown[] = Array.isArray(availability.slots) ? availability.slots : [];

        this.timeSlots = slots
          .filter((slot): slot is AvailabilitySlot => {
            if (!slot || typeof slot !== 'object') {
              return false;
            }
            return typeof (slot as AvailabilitySlot).time === 'string';
          })
          .map((slot: AvailabilitySlot) => ({
            time: slot.time as string,
            selected: Boolean(slot.selected),
            booked: Boolean(slot.booked),
            disabled: this.mode === DIALOG_MODES.view || Boolean(slot.booked)
          }));

        // If editing, set the form start/end times to the min and max existing slot times
        const times = this.timeSlots.map(s => s.time).filter(Boolean) as string[];
        if (times.length) {
          const sorted = [...times].sort();
          const minTime = sorted[0];
          const maxTime = sorted[sorted.length - 1];
          this.availabilityForm.patchValue({ startTime: minTime, endTime: maxTime }, { emitEvent: false });
        }

        if (this.mode === DIALOG_MODES.view) {
          this.availabilityForm.disable();
        }

      },
      error: (err) => {
        this.loadSpinner(false);

        this.dialog.open(ResultDialogModalComponent, {
          width: '400px',
          data: {
            titolo: 'Errore',
            messaggio: err?.error?.resultMessage || 'Si è verificato un errore durante il caricamento delle disponibilità.'
          }
        });
      }
    });
  }

  generateSlots(): void {
    const date: Date | null = this.availabilityForm.get('availableDay')?.value;
    const start: string | null = this.availabilityForm.value.startTime;
    const end: string | null = this.availabilityForm.value.endTime;
    const durationMinutes: number | null = this.availabilityForm.value.durationMinutes;

    if (!date || !start || !end) {
      return;
    }

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startDate = new Date(date);
    startDate.setHours(startH, startM, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endH, endM, 0, 0);

    if (endDate <= startDate) {
      return;
    }

    const stepMinutes = durationMinutes && durationMinutes > 0 ? durationMinutes : 60;

    // Preserve existing slots map by time
    const existingSlots: TimeSlot[] = Array.isArray(this.timeSlots) ? this.timeSlots : [];
    const existingMap = new Map<string, TimeSlot>();
    existingSlots.forEach(s => {
      if (s && s.time) {
        existingMap.set(s.time, { ...s });
      }
    });

    const newSlots: TimeSlot[] = [];
    for (let current = new Date(startDate); current < endDate; current.setMinutes(current.getMinutes() + stepMinutes)) {
      const hours = current.getHours().toString().padStart(2, '0');
      const minutes = current.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      const existing = existingMap.get(timeStr);
      if (existing) {
        // preserve flags from existing slot
        const preserved: TimeSlot = {
          time: timeStr,
          selected: existing.selected ?? false,
          booked: existing.booked ?? false,
          disabled: this.mode === DIALOG_MODES.view || existing.disabled === true || existing.booked === true
        };
        newSlots.push(preserved);
        existingMap.delete(timeStr);
      } else {
        // new generated slot defaults to selected
        newSlots.push({ time: timeStr, selected: true, booked: false, disabled: false });
      }
    }

    // Preserve any existing slots that were disabled/booked/or explicitly unselected
    const preservedExtras: TimeSlot[] = [];
    for (const slot of existingMap.values()) {
      if (slot && (slot.disabled === true || slot.booked === true || slot.selected === false)) {
        // only add if not already present in newSlots
        if (!newSlots.find(s => s.time === slot.time)) {
          preservedExtras.push({ ...slot });
        }
      }
    }

    // Combine newSlots and preserved extras, sort by time for consistency
    const combined = [...newSlots, ...preservedExtras];
    combined.sort((a, b) => a.time.localeCompare(b.time));
    this.timeSlots = combined;
  }

  onSlotSelectionChange(slot: TimeSlot, selected: boolean): void {
    if (slot.disabled) {
      return;
    }
    slot.selected = selected;
  }

  displayDoctor = (user?: User | string | null): string => {
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
    this.availabilityForm.patchValue({ doctorId: user.id });
  }

  submit(): void {
    if (this.mode === DIALOG_MODES.view) {
      return;
    }

    if (this.availabilityForm.invalid) {
      return;
    }

    const availableDay = this.availabilityForm.get('availableDay')?.value;
    const durationMinutes = this.availabilityForm.get('durationMinutes')?.value;
    let doctorId = this.availabilityForm.get('doctorId')?.value;
    if (this.isDoctor && (!doctorId || doctorId === null)) {
      doctorId = this.authService.getUserId();
    }

    const dayString = this.formatDay(availableDay);

    if (!dayString) {
      return;
    }

    this.loadSpinner(true);

    const payload = {
      doctorId,
      availableDay: dayString,
      durationMinutes,
      slots: this.timeSlots
    };
    const request$ = this.mode === DIALOG_MODES.edit
      ? this.availabilityService.updateAvailability(payload)
      : this.availabilityService.createAvailability(payload);

    request$.subscribe({
      next: (res: SimpleResult) => {
        this.loadSpinner(false);

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
        this.loadSpinner(false);

        this.dialog.open(ResultDialogModalComponent, {
          width: '400px',
          data: {
            titolo: 'Creazione disponibilità non riuscita',
            messaggio: err?.error?.resultMessage || 'Si è verificato un errore durante la creazione delle disponibilità.'
          }
        });
      }
    });
  }

  loadSpinner(show: boolean): void {
    if (show) {
      this.spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });
    } else {
      this.spinnerRef?.close();
    }
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

  close(): void {
    this.dialogRef.close(false);
  }
}
