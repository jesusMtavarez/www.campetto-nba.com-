/* Indice editoriale trasparente: non rappresenta una probabilità di elezione. */
(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const canonical=code=>({GS:'GSW',NY:'NYK',NO:'NOP',SA:'SAS',UTAH:'UTA',WSH:'WAS',PHO:'PHX'}[code]||code);
  function candidates(players=activePlayers(),table=standings){
    const year=new Date().getFullYear()+(new Date().getMonth()>=8?1:0);
    players=players.filter(p=>p.statsSeason===year);
    const maxGames=Math.max(0,...players.map(p=>Number(p.gamesPlayed)||0)),minimum=Math.max(3,Math.ceil(maxGames*.5));
    const qualified=players.filter(p=>p.statsSource==='ESPN'&&Number(p.gamesPlayed)>=minimum).map(player=>{
      const production=window.CAMPETTO_FANTASY_TRENDS.pointsFor(player.stats);if(production===null)return null;
      const record=table.find(row=>canonical(row.team||row.abbr)===canonical(player.team));
      const wins=Number(record?.wins),losses=Number(record?.losses),total=wins+losses;
      const winRate=record&&Number.isFinite(wins)&&Number.isFinite(losses)&&total>0?wins/total:.5;
      const participation=Math.min(1,Number(player.gamesPlayed)/(total||maxGames||1));
      return {player,score:production*(.75+.5*winRate)*(.8+.2*participation),winRate};
    }).filter(item=>item&&item.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
    return qualified.map(item=>({...item,index:qualified[0]?.score?item.score/qualified[0].score*100:0}));
  }
  function enhance(){
    if(view!=='home')return;
    const rookieLink=root.querySelector('[data-view="rookies"]');if(!rookieLink)return;
    const anchor=rookieLink.closest('.section-block')||rookieLink.closest('section');if(!anchor)return;
    root.querySelector('.mvp-section')?.remove();
    const section=document.createElement('section');section.className='section-block mvp-section';
    const rows=candidates();
    section.innerHTML=`<div class="section-head"><div><div class="eyebrow">CAMPETTO · CORSA MVP</div><h2 class="section-title">Candidati MVP della stagione</h2><p class="section-sub">Produzione per partita, risultati di squadra e presenze.</p></div><span class="data-note">Indice statistico Campetto</span></div><div class="mvp-grid">${rows.map(({player:p,index},rank)=>`<button class="mvp-card" type="button" data-mvp-player="${esc(p.id)}"><div class="mvp-card-top"><span>#${rank+1}</span><img src="${esc(logoUrl(p.team))}" alt=""><small>${esc(p.team)}</small></div><img class="mvp-portrait" src="${esc(p.headshot||`https://a.espncdn.com/i/headshots/nba/500/${p.espn}.png`)}" alt="${esc(p.name)}"><h3>${esc(p.name)}</h3><div class="mvp-index"><strong>${index.toLocaleString(window.CAMPETTO_LOCALE?.()||'it-IT',{maximumFractionDigits:1})}%</strong><small>Indice MVP</small></div><div class="mvp-meter"><span style="width:${index}%"></span></div><div class="mvp-stats">${[['pts','PTS'],['reb','REB'],['ast','AST']].map(([key,label])=>`<span><b>${esc(p.stats[key])}</b> ${label}</span>`).join('')}</div></button>`).join('')||'<div class="mvp-empty">In attesa delle statistiche della stagione.</div>'}</div><details class="mvp-method"><summary>Come viene calcolato l’indice</summary><p>Indice = fantapunti medi × (0,75 + 0,5 × percentuale di vittorie della squadra) × (0,8 + 0,2 × quota di partite giocate). Servono almeno tre presenze e almeno metà delle presenze del giocatore più attivo. Il primo vale 100%, gli altri sono rapportati al suo punteggio.</p></details><p class="mvp-note">Il leader vale 100%. Le percentuali confrontano il punteggio statistico dei candidati: non sono probabilità di vittoria né una classifica ufficiale NBA.</p>`;
    anchor.before(section);
    section.addEventListener('click',event=>{const card=event.target.closest('[data-mvp-player]');if(!card)return;const p=playerById(card.dataset.mvpPlayer);if(!p)return;previousView='home';currentPlayer=p;profileTab='Overview';view='profile';render();window.scrollTo({top:0,behavior:'smooth'})});
  }
  const previous=window.render;window.render=function(){previous();enhance()};
  window.CAMPETTO_MVP={candidates};enhance();
})();
