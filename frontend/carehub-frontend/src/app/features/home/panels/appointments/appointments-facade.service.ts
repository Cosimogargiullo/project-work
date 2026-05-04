import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppointmentService } from '@app/services/appointment.service';
import { UserService } from '@app/services/user.service';
import { Appointment } from '@app/models/appointment.model';
import { User } from '@app/models/user.model';
import { AppLoggerService } from '@app/core/error/app-logger.service';

interface AppointmentFilterState {
  doctorTerm: string;
  patientTerm: string;
  selectedDate: Date | null;
  selectedStatus: string | null;
  isDoctor: boolean;
  currentDoctorId: number | null;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsFacadeService {
  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    private logger: AppLoggerService
  ) {}

  loadBaseAppointments(isPatient: boolean, currentUserId: number | null): Observable<Appointment[]> {
    if (isPatient && currentUserId) {
      return this.appointmentService.filter({ patientId: currentUserId }).pipe(catchError(() => of([])));
    }
    return this.appointmentService.getAll().pipe(catchError(() => of([])));
  }

  enrichAppointments(appointments: Appointment[]): Observable<Appointment[]> {
    const sorted = this.sortByDate(appointments);

    const doctorIds = Array.from(new Set<number>(sorted.map((a) => a.doctorId).filter((id): id is number => id != null)));
    const patientIds = Array.from(new Set<number>(sorted.map((a) => a.patientId).filter((id): id is number => id != null)));
    const allIds = Array.from(new Set<number>([...doctorIds, ...patientIds]));

    if (!allIds.length) {
      return of(
        sorted.map((appointment) => ({
          ...appointment,
          appointmentDateTime: this.buildAppointmentDateTime(appointment)
        }))
      );
    }

    const requests = allIds.map((id) => this.userService.getUserById(id).pipe(catchError(() => of(null))));

    return forkJoin(requests).pipe(
      map((users: (User | null)[]) => {
        const userMap = new Map<number, User>();
        users.forEach((user) => {
          if (user?.id != null) {
            userMap.set(user.id, user);
          }
        });

        return sorted.map((appointment) => {
          const doctor = appointment.doctorId != null ? userMap.get(appointment.doctorId) : undefined;
          const patient = appointment.patientId != null ? userMap.get(appointment.patientId) : undefined;
          return {
            ...appointment,
            doctorName: doctor ? `${doctor.firstName} ${doctor.lastName}` : (appointment.doctorId ?? ''),
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : (appointment.patientId ?? ''),
            appointmentDateTime: this.buildAppointmentDateTime(appointment)
          } as Appointment;
        });
      }),
      catchError((error: unknown) => {
        this.logger.error('AppointmentsFacadeService.enrichAppointments', error);
        return of(
          sorted.map((appointment) => ({
            ...appointment,
            appointmentDateTime: this.buildAppointmentDateTime(appointment)
          }))
        );
      })
    );
  }

  applyFilters(appointments: Appointment[], filterState: AppointmentFilterState): Appointment[] {
    return appointments.filter((appointment) => {
      if (filterState.isDoctor && filterState.currentDoctorId && appointment.doctorId !== filterState.currentDoctorId) {
        return false;
      }

      if (filterState.doctorTerm && (!appointment.doctorName || !appointment.doctorName.toLowerCase().includes(filterState.doctorTerm))) {
        return false;
      }

      if (filterState.patientTerm && (!appointment.patientName || !appointment.patientName.toLowerCase().includes(filterState.patientTerm))) {
        return false;
      }

      if (filterState.selectedDate) {
        const date = appointment.appointmentDateTime as Date | undefined;
        if (!date || Number.isNaN(date.getTime())) {
          return false;
        }
        if (
          date.getFullYear() !== filterState.selectedDate.getFullYear()
          || date.getMonth() !== filterState.selectedDate.getMonth()
          || date.getDate() !== filterState.selectedDate.getDate()
        ) {
          return false;
        }
      }

      if (filterState.selectedStatus && filterState.selectedStatus !== 'all') {
        return appointment.status === filterState.selectedStatus;
      }

      return true;
    });
  }

  private sortByDate(appointments: Appointment[]): Appointment[] {
    return [...appointments].sort((a, b) => {
      const first = this.buildAppointmentDateTime(a)?.getTime() ?? Number.POSITIVE_INFINITY;
      const second = this.buildAppointmentDateTime(b)?.getTime() ?? Number.POSITIVE_INFINITY;
      return first - second;
    });
  }

  private buildAppointmentDateTime(appointment: Appointment): Date | null {
    if (!appointment.appointmentDay || !appointment.appointmentTime) {
      return null;
    }

    const time = appointment.appointmentTime.toString();
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    return new Date(`${appointment.appointmentDay}T${normalizedTime}`);
  }
}
