Guida rapida: deploy su Render (frontend statico, backend Docker, Postgres managed)

Prerequisiti
- Repo su GitHub (o Git provider supportato da Render)
- Account su https://render.com

Flusso raccomandato (minimo sforzo):
1) Push del repository su GitHub
   - Assicurati che tutto il codice sia committato e pushato.

2) Connetti il repository a Render
   - In Render, scegli "New +" → "Web Service" e seleziona il repository.
   - Oppure usa la funzione "Deploy from render.yaml" (Render legge `render.yaml` alla radice).

3) Cosa fa `render.yaml` (già presente)
   - Crea un servizio web Docker per il backend usando `backend/.../Dockerfile`.
   - Crea un sito statico per il frontend, esegue il build e pubblica `dist/carehub-frontend`.
   - Crea un managed Postgres (nome `carehub-db`).

4) Variabili d'ambiente da impostare (sul servizio backend)
   - `SPRING_DATASOURCE_URL` (es: `jdbc:postgresql://<host>:<port>/<db>`)
   - `SPRING_DATASOURCE_USERNAME`
   - `SPRING_DATASOURCE_PASSWORD`
   Nota: Render crea il database gestito; copia la connection string dal pannello Databases e imposta le env vars sopra nel Web Service del backend.

5) Variabile d'ambiente per il frontend (opzionale ma consigliata)
   - `API_BASE_URL` = l'URL pubblico del backend (es: `https://carehub-backend.onrender.com`)
   - Se impostata, la pipeline di build del frontend genera `src/assets/env.js` con `window.__env.API_BASE_URL` e il frontend userà questo valore.

6) Build e deploy automatici
   - Dopo aver collegato il repo, ogni push su `main` (o branch configurato) innescherà il build su Render.

Comandi utili locali (test)
```bash
# Build jar backend
cd backend/carehub-parent/carehub-application
./mvnw -DskipTests package

# Build frontend
cd frontend/carehub-frontend
npm ci
# (opzionale: generate env.js locally)
echo "window.__env = { API_BASE_URL: 'http://localhost:8080' };" > src/assets/env.js
npm run build -- --configuration production
```

Note importanti
- Controlla i logs su Render se qualcosa fallisce.
- CORS: ho aggiunto una configurazione permissiva (`CorsConfig`) per semplificare i test; in produzione restringi `allowedOrigins` al dominio del frontend.
- I limiti del piano free: sleep dei servizi, limiti di CPU/connessioni, storage ridotto.

Se vuoi, procedo a:
- A) Creare il repository GitHub dal workspace e pusharlo (ho bisogno di conferma e credenziali dal tuo lato).
- B) Guidarti passo-passo su Render e impostare le env vars (ti fornisco i comandi esatti).
- C) Automatizzare una GitHub Action che esegue deploy via Render API (richiede Render API key).

Dimmi quale preferisci e procedo.