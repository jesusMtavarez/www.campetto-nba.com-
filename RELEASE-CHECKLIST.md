# Campetto: controllo prima della pubblicazione

Il pacchetto locale non equivale a una pubblicazione verificata. Non contiene
un servizio per aggiornare le carte o notifiche push a pagina chiusa. Gli account
sono collegati al progetto Supabase, separatamente dal pacchetto statico.

## Preparare i file

Eseguire dalla cartella del progetto:

```powershell
powershell -NoProfile -File .\build-release.ps1
```

Se il computer consente soltanto file PowerShell firmati, dalla console
PowerShell nella cartella del progetto si puo eseguire il contenuto locale
senza cambiare le impostazioni del sistema:

```powershell
& ([ScriptBlock]::Create((Get-Content -LiteralPath .\build-release.ps1 -Raw)))
```

Il comando verifica sintassi JavaScript, riferimenti HTML, JSON e immagini.
Copia il solo sito in `dist/campetto`, senza pubblicarlo. Esclude script di
manutenzione, appunti, screenshot, documentazione e schema SQL. Se nella
destinazione esistono file estranei si ferma: controllarli manualmente.
`release-manifest.json` registra data, file e impronte SHA-256; non contiene
le chiavi della configurazione.

Distribuire soltanto il contenuto di `dist/campetto`. Il sito richiede un
hosting statico HTTPS. Non usare il server locale di sviluppo come hosting
pubblico. Dopo ogni modifica ricreare il pacchetto.

## Account: configurati, verifiche da mantenere

Con URL o chiave pubblica Supabase vuoti, lo script segnala
**ACCOUNT NON CONFIGURATI**. Account, recupero password e salvataggio nel
cloud restano disattivati. Preferiti e quintetto locali possono funzionare
nel singolo browser; questo non dimostra la sincronizzazione cloud.

Configurazione già completata: progetto, chiave pubblica, schema con RLS, URL di ritorno e SMTP. Registrazione confermata e avviso al proprietario verificati con una vera iscrizione l’8 novembre 2026. I test SQL di isolamento del database e della coda privata sono passati in transazioni annullate. Per ogni modifica futura ai flussi:

- Creare il progetto Supabase, impostare URL e chiave pubblica nel file
  `supabase-config.js` ed eseguire `supabase-schema.sql` nel progetto reale.
  Non distribuire chiavi private o `service_role`.
- Configurare il dominio HTTPS definitivo e gli indirizzi di ritorno
  dell'autenticazione nel progetto Supabase.
- Provare sul dominio definitivo creazione account, eventuale conferma
  email, accesso, uscita e ripristino della sessione dopo ricaricamento.
- Provare il link ricevuto via email per recuperare la password e il
  successivo accesso con la nuova password.
- Con due account distinti verificare che preferiti, quintetto e preferenze
  si sincronizzino su un secondo browser senza passare da un utente all'altro.

La presenza delle chiavi non prova nessuna di queste operazioni. Il pacchetto
non invia email e non verifica un account reale in automatico.

## Dati e funzioni da descrivere correttamente

- **Carte:** elenco, prezzi, date e foto sono una selezione salvata nel
  progetto. Non si aggiornano automaticamente. Per aggiornarli occorre
  modificare i dati e pubblicare nuovamente il pacchetto; un collegamento
  a una fonte che si aggiorna non aggiorna Campetto. Le foto di riferimento
  possono raffigurare una variante o graduazione diversa, come indicato
  nelle schede.
- **NBA:** rose, statistiche, classifiche, partite e notizie dipendono dai
  feed ESPN raggiungibili dal browser. I controlli sono periodici, non
  aggiornamenti garantiti azione per azione. Provare le chiamate anche
  dal dominio pubblico e verificare gli stati di caricamento o indisponibilita.
- **Notizie in italiano:** la traduzione dei contenuti nuovi dipende anche
  dal servizio esterno e dai suoi limiti. Verificare che un errore non sia
  presentato come una notizia tradotta o aggiornata.
- **Il mio Campetto:** budget e proiezioni servono al gioco locale;
  non sono una lega con risultati e premi di giornata.
- **Notifiche:** gli avvisi browser richiedono permesso e sito aperto.
  Le notifiche a pagina chiusa non sono configurate.

## Ultimo controllo sul dominio pubblico

- Aprire tutte le sezioni su computer e telefono. Controllare ricerca,
  scelta di un risultato, chiusura dei pannelli e uso da tastiera.
- Aprire una squadra, un giocatore e una partita terminata; controllare
  loghi, foto, numeri, fonte e data, senza interpretare dati mancanti come zero.
- Controllare entrambe le schede delle carte e l'apertura delle foto.
- Creare un quintetto entro il budget, ricaricare e verificare il salvataggio.
- Seguire e rimuovere un giocatore; controllare la pagina personale.
- Provare i flussi account reali sopra indicati e una connessione interrotta.

Segnare come completati soltanto i controlli eseguiti realmente. I test locali della pagina profilo verificano salvataggio locale, richieste dei metadati cloud simulate, isolamento, errori e sessioni scadute. Non sostituiscono una prova di modifica del profilo reale su due dispositivi. In questa revisione la verifica visiva via browser è stata interrotta dal controllo di sicurezza dello strumento, che non riusciva a determinare l’URL corrente; non è stata aggirata.
