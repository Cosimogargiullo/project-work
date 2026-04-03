# Documentazione OpenAPI

La presente cartella contiene l’export della documentazione delle API REST del sistema **CareHub**, generata automaticamente tramite specifica OpenAPI 3.1.

OpenAPI rappresenta uno standard ampiamente utilizzato per descrivere, documentare e testare servizi RESTful, consentendo una chiara definizione degli endpoint, dei modelli dati e delle modalità di interazione client-server.

## Contenuto della cartella

Sono inclusi i seguenti file:

* `carehub-openapi.json`: specifica completa in formato JSON
* `carehub-openapi.yaml`: specifica completa in formato YAML

Entrambi i file rappresentano una fotografia aggiornata delle API esposte dal backend.

## Accesso alla documentazione interattiva

Durante l’esecuzione del backend, è possibile consultare la documentazione interattiva tramite interfaccia Swagger UI al seguente endpoint:

```
http://localhost:8080/swagger-ui/index.html
```

Questa interfaccia consente di esplorare gli endpoint, visualizzare i modelli e testare direttamente le API.

## Generazione della documentazione

L’export dei file OpenAPI può essere effettuato tramite i seguenti comandi:

```bash
# ambiente locale (backend avviato)
curl -fsSL 'http://localhost:8080/v3/api-docs' -o api/openapi/carehub-openapi.json

# export in formato YAML
curl -fsSL 'http://localhost:8080/v3/api-docs.yaml' -o api/openapi/carehub-openapi.yaml

# ambiente deployato (Render)
curl -fsSL 'https://carehub-backend.onrender.com/v3/api-docs' -o api/openapi/carehub-openapi.json
```

## Note operative

* In ambiente cloud (Render), il servizio potrebbe entrare in stato di sospensione. In caso di risposta `503 Service Unavailable`, è sufficiente attendere alcuni secondi per il riavvio automatico e ripetere la richiesta.
* La documentazione viene generata dinamicamente dal backend e riflette in modo coerente lo stato attuale delle API.
* Si consiglia di rigenerare i file OpenAPI dopo ogni modifica rilevante agli endpoint o ai modelli dati.
