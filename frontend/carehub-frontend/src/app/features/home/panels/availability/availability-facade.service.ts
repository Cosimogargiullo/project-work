import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AvailabilityService } from '@app/services/availability.service';
import { UserService } from '@app/services/user.service';
import { AvailabilityGroup } from '@app/models/availability-group.model';
import { AvailabilitySlot } from '@app/models/availability-slot.model';
import { User } from '@app/models/user.model';
import { AppLoggerService } from '@app/core/error/app-logger.service';

@Injectable({ providedIn: 'root' })
export class AvailabilityFacadeService {
  constructor(
    private availabilityService: AvailabilityService,
    private userService: UserService,
    private logger: AppLoggerService
  ) {}

  loadAllByDate(selectedDate: Date | null): Observable<AvailabilityGroup[]> {
    return this.availabilityService.getAllAvailability().pipe(
      switchMap((slots: AvailabilitySlot[]) => {
        const filteredSlots = this.filterSlotsBySelectedDate(slots, selectedDate);
        if (!filteredSlots.length) {
          return of([]);
        }

        const doctorIds = Array.from(
          new Set<number>(filteredSlots.map((slot) => slot.doctorId).filter((id): id is number => id != null))
        );
        if (!doctorIds.length) {
          return of([]);
        }

        const userRequests = doctorIds.map((id) => this.userService.getUserById(id));

        return forkJoin(userRequests).pipe(
          map((doctors: User[]) => {
            const doctorMap = new Map<number, User>();
            doctors.forEach((doctor) => {
              if (doctor?.id != null) {
                doctorMap.set(doctor.id, doctor);
              }
            });

            const groups: AvailabilityGroup[] = [];
            doctorIds.forEach((doctorId) => {
              const doctor = doctorMap.get(doctorId);
              const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : '';
              const doctorSlots = filteredSlots.filter((slot) => slot.doctorId === doctorId);
              groups.push(...this.groupByDate(doctorSlots, doctorId, doctorName));
            });

            return this.sortGroups(groups);
          })
        );
      }),
      catchError((error: unknown) => {
        this.logger.error('AvailabilityFacadeService.loadAllByDate', error);
        return of([]);
      })
    );
  }

  loadForDoctorByDate(doctorId: number, selectedDate: Date | null): Observable<AvailabilityGroup[]> {
    return this.availabilityService.getAvailability(doctorId).pipe(
      map((slots: AvailabilitySlot[]) => {
        const filteredSlots = this.filterSlotsBySelectedDate(slots, selectedDate);
        return this.sortGroups(this.groupByDate(filteredSlots, doctorId, ''));
      }),
      catchError((error: unknown) => {
        this.logger.error('AvailabilityFacadeService.loadForDoctorByDate', error);
        return of([]);
      })
    );
  }

  loadForSearch(term: string, selectedDate: Date | null): Observable<AvailabilityGroup[]> {
    const normalizedTerm = term.trim();
    if (normalizedTerm.length < 2) {
      return this.loadAllByDate(selectedDate);
    }

    return this.userService.searchDoctors(normalizedTerm).pipe(
      switchMap((doctors: User[]) => this.loadForDoctors(doctors, selectedDate)),
      catchError((error: unknown) => {
        this.logger.error('AvailabilityFacadeService.loadForSearch', error);
        return of([]);
      })
    );
  }

  private loadForDoctors(doctors: User[], selectedDate: Date | null): Observable<AvailabilityGroup[]> {
    if (!doctors.length) {
      return of([]);
    }

    const validDoctors = doctors.filter((doctor): doctor is User => doctor?.id != null);
    if (!validDoctors.length) {
      return of([]);
    }

    const requests = validDoctors.map((doctor) => this.availabilityService.getAvailability(doctor.id));
    return forkJoin(requests).pipe(
      map((results: AvailabilitySlot[][]) => {
        const groups: AvailabilityGroup[] = [];

        results.forEach((slots: AvailabilitySlot[], index) => {
          const doctor = validDoctors[index];
          const doctorName = `${doctor.firstName} ${doctor.lastName}`;
          const filteredSlots = this.filterSlotsBySelectedDate(slots, selectedDate);
          if (!filteredSlots.length) {
            return;
          }
          groups.push(...this.groupByDate(filteredSlots, doctor.id, doctorName));
        });

        return this.sortGroups(groups);
      }),
      catchError((error: unknown) => {
        this.logger.error('AvailabilityFacadeService.loadForDoctors', error);
        return of([]);
      })
    );
  }

  private filterSlotsBySelectedDate(slots: AvailabilitySlot[], selectedDate: Date | null): AvailabilitySlot[] {
    if (!selectedDate) {
      return slots;
    }

    return slots.filter((slot) => {
      if (!slot.availableDay) {
        return false;
      }
      return this.isSameDay(slot.availableDay, selectedDate);
    });
  }

  private groupByDate(slots: AvailabilitySlot[], doctorId: number, doctorName: string): AvailabilityGroup[] {
    const groups = new Map<string, AvailabilitySlot[]>();

    slots.forEach((slot) => {
      if (!slot?.availableDay) {
        return;
      }
      const dateKey = slot.availableDay;
      const current = groups.get(dateKey) || [];
      current.push(slot);
      groups.set(dateKey, current);
    });

    return Array.from(groups.entries()).map(([date, daySlots]) => ({
      date,
      doctorId,
      doctorName,
      slots: daySlots
    }));
  }

  private isSameDay(dayString: string, targetDate: Date): boolean {
    const parsed = this.toDate(dayString);
    if (!parsed) {
      return false;
    }

    return parsed.getFullYear() === targetDate.getFullYear()
      && parsed.getMonth() === targetDate.getMonth()
      && parsed.getDate() === targetDate.getDate();
  }

  private toDate(dayString: string): Date | null {
    const parts = dayString.split('-');
    if (parts.length !== 3) {
      return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    return new Date(year, month, day);
  }

  private sortGroups(groups: AvailabilityGroup[]): AvailabilityGroup[] {
    return [...groups].sort((a, b) => a.date.localeCompare(b.date) || (a.doctorName ?? '').localeCompare(b.doctorName ?? ''));
  }
}
