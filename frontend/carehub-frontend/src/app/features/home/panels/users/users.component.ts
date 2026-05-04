import { Component, OnInit, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { UserService } from '@app/services/user.service';
import { AuthService } from '@app/core/auth/auth.service';
import { User } from '@app/models/user.model';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { ConfirmDialogModalComponent } from '@app/utils/confirm-dialog-modal/confirm-dialog-modal.component';
import { ProgressSpinnerComponent } from '@app/utils/progress-spinner/progress-spinner.component';
import { ResultDialogModalComponent } from '@app/utils/result-dialog-modal/result-dialog-modal.component';
import { RESULT_OK } from '@app/core/constants/api-endpoints';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { ALL_USER_ROLES } from '@app/core/constants/user-roles';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  private readonly mobileBreakpoint = 768;
  isMobileView = false;

  displayedColumns: string[] = ['username', 'name', 'email', 'roles', 'status', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  @ViewChild(MatSort) sort: MatSort | null = null;

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  totalUsers = 0;
  pageSize = 10;
  pageIndex = 0;

  loading = false;

  searchControl = new FormControl<string | null>('');
  roleControl = new FormControl<string | null>(null);
  statusControl = new FormControl<string>('all');


  allRoles = ALL_USER_ROLES;

  constructor(private userService: UserService, private dialog: MatDialog, private authService: AuthService) {}

  ngOnInit(): void {
    this.updateViewportMode();

    // configure sorting accessor for complex/modal fields
    this.dataSource.sortingDataAccessor = (item: User, property: string) => {
      switch (property) {
        case 'username':
          return item.username || '';
        case 'name':
          return ((item.firstName || '') + ' ' + (item.lastName || '')).trim();
        case 'email':
          return item.email || '';
        case 'roles':
          return Array.isArray(item.roles) ? item.roles.join(', ') : '';
        case 'status':
          return item.active ? 1 : 0;
        default:
          // @ts-ignore
          return item[property] ?? '';
      }
    };

    this.loadUsers();
    this.setupFilters();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportMode();
  }

  private updateViewportMode(): void {
    this.isMobileView = window.innerWidth < this.mobileBreakpoint;
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      // set default sort to roles ascending
      this.sort.active = 'roles';
      this.sort.direction = 'asc';
      // emit sort change so header shows direction and sorting is applied
      this.sort.sortChange.emit({ active: 'roles', direction: 'asc' } as Sort);
      // reapply filters to ensure paged data respects the sort
      this.applyFilters();
    }
  }

  private setupFilters(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());

    this.roleControl.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged())
      .subscribe(() => this.applyFilters());

    this.statusControl.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged())
      .subscribe((v) => {
        const active = v === 'active' ? true : v === 'inactive' ? false : undefined;
        this.loadUsers(active);
      });

  }

  private loadUsers(active?: boolean): void {
    this.loading = true;
    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });
    this.userService.getAllUsersFiltered(active).subscribe({
      next: (users: User[]) => {
        const currentId = this.authService.getUserId();
        this.allUsers = (users || []).filter(u => u.id !== currentId);
        this.applyFilters();
        this.applyDefaultSort();
        this.loading = false;
        spinnerRef.close();
      },
      error: () => {
        this.allUsers = [];
        this.applyFilters();
        this.applyDefaultSort();
        this.loading = false;
        spinnerRef.close();
      }
    });
  }

  private applyDefaultSort(): void {
    if (!this.sort) return;
    // ensure dataSource is bound to sort
    this.dataSource.sort = this.sort;
    this.sort.active = 'roles';
    this.sort.direction = 'asc';
    this.sort.sortChange.emit({ active: 'roles', direction: 'asc' } as Sort);
  }

  resetFilters(): void {
    // reset all filter controls without triggering their subscriptions
    this.searchControl.setValue('', { emitEvent: false });
    this.roleControl.setValue(null, { emitEvent: false });
    this.statusControl.setValue('all', { emitEvent: false });

    // reload all users and re-apply filters and default sort
    this.loadUsers(undefined);
  }

  private applyFilters(): void {
    const term = (this.searchControl.value || '').toLowerCase().trim();
    const selectedRole = this.roleControl.value;
    let data = [...this.allUsers];

    if (selectedRole) {
      data = data.filter(u => Array.isArray(u.roles) && u.roles.some(r => r === selectedRole));
    }

    if (term) {
      data = data.filter(u => {
        const haystack = [u.firstName, u.lastName, u.username, u.email, u.fiscalCode]
          .filter(Boolean)
          .map(v => String(v).toLowerCase())
          .join(' ');
        return haystack.includes(term);
      });
    }

    this.filteredUsers = data;
    this.totalUsers = data.length;
    this.pageIndex = 0;
    this.dataSource.data = data.slice(0, this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    const startIndex = event.pageIndex * event.pageSize;
    const endIndex = startIndex + event.pageSize;
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.dataSource.data = this.filteredUsers.slice(startIndex, endIndex);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '520px',
      autoFocus: true,
      restoreFocus: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openEditDialog(user: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '520px',
      autoFocus: true,
      restoreFocus: true,
      data: { mode: 'edit', user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  deleteUser(user: User): void {
    if (!user || user.id == null) {
      return;
    }

    // mostra avviso specifico se l'utente è medico o paziente
    let message = `Vuoi disattivare l'utente ${user.firstName} ${user.lastName}?`;
    if (Array.isArray(user.roles) && (user.roles.includes('MEDICO') || user.roles.includes('PAZIENTE'))) {
      message += ' Disattivando l\'utente verranno rimossi tutti gli appuntamenti e le disponibilità collegati a questo utente.';
    }

    const confirmRef = this.dialog.open(ConfirmDialogModalComponent, {
      width: '400px',
      data: {
        titolo: 'Conferma disattivazione utente',
        messaggio: message
      }
    });

    confirmRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

      this.userService.deleteUser(user.id as number).subscribe({
        next: (res: SimpleResult) => {
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
              this.loadUsers();
            }
          });
        },
        error: (err) => {
          spinnerRef.close();
          this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: 'Disattivazione non riuscita',
              messaggio: err?.error?.resultMessage || 'Errore durante la disattivazione utente.'
            }
          });
        }
      });
    });
  }

  reactivateUser(user: User): void {
    if (!user || user.id == null) return;

    const confirmRef = this.dialog.open(ConfirmDialogModalComponent, {
      width: '400px',
      data: {
        titolo: 'Conferma riattivazione utente',
        messaggio: `Vuoi riattivare l'utente ${user.firstName} ${user.lastName}?`
      }
    });

    confirmRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });
      this.userService.reactivateUser(user.id as number).subscribe({
        next: (res: SimpleResult) => {
          spinnerRef.close();
          const resultDialogRef = this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: { titolo: res.resultMessageHeader, messaggio: res.resultMessage }
          });
          resultDialogRef.afterClosed().subscribe(() => {
            if (res.result === RESULT_OK) {
              this.loadUsers();
            }
          });
        },
        error: (err) => {
          spinnerRef.close();
          this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: { titolo: 'Riattivazione non riuscita', messaggio: err?.error?.resultMessage || 'Errore durante la riattivazione utente.' }
          });
        }
      });
    });
  }

  deleteUserPermanent(user: User): void {
    if (!user || user.id == null) {
      return;
    }

    const confirmRef = this.dialog.open(ConfirmDialogModalComponent, {
      width: '400px',
      data: {
        titolo: 'Conferma eliminazione definitiva utente',
        messaggio: `Se elimini definitivamente l'utente ${user.firstName} ${user.lastName}, verranno eliminati tutti gli appuntamenti, le disponibilità e i referti associati. Vuoi continuare?`
      }
    });

    confirmRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

      this.userService.deleteUserPermanent(user.id as number).subscribe({
        next: (res: SimpleResult) => {
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
              this.loadUsers();
            }
          });
        },
        error: (err) => {
          spinnerRef.close();
          this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: 'Eliminazione definitiva non riuscita',
              messaggio: err?.error?.resultMessage || 'Errore durante l\'eliminazione definitiva utente.'
            }
          });
        }
      });
    });
  }

  getStatusLabel(user: User): string {
    if (user == null || user.active == null) return '-';
    return user.active ? 'Attivo' : 'Non attivo';
  }
}
