import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AvailabilityDialogComponent } from '../panels/availability/availability-dialog/availability-dialog.component';

// Home + pannelli
import { HomeComponent } from './home.component';
import { ProfileComponent } from '../panels/profile/profile.component';
import { AppointmentsComponent } from '../panels/appointments/appointments.component';
import { ReportsComponent } from '../panels/reports/reports.component';
import { ReportDialogComponent } from '../panels/reports/report-dialog/report-dialog.component';
import { AvailabilityComponent } from '../panels/availability/availability.component';
import { AppointmentDialogComponent } from '../panels/appointments/appointment-dialog/appointment-dialog.component';
import { RegisterPatientComponent } from '@app/features/auth/register-patient/register-patient.component';
import { UsersComponent } from '../panels/users/users.component';
import { UserDialogComponent } from '../panels/users/user-dialog/user-dialog.component';
import { AnalyticsComponent } from '../panels/analytics/analytics.component';

@NgModule({
  declarations: [
    HomeComponent,
    ProfileComponent,
    AppointmentsComponent,
    ReportsComponent,
    ReportDialogComponent,
    AvailabilityComponent,
    AvailabilityDialogComponent,
    AppointmentDialogComponent,
    UsersComponent,
    UserDialogComponent,
    AnalyticsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: HomeComponent }
    ]),
    ReactiveFormsModule,
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatListModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    MatAutocompleteModule
  ],
  exports: [HomeComponent]
})
export class HomeModule {}
