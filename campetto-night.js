(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const canonical=code=>({GS:'GSW',NY:'NYK',NO:'NOP',SA:'SAS',UTAH:'UTA',WSH:'WAS',PHO:'PHX'}[code]||code);
  const cache=new Map(), pending=new Set();
  let activeId='',timer,paused=false;
  const finished=game=>/final|terminat/i.test(game.status||'');
  function starOf(game,data){
    const winner=Number(game.awayScore)>Number(game.homeScore)?game.away:game.home;
    const winnerBox=(data.boxscore?.players||[]).find(box=>canonical(box.team?.abbreviation)===canonical(winner));
    const group=winnerBox?.statistics?.[0], labels=group?.labels||[], index=label=>labels.findIndex(value=>value.toUpperCase()===label);
    const scorers=(group?.athletes||[]).filter(row=>row.stats?.length).sort((a,b)=>Number(b.stats[index('PTS')]||0)-Number(a.stats[index('PTS')]||0));
    const row=scorers[0];if(!row)return null;
    const athlete=row.athlete||{};
    const stats=['PTS','REB','AST'].map(label=>({label:({PTS:'PUNTI',REB:'RIMBALZI',AST:'ASSIST'})[label],value:row.stats[index(label)]??'—'}));
    return {name:athlete.displayName||athlete.fullName,image:athlete.headshot?.href||`https://a.espncdn.com/i/headshots/nba/500/${athlete.id}.png`,stats,winner};
  }
  function loadHighlights(list){
    list.forEach(game=>{if(cache.has(String(game.id))||pending.has(String(game.id))||!game.id)return;pending.add(String(game.id));window.CAMPETTO_GAME_SUMMARY(game.id).then(data=>{cache.set(String(game.id),starOf(game,data))}).catch(()=>{cache.set(String(game.id),null)}).finally(()=>{pending.delete(String(game.id));if(view==='home')render()})});
  }
  function setupNight(){
    clearInterval(timer);
    if(view!=='home')return;
    const original=root.querySelector('.feature-grid');if(!original)return;
    const recent=games.filter(finished);
    if(!recent.length)return;
    const highlights=[...recent].sort((a,b)=>Math.max(Number(b.homeScore),Number(b.awayScore))-Math.max(Number(a.homeScore),Number(a.awayScore))).slice(0,5);
    if(!highlights.some(g=>String(g.id)===activeId))activeId=String(highlights[0].id);
    const section=document.createElement('section');section.className='night-showcase';section.setAttribute('aria-label','La notte NBA: risultati e protagonisti');
    const logo=code=>`<img src="${esc(logoUrl(code))}" alt="" loading="lazy">`;
    const teamButton=(game,code,record)=>`<button class="night-team-link" data-game="${esc(game.id)}" data-game-team="${esc(code)}" aria-label="Statistiche ${esc(team(code).name)} contro ${esc(team(code===game.home?game.away:game.home).name)}">${logo(code)}<b>${esc(team(code).name)}</b><small>${esc(record||code)}</small></button>`;
    section.innerHTML=`<div class="section-head"><div><div class="eyebrow">RISULTATI · PROTAGONISTI</div><h2 class="section-title">La notte NBA</h2><p class="section-sub">Le prestazioni decisive e tutti i numeri delle partite concluse.</p></div><button class="text-button" data-night-all>Tutte le partite →</button></div><div class="night-feature-stage">${highlights.map(game=>{const star=cache.get(String(game.id));const winner=star?.winner||(Number(game.awayScore)>Number(game.homeScore)?game.away:game.home);return `<article class="night-feature ${String(game.id)===activeId?'is-active':''}" data-night-slide="${esc(game.id)}" aria-hidden="${String(game.id)!==activeId}" style="--winner-color:${esc(team(winner).color)}"><div class="night-feature-glow"></div>${star?.image?`<img class="night-star-photo" src="${esc(star.image)}" alt="${esc(star.name)}" onerror="this.style.display='none'">`:`<img class="night-star-logo" src="${esc(logoUrl(winner))}" alt=""/>`}<div class="night-star-copy"><span class="night-match-label">${/cup/i.test(game.headline||'')?'NBA CUP':'NBA'} · FINALE</span><h3>${esc(star?.name||`${team(winner).name} vincono`)}</h3><p>${star?'Protagonista della vittoria':'Il risultato della notte'}</p><div class="night-performance">${star?star.stats.map(stat=>`<div><b>${esc(stat.value)}</b><span>${stat.label}</span></div>`).join(''):`<span class="night-data-loading">${pending.has(String(game.id))?'Caricamento statistiche partita…':'Apri il tabellino per tutti i numeri.'}</span>`}</div><button class="night-box-button" data-game="${esc(game.id)}">Apri il tabellino &nbsp; ↗</button></div><div class="night-score-overlay">${teamButton(game,game.away,game.awayRecord)}<button class="night-score-link" data-game="${esc(game.id)}" aria-label="Apri statistiche ${esc(team(game.away).name)} ${game.awayScore} a ${game.homeScore} ${esc(team(game.home).name)}"><strong>${esc(game.awayScore)}</strong><span>FINALE</span><strong>${esc(game.homeScore)}</strong></button>${teamButton(game,game.home,game.homeRecord)}</div></article>`}).join('')}</div><nav class="night-feature-tabs" aria-label="Seleziona la partita in evidenza">${highlights.map(game=>`<button data-night-index="${esc(game.id)}" class="${String(game.id)===activeId?'active':''}" aria-current="${String(game.id)===activeId}"><span class="night-progress"><i></i></span><small>FINALE</small><b>${logo(game.away)} ${esc(game.away)} <em>${game.awayScore} – ${game.homeScore}</em> ${esc(game.home)} ${logo(game.home)}</b></button>`).join('')}</nav><div class="night-feature-controls"><span>Statistiche della singola partita · ESPN</span><button data-night-prev aria-label="Partita precedente">←</button><button data-night-pause aria-label="${paused?'Riprendi':'Pausa'} risultati automatici">${paused?'▶':'Ⅱ'}</button><button data-night-next aria-label="Partita successiva">→</button></div><div class="night-score-rail" aria-label="Tutti i risultati della notte">${recent.map(game=>`<button data-game="${esc(game.id)}"><small>FINALE</small><span>${logo(game.away)}<b>${esc(game.away)}</b><strong>${esc(game.awayScore)}</strong></span><span>${logo(game.home)}<b>${esc(game.home)}</b><strong>${esc(game.homeScore)}</strong></span><em>Statistiche ↗</em></button>`).join('')}</div>`;
    original.replaceWith(section);
    section.querySelector('[data-night-all]').onclick=()=>{view='games';render()};
    const show=id=>{activeId=id;section.querySelectorAll('[data-night-slide]').forEach(el=>{const active=el.dataset.nightSlide===id;el.classList.toggle('is-active',active);el.setAttribute('aria-hidden',!active);el.querySelectorAll('button').forEach(b=>b.tabIndex=active?0:-1)});section.querySelectorAll('[data-night-index]').forEach(b=>{b.classList.toggle('active',b.dataset.nightIndex===id);b.setAttribute('aria-current',b.dataset.nightIndex===id)})};
    const move=delta=>show(String(highlights[(highlights.findIndex(g=>String(g.id)===activeId)+delta+highlights.length)%highlights.length].id));
    const start=()=>{clearInterval(timer);section.classList.remove('is-running');section.classList.toggle('is-paused',paused);if(!paused&&!matchMedia('(prefers-reduced-motion: reduce)').matches){requestAnimationFrame(()=>section.classList.add('is-running'));timer=setInterval(()=>{if(!document.hidden)move(1)},6000)}};
    section.querySelectorAll('[data-night-index]').forEach(b=>b.onclick=()=>{show(b.dataset.nightIndex);start()});
    section.querySelector('[data-night-prev]').onclick=()=>{move(-1);start()};section.querySelector('[data-night-next]').onclick=()=>{move(1);start()};
    section.querySelector('[data-night-pause]').onclick=e=>{paused=!paused;e.currentTarget.textContent=paused?'▶':'Ⅱ';e.currentTarget.setAttribute('aria-label',`${paused?'Riprendi':'Pausa'} risultati automatici`);start()};
    let x=0;const stage=section.querySelector('.night-feature-stage');stage.addEventListener('touchstart',e=>x=e.changedTouches[0].clientX,{passive:true});stage.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-x;if(Math.abs(delta)>45){move(delta<0?1:-1);start()}},{passive:true});
    show(activeId);start();loadHighlights(highlights);
  }
  const previousRender=render;
  render=function(){previousRender();setupNight()};
  render();
})();
