# Collegamento campetto-nba.com

Stato: COMPLETATO il 9 novembre 2026. campetto-nba.com e www.campetto-nba.com sono attivi con HTTPS valido e HTTP 200. Sette record DNS salvati in Hostinger, nameserver conservati.
Non cambiare i nameserver cosmos.dns-parking.com e nova.dns-parking.com.

| Tipo | Nome in Hostinger | Valore |
|---|---|---|
| A | @ | 162.159.143.30 |
| A | @ | 172.66.3.26 |
| CNAME | www | custom-domains.chatgpt.site. |
| TXT | _openai-site-verification | openai-site-verification=xfMtcmmRIe5Miz-kiiAuXAfY1IrL9Y1_pT0GRpfsg1E |
| TXT | _cf-custom-hostname | 0d7e837f-6f07-46f9-8507-70dc74b7dfbe |
| TXT | _openai-site-verification.www | openai-site-verification=fD0xYRwBxVoDI6oWefo2DRWZhe3AjIgXSSwTQasAIrE |
| TXT | _cf-custom-hostname.www | 67a78ae9-301b-4f50-b43b-0faa0be452a2 |

TTL: lasciare il valore predefinito. I record A precedenti del solo nome @ vanno sostituiti con i due indirizzi sopra. Il CNAME www esistente va aggiornato. Conservare MX, TXT e altri record di posta. Prima delle modifiche salvare la configurazione corrente. Non usare la funzione Ripristina DNS.

Prima di dichiarare il cambio concluso: verificare entrambi gli hostname e HTTPS; aggiungere i redirect esatti https://campetto-nba.com/, https://campetto-nba.com/index.html, https://www.campetto-nba.com/, https://www.campetto-nba.com/index.html in Supabase; impostare Site URL a https://campetto-nba.com soltanto quando il nuovo dominio è attivo; preservare i redirect del vecchio sito durante il passaggio.

Project ID: appgprj_6af0a3c9c16c8191a8c103fc62b43285
Apex domain ID: appgdom_6af18c05dcd88191b3e20b2730277698
WWW domain ID: appgdom_6af18c3da4408191809c215f35fb26ba

## Verifiche concluse

- Entrambi i domini: stato Sites active, provider active, SSL active.
- HTTP 200 con verifica del certificato attiva, nessun bypass.
- app.js, supabase-config.js e campetto-profile.js identici al pacchetto pubblicato su entrambi gli hostname.
- Supabase Site URL salvato e verificato dopo ricaricamento: https://campetto-nba.com.
- Sei redirect autorizzati: conservati i due precedenti, aggiunti root e index.html per entrambi i nuovi hostname.
- Browser: panoramica caricata sul dominio nuovo, 522 giocatori e sette partite.
- Account e password esistenti nel medesimo progetto Supabase; nuova registrazione o recupero reale non eseguiti durante questo cambio.
- I dati solo locali nel browser del vecchio dominio non vengono trasferiti automaticamente: la sincronizzazione cloud richiede accesso sul nuovo dominio.
- Backup precedente: artifacts/dns-campetto-prima-del-cambio.txt. Schermata: artifacts/campetto-dominio-attivo.png.
