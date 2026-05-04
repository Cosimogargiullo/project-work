# Matrice test funzionali

Documento organizzato per area funzionale, per facilitare lettura e revisione.

## 1) Accesso e registrazione

TF-01 — Login valido
Feature: Accesso
Attore: Utente
Precondizioni: Utente registrato e attivo
Steps: Inserire credenziali corrette
Expected: Accesso alla dashboard coerente con il ruolo
Evidence: documentation/evidenze/screenshots/login/login-visualizza.PNG

TF-02 — Login non valido
Feature: Accesso
Attore: Utente
Precondizioni: Utente esistente
Steps: Inserire password errata
Expected: Messaggio di errore su credenziali non valide
Evidence: documentation/evidenze/screenshots/login/login-credenziali errate.PNG

TF-03 — Logout
Feature: Accesso
Attore: Utente autenticato
Precondizioni: Sessione attiva
Steps: Confermare uscita dal sistema
Expected: Sessione chiusa e ritorno al login
Evidence: documentation/evidenze/screenshots/login/logout.PNG

TF-04 — Form registrazione paziente
Feature: Registrazione
Attore: Utente non autenticato
Precondizioni: Nessuna
Steps: Aprire link Registrati come paziente
Expected: Form visibile con campi obbligatori
Evidence: documentation/evidenze/screenshots/registrazione-paziente/registrazione paziente-visualizzazione.PNG

TF-05 — Registrazione paziente (successo)
Feature: Registrazione
Attore: Utente non autenticato
Precondizioni: Dati univoci e validi
Steps: Compilare e inviare il form
Expected: Registrazione completata
Evidence: documentation/evidenze/screenshots/registrazione-paziente/registrazione paziente-successo.PNG

TF-06 — Registrazione paziente (CF duplicato)
Feature: Registrazione
Attore: Utente non autenticato
Precondizioni: Codice fiscale già presente
Steps: Inviare form con CF esistente
Expected: Errore: codice fiscale già esistente
Evidence: documentation/evidenze/screenshots/registrazione-paziente/registrazione paziente-cf esistente.PNG

TF-07 — Registrazione paziente (errore validazione)
Feature: Registrazione
Attore: Utente non autenticato
Precondizioni: Input non valido
Steps: Inviare form con dati incoerenti
Expected: Operazione non riuscita con errore di validazione
Evidence: documentation/evidenze/screenshots/registrazione-paziente/registrazione paziente-errore.PNG

## 2) Disponibilita

TF-08 — Vista admin/segreteria
Feature: Disponibilità
Attore: Admin/Segreteria
Precondizioni: Utente admin o segreteria autenticato
Steps: Aprire sezione Disponibilità e Appuntamenti
Expected: Mostrate entrambe le card (Disponibilità + Appuntamenti)
Evidence: documentation/evidenze/screenshots/disponibilita/disponibilità-appuntamenti-visualizza-per-admin-e-segretari.PNG

TF-09 — Vista medico
Feature: Disponibilità
Attore: Medico
Precondizioni: Utente medico autenticato
Steps: Aprire sezione Disponibilità e Appuntamenti
Expected: Vista coerente con perimetro medico
Evidence: documentation/evidenze/screenshots/disponibilita/disponibilità-appuntamenti-visualizza-per-medici.PNG

TF-10 — Vista paziente
Feature: Disponibilità
Attore: Paziente
Precondizioni: Utente paziente autenticato
Steps: Aprire sezione Disponibilità e Appuntamenti
Expected: Mostrata la sola parte Appuntamenti
Evidence: documentation/evidenze/screenshots/disponibilita/disponibilità-appuntamenti-visualizza-per-pazienti.PNG

TF-11 — Creazione disponibilità (successo)
Feature: Disponibilità
Attore: Admin/Medico
Precondizioni: Utente autorizzato autenticato
Steps: Inserire data, durata, ora inizio/fine, generare slot e salvare
Expected: Slot creati correttamente
Evidence: documentation/evidenze/screenshots/disponibilita/disponibilità-creazione successo.PNG

TF-12 — Form creazione disponibilità
Feature: Disponibilità
Attore: Admin/Medico
Precondizioni: Utente autorizzato autenticato
Steps: Aprire popup Aggiungi disponibilità
Expected: Form completo e campi obbligatori visibili
Evidence: documentation/evidenze/screenshots/disponibilita/disponibilità-creazione.PNG

TF-13 — Eliminazione disponibilità (con vincoli)
Feature: Disponibilità
Attore: Admin/Segreteria
Precondizioni: Disponibilità esistente
Steps: Eliminare e confermare
Expected: Eliminati solo slot liberi, mantenuti quelli prenotati
Evidence: documentation/evidenze/screenshots/disponibilita/disponibilità-eliminazione successo.PNG

TF-14 — Dialog eliminazione disponibilità
Feature: Disponibilità
Attore: Admin/Segreteria
Precondizioni: Disponibilità esistente
Steps: Premere elimina
Expected: Popup di conferma correttamente visualizzato
Evidence: documentation/evidenze/screenshots/disponibilita/disponibilità-eliminazione.PNG

TF-15 — Dettaglio disponibilità
Feature: Disponibilità
Attore: Utente
Precondizioni: Disponibilità esistente
Steps: Premere visualizza
Expected: Dati mostrati in sola lettura
Evidence: documentation/evidenze/screenshots/disponibilita/disponibilità-visualizza.PNG

## 3) Appuntamenti

TF-16 — Creazione appuntamento da paziente
Feature: Prenotazione
Attore: Paziente
Precondizioni: Utente registrato e autenticato
Steps: Accedi → Seleziona disponibilità → Conferma
Expected: Appuntamento creato
Evidence: documentation/evidenze/screenshots/appuntamenti/appuntamenti-creazione-per-pazienti.PNG

TF-17 — Creazione appuntamento da medico
Feature: Appuntamenti
Attore: Medico
Precondizioni: Utente medico autenticato
Steps: Selezionare paziente, data, orario e salvare
Expected: Appuntamento creato con vincoli ruolo rispettati
Evidence: documentation/evidenze/screenshots/appuntamenti/appuntamenti-creazione-per-medico.PNG

TF-18 — Creazione appuntamento da paziente (form)
Feature: Appuntamenti
Attore: Paziente
Precondizioni: Utente paziente autenticato
Steps: Compilare tipo visita, medico, data e note
Expected: Appuntamento creato nel perimetro del paziente
Evidence: documentation/evidenze/screenshots/appuntamenti/appuntamenti-creazione-per-pazienti.PNG

TF-19 — Conferma creazione appuntamento
Feature: Appuntamenti
Attore: Utente
Precondizioni: Dati validi inseriti
Steps: Salvare nuovo appuntamento
Expected: Messaggio di operazione completata
Evidence: documentation/evidenze/screenshots/appuntamenti/appuntamenti-creazione successo.PNG

TF-20 — Modifica appuntamento (successo)
Feature: Appuntamenti
Attore: Utente
Precondizioni: Appuntamento in stato PRENOTATO
Steps: Aggiornare campi e salvare
Expected: Appuntamento aggiornato
Evidence: documentation/evidenze/screenshots/appuntamenti/appuntamenti-modifica successo.PNG

TF-21 — Form modifica appuntamento
Feature: Appuntamenti
Attore: Utente
Precondizioni: Appuntamento esistente
Steps: Aprire azione modifica
Expected: Form popolato con dati correnti
Evidence: documentation/evidenze/screenshots/appuntamenti/appuntamenti-modifica.PNG

TF-22 — Eliminazione appuntamento (successo)
Feature: Appuntamenti
Attore: Utente
Precondizioni: Appuntamento eliminabile
Steps: Confermare eliminazione
Expected: Appuntamento rimosso
Evidence: documentation/evidenze/screenshots/appuntamenti/appuntamenti-eliminazione successo.PNG

TF-23 — Dialog eliminazione appuntamento
Feature: Appuntamenti
Attore: Utente
Precondizioni: Appuntamento esistente
Steps: Premere elimina
Expected: Popup di conferma visualizzato
Evidence: documentation/evidenze/screenshots/appuntamenti/appuntamenti-eliminazione.PNG

TF-24 — Dettaglio appuntamento
Feature: Appuntamenti
Attore: Utente
Precondizioni: Appuntamento esistente
Steps: Premere visualizza
Expected: Dettaglio visualizzato correttamente
Evidence: documentation/evidenze/screenshots/appuntamenti/appuntamenti-visualizza.PNG

## 4) Referti

TF-25 — Inserimento referto
Feature: Referti
Attore: Medico/Operatore autorizzato
Precondizioni: Utente autorizzato + appuntamento disponibile
Steps: Compilare form e allegare PDF
Expected: Referto creato e stato appuntamento aggiornato a EFFETTUATA
Evidence: documentation/evidenze/screenshots/referti/referti-successo.PNG

TF-26 — Form nuovo referto
Feature: Referti
Attore: Medico/Operatore autorizzato
Precondizioni: Utente autorizzato autenticato
Steps: Premere Nuovo referto
Expected: Form completo con upload PDF disponibile
Evidence: documentation/evidenze/screenshots/referti/referti-aggiungi 1.PNG

TF-27 — Modifica referto
Feature: Referti
Attore: Medico/Operatore autorizzato
Precondizioni: Referto esistente modificabile
Steps: Aprire modifica e salvare
Expected: Referto aggiornato
Evidence: documentation/evidenze/screenshots/referti/referti-modifica.PNG

TF-28 — Eliminazione referto (successo)
Feature: Referti
Attore: Medico/Operatore autorizzato
Precondizioni: Referto esistente eliminabile
Steps: Confermare eliminazione
Expected: Referto rimosso
Evidence: documentation/evidenze/screenshots/referti/referti-eliminazione successo.PNG

TF-29 — Dialog eliminazione referto
Feature: Referti
Attore: Medico/Operatore autorizzato
Precondizioni: Referto esistente
Steps: Premere elimina
Expected: Popup di conferma visualizzato
Evidence: documentation/evidenze/screenshots/referti/referti-eliminazione.PNG

TF-30 — Lista referti
Feature: Referti
Attore: Utente autenticato
Precondizioni: Utente autenticato con autorizzazioni coerenti
Steps: Aprire sezione Referti
Expected: Tabella e filtri caricati correttamente
Evidence: documentation/evidenze/screenshots/referti/referti-visualizza.PNG

## 5) Gestione utenti (solo admin)

TF-31 — Vista gestione utenti
Feature: Gestione utenti
Attore: Admin
Precondizioni: Utente admin autenticato
Steps: Aprire sezione Gestione utenti
Expected: Tabella con filtri e azioni disponibile
Evidence: documentation/evidenze/screenshots/gestione-utenti/gestione utenti-visualizza.PNG

TF-32 — Creazione utente (successo)
Feature: Gestione utenti
Attore: Admin
Precondizioni: Utente admin + dati univoci
Steps: Compilare e salvare nuovo utente
Expected: Registrazione completata
Evidence: documentation/evidenze/screenshots/gestione-utenti/gestione utenti-successo.PNG

TF-33 — Creazione utente (errore univocità)
Feature: Gestione utenti
Attore: Admin
Precondizioni: Utente admin + CF/username già presenti
Steps: Inviare form con dato duplicato
Expected: Errore di univocità restituito dal sistema
Evidence: documentation/evidenze/screenshots/gestione-utenti/gestione utenti-errore.PNG

TF-34 — Modifica utente (errore univocità)
Feature: Gestione utenti
Attore: Admin
Precondizioni: Utente admin autenticato
Steps: Modificare con dato in conflitto
Expected: Operazione non riuscita
Evidence: documentation/evidenze/screenshots/gestione-utenti/gestione utenti-modifica errore.PNG

TF-35 — Modifica utente (successo)
Feature: Gestione utenti
Attore: Admin
Precondizioni: Utente admin autenticato
Steps: Modificare dati validi e salvare
Expected: Profilo aggiornato correttamente
Evidence: documentation/evidenze/screenshots/gestione-utenti/gestione utenti-modifica successo.PNG

TF-36 — Disattivazione utente
Feature: Gestione utenti
Attore: Admin
Precondizioni: Utente admin + utente attivo
Steps: Disattivare e confermare
Expected: Utente disattivato e azioni coerenti con stato non attivo
Evidence: documentation/evidenze/screenshots/gestione-utenti/gestione utenti-disattivazione successo.PNG

TF-37 — Riattivazione utente
Feature: Gestione utenti
Attore: Admin
Precondizioni: Utente admin + utente non attivo
Steps: Riattivare e confermare
Expected: Utente riattivato correttamente
Evidence: documentation/evidenze/screenshots/gestione-utenti/gestione utenti-riattivazione successo.PNG

TF-38 — Eliminazione definitiva utente
Feature: Gestione utenti
Attore: Admin
Precondizioni: Utente admin + utente disattivato
Steps: Eliminare definitivamente e confermare
Expected: Utente e dati associati rimossi in modo irreversibile
Evidence: documentation/evidenze/screenshots/gestione-utenti/gestione utenti-eliminazione successo.PNG

## 6) Dashboard economica

TF-39 — Dashboard economica admin
Feature: Dashboard economica
Attore: Admin
Precondizioni: Utente admin autenticato
Steps: Aprire sezione Dashboard economica
Expected: KPI, grafico annuale e ranking medici visibili
Evidence: documentation/evidenze/screenshots/dashboard-economica/dashboard-economica-admin 2.PNG

TF-40 — Dashboard economica paziente
Feature: Dashboard economica
Attore: Paziente
Precondizioni: Utente paziente autenticato
Steps: Aprire sezione dashboard disponibile nel profilo
Expected: Dati mostrati nel perimetro autorizzato
Evidence: documentation/evidenze/screenshots/dashboard-economica/dashboard-economica-paziente.PNG
