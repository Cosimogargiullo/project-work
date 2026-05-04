# Global frontend error handler

## Obiettivo
Mostrare la gestione centralizzata degli errori non previsti nell'app Angular.

## Perche e interessante
Il frontend non lascia gli errori sparsi nei componenti: li convoglia in un punto unico, cosi il troubleshooting resta piu semplice e coerente.

## File sorgente
- frontend/carehub-frontend/src/app/core/error/global-error-handler.service.ts

## Estratto reale
```typescript
@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  // Il logger centralizzato rende uniforme il tracciamento degli errori
  constructor(private logger: AppLoggerService) {}

  handleError(error: unknown): void {
    // Centralizza il logging degli errori non gestiti
    // Il componente che ha generato l'errore non deve occuparsene qui
    this.logger.error('GlobalErrorHandler', error);
  }
}
```

## Commento tecnico
- gli errori non previsti vengono intercettati in un solo punto
- il logging resta uniforme per tutta l'applicazione
- i componenti non devono duplicare la gestione dei failure critici
- la soluzione e semplice ma utile per il troubleshooting