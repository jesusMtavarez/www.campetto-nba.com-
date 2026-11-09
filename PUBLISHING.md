# Pubblicazione Campetto

Indirizzo principale dal 9 novembre 2026: https://campetto-nba.com/
Alias HTTPS attivo: https://www.campetto-nba.com/

Sito registrato con slug `campetto-nba`.

- Project ID: `appgprj_6af0a3c9c16c8191a8c103fc62b43285`
- Indirizzo assegnato: `https://campetto-nba.beamingmarch2.chatgpt.site`
- Checkout per il servizio Sites: `sites/campetto-nba`
- Identità e configurazione: `sites/campetto-nba/.openai/hosting.json`
- Contenuto distribuito: `sites/campetto-nba/dist`

Riutilizzare questo progetto per aggiornamenti successivi. Non creare un altro
sito per la stessa app. I file di sviluppo principali restano nella cartella
originale; dopo una modifica ricreare il pacchetto con `build-release.ps1` e
aggiornare il contenuto del checkout Sites prima di salvarne una nuova versione.

Le credenziali temporanee di caricamento non vengono conservate in questi file.
Non inserire password o chiavi private nel codice pubblicato.

Gli account Supabase sono collegati, con conferma email e recupero password tramite SMTP Brevo. Gli avvisi di iscrizioni confermate arrivano al proprietario. Preferiti e quintetto sono isolati per utente nel database; nome e squadra preferita nei metadati del proprio account. La sezione carte richiede aggiornamenti editoriali manuali.

## Pubblicazione confermata

- Data: 8 novembre 2026.
- Stato del servizio: `succeeded`.
- Accesso: `public`, visitabile da chiunque con l'indirizzo.
- URL: `https://campetto-nba.beamingmarch2.chatgpt.site`
- Versione: 1.
- Version ID: `appgprj_6af0a3c9c16c8191a8c103fc62b43285~appgver_38173ac864d48191b02214bcbe3c7b3e`
- Deployment ID: `appgdep_6af0a55520e8819190a496ead06fc9fa`
- Commit sorgente pubblicato: `9df4330730057f7a4c930b3c93b09539dd90bc61`.
- Verifica esterna senza credenziali: pagina HTML, JavaScript, CSS e immagine
  delle carte restituiscono HTTP 200 con un normale User-Agent browser.

Non è stato acquistato un dominio: viene usato il sottodominio della piattaforma.
L'estensione `.nba` è riservata al registro NBA e ai soggetti autorizzati.

## Aggiornamento account, versione 2

- Pubblicazione riuscita l’8 novembre 2026.
- Commit: `58f7a10c869fb04aadd45a25cf795a5ef906a5a1`.
- Version ID: `appgprj_6af0a3c9c16c8191a8c103fc62b43285~appgver_ecd0ae4d822881919dbd80f9b95fee6d`.
- Deployment ID: `appgdep_6af0afe47ac881919fa3b169162a11ea`.
- Account e URL pubblico configurati; avviso di iscrizione ricevuto e confermato dal proprietario.

## Profilo, news e calendario, versione 3

- Pubblicazione riuscita l’8 novembre 2026, stesso accesso pubblico e URL.
- Commit: `2c02230f785cc26ed5f3f15abcde4860b6e3321f`.
- Version ID: `appgprj_6af0a3c9c16c8191a8c103fc62b43285~appgver_e9ca6171e4d48191ac5b46ac7afc158f`.
- Deployment ID: `appgdep_6af0dfd843748191ae8a44f63b58c4fb`.
- Pagina personale dedicata, nome e squadra nei metadati account; ospiti separati.
- Titoli reali immediati, traduzioni in background e carosello mobile ad altezza adattabile.
- Calendario per data italiana con risultati precedenti e prossime partite.
- Cinque suite automatiche locali superate; pacchetto con 34 file del sito più manifest.
- Verifica pubblica anonima HTTP 200: HTML con nuovi script, otto risorse runtime identiche al pacchetto pubblicato. L’HTML riceve le aggiunte automatiche della piattaforma.
- Verifica visiva interrotta: lo strumento Windows non riusciva a determinare l’URL corrente. Non sono stati usati percorsi alternativi di controllo del browser.
- Salvataggio dei nuovi metadati account verificato con richieste simulate; resta da confermare visivamente con un account reale su più dispositivi.

## Preferiti e cuoricini, versione 4

- Pubblicazione riuscita l’8 novembre 2026 sullo stesso sito pubblico.
- Commit: `2b159421bc1348170bc437d5305afc37b0e8b355`.
- Version ID: `appgprj_6af0a3c9c16c8191a8c103fc62b43285~appgver_f7eae412f8248191a14ee4abccab8917`.
- Deployment ID: `appgdep_6af0e63c81a08191bc258237d1e4e872`.
- Cuori interattivi e rossi per i preferiti in catalogo, lista seguiti e scheda giocatore. Apertura profilo e modifica preferiti sono pulsanti indipendenti. Salvataggio locale e sincronizzazione cloud esistente mantenuti.
- Test automatico `artifacts/test-campetto-favorites.cjs`: aggiunta, permanenza nella lista e dopo ricaricamento, rimozione, singolo aggiornamento cloud e apertura separata del profilo. Verifica sintassi, risorse e immagini del pacchetto superata.
- Verifica HTTP pubblica delle tre risorse modificate: contenuto identico al pacchetto.

## Traduzione titoli e sottotitoli, versione 5

- Pubblicazione riuscita il 9 novembre 2026, stesso sito pubblico.
- Commit: 63ac6ad2c6a8c0b7a131944d093a5c62f48357a0.
- Version ID: appgprj_6af0a3c9c16c8191a8c103fc62b43285~appgver_d5fea046024881918254714d01b7527e.
- Deployment ID: appgdep_6af1895295c48191a297d41aaecefd0f.
- Due cause corrette: HTTP 429 del traduttore e aggiornamento visivo bloccato dal focus sul selettore lingua.
- Traduzione progressiva di titoli e descrizioni con Google pubblico e alternativa MyMemory; cache per lingua, due richieste concorrenti, pausa per provider dopo errore, priorità titoli e controllo delle risposte.
- Test automatici news, carosello e funzioni generali superati; pacchetto verificato. Due script pubblici identici ai file compilati.
- Verifica reale nel browser: 20 notizie con titoli e descrizioni in italiano, spagnolo e francese; inglese originale. Controllati carosello, In breve e schede storie. Ripristinato italiano.
- Schermata: artifacts/news-tradotte-spagnolo.png.
- Richiesta dominio interrotta dall’utente prima dell’accesso Netlify. Nessun account creato né dominio modificato.

## Dominio personalizzato attivo

9 novembre 2026: collegati campetto-nba.com e www.campetto-nba.com tramite sette record Hostinger. Verificati HTTP 200, certificati validi e corrispondenza delle risorse applicative. Configurazione Supabase aggiornata e verificata dopo ricaricamento: Site URL nuovo e sei redirect esatti. Nessuna modifica al codice o nuova distribuzione richiesta. Il dominio originario della piattaforma rimane disponibile. Dettagli e backup in DOMAIN-SETUP.md.


## AdSense e profili giocatori, versioni 6 e 7

9 novembre 2026, pubblicazione riuscita sul sito pubblico https://campetto-nba.com/.

- Versione 6: commit `6ccdd8d3d0189e959e16fd61f0070a41e34856e7`, versione `appgprj_6af0a3c9c16c8191a8c103fc62b43285~appgver_5c3503a60d4c8191a8c103fc62b43285`, deployment `appgdep_6af19554d00c819181ac10bf15fb417b`.
- Versione 7: commit `31e90d8e775feddc0fed4890ab47260b6495a43b`, versione `appgprj_6af0a3c9c16c8191a8c103fc62b43285~appgver_86ae62dee0d481918d516cc9d6e44567`, deployment `appgdep_6af198af86b08191aade601e1a7d76a5`.
- Account AdSense esistente del proprietario: `pub-2096242776990164`; dominio verificato e revisione richiesta il 9 novembre. Stato Google: in fase di preparazione, non ancora approvato.
- Privacy e contatti pubblicati con titolare e email forniti dall’utente; ads.txt pubblico; codice Google e unità display `5309569287` per Panoramica/News. Annunci automatici OFF.
- Google CMP: messaggio “Campetto · Consenso europeo” pubblicato, italiano predefinito e inglese/spagnolo/francese; consenso, rifiuto in tutte le regioni e gestione opzioni. Ottimizzazione del messaggio disattivata. Nessuna modifica al vecchio messaggio di altro sito.
- Un solo inserimento dell’unità per caricamento pagina, dopo CONSENT_DATA_READY Google. Nessun refresh a ogni aggiornamento sportivo e nessuna unità nelle viste account/profilo/quintetto. Il servizio Google determina gli annunci consentiti.
- Logo profilo limitato a 24 px; informazioni biografiche recuperate per ID e nome verificati. Date localizzate, età/città/college/draft quando disponibili. Campi realmente assenti omessi, senza statistiche inventate.
- Test ads e dettagli giocatore superati; build con 39 file runtime e manifest verificata.
- AdSense segnala ancora una verifica nel conto pagamenti YouTube; deve gestirla personalmente il proprietario. Nessun dato bancario o documento esaminato o modificato.
