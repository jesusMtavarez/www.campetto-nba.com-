# Campetto

Interfaccia web NBA in italiano, costruita in HTML, CSS e JavaScript senza dipendenze di progetto.

## Avvio

Apri `index.html` in un browser per l'interfaccia. Per i feed esterni e il ritorno dei link di accesso, avvia un server locale nella cartella (per esempio `python -m http.server 8000`) e visita `http://localhost:8000`.

## Funzioni incluse

- Lingua dell'interfaccia selezionabile in italiano, inglese, spagnolo e francese; tema chiaro/scuro. Le scelte rimangono in questo browser. Il catalogo dei testi funziona senza servizi di traduzione esterni.
- Pagina personale dedicata (`#account`) con nome, email, squadra preferita, preferiti e quintetto. Gli ospiti conservano nome e squadra nel browser; gli utenti connessi li salvano nei metadati privati del proprio account Supabase. Le password sono gestite soltanto da Supabase.
- Dettaglio dei fantapunti apribile cliccando un giocatore del quintetto: ultime partite di stagione regolare, grafico e differenza rispetto alla partita precedente, con bonus capitano esplicito. I dati mancanti non generano aumenti o cali inventati.
- Corsa MVP sopra Rookie watch: cinque candidati ricalcolati dalle statistiche stagionali verificate, risultati di squadra e presenze. Il leader dell'indice Campetto vale 100%; le altre percentuali sono rapporti di punteggio, non probabilità di vittoria.

- Panoramica con carosello dei risultati della notte, miglior realizzatore della squadra vincente, foto, punti/rimbalzi/assist della singola partita e collegamenti ai tabellini.
- Calendario navigabile per data, con risultati passati, Ieri/Oggi/Domani e prossimi incontri in orario italiano. Due giornate ESPN vengono combinate e filtrate in Europe/Rome per comprendere le partite della notte.
- Schede partita apribili dai risultati: punteggio per quarto, record delle squadre, statistiche di squadra e tabellino dei giocatori.
- Pagina News con le cinque notizie più recenti in uno slider automatico ogni 6 secondi, frecce, indicatori, pausa e swipe; headlines e approfondimenti collegati alle fonti ESPN.
- Classifiche NBA per conference, generale e division: 30 loghi, ricerca, record casa/trasferta, ultime 10, serie, distacco, punti segnati e subiti.
- NBA Cup 2026: sei gironi e wild card, calcolati dai risultati ESPN delle serate del calendario ufficiale. Link alla classifica NBA per gli spareggi completi.
- Profili con ritratto più leggibile, statistiche stagionali, confronto, biografia, social e highlights.
- Rosa corrente caricata dalle rose ESPN di tutte le 30 squadre NBA e conservata nel browser per 12 ore.
- Ricerca per nome e filtri per lettera iniziale e nazionalità nel catalogo giocatori e nella scelta del quintetto.
- Classifiche per categoria statistica, con ricerca dei giocatori e collegamenti alle pagine squadra.
- Pagine per tutte le 30 squadre con rosa, città, classifica, leader statistici e titoli NBA.
- Sezione Carte NBA: ricerche più frequenti e vendite comparabili recenti, con collegamenti agli annunci.
- Pagina Giocatori seguiti con elenco personale, statistiche, notizie collegate in italiano e partite delle loro squadre. Il marchio Campetto riporta sempre alla Panoramica.
- Il mio Campetto: draft su campo interattivo, budget virtuale da 100 milioni, mercato con ricerca, filtri per ruolo e disponibilità economica, acquisti, vendite e capitano con bonus 1,5×.
- Centro notifiche per l’inizio e il risultato finale delle partite delle squadre dei giocatori seguiti; notifiche browser facoltative.
- Aggiornamento periodico di classifica, partite, news e medie stagionali dal feed ESPN quando raggiungibile.
- Modulo per creare un account, accedere, recuperare e modificare la password con Supabase; preferiti, quintetto e preferenze notifiche sincronizzati nel database personale.

## Dati

Il dettaglio fantasy usa il game log ESPN della stagione richiesta, esclude la preseason e ha cache di cinque minuti. Gli acquisti attendono tutti i sei dati necessari al calcolo del punteggio. Le statistiche individuali di riserva vengono accettate solo quando il game log conferma la stagione: il riepilogo generico può restituire la stagione precedente e viene quindi evitato. L'indice MVP richiede almeno tre presenze e almeno metà delle presenze del giocatore più attivo, usando soltanto dati associati alla stagione corrente.

Le notizie in inglese usano il testo originale. Italiano, spagnolo e francese usano cache separate e due servizi di traduzione; in caso di limiti o indisponibilità è mostrato un avviso nella lingua scelta con link all'articolo originale. Nome utente, email e password non vengono inviati al servizio di traduzione. Gli articoli esterni restano nella lingua del sito di origine.

Il fantabasket mostra proiezioni dalle medie stagionali: punti + 1,2 × rimbalzi + 1,5 × assist + 3 × recuperi + 3 × stoppate − palle perse. Le quotazioni sono prezzi di gioco da 4 a 38 milioni, fissati all'acquisto e restituiti alla vendita. Formazione, prezzi d'acquisto e capitano restano salvati nel browser e vengono sincronizzati nel profilo quando Supabase è configurato. Non sono classifiche di una lega con risultati di giornata. Gli acquisti attendono il caricamento delle statistiche.

Le rose e le medie stagionali dei giocatori attivi arrivano dai feed ESPN non ufficiali e possono cambiare formato o non essere disponibili. Campetto rilegge le rose ogni 12 ore, le statistiche ogni 10 minuti e il tabellone ogni 5 minuti, quando i feed sono raggiungibili. La stagione 2026/27 usa il parametro ESPN season=2027. La richiesta include isqualified=false per i giocatori esclusi dalle soglie delle classifiche; i profili ancora mancanti vengono controllati con il game log individuale della stagione verificata, con cache di 30 minuti. Gli zeri sono riservati alle statistiche effettivamente restituite dal feed; giocatori assenti dalla risposta e campi non esposti sono indicati con — e dati stagionali non disponibili. ID e nomi vengono confrontati prima di associare le statistiche. Le schede delle leggende e i loro dati storici restano dimostrativi. Non è un servizio NBA ufficiale e non garantisce aggiornamento azione per azione. La sezione carte contiene una selezione editoriale aggiornata manualmente: il sito non rilegge automaticamente classifiche o prezzi dalle fonti. I prezzi sono vendite registrate di varianti e condizioni precise, non quotazioni garantite. ESPN non restituisce sempre clip incorporabili; quando non trova video riproducibili, la scheda propone raccolte di highlights esterne.

Gli avvisi interni vengono conservati nel browser e, dopo la configurazione, le preferenze anche nel profilo Supabase. Le notifiche browser funzionano mentre Campetto è aperto e solo dopo che l’utente concede il permesso; per invii a pagina chiusa serve un servizio push dedicato.

Le notizie ESPN sono mostrate in italiano: `news-it.json` contiene le traduzioni dei contenuti iniziali, poi `campetto-news-it.js` traduce i testi nuovi con cache locale per lingua. Usa l’endpoint pubblico Google Translate come prima sorgente e [MyMemory](https://mymemory.translated.net/doc/spec.php) come alternativa. L’endpoint pubblico Google non è un’API con garanzia di servizio e può cambiare; entrambi i servizi possono diventare indisponibili. Il codice limita le richieste concorrenti a due, conserva sempre la fonte inglese e applica una pausa dopo gli errori di un provider. Il servizio gratuito applica limiti di utilizzo: se non risponde, rimangono le traduzioni salvate e viene mostrato il titolo originale inglese, con indicazione nella pagina. I titoli hanno priorità sulle descrizioni e il feed non attende le traduzioni. Non vengono mostrate false notizie generiche. I collegamenti aprono gli articoli originali ESPN. Lo slider avanza ogni sei secondi anche dopo l'uso dei comandi; si ferma solo con Pausa, scheda nascosta o preferenza di movimento ridotto.

## Attivare l'account e il salvataggio cloud

Il progetto Supabase Campetto è collegato al sito pubblico. URL, chiave pubblica, tabella personale con RLS, conferma email, URL di ritorno e SMTP Brevo sono configurati. Una registrazione confermata e il relativo avviso al proprietario sono stati verificati l’8 novembre 2026. Per ricreare la configurazione in un altro progetto:

1. Crea un progetto Supabase e copia il Project URL e la chiave pubblica `anon` (non usare la chiave `service_role`).
2. Inserisci URL e chiave pubblica in `supabase-config.js`.
3. Esegui `supabase-schema.sql` dal pannello SQL Editor del progetto (include la preferenza notifiche).
4. Abilita l'accesso email/password e aggiungi l'indirizzo dell'app tra gli URL di redirect consentiti. Per lo sviluppo locale aggiungi, ad esempio, `http://localhost:8000`.

Supabase gestisce password e link di recupero: Campetto non salva le password. La tabella `user_profiles` applica Row Level Security, così ogni utente può leggere e aggiornare solo preferiti e quintetto del proprio account. Fino a quando URL, chiave anon e tabella non sono configurati, il modulo resta visibile ma le operazioni cloud sono disattivate.

Per incorporare i video dei giocatori nella pagina Campetto, puoi anche inserire in `supabase-config.js` una chiave YouTube Data API (`youtubeApiKey`). Restringila al dominio del sito dalla console Google. Senza questa chiave restano disponibili le raccolte video esterne. La chiave YouTube è facoltativa e attualmente non configurata.

## Pagine di riferimento

Queste pagine orientano contenuti e funzioni dell'interfaccia; sono riferimenti, non istruzioni da copiare. Una pagina NBA ufficiale non equivale a un'API pubblica autorizzata per Campetto.

- [NBA.com · Jalen Duren, video](https://www.nba.com/player/1631105/jalen-duren/videos): scheda giocatore, riepilogo e sezione video.
- [NBA.com · Statistiche](https://www.nba.com/stats/overview): classifiche ufficiali da consultare.
- [Diretta.it · Classifica NBA](https://www.diretta.it/basket/usa/nba/#/Ei5R5XBM/classifiche/generale/): classifica generale e risultati.
- [NBA Fantasy](https://it.nbafantasy.nba.com/): lega e gestione della rosa.
- [Dunkest NBA](https://nba.dunkest.com/): budget e gestione della squadra.

## Avvisi email delle iscrizioni

`supabase-signup-notifications.sql` installa una coda privata e un controllo ogni due minuti. L’avviso viene accodato una sola volta quando un indirizzo è confermato, poi inviato a jmt23@hotmail.it tramite Brevo. Le chiavi private restano soltanto in Supabase (SMTP e Vault), senza essere incluse nel sito. Il servizio gratuito applica limiti: Brevo 300 email al giorno condivise fra conferme, recuperi e avvisi; il limite Auth configurato in Supabase è 30 email/ora. Le chiavi Brevo configurate scadono l’8 novembre 2027 o dopo 90 giorni di inattività: sostituirle nelle impostazioni riservate prima della scadenza. Controllare periodicamente la coda e gli invii da revisionare.

I controlli automatici locali si eseguono con `node artifacts/test-campetto-features.cjs`, `node artifacts/test-campetto-profile.cjs`, `node artifacts/test-campetto-news.cjs`, `node artifacts/test-campetto-news-slider.cjs` e `node artifacts/test-campetto-calendar.cjs`. Usano dati di prova senza creare utenti reali o inviare email.

Il selettore della lingua aggiorna anche titoli e sottotitoli delle notizie, mantenendo il focus sul controllo. Le traduzioni vengono applicate progressivamente; una ricerca in modifica non viene interrotta e riceve gli aggiornamenti quando il focus lascia il campo. Il servizio riceve soltanto testi pubblici delle notizie. Nome, email, password e dati del profilo non sono inviati ai traduttori.
