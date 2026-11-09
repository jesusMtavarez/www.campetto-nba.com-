/* Scelte NBA Draft: dati pubblici ESPN, con cache e richieste limitate. */
(() => {
  const season = new Date().getFullYear() + (new Date().getMonth() >= 8 ? 1 : 0);
  const key = `campetto-rookie-draft-v1-${season}`;
  const empty = () => ({status:'unknown', year:null, round:null, pick:null});
  const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const positive = value => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
  let cache;
  try { cache = JSON.parse(localStorage.getItem(key) || '{}'); } catch { cache = {}; }
  if (!cache || typeof cache !== 'object' || Array.isArray(cache)) cache = {};
  const pending = new Set(), queue = [];
  let running = 0;

  function parseDraft(athlete) {
    const draft = athlete?.draft;
    const text = String(athlete?.displayDraft || (typeof draft === 'string' ? draft : draft?.displayText || draft?.displayDraft) || '').trim();
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? Number(yearMatch[0]) : positive(draft?.year);
    if (/\bundrafted\b|non scelto/i.test(text) || draft?.undrafted === true) return {status:'undrafted', year, round:null, pick:null};
    const roundMatch = text.match(/\b(?:Rd\.?|Round)\s*(\d+)\b/i);
    const pickMatch = text.match(/\b(?:Pk\.?|Pick)\s*#?\s*(\d+)\b/i);
    const round = roundMatch ? positive(roundMatch[1]) : positive(draft?.round);
    // ESPN displayDraft uses the overall pick, including round two (e.g. #41).
    // Do not interpret a generic round-relative "pick" field as an overall pick.
    const pick = pickMatch ? positive(pickMatch[1]) : positive(draft?.overallPick ?? draft?.overall);
    return pick ? {status:'drafted', year, round, pick} : {...empty(), year};
  }

  function fresh(entry) {
    const ttl = entry?.failed ? 5 * 60 * 1000 : entry?.info?.status === 'unknown' ? 6 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    return entry && Date.now() - Number(entry.updatedAt || 0) < ttl;
  }
  function infoFor(player) {
    const direct = parseDraft(player);
    if (direct.status !== 'unknown') return direct;
    const id = String(player?.espn || '');
    const saved = cache[id];
    return saved && normalized(saved.name) === normalized(player?.name) ? {...saved.info, loading:pending.has(id)} : {...direct, loading:pending.has(id)};
  }
  function describe(info = empty()) {
    if (info.status === 'drafted') return {label:`Pick #${info.pick}`, detail:[info.year ? `Draft ${info.year}` : 'NBA Draft', info.round ? `${info.round}° giro` : 'Scelta assoluta'].join(' · ')};
    if (info.status === 'undrafted') return {label:'Non scelto', detail:info.year ? `Draft ${info.year} · non scelto` : 'Non scelto al Draft NBA'};
    return {label:info.loading ? 'Draft in caricamento…' : 'Pick non disponibile', detail:info.year ? `Draft ${info.year}` : 'Dato non esposto dalla fonte'};
  }
  function save() { try { localStorage.setItem(key, JSON.stringify(cache)); } catch {} }
  function drain() {
    while (running < 3 && queue.length) {
      const player = queue.shift(), id = String(player.espn);
      running++;
      (async () => {
        let info = empty(), failed = false;
        try {
          const response = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${encodeURIComponent(id)}?region=us&lang=en&contentorigin=espn`, {signal:AbortSignal.timeout(15000)});
          if (!response.ok) throw new Error(`Draft HTTP ${response.status}`);
          const data = await response.json(), athlete = data.athlete;
          if (String(athlete?.id) !== id || normalized(athlete.displayName || athlete.fullName) !== normalized(player.name)) throw new Error('Profilo Draft non corrispondente');
          info = parseDraft(athlete);
        } catch (error) { failed = true; console.info('Scelta Draft non disponibile:', player.name, error.message); }
        cache[id] = {name:player.name, info, failed, updatedAt:Date.now()};
        pending.delete(id); running--; save(); drain();
        if (!running && !queue.length && ['home','rookies'].includes(window.view)) window.render?.();
      })();
    }
  }
  function loadFor(players) {
    for (const player of players) {
      const id = String(player?.espn || '');
      if (!/^\d+$/.test(id) || pending.has(id) || parseDraft(player).status !== 'unknown') continue;
      const entry = cache[id];
      if (fresh(entry) && normalized(entry.name) === normalized(player.name)) continue;
      pending.add(id); queue.push(player);
    }
    drain();
  }
  window.CAMPETTO_DRAFT = {parseDraft, infoFor, describe, loadFor};
})();
