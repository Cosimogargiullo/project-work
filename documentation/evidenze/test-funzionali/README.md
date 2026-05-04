# Test funzionali

La presente cartella contiene la documentazione dei test funzionali end-to-end del sistema CareHub.

L'obiettivo e fornire una tracciabilita completa tra scenario testato, precondizioni, azioni eseguite, risultato atteso ed evidenza visuale prodotta durante la validazione manuale.

## Contenuto della cartella

Sono inclusi i seguenti file:

* README.md: guida operativa alla sezione test funzionali
* test-case-matrix.md: matrice strutturata dei casi di test con riferimenti alle evidenze screenshot

La matrice rappresenta il riferimento ufficiale per la verifica dei flussi applicativi principali e dei relativi casi negativi.

## Struttura della matrice test

Ogni riga della matrice contiene:

* ID del test (esempio TF-01)
* scenario validato
* precondizioni
* passi operativi
* risultato atteso
* percorso dello screenshot di evidenza

Questa struttura consente una lettura rapida in sede di revisione e una verifica ripetibile del comportamento del sistema.

## Ambito di copertura funzionale

La suite copre in modo esteso:

* autenticazione, login e logout
* registrazione paziente con validazioni
* gestione disponibilita per ruolo
* gestione appuntamenti per ruolo (creazione, modifica, eliminazione, visualizzazione)
* gestione referti e aggiornamento stato appuntamento
* gestione utenti in area admin (creazione, modifica, disattivazione, riattivazione, eliminazione definitiva)
* dashboard economica e consultazione KPI

## Procedura consigliata di aggiornamento

Per ogni modifica funzionale rilevante:

1. aggiornare o aggiungere il caso nella matrice test-case-matrix.md;
2. produrre lo screenshot della prova eseguita;
3. salvare lo screenshot nella cartella corretta sotto documentation/evidenze/screenshots;
4. inserire nella matrice il percorso puntuale dell'evidenza;
5. verificare coerenza tra risultato atteso e comportamento osservato.

## Note operative

* Utilizzare dati demo, evitando dati personali reali.
* Mantenere coerenza dei nomi file e dei percorsi riportati nella matrice.
* In caso di evoluzione dei flussi, aggiornare prima la matrice e poi le evidenze grafiche, in modo da mantenere allineata la documentazione di consegna.
