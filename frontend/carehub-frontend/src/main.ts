import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from '@app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    const payload = {
      context: 'Bootstrap',
      timestamp: new Date().toISOString(),
      error: err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : String(err)
    };
    sessionStorage.setItem('carehub_last_frontend_error', JSON.stringify(payload));
  });
