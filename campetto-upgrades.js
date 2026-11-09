/* Campetto: classifiche statistiche, pagine squadra, dati aggiornati e account Supabase. */
(() => {
  if (typeof STAT_HEADERS === 'undefined') {
    var STAT_HEADERS = [
      ['gp', 'GP'], ['min', 'MIN'], ['pts', 'PTS'], ['fgm', 'FGM'], ['fga', 'FGA'], ['fgp', 'FG%'],
      ['tpm', '3PM'], ['tpa', '3PA'], ['tpp', '3P%'], ['ftm', 'FTM'], ['fta', 'FTA'], ['ftp', 'FT%'],
      ['oreb', 'OREB'], ['dreb', 'DREB'], ['reb', 'REB'], ['ast', 'AST'], ['stl', 'STL'], ['blk', 'BLK'],
      ['tov', 'TOV'], ['pf', 'PF'], ['pm', '+/-']
    ];
  }

  const EXTRA_STATS_KEY = 'campetto-espn-stats-v5';
  const AUTH_KEY = 'campetto-supabase-session-v1';
  const NOTICE_KEY = 'campetto-notifications-v1';
  const NOTICE_PREF_KEY = 'campetto-notification-preferences-v1';
  const NBA_STAT_URL = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete';
  const STAT_OPTIONS = [
    ['pts', 'Punti per partita'], ['reb', 'Rimbalzi per partita'], ['ast', 'Assist per partita'],
    ['stl', 'Palle rubate per partita'], ['blk', 'Stoppate per partita'], ['min', 'Minuti per partita'],
    ['fgm', 'Canestri per partita'], ['fga', 'Tiri tentati per partita'], ['fgp', 'Percentuale dal campo'],
    ['tpm', 'Triple per partita'], ['tpa', 'Triple tentate per partita'], ['tpp', 'Percentuale da tre'],
    ['ftm', 'Tiri liberi per partita'], ['fta', 'Tiri liberi tentati per partita'], ['ftp', 'Percentuale ai liberi'],
    ['tov', 'Palle perse per partita'], ['pf', 'Falli per partita']
  ];
  const STAT_NAMES = {
    avgMinutes: 'min', avgPoints: 'pts', avgFieldGoalsMade: 'fgm', avgFieldGoalsAttempted: 'fga',
    fieldGoalPct: 'fgp', avgThreePointFieldGoalsMade: 'tpm', avgThreePointFieldGoalsAttempted: 'tpa',
    threePointFieldGoalPct: 'tpp', avgFreeThrowsMade: 'ftm', avgFreeThrowsAttempted: 'fta',
    freeThrowPct: 'ftp', avgAssists: 'ast', avgTurnovers: 'tov', avgSteals: 'stl', avgBlocks: 'blk',
    avgFouls: 'pf', avgRebounds: 'reb'
  };
  const WAITING_STATS = Object.fromEntries(STAT_HEADERS.map(([key]) => [key, '—']));
  const TEAM_HONORS = {
    ATL: { count: 1, last: '1958' }, BOS: { count: 18, last: '2024' }, BKN: { count: 0, last: '—' },
    CHA: { count: 0, last: '—' }, CHI: { count: 6, last: '1998' }, CLE: { count: 1, last: '2016' },
    DAL: { count: 1, last: '2011' }, DEN: { count: 1, last: '2023' }, DET: { count: 3, last: '2004' },
    GSW: { count: 7, last: '2022' }, HOU: { count: 2, last: '1995' }, IND: { count: 0, last: '—' },
    LAC: { count: 0, last: '—' }, LAL: { count: 17, last: '2020' }, MEM: { count: 0, last: '—' },
    MIA: { count: 3, last: '2013' }, MIL: { count: 2, last: '2021' }, MIN: { count: 0, last: '—' },
    NOP: { count: 0, last: '—' }, NYK: { count: 3, last: '2026' }, OKC: { count: 1, last: '2025' },
    ORL: { count: 0, last: '—' }, PHI: { count: 3, last: '1983' }, PHX: { count: 0, last: '—' },
    POR: { count: 1, last: '1977' }, SAC: { count: 1, last: '1951' }, SAS: { count: 5, last: '2014' },
    TOR: { count: 1, last: '2019' }, UTA: { count: 0, last: '—' }, WAS: { count: 1, last: '1978' }
  };
  const TEAM_ALIASES = {GS:'GSW',NY:'NYK',NO:'NOP',SA:'SAS',UTAH:'UTA',WSH:'WAS',PHO:'PHX'};
  const CONF = new Set(['ATL','BOS','BKN','CHA','CHI','CLE','DET','IND','MIA','MIL','NYK','ORL','PHI','TOR','WAS']);
  let activeStat = 'pts';
  let leadersQuery = '';
  let selectedTeam = 'BOS';
  let selectedGame = null;
  let selectedGameDetails = null;
  let selectedGameLoading = false;
  let selectedGameTab = 'box';
  let lastStatsUpdate = null;
  let statsState = 'loading';
  let baseRender = render;
  let accountMode = 'login';
  let cloudBusy = false;
  let cloudMessage = '';
  let cloudSession = readStorage(AUTH_KEY, null);
  let syncTimer = null;
  let cardMode = 'searched';
  let notifications = readStorage(NOTICE_KEY, []);
  let notificationPreferences = readStorage(NOTICE_PREF_KEY, {inApp:true,browser:false});
  let notificationPollStarted = false;
  let joined = readStorage('campetto-joined-v1', false);
  const KEY_FAV='campetto-favorites-v1', KEY_ROSTER='campetto-roster-v1', KEY_JOINED='campetto-joined-v1';
  const playerVideoCache = new Map();
  const notify = message => setToast(message);
  let bindViewActions = () => bindGenericHandlers();
  const bindPlayerCardActions = () => bindGenericHandlers();

  const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const normalized = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it');
  const supabaseConfig = () => window.CAMPETTO_SUPABASE || {};
  const cloudReady = () => /^https:\/\//i.test(supabaseConfig().url || '') && !!supabaseConfig().anonKey && !/YOUR_|PLACEHOLDER/i.test(`${supabaseConfig().url} ${supabaseConfig().anonKey}`);
  const confLabel = code => CONF.has(code) ? 'Eastern Conference' : 'Western Conference';
  const seasonLabel = () => {
    const now = new Date(), first = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return `${first}/${String(first + 1).slice(-2)}`;
  };
  const seasonId = () => {
    const now = new Date();
    return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  };
  const showNumber = value => Number.isFinite(Number(value)) ? Number(value).toFixed(1) : '—';
  const statOf = (player, key) => player?.stats?.[key] ?? '—';
  const safeLogo = code => `<img src="${logoUrl(code)}" alt="" onerror="this.style.display='none'">`;
  const playerCards = players => players.map(playerCard).join('');
  function compareCards(player) { return `<div class="compare-grid">${[['Punti','pts'],['Rimbalzi','reb'],['Assist','ast']].map(([label,key])=>`<article class="compare-card"><span>${label}</span><b>${esc(statOf(player,key))}</b></article>`).join('')}</div>`; }
  const createZeroStats = () => ({...WAITING_STATS, gp:'—', pm:'—'});
  const noAppearanceStats = () => Object.fromEntries(STAT_HEADERS.map(([key]) => [key, ['fgp','tpp','ftp','pm'].includes(key) ? '—' : key==='gp'?'0':'0.0']));

  function updateStatsFromCategories(row) {
    const stats = {...WAITING_STATS,gp:'0'};
    const categories = row?.categories || [];
    let gamesPlayed = 0;

    for (const category of categories) {
      const values = Array.isArray(category.values) ? category.values : Array.isArray(category.totals) ? category.totals : [];
      if (!values.length) continue;

      const name = String(category.name || '').toLowerCase();
      if (name === 'general') {
        gamesPlayed = Number(values[0]) || 0;
        stats.gp=String(gamesPlayed);
        if (values[1] != null && Number.isFinite(Number(values[1]))) stats.min = showNumber(Number(values[1]));
        if (values[2] != null && Number.isFinite(Number(values[2]))) stats.pf = showNumber(Number(values[2]));
        if (values[11] != null && Number.isFinite(Number(values[11]))) stats.reb = showNumber(Number(values[11]));
        continue;
      }

      if (name === 'offensive') {
        const map = {
          pts: values[0],
          fgm: values[1],
          fga: values[2],
          fgp: values[3],
          tpm: values[4],
          tpa: values[5],
          tpp: values[6],
          ftm: values[7],
          fta: values[8],
          ftp: values[9],
          ast: values[10],
          tov: values[11]
        };

        for (const [key, raw] of Object.entries(map)) {
          if (raw == null || !Number.isFinite(Number(raw))) continue;
          const number = Number(raw);
          stats[key] = ['fgp','tpp','ftp'].includes(key) ? `${number.toFixed(1)}%` : showNumber(number);
        }
        continue;
      }

      if (name === 'defensive') {
        const valuesDef = values;
        if (valuesDef[0] != null && Number.isFinite(Number(valuesDef[0]))) stats.stl = showNumber(Number(valuesDef[0]));
        if (valuesDef[1] != null && Number.isFinite(Number(valuesDef[1]))) stats.blk = showNumber(Number(valuesDef[1]));
      }
    }

    stats.gp = String(gamesPlayed);
    return { stats, gamesPlayed };
  }

  const PROFILE_STATS_KEY=`campetto-profile-stats-v2-${seasonId()+1}`;
  const profileStatsCache=readStorage(PROFILE_STATS_KEY,{});
  let profileStatsRunning=false,profileStatsAgain=false;
  function verifiedGameLogStats(data) {
    const year=seasonId()+1;
    if(String(data.filters?.find(filter=>filter.name==='season')?.value)!==String(year))return null;
    const regular=data.seasonTypes?.find(group=>/regular season/i.test(group.displayName||'')&&String(group.displayName).includes(`${year-1}-${String(year).slice(-2)}`));
    if(!regular)return null;
    const averages=regular.summary?.stats?.find(row=>row.type==='avg')?.stats;
    const events=new Map((regular.categories||[]).flatMap(group=>group.events||[]).filter(event=>Array.isArray(event.stats)&&event.stats.length&&!event.didNotPlay).map(event=>[event.eventId,event]));
    if(!averages?.length||!events.size)return null;
    const keys={minutes:'min',fieldGoalPct:'fgp',threePointPct:'tpp',freeThrowPct:'ftp',totalRebounds:'reb',assists:'ast',blocks:'blk',steals:'stl',fouls:'pf',turnovers:'tov',points:'pts'};
    const stats={...WAITING_STATS,gp:String(events.size)};
    (data.names||[]).forEach((name,index)=>{const key=keys[name],raw=averages[index];if(key&&raw!=null&&String(raw).trim()!==''&&Number.isFinite(Number(raw)))stats[key]=showNumber(raw)});
    return {stats,gamesPlayed:events.size,statsSeason:year};
  }
  window.CAMPETTO_VERIFIED_GAMELOG_STATS=verifiedGameLogStats;
  function currentProfileStats(player){const item=profileStatsCache[String(player.espn)];return item&&Date.now()-item.updatedAt<30*60*1000?item:null}
  async function supplementMissingStats(){
    if(profileStatsRunning){profileStatsAgain=true;return}
    profileStatsRunning=true;
    const missing=PLAYERS.filter(p=>p.active&&p.statsSource==='unavailable'&&p.espn&&!currentProfileStats(p));let next=0,changed=false;
    async function worker(){while(next<missing.length){const p=missing[next++];let entry=null;
      try{
        const data=await fetchStatsJson(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${encodeURIComponent(p.espn)}/gamelog?region=us&lang=en&season=${seasonId()+1}`);
        entry=verifiedGameLogStats(data);
      }catch(error){console.info(`Statistiche profilo ${p.name}:`,error.message)}
      profileStatsCache[String(p.espn)]={updatedAt:Date.now(),entry};
      if(entry){PLAYERS=PLAYERS.map(player=>String(player.espn)===String(p.espn)?{...player,...entry,statsSource:'ESPN'}:player);changed=true}
    }}
    await Promise.all([worker(),worker(),worker(),worker()]);saveStorage(PROFILE_STATS_KEY,profileStatsCache);
    if(changed){if(currentPlayer)currentPlayer=playerById(currentPlayer.id)||currentPlayer;render()}
    profileStatsRunning=false;if(profileStatsAgain){profileStatsAgain=false;supplementMissingStats()}
  }
  function applyStatsRows(rows, updatedAt = Date.now()) {
    const byEspn = new Map();
    const byName = new Map();
    for (const row of rows || []) {
      const athlete = row.athlete || {};
      const id = String(athlete.id || row.id || '');
      const entry = {...updateStatsFromCategories(row),name:normalized(athlete.displayName || athlete.fullName || athlete.name || '')};
      if (id) byEspn.set(id, entry);
      const name = normalized(athlete.displayName || athlete.fullName || athlete.name || athlete.shortName || '');
      if (name) byName.set(name, entry);
    }
    PLAYERS = PLAYERS.map(player => {
      if (!player.active) return player;
      const idEntry=byEspn.get(String(player.espn));
      const entry = (idEntry?.name===normalized(player.name)?idEntry:null) || byName.get(normalized(player.name));
      if (!entry) {
        const supplemental=currentProfileStats(player)?.entry;
        if(supplemental)return {...player,...supplemental,statsSource:'ESPN'};
        return {...player, stats:{...WAITING_STATS}, gamesPlayed:null, statsSource:'unavailable'};
      }
      const mergedStats = { ...(player.stats || {}), ...entry.stats };
      return {...player, stats: mergedStats, gamesPlayed: entry.gamesPlayed, statsSource:'ESPN',statsSeason:seasonId()+1};
    });
    if (currentPlayer) currentPlayer = playerById(currentPlayer.id) || currentPlayer;
    lastStatsUpdate = updatedAt;
    statsState = 'ready';
    if (document.querySelector('#view-root')) render();
    supplementMissingStats();
  }

  async function fetchStatsJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url, {signal:controller.signal, headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error(`Feed statistiche: HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timeout); }
  }

  async function loadSeasonStats(force = false) {
    const season = seasonId();
    const cache = readStorage(`${EXTRA_STATS_KEY}-${season}`, null);
    const age = Date.now() - Number(cache?.updatedAt || 0);
    if (!force && cache?.rows?.length && age < 10 * 60 * 1000) {
      applyStatsRows(cache.rows, cache.updatedAt);
      return;
    }
    statsState = 'loading';
    if (!cache?.rows?.length) {
      PLAYERS = PLAYERS.map(player => player.active ? {...player, stats: player.stats || createZeroStats(), statsSource: 'loading', gamesPlayed: player.gamesPlayed || 0} : player);
      if (currentPlayer) currentPlayer = playerById(currentPlayer.id) || currentPlayer;
      render();
    }
    try {
      const rows = [];
      const limit = 500;
      const first = await fetchStatsJson(`${NBA_STAT_URL}?region=us&lang=en&contentorigin=espn&limit=${limit}&isqualified=false&season=${season+1}`);
      rows.push(...(first.athletes || []));
      const pages = Math.min(Number(first.pagination?.pages || 1), 4);
      for (let page = 2; page <= pages; page++) {
        const response = await fetchStatsJson(`${NBA_STAT_URL}?region=us&lang=en&contentorigin=espn&limit=${limit}&isqualified=false&season=${season+1}&page=${page}`);
        rows.push(...(response.athletes || []));
      }
      if (!rows.length) throw new Error('Il feed non ha restituito statistiche stagionali.');
      const updatedAt = Date.now();
      saveStorage(`${EXTRA_STATS_KEY}-${season}`, {rows,updatedAt});
      applyStatsRows(rows, updatedAt);
    } catch (error) {
      console.info('Statistiche NBA non aggiornate:', error);
      statsState = 'unavailable';
      render();
    }
  }

  function formatUpdate() {
    if (!lastStatsUpdate) return statsState === 'loading' ? 'Statistiche in caricamento…' : 'Statistiche non raggiungibili';
    return `Dati ESPN · aggiornati alle ${new Date(lastStatsUpdate).toLocaleTimeString(window.CAMPETTO_LOCALE?.()||'it-IT',{hour:'2-digit',minute:'2-digit'})}`;
  }

  function teamCodeFromName(name) {
    const target = normalized(name);
    const abbr=String(name||'').toUpperCase();
    return TEAM_ALIASES[abbr] || (TEAM_INFO[abbr]?abbr:'') || Object.keys(TEAM_INFO).find(code => normalized(TEAM_INFO[code].name) === target) || '';
  }
  function rankFor(code) {
    const teamOfEntry = item => teamCodeFromName(item.abbr || item.name || item.team);
    const match = standings.find(item => teamOfEntry(item) === code);
    if (!match) return {item:null,rank:null};
    const conference = match.conference || (CONF.has(code) ? 'east' : 'west');
    const group = standings.filter(item => (item.conference || (CONF.has(teamOfEntry(item)) ? 'east' : 'west')) === conference)
      .sort((a,b) => Number(String(b.pct).replace('%','')) - Number(String(a.pct).replace('%','')));
    return {item:match,rank:group.findIndex(item => teamOfEntry(item) === code) + 1};
  }
  function bestOnTeam(code, stat, noun) {
    const ranked = PLAYERS.filter(p => p.active && p.team === code && p.gamesPlayed > 0)
      .sort((a,b) => (Number(b.stats?.[stat]) || 0) - (Number(a.stats?.[stat]) || 0));
    const player = ranked[0];
    return player ? `<button class="team-leader" data-player="${esc(player.id)}"><span>${noun}</span><b>${esc(player.name)}</b><strong>${esc(statOf(player,stat))}</strong></button>` : `<div class="team-leader"><span>${noun}</span><b>Statistiche in attesa</b><strong>—</strong></div>`;
  }

  function renderTeams() {
    const ordered = Object.keys(TEAM_INFO).sort((a,b) => TEAM_INFO[a].name.localeCompare(TEAM_INFO[b].name,'it'));
    return `<section class="page-heading"><div><div class="eyebrow">NBA · ${ordered.length} FRANCHIGIE</div><h1>Squadre</h1><p class="section-sub">Apri una squadra per vedere rosa, città, rendimento e titoli NBA.</p></div><span class="data-note">${formatUpdate()}</span></section><div class="team-directory">${ordered.map(code => {
      const info=team(code), honor=TEAM_HONORS[code], record=rankFor(code).item;
      return `<button class="team-directory-card" data-team="${code}" style="--team-color:${info.color}"><span class="team-card-logo">${safeLogo(code)}</span><span class="team-card-copy"><b>${esc(info.name)}</b><small>${esc(info.city)} · ${confLabel(code)}</small><small>${record?`${esc(record.wins)}–${esc(record.losses)} · ${esc(record.pct)}`:'Classifica in caricamento'}</small></span><span class="team-card-honors">🏆 ${honor.count}</span><span class="team-card-arrow">→</span></button>`;
    }).join('')}</div>`;
  }

  function renderTeam(code) {
    const info=team(code), rosterList=PLAYERS.filter(p => p.active && p.team === code).sort((a,b) => {
      const order=['PG','SG','G','SF','PF','F','C'];
      return order.indexOf(a.position)-order.indexOf(b.position) || a.name.localeCompare(b.name,'it');
    });
    const honor=TEAM_HONORS[code]||{count:0,last:'—'};
    const {item:record,rank}=rankFor(code);
    const confRank=rank ? `${rank}ª nella ${confLabel(code)}` : 'Classifica non disponibile';
    const arena = ({BOS:'TD Garden',BKN:'Barclays Center',NYK:'Madison Square Garden',GSW:'Chase Center',LAL:'Crypto.com Arena',LAC:'Intuit Dome',CHI:'United Center',DEN:'Ball Arena',MIA:'Kaseya Center',MIL:'Fiserv Forum',PHI:'Wells Fargo Center',DAL:'American Airlines Center',SAS:'Frost Bank Center',OKC:'Paycom Center',ATL:'State Farm Arena',HOU:'Toyota Center',PHX:'Footprint Center',CLE:'Rocket Arena',DET:'Little Caesars Arena',TOR:'Scotiabank Arena',ORL:'Kia Center',MIN:'Target Center',MEM:'FedExForum',NOP:'Smoothie King Center',IND:'Gainbridge Fieldhouse',POR:'Moda Center',SAC:'Golden 1 Center',CHA:'Spectrum Center',UTA:'Delta Center',WAS:'Capital One Arena'})[code] || 'Arena NBA';
    return `<section class="team-hero" style="--team-color:${info.color}"><button class="back-link" data-view="teams">← &nbsp;Tutte le squadre</button><div class="team-hero-main"><div class="team-hero-logo">${safeLogo(code)}</div><div><div class="eyebrow">${confLabel(code)} · NBA</div><h1>${esc(info.name)}</h1><p>${esc(info.city)} · ${esc(arena)}</p></div></div><p class="team-description">I ${esc(info.name)} rappresentano ${esc(info.city)} nella ${confLabel(code)}. Campetto riunisce qui la rosa attuale, le statistiche stagionali, la posizione in classifica e il palmarès della franchigia.</p></section><div class="team-summary-grid"><article class="team-summary-card"><span>CITTÀ</span><b>${esc(info.city)}</b><small>${esc(arena)}</small></article><article class="team-summary-card"><span>CLASSIFICA</span><b>${esc(confRank)}</b><small>${record?`${esc(record.wins)} vittorie · ${esc(record.losses)} sconfitte (${esc(record.pct)})`:'Dati della classifica non disponibili'}</small></article><article class="team-summary-card"><span>TITOLI NBA</span><b>🏆 ${honor.count}</b><small>${honor.last==='—'?'Nessun titolo NBA':`Ultimo titolo: ${honor.last}`}</small></article><article class="team-summary-card"><span>ROSA</span><b>${rosterList.length} giocatori</b><small>${rostersLoading?'Rosa in aggiornamento':'Rosa attiva dal feed ESPN'}</small></article></div><section class="section-block"><div class="section-head"><div><h2 class="section-title">Leader della squadra</h2><p class="section-sub">Medie per partita nella stagione ${seasonLabel()} · ${formatUpdate()}</p></div><button class="text-button" data-view="leaders">Tutti i leader NBA&nbsp; →</button></div><div class="team-leaders-grid">${bestOnTeam(code,'pts','Punti'),bestOnTeam(code,'reb','Rimbalzi'),bestOnTeam(code,'ast','Assist')}</div></section><section class="section-block"><div class="section-head"><div><h2 class="section-title">Rosa e formazione</h2><p class="section-sub">Giocatori attivi divisi per ruolo. Seleziona un giocatore per aprire il profilo.</p></div><span class="data-note">${rosterList.length} giocatori</span></div><div class="grid player-grid">${rosterList.length?playerCards(rosterList):`<div class="empty-state">La rosa di ${esc(info.name)} non è disponibile finché non viene caricato il feed delle squadre.</div>`}</div></section><section class="section-block"><div class="section-head"><div><h2 class="section-title">Palmarès</h2><p class="section-sub">Titoli NBA della franchigia.</p></div></div><div class="honors-panel"><span>🏆</span><div><b>${honor.count} ${honor.count===1?'titolo':'titoli'} NBA</b><small>${honor.last==='—'?'La squadra non ha ancora vinto il titolo NBA':`Titolo più recente: ${honor.last}`}</small></div></div></section>`;
  }

  function leaderRows() {
    const query=normalized(leadersQuery.trim());
    return activePlayers().filter(player => player.gamesPlayed > 0 && (!query || normalized(`${player.name} ${player.team}`).includes(query)))
      .filter(player => Number.isFinite(Number(String(player.stats?.[activeStat]||'').replace('%',''))))
      .sort((a,b) => Number(String(b.stats[activeStat]).replace('%','')) - Number(String(a.stats[activeStat]).replace('%','')));
  }
  function renderLeaders() {
    const option=STAT_OPTIONS.find(([key])=>key===activeStat)||STAT_OPTIONS[0];
    const rows=leaderRows().slice(0,100);
    return `<section class="page-heading"><div><div class="eyebrow">NBA · STAGIONE ${seasonLabel()}</div><h1>Leader statistici</h1><p class="section-sub">Ordina i giocatori per ciascuna statistica stagionale disponibile.</p></div><span class="data-note">${formatUpdate()}</span></section><div class="leader-controls"><label><span>Classifica per</span><select id="leader-stat">${STAT_OPTIONS.map(([key,label])=>`<option value="${key}" ${activeStat===key?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label class="directory-search"><span>⌕</span><input id="leader-search" type="search" value="${esc(leadersQuery)}" placeholder="Cerca un giocatore o una squadra…" autocomplete="off"></label><button class="secondary-button" id="refresh-player-stats">↻ Aggiorna</button></div><div class="panel table-panel"><div class="stats-table-wrap"><table class="stats-table leader-table"><thead><tr><th>#</th><th>GIOCATORE</th><th>SQUADRA</th><th>GP</th><th>${esc(option[0].toUpperCase())}</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th></tr></thead><tbody>${rows.length?rows.map((p,i)=>`<tr data-player="${esc(p.id)}" tabindex="0"><td class="strong-cell">${i+1}</td><td class="leader-player"><b>${esc(p.name)}</b><small>${esc(p.position)}</small></td><td><button class="team-inline" data-team="${esc(p.team)}">${safeLogo(p.team)} ${esc(p.team)}</button></td><td>${p.gamesPlayed||0}</td><td class="strong-cell">${esc(statOf(p,activeStat))}</td><td>${esc(statOf(p,'pts'))}</td><td>${esc(statOf(p,'reb'))}</td><td>${esc(statOf(p,'ast'))}</td><td>${esc(statOf(p,'stl'))}</td><td>${esc(statOf(p,'blk'))}</td></tr>`).join(''):`<tr><td colspan="10" class="leader-empty">${statsState==='loading'?'Le statistiche si stanno caricando…':'Nessun dato disponibile per questo filtro.'}</td></tr>`}</tbody></table></div></div><p class="data-note" style="margin-top:9px">Graduatoria basata sulle medie a partita ESPN per ${esc(option[1].toLowerCase())}. Gli atleti senza presenze nella stagione non compaiono.</p>`;
  }

  const CARD_SEARCHES = [
    {player:'Michael Jordan', set:'1986-87 Fleer · #57', note:'Icona sempre tra le più cercate', query:'1986-87 Fleer Michael Jordan 57 basketball card'},
    {player:'Cooper Flagg', set:'2025-26 Topps · #201 Rookie', note:'Rookie più cercata della nuova stagione', query:'2025-26 Topps Cooper Flagg 201 basketball card'},
    {player:'Victor Wembanyama', set:'2023-24 Donruss · #220 Rookie', note:'Tra le rookie più ricercate', query:'2023-24 Donruss Victor Wembanyama 220 basketball card'},
    {player:'Kobe Bryant', set:'1996-97 Topps · #138 Rookie', note:'Classico da collezione', query:'1996-97 Topps Kobe Bryant 138 basketball card'},
    {player:'Shaquille O’Neal', set:'1992-93 Topps · #362 Rookie', note:'Rookie anni ’90 molto cercata', query:'1992-93 Topps Shaquille O Neal 362 basketball card'},
    {player:'Dylan Harper', set:'2025-26 Topps · #202 Rookie', note:'Nome in forte attenzione tra i rookie', query:'2025-26 Topps Dylan Harper 202 basketball card'}
  ];
  const CARD_SALES = [
    {player:'LeBron James',set:'2025-26 Topps · Platinum Holo Foil 1/1 · PSA 7',price:'29.280 USD',date:'26 settembre 2026',query:'2025-26 Topps LeBron James Platinum Holo Foil 1/1 PSA 7'},
    {player:'Dylan Harper',set:'2025-26 Topps All Kings · AK-17 · PSA 10',price:'24.000 USD',date:'30 agosto 2026',query:'2025-26 Topps All Kings AK-17 Dylan Harper PSA 10'},
    {player:'Victor Wembanyama',set:'2025-26 Topps All Kings · AK-1 · PSA 10',price:'21.878 USD',date:'11 ottobre 2026',query:'2025-26 Topps All Kings AK-1 Victor Wembanyama PSA 10'},
    {player:'Stephen Curry',set:'2025-26 Topps All Kings · AK-2 · PSA 10',price:'Mediana 2.650 USD',date:'24 vendite registrate',query:'2025-26 Topps All Kings AK-2 Stephen Curry PSA 10'},
    {player:'Cooper Flagg',set:'2025-26 Topps · #201 base · PSA 10',price:'Mediana 100 USD',date:'395 vendite registrate',query:'2025-26 Topps Cooper Flagg 201 PSA 10'},
    {player:'LeBron James',set:'2025-26 Topps All Kings · AK-3 · PSA 9',price:'Mediana 8.600 USD',date:'9 vendite registrate',query:'2025-26 Topps All Kings AK-3 LeBron James PSA 9'}
  ];
  // Each edition has its own bundled photo: a player headshot is not a card preview.
  const CARD_PHOTOS = {
    '1986-87 Fleer · #57': {file:'jordan-fleer-57', source:'https://www.ebay.com/itm/298705048942'},
    '2025-26 Topps · #201 Rookie': {file:'flagg-topps-201', source:'https://www.ebay.com/itm/306699725386'},
    '2023-24 Donruss · #220 Rookie': {file:'wembanyama-donruss-220', source:'https://joshcardworld.com/products/victor-wembanyama-2023-panini-donruss-220-psa-10'},
    '1996-97 Topps · #138 Rookie': {file:'bryant-topps-138', source:'https://www.ebay.com/itm/144031637316'},
    '1992-93 Topps · #362 Rookie': {file:'oneal-topps-362', source:'https://www.ebay.com/itm/256469062103'},
    '2025-26 Topps · #202 Rookie': {file:'harper-topps-202', source:'https://www.ebay.com/itm/177665970047'},
    '2025-26 Topps · Platinum Holo Foil 1/1 · PSA 7': {file:'james-topps-150-holo', source:'https://www.ebay.com/b/Topps-LeBron-James-10-Graded-Basketball-Sports-Trading-Cards-Accessories/212/bn_90431476', note:'Foto Holo Foil #150: la variante Platinum 1/1 non è illustrata.', alt:'LeBron James, Topps 2025 #150 Holo Foil PSA 10, foto di riferimento di una variante diversa'},
    '2025-26 Topps All Kings · AK-17 · PSA 10': {file:'harper-all-kings-ak17', source:'https://www.sportscardinvestor.com/cards/dylan-harper-basketball/2025-topps-all-kings-ak-17', note:'Foto della carta non graduata; vendita riferita a PSA 10.', alt:'Dylan Harper, Topps 2025 All Kings AK-17 non graduata'},
    '2025-26 Topps All Kings · AK-1 · PSA 10': {file:'wembanyama-all-kings-ak1', source:'https://www.sportscardinvestor.com/cards/victor-wembanyama-basketball/2025-topps-all-kings-ak-1'},
    '2025-26 Topps All Kings · AK-2 · PSA 10': {file:'curry-all-kings-ak2', source:'https://www.sportscardinvestor.com/cards/stephen-curry-basketball/2025-topps-all-kings-ak-2'},
    '2025-26 Topps · #201 base · PSA 10': {file:'flagg-topps-201', source:'https://www.ebay.com/itm/306699725386'},
    '2025-26 Topps All Kings · AK-3 · PSA 9': {file:'james-all-kings-ak3', source:'https://www.sportscardinvestor.com/cards/lebron-james-basketball/2025-topps-all-kings-ak-3'}
  };
  function renderMarketCard(item,index) {
    const photo=CARD_PHOTOS[item.set];
    const imagePath=`assets/cards/${photo.file}.jpg`;
    const imageAlt=photo.alt||`${item.player}, ${item.set}, foto della carta da collezione`;
    const priceMatch=item.price?.match(/^(Mediana )?([\d.]+) USD$/);
    const formattedPrice=priceMatch?`${priceMatch[1]?`${window.CAMPETTO_I18N?.t('Mediana')||'Mediana'} `:''}${Number(priceMatch[2].replace(/\./g,'')).toLocaleString(window.CAMPETTO_LOCALE?.()||'it-IT')} USD`:item.price;
    const monthNames=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
    const dateMatch=item.date?.match(/^(\d{1,2}) (\S+) (\d{4})$/);
    const formattedDate=dateMatch&&monthNames.includes(dateMatch[2])?new Date(Number(dateMatch[3]),monthNames.indexOf(dateMatch[2]),Number(dateMatch[1]),12).toLocaleDateString(window.CAMPETTO_LOCALE?.()||'it-IT',{day:'numeric',month:'long',year:'numeric'}):item.date;
    return `<article class="market-card">
      <div class="market-card-art">
        <span class="market-rank">#${index+1}</span>
        <a class="market-card-photo" href="${imagePath}" target="_blank" rel="noopener" aria-label="${esc(`Ingrandisci la carta di ${item.player}`)}">
          <img src="${imagePath}" alt="${esc(imageAlt)}" decoding="async" onerror="this.hidden=true;this.parentElement.classList.add('image-unavailable')">
          <span class="market-photo-fallback" role="status">Anteprima non disponibile</span>
        </a>
        <h2 class="market-player-name">${esc(item.player)}</h2>
      </div>
      <div class="market-card-copy">
        <span class="eyebrow">${cardMode==='searched'?'RICERCATA':'VENDITA / COMPARABILE'}</span>
        <h3>${esc(item.set)}</h3>
        ${cardMode==='searched'?`<p>${esc(item.note)}</p>`:`<p class="market-price">${esc(formattedPrice)}</p><small>${esc(formattedDate)} · vendita registrata</small>`}
        <div class="market-photo-credit"><a href="${esc(photo.source)}" target="_blank" rel="noreferrer">Foto di riferimento ↗</a>${photo.note?`<small>${esc(photo.note)}</small>`:''}</div>
        <a class="text-button" href="https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(item.query)}" target="_blank" rel="noreferrer">Cerca annunci&nbsp; ↗</a>
      </div>
    </article>`;
  }
  function renderCards() {
    const list=cardMode==='searched'?CARD_SEARCHES:CARD_SALES;
    return `<section class="page-heading"><div><div class="eyebrow">NBA · COLLEZIONISMO</div><h1>Carte NBA</h1><p class="section-sub">Selezione editoriale di carte ricercate e vendite storiche dalle fonti del mercato.</p></div><span class="data-note">Aggiornamento manuale · ${new Date(2026,10,6,12).toLocaleDateString(window.CAMPETTO_LOCALE?.()||'it-IT',{day:'numeric',month:'long',year:'numeric'})}</span></section><div class="card-market-tabs" role="tablist" aria-label="Classifica carte"><button class="secondary-button ${cardMode==='searched'?'active':''}" data-card-mode="searched">Più cercate</button><button class="secondary-button ${cardMode==='sold'?'active':''}" data-card-mode="sold">Vendite e quotazioni</button></div><div class="market-cards-grid">${list.map(renderMarketCard).join('')}</div><p class="data-note market-disclaimer">Classifica e prezzi sono una selezione aggiornata manualmente, senza collegamento automatico al mercato. Le foto sono di riferimento e possono mostrare un esemplare diverso da quello venduto. Vendite: prezzi registrati per varianti e condizioni specifiche. Una carta base e una rara o graduata non hanno lo stesso valore. I prezzi storici non sono una stima né una garanzia di rivendita. Fonti: <a href="https://parlae.io/cards/nba" target="_blank" rel="noreferrer">Parlae</a> · <a href="https://hobbycardindex.com/hubs/2025-26-topps-basketball/" target="_blank" rel="noreferrer">HobbyCardIndex</a>.</p>`;
  }

  function enhanceRender() {
    const route={teams:renderTeams,team:()=>renderTeam(selectedTeam),leaders:renderLeaders,cards:renderCards};
    if (route[view]) {
      const labels={teams:'Squadre',team:team(selectedTeam).name,leaders:'Leader statistici',cards:'Carte NBA'};
      document.querySelector('#breadcrumb-current').textContent=labels[view];
      document.querySelector('#favorite-count').textContent=favorites.length;
      document.querySelector('#player-count').textContent=activePlayers().length;
      root.innerHTML=route[view]();
      bindViewActions();
      bindPlayerCardActions(root);
      bindExtras();
      document.querySelectorAll('.nav-link').forEach(button=>button.classList.toggle('active',button.dataset.view===(view==='team'?'teams':view)));
      return;
    }
    baseRender();
    if (view==='standings') {
      root.querySelectorAll('.standings-table tbody tr').forEach(row=>{
        const badge=row.querySelector('.round-avatar');
        const code=badge?.textContent?.trim();
        if (code && teamCodeFromName(code)) { row.dataset.team=teamCodeFromName(code); row.tabIndex=0; }
      });
      bindExtras();
    }
    if (view==='profile' && currentPlayer?.team) bindProfileTeam();
  }

  function bindProfileTeam() {
    const badge=root.querySelector('.jersey-badge');
    if (!badge || badge.dataset.teamBound) return;
    badge.dataset.teamBound='1'; badge.classList.add('team-link'); badge.title=`Apri ${team(currentPlayer.team).name}`;
    badge.addEventListener('click',event=>{event.stopPropagation();goTeam(currentPlayer.team)});
  }
  function goTeam(code) {
    if (!TEAM_INFO[code]) return;
    selectedTeam=code; previousView=view; view='team'; render(); window.scrollTo({top:0,behavior:'smooth'});
  }
  window.CAMPETTO_OPEN_TEAM = goTeam;
  function bindExtras() {
    root.querySelectorAll('[data-team]').forEach(button=>{
      if (button.dataset.teamBound) return;
      button.dataset.teamBound='1';
      button.addEventListener('click',event=>{event.stopPropagation();goTeam(button.dataset.team)});
      button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();goTeam(button.dataset.team)}});
    });
    root.querySelectorAll('.team-chip').forEach(chip=>{chip.classList.add('team-chip-link');chip.setAttribute('role','button');chip.setAttribute('tabindex','0')});
    const selector=root.querySelector('#leader-stat');
    if (selector) selector.addEventListener('change',()=>{activeStat=selector.value;render()});
    const search=root.querySelector('#leader-search');
    if (search) search.addEventListener('input',()=>{leadersQuery=search.value;const pos=search.selectionStart;render();const next=root.querySelector('#leader-search');next?.focus();next?.setSelectionRange(pos,pos)});
    const refresh=root.querySelector('#refresh-player-stats');
    if (refresh) refresh.addEventListener('click',()=>loadSeasonStats(true));
    root.querySelectorAll('[data-card-mode]').forEach(button=>button.addEventListener('click',()=>{cardMode=button.dataset.cardMode;render()}));
    root.querySelectorAll('.team-directory-card').forEach(button=>button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();goTeam(button.dataset.team)}}));
  }
  document.addEventListener('click',event=>{
    const chip=event.target.closest('.team-chip-link');
    if (!chip) return;
    const card=chip.closest('[data-player]');
    const player=card && playerById(card.dataset.player);
    const code=player?.team || chip.textContent.trim().split(/\s+/)[0];
    if (TEAM_INFO[code]) { event.preventDefault();event.stopImmediatePropagation();goTeam(code); }
  },true);

  function saveNotificationPreferences() {
    saveStorage(NOTICE_PREF_KEY,notificationPreferences);
    queueCloudSync();
    updateNotificationButton();
  }
  function updateNotificationButton() {
    const button=document.querySelector('.notification-button');
    if(!button)return;
    const unread=notifications.filter(item=>!item.read).length;
    button.setAttribute('aria-label',unread?`Notifiche, ${unread} non lette`:'Notifiche');
    button.classList.toggle('has-unread',unread>0);
    const dot=button.querySelector('i'); if(dot)dot.textContent=unread>9?'9+':'';
  }
  function closeNotificationCenter() {
    document.querySelector('#notification-center')?.remove();
    document.body.classList.remove('modal-open');
  }
  function renderNotificationCenter() {
    const unread=notifications.filter(item=>!item.read).length;
    const granted=typeof Notification!=='undefined'&&Notification.permission==='granted';
    const denied=typeof Notification!=='undefined'&&Notification.permission==='denied';
    const browserState=granted?'Notifiche browser attive':denied?'Permesso negato: abilitalo dalle impostazioni del browser':'Attiva le notifiche del browser';
    return `<div class="notice-backdrop" id="notification-center"><section class="notice-panel" role="dialog" aria-modal="true" aria-labelledby="notice-title"><div class="notice-heading"><div><div class="eyebrow">CAMPETTO · AVVISI</div><h2 id="notice-title">Notifiche</h2><p>${unread?`${unread} da leggere`:'Segui le partite delle tue squadre preferite.'}</p></div><button class="account-close" id="notice-close" aria-label="Chiudi">×</button></div><label class="notice-setting"><span><b>Avvisi nell’app</b><small>Partita iniziata e risultato finale per le squadre dei giocatori che segui.</small></span><input type="checkbox" id="notice-inapp" ${notificationPreferences.inApp?'checked':''}></label><div class="notice-browser"><span><b>Browser</b><small>Funziona mentre Campetto è aperto. Le notifiche anche a pagina chiusa richiedono un servizio push dedicato.</small></span><button class="secondary-button" id="notice-browser-enable" ${granted?'disabled':''}>${granted?'Attive':browserState}</button></div><div class="notice-list-head"><b>Centro notifiche</b><button class="text-button" id="notice-read-all" ${unread?'':'disabled'}>Segna tutte come lette</button></div><div class="notice-list">${notifications.length?notifications.slice(0,30).map(item=>`<article class="notice-item ${item.read?'':'unread'}"><i></i><div><b>${esc(item.title)}</b><p>${esc(item.text)}</p><small>${new Date(item.createdAt).toLocaleString(window.CAMPETTO_LOCALE?.()||'it-IT',{dateStyle:'short',timeStyle:'short'})}</small></div></article>`).join(''):'<div class="notice-empty">Ancora nessun avviso. Aggiungi un giocatore ai preferiti per seguire la sua squadra.</div>'}</div></section></div>`;
  }
  function openNotificationCenter() {
    closeNotificationCenter();
    document.body.insertAdjacentHTML('beforeend',renderNotificationCenter());
    document.body.classList.add('modal-open');
    document.querySelector('#notice-close')?.addEventListener('click',closeNotificationCenter);
    document.querySelector('#notification-center')?.addEventListener('click',event=>{if(event.target.id==='notification-center')closeNotificationCenter()});
    document.querySelector('#notice-inapp')?.addEventListener('change',event=>{notificationPreferences={...notificationPreferences,inApp:event.target.checked};saveNotificationPreferences()});
    if(typeof Notification!=='undefined'&&Notification.permission==='granted') {
      const enable=document.querySelector('#notice-browser-enable');if(enable){enable.disabled=true;enable.textContent='Permesso concesso'}
      const toggle=document.createElement('label');toggle.className='notice-toggle';toggle.innerHTML=`<input type="checkbox" id="notice-browser-toggle" ${notificationPreferences.browser?'checked':''}> <span>Mostra avvisi browser</span>`;
      document.querySelector('.notice-browser')?.appendChild(toggle);
      toggle.querySelector('input')?.addEventListener('change',event=>{notificationPreferences={...notificationPreferences,browser:event.target.checked};saveNotificationPreferences()});
    }
    document.querySelector('#notice-browser-enable')?.addEventListener('click',async event=>{
      if(typeof Notification==='undefined'){event.currentTarget.textContent='Browser non supportato';return}
      if(!window.isSecureContext){event.currentTarget.textContent='Serve HTTPS o localhost';return}
      if(Notification.permission==='denied'){event.currentTarget.textContent='Permesso negato nelle impostazioni';return}
      const permission=await Notification.requestPermission();
      notificationPreferences={...notificationPreferences,browser:permission==='granted'};saveNotificationPreferences();openNotificationCenter();
    });
    document.querySelector('#notice-read-all')?.addEventListener('click',()=>{notifications=notifications.map(item=>({...item,read:true}));saveStorage(NOTICE_KEY,notifications);openNotificationCenter();updateNotificationButton()});
  }
  function followedTeams() {
    return new Set(favorites.map(id=>playerById(id)?.team).filter(Boolean));
  }
  function publishNotice(title,text) {
    if(!notificationPreferences.inApp)return;
    const record={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title,text,createdAt:new Date().toISOString(),read:false};
    notifications=[record,...notifications].slice(0,30);saveStorage(NOTICE_KEY,notifications);updateNotificationButton();
    if(notificationPreferences.browser&&typeof Notification!=='undefined'&&Notification.permission==='granted') {
      try{new Notification(title,{body:text,icon:'https://a.espncdn.com/i/teamlogos/nba/500/nba.png',tag:record.id})}catch{}
    }
  }
  const originalLiveFeedLoader=loadLiveFeeds;
  let previousScoreboard=[];
  let liveRenderPending=false;
  function refreshLiveView() {
    if(!['home','games','game','news','standings','team','teams','favorites'].includes(view))return;
    if(root.contains(document.activeElement)&&document.activeElement.matches('input,select,textarea')){liveRenderPending=true;return}
    liveRenderPending=false;render();
  }
  document.addEventListener('focusout',()=>{if(liveRenderPending)setTimeout(refreshLiveView,0)});
  let liveFeedPending=null;
  loadLiveFeeds=async function(){
    if(liveFeedPending)return liveFeedPending;
    liveFeedPending=(async()=>{
    const old=previousScoreboard;
    await originalLiveFeedLoader();
    const watched=followedTeams();
    if(old.length&&watched.size)for(const game of games){
      const key=[game.away,game.home].sort().join('-'),before=old.find(item=>[item.away,item.home].sort().join('-')===key);
      if(!before)continue;
      const favoriteTeam=watched.has(game.home)?game.home:watched.has(game.away)?game.away:'';
      if(!favoriteTeam)continue;
      const started=/in progress|live|in corso|halftime/i.test(game.status)&&!/in progress|live|in corso|halftime/i.test(before.status);
      const ended=/final|terminat|finale/i.test(game.status)&&!/final|terminat|finale/i.test(before.status);
      if(started)publishNotice(`È iniziata ${team(favoriteTeam).name}`,`${game.away} · ${game.home} è in corso.`);
      if(ended)publishNotice(`Finale: ${game.away} ${game.awayScore} – ${game.homeScore} ${game.home}`,`Partita conclusa · ${team(favoriteTeam).name}.`);
    }
    previousScoreboard=games.map(game=>({...game}));
    if(selectedGame?.id){
      const id=String(selectedGame.id),latest=games.find(game=>String(game.id)===id);
      if(latest)selectedGame=latest;
      if(view==='game')try{
        const details=await window.CAMPETTO_GAME_SUMMARY(id);
        if(String(selectedGame?.id)===id)selectedGameDetails=details;
      }catch(error){console.info('Aggiornamento tabellino:',error.message)}
    }
    refreshLiveView();
    })().finally(()=>{liveFeedPending=null});
    return liveFeedPending;
  };
  const originalRosterApply=applyRosterPlayers;
  applyRosterPlayers=function(players){originalRosterApply(players);if(statsState==='ready')applyStatsRows(readStorage(`${EXTRA_STATS_KEY}-${seasonId()}`,{})?.rows||[],lastStatsUpdate||Date.now())};
  document.querySelector('.notification-button')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openNotificationCenter()},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('#notification-center'))closeNotificationCenter()});
  document.addEventListener('click',event=>{
    const nav=event.target.closest('.nav-link[data-view="cards"]');
    if(nav){event.preventDefault();event.stopImmediatePropagation();view='cards';render()}
  },true);

  function compactPlayerOverview(player) {
    const t=team(player.team), source=player.statsSource==='ESPN'?'medie ESPN per partita':player.statsSource==='Campetto'?'dati rookie inseriti in Campetto':'in attesa del feed stagionale';
    return `<div class="profile-main-grid"><section class="panel bio-card"><div class="panel-head"><h3>Profilo giocatore</h3><span>${player.active?'NBA attuale':'Storia NBA'}</span></div><p>${esc(player.bio||`${player.name} gioca con ${t.name}.`)}</p><div class="bio-facts"><div class="bio-fact"><span>SQUADRA</span><button class="text-button profile-team-link" data-team="${esc(player.team)}">${esc(t.name)} ↗</button></div><div class="bio-fact"><span>POSIZIONE</span><b>${esc(player.position)} · #${esc(player.number)}</b></div>${(window.CAMPETTO_PLAYER_DETAILS?.facts(player)||[]).map(([label,value])=>`<div class="bio-fact"><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('')}</div><div class="social-links">${Object.entries(player.social||{}).map(([name,url])=>`<a class="social-link" href="${esc(url)}" target="_blank" rel="noreferrer">↗ &nbsp;${esc(name)}</a>`).join('')}<button class="social-link" data-profile-tab="Videos">▶ &nbsp;Guarda highlights</button></div></section><section class="panel"><div class="panel-head"><h3>Confronto rapido</h3><button class="text-button" data-compare="${esc(player.id)}">Tutti&nbsp; →</button></div>${compareCards(player,3)}<p class="data-note" style="margin-top:12px">Statistiche stagionali: ${source}.</p></section></div><section class="section-block"><div class="section-head"><div><h2 class="section-title">Statistiche principali</h2><p class="section-sub">Medie per partita · ${player.active?`stagione ${seasonLabel()}`:'carriera'} · ${formatUpdate()}</p></div><button class="text-button" data-profile-tab="Stats">Tutte le statistiche&nbsp; →</button></div><div class="panel table-panel"><div class="stats-table-wrap"><table class="stats-table"><thead><tr>${STAT_HEADERS.map(([,label])=>`<th>${label}</th>`).join('')}</tr></thead><tbody><tr>${STAT_HEADERS.map(([key])=>`<td class="${['pts','reb','ast'].includes(key)?'strong-cell':''}">${esc(statOf(player,key))}</td>`).join('')}</tr></tbody></table></div></div></section>`;
  }
  function accurateProfileStats(player) {
    return `<section><div class="section-head"><div><h2 class="section-title">Statistiche complete</h2><p class="section-sub">${esc(player.name)} · ${player.active?`stagione ${seasonLabel()}, medie per partita`:'medie in carriera'} · ${formatUpdate()}</p></div></div><div class="panel table-panel"><div class="stats-table-wrap"><table class="stats-table"><thead><tr>${STAT_HEADERS.map(([,label])=>`<th>${label}</th>`).join('')}</tr></thead><tbody><tr>${STAT_HEADERS.map(([key])=>`<td class="${['pts','reb','ast'].includes(key)?'strong-cell':''}">${esc(statOf(player,key))}</td>`).join('')}</tr></tbody></table></div></div><p class="data-note" style="margin-top:8px">Le statistiche vengono aggiornate dal feed ESPN quando disponibile. Alcuni campi non sono forniti dal feed e restano indicati con —.</p></section><section class="section-block"><div class="section-head"><div><h2 class="section-title">Produzione stagionale</h2><p class="section-sub">I principali numeri della stagione.</p></div></div><div class="feature-strip">${[['PTS',player.stats.pts,'Punti a partita'],['REB',player.stats.reb,'Rimbalzi a partita'],['AST',player.stats.ast,'Assist a partita'],['FG%',player.stats.fgp,'Dal campo']].map(([label,value,note])=>`<div class="strip-card"><span class="strip-icon">${label==='PTS'?'◉':label==='REB'?'↻':label==='AST'?'↗':'◎'}</span><div><b>${esc(value)}</b><span>${note}</span></div></div>`).join('')}</div></section>`;
  }
  function bindProfileTeam() {}

  function gameTeamStats(details, code) {
    const rows = details?.boxscore?.teams || [];
    return rows.find(item => String(item.team?.abbreviation || '').toUpperCase() === code)?.statistics || [];
  }
  function gamePlayerStats(details, code) {
    const teamBox = (details?.boxscore?.players || []).find(item => String(item.team?.abbreviation || '').toUpperCase() === code);
    const groups = teamBox?.statistics || [];
    return groups.flatMap(group => (group.athletes || []).map(entry => ({
      athlete: entry.athlete || {},
      labels: group.labels || group.names || [],
      stats: entry.stats || [],
      starter: !!entry.starter,
      didNotPlay: entry.didNotPlay || (!(entry.stats || []).length ? entry.reason || '' : '')
    })));
  }
  function gameTeamStatValue(stats, label) {
    const row = stats.find(item => String(item.name || item.displayName || '').toLowerCase().includes(label));
    return row?.displayValue ?? row?.value ?? '—';
  }
  function renderGameDetails() {
    const game = selectedGame;
    if (!game) return '<div class="empty-state">Partita non trovata.</div>';
    const away = game.away, home = game.home;
    const awayName = team(away).name, homeName = team(home).name;
    const details = selectedGameDetails;
    const event = details?.header?.competitions?.[0] || details?.boxscore?.header?.competitions?.[0] || {};
    const awayRecord = game.awayRecord || event.competitors?.find(item => item.team?.abbreviation === away)?.records?.[0]?.summary || '';
    const homeRecord = game.homeRecord || event.competitors?.find(item => item.team?.abbreviation === home)?.records?.[0]?.summary || '';
    const awayTeamStats = gameTeamStats(details, away), homeTeamStats = gameTeamStats(details, home);
    const awayPlayers = gamePlayerStats(details, away), homePlayers = gamePlayerStats(details, home);
    const allLabels = [...new Set([...awayPlayers, ...homePlayers].flatMap(row => row.labels))];
    const valueFor = (row, label) => row.labels.indexOf(label) >= 0 ? (row.stats[row.labels.indexOf(label)] ?? '—') : '—';
    const statTable = (code, rows) => `<div class="game-boxscore-scroll"><table class="game-boxscore"><thead><tr><th>Giocatore</th>${allLabels.map(label => `<th>${esc(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr><td><b>${esc(row.athlete.displayName || row.athlete.fullName || 'Giocatore')}</b>${row.starter ? '<small>Titolare</small>' : ''}${row.didNotPlay?`<small>${esc(typeof row.didNotPlay==='string'?row.didNotPlay:'Non entrato')}</small>`:''}</td>${allLabels.map(label => `<td>${esc(row.didNotPlay&&!row.stats.length?'DNP':valueFor(row,label))}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${allLabels.length + 1}" class="leader-empty">${selectedGameLoading?'Caricamento statistiche…':'Tabellino giocatori non disponibile per questa partita.'}</td></tr>`}</tbody></table></div>`;
    const lineScore = (game.awayLinescores?.length || game.homeLinescores?.length) ? `<div class="game-period-table"><div><b>Squadra</b><b>1</b><b>2</b><b>3</b><b>4</b><b>Tot</b></div>${[[away,game.awayLinescores,game.awayScore],[home,game.homeLinescores,game.homeScore]].map(([code,periods,score])=>`<div><span>${esc(team(code).name)}</span>${[0,1,2,3].map(index=>`<span>${esc(periods?.[index] ?? '—')}</span>`).join('')}<strong>${esc(score??'—')}</strong></div>`).join('')}</div>` : '';
    const tabs = [['box','Tabellino'],[away,awayName],[home,homeName],['team','Statistiche squadre']];
    let content = '';
    if (selectedGameTab === 'box') content = `<div class="game-detail-columns"><section class="panel game-team-box"><div class="panel-head"><h3>${esc(awayName)}</h3><span>${esc(awayRecord)}</span></div>${statTable(away,awayPlayers)}</section><section class="panel game-team-box"><div class="panel-head"><h3>${esc(homeName)}</h3><span>${esc(homeRecord)}</span></div>${statTable(home,homePlayers)}</section></div>`;
    else if (selectedGameTab === away || selectedGameTab === home) content = `<section class="panel game-team-box"><div class="panel-head"><h3>${esc(team(selectedGameTab).name)}</h3><span>${selectedGameTab===away?game.awayScore:game.homeScore} punti</span></div>${statTable(selectedGameTab, selectedGameTab===away?awayPlayers:homePlayers)}</section>`;
    else content = `<section class="panel"><div class="panel-head"><h3>Statistiche di squadra</h3><span>Feed ESPN</span></div><div class="game-team-stats-grid">${[[away,awayTeamStats],[home,homeTeamStats]].map(([code,stats])=>`<article><h3>${safeLogo(code)} ${esc(team(code).name)}</h3>${stats.map(stat=>`<div><span>${esc(stat.displayName||stat.name||'Statistica')}</span><b>${esc(stat.displayValue||stat.value||'—')}</b></div>`).join('')||'<p class="data-note">Statistiche squadra non disponibili.</p>'}</article>`).join('')}</div></section>`;
    return `<section class="page-heading game-detail-heading"><div><button class="back-link" data-view="games">← &nbsp;Tutte le partite</button><div class="eyebrow">NBA · ${esc(game.status || 'Partita')}</div><h1>${esc(awayName)} – ${esc(homeName)}</h1><p class="section-sub">${esc(game.venue || '')}${game.date ? ` · ${new Date(game.date).toLocaleString(window.CAMPETTO_LOCALE?.()||'it-IT',{dateStyle:'medium',timeStyle:'short'})}` : ''}</p></div><span class="data-note">Dati ESPN${game.headline?` · ${esc(game.headline)}`:''}</span></section><section class="game-scoreboard"><div class="game-status-pill">${esc(game.status||'Partita')}</div><div class="game-score-team">${`<img class="game-detail-logo" src="${esc(logoUrl(away))}" alt="" onerror="this.style.display='none'">`}<b>${esc(awayName)}</b><small>${esc(away)}${awayRecord?` · ${esc(awayRecord)}`:''}</small></div><div class="game-score-center"><strong>${esc(game.awayScore??'—')} <i>:</i> ${esc(game.homeScore??'—')}</strong><small>${game.clock&&game.period?`Q${esc(game.period)} · ${esc(game.clock)}`:esc(game.status||'Finale')}</small></div><div class="game-score-team">${`<img class="game-detail-logo" src="${esc(logoUrl(home))}" alt="" onerror="this.style.display='none'">`}<b>${esc(homeName)}</b><small>${esc(home)}${homeRecord?` · ${esc(homeRecord)}`:''}</small></div><div class="game-final-label">${esc(game.status||'Partita')}</div></section>${lineScore}<nav class="game-tabs" aria-label="Statistiche partita">${tabs.map(([key,label])=>`<button class="${selectedGameTab===key?'active':''}" data-game-tab="${esc(key)}">${esc(label)}</button>`).join('')}</nav>${selectedGameLoading?'<div class="loading">Sto caricando il tabellino ufficiale disponibile…</div>':''}${content}<p class="data-note game-detail-note">Statistiche per singola partita presenti quando ESPN pubblica il box score. I campi mancanti nel feed restano vuoti.</p>`;
  }
  const gameSummaryCache = new Map();
  window.CAMPETTO_GAME_SUMMARY = function(id) {
    const key=String(id);
    const existing=gameSummaryCache.get(key);
    if(existing&&(existing.pending||Date.now()-existing.updatedAt<existing.ttl))return existing.promise;
    const entry={pending:true,updatedAt:Date.now(),ttl:60000,promise:null};
    entry.promise=fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${encodeURIComponent(id)}`,{signal:AbortSignal.timeout(20000)})
      .then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json()})
      .then(data=>{entry.pending=false;entry.updatedAt=Date.now();entry.ttl=data.header?.competitions?.[0]?.status?.type?.completed?5*60000:60000;return data})
      .catch(error=>{gameSummaryCache.delete(key);throw error});
    gameSummaryCache.set(key,entry);
    if(gameSummaryCache.size>100)gameSummaryCache.delete(gameSummaryCache.keys().next().value);
    return entry.promise;
  };
  async function openGame(id, teamTab) {
    const game = id && typeof id==='object' ? id : games.find(item => String(item.id || `${item.away}-${item.home}`) === String(id)) || games.find(item => `${item.away}-${item.home}` === String(id));
    if (!game) return;
    selectedGame = game; selectedGameDetails = null; selectedGameTab = [game.home,game.away].includes(teamTab)?teamTab:'box'; selectedGameLoading = !!game.id; view = 'game'; render();
    if (!game.id) return;
    try {
      const details = await window.CAMPETTO_GAME_SUMMARY(game.id);
      if(selectedGame?.id===game.id)selectedGameDetails=details;
    } catch (error) { console.info('Tabellino partita non disponibile:', error); }
    finally { if(selectedGame?.id===game.id){selectedGameLoading=false;if(view==='game')render()} }
  }
  window.CAMPETTO_OPEN_GAME = openGame;
  function renderCampettoNews() {
    const items = window.NEWS_ITEMS || [];
    const [featured,...rest] = items;
    if (!featured) return '<div class="empty-state">Le notizie NBA arriveranno con il feed.</div>';
    const headlines = rest.slice(0,7);
    return `<section class="news-page-intro"><div><div class="eyebrow">NBA · News</div><h1>Ultime notizie NBA</h1><p>Storie, risultati e aggiornamenti dalla lega.</p></div><span class="news-live-label" data-no-translate><i></i>${esc(window.CAMPETTO_NEWS?.statusLabel()||'ESPN')}</span></section><div class="news-editorial-layout"><a class="news-lead" href="${esc(featured.sourceUrl||'#')}" target="_blank" rel="noreferrer" style="--news-image:url('${esc(featured.image)}')"><span class="news-kicker">${esc(featured.tag||'NBA · ESPN')}</span><div><small>IN PRIMO PIANO</small><h2>${esc(featured.title)}</h2><p>${esc(featured.summary)}</p><b>Leggi la notizia&nbsp; ↗</b></div></a><aside class="news-headlines"><div class="panel-head"><h2>In breve</h2><span>${items.length} notizie</span></div>${headlines.map((item,index)=>`<a class="news-headline" href="${esc(item.sourceUrl||'#')}" target="_blank" rel="noreferrer"><span>${String(index+1).padStart(2,'0')}</span><b>${esc(item.title)}</b><i>↗</i></a>`).join('')}</aside></div><section class="section-block news-stories"><div class="section-head"><div><h2 class="section-title">Storie NBA</h2><p class="section-sub">Le ultime notizie selezionate dal feed ESPN.</p></div></div><div class="news-story-grid">${items.slice(1).map(item=>`<a class="news-story-card" href="${esc(item.sourceUrl||'#')}" target="_blank" rel="noreferrer"><div class="news-story-image"><img src="${esc(item.image)}" alt="" loading="lazy"><span>NBA · ESPN</span></div><div><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p><b>Leggi la notizia&nbsp; ↗</b></div></a>`).join('')}</div></section>`;
  }

  // Account e preferenze sincronizzati con Supabase; le password non vengono mai salvate da Campetto.
  const LOCAL_PROFILE_OWNER_KEY='campetto-local-profile-owner-v1';
  const GUEST_PROFILE_KEY='campetto-guest-profile-v1';
  const USER_PROFILE_PREFIX='campetto-local-user-v1-';
  let pendingGuestProfile=null;
  let cloudRefreshPromise=null;
  let accountReturnFocus=null;
  const accountSlots=['PG','SG','SF','PF','C'];
  function localProfileSnapshot() {
    return {favorites:[...favorites],roster:{...lineup,_prices:readStorage('campetto-purchase-prices-v1',{}),_captain:readStorage('campetto-captain-v1','')},joined,notification_preferences:{...notificationPreferences},notifications:[...notifications]};
  }
  function applyLocalProfile(saved={}) {
    const savedRoster=saved.roster&&typeof saved.roster==='object'?saved.roster:{};
    favorites=Array.isArray(saved.favorites)?[...new Set(saved.favorites.filter(id=>typeof id==='string'))]:[];
    lineup=Object.fromEntries(accountSlots.filter(slot=>typeof savedRoster[slot]==='string').map(slot=>[slot,savedRoster[slot]]));
    roster={...lineup,_prices:savedRoster._prices&&typeof savedRoster._prices==='object'?savedRoster._prices:{},_captain:typeof savedRoster._captain==='string'?savedRoster._captain:''};
    joined=!!saved.joined;
    notificationPreferences={inApp:true,browser:false,...(saved.notification_preferences||{})};
    notifications=Array.isArray(saved.notifications)?saved.notifications:[];
    saveStorage(KEY_FAV,favorites);saveStorage(KEY_ROSTER,roster);saveStorage(KEY_JOINED,joined);
    saveStorage('campetto-lineup-v2',lineup);saveStorage('campetto-purchase-prices-v1',roster._prices);saveStorage('campetto-captain-v1',roster._captain);
    saveStorage(NOTICE_PREF_KEY,notificationPreferences);saveStorage(NOTICE_KEY,notifications);
    window.CAMPETTO_FANTASY_IMPORT?.(roster);
    updateNotificationButton();
  }
  function prepareLocalAccount(session) {
    const owner=readStorage(LOCAL_PROFILE_OWNER_KEY,'');
    if(owner===session.user.id)return;
    applyLocalProfile(readStorage(`${USER_PROFILE_PREFIX}${session.user.id}`,{}));
    saveStorage(LOCAL_PROFILE_OWNER_KEY,session.user.id);
  }
  function ensureAccountModal() {
    let modal=document.querySelector('#account-modal');
    if (modal) return modal;
    modal=document.createElement('div'); modal.id='account-modal'; modal.className='account-overlay'; modal.hidden=true;
    modal.innerHTML='<section class="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title"><button class="account-close" id="account-close" aria-label="Chiudi">×</button><div id="account-content"></div></section>';
    document.body.appendChild(modal);
    modal.addEventListener('click',event=>{if(event.target===modal)closeAccountModal()});
    modal.querySelector('#account-close').addEventListener('click',closeAccountModal);
    document.addEventListener('keydown',event=>{
      if(modal.hidden)return;
      if(event.key==='Escape'){event.preventDefault();closeAccountModal();return}
      if(event.key!=='Tab')return;
      const focusable=[...modal.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>element.offsetParent!==null);
      const first=focusable[0],last=focusable.at(-1);
      if(!first)return;
      if(!modal.contains(document.activeElement)||(!event.shiftKey&&document.activeElement===last)){event.preventDefault();first.focus()}
      else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    });
    return modal;
  }
  function accountHtml() {
    const configured=cloudReady();
    if(!configured)return '<div class="eyebrow">CAMPETTO · PROFILO</div><h2 id="account-title">Il tuo Campetto</h2><div class="account-config-note">Account online in preparazione. Preferiti e quintetto restano salvati in questo browser.</div><p class="account-subtitle">Puoi continuare a esplorare Campetto e costruire la tua squadra.</p><button class="primary-button account-submit" id="account-continue">Continua a esplorare</button>';
    if (cloudSession?.access_token&&accountMode!=='new-password') return `<div class="eyebrow">PROFILO CAMPETTO</div><h2 id="account-title">Il mio profilo</h2><p class="account-subtitle">Preferiti e quintetto sono associati al tuo account.</p><div class="account-user-card"><span class="account-avatar">${esc((cloudSession.user?.email||'CA').slice(0,2).toUpperCase())}</span><div><b>${esc(cloudSession.user?.email||'Account Campetto')}</b><small>${esc(cloudMessage||'Account connesso')}</small></div></div><div class="account-cloud-status ready"><i></i>Account collegato</div><button class="primary-button account-submit" id="account-signout" ${cloudBusy?'disabled':''}>Esci dal profilo</button>`;
    const isRecover=accountMode==='recover', isNew=accountMode==='new-password';
    const heading=isRecover?'Recupera password':isNew?'Scegli una nuova password':accountMode==='signup'?'Crea il tuo profilo':'Accedi a Campetto';
    const warning='';
    return `<div class="eyebrow">CAMPETTO · PROFILO</div><h2 id="account-title">${heading}</h2><p class="account-subtitle">Salva i tuoi giocatori preferiti e il quintetto con il tuo account.</p>${warning?`<div class="account-config-note">${warning}</div>`:''}<div class="account-tabs">${!isRecover&&!isNew?`<button data-auth-mode="login" class="${accountMode==='login'?'active':''}">Accedi</button><button data-auth-mode="signup" class="${accountMode==='signup'?'active':''}">Crea profilo</button>`:''}</div><form id="account-form">${!isNew?`<label>Email<input id="account-email" type="email" autocomplete="email" placeholder="nome@email.com" required></label>`:''}${!isRecover&&!isNew?`<label>Password<input id="account-password" type="password" autocomplete="${accountMode==='signup'?'new-password':'current-password'}" placeholder="Almeno 8 caratteri" minlength="8" required></label>`:''}${isNew?`<label>Nuova password<input id="account-new-password" type="password" autocomplete="new-password" placeholder="Almeno 8 caratteri" minlength="8" required></label>`:''}<div class="account-message" role="status" aria-live="polite">${esc(cloudMessage)}</div><button class="primary-button account-submit" type="submit" ${!configured||cloudBusy?'disabled':''}>${cloudBusy?'Attendi…':isRecover?'Invia link di recupero':isNew?'Salva la nuova password':accountMode==='signup'?'Crea account':'Accedi'}</button></form>${accountMode==='login'?'<button class="account-link" data-auth-mode="recover">Ho dimenticato la password</button>':''}${isRecover||isNew?'<button class="account-link" data-auth-mode="login">Torna all’accesso</button>':''}`;
  }
  function showAccountModal(mode) {
    if (mode) accountMode=mode;
    const modal=ensureAccountModal();
    if(modal.hidden)accountReturnFocus=document.activeElement;
    modal.hidden=false; document.body.classList.add('modal-open');
    document.querySelector('#account-content').innerHTML=accountHtml();
    bindAccountModal();
    requestAnimationFrame(()=>{if(!modal.hidden)(document.querySelector('#account-email')||document.querySelector('#account-new-password')||document.querySelector('#account-continue')||document.querySelector('#account-close'))?.focus()});
  }
  function closeAccountModal() { const modal=document.querySelector('#account-modal'); if(modal){modal.hidden=true;document.body.classList.remove('modal-open');if(accountReturnFocus?.isConnected)accountReturnFocus.focus()} }
  window.CAMPETTO_OPEN_ACCOUNT = showAccountModal;
  function bindAccountModal() {
    const content=document.querySelector('#account-content');
    content.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>{cloudMessage='';showAccountModal(button.dataset.authMode)}));
    content.querySelector('#account-continue')?.addEventListener('click',closeAccountModal);
    const form=content.querySelector('#account-form');
    if(form) form.addEventListener('submit',submitAccountForm);
    const signout=content.querySelector('#account-signout');
    if(signout) signout.addEventListener('click',signOut);
  }
  function setAccountMessage(message) {
    cloudMessage=message;
    const slot=document.querySelector('.account-message');
    if(slot) slot.textContent=message;
    const userStatus=document.querySelector('.account-user-card small');
    if(userStatus) userStatus.textContent=message;
  }
  async function authFetch(path, body, method='POST') {
    const response=await fetch(`${supabaseConfig().url.replace(/\/$/,'')}/auth/v1/${path}`,{method,headers:{'Content-Type':'application/json',apikey:supabaseConfig().anonKey},body:body?JSON.stringify(body):undefined});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) {const error=new Error(data.msg||data.message||data.error_description||data.error||'Operazione non riuscita. Controlla i dati e riprova.');error.status=response.status;throw error}
    return data;
  }
  function saveCloudSession(session) {
    if (!session?.access_token) {
      clearTimeout(syncTimer);
      const owner=cloudSession?.user?.id||readStorage(LOCAL_PROFILE_OWNER_KEY,'');
      if(owner&&owner!=='guest')saveStorage(`${USER_PROFILE_PREFIX}${owner}`,localProfileSnapshot());
      const hadAccount=!!cloudSession?.access_token||(owner&&owner!=='guest');
      cloudSession=null;pendingGuestProfile=null;
      try{localStorage.removeItem(AUTH_KEY)}catch{}
      if(hadAccount)applyLocalProfile(readStorage(GUEST_PROFILE_KEY,{}));
      saveStorage(LOCAL_PROFILE_OWNER_KEY,'guest');
      document.dispatchEvent(new CustomEvent('campetto:account'));
      return;
    }
    if(!cloudSession?.access_token) {
      const owner=readStorage(LOCAL_PROFILE_OWNER_KEY,'guest');
      if(owner==='guest') {
        pendingGuestProfile=localProfileSnapshot();
        saveStorage(GUEST_PROFILE_KEY,pendingGuestProfile);
      }
    } else if(cloudSession.user?.id&&session.user?.id&&cloudSession.user.id!==session.user.id) {
      saveStorage(`${USER_PROFILE_PREFIX}${cloudSession.user.id}`,localProfileSnapshot());
    }
    cloudSession={...session,expires_at:session.expires_at||Math.floor(Date.now()/1000)+Number(session.expires_in||3600)};
    saveStorage(AUTH_KEY,cloudSession);
    document.dispatchEvent(new CustomEvent('campetto:account'));
  }
  async function validSession() {
    if(!cloudSession?.access_token) return null;
    if(Number(cloudSession.expires_at||0)>Math.floor(Date.now()/1000)+90) return cloudSession;
    if(!cloudSession.refresh_token) {saveCloudSession(null);render();return null}
    if(cloudRefreshPromise)return cloudRefreshPromise;
    const refreshToken=cloudSession.refresh_token;
    cloudRefreshPromise=(async()=>{
      try {
        const refreshed=await authFetch('token?grant_type=refresh_token',{refresh_token:refreshToken});
        if(cloudSession?.refresh_token!==refreshToken)return cloudSession;
        saveCloudSession(refreshed);return cloudSession;
      } catch(error) {
        if([400,401,403].includes(error.status)&&cloudSession?.refresh_token===refreshToken){saveCloudSession(null);render();throw new Error('La sessione è scaduta. Accedi di nuovo.')}
        throw error;
      } finally {cloudRefreshPromise=null}
    })();
    return cloudRefreshPromise;
  }
  async function apiCloud(path, options={}) {
    const session=await validSession();
    if(!session) throw new Error('La sessione è scaduta. Accedi di nuovo.');
    const response=await fetch(`${supabaseConfig().url.replace(/\/$/,'')}/rest/v1/${path}`,{...options,headers:{apikey:supabaseConfig().anonKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal',...(options.headers||{})}});
    if(!response.ok) { const data=await response.json().catch(()=>({})); throw new Error(data.message||'Non è stato possibile sincronizzare il profilo.'); }
    return response.status===204?null:response.json().catch(()=>null);
  }
  async function loadCloudProfile() {
    const session=await validSession(); if(!session?.user?.id) return;
    if(cloudSession?.user?.id!==session.user.id)return;
    // Refresh display metadata as it may have changed on another device.
    try {
      const response=await fetch(`${supabaseConfig().url.replace(/\/$/,'')}/auth/v1/user`,{headers:{apikey:supabaseConfig().anonKey,Authorization:`Bearer ${session.access_token}`},signal:AbortSignal.timeout(12000)});
      if(response.ok){const user=await response.json();if(user.id===session.user.id&&cloudSession?.user?.id===user.id)saveCloudSession({...cloudSession,user})}
    } catch { /* Saved metadata remains available while offline. */ }
    if(cloudSession?.user?.id!==session.user.id)return;
    prepareLocalAccount(session);
    const rows=await apiCloud(`user_profiles?select=favorites,roster,joined,notification_preferences&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`,{headers:{Prefer:'return=representation'}});
    if(cloudSession?.user?.id!==session.user.id)return;
    const row=Array.isArray(rows)?rows[0]:null;
    if(row) {
      applyLocalProfile({...row,notifications});
    } else {
      if(pendingGuestProfile)applyLocalProfile(pendingGuestProfile);
      await syncCloudProfile();
    }
    pendingGuestProfile=null;
    saveStorage(`${USER_PROFILE_PREFIX}${session.user.id}`,localProfileSnapshot());
    render();
  }
  function queueCloudSync() {
    if(!cloudSession?.access_token) {saveStorage(GUEST_PROFILE_KEY,localProfileSnapshot());saveStorage(LOCAL_PROFILE_OWNER_KEY,'guest');return}
    if(cloudSession.user?.id)saveStorage(`${USER_PROFILE_PREFIX}${cloudSession.user.id}`,localProfileSnapshot());
    if(!cloudReady())return;
    clearTimeout(syncTimer); syncTimer=setTimeout(()=>syncCloudProfile().catch(error=>{console.info('Sincronizzazione cloud non riuscita:',error);cloudMessage='Sincronizzazione in attesa: controlla la connessione.'}),800);
  }
  window.CAMPETTO_SYNC_PROFILE = queueCloudSync;
  // Only public account details cross this bridge; tokens stay inside auth code.
  window.CAMPETTO_ACCOUNT = {
    getState:()=>({connected:!!cloudSession?.access_token,id:cloudSession?.user?.id||'',email:cloudSession?.user?.email||'',confirmed:!!cloudSession?.user?.email_confirmed_at,metadata:{...(cloudSession?.user?.user_metadata||{})}}),
    signOut:()=>signOut(),
    async updateDetails(details) {
      const session=await validSession();
      if(!session?.user?.id)throw new Error('La sessione è scaduta. Accedi di nuovo.');
      const name=String(details.name||'').trim().slice(0,40),teamCode=String(details.team||'');
      const data={display_name:name,favorite_team:Object.hasOwn(TEAM_INFO,teamCode)?teamCode:''};
      const response=await fetch(`${supabaseConfig().url.replace(/\/$/,'')}/auth/v1/user`,{method:'PUT',headers:{apikey:supabaseConfig().anonKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({data}),signal:AbortSignal.timeout(15000)});
      const user=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error('Non è stato possibile salvare il profilo online. Controlla la connessione e riprova.');
      if(cloudSession?.user?.id!==session.user.id)throw new Error('L’account è cambiato. Riprova dal tuo profilo.');
      saveCloudSession({...cloudSession,user:user.id?user:user.user||session.user});
      return this.getState();
    }
  };
  async function syncCloudProfile() {
    const session=await validSession(); if(!session?.user?.id || !cloudReady()) return;
    saveStorage(`${USER_PROFILE_PREFIX}${session.user.id}`,localProfileSnapshot());
    await apiCloud('user_profiles?on_conflict=user_id',{method:'POST',body:JSON.stringify({user_id:session.user.id,favorites,roster,joined,notification_preferences:notificationPreferences,updated_at:new Date().toISOString()})});
    if(cloudSession?.user?.id!==session.user.id)return;
    cloudMessage=`Sincronizzato · ${new Date().toLocaleTimeString(window.CAMPETTO_LOCALE?.()||'it-IT',{hour:'2-digit',minute:'2-digit'})}`;
    if(!document.querySelector('#account-modal')?.hidden&&accountMode!=='new-password') showAccountModal();
  }
  async function submitAccountForm(event) {
    event.preventDefault();
    if(cloudBusy)return;
    if(!cloudReady()) { setAccountMessage('Account online in preparazione. Preferiti e quintetto restano salvati in questo browser.'); return; }
    const email=document.querySelector('#account-email')?.value.trim();
    const password=document.querySelector('#account-password')?.value;
    const nextPassword=document.querySelector('#account-new-password')?.value;
    cloudMessage='';cloudBusy=true; showAccountModal(accountMode);
    try {
      if(accountMode==='recover') {
        const redirect=`${location.origin}${location.pathname}`;
        await authFetch(`recover?redirect_to=${encodeURIComponent(redirect)}`,{email});
        cloudBusy=false;accountMode='login';showAccountModal();setAccountMessage('Se l’indirizzo è registrato, riceverai un link per reimpostare la password.');return;
      }
      if(accountMode==='new-password') {
        const session=await validSession();
        if(!session) throw new Error('Il link di recupero non è valido o è scaduto. Richiedine uno nuovo.');
        const response=await fetch(`${supabaseConfig().url.replace(/\/$/,'')}/auth/v1/user`,{method:'PUT',headers:{apikey:supabaseConfig().anonKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({password:nextPassword})});
        const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||'Non è stato possibile aggiornare la password.');
        saveCloudSession({...session,user:data.id?data:data.user||session.user});
        try{await loadCloudProfile()}catch{cloudMessage='La sincronizzazione del profilo riprenderà al prossimo aggiornamento.'}
        accountMode='login';cloudBusy=false;render();showAccountModal();setAccountMessage('Password aggiornata. Il tuo account è connesso.');return;
      }
      const personalDetails=window.CAMPETTO_LOCAL_PROFILE?.get()||{};
      const result=accountMode==='signup'?await authFetch('signup',{email,password,data:{display_name:String(personalDetails.name||'').trim().slice(0,40),favorite_team:Object.hasOwn(TEAM_INFO,personalDetails.team)?personalDetails.team:''}}):await authFetch('token?grant_type=password',{email,password});
      if(result.access_token) {
        saveCloudSession({...result,user:result.user||result});
        let profileLoaded=true;
        try { await loadCloudProfile(); }
        catch(error) { console.info('Caricamento profilo cloud:',error);profileLoaded=false; }
        accountMode='login';cloudBusy=false;
        if(window.CAMPETTO_OPEN_PROFILE){closeAccountModal();window.CAMPETTO_OPEN_PROFILE();notify(profileLoaded?'Account connesso':'Accesso riuscito. Sincronizzazione in attesa: controlla la connessione.')}
        else {render();showAccountModal();setAccountMessage(profileLoaded?`Connesso come ${email}`:'Accesso riuscito. Sincronizzazione in attesa: controlla la connessione.')}
      } else {
        accountMode='login';cloudBusy=false;showAccountModal();setAccountMessage('Account creato. Controlla la posta e conferma il tuo indirizzo email, poi accedi.');
      }
    } catch(error) { cloudBusy=false;showAccountModal(accountMode);setAccountMessage(error.message||'Si è verificato un errore. Riprova.'); }
  }
  async function signOut() {
    clearTimeout(syncTimer);
    try {
      if(cloudReady()&&cloudSession?.access_token) {
        await syncCloudProfile().catch(()=>{});
        if(cloudSession?.access_token)await fetch(`${supabaseConfig().url.replace(/\/$/,'')}/auth/v1/logout`,{method:'POST',headers:{apikey:supabaseConfig().anonKey,Authorization:`Bearer ${cloudSession.access_token}`}});
      }
    } catch {}
    saveCloudSession(null);cloudMessage='';closeAccountModal();render();notify('Hai effettuato la disconnessione.');
  }
  async function openRecoveryFromCallback() {
    const params=new URLSearchParams(location.search);
    const hash=new URLSearchParams(location.hash.replace(/^#/,'').replace(/^\?/,'').replace(/&amp;/g,'&'));
    const tokenHash=params.get('token_hash')||params.get('token');
    const token=hash.get('access_token');
    const type=params.get('type')||hash.get('type');
    if(!token&&!(type==='recovery'&&tokenHash))return;
    for(const name of ['token_hash','token','type','access_token','refresh_token','expires_in','expires_at'])params.delete(name);
    history.replaceState({},document.title,`${location.pathname}${params.toString()?`?${params}`:''}`);
    if(!cloudReady()){showAccountModal('login');return}
    try {
      let session;
      if(token) {
        const response=await fetch(`${supabaseConfig().url.replace(/\/$/,'')}/auth/v1/user`,{headers:{apikey:supabaseConfig().anonKey,Authorization:`Bearer ${token}`}});
        const user=await response.json().catch(()=>({}));
        if(!response.ok||!user.id)throw new Error('Il link di accesso non è valido o è scaduto. Richiedine uno nuovo.');
        const expires=Number(hash.get('expires_in')||3600);
        session={access_token:token,refresh_token:hash.get('refresh_token')||'',expires_in:expires,expires_at:Math.floor(Date.now()/1000)+expires,user};
      } else session=await authFetch('verify',{type:'recovery',token_hash:tokenHash});
      saveCloudSession(session);
      if(type==='recovery'){cloudMessage='';showAccountModal('new-password')}
      else {await loadCloudProfile();if(window.CAMPETTO_OPEN_PROFILE){closeAccountModal();window.CAMPETTO_OPEN_PROFILE();notify('Indirizzo email confermato. Il tuo account è connesso.')}else {render();showAccountModal('login');setAccountMessage('Indirizzo email confermato. Il tuo account è connesso.')}}
    } catch(error) {cloudBusy=false;showAccountModal(type==='recovery'?'recover':'login');setAccountMessage(error.message||'Il link non è valido o è scaduto.')}
  }
  document.querySelector('#account-button').addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();showAccountModal(cloudSession?'login':undefined)},true);
  function wrapPreferenceSave(name) {
    const original=window[name] || (name==='toggleFavorite'?toggleFavorite:name==='addToRoster'?addToRoster:removeFromRoster);
    window[name]=function(...args){const result=original(...args);queueCloudSync();return result};
  }
  const oldToggleFavorite=toggleFavorite;
  toggleFavorite=function(...args){const result=oldToggleFavorite(...args);queueCloudSync();return result};
  const oldAddToRoster=addToRoster;
  addToRoster=function(...args){const result=oldAddToRoster(...args);queueCloudSync();return result};
  const oldRemoveFromRoster=removeFromRoster;
  removeFromRoster=function(...args){const result=oldRemoveFromRoster(...args);queueCloudSync();return result};
  const oldJoinHandler=bindViewActions;
  bindViewActions=function(){oldJoinHandler();const join=root.querySelector('#join-fantasy');if(join)join.addEventListener('click',()=>setTimeout(queueCloudSync,0))};

  function decorateAccountButton() {
    const button=document.querySelector('#account-button');
    if(!button)return;
    const label=button.querySelector('span:not(.avatar-mini)');
    if(label)label.replaceChildren(document.createTextNode(cloudSession?.user?.email||'Il mio profilo'));
    const initials=(cloudSession?.user?.email||'CA').slice(0,2).toUpperCase();
    const avatar=button.querySelector('.avatar-mini');if(avatar)avatar.textContent=initials;
  }
  function setupRecovery() {
    openRecoveryFromCallback();
  }

  function playerPortrait(player) {
    return player.headshot || (player.espn ? `https://a.espncdn.com/i/headshots/nba/500/${encodeURIComponent(player.espn)}.png` : '');
  }
  function profileVideos(player) {
    const clips=playerVideoCache.get(String(player.espn));
    if(clips===undefined) return `<section class="panel"><div class="section-head"><div><h2 class="section-title">Le migliori giocate di ${esc(player.name)}</h2><p class="section-sub">Sto cercando video NBA incorporabili…</p></div></div><div class="loading">Caricamento highlights</div></section>`;
    if(clips.length) return `<div class="highlight-grid">${clips.map(clip=>`<article class="highlight-card"><div class="highlight-frame"><iframe src="${esc(clip.embedUrl)}" title="${esc(clip.title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><div class="highlight-copy"><b>${esc(clip.title)}</b><span>${esc(clip.channel||'YouTube')}</span></div></article>`).join('')}</div>`;
    const queries=[`${player.name} NBA highlights`,`${player.name} best plays NBA`,`${player.name} dunk assists highlights`];
    return `<section class="panel"><div class="section-head"><div><h2 class="section-title">Le migliori giocate di ${esc(player.name)}</h2><p class="section-sub">Raccolte highlights pronte da aprire su YouTube.</p></div></div><div class="video-list">${queries.map((query,index)=>`<a class="video-card highlight-fallback" href="https://www.youtube.com/results?search_query=${encodeURIComponent(query)}" target="_blank" rel="noreferrer">${playerPortrait(player)?`<img src="${esc(playerPortrait(player))}" alt="" loading="lazy">`:''}<div><b>${index===0?'Highlights NBA':index===1?'Migliori giocate':'Dunk e assist'} · ${esc(player.name)}</b><span>Apri i video su YouTube&nbsp; ↗</span></div></a>`).join('')}</div>${supabaseConfig().youtubeApiKey?'':'<p class="data-note" style="margin-top:12px">Per incorporare i video nella pagina, configura la chiave YouTube Data API in <code>supabase-config.js</code>.</p>'}</section>`;
  }
  async function loadPlayerVideos(player) {
    const id=String(player.espn||''); if(!id||playerVideoCache.has(id))return;
    const apiKey=supabaseConfig().youtubeApiKey;
    if(!apiKey){playerVideoCache.set(id,[]);if(view==='profile'&&profileTab==='Videos'&&String(currentPlayer.espn)===id)render();return}
    playerVideoCache.set(id,undefined);
    try {
      const params=new URLSearchParams({part:'snippet',type:'video',videoEmbeddable:'true',maxResults:'6',order:'viewCount',q:`${player.name} NBA highlights`,key:apiKey});
      const response=await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      const data=await response.json();if(!response.ok)throw new Error(data.error?.message||'Ricerca video non disponibile');
      const clips=(data.items||[]).map(item=>{const videoId=String(item.id?.videoId||'');if(!/^[A-Za-z0-9_-]{6,}$/.test(videoId))return null;return {title:item.snippet?.title||`${player.name} · Highlights NBA`,channel:item.snippet?.channelTitle||'YouTube',embedUrl:`https://www.youtube-nocookie.com/embed/${videoId}`}}).filter(Boolean);
      playerVideoCache.set(id,clips);
    }catch(error){console.info('Highlights YouTube non disponibili:',error);playerVideoCache.set(id,[])}
    if(view==='profile'&&profileTab==='Videos'&&String(currentPlayer.espn)===id)render();
  }
  function renderCampettoProfile(player) {
    if(!player)return '<div class="panel">Giocatore non trovato.</div>';
    window.CAMPETTO_PLAYER_DETAILS?.load(player);
    if(profileTab==='Videos')loadPlayerVideos(player);
    const stats=profileTab==='Videos'?profileVideos(player):profileTab==='Stats'?accurateProfileStats(player):compactPlayerOverview(player);
    return `<section class="profile-banner"><div class="profile-copy"><button class="back-link" data-view="players">← &nbsp;Tutti i giocatori</button><div class="jersey-badge">${safeLogo(player.team)} #${esc(player.number??'—')} · ${esc(player.position)}</div><h1>${esc(player.name)}</h1><p><button class="text-button profile-team-link" data-team="${esc(player.team)}">${esc(team(player.team).city)} ${esc(team(player.team).name)} ↗</button> · ${player.active?'In attività':'Leggenda NBA'}</p><div class="profile-actions">${window.CAMPETTO_FAVORITE_BUTTON(player,true)}<button class="secondary-button" data-action="roster" data-player="${esc(player.id)}">Aggiungi al quintetto</button></div></div>${playerPortrait(player)?`<img class="profile-portrait" src="${esc(playerPortrait(player))}" alt="${esc(player.name)}" onerror="this.classList.add('portrait-missing')">`:''}<div class="profile-placeholder" aria-hidden="true"></div></section><div class="profile-stat-bar">${[['PTS','pts'],['REB','reb'],['AST','ast'],['MIN','min'],['FG%','fgp'],['STL','stl'],['BLK','blk']].map(([label,key])=>`<div class="pbar-item"><span class="pbar-label">${label}</span><span class="pbar-value">${esc(statOf(player,key))}${key==='fgp'&&statOf(player,key)!=='—'&&!String(statOf(player,key)).endsWith('%')?'%':''}</span></div>`).join('')}</div><div class="profile-tabs" role="tablist" aria-label="Sezioni profilo giocatore">${[['Overview','Panoramica'],['Stats','Statistiche'],['Videos','Migliori giocate']].map(([key,label])=>`<button class="profile-tab ${profileTab===key?'active':''}" data-profile-tab="${key}" role="tab" aria-selected="${profileTab===key}">${label}</button>`).join('')}</div><div class="profile-tab-content">${stats}</div>`;
  }
  renderProfile = renderCampettoProfile;
  document.addEventListener('click',event=>{
    const gameTab=event.target.closest('[data-game-tab]');
    if(gameTab){event.preventDefault();event.stopImmediatePropagation();selectedGameTab=gameTab.dataset.gameTab;render();return}
    const game=event.target.closest('[data-game]');
    if(game){event.preventDefault();event.stopImmediatePropagation();openGame(game.dataset.game,game.dataset.gameTeam);return}
    const homeTitle=event.target.closest('.home-games-link');
    if(homeTitle){event.preventDefault();event.stopImmediatePropagation();view='games';render()}
  },true);
  document.addEventListener('click',event=>{
    const favorite=event.target.closest('[data-action="favorite"]');
    if(favorite){event.preventDefault();event.stopImmediatePropagation();toggleFavorite(favorite.dataset.player);return}
    const tab=event.target.closest('[data-profile-tab]');
    if(tab){event.preventDefault();event.stopImmediatePropagation();profileTab=tab.dataset.profileTab;render();return}
    const profileTeam=event.target.closest('.profile-team-link');
    if(profileTeam){event.preventDefault();event.stopImmediatePropagation();goTeam(profileTeam.dataset.team);return}
    const teamButton=event.target.closest('[data-team]');
    if(teamButton&&!teamButton.classList.contains('team-chip-link')){event.preventDefault();event.stopImmediatePropagation();goTeam(teamButton.dataset.team);return}
    const playerCard=event.target.closest('[data-player]:not([data-action])');
    if(playerCard){const player=playerById(playerCard.dataset.player);if(player){event.preventDefault();event.stopImmediatePropagation();previousView=view;currentPlayer=player;profileTab='Overview';view='profile';render()}}
  },true);

  const originalAppRender = baseRender;
  render = function() {
    if (['teams','team','leaders','cards','game'].includes(view)) {
      const labels={teams:'Squadre',team:team(selectedTeam).name,leaders:'Leader statistici',cards:'Carte NBA',game:'Tabellino partita'};
      document.querySelector('#breadcrumb-current').textContent=labels[view];
      document.querySelector('#favorite-count').textContent=favorites.length;
      document.querySelector('#player-count').textContent=activePlayers().length;
      root.innerHTML=(view==='teams'?renderTeams():view==='team'?renderTeam(selectedTeam):view==='leaders'?renderLeaders():view==='game'?renderGameDetails():renderCards());
      bindViewActions();bindPlayerCardActions(root);bindExtras();
      document.querySelectorAll('.nav-link').forEach(button=>button.classList.toggle('active',button.dataset.view===(view==='team'?'teams':view==='game'?'games':view)));
    } else {
      if(view==='news') { root.innerHTML=renderCampettoNews(); document.querySelector('#breadcrumb-current').textContent='News'; document.querySelectorAll('.nav-link').forEach(button=>button.classList.toggle('active',button.dataset.view==='news')); }
      else originalAppRender();
      if(view==='standings') {
        root.querySelectorAll('.standings-table tbody tr').forEach(row=>{const code=row.querySelector('.round-avatar')?.textContent?.trim();if(code&&teamCodeFromName(code)){row.dataset.team=teamCodeFromName(code);row.tabIndex=0}});
        bindExtras();
      }
      if(view==='profile') {
        bindProfileTeam();
        if(previousView==='team') { const back=root.querySelector('#profile-back');if(back)back.innerHTML=`← &nbsp;Torna a ${esc(team(currentPlayer.team).name)}`; }
      }
    }
    decorateAccountButton();
  };

  async function init() {
    ensureAccountModal();
    decorateAccountButton();
    if(cloudSession?.access_token && cloudReady()) {
      try { await loadCloudProfile(); } catch(error) { console.info('Profilo cloud non caricato:',error); }
    }
    setupRecovery();
    const initialCache=readStorage(`${EXTRA_STATS_KEY}-${seasonId()}`,null);
    if(initialCache?.rows?.length) applyStatsRows(initialCache.rows,initialCache.updatedAt);
    else {
      PLAYERS=PLAYERS.map(player=>player.active?{...player,stats:createZeroStats(),statsSource:'loading',gamesPlayed:0}:player);
      if(currentPlayer)currentPlayer=playerById(currentPlayer.id)||currentPlayer;
      render();
    }
    loadSeasonStats();
    updateNotificationButton();
    if(!notificationPollStarted){notificationPollStarted=true;loadLiveFeeds();setInterval(()=>loadLiveFeeds(),5*60*1000)}
    setInterval(()=>loadSeasonStats(true),10*60*1000);
  }
  init();
})();
