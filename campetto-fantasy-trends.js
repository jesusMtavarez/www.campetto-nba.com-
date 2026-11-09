/* Andamento reale per partita, distinto dalle proiezioni stagionali del draft. */
(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t=source=>window.CAMPETTO_I18N?.t(source)||source;
  const locale=()=>window.CAMPETTO_LOCALE?.()||'it-IT';
  const format=value=>Number.isFinite(value)?value.toLocaleString(locale(),{minimumFractionDigits:1,maximumFractionDigits:1}):'—';
  const numeric=value=>value!==null&&value!==undefined&&String(value).trim()!==''&&/^[-+]?\d+(?:[.,]\d+)?$/.test(String(value).trim())?Number(String(value).replace(',','.')):null;
  const keys=['pts','reb','ast','stl','blk','tov'];
  function pointsFor(stats){const values=keys.map(key=>numeric(stats?.[key]));return values.some(value=>value===null)?null:values[0]+1.2*values[1]+1.5*values[2]+3*values[3]+3*values[4]-values[5]}
  function parseGameLog(data){
    const names=data.names||[],labels=data.labels||[];
    const fields={pts:['points','PTS'],reb:['totalRebounds','REB'],ast:['assists','AST'],stl:['steals','STL'],blk:['blocks','BLK'],tov:['turnovers','TO']};
    const index=Object.fromEntries(Object.entries(fields).map(([key,[name,label]])=>[key,names.includes(name)?names.indexOf(name):labels.indexOf(label)]));
    if(Object.values(index).some(i=>i<0))return [];
    const rows=new Map();
    for(const season of data.seasonTypes||[]){
      if(!/regular season/i.test(season.displayName||''))continue;
      for(const group of season.categories||[])for(const event of group.events||[]){
        const details=data.events?.[event.eventId];if(!details?.gameDate||!Array.isArray(event.stats)||event.didNotPlay)continue;
        const stats=Object.fromEntries(keys.map(key=>[key,numeric(event.stats[index[key]])]));
        const points=pointsFor(stats);if(points===null)continue;
        rows.set(String(event.eventId),{id:String(event.eventId),date:details.gameDate,opponent:details.opponent?.abbreviation||details.opponent?.displayName||'—',stats,points});
      }
    }
    return [...rows.values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,12);
  }
  const cache=readStorage('campetto-fantasy-gamelog-v1',{}),pending=new Map();
  let selected=null,returnFocus=null,loading=false,error=false;
  const season=()=>new Date().getFullYear()+(new Date().getMonth()>=8?1:0);
  const cacheKey=player=>`${season()}:${player.espn}`;
  async function load(player,force=false){
    const key=cacheKey(player),saved=cache[key];
    if(!force&&saved&&Date.now()-saved.updatedAt<5*60*1000)return saved.rows;
    if(pending.has(key))return pending.get(key);
    const request=(async()=>{
      const response=await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${encodeURIComponent(player.espn)}/gamelog?region=us&lang=en&season=${season()}`,{signal:AbortSignal.timeout(18000)});
      if(!response.ok)throw new Error('Game log unavailable');
      const data=await response.json(),returnedSeason=data.filters?.find(filter=>filter.name==='season')?.value;
      if(returnedSeason&&String(returnedSeason)!==String(season()))throw new Error('Season mismatch');
      const rows=parseGameLog(data);cache[key]={updatedAt:Date.now(),rows};
      saveStorage('campetto-fantasy-gamelog-v1',Object.fromEntries(Object.entries(cache).slice(-60)));return rows;
    })().finally(()=>pending.delete(key));pending.set(key,request);return request;
  }
  function close(){document.querySelector('#fantasy-trend-modal')?.remove();document.body.classList.remove('modal-open');selected=null;if(returnFocus?.isConnected)returnFocus.focus()}
  function draw(){
    if(!selected)return;
    const player=playerById(selected)||{},entry=cache[cacheKey(player)],rows=entry?.rows||[];
    const captain=readStorage('campetto-captain-v1','')===selected,multiplier=captain?1.5:1;
    const last=rows[0]?.points,previous=rows[1]?.points,delta=Number.isFinite(last)&&Number.isFinite(previous)?(last-previous)*multiplier:null;
    const direction=delta===null?'unknown':Math.abs(delta)<.05?'flat':delta>0?'up':'down';
    const label={up:'In aumento',down:'In diminuzione',flat:'Invariato',unknown:'Confronto non disponibile'}[direction];
    const estimated=pointsFor(player.stats),chart=rows.slice(0,10).reverse(),values=chart.map(row=>row.points*multiplier);
    const min=Math.min(...values,0),max=Math.max(...values,1),span=max-min||1;
    const coordinates=values.map((value,index)=>`${20+index*460/Math.max(1,values.length-1)},${100-(value-min)*80/span}`).join(' ');
    let overlay=document.querySelector('#fantasy-trend-modal');
    if(!overlay){overlay=document.createElement('div');overlay.id='fantasy-trend-modal';overlay.className='account-overlay';document.body.appendChild(overlay);document.body.classList.add('modal-open');overlay.addEventListener('click',event=>{if(event.target===overlay||event.target.closest('[data-trend-close]'))close();if(event.target.closest('[data-trend-replace]')){const id=selected;close();window.CAMPETTO_FANTASY_REPLACE?.(id)}if(event.target.closest('[data-trend-refresh]'))open(selected,true)})}
    const stale=error&&entry;
    overlay.innerHTML=`<section class="fantasy-trend-dialog account-dialog" role="dialog" aria-modal="true" aria-labelledby="fantasy-trend-title"><button class="account-close" data-trend-close aria-label="Chiudi">×</button><div class="eyebrow">CAMPETTO · FANTAPUNTI</div><div class="trend-player"><img src="${esc(player.headshot||`https://a.espncdn.com/i/headshots/nba/500/${player.espn}.png`)}" alt=""><div><h2 id="fantasy-trend-title">${esc(player.name)}</h2><p>${esc(player.team)} · ${esc(player.position)}</p>${captain?'<span class="trend-captain">Capitano · bonus 1,5×</span>':''}</div></div><div class="trend-summary"><article><small>Ultima partita</small><strong>${format(last==null?null:last*multiplier)} <em>FP</em></strong></article><article class="trend-direction ${direction}"><small>${t(label)}</small><strong>${delta===null?'—':`${delta>0?'↑ +':delta<0?'↓ ':''}${format(delta)}`} <em>FP</em></strong></article><article><small>Media stagionale stimata</small><strong>${format(estimated==null?null:estimated*multiplier)} <em>FP</em></strong></article></div><p class="trend-explanation">Rispetto alla partita precedente</p>${loading?'<p class="trend-loading" role="status">Caricamento delle ultime partite…</p>':''}${error?`<p class="trend-warning">${t(stale?'Aggiornamento non disponibile. Mostro gli ultimi dati salvati.':'Le ultime partite non sono al momento disponibili. Riprova tra poco.')}</p>`:''}${rows.length?`<section class="trend-chart"><h3>Andamento fantapunti</h3><svg viewBox="0 0 500 120" role="img" aria-label="Andamento fantapunti"><line x1="20" y1="100" x2="480" y2="100" stroke="currentColor" opacity=".2"/><polyline points="${coordinates}" fill="none" stroke="var(--orange)" stroke-width="3"/>${values.map((value,index)=>`<circle cx="${20+index*460/Math.max(1,values.length-1)}" cy="${100-(value-min)*80/span}" r="4" fill="var(--orange)"><title>${esc(format(value))} FP</title></circle>`).join('')}</svg></section><div class="trend-table-wrap"><table class="trend-table"><thead><tr><th>Data</th><th>Avversario</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>TO</th><th>FP</th></tr></thead><tbody>${rows.slice(0,5).map(row=>`<tr><td>${new Date(row.date).toLocaleDateString(locale(),{day:'2-digit',month:'short'})}</td><td>${esc(row.opponent)}</td>${keys.map(key=>`<td>${row.stats[key]}</td>`).join('')}<td><b>${format(row.points*multiplier)}</b></td></tr>`).join('')}</tbody></table></div>`:loading?'':'<p>Nessuna partita con statistiche complete disponibile.</p>'}${rows.length===1?'<p>Servono almeno due partite per misurare aumento o diminuzione.</p>':''}<p class="trend-formula">FP = punti + 1,2 × rimbalzi + 1,5 × assist + 3 × recuperi + 3 × stoppate − palle perse.</p><p class="data-note">Fonte ESPN · stagione regolare. I fantapunti sono calcolati da Campetto.</p><div class="trend-actions"><button class="secondary-button" data-trend-refresh ${loading?'disabled':''}>↻ Aggiorna</button><button class="primary-button" data-trend-replace>Sostituisci giocatore</button></div></section>`;
    window.CAMPETTO_I18N?.apply(overlay);
  }
  async function open(id,force=false){
    const player=playerById(id);if(!player||!Object.values(lineup).includes(id))return;
    if(!selected)returnFocus=document.activeElement;
    selected=id;loading=true;error=false;draw();document.querySelector('[data-trend-close]')?.focus();
    try{await load(player,force)}catch(e){error=true;console.info('Fantapunti:',e.message)}finally{if(selected===id){loading=false;draw();document.querySelector('[data-trend-close]')?.focus()}}
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-fantasy-inspect]');if(button){event.preventDefault();event.stopImmediatePropagation();open(button.dataset.fantasyInspect)}},true);
  document.addEventListener('keydown',event=>{const modal=document.querySelector('#fantasy-trend-modal');if(!modal)return;if(event.key==='Escape'){close();return}if(event.key==='Tab'){const controls=[...modal.querySelectorAll('button:not([disabled])')];if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1).focus()}else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0].focus()}}});
  document.addEventListener('campetto:language',draw);
  window.CAMPETTO_FANTASY_OPEN=open;
  window.CAMPETTO_FANTASY_TRENDS={pointsFor,parseGameLog};
})();
