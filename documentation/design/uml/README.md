# Diagramma UML (Class Diagram)

Questa cartella contiene il diagramma UML del sistema **CareHub**, utilizzato per rappresentare la struttura dell’applicazione backend e le relazioni tra i principali componenti software.

In particolare, il diagramma rappresenta un **Class Diagram**, che descrive le classi principali e le dipendenze tra i vari layer dell’applicazione.

## Struttura

### src
Contiene il file sorgente modificabile del diagramma (formato Mermaid `.mmd`).

### export
Contiene le versioni esportate del diagramma:

- `carehub-uml.png`: immagine raster per consultazione rapida  
- `carehub-uml.svg`: formato vettoriale ad alta qualità per la documentazione  

## Architettura rappresentata

Il diagramma riflette un’architettura a livelli (layered architecture), tipica delle applicazioni sviluppate con Spring Boot:

- **Controller Layer**: gestisce le richieste HTTP e l’interazione con il client  
- **Service Layer**: contiene la logica di business  
- **Repository Layer**: gestisce l’accesso ai dati tramite JPA  

## Componenti principali

### Controller
- `AuthController`
- `UserController`
- `AppointmentController`
- `AvailabilityController`
- `MedicalReportController`

Gestiscono gli endpoint REST esposti dall’applicazione.

### Service
- `AuthUserService`
- `UserService`
- `AppointmentService`
- `AvailabilityService`
- `MedicalReportService`

Implementano la logica applicativa e coordinano le operazioni tra controller e repository.

### Repository
- `UserRepository`
- `AppointmentRepository`
- `AvailabilityRepository`
- `MedicalReportRepository`

Gestiscono la persistenza dei dati tramite database relazionale (PostgreSQL).

## Relazioni

- I controller dipendono dai rispettivi service  
- I service utilizzano i repository per l’accesso ai dati  

Questa separazione consente una migliore manutenibilità, testabilità e scalabilità del sistema.

## Note progettuali

L’architettura segue il principio di separazione delle responsabilità (Separation of Concerns), garantendo una chiara distinzione tra logica di presentazione, logica di business e accesso ai dati.

Il modello rappresentato è coerente con l’implementazione reale sviluppata in Java con framework Spring Boot.