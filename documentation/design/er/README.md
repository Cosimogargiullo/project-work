# Diagramma Entity-Relationship (ER)

Questa cartella contiene il diagramma Entity-Relationship (ER) del sistema **CareHub**, utilizzato per modellare la struttura logica del database relazionale.

Il diagramma rappresenta le principali entità del dominio applicativo e le relazioni tra di esse, costituendo la base per la progettazione dello schema del database PostgreSQL.

## Struttura

### src
Contiene i file sorgente modificabili del diagramma (es. formato Mermaid `.mmd` o altri tool di modellazione).

### export
Contiene le versioni esportate del diagramma, utilizzate nella documentazione:

- `carehub-er.png`: immagine raster per consultazione rapida  
- `carehub-er.svg`: formato vettoriale ad alta qualità, adatto alla documentazione finale  

## Descrizione del modello

Il modello ER include le seguenti entità principali:

- **USERS**: rappresenta gli utenti del sistema (amministratori, medici, segreteria, pazienti)
- **USER_ROLES**: gestisce i ruoli associati agli utenti
- **AVAILABLE_DATES**: rappresenta le disponibilità dei medici
- **APPOINTMENT**: rappresenta le prenotazioni effettuate dai pazienti
- **MEDICAL_REPORT**: rappresenta i referti medici generati a seguito delle visite

## Relazioni principali

- Un utente può avere uno o più ruoli  
- Un medico può definire più disponibilità  
- Un paziente può prenotare più appuntamenti  
- Un medico può essere associato a più appuntamenti  
- Una disponibilità può essere associata a un appuntamento  
- Un appuntamento può generare un referto medico  

## Note progettuali

Il modello è stato progettato seguendo i principi della normalizzazione dei dati, al fine di ridurre la ridondanza e garantire l’integrità referenziale.

Le relazioni riflettono direttamente la logica implementata nel backend (Spring Boot) e sono coerenti con le entità JPA utilizzate nell’applicazione.