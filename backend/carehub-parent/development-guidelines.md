# Development Guidelines for CareHub Modules

To ensure uniformity and maintainability across all modules in the CareHub backend, follow these updated guidelines:

## Modular Monolith Architecture
- The backend follows a **modular monolith architecture**.
- Each module is self-contained and responsible for a specific domain (e.g., `users`, `appointments`, `patients`).
- Modules should not overlap in responsibilities and must communicate through well-defined APIs.

### Relazioni tra moduli
- Le relazioni tra moduli devono essere gestite tramite identificatori (ad esempio, `Long`, `UUID`) e non tramite entità direttamente.
- Ad esempio, invece di utilizzare `@ManyToOne` con un riferimento diretto a un'entità di un altro modulo, utilizzare un campo identificatore come `doctorId` o `createdById`.
- Questo approccio garantisce l'indipendenza tra i moduli e riduce il rischio di dipendenze circolari.

### DTO condivisi
- I DTO utilizzati da più moduli devono essere posizionati nel modulo `carehub-common`.
- Ad esempio, `CreateAvailabilityRequest` è stato posizionato in `carehub-common` per essere riutilizzato tra i moduli senza creare dipendenze circolari.

## Packaging Structure
Each module must adhere to the following structure:

- **api**: Contains the single controller for handling HTTP requests.
  - Naming: `<Domain>Controller` (e.g., `UserController`, `AppointmentController`).
- **application**: Contains the single service for business logic.
  - Naming: `<Domain>Service` (e.g., `UserService`, `AppointmentService`).
- **domain**: Contains domain models and repositories.
  - Sub-packages:
    - **model**: JPA entities (e.g., `User`, `Appointment`).
    - **repository**: Interfaces for database operations (e.g., `UserRepository`, `AppointmentRepository`).
- **common**: Shared DTOs and utilities (if applicable).

## Layered Architecture
1. **Controller Layer**:
   - Handle HTTP requests and responses.
   - Delegate business logic to the service layer.
   - Use `@RestController` and `@RequestMapping` annotations.
   - Example: `@PostMapping("/create")` in `UserController`.

2. **Service Layer**:
   - Implement business logic.
   - Interact with repositories for data access.
   - Use `@Service` and `@Transactional` annotations.
   - Example: `UserService` for user-related operations.

3. **Domain Layer**:
   - Define JPA entities with annotations like `@Entity` and `@Table`.
   - Use repositories for database operations.
   - Example: `User` entity and `UserRepository`.

## Validation
- Use `@Valid` and `@NotBlank` annotations in DTOs to ensure data integrity.
- Example: `RegisterUserRequest` with validation annotations.

## Error Handling
- Implement a global exception handler using `@ControllerAdvice`.
- Return meaningful error messages with appropriate HTTP status codes.

### SimpleResult per le operazioni di scrittura
- Per tutte le operazioni che scrivono/modificano/eliminano dati (POST/PUT/DELETE/PATCH), i servizi esposti via API devono restituire sempre un oggetto `SimpleResult` nel body della risposta.
- Uso di `SimpleResult`:
  - Successo applicativo: `result.success("Messaggio di successo")` e `ResponseEntity.ok(result)`.
  - Errore di business/validazione gestito (es. campi obbligatori mancanti, data nel passato, violazione di regole di dominio): `result.failure("Messaggio di errore leggibile dall'utente")` e **comunque** `ResponseEntity.ok(result)` con `result = RES_KO`.
    - In questo modo il frontend riceve sempre HTTP 200 per gli errori gestiti e può mostrare una dialog di esito leggendo `result`, senza trattarli come errori tecnici.
  - Errore interno/non gestito (eccezioni impreviste, problemi di I/O, ecc.): `ResponseEntity.internalServerError().body(result.failure("Messaggio di errore generico"))`.
- Il pattern di riferimento per l'uso di `SimpleResult` è `AuthUserServiceImpl.register(...)` (per la costruzione dell'oggetto) e i servizi del modulo `carehub-availability` (per la distinzione tra errori di business gestiti con HTTP 200 e errori tecnici con HTTP 500).
- Nuovi servizi (es. creazione disponibilità, aggiornamento appuntamenti, cancellazioni) devono seguire questo approccio per permettere al frontend di mostrare sempre una dialog di esito coerente, basandosi su `result.result` (`OK`/`KO`) e sui messaggi associati.

## Documentation
- Use Swagger/OpenAPI annotations to document APIs.
- Ensure all endpoints are described in the Swagger UI.

## Testing
- Write unit tests for services and repositories.
- Write integration tests for controllers.
- Use mock objects for dependencies.

## Configuration
- Store sensitive configurations (e.g., database credentials) in environment variables.
- Use `application.yml` for module-specific configurations.

## Code Style
- Follow standard Java coding conventions.
- Use meaningful variable and method names.
- Write Javadoc comments for public methods.

## Additional Notes
- Each module must have only one controller, one service, and one repository interface per domain.
- Ensure consistency in naming conventions across modules.
- Reuse common utilities and DTOs to avoid duplication.
- Regularly review and refactor code to improve quality.

By adhering to these guidelines, we can maintain a clean and consistent codebase across all modules in the CareHub backend.