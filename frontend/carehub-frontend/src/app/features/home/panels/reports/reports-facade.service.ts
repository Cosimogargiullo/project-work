import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ReportService } from '@app/services/report.service';
import { UserService } from '@app/services/user.service';
import { AppointmentService } from '@app/services/appointment.service';
import { MedicalReport } from '@app/models/medical-report.model';
import { User } from '@app/models/user.model';
import { Appointment } from '@app/models/appointment.model';
import { USER_ROLES } from '@app/core/constants/user-roles';
import { AppLoggerService } from '@app/core/error/app-logger.service';

interface ReportsEnrichment {
  patientNames: Record<number, string>;
  doctorNames: Record<number, string>;
  appointmentDates: Record<number, Date | string | null>;
}

interface ReportFilters {
  selectedPatientId: number | null;
  selectedDoctorId: number | null;
  patientTerm: string;
  doctorTerm: string;
  appointmentDate: Date | null;
  reportDate: Date | null;
}

@Injectable({ providedIn: 'root' })
export class ReportsFacadeService {
  constructor(
    private reportService: ReportService,
    private userService: UserService,
    private appointmentService: AppointmentService,
    private logger: AppLoggerService
  ) {}

  loadByRole(roles: string[], userId: number | null): Observable<MedicalReport[]> {
    if (roles.includes(USER_ROLES.PAZIENTE) && userId) {
      return this.reportService.getByPatientId(userId).pipe(catchError(() => of([])));
    }
    if (roles.includes(USER_ROLES.MEDICO) && userId) {
      return this.reportService.getByDoctorId(userId).pipe(catchError(() => of([])));
    }
    return this.reportService.getAll().pipe(catchError(() => of([])));
  }

  applyRoleVisibility(reports: MedicalReport[], roles: string[], userId: number | null): MedicalReport[] {
    if (roles.includes(USER_ROLES.PAZIENTE) && userId) {
      return reports.filter((report) => report.patientId === userId);
    }
    if (roles.includes(USER_ROLES.MEDICO) && userId) {
      return reports.filter((report) => report.doctorId === userId);
    }
    return reports;
  }

  enrichReports(reports: MedicalReport[]): Observable<ReportsEnrichment> {
    const patientIds = Array.from(new Set(reports.map((r) => r.patientId).filter((id): id is number => id != null)));
    const doctorIds = Array.from(new Set(reports.map((r) => r.doctorId).filter((id): id is number => id != null)));
    const appointmentIds = Array.from(new Set(reports.map((r) => r.appointmentId).filter((id): id is number => id != null)));

    const userRequests: Observable<User | null>[] = [
      ...patientIds.map((id) => this.userService.getUserById(id).pipe(catchError(() => of(null)))),
      ...doctorIds.map((id) => this.userService.getUserById(id).pipe(catchError(() => of(null))))
    ];
    const appointmentRequests: Observable<Appointment | null>[] = appointmentIds.map((id) =>
      this.appointmentService.getById(id, true).pipe(catchError(() => of(null)))
    );

    return forkJoin({
      users: userRequests.length ? forkJoin(userRequests) : of([] as (User | null)[]),
      appointments: appointmentRequests.length ? forkJoin(appointmentRequests) : of([] as (Appointment | null)[])
    }).pipe(
      map(({ users, appointments }) => {
        const patientNames: Record<number, string> = {};
        const doctorNames: Record<number, string> = {};
        const appointmentDates: Record<number, Date | string | null> = {};

        const totalPatients = patientIds.length;
        users.forEach((user, index) => {
          if (index < totalPatients) {
            const id = patientIds[index];
            patientNames[id] = user && user.firstName ? `${user.firstName} ${user.lastName}` : String(id);
            return;
          }

          const id = doctorIds[index - totalPatients];
          doctorNames[id] = user && user.firstName ? `${user.firstName} ${user.lastName}` : String(id);
        });

        appointments.forEach((appointment, index) => {
          const id = appointmentIds[index];
          if (!appointment) {
            appointmentDates[id] = null;
            return;
          }

          if (appointment.appointmentDateTime) {
            appointmentDates[id] = appointment.appointmentDateTime;
            return;
          }

          if (appointment.appointmentDay && appointment.appointmentTime) {
            try {
              appointmentDates[id] = new Date(`${appointment.appointmentDay}T${appointment.appointmentTime}`);
            } catch {
              appointmentDates[id] = null;
            }
            return;
          }

          appointmentDates[id] = null;
        });

        return { patientNames, doctorNames, appointmentDates };
      }),
      catchError((error: unknown) => {
        this.logger.error('ReportsFacadeService.enrichReports', error);
        return of({ patientNames: {}, doctorNames: {}, appointmentDates: {} });
      })
    );
  }

  applyFilters(
    reports: MedicalReport[],
    filters: ReportFilters,
    patientNames: Record<number, string>,
    doctorNames: Record<number, string>,
    appointmentDates: Record<number, Date | string | null>
  ): MedicalReport[] {
    let result = [...reports];

    if (filters.selectedPatientId != null) {
      result = result.filter((report) => report.patientId === filters.selectedPatientId);
    }

    if (filters.patientTerm) {
      const term = filters.patientTerm.toLowerCase();
      result = result.filter((report) => {
        const name = patientNames[report.patientId];
        return (name && name.toLowerCase().includes(term)) || String(report.patientId).includes(term);
      });
    }

    if (filters.selectedDoctorId != null) {
      result = result.filter((report) => report.doctorId === filters.selectedDoctorId);
    }

    if (filters.doctorTerm) {
      const term = filters.doctorTerm.toLowerCase();
      result = result.filter((report) => {
        const name = doctorNames[report.doctorId];
        return (name && name.toLowerCase().includes(term)) || String(report.doctorId).includes(term);
      });
    }

    if (filters.appointmentDate instanceof Date) {
      const start = new Date(filters.appointmentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.appointmentDate);
      end.setHours(23, 59, 59, 999);

      result = result.filter((report) => {
        const appointment = appointmentDates[report.appointmentId];
        if (!(appointment instanceof Date) || Number.isNaN(appointment.getTime())) {
          return false;
        }
        return appointment >= start && appointment <= end;
      });
    }

    if (filters.reportDate instanceof Date) {
      const start = new Date(filters.reportDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.reportDate);
      end.setHours(23, 59, 59, 999);

      result = result.filter((report) => {
        if (!report.reportDate) {
          return false;
        }
        const reportDate = new Date(report.reportDate);
        if (Number.isNaN(reportDate.getTime())) {
          return false;
        }
        return reportDate >= start && reportDate <= end;
      });
    }

    return result;
  }
}
