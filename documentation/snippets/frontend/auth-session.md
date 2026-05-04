# Auth session and JWT state

## Obiettivo
Mostrare come il frontend gestisce token JWT, ruoli e stato di autenticazione in modo centralizzato.

## Perche e interessante
Questo servizio non si limita a salvare il token: ricava anche ruoli e userId, cosi il frontend puo prendere decisioni coerenti su routing e visibilita delle azioni.

## File sorgente
- frontend/carehub-frontend/src/app/core/auth/auth.service.ts

## Estratto reale
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Chiavi locali per token e ruoli nella sessionStorage
  private readonly tokenKey = 'carehub_token';
  private readonly rolesKey = 'carehub_roles';
  // Stato reattivo dell'autenticazione condiviso con la UI
  private _isAuthenticated$ = new BehaviorSubject<boolean>(this.isTokenValid());
  isAuthenticated$ = this._isAuthenticated$.asObservable();

  constructor(private http: HttpClient) {}

  // Helper sincrono per template e componenti
  isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  login(username: string, password: string) {
    // Esegue la login e aggiorna in un unico punto token, ruoli e stato
    return this.http.post<LoginResponse>(API_AUTH.LOGIN, { username, password }).pipe(
      map(res => {
        // Salva il token e ne estrae i ruoli lato client
        sessionStorage.setItem(this.tokenKey, res.accessToken);
        // I ruoli servono per route guard e visibilita dei pannelli
        const roles = this.extractRoles(res.accessToken);
        sessionStorage.setItem(this.rolesKey, JSON.stringify(roles));
        // L'interfaccia puo aggiornarsi subito dopo il login
        this._isAuthenticated$.next(true);
        return true;
      })
    );
  }

  logout() {
    // Svuota completamente la sessionStorage alla disconnessione
    sessionStorage.clear();
    // Notifica alla UI che la sessione non e piu attiva
    this._isAuthenticated$.next(false);
  }

  getToken(): string | null {
    // Recupera il token usato dall'interceptor HTTP
    return sessionStorage.getItem(this.tokenKey);
  }

  getRoles(): string[] {
    // Converte il JSON salvato in sessione nel formato usato dall'app
    const str = sessionStorage.getItem(this.rolesKey);
    return str ? JSON.parse(str) : [];
  }

  hasRole(required: string | string[]): boolean {
    // Confronta i ruoli del token con uno o piu ruoli richiesti
    const roles = this.getRoles();
    const req = Array.isArray(required) ? required : [required];
    return req.some(r => roles.includes(r));
  }

  getUsername(): string | null {
    // Ricava username/sub dal payload JWT gia presente in sessione
    const payload = this.decodePayload();
    const sub = payload?.['sub'];
    const username = payload?.['username'];
    if (typeof sub === 'string') {
      return sub;
    }
    if (typeof username === 'string') {
      return username;
    }
    return null;
  }

  getUserId(): number | null {
    // Alcuni flussi frontend usano l'id utente per filtri o ownership
    const payload = this.decodePayload();
    const userId = payload?.['userId'];
    const id = payload?.['id'];
    const value = typeof userId === 'number' ? userId : typeof id === 'number' ? id : null;
    return value;
  }

  private extractRoles(token: string): string[] {
    try {
      // Decodifica il payload JWT senza dipendenze esterne
      const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
      const roles = payload['roles'];
      return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === 'string') : [];
    } catch {
      return [];
    }
  }

  private isTokenValid(): boolean {
    // Usa la scadenza del token per ripristinare correttamente la sessione all'avvio
    const payload = this.decodePayload();
    const exp = payload?.['exp'];
    if (typeof exp !== 'number') {
      return false;
    }

    // exp e in secondi, Date.now() e in millisecondi
    const expirationTime = exp * 1000;
    return Date.now() < expirationTime;
  }

  private decodePayload(): JwtPayload | null {
    // Centralizza il parsing del JWT per evitare duplicazione
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch {
      return null;
    }
  }
}
```

## Commento tecnico
- il servizio centralizza token, ruoli e userId
- `BehaviorSubject` mantiene reattivo lo stato di autenticazione
- la login non aggiorna solo la sessione, ma anche le informazioni utili alla UI
- il logout pulisce tutto per evitare stati incoerenti