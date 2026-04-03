import { Component, OnInit, HostListener } from '@angular/core';
import { AnalyticsService } from '@app/services/analytics.service';
import { AnalyticsOverview, MonthlyRevenue, DoctorRevenue } from '@app/core/models/analytics.models';
import { UserService } from '@app/services/user.service';
import { User } from '@app/models/user.model';
import { AuthService } from '@app/core/auth/auth.service';
import { USER_ROLES } from '@app/core/constants/user-roles';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';
import { ChartOptions, ChartData } from 'chart.js';
import { ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly mobileBreakpoint = 768;
  isMobileView = false;
  private roles: string[] = [];
  private userId: number | null = null;
  private isPatientRole = false;
  private isDoctorRole = false;
  private isAdminOrSegreteria = false;

  overview: AnalyticsOverview | null = null;
  monthly: MonthlyRevenue[] = [];
  topDoctors: DoctorRevenue[] = [];
  doctorNames: { [id: number]: string } = {};
  // chart state
  @ViewChild('monthlyChart') monthlyChart!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | null = null;
  private chartOptions: ChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: { x: { ticks: { maxRotation: 0, minRotation: 0 } }, y: { beginAtZero: true } }
  };
  private monthLabelsIt = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  currency = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

  constructor(
    private analytics: AnalyticsService,
    private userService: UserService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.updateViewportMode();
    this.initializeUserContext();

    this.loadOverview();
    this.loadMonthly();
    if (this.showTopDoctors) {
      this.loadTopDoctors();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportMode();
  }

  private updateViewportMode(): void {
    this.isMobileView = window.innerWidth < this.mobileBreakpoint;
  }

  private initializeUserContext(): void {
    this.roles = this.authService.getRoles() || [];
    this.userId = this.authService.getUserId();
    this.isPatientRole = this.roles.includes(USER_ROLES.PAZIENTE);
    this.isDoctorRole = this.roles.includes(USER_ROLES.MEDICO);
    this.isAdminOrSegreteria = this.roles.includes(USER_ROLES.ADMIN) || this.roles.includes(USER_ROLES.SEGRETERIA);
  }

  get showTopDoctors(): boolean {
    return this.isAdminOrSegreteria;
  }

  get totalAmountLabel(): string {
    return this.isPatientRole ? 'Spese totali' : 'Ricavi totali';
  }

  get chartDatasetLabel(): string {
    return this.isPatientRole ? 'Spese' : 'Ricavi';
  }

  loadOverview(): void {
    this.getOverviewRequest().subscribe({
      next: (v) => this.overview = v,
      error: () => this.overview = null
    });
  }

  loadMonthly(): void {
    this.getMonthlyRequest().subscribe({
      next: (v) => {
        this.monthly = v || [];
        // set form control to selectedMonth if present and available in the options
        // no-op: monthly chart updated below
        // update monthly chart if initialized
        if (this.monthly && this.monthly.length > 0) {
          const year = new Date().getFullYear();
          const { labels, data } = this.generateMonthlySeriesForYear(year);
          this.updateChart(labels, data);
        }
      },
      error: () => this.monthly = []
    });
  }

  private generateMonthlySeriesForYear(year: number): { labels: string[]; data: number[] } {
    const labels = this.monthLabelsIt.slice();
    const data: number[] = [];
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      const found = this.monthly.find(it => it.month && it.month.startsWith(key));
      data.push(found ? Number(found.totalRevenue || 0) : 0);
    }
    return { labels, data };
  }

  private getOverviewRequest() {
    if (this.isPatientRole && this.userId != null) {
      return this.analytics.getOverviewByPatient(this.userId);
    }
    if (this.isDoctorRole && this.userId != null) {
      return this.analytics.getOverviewByDoctor(this.userId);
    }
    return this.analytics.getOverviewAll();
  }

  private getMonthlyRequest() {
    if (this.isPatientRole && this.userId != null) {
      return this.analytics.getMonthlyByPatient(this.userId);
    }
    if (this.isDoctorRole && this.userId != null) {
      return this.analytics.getMonthlyByDoctor(this.userId);
    }
    return this.analytics.getMonthlyAll();
  }

  loadTopDoctors(): void {
    if (!this.showTopDoctors) {
      this.topDoctors = [];
      this.doctorNames = {};
      return;
    }
    this.analytics.getByDoctor(undefined, undefined, 5).subscribe({
      next: (v) => {
        this.topDoctors = v || [];
        this.resolveDoctorNames();
      },
      error: () => {
        this.topDoctors = [];
        this.doctorNames = {};
      }
    });
  }



  ngAfterViewInit(): void {
    // create empty chart instance
    if (this.monthlyChart && this.monthlyChart.nativeElement) {
      const ctx = this.monthlyChart.nativeElement.getContext('2d');
      if (ctx) {
        const primary = this.getPrimaryColor();
        this.chartInstance = new Chart(ctx, {
          type: 'bar',
          data: { labels: [], datasets: [{ label: this.chartDatasetLabel, data: [], backgroundColor: primary }] } as ChartData,
          options: this.chartOptions
        });
        // if monthly data already loaded, populate chart with months Jan-Dec for current year
        if (this.monthly && this.monthly.length > 0) {
          const year = new Date().getFullYear();
          const { labels, data } = this.generateMonthlySeriesForYear(year);
          this.updateChart(labels, data);
        }
      }
    }
  }

  private updateChart(labels: string[], data: number[]): void {
    if (!this.chartInstance) return;
    this.chartInstance.data.labels = labels;
    // @ts-ignore
    this.chartInstance.data.datasets[0].data = data;
    // @ts-ignore
    this.chartInstance.data.datasets[0].label = this.chartDatasetLabel;
    const primary = this.getPrimaryColor();
    // @ts-ignore
    this.chartInstance.data.datasets[0].backgroundColor = primary;
    this.chartInstance.update();
  }

  private getPrimaryColor(): string {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--primary');
      if (v) return v.trim();
    } catch (e) {
      // ignore
    }
    return '#24a3a8';
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  private resolveDoctorNames(): void {
    const ids = Array.from(new Set(this.topDoctors.map(d => d.doctorId).filter(id => id != null))) as number[];
    if (ids.length === 0) return;
    const reqs = ids.map(id => this.userService.getUserById(id).pipe(catchError(() => of(null as User | null))));
    forkJoin(reqs).subscribe((users: (User | null)[]) => {
      users.forEach((u, idx) => {
        const id = ids[idx];
        if (u && u.firstName) {
          this.doctorNames[id] = `${u.firstName} ${u.lastName}`;
        } else {
          this.doctorNames[id] = String(id);
        }
      });
    });
  }

  // helpers for chart
  getMaxMonthlyRevenue(): number {
    return this.monthly.reduce((m, it) => Math.max(m, it.totalRevenue || 0), 0);
  }

  formatCurrency(value?: number): string {
    if (value == null) return '€0,00';
    return this.currency.format(value);
  }
}
