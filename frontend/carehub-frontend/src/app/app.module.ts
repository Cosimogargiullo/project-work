import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MatPaginatorModule } from '@angular/material/paginator';

// Material modules
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// App components
import { ProgressSpinnerComponent } from './utils/progress-spinner/progress-spinner.component';
import { ResultDialogModalComponent } from './utils/result-dialog-modal/result-dialog-modal.component';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterPatientComponent } from './features/auth/register-patient/register-patient.component';
import { JwtInterceptor } from './core/auth/jwt.interceptor';
import { ConfirmDialogModalComponent } from './utils/confirm-dialog-modal/confirm-dialog-modal.component';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { GlobalErrorHandlerService } from './core/error/global-error-handler.service';

registerLocaleData(localeIt);

@NgModule({
  declarations: [
    AppComponent,
    ResultDialogModalComponent,
    ConfirmDialogModalComponent,
    LoginComponent,
    RegisterPatientComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
    MatPaginatorModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'it-IT' },
    { provide: ErrorHandler, useClass: GlobalErrorHandlerService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
