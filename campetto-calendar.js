/* Calendario per data italiana. I risultati storici restano separati dal tabellone live. */
(() => {
  const zone='Europe/Rome';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const canonical=code=>({GS:'GSW',NY:'NYK',NO:'NOP',SA:'SAS',UTAH:'UTA',WSH:'WAS',PHO:'PHX'}[code]||code);
  const words={
    it:{title:'Partite e calendario',intro:'Risultati delle partite precedenti e prossimi incontri NBA.',zone:'Date e orari italiani',previous:'Giorno precedente',next:'Giorno successivo',choose:'Scegli una data',today:'Oggi',yesterday:'Ieri',tomorrow:'Domani',refresh:'Aggiorna',loading:'Caricamento delle partite…',empty:'Nessuna partita NBA in calendario per questa data.',error:'Il calendario non è disponibile. Riprova tra poco.',partial:'Alcune partite non sono state caricate. Premi Aggiorna per riprovare.',stale:'Mostriamo gli ultimi dati disponibili.',final:'Finale',live:'In corso',scheduled:'In programma',postponed:'Rinviata',cancelled:'Annullata',results:'Risultati',upcoming:'Prossime partite',stats:'Apri tabellino e statistiche',preview:'Apri la partita',count:'partite',updated:'Aggiornato alle'},
    en:{title:'Games and schedule',intro:'Previous results and upcoming NBA games.',zone:'Dates and times in Italy',previous:'Previous day',next:'Next day',choose:'Choose a date',today:'Today',yesterday:'Yesterday',tomorrow:'Tomorrow',refresh:'Refresh',loading:'Loading games…',empty:'No NBA games scheduled for this date.',error:'The schedule is unavailable. Try again shortly.',partial:'Some games could not be loaded. Select Refresh to try again.',stale:'Showing the latest available data.',final:'Final',live:'Live',scheduled:'Scheduled',postponed:'Postponed',cancelled:'Cancelled',results:'Results',upcoming:'Upcoming games',stats:'Open box score and statistics',preview:'Open game',count:'games',updated:'Updated at'},
    es:{title:'Partidos y calendario',intro:'Resultados anteriores y próximos partidos de la NBA.',zone:'Fechas y horarios de Italia',previous:'Día anterior',next:'Día siguiente',choose:'Elige una fecha',today:'Hoy',yesterday:'Ayer',tomorrow:'Mañana',refresh:'Actualizar',loading:'Cargando partidos…',empty:'No hay partidos de la NBA programados para esta fecha.',error:'El calendario no está disponible. Inténtalo de nuevo en breve.',partial:'Algunos partidos no se han cargado. Pulsa Actualizar para reintentar.',stale:'Mostramos los últimos datos disponibles.',final:'Final',live:'En juego',scheduled:'Programado',postponed:'Aplazado',cancelled:'Cancelado',results:'Resultados',upcoming:'Próximos partidos',stats:'Abrir estadísticas del partido',preview:'Abrir partido',count:'partidos',updated:'Actualizado a las'},
    fr:{title:'Matchs et calendrier',intro:'Résultats précédents et prochains matchs NBA.',zone:'Dates et horaires en Italie',previous:'Jour précédent',next:'Jour suivant',choose:'Choisir une date',today:'Aujourd’hui',yesterday:'Hier',tomorrow:'Demain',refresh:'Actualiser',loading:'Chargement des matchs…',empty:'Aucun match NBA prévu à cette date.',error:'Le calendrier est indisponible. Réessayez dans un instant.',partial:'Certains matchs n’ont pas été chargés. Appuyez sur Actualiser.',stale:'Les dernières données disponibles sont affichées.',final:'Terminé',live:'En cours',scheduled:'À venir',postponed:'Reporté',cancelled:'Annulé',results:'Résultats',upcoming:'Prochains matchs',stats:'Ouvrir les statistiques du match',preview:'Ouvrir le match',count:'matchs',updated:'Mis à jour à'}
  };
  const text=()=>words[window.CAMPETTO_I18N?.language]||words.it;
  const locale=()=>window.CAMPETTO_LOCALE?.()||'it-IT';
  function dayKey(value=new Date()) {
    const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const valueFor=type=>parts.find(part=>part.type===type)?.value;
    return `${valueFor('year')}-${valueFor('month')}-${valueFor('day')}`;
  }
  function shiftDay(key,days) {
    const date=new Date(`${key}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+days);
    return date.toISOString().slice(0,10);
  }
  function validDay(key) {return /^\d{4}-\d{2}-\d{2}$/.test(key)&&Number.isFinite(Date.parse(`${key}T12:00:00Z`))&&new Date(`${key}T12:00:00Z`).toISOString().slice(0,10)===key}
  const dayLabel=(key,options={weekday:'long',day:'numeric',month:'long',year:'numeric'})=>new Date(`${key}T12:00:00Z`).toLocaleDateString(locale(),{...options,timeZone:zone});
  const startTime=game=>new Date(game.date).toLocaleTimeString(locale(),{timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false});
  const score=value=>{const raw=value&&typeof value==='object'?value.displayValue??value.value:value;return raw!==''&&raw!=null&&Number.isFinite(Number(raw))?Number(raw):null};
  function normalizeGame(event) {
    const competition=event.competitions?.[0],home=competition?.competitors?.find(item=>item.homeAway==='home'),away=competition?.competitors?.find(item=>item.homeAway==='away');
    if(!event.id||!event.date||!home?.team||!away?.team)return null;
    const status=event.status||competition.status||{},type=status.type||{};
    const state=type.state||(type.completed||/final/i.test(type.description||'')?'post':'pre');
    return {id:String(event.id),date:event.date,home:canonical(home.team.abbreviation),away:canonical(away.team.abbreviation),homeTeamId:home.team.id,awayTeamId:away.team.id,homeScore:state==='pre'?null:score(home.score),awayScore:state==='pre'?null:score(away.score),status:type.description||'',statusName:type.name||'',state,completed:!!type.completed,venue:competition.venue?.fullName||'',headline:competition.notes?.[0]?.headline||'',period:status.period||0,clock:status.displayClock||'',homeRecord:home.records?.[0]?.summary||'',awayRecord:away.records?.[0]?.summary||'',homeLinescores:home.linescores?.map(item=>item.displayValue??item.value)||[],awayLinescores:away.linescores?.map(item=>item.displayValue??item.value)||[]};
  }
  function statusLabel(game) {
    const w=text();if(/postpon/i.test(game.statusName+' '+game.status))return w.postponed;
    if(/cancel/i.test(game.statusName+' '+game.status))return w.cancelled;
    return game.state==='post'?w.final:game.state==='in'?w.live:w.scheduled;
  }
  function mergeDay(responses,key) {
    const unique=new Map();
    responses.forEach(response=>(response.events||[]).forEach(event=>{const game=normalizeGame(event);if(game&&dayKey(game.date)===key)unique.set(game.id,game)}));
    return [...unique.values()].sort((a,b)=>new Date(a.date)-new Date(b.date));
  }
  const cache=new Map(),pending=new Map();let selected=dayKey();
  function fresh(entry,key) {
    if(!entry)return false;
    const minutes=entry.error||entry.partial||key===dayKey()||entry.games.some(game=>game.state==='in')?1:5;
    return Date.now()-entry.updatedAt<minutes*60000;
  }
  async function fetchDay(key,force=false) {
    if(pending.has(key))return pending.get(key);
    if(!force&&fresh(cache.get(key),key))return cache.get(key);
    const task=(async()=>{
      // Una giornata italiana comprende la notte NBA precedente e gli incontri serali.
      // ESPN accetta un singolo giorno NBA: due richieste evitano buchi intorno a mezzanotte.
      const requests=[shiftDay(key,-1),key].map(async date=>{
        const response=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date.replace(/-/g,'')}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const data=await response.json();if(!Array.isArray(data.events))throw new Error('Calendario non valido');return data;
      });
      const results=await Promise.allSettled(requests),successful=results.filter(result=>result.status==='fulfilled').map(result=>result.value);
      const previous=cache.get(key),error=!successful.length,partial=successful.length===1;
      let list=mergeDay(successful,key);
      if(error&&previous)list=previous.games;
      else if(partial&&previous){const combined=new Map(previous.games.map(game=>[game.id,game]));list.forEach(game=>combined.set(game.id,game));list=[...combined.values()].sort((a,b)=>new Date(a.date)-new Date(b.date))}
      const entry={games:list,error,partial,updatedAt:Date.now(),lastSuccess:error?previous?.lastSuccess:Date.now()};
      cache.set(key,entry);if(cache.size>45)cache.delete(cache.keys().next().value);return entry;
    })();
    pending.set(key,task);
    try{return await task}finally{pending.delete(key);if(window.view==='games'&&selected===key)window.render()}
  }
  function gameCard(game) {
    const w=text(),pre=game.state==='pre';
    const label=statusLabel(game),teamPart=code=>`<span class="calendar-team"><img src="${esc(logoUrl(code))}" alt="" loading="lazy"><b>${esc(team(code).name)}</b><small>${esc(code)}</small></span>`;
    return `<button type="button" class="calendar-game ${game.state==='in'?'is-live':''}" data-calendar-game="${esc(game.id)}" aria-label="${esc(team(game.away).name)} – ${esc(team(game.home).name)} · ${esc(pre?startTime(game):`${game.awayScore??'—'} – ${game.homeScore??'—'}`)} · ${esc(pre?w.preview:w.stats)}"><span class="calendar-game-top"><time datetime="${esc(game.date)}">${esc(startTime(game))}</time><span>${esc(label)}</span></span><span class="calendar-matchup">${teamPart(game.away)}<span class="calendar-score"><strong>${pre?esc(startTime(game)):`${esc(game.awayScore??'—')} <i>–</i> ${esc(game.homeScore??'—')}`}</strong><small>${game.state==='in'?`Q${esc(game.period)} · ${esc(game.clock)}`:esc(label)}</small></span>${teamPart(game.home)}</span><span class="calendar-game-bottom"><span>${esc(game.venue||'NBA · ESPN')}</span><b>${esc(pre?w.preview:w.stats)} ↗</b></span></button>`;
  }
  function renderCalendar() {
    const w=text(),entry=cache.get(selected),loading=pending.has(selected),list=entry?.games||[],today=dayKey();
    const groups=[['in',w.live],['post',w.results],['pre',w.upcoming]].map(([state,label])=>({label,list:list.filter(game=>game.state===state)})).filter(group=>group.list.length);
    const warning=entry?.error?w.error:entry?.partial?w.partial:'';
    return `<section class="calendar-page" data-no-translate><header class="page-heading"><div><div class="eyebrow">NBA · ${esc(w.title)}</div><h1>${esc(w.title)}</h1><p class="section-sub">${esc(w.intro)}</p></div><span class="data-note">${esc(w.zone)}</span></header><section class="calendar-controls" aria-label="${esc(w.choose)}"><div class="calendar-date-picker"><button type="button" data-calendar-shift="-1" aria-label="${esc(w.previous)}">←</button><label><span>${esc(w.choose)}</span><input id="calendar-date" type="date" value="${esc(selected)}" min="1946-11-01" max="2100-12-31" aria-label="${esc(w.choose)}"></label><button type="button" data-calendar-shift="1" aria-label="${esc(w.next)}">→</button></div><div class="calendar-shortcuts">${[[-1,w.yesterday],[0,w.today],[1,w.tomorrow]].map(([offset,label])=>`<button type="button" class="${selected===shiftDay(today,offset)?'active':''}" data-calendar-date="${shiftDay(today,offset)}">${esc(label)}</button>`).join('')}<button type="button" data-calendar-refresh ${loading?'disabled':''}>↻ ${esc(w.refresh)}</button></div></section><nav class="calendar-week" aria-label="${esc(w.choose)}">${[-3,-2,-1,0,1,2,3].map(offset=>{const key=shiftDay(selected,offset);return `<button type="button" data-calendar-date="${key}" class="${key===selected?'active':''}" ${key===selected?'aria-current="date"':''}><small>${esc(dayLabel(key,{weekday:'short'}))}</small><strong>${esc(dayLabel(key,{day:'numeric'}))}</strong><span>${esc(dayLabel(key,{month:'short'}))}</span></button>`}).join('')}</nav><div class="calendar-day-heading"><h2>${esc(dayLabel(selected))}</h2><span>${entry?`${list.length} ${esc(w.count)}`:''}${entry?.lastSuccess?` · ${esc(w.updated)} ${esc(new Date(entry.lastSuccess).toLocaleTimeString(locale(),{timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false}))}`:''}</span></div>${warning?`<p class="calendar-warning" role="status">${esc(warning)}${entry?.error&&list.length?` ${esc(w.stale)}`:''}</p>`:''}<div class="calendar-content" aria-busy="${loading}">${!list.length?`<div class="calendar-empty" role="status">${esc(loading?w.loading:entry?.error?w.error:w.empty)}</div>`:groups.map(group=>`<section class="calendar-group"><h3>${esc(group.label)} <span>${group.list.length}</span></h3><div class="calendar-games">${group.list.map(gameCard).join('')}</div></section>`).join('')}</div></section>`;
  }
  function chooseDate(key) {
    if(!validDay(key)||key<'1946-11-01'||key>'2100-12-31')return;
    selected=key;window.render();
  }
  function bindCalendar() {
    root.querySelectorAll('[data-calendar-shift]').forEach(button=>button.onclick=()=>chooseDate(shiftDay(selected,Number(button.dataset.calendarShift))));
    root.querySelectorAll('[data-calendar-date]').forEach(button=>button.onclick=()=>chooseDate(button.dataset.calendarDate));
    root.querySelector('#calendar-date')?.addEventListener('change',event=>chooseDate(event.target.value));
    root.querySelector('[data-calendar-refresh]')?.addEventListener('click',()=>{fetchDay(selected,true);window.render()});
    root.querySelectorAll('[data-calendar-game]').forEach(button=>button.onclick=()=>{
      const game=cache.get(selected)?.games.find(item=>item.id===button.dataset.calendarGame);
      if(game)window.CAMPETTO_OPEN_GAME?.(game);
    });
  }
  const previousRender=window.render;
  window.render=function(){
    previousRender();if(window.view!=='games')return;
    if(!pending.has(selected)&&!fresh(cache.get(selected),selected))fetchDay(selected);
    root.innerHTML=renderCalendar();bindCalendar();
    document.querySelector('#breadcrumb-current').textContent=text().title;
  };
  setInterval(()=>{if(window.view==='games'&&!document.hidden&&!(root.contains(document.activeElement)&&document.activeElement?.matches('input,select,textarea')))fetchDay(selected)},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&window.view==='games'){fetchDay(selected);window.render()}});
  window.CAMPETTO_CALENDAR={dayKey,shiftDay,normalizeGame,mergeDay,validDay,statusLabel,gameCard,fetchDay,get selectedDate(){return selected}};
  if(window.view==='games')window.render();
})();
