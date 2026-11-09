(() => {
  const root = document.getElementById('view-root');
  const searchInput = document.getElementById('global-search');
  const toastEl = document.getElementById('toast');

  const TEAM_INFO = {
    ATL: { city: 'Atlanta', name: 'Hawks', color: '#e03a3e' },
    BOS: { city: 'Boston', name: 'Celtics', color: '#007a33' },
    BKN: { city: 'Brooklyn', name: 'Nets', color: '#000000' },
    CHA: { city: 'Charlotte', name: 'Hornets', color: '#1d1160' },
    CHI: { city: 'Chicago', name: 'Bulls', color: '#ce1141' },
    CLE: { city: 'Cleveland', name: 'Cavaliers', color: '#6f263d' },
    DAL: { city: 'Dallas', name: 'Mavericks', color: '#00538c' },
    DEN: { city: 'Denver', name: 'Nuggets', color: '#0e2240' },
    DET: { city: 'Detroit', name: 'Pistons', color: '#c8102e' },
    GSW: { city: 'Golden State', name: 'Warriors', color: '#1d428a' },
    HOU: { city: 'Houston', name: 'Rockets', color: '#ce1141' },
    IND: { city: 'Indiana', name: 'Pacers', color: '#002d62' },
    LAC: { city: 'Los Angeles', name: 'Clippers', color: '#c8102e' },
    LAL: { city: 'Los Angeles', name: 'Lakers', color: '#552583' },
    MEM: { city: 'Memphis', name: 'Grizzlies', color: '#5d76a9' },
    MIA: { city: 'Miami', name: 'Heat', color: '#98002e' },
    MIL: { city: 'Milwaukee', name: 'Bucks', color: '#00471b' },
    MIN: { city: 'Minnesota', name: 'Timberwolves', color: '#0c2340' },
    NOP: { city: 'New Orleans', name: 'Pelicans', color: '#0c2340' },
    NYK: { city: 'New York', name: 'Knicks', color: '#f58426' },
    OKC: { city: 'Oklahoma City', name: 'Thunder', color: '#007ac1' },
    ORL: { city: 'Orlando', name: 'Magic', color: '#0077c0' },
    PHI: { city: 'Philadelphia', name: '76ers', color: '#006bb6' },
    PHX: { city: 'Phoenix', name: 'Suns', color: '#1d1160' },
    POR: { city: 'Portland', name: 'Trail Blazers', color: '#e03a3e' },
    SAC: { city: 'Sacramento', name: 'Kings', color: '#5a2d81' },
    SAS: { city: 'San Antonio', name: 'Spurs', color: '#c4ced4' },
    TOR: { city: 'Toronto', name: 'Raptors', color: '#ce1141' },
    UTA: { city: 'Utah', name: 'Jazz', color: '#002b5c' },
    WAS: { city: 'Washington', name: 'Wizards', color: '#002b5c' }
  };

  // La lista iniziale mantiene la pagina utile anche senza rete. Viene poi
  // completata con le rose ufficiali ESPN di tutte le 30 squadre.
  let PLAYERS = [
    { id: 'luka', name: 'Luka Dončić', team: 'DAL', position: 'PG', number: 77, active: true, espn: 3945274, gamesPlayed: 70, stats: { pts: 33.9, reb: 9.2, ast: 9.8, stl: 1.4, blk: 0.5, fgp: 48.7, tpp: 38.2, ftp: 74.2, min: 34.7 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/3945274.png' },
    { id: 'giannis', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'F', number: 34, active: true, espn: 3032977, gamesPlayed: 73, stats: { pts: 30.4, reb: 11.5, ast: 6.5, stl: 1.2, blk: 1.2, fgp: 55.3, tpp: 27.5, ftp: 72.1, min: 35.5 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/3032977.png' },
    { id: 'shai', name: 'Shai Gilgeous-Alexander', team: 'OKC', position: 'G', number: 2, active: true, espn: 4594268, gamesPlayed: 75, stats: { pts: 30.1, reb: 5.5, ast: 6.2, stl: 2.0, blk: 0.9, fgp: 51.0, tpp: 35.8, ftp: 90.5, min: 34.7 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/4594268.png' },
    { id: 'jokic', name: 'Nikola Jokić', team: 'DEN', position: 'C', number: 15, active: true, espn: 3112335, gamesPlayed: 79, stats: { pts: 26.4, reb: 12.4, ast: 9.0, stl: 1.4, blk: 0.9, fgp: 64.7, tpp: 34.3, ftp: 81.7, min: 39.8 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/3112335.png' },
    { id: 'tatum', name: 'Jayson Tatum', team: 'BOS', position: 'F', number: 0, active: true, espn: 4065648, gamesPlayed: 74, stats: { pts: 26.9, reb: 8.1, ast: 6.9, stl: 1.1, blk: 0.6, fgp: 47.1, tpp: 37.6, ftp: 85.2, min: 37.1 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/4065648.png' },
    { id: 'bron', name: 'LeBron James', team: 'LAL', position: 'F', number: 23, active: true, espn: 1966, gamesPlayed: 71, stats: { pts: 25.7, reb: 7.3, ast: 8.3, stl: 1.2, blk: 0.6, fgp: 53.0, tpp: 39.7, ftp: 75.3, min: 35.4 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/1966.png' },
    { id: 'wemby', name: 'Victor Wembanyama', team: 'SAS', position: 'F', number: 1, active: true, espn: 4432164, gamesPlayed: 71, stats: { pts: 21.4, reb: 10.6, ast: 3.9, stl: 1.2, blk: 3.6, fgp: 46.2, tpp: 32.3, ftp: 83.0, min: 32.5 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/4432164.png' },
    { id: 'anthony', name: 'Anthony Edwards', team: 'MIN', position: 'G', number: 5, active: true, espn: 4592867, gamesPlayed: 79, stats: { pts: 25.9, reb: 5.4, ast: 4.7, stl: 1.6, blk: 0.7, fgp: 46.0, tpp: 36.8, ftp: 78.7, min: 36.0 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/4592867.png' },
    { id: 'paolo', name: 'Paolo Banchero', team: 'ORL', position: 'F', number: 5, active: true, espn: 4432817, gamesPlayed: 80, stats: { pts: 22.6, reb: 6.9, ast: 5.4, stl: 1.1, blk: 0.6, fgp: 48.3, tpp: 35.9, ftp: 77.4, min: 35.0 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/4432817.png' },
    { id: 'curry', name: 'Stephen Curry', team: 'GSW', position: 'G', number: 30, active: true, espn: 3975, gamesPlayed: 74, stats: { pts: 26.4, reb: 5.1, ast: 6.1, stl: 1.2, blk: 0.4, fgp: 42.8, tpp: 39.7, ftp: 92.1, min: 34.7 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/3975.png' },
    { id: 'jalen', name: 'Jalen Brunson', team: 'NYK', position: 'G', number: 11, active: true, espn: 4432818, gamesPlayed: 77, stats: { pts: 28.7, reb: 3.6, ast: 6.7, stl: 1.5, blk: 0.2, fgp: 47.9, tpp: 40.2, ftp: 86.7, min: 35.4 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/4432818.png' },
    { id: 'paul', name: 'Chris Paul', team: 'PHX', position: 'G', number: 3, active: true, espn: 2779, gamesPlayed: 70, stats: { pts: 13.9, reb: 4.4, ast: 8.9, stl: 1.5, blk: 0.4, fgp: 44.7, tpp: 36.5, ftp: 89.2, min: 31.1 }, headshot: 'https://a.espncdn.com/i/headshots/nba/500/2779.png' }
  ];

  const NEWS_ITEMS = window.CAMPETTO_CACHED_NEWS_IT || [];

  const ROOKIES = [
    { name: 'Victor Wembanyama', team: 'SAS', points: 21.4, rebounds: 10.6, blocks: 3.6, assists: 3.9 },
    { name: 'Chet Holmgren', team: 'OKC', points: 16.5, rebounds: 7.9, blocks: 2.7, assists: 2.3 },
    { name: 'Brandon Miller', team: 'CHA', points: 17.1, rebounds: 4.4, blocks: 0.7, assists: 2.1 },
    { name: 'Ja Morant', team: 'MEM', points: 25.1, rebounds: 5.9, blocks: 0.9, assists: 8.1 }
  ];

  // Dati rookie forniti dall'utente dalla classifica stagionale corrente.
  const OFFICIAL_ROOKIE_STATS = [
    { name: 'Cameron Boozer', team: 'MEM', gamesPlayed: 8, minutes: 32.2, points: 16.8, rebounds: 9.8, assists: 5.4, steals: 0.4, blocks: 0.8 },
    { name: 'Yaxel Lendeborg', team: 'GSW', gamesPlayed: 8, minutes: 31.9, points: 21.5, rebounds: 7.0, assists: 3.9, steals: 0.9, blocks: 0.5 },
    { name: 'Darius Acuff Jr.', team: 'SAC', gamesPlayed: 8, minutes: 37.3, points: 25.6, rebounds: 3.8, assists: 7.0, steals: 0.9, blocks: 0.1 },
    { name: 'Caleb Wilson', team: 'CHI', gamesPlayed: 8, minutes: 32.6, points: 19.5, rebounds: 6.5, assists: 2.4, steals: 1.9, blocks: 1.1 },
    { name: 'Darryn Peterson', team: 'UTA', gamesPlayed: 8, minutes: 30.3, points: 12.6, rebounds: 4.0, assists: 3.8, steals: 1.1, blocks: 0.6 },
    { name: 'Meleek Thomas', team: 'CLE', gamesPlayed: 5, minutes: 21.3, points: 13.0, rebounds: 2.6, assists: 0.8, steals: 1.0, blocks: 0.2 },
    { name: 'Aday Mara', team: 'OKC', gamesPlayed: 8, minutes: 19.0, points: 6.8, rebounds: 5.5, assists: 1.3, steals: 0.1, blocks: 1.9 },
    { name: 'AJ Dybantsa', team: 'WAS', gamesPlayed: 4, minutes: 30.6, points: 16.5, rebounds: 5.3, assists: 2.0, steals: 1.0, blocks: 0.0 },
    { name: 'Keaton Wagler', team: 'LAC', gamesPlayed: 8, minutes: 23.8, points: 12.0, rebounds: 4.1, assists: 3.3, steals: 0.6, blocks: 0.3 },
    { name: 'Kingston Flemings', team: 'ATL', gamesPlayed: 8, minutes: 20.7, points: 8.0, rebounds: 2.9, assists: 4.5, steals: 0.8, blocks: 0.3 },
    { name: 'Trevon Brazile', team: 'DEN', gamesPlayed: 7, minutes: 22.1, points: 8.0, rebounds: 6.4, assists: 0.4, steals: 0.9, blocks: 0.6 },
    { name: 'Mikel Brown Jr.', team: 'BKN', gamesPlayed: 6, minutes: 22.9, points: 12.0, rebounds: 2.3, assists: 4.0, steals: 0.7, blocks: 0.2 }
  ];

  let view = 'home';
  let previousView = 'home';
  let currentPlayer = PLAYERS[0];
  let profileTab = 'Overview';
  let favorites = readStorage('campetto-favorites-v1', []);
  let roster = readStorage('campetto-roster-v1', {});
  let standings = readStorage(`campetto-standings-v2-${seasonStartYear()+1}`, []);
  let games = [];
  let statsCache = {};
  let rostersLoading = false;
  let statsLoading = false;
  let playerQuery = '';
  let playerInitial = 'Tutti';
  let leaderStat = 'pts';
  let leaderQuery = '';
  let officialRookies = [];
  let lineup = readStorage('campetto-lineup-v2', {});
  const ROSTER_CACHE_KEY = 'campetto-nba-rosters-v4';
  const ROSTER_CACHE_MAX_AGE = 12 * 60 * 60 * 1000;
    const STATS_CACHE_KEY = 'campetto-nba-stats-v5';
  const ROOKIE_CACHE_KEY = 'campetto-nba-official-rookies-v1';
  const STATS_CACHE_MAX_AGE = 10 * 60 * 1000;

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage disabled in some browsers
    }
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(setToast.timer);
    setToast.timer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  function team(code) {
    const aliases = { GS: 'GSW', NY: 'NYK', NO: 'NOP', SA: 'SAS', UTAH: 'UTA', WSH: 'WAS', PHO: 'PHX' };
    return TEAM_INFO[aliases[String(code || '').toUpperCase()] || String(code || '').toUpperCase()] || { city: 'NBA', name: String(code || 'NBA'), color: '#ff7d42' };
  }

  function activePlayers() {
    return PLAYERS.filter((player) => player.active);
  }

  function playerById(id) {
    return PLAYERS.find((player) => String(player.id) === String(id)) || null;
  }

  function normalizeText(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function statOf(player, key) {
    const value = player?.stats?.[key];
    if (value === undefined || value === null || value === '') return '—';
    const numeric = Number(String(value).replace('%', ''));
    if (!Number.isFinite(numeric)) return String(value);
    return numeric % 1 === 0 ? numeric.toFixed(0) : numeric.toFixed(1);
  }

  function logoUrl(code) {
    const aliases = { GS: 'GSW', NY: 'NYK', NO: 'NOP', SA: 'SAS', UTAH: 'UTA', WSH: 'WAS', PHO: 'PHX' };
    const canonical = aliases[String(code || '').toUpperCase()] || String(code || '').toUpperCase();
    const slug={GSW:'gs',NYK:'ny',NOP:'no',SAS:'sa',UTA:'utah',WAS:'wsh'}[canonical]||canonical.toLowerCase();
    return window.CAMPETTO_TEAM_LOGOS?.[canonical] || `https://a.espncdn.com/i/teamlogos/nba/500/${slug}.png`;
  }

  function teamLogo(code) {
    return `<img class="team-logo" src="${esc(logoUrl(code))}" alt="${esc(team(code).name)}" onerror="this.style.display='none'" />`;
  }

  function headshotUrl(player) {
    return player?.espn ? `https://a.espncdn.com/i/headshots/nba/500/${encodeURIComponent(player.espn)}.png` : (player?.headshot || '');
  }

  function playerPhoto(player, className = '') {
    const primary = headshotUrl(player);
    const fallback = player?.headshot && player.headshot !== primary ? player.headshot : '';
    const errorHandler = fallback
      ? `if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${esc(fallback)}'}else{this.closest('.player-card')?.classList.add('portrait-unavailable')}`
      : "this.closest('.player-card')?.classList.add('portrait-unavailable')";
    return `<img class="${esc(className)}" src="${esc(primary)}" alt="${esc(player?.name || 'Giocatore NBA')}" loading="lazy" referrerpolicy="no-referrer" onerror="${errorHandler}" />`;
  }

  function favoriteButton(player, detailed=false) {
    const selected=favorites.includes(String(player.id));
    const label=selected?'Rimuovi dai preferiti':'Aggiungi ai preferiti';
    const translated=window.CAMPETTO_I18N?.t(label)||label;
    return `<button type="button" class="${detailed?'primary-button favorite-profile-button':'favorite-mark'}${selected?' is-favorite':''}" data-action="favorite" data-player="${esc(player.id)}" aria-pressed="${selected}" aria-label="${esc(translated)} · ${esc(player.name)}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>${detailed?`<span>${esc(translated)}</span>`:''}</button>`;
  }
  window.CAMPETTO_FAVORITE_BUTTON=favoriteButton;

  function playerCard(player) {
    return `<article class="player-card">
      <button type="button" class="player-card-open" data-player="${esc(player.id)}" aria-label="${esc(window.CAMPETTO_I18N?.t('Vai al profilo')||'Vai al profilo')} · ${esc(player.name)}"></button>
      <div class="player-card-top"><span class="team-chip">${teamLogo(player.team)} ${esc(player.team)} · ${esc(player.position)}</span>${favoriteButton(player)}</div>
      <div class="player-identity"><h3>${esc(player.name)}</h3><small>${esc(team(player.team).city)} · #${esc(player.number ?? '—')}</small></div>
      <div class="player-card-stats"><span><b>${statOf(player, 'pts')}</b><small>PTS</small></span><span><b>${statOf(player, 'reb')}</b><small>REB</small></span><span><b>${statOf(player, 'ast')}</b><small>AST</small></span></div>
      ${player.statsSource==='unavailable'?'<small class="player-data-status">Dati stagionali non disponibili</small>':player.gamesPlayed===0&&player.statsSource==='ESPN'?'<small class="player-data-status">Nessuna presenza nel feed</small>':''}
      <div class="player-portrait-wrap">${playerPhoto(player, 'player-portrait')}</div>
    </article>`;
  }

  function numericStat(player, key) {
    return Number(String(player?.stats?.[key] ?? '').replace('%', '')) || 0;
  }

  function toggleFavorite(playerId) {
    const id = String(playerId);
    if (favorites.includes(id)) {
      favorites = favorites.filter((entry) => entry !== id);
      setToast('Giocatore rimosso dai preferiti');
    } else {
      favorites = [...favorites, id];
      setToast('Giocatore aggiunto ai preferiti');
    }
    saveStorage('campetto-favorites-v1', favorites);
    render();
  }

  function addToRoster(playerId) {
    const player = playerById(playerId);
    if (!player) return;
    roster[player.team] = playerId;
    saveStorage('campetto-roster-v1', roster);
    setToast(`${player.name} inserito nel quintetto`);
    render();
  }

  function removeFromRoster(teamCode) {
    delete roster[teamCode];
    saveStorage('campetto-roster-v1', roster);
    render();
  }

  function renderNavState() {
    const navButtons = document.querySelectorAll('.nav-link');
    navButtons.forEach((button) => {
      const isTeamView = button.dataset.view === 'teams' && view === 'team';
      const isCurrent = button.dataset.view === view || isTeamView;
      button.classList.toggle('active', isCurrent);
    });
    const currentLabel = view === 'team' ? 'Squadre' : view === 'profile' ? 'Giocatore' : {
      home: 'Panoramica',
      players: 'Giocatori',
      teams: 'Squadre',
      leaders: 'Statistiche',
      games: 'Partite',
      standings: 'Classifica',
      fantasy: 'Fantabasket',
      news: 'News',
      rookies: 'Rookie'
    }[view] || 'Panoramica';

    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.textContent = currentLabel;
    const favoriteCount = document.getElementById('favorite-count');
    if (favoriteCount) favoriteCount.textContent = favorites.length;
    const playerCount = document.getElementById('player-count');
    if (playerCount) playerCount.textContent = activePlayers().length;
  }

  function renderHome() {
    const topPlayers = [...activePlayers()].sort((a, b) => numericStat(b, 'pts') - numericStat(a, 'pts')).slice(0, 3);
    const carouselPlayers = topPlayers.length ? topPlayers : [currentPlayer || PLAYERS[0]];
    const tonight = games.slice(0, 2);

    return `
      <section class="page-heading home-heading">
        <div>
          <div class="eyebrow">${new Date().toLocaleDateString(window.CAMPETTO_LOCALE?.()||'it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <h1>La tua <button class="home-games-link" data-view="games" aria-label="Apri le partite della notte">giornata NBA, qui.</button></h1>
        </div>
        <button class="secondary-button" data-view="games">Calendario completo →</button>
      </section>
      <div class="feature-grid">
        <article class="hero-card hero-carousel ${carouselPlayers.length > 1 ? '' : 'solo'}" aria-label="Giocatori in primo piano">
          ${carouselPlayers.map((player, index) => `
            <article class="hero-slide" style="--slide-delay:-${(carouselPlayers.length - index) * 5}s" aria-hidden="${index === 0 ? 'false' : 'true'}">
              <div class="hero-copy">
                <div class="eyebrow">✦ Giocatori in primo piano · #${index + 1}</div>
                <h2>${esc(player.name)}</h2>
                <p>${esc(team(player.team).name)} · ${esc(player.position)} · Migliori numeri della settimana.</p>
                <div class="hero-player-stats"><span><b>${statOf(player, 'pts')}</b> PTS</span><span><b>${statOf(player, 'reb')}</b> REB</span><span><b>${statOf(player, 'ast')}</b> AST</span></div>
                <div class="hero-actions"><button class="primary-button" data-player="${esc(player.id)}">Vai al profilo →</button></div>
              </div>
              ${playerPhoto(player, 'hero-player')}
            </article>`).join('')}
          <div class="hero-carousel-status" aria-hidden="true"><span></span>scorre in automatico</div>
        </article>
        <aside class="panel stats-panel night-panel">
          <div class="panel-head"><h3>I risultati della notte</h3><span>${games.length ? '● aggiornato' : 'in arrivo'}</span></div>
          ${tonight.length ? tonight.map((game) => `<button class="night-game" data-game="${esc(game.id || `${game.away}-${game.home}`)}"><span><b>${teamLogo(game.away)} ${esc(game.away)}</b><small>${esc(team(game.away).name)}</small></span><strong>${game.awayScore ?? '—'}<br>${game.homeScore ?? '—'}</strong><span><b>${teamLogo(game.home)} ${esc(game.home)}</b><small>${esc(team(game.home).name)}</small></span><em>${esc(game.status || 'Programmata')} · Dettagli ↗</em></button>`).join('') : '<p class="data-note">Caricamento delle prossime partite…</p>'}
          <button class="text-button" data-view="games">Tutte le partite →</button>
        </aside>
      </div>

      <div class="feature-strip home-metrics">
        <article class="strip-card"><span class="strip-icon">♙</span><div><b>${activePlayers().length}</b><span>profili esplorabili</span></div></article>
        <article class="strip-card"><span class="strip-icon">▤</span><div><b>${games.length}</b><span>partite nel feed di oggi</span></div></article>
        <article class="strip-card"><span class="strip-icon">♡</span><div><b>${favorites.length}</b><span>giocatori seguiti</span></div></article>
        <article class="strip-card"><span class="strip-icon">♟</span><div><b>${Object.keys(lineup).length}/5</b><span>posti nel quintetto</span></div></article>
      </div>

      <section class="section-block">
        <div class="section-head">
          <div>
            <h2 class="section-title">Rookie watch</h2>
            <p class="section-sub">I migliori prospetti della nuova stagione.</p>
          </div>
          <button class="text-button" data-view="rookies">Tutti i rookie →</button>
        </div>
        <div class="rookie-grid rookie-feature-grid">${renderRookieCards()}</div>
      </section>

      <section class="section-block">
        <div class="section-head">
          <div>
            <h2 class="section-title">Dal mondo NBA</h2>
            <p class="section-sub">Le ultime storie dalla lega.</p>
          </div>
          <button class="text-button" data-view="news">Tutte le news →</button>
        </div>
        ${renderNewsShowcase()}
      </section>
    `;
  }

  function renderNewsShowcase() {
    const [featured, ...more] = NEWS_ITEMS;
    if (!featured) return '<div class="empty-state">Le notizie NBA saranno disponibili a breve.</div>';
    return `<div class="news-showcase"><article class="news-feature"><img src="${esc(featured.image)}" alt="${esc(featured.title)}" onerror="this.style.opacity='.2'" /><div><span>${esc(featured.tag)}</span><h3>${esc(featured.title)}</h3><p>${esc(featured.summary)}</p></div></article><div class="news-mini-list">${more.slice(0, 5).map((item) => `<article class="news-mini"><img src="${esc(item.image)}" alt="" onerror="this.style.opacity='.2'"><div><b>${esc(item.title)}</b><small>${esc(item.summary)}</small></div></article>`).join('')}</div></div>`;
  }

  function renderWeeklyDashboard(players, nightGames) {
    return `<section class="section-block weekly-dashboard"><section class="weekly-panel"><div class="section-head"><div><h2 class="section-title">Giocatori in primo piano</h2><p class="section-sub">I tre migliori numeri della settimana.</p></div><button class="text-button" data-view="players">Tutti i giocatori →</button></div><div class="weekly-player-rail">${players.map((player, index) => `<button class="weekly-player" data-player="${esc(player.id)}"><div class="weekly-player-copy"><span>#${index + 1} · ${esc(player.team)}</span><h3>${esc(player.name)}</h3><div><b>${statOf(player, 'pts')} <small>PTS</small></b><b>${statOf(player, 'reb')} <small>REB</small></b><b>${statOf(player, 'ast')} <small>AST</small></b></div></div><div class="weekly-player-photo">${playerPhoto(player, 'weekly-portrait')}</div></button>`).join('')}</div></section><aside class="night-results-panel"><div class="section-head"><div><h2 class="section-title">I risultati della notte</h2><p class="section-sub">Le partite più recenti.</p></div><button class="text-button" data-view="games">Tutte →</button></div><div class="night-results-list">${nightGames.length ? nightGames.map((game) => `<article class="night-result"><button data-team="${esc(game.away)}">${teamLogo(game.away)}<span>${esc(game.away)}</span></button><strong>${game.awayScore ?? '—'}<i>:</i>${game.homeScore ?? '—'}</strong><button data-team="${esc(game.home)}"><span>${esc(game.home)}</span>${teamLogo(game.home)}</button><small>${esc(game.status || 'Programmata')}</small></article>`).join('') : '<p class="data-note">I risultati saranno disponibili a breve.</p>'}</div></aside></section>`;
  }

  function prioritizedNightResults(sourceGames) {
    return [...sourceGames]
      .sort((left, right) => Number(/final|terminata/i.test(right.status || '')) - Number(/final|terminata/i.test(left.status || '')))
      .slice(0, 3);
  }

  function renderScoreTicker() {
    const list = games.slice(0, 6);
    if (!list.length) return '<div class="score-ticker loading">Aggiorno risultati e calendario NBA…</div>';
    return `<section class="score-ticker" aria-label="Risultati NBA"><div class="score-ticker-label"><span>NBA</span><small>RISULTATI</small></div><div class="score-ticker-list">${list.map((game) => `<article class="score-ticker-game"><small>${esc(game.status || 'Oggi')}</small><div><span>${teamLogo(game.away)} ${esc(game.away)}</span><b>${game.awayScore ?? '—'}</b></div><div><span>${teamLogo(game.home)} ${esc(game.home)}</span><b>${game.homeScore ?? '—'}</b></div></article>`).join('')}</div><button class="score-ticker-link" data-view="games">Tutto il tabellone →</button></section>`;
  }

  function renderPlayers() {
    const filtered = activePlayers().filter((player) => {
      const matchText = normalizeText(`${player.name} ${player.team} ${team(player.team).name}`).includes(normalizeText(playerQuery));
      return matchText && (playerInitial === 'Tutti' || normalizeText(player.name).startsWith(normalizeText(playerInitial)));
    }).sort((a,b) => a.name.localeCompare(b.name, 'it', {sensitivity:'base'}));
    const letters = ['Tutti', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    return `
      <section class="page-heading">
        <div>
          <div class="eyebrow">NBA · Catalogo</div>
          <h1>Giocatori</h1>
          <p class="section-sub">Roster attivo con statistiche di base e collegamenti alle schede.</p>
        </div>
        <span class="data-note">${filtered.length} di ${activePlayers().length} atleti attivi</span>
      </section>
      <div class="directory-controls"><label class="directory-search"><span>⌕</span><input id="player-search" type="search" value="${esc(playerQuery)}" placeholder="Cerca per nome, squadra o ruolo…" /><kbd>⌘ K</kbd></label><div class="directory-status"><span class="data-note">${statsLoading ? 'Statistiche in aggiornamento…' : 'Foto, rose e statistiche ESPN'}</span></div></div>
      <div class="alphabet-filter">${letters.map((letter) => `<button class="letter-button ${playerInitial === letter ? 'active' : ''}" data-letter="${letter}">${letter}</button>`).join('')}</div>
      <div class="player-grid large-grid">
        ${filtered.map(playerCard).join('') || '<div class="empty-state">Nessun giocatore trovato.</div>'}
      </div>
    `;
  }

  function rookies() {
    // Zero anni di esperienza identifica i rookie; un anno include i sophomore.
    // Usa le stesse medie correnti del catalogo, senza sostituirle con uno snapshot.
    return activePlayers()
      .filter((player) => player.experience != null && Number(player.experience) === 0)
      .sort((a, b) => numericStat(b, 'pts') - numericStat(a, 'pts') || a.name.localeCompare(b.name, 'it'))
      .map((player) => ({name:player.name, team:player.team, points:statOf(player,'pts'), rebounds:statOf(player,'reb'), blocks:statOf(player,'blk'), assists:statOf(player,'ast'), gamesPlayed:player.gamesPlayed, player}));
  }

  function rookiePlayer(rookie) {
    const existing = rookie?.player || activePlayers().find((candidate) => normalizeText(candidate.name) === normalizeText(rookie?.name));
    if (existing) return existing;
    return {
      id: `rookie-${normalizeText(rookie?.name).replace(/[^a-z0-9]+/g, '-')}`,
      name: rookie?.name || 'Rookie NBA', team: rookie?.team || 'NBA', position: 'Rookie', number: '—', active: true,
      gamesPlayed: rookie?.gamesPlayed || 0,
      stats: { pts: rookie?.points ?? '—', reb: rookie?.rebounds ?? '—', ast: rookie?.assists ?? '—', blk: rookie?.blocks ?? '—' }
    };
  }

  function renderRookieCards(limit = 3) {
    const list = rookies().slice(0, limit);
    if (!list.length) return `<div class="panel rookie-empty">${rostersLoading ? 'Caricamento dei rookie della stagione…' : 'I rookie saranno disponibili quando viene caricata la rosa NBA corrente.'}</div>`;
    window.CAMPETTO_DRAFT?.loadFor(list.map(rookie => rookie.player));
    return list.map((rookie, index) => {
      const player = rookiePlayer(rookie);
      const draft = window.CAMPETTO_DRAFT?.describe(window.CAMPETTO_DRAFT.infoFor(player)) || {label:'Pick non disponibile',detail:'Dato non esposto dalla fonte'};
      return `<button class="rookie-card rookie-feature-card" type="button" data-rookie-name="${esc(rookie.name)}"><div class="rookie-copy"><div class="rookie-header"><span class="rookie-rank">#${index + 1}</span><span class="rookie-team">${esc(rookie.team)}</span></div><h3>${esc(rookie.name)}</h3><div class="rookie-draft"><b class="rookie-pick">${esc(draft.label)}</b><small>${esc(draft.detail)}</small></div><div class="rookie-stats"><span><b>${rookie.points}</b><small>PTS</small></span><span><b>${rookie.rebounds}</b><small>REB</small></span><span><b>${rookie.assists}</b><small>AST</small></span><span><b>${rookie.blocks}</b><small>BLK</small></span></div></div><div class="rookie-photo">${playerPhoto(player, 'rookie-portrait')}</div></button>`;
    }).join('');
  }

  function renderRookies() {
    const allRookies = rookies();
    return `
      <section class="page-heading">
        <div><div class="eyebrow">NBA · Rookie watch</div><h1>Tutti i rookie</h1><p class="section-sub">Rookie delle rose attuali, scelta al Draft e medie della stagione corrente.</p></div>
        <button class="secondary-button" data-view="home">← Panoramica</button>
      </section>
      <div class="rookie-grid rookie-feature-grid">${renderRookieCards(allRookies.length)}</div>
      <p class="data-note rookie-draft-note">La pick è il numero assoluto di scelta al Draft NBA, anche al secondo giro. Fonte: ESPN. Un dato mancante non indica che il giocatore non sia stato scelto.</p>
    `;
  }

  function renderTeams() {
    const teams = Object.keys(TEAM_INFO).sort((left, right) => {
      return `${TEAM_INFO[left].city} ${TEAM_INFO[left].name}`.localeCompare(`${TEAM_INFO[right].city} ${TEAM_INFO[right].name}`, 'it');
    });
    return `
      <section class="page-heading">
        <div>
          <div class="eyebrow">NBA · 30 franchigie</div>
          <h1>Squadre</h1>
          <p class="section-sub">Apri una squadra per vedere la rosa completa e le sue statistiche.</p>
        </div>
        <span class="data-note">${rostersLoading ? 'Rose in aggiornamento…' : `${activePlayers().length} giocatori disponibili`}</span>
      </section>
      <div class="team-directory">
        ${teams.map((code) => {
          const info = team(code);
          const players = activePlayers().filter((player) => player.team === code);
          return `<button class="team-directory-card" data-team="${esc(code)}" style="--team-color:${esc(info.color)}">
            <span class="team-card-logo">${teamLogo(code)}</span><span class="team-card-copy"><b>${esc(info.city)} ${esc(info.name)}</b><small>${esc(code)} · ${players.length} giocatori</small></span>
            <span class="team-card-arrow">→</span>
          </button>`;
        }).join('')}
      </div>
    `;
  }

  function lineupSlot(position) {
    const player = playerById(lineup[position]);
    return player ? `<button class="court-player" data-lineup-remove="${esc(position)}" style="${courtPosition(position)}"><b>${esc(player.name)}</b><span>${esc(position)} · ${statOf(player, 'pts')} PTS</span></button>` : `<button class="court-player empty" data-lineup-slot="${esc(position)}" style="${courtPosition(position)}"><b>${esc(position)}</b><span>Scegli giocatore</span></button>`;
  }

  function courtPosition(position) {
    return ({ PG: 'left:50%;top:68%', SG: 'left:22%;top:54%', SF: 'left:78%;top:54%', PF: 'left:30%;top:27%', C: 'left:70%;top:27%' })[position];
  }

  function renderFantasy() {
    const chosen = Object.values(lineup).map(playerById).filter(Boolean);
    const points = chosen.reduce((total, player) => total + numericStat(player, 'pts'), 0).toFixed(1);
    return `<section class="page-heading"><div><div class="eyebrow">NBA · FANTABASKET</div><h1>Il mio quintetto</h1><p class="section-sub">Scegli cinque giocatori e disponili sul campo.</p></div><span class="data-note">${chosen.length}/5 selezionati</span></section><div class="roster-view"><section class="court"><span class="court-captain">IL TUO QUINTETTO</span><span class="center-circle"><span></span></span><span class="key top"></span><span class="key bottom"></span><span class="three-line top"></span><span class="three-line bottom"></span><span class="basket top"></span><span class="basket bottom"></span>${['PG', 'SG', 'SF', 'PF', 'C'].map(lineupSlot).join('')}</section><aside class="roster-panel"><div class="roster-head"><h3>Seleziona un giocatore</h3><span>${activePlayers().length} disponibili</span></div><div class="add-player-row"><select class="select-player" id="fantasy-player"><option value="">Scegli un giocatore…</option>${activePlayers().sort((a,b) => a.name.localeCompare(b.name, 'it')).map((player) => `<option value="${esc(player.id)}">${esc(player.name)} · ${esc(player.team)} · ${esc(player.position)}</option>`).join('')}</select><select class="select-player" id="fantasy-slot" style="margin-top:8px">${['PG','SG','SF','PF','C'].map((slot) => `<option value="${slot}">${slot}${lineup[slot] ? ' · sostituisci' : ''}</option>`).join('')}</select><button class="primary-button" id="add-lineup-player" style="margin-top:8px;width:100%">Aggiungi al campo →</button></div><div class="roster-list">${chosen.length ? chosen.map((player) => `<div class="roster-row"><span class="roster-pos">${esc(Object.keys(lineup).find((slot) => lineup[slot] === player.id) || '—')}</span><div class="roster-person"><b>${esc(player.name)}</b><span>${esc(player.team)} · ${esc(player.position)}</span></div><div class="roster-points"><b>${statOf(player, 'pts')}</b><span>PTS</span></div></div>`).join('') : '<p class="data-note">Aggiungi i giocatori dalla lista per comporre il quintetto.</p>'}</div><div class="fantasy-score-card"><div><span>POTENZIALE OFFENSIVO</span><b>${points} PTS</b></div><small>Somma delle medie stagionali</small></div></aside></div>`;
  }

  function renderStandings() {
    const rows = standings.length ? standings : [
      { team: 'BOS', wins: 46, losses: 22, pct: '.676' },
      { team: 'NYK', wins: 43, losses: 25, pct: '.632' },
      { team: 'MIL', wins: 42, losses: 25, pct: '.627' },
      { team: 'OKC', wins: 44, losses: 24, pct: '.647' },
      { team: 'DEN', wins: 39, losses: 29, pct: '.573' },
      { team: 'LAL', wins: 36, losses: 32, pct: '.529' }
    ];

    return `
      <section class="page-heading">
        <div>
          <div class="eyebrow">NBA · Classifica</div>
          <h1>Classifica</h1>
          <p class="section-sub">Risultati stagione regolare e andamento delle 30 franchigie.</p>
        </div>
        <span class="data-note">Aggiornamento live dal feed ESPN</span>
      </section>
      <div class="panel table-panel">
        <table class="stats-table standings-table">
          <thead>
            <tr><th>#</th><th>Squadra</th><th>V</th><th>P</th><th>%</th></tr>
          </thead>
          <tbody>
            ${rows.map((entry, index) => `
              <tr data-team="${esc(entry.team)}">
                <td>${index + 1}</td>
                <td><button class="team-inline" data-team="${esc(entry.team)}">${esc(team(entry.team).name)}</button></td>
                <td>${entry.wins ?? 0}</td>
                <td>${entry.losses ?? 0}</td>
                <td>${entry.pct ?? '.500'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderGames() {
    const gameList = games.length ? games : [
      { home: 'BOS', away: 'MIL', homeScore: 118, awayScore: 112, status: 'Final' },
      { home: 'NYK', away: 'LAL', homeScore: 104, awayScore: 109, status: 'Final' },
      { home: 'OKC', away: 'DEN', homeScore: 122, awayScore: 116, status: 'Final' },
      { home: 'GSW', away: 'DAL', homeScore: 118, awayScore: 120, status: 'Final' }
    ];

    return `
      <section class="page-heading">
        <div>
          <div class="eyebrow">NBA · Risultati</div>
          <h1>Partite</h1>
          <p class="section-sub">Ultimi risultati e agenda delle partite NBA.</p>
        </div>
        <span class="data-note">Aggiornato in tempo reale</span>
      </section>
      <div class="schedule-grid">
        ${gameList.map((game) => `
          <button class="game-card game-card-button" data-game="${esc(game.id || `${game.away}-${game.home}`)}">
            <div class="game-card-top"><span>${esc(timeLabel(game))}</span><span>● ${esc(game.status || 'Live')}</span></div>
            <div class="game-card-teams"><div class="game-team">${teamLogo(game.away)}<b>${esc(game.away)}</b><small>${esc(team(game.away).name)}</small></div><div class="game-card-score">${game.awayScore ?? '—'} : ${game.homeScore ?? '—'}<small>${esc(game.status || 'Programmata')}</small></div><div class="game-team">${teamLogo(game.home)}<b>${esc(game.home)}</b><small>${esc(team(game.home).name)}</small></div></div>
            <div class="game-detail"><span>Feed ESPN</span><b>${game.status?.toLowerCase().includes('final') ? 'Terminata' : 'In programma'}</b></div>
          </button>
        `).join('')}
      </div>
    `;
  }

  function timeLabel(game) {
    if (game.status && game.status.toLowerCase().includes('final')) return 'Final';
    return 'Oggi';
  }

  function renderLeaders() {
    const options = [
      ['pts', 'Punti per partita'], ['reb', 'Rimbalzi per partita'], ['ast', 'Assist per partita'],
      ['stl', 'Palle rubate per partita'], ['blk', 'Stoppate per partita'], ['min', 'Minuti per partita'],
      ['fgm', 'Canestri per partita'], ['fga', 'Tiri tentati per partita'], ['fgp', 'Percentuale dal campo'],
      ['tpm', 'Triple per partita'], ['tpa', 'Triple tentate per partita'], ['tpp', 'Percentuale da tre'],
      ['ftm', 'Tiri liberi per partita'], ['fta', 'Tiri liberi tentati per partita'], ['ftp', 'Percentuale ai liberi'],
      ['tov', 'Palle perse per partita'], ['pf', 'Falli per partita']
    ];
    const players = activePlayers().filter((player) => player.gamesPlayed > 0 && normalizeText(`${player.name} ${player.team}`).includes(normalizeText(leaderQuery))).sort((a, b) => numericStat(b, leaderStat) - numericStat(a, leaderStat)).slice(0, 100);
    const statLabel = options.find(([key]) => key === leaderStat)?.[1] || 'Punti per partita';
    return `
      <section class="page-heading">
        <div>
          <h1>Leader statistici</h1>
          <p class="section-sub">Ordina i giocatori per ciascuna statistica stagionale disponibile.</p>
        </div>
        <span class="data-note">Dati ESPN · ${statsLoading ? 'aggiornamento in corso' : 'aggiornati ora'}</span>
      </section>
      <div class="leader-controls"><label><span>Classifica per</span><select id="leader-stat">${options.map(([key, label]) => `<option value="${key}" ${leaderStat === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="directory-search"><span>⌕</span><input id="leader-search" type="search" value="${esc(leaderQuery)}" placeholder="Cerca un giocatore o una squadra…" /></label><button class="secondary-button" id="refresh-leaders">↻ Aggiorna</button></div>
      <div class="panel table-panel"><div class="stats-table-wrap"><table class="stats-table leader-table">
          <thead>
            <tr><th>#</th><th>Giocatore</th><th>Squadra</th><th>GP</th><th>${esc(leaderStat.toUpperCase())}</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th></tr>
          </thead>
          <tbody>
            ${players.map((player, index) => `
              <tr data-player="${esc(player.id)}">
                <td>${index + 1}</td>
                <td class="leader-player"><b>${esc(player.name)}</b><small>${esc(player.position)}</small></td>
                <td><button class="team-inline" data-team="${esc(player.team)}">${teamLogo(player.team)} ${esc(player.team)}</button></td>
                <td>${player.gamesPlayed || '—'}</td>
                <td class="strong-cell">${statOf(player, leaderStat)}</td>
                <td>${statOf(player, 'pts')}</td>
                <td>${statOf(player, 'reb')}</td>
                <td>${statOf(player, 'ast')}</td>
                <td>${statOf(player, 'stl')}</td>
                <td>${statOf(player, 'blk')}</td>
              </tr>
            `).join('') || `<tr><td colspan="10" class="leader-empty">Nessun risultato per questa ricerca.</td></tr>`}
          </tbody>
        </table></div></div>
      <p class="data-note" style="margin-top:9px">Graduatoria per ${esc(statLabel.toLowerCase())}; clicca un giocatore per aprire il profilo.</p>
    `;
  }

  function renderNews() {
    return `
      <section class="page-heading">
        <div>
          <div class="eyebrow">NBA · News</div>
          <h1>Tutte le notizie NBA</h1>
          <p class="section-sub">Rassegna ESPN: ${NEWS_ITEMS.length} aggiornamenti disponibili.</p>
        </div>
      </section>
      <div class="news-grid">
        ${NEWS_ITEMS.map((item) => `
          <a class="news-card large-news" ${item.sourceUrl ? `href="${esc(item.sourceUrl)}" target="_blank" rel="noreferrer"` : ''}>
            <div class="news-image"><span class="news-tag">${esc(item.tag)}</span><img src="${esc(item.image)}" alt="${esc(item.title)}" /></div>
            <div class="news-copy"><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p><small class="news-source">Fonte ESPN ↗</small></div>
          </a>
        `).join('')}
      </div>
    `;
  }

  function renderProfile(player) {
    if (!player) return '<div class="panel">Giocatore non trovato.</div>';
    const teamName = team(player.team).name;
    return `
      <section class="profile-banner">
        <div class="profile-copy">
          <button class="back-link" data-view="players">← Torna a giocatori</button>
          <div class="jersey-badge">#${player.number}</div>
          <h1>${esc(player.name)}</h1>
          <p>${esc(teamName)} · ${esc(player.position)} · ${esc(player.team)}</p>
          <div class="profile-actions">
            ${favoriteButton(player,true)}
            <button class="secondary-button" data-action="roster" data-player="${esc(player.id)}">Aggiungi al quintetto</button>
          </div>
        </div>
        ${playerPhoto(player, 'profile-portrait')}
      </section>
      <div class="profile-stat-bar">
        <div class="pbar-item"><span class="pbar-label">PTS</span><span class="pbar-value">${statOf(player, 'pts')}</span></div>
        <div class="pbar-item"><span class="pbar-label">REB</span><span class="pbar-value">${statOf(player, 'reb')}</span></div>
        <div class="pbar-item"><span class="pbar-label">AST</span><span class="pbar-value">${statOf(player, 'ast')}</span></div>
        <div class="pbar-item"><span class="pbar-label">FG%</span><span class="pbar-value">${statOf(player, 'fgp')}%</span></div>
        <div class="pbar-item"><span class="pbar-label">STL</span><span class="pbar-value">${statOf(player, 'stl')}</span></div>
        <div class="pbar-item"><span class="pbar-label">BLK</span><span class="pbar-value">${statOf(player, 'blk')}</span></div>
      </div>
      <section class="section-block">
        <div class="section-head"><div><h2 class="section-title">Statistiche principali</h2><p class="section-sub">Medie stagionali</p></div></div>
        <div class="panel table-panel">
          <table class="stats-table">
            <thead><tr><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>FG%</th><th>3P%</th><th>FT%</th></tr></thead>
            <tbody><tr>
              <td>${statOf(player, 'pts')}</td><td>${statOf(player, 'reb')}</td><td>${statOf(player, 'ast')}</td><td>${statOf(player, 'stl')}</td><td>${statOf(player, 'blk')}</td><td>${statOf(player, 'fgp')}%</td><td>${statOf(player, 'tpp')}%</td><td>${statOf(player, 'ftp')}%</td>
            </tr></tbody>
          </table>
        </div>
      </section>
    `;
  }

  async function fetchJson(url) {
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Feed indisponibile');
      return await response.json();
    } catch (error) {
      console.warn('Fetch feed NBA fallito:', error);
      return null;
    }
  }

  async function loadLiveFeeds() {
    await window.CAMPETTO_REFRESH_STANDINGS?.();

    const scheduleData = await fetchJson('https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard');
    if (scheduleData) {
      games = (scheduleData.events || []).map((event) => {
        const home = event.competitions?.[0]?.competitors?.find((item) => item.homeAway === 'home');
        const away = event.competitions?.[0]?.competitors?.find((item) => item.homeAway === 'away');
        const status = event.status?.type?.description || 'Live';
        return {
          id: event.id,
          homeTeamId: home?.team?.id,
          awayTeamId: away?.team?.id,
          home: home?.team?.abbreviation || 'BOS',
          away: away?.team?.abbreviation || 'MIL',
          homeScore: home?.score ?? 0,
          awayScore: away?.score ?? 0,
          status,
          date: event.date,
          venue: event.competitions?.[0]?.venue?.fullName || '',
          headline: event.competitions?.[0]?.notes?.[0]?.headline || '',
          period: event.status?.period || 0,
          clock: event.status?.displayClock || '',
          homeRecord: home?.records?.[0]?.summary || '',
          awayRecord: away?.records?.[0]?.summary || '',
          homeLinescores: home?.linescores?.map(item => item.displayValue || item.value) || [],
          awayLinescores: away?.linescores?.map(item => item.displayValue || item.value) || []
        };
      });
    }

    const newsData = await fetchJson('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=20&region=us&lang=en');
    const italianTitles = [
      'La notte NBA: risultati, protagonisti e numeri da ricordare',
      'NBA, la corsa alla vetta si accende: gli aggiornamenti del giorno',
      'Le stelle della lega fanno la differenza: cosa è successo in campo',
      'Infortuni, rientri e rotazioni: le novità dalle franchigie NBA',
      'Giovani talenti e veterani: i temi caldi della stagione NBA',
      'Verso le prossime sfide: calendario e notizie dalla lega'
    ];
    const articles = (newsData?.articles || []).slice(0, 20).map((article, index) => ({
      tag: 'NBA · ESPN',
      title: article.headline || article.title || italianTitles[index] || 'Aggiornamenti dal mondo NBA',
      summary: article.description || article.summary || `Pubblicato il ${article.published ? new Date(article.published).toLocaleDateString(window.CAMPETTO_LOCALE?.()||'it-IT') : 'oggi'} · ESPN.`,
      image: article.images?.find((image) => image?.ratio === '1x1')?.url || article.images?.[0]?.url || article.images?.[0]?.href || '',
      sourceUrl: article.links?.web?.href || article.link?.href || ''
      ,published: article.published || ''
    }));
    if (articles.length) {
      const localized=window.CAMPETTO_LOCALIZE_NEWS?await window.CAMPETTO_LOCALIZE_NEWS(articles):articles;
      NEWS_ITEMS.splice(0, NEWS_ITEMS.length, ...localized);
    }
  }

  function rosterPlayer(athlete, teamCode) {
    const id = String(athlete?.id || '');
    if (!id) return null;
    const name = athlete.fullName || athlete.displayName || athlete.shortName || 'Giocatore NBA';
    const number = athlete.jersey ?? athlete.number ?? '—';
    return {
      id: `espn-${id}`,
      espn: id,
      name,
      team: teamCode,
      position: athlete.position?.abbreviation || athlete.position?.displayName || '—',
      number,
      active: true,
      gamesPlayed: 0,
      stats: {},
      headshot: athlete.headshot?.href || athlete.headshot?.url || `https://a.espncdn.com/i/headshots/nba/500/${id}.png`,
      birth: athlete.dateOfBirth || '',
      college: athlete.college?.name || athlete.college || '',
      experience: athlete.experience?.years ?? (/rookie/i.test(String(athlete.experience?.displayValue || '')) ? 0 : Number(athlete.experience?.displayValue) || 99),
      draft: athlete.draft || null,
      displayDraft: athlete.displayDraft || ''
    };
  }

  function seasonStartYear() {
    const now = new Date();
    return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  }

  function nbaSeasonCode() {
    const year = seasonStartYear();
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  async function loadOfficialRookies() {
    const cached = readStorage(`${ROOKIE_CACHE_KEY}-${nbaSeasonCode()}`, null);
    if (cached?.players?.length && Date.now() - Number(cached.updatedAt || 0) < STATS_CACHE_MAX_AGE) {
      officialRookies = cached.players;
      return;
    }
    const params = new URLSearchParams({
      College: '', Conference: '', Country: '', DateFrom: '', DateTo: '', Division: '', DraftPick: '', DraftYear: '', GameScope: '', GameSegment: '', Height: '', LastNGames: '0', LeagueID: '00', Location: '', MeasureType: 'Base', Month: '0', OpponentTeamID: '0', Outcome: '', PORound: '0', PaceAdjust: 'N', PerMode: 'PerGame', Period: '0', PlayerExperience: 'Rookie', PlayerPosition: '', PlusMinus: 'N', Rank: 'N', Season: nbaSeasonCode(), SeasonSegment: '', SeasonType: 'Regular Season', ShotClockRange: '', StarterBench: '', TeamID: '0', TwoWay: '0', VsConference: '', VsDivision: '', Weight: ''
    });
    try {
      const response = await fetch(`https://stats.nba.com/stats/leaguedashplayerstats?${params.toString()}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Statistiche rookie NBA non disponibili');
      const data = await response.json();
      const result = data.resultSets?.[0];
      const headers = result?.headers || [];
      const rows = result?.rowSet || [];
      const index = (name) => headers.indexOf(name);
      officialRookies = rows.map((row) => {
        const name = row[index('PLAYER_NAME')];
        const rosterPlayer = activePlayers().find((player) => normalizeText(player.name) === normalizeText(name));
        if (!rosterPlayer) return null;
        return { name, team: row[index('TEAM_ABBREVIATION')], points: Number(row[index('PTS')]).toFixed(1), rebounds: Number(row[index('REB')]).toFixed(1), blocks: Number(row[index('BLK')]).toFixed(1), assists: Number(row[index('AST')]).toFixed(1), gamesPlayed: row[index('GP')], player: rosterPlayer };
      }).filter(Boolean).sort((left, right) => Number(right.points) - Number(left.points)).slice(0, 4);
      if (officialRookies.length) saveStorage(`${ROOKIE_CACHE_KEY}-${nbaSeasonCode()}`, { updatedAt: Date.now(), players: officialRookies });
    } catch (error) {
      console.info('Feed rookie ufficiale NBA non raggiungibile, uso le medie disponibili.', error);
    } finally {
      if (officialRookies.length) render();
    }
  }

  function numberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function parseEspnStats(row) {
    const stats = {};
    let gamesPlayed = 0;
    for (const category of row?.categories || []) {
      const values = category.values || category.totals || [];
      const categoryName = String(category.name || '').toLowerCase();
      if (categoryName === 'general') {
        gamesPlayed = numberValue(values[0]);
        for (const [key,index] of [['min',1],['pf',2],['reb',11]]) if(values[index]!=null&&Number.isFinite(Number(values[index])))stats[key]=Number(values[index]).toFixed(1);
      }
      if (categoryName === 'offensive') {
        const keys = ['pts', 'fgm', 'fga', 'fgp', 'tpm', 'tpa', 'tpp', 'ftm', 'fta', 'ftp', 'ast', 'tov'];
        keys.forEach((key, index) => {
          if (values[index] == null || !Number.isFinite(Number(values[index]))) return;
          stats[key] = ['fgp', 'tpp', 'ftp'].includes(key) ? Number(values[index]).toFixed(1) : Number(values[index]).toFixed(1);
        });
      }
      if (categoryName === 'defensive') {
        stats.stl = Number(values[0]).toFixed(1);
        stats.blk = Number(values[1]).toFixed(1);
      }
    }
    return { stats, gamesPlayed };
  }

  function applySeasonStats(rows) {
    const entries=(rows||[]).map(row=>({...parseEspnStats(row),id:String(row.athlete?.id||row.id||''),name:normalizeText(row.athlete?.displayName||row.athlete?.fullName||'')}));
    const byId=new Map(entries.map(entry=>[entry.id,entry]));
    const byName=new Map(entries.map(entry=>[entry.name,entry]));
    PLAYERS = PLAYERS.map((player) => {
      const idData=byId.get(String(player.espn));
      const data=(idData?.name===normalizeText(player.name)?idData:null)||byName.get(normalizeText(player.name));
      return data ? { ...player, stats: { ...player.stats, ...data.stats }, gamesPlayed: data.gamesPlayed || player.gamesPlayed } : player;
    });
    currentPlayer = playerById(currentPlayer?.id) || currentPlayer;
  }

  async function loadSeasonStats() {
    const cached = readStorage(`${STATS_CACHE_KEY}-${seasonStartYear()}`, null);
    if (cached?.rows?.length && Date.now() - Number(cached.updatedAt || 0) < STATS_CACHE_MAX_AGE) {
      applySeasonStats(cached.rows);
      return;
    }
    statsLoading = true;
    try {
      const url = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?region=us&lang=en&contentorigin=espn&limit=500&isqualified=false&season=${seasonStartYear()+1}`;
      const data = await fetchJson(url);
      const rows = data?.athletes || [];
      if (rows.length) {
        applySeasonStats(rows);
        saveStorage(`${STATS_CACHE_KEY}-${seasonStartYear()}`, { updatedAt: Date.now(), rows });
      }
    } finally {
      statsLoading = false;
      render();
    }
  }

  function applyRosterPlayers(players) {
    if (!Array.isArray(players) || !players.length) return;
    const originalByEspn = new Map(PLAYERS.map((player) => [String(player.espn || ''), player]));
    const originalByName = new Map(PLAYERS.map((player) => [normalizeText(player.name), player]));
    const rosterByEspn = new Map();
    for (const raw of players) {
      const player = raw && raw.id ? raw : null;
      if (!player) continue;
      const byId = originalByEspn.get(String(player.espn));
      const existing = (byId && normalizeText(byId.name) === normalizeText(player.name))
        ? byId
        : originalByName.get(normalizeText(player.name));
      rosterByEspn.set(String(player.espn), existing ? { ...player, ...existing, espn:player.espn, team: player.team, position: player.position || existing.position, number: player.number ?? existing.number, headshot: player.headshot || existing.headshot } : player);
    }
    // Mantiene le schede dimostrative soltanto se una rosa non è momentaneamente disponibile.
    for (const player of PLAYERS) {
      if (!player.active || rosterByEspn.has(String(player.espn))) continue;
      if (![...rosterByEspn.values()].some((entry) => entry.team === player.team)) rosterByEspn.set(String(player.espn), player);
    }
    PLAYERS = [...rosterByEspn.values()];
    currentPlayer = playerById(currentPlayer?.id)
      || PLAYERS.find((player) => normalizeText(player.name) === normalizeText(currentPlayer?.name))
      || PLAYERS[0]
      || currentPlayer;
  }

  async function loadRosters() {
    const cached = readStorage(ROSTER_CACHE_KEY, null);
    if (cached?.players?.length && Date.now() - Number(cached.updatedAt || 0) < ROSTER_CACHE_MAX_AGE) {
      applyRosterPlayers(cached.players);
      loadSeasonStats();
      return;
    }

    rostersLoading = true;
    render();
    try {
      const entries = await Promise.all(Object.keys(TEAM_INFO).map(async (teamCode) => {
        const slug=({GSW:'gs',NYK:'ny',NOP:'no',SAS:'sa',UTA:'utah',WAS:'wsh'})[teamCode]||teamCode.toLowerCase();
        const data = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${slug}/roster`);
        const athletes = Array.isArray(data?.athletes) ? data.athletes : [];
        return athletes.map((athlete) => rosterPlayer(athlete, teamCode)).filter(Boolean);
      }));
      const players = entries.flat();
      if (players.length >= 300) {
        applyRosterPlayers(players);
        saveStorage(ROSTER_CACHE_KEY, { updatedAt: Date.now(), players });
        loadSeasonStats();
      } else {
        console.warn('Le rose ESPN non sono complete: mantengo i dati già disponibili.');
      }
    } finally {
      rostersLoading = false;
      render();
    }
  }

  function handleViewAction(action) {
    switch (action) {
      case 'home': view = 'home'; break;
      case 'players': view = 'players'; break;
      case 'teams': view = 'teams'; break;
      case 'leaders': view = 'leaders'; break;
      case 'games': view = 'games'; break;
      case 'standings': view = 'standings'; break;
      case 'news': view = 'news'; break;
      case 'fantasy': view = 'fantasy'; break;
      case 'rookies': view = 'rookies'; break;
      default: view = 'home';
    }
    render();
  }

  function bindGenericHandlers() {
    document.querySelectorAll('.nav-link').forEach((button) => {
      button.onclick = () => handleViewAction(button.dataset.view);
    });

    document.querySelectorAll('[data-view]').forEach((button) => {
      if (button.classList.contains('nav-link')) return;
      button.onclick = () => handleViewAction(button.dataset.view);
    });

    document.querySelectorAll('[data-player]').forEach((button) => {
      if (button.dataset.action) return;
      if (button.dataset.bound === '1') return;
      button.dataset.bound = '1';
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const id = button.dataset.player;
        const player = playerById(id);
        if (player) {
          previousView = view;
          currentPlayer = player;
          view = 'profile';
          render();
        }
      });
    });

    document.querySelectorAll('[data-rookie-name]').forEach((button) => {
      if (button.dataset.rookieBound === '1') return;
      button.dataset.rookieBound = '1';
      button.addEventListener('click', () => {
        const rookie = rookies().find((entry) => normalizeText(entry.name) === normalizeText(button.dataset.rookieName));
        if (!rookie) return;
        previousView = view;
        currentPlayer = rookiePlayer(rookie);
        view = 'profile';
        render();
      });
    });

    document.querySelectorAll('[data-team]').forEach((button) => {
      if (button.dataset.teamBound === '1') return;
      button.dataset.teamBound = '1';
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const code = button.dataset.team;
        view = 'teams';
        renderTeamPage(code);
      });
    });

    document.querySelectorAll('[data-action="favorite"]').forEach((button) => {
      button.onclick = (event) => {
        event.stopPropagation();
        toggleFavorite(button.dataset.player);
      };
    });

    document.querySelectorAll('[data-action="roster"]').forEach((button) => {
      button.onclick = (event) => {
        event.stopPropagation();
        addToRoster(button.dataset.player);
      };
    });

    const directorySearch = document.getElementById('player-search');
    if (directorySearch) directorySearch.oninput = () => { playerQuery = directorySearch.value; render(); };
    document.querySelectorAll('[data-letter]').forEach((button) => {
      button.onclick = () => { playerInitial = button.dataset.letter; render(); };
    });
    const leaderSelect = document.getElementById('leader-stat');
    if (leaderSelect) leaderSelect.onchange = () => { leaderStat = leaderSelect.value; render(); };
    const leaderSearch = document.getElementById('leader-search');
    if (leaderSearch) leaderSearch.oninput = () => { leaderQuery = leaderSearch.value; render(); };
    const refreshLeaders = document.getElementById('refresh-leaders');
    if (refreshLeaders) refreshLeaders.onclick = () => { localStorage.removeItem(`${STATS_CACHE_KEY}-${seasonStartYear()}`); loadSeasonStats(); };
    const addLineup = document.getElementById('add-lineup-player');
    if (addLineup) addLineup.onclick = () => {
      const playerId = document.getElementById('fantasy-player')?.value;
      const slot = document.getElementById('fantasy-slot')?.value;
      if (!playerId || !slot) return setToast('Scegli prima un giocatore e un ruolo');
      lineup = { ...lineup, [slot]: playerId };
      saveStorage('campetto-lineup-v2', lineup);
      setToast('Giocatore aggiunto al campo');
      render();
    };
    document.querySelectorAll('[data-lineup-remove]').forEach((button) => {
      button.onclick = () => { const next = { ...lineup }; delete next[button.dataset.lineupRemove]; lineup = next; saveStorage('campetto-lineup-v2', lineup); render(); };
    });
  }

  function renderTeamPage(code) {
    const info = team(code);
    const rosterPlayers = activePlayers().filter((player) => player.team === code);
    root.innerHTML = `
      <section class="page-heading">
        <div>
          <div class="eyebrow">NBA · Squadra</div>
          <h1>${esc(info.name)}</h1>
          <p class="section-sub">${esc(info.city)} · formazione e statistica squadra</p>
        </div>
        <button class="secondary-button" data-view="teams">Tutte le squadre</button>
      </section>
      <div class="team-summary-grid">
        <article class="team-summary-card"><span>ROSA</span><b>${rosterPlayers.length}</b><small>Giocatori attivi</small></article>
        <article class="team-summary-card"><span>STAT</span><b>PTS</b><small>${rosterPlayers[0] ? statOf(rosterPlayers[0], 'pts') : '—'}</small></article>
        <article class="team-summary-card"><span>CREA</span><b>AST</b><small>${rosterPlayers[0] ? statOf(rosterPlayers[0], 'ast') : '—'}</small></article>
      </div>
      <div class="player-grid">
        ${rosterPlayers.map(playerCard).join('') || '<div class="panel">Nessun giocatore disponibile.</div>'}
      </div>
    `;
    renderNavState();
    bindGenericHandlers();
  }

  function render() {
    if (!root) return;

    if (view === 'home') root.innerHTML = renderHome();
    else if (view === 'players') root.innerHTML = renderPlayers();
    else if (view === 'standings') root.innerHTML = renderStandings();
    else if (view === 'games') root.innerHTML = renderGames();
    else if (view === 'leaders') root.innerHTML = renderLeaders();
    else if (view === 'news') root.innerHTML = renderNews();
    else if (view === 'profile') root.innerHTML = renderProfile(currentPlayer);
    else if (view === 'teams') root.innerHTML = renderTeams();
    else if (view === 'fantasy') root.innerHTML = renderFantasy();
    else if (view === 'rookies') root.innerHTML = renderRookies();

    renderNavState();
    bindGenericHandlers();
    if (searchInput?.value.trim() && document.activeElement === searchInput) updateGlobalSearch();
  }

  let activeSearchIndex = -1;
  function closeGlobalSearch(collapse = false) {
    document.getElementById('search-results')?.classList.remove('open');
    searchInput?.setAttribute('aria-expanded','false');
    searchInput?.removeAttribute('aria-activedescendant');
    activeSearchIndex = -1;
    if(collapse) searchInput?.closest('.search-box')?.classList.remove('search-open');
  }
  function updateGlobalSearch() {
    const query=normalizeText(searchInput.value.trim());
    const list=document.getElementById('search-results');
    if(!list||!query){closeGlobalSearch();return}
    const teams=Object.keys(TEAM_INFO).filter(code=>normalizeText(`${code} ${team(code).city} ${team(code).name}`).includes(query)).slice(0,3);
    const matches=PLAYERS.filter(player=>normalizeText(`${player.name} ${player.team} ${team(player.team).city} ${team(player.team).name}`).includes(query))
      .sort((a,b)=>Number(normalizeText(b.name).startsWith(query))-Number(normalizeText(a.name).startsWith(query))||a.name.localeCompare(b.name,'it')).slice(0,6);
    list.innerHTML=[...teams.map(code=>`<button type="button" class="search-result" role="option" aria-selected="false" data-search-team="${esc(code)}"><img src="${esc(logoUrl(code))}" alt=""><span><b>${esc(team(code).city)} ${esc(team(code).name)}</b><small>Squadra · rosa e statistiche</small></span></button>`),...matches.map(player=>`<button type="button" class="search-result" role="option" aria-selected="false" data-search-player="${esc(player.id)}"><span class="search-player-icon" aria-hidden="true">◎</span><span><b>${esc(player.name)}</b><small>${esc(team(player.team).name)} · ${esc(player.position)}</small></span></button>`)].join('')||'<div class="search-empty" role="status">Nessun giocatore o squadra trovato.</div>';
    list.querySelectorAll('[role="option"]').forEach((option,index)=>{option.id=`global-search-option-${index}`});
    activeSearchIndex=-1;searchInput.removeAttribute('aria-activedescendant');
    list.classList.add('open');searchInput.setAttribute('aria-expanded','true');
  }
  function bindGlobalSearch() {
    if(!searchInput)return;
    const box=searchInput.closest('.search-box'),list=document.getElementById('search-results');
    searchInput.addEventListener('input',updateGlobalSearch);
    searchInput.addEventListener('focus',()=>{if(searchInput.value.trim())updateGlobalSearch()});
    box.querySelector('.search-toggle')?.addEventListener('click',()=>{box.classList.add('search-open');searchInput.focus()});
    box.querySelector('kbd').textContent=/Mac|iPhone|iPad/.test(navigator.platform)?'⌘ K':'Ctrl K';
    list.addEventListener('click',event=>{
      const option=event.target.closest('[role="option"]');if(!option)return;
      const player=option.dataset.searchPlayer&&playerById(option.dataset.searchPlayer),code=option.dataset.searchTeam;
      closeGlobalSearch(true);searchInput.value='';
      if(player){previousView=view;currentPlayer=player;view='profile';render();window.scrollTo({top:0,behavior:'smooth'})}
      else if(code)window.CAMPETTO_OPEN_TEAM?.(code);
      root.querySelector('h1')?.setAttribute('tabindex','-1');root.querySelector('h1')?.focus({preventScroll:true});
    });
    searchInput.addEventListener('keydown',event=>{
      if(event.key==='Escape'){closeGlobalSearch(true);searchInput.blur();return}
      if(!['ArrowDown','ArrowUp','Enter'].includes(event.key))return;
      const options=[...list.querySelectorAll('[role="option"]')];
      if(event.key==='Enter'){if(list.classList.contains('open')&&options.length){event.preventDefault();options[Math.max(0,activeSearchIndex)].click()}return}
      if(!options.length)return;event.preventDefault();list.classList.add('open');searchInput.setAttribute('aria-expanded','true');
      activeSearchIndex=(activeSearchIndex+(event.key==='ArrowDown'?1:activeSearchIndex<0?0:-1)+options.length)%options.length;
      options.forEach((option,index)=>option.setAttribute('aria-selected',String(index===activeSearchIndex)));
      searchInput.setAttribute('aria-activedescendant',options[activeSearchIndex].id);options[activeSearchIndex].scrollIntoView({block:'nearest'});
    });
    document.addEventListener('click',event=>{if(!box.contains(event.target))closeGlobalSearch(true)},true);
    document.addEventListener('focusin',event=>{if(!box.contains(event.target))closeGlobalSearch(true)});
    document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();box.classList.add('search-open');searchInput.focus();searchInput.select()}});
  }

  document.querySelectorAll('.nav-link').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.view;
      if (target === 'home') view = 'home';
      else if (target === 'players') view = 'players';
      else if (target === 'teams') view = 'teams';
      else if (target === 'leaders') view = 'leaders';
      else if (target === 'games') view = 'games';
      else if (target === 'standings') view = 'standings';
      else if (target === 'news') view = 'news';
      else if (target === 'fantasy') view = 'fantasy';
      render();
    });
  });

  document.body.addEventListener('click', (event) => {
    const resultItem = event.target.closest('.search-item');
    if (resultItem) {
      const chosen = playerById(resultItem.dataset.player);
      if (chosen) {
        currentPlayer = chosen; view = 'profile'; render();
      }
    }

    const teamButton = event.target.closest('[data-team]');
    if (teamButton && teamButton.dataset.team && !teamButton.dataset.player) {
      const code = teamButton.dataset.team;
      if (TEAM_INFO[code]) {
        view = 'teams';
        renderTeamPage(code);
      }
    }
  });

  window.CAMPETTO_APP = {
    render,
    team,
    playerById,
    setView: (nextView) => { view = nextView; render(); }
  };

  // Bridge per i moduli Campetto caricati dopo l'app principale.
  const publicState = {root,TEAM_INFO,PLAYERS,currentPlayer,profileTab,favorites,roster,standings,games,rostersLoading,view,previousView,NEWS_ITEMS,lineup};
  for (const name of Object.keys(publicState)) {
    Object.defineProperty(window, name, {
      configurable: true,
      enumerable: false,
      get: () => name === 'root' || name === 'TEAM_INFO' ? publicState[name] : eval(name),
      set: name === 'root' || name === 'TEAM_INFO' ? undefined : value => { eval(`${name} = value`); }
    });
  }
  const publicFunctions = {render,team,playerById,activePlayers,readStorage,saveStorage,logoUrl,playerCard,bindGenericHandlers,loadLiveFeeds,applyRosterPlayers,renderProfile,toggleFavorite,addToRoster,removeFromRoster,setToast};
  for (const [name,fn] of Object.entries(publicFunctions)) {
    if (name === 'render' || name === 'loadLiveFeeds' || name === 'applyRosterPlayers' || name === 'renderProfile' || name === 'toggleFavorite' || name === 'addToRoster' || name === 'removeFromRoster') {
      Object.defineProperty(window,name,{configurable:true,enumerable:false,get:()=>eval(name),set:value=>{eval(`${name} = value`)}});
    } else window[name] = fn;
  }

  bindGlobalSearch();
  loadLiveFeeds().finally(() => render());
  loadRosters();
  loadSeasonStats();
  loadOfficialRookies();
  render();
})();
