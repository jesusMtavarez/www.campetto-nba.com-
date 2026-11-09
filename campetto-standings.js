(() => {
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const DIVISIONS={Atlantic:['BOS','BKN','NYK','PHI','TOR'],Central:['CHI','CLE','DET','IND','MIL'],Southeast:['ATL','CHA','MIA','ORL','WAS'],Northwest:['DEN','MIN','OKC','POR','UTA'],Pacific:['GSW','LAC','LAL','PHX','SAC'],Southwest:['DAL','HOU','MEM','NOP','SAS']};
  const CUP_GROUPS={'Est A':['DET','TOR','ORL','MIL','BKN'],'Est B':['NYK','CLE','PHI','MIA','IND'],'Est C':['BOS','ATL','CHA','CHI','WAS'],'Ovest A':['DEN','HOU','PHX','DAL','UTA'],'Ovest B':['OKC','MIN','LAC','NOP','MEM'],'Ovest C':['SAS','LAL','POR','GSW','SAC']};
  const CUP_DATES=['20261030','20261106','20261113','20261120','20261124','20261125','20261127'];
  const canonical=code=>({GS:'GSW',NY:'NYK',NO:'NOP',SA:'SAS',UTAH:'UTA',WSH:'WAS',PHO:'PHX'}[code]||code);
  let mode='conference',cupMode='groups',query='',refreshing=false,cupLoading=false,cupError='',cupData=readStorage('campetto-cup-2026-v1',null);
  const sortRegular=(a,b)=>Number(b.pct)-Number(a.pct)||Number(b.wins)-Number(a.wins)||Number(a.seed)-Number(b.seed)||a.team.localeCompare(b.team);
  const fmt=v=>v==null?'—':v;
  const percent=v=>v==null?'—':`${(Number(v)*100).toFixed(1)}%`;
  const match=row=>`${team(row.team).name} ${team(row.team).city} ${row.team}`.toLowerCase().includes(query.toLowerCase());
  const teamCell=row=>`<button class="league-team" data-team="${esc(row.team)}"><img src="${esc(logoUrl(row.team))}" alt="Logo ${esc(team(row.team).name)}"><span><b>${esc(team(row.team).city)} ${esc(team(row.team).name)}</b><small>${esc(row.team)}</small></span></button>`;
  function regularTable(title,rows,conference=false){
    const ordered=[...rows].sort(conference?(a,b)=>(Number(a.seed)||99)-(Number(b.seed)||99):sortRegular);
    return `<section class="league-panel"><div class="league-panel-title"><h2>${esc(title)}</h2><span>${rows.length} squadre</span></div><div class="league-scroll" tabindex="0" aria-label="Classifica ${esc(title)}, scorri per tutti i dati"><table class="league-table"><thead><tr><th>#</th><th>Squadra</th><th>V</th><th>P</th><th>% V</th><th>Dist.</th><th>Casa</th><th>Trasferta</th><th>Ultime 10</th><th>Serie</th><th>PF</th><th>PS</th><th>Diff.</th></tr></thead><tbody>${ordered.map((row,index)=>({row,index})).filter(({row})=>match(row)).map(({row,index})=>`<tr class="${conference&&index===5?'league-playoff-line':conference&&index===9?'league-playin-line':''}"><td><span class="league-rank ${conference&&index<6?'direct':conference&&index<10?'playin':''}">${index+1}</span></td><td>${teamCell(row)}</td><td class="league-wins">${fmt(row.wins)}</td><td>${fmt(row.losses)}</td><td>${percent(row.pct)}</td><td>${esc(fmt(row.gb))}</td><td>${esc(row.home)}</td><td>${esc(row.away)}</td><td>${esc(row.last10)}</td><td>${esc(String(row.streak).replace(/^W/,'V').replace(/^L/,'P'))}</td><td>${esc(row.pts)}</td><td>${esc(row.opp)}</td><td class="${Number(row.diff)>0?'positive':'negative'}">${Number(row.diff)>0?'+':''}${esc(row.diff)}</td></tr>`).join('')||'<tr><td colspan="13" class="league-empty">Nessuna squadra trovata.</td></tr>'}</tbody></table></div></section>`;
  }
  function cupRank(rows,matches,headToHead=true){
    return [...rows].sort((a,b)=>{
      const result=b.wins-a.wins||a.losses-b.losses;if(result)return result;
      const tied=rows.filter(r=>r.wins===a.wins&&r.losses===a.losses);
      if(headToHead&&tied.length===2){const head=matches.filter(m=>[m.a,m.b].includes(a.team)&&[m.a,m.b].includes(b.team));let aw=0,bw=0;for(const m of head){const winner=m.as>m.bs?m.a:m.b;if(winner===a.team)aw++;else bw++}if(aw!==bw)return bw-aw}
      return b.diff-a.diff||b.pf-a.pf||a.team.localeCompare(b.team);
    });
  }
  async function loadCup(force=false){
    if(cupLoading)return;
    if(!force&&cupData&&Date.now()-cupData.updatedAt<300000)return;
    cupLoading=true;cupError='';if(view==='standings'&&mode==='cup')render();
    const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}).replace(/-/g,'');
    const dates=CUP_DATES.filter(date=>date<=today);
    try{
      const responses=await Promise.all(dates.map(async date=>{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date}&limit=100`,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('Risultati Cup non raggiungibili');const d=await r.json();if(!Array.isArray(d.events))throw new Error('Calendario Cup incompleto');return d.events}));
      const rows=Object.fromEntries(Object.values(CUP_GROUPS).flat().map(code=>[code,{team:code,wins:0,losses:0,gp:0,pf:0,pa:0,diff:0}])),matches=[];
      const groupFor=code=>Object.keys(CUP_GROUPS).find(key=>CUP_GROUPS[key].includes(code));
      for(const event of new Map(responses.flat().map(e=>[e.id,e])).values()){
        const game=event.competitions?.[0];if(!event.status?.type?.completed||!game?.notes?.some(note=>/NBA Cup.*Group Play/i.test(note.headline||'')))continue;
        const [left,right]=game.competitors||[];if(!left||!right)continue;
        const a=canonical(left.team.abbreviation),b=canonical(right.team.abbreviation);if(!rows[a]||!rows[b]||groupFor(a)!==groupFor(b))continue;
        const as=Number(left.score),bs=Number(right.score);if(!Number.isFinite(as)||!Number.isFinite(bs)||as===bs)continue;
        const regulation=c=>c.linescores?.length>4?c.linescores.slice(0,4).reduce((sum,q)=>sum+Number(q.value??q.displayValue),0):Number(c.score);
        const ap=regulation(left),bp=regulation(right);if(!Number.isFinite(ap)||!Number.isFinite(bp))throw new Error('Punteggio Cup incompleto');
        rows[a].gp++;rows[b].gp++;rows[a].wins+=as>bs?1:0;rows[b].wins+=bs>as?1:0;rows[a].losses+=as<bs?1:0;rows[b].losses+=bs<as?1:0;rows[a].pf+=ap;rows[a].pa+=bp;rows[b].pf+=bp;rows[b].pa+=ap;matches.push({a,b,as,bs});
      }
      for(const row of Object.values(rows))row.diff=row.pf-row.pa;
      cupData={rows,matches,dates,updatedAt:Date.now()};saveStorage('campetto-cup-2026-v1',cupData);
    }catch(error){cupError='Non è stato possibile aggiornare tutte le giornate NBA Cup. '+(cupData?'Mostriamo l’ultimo aggiornamento salvato.':'Riprova con Aggiorna.');console.info('NBA Cup:',error.message)}
    finally{cupLoading=false;if(view==='standings'&&mode==='cup')render()}
  }
  function cupTable(title,rows){return `<section class="league-panel cup-panel"><div class="league-panel-title"><h2>${esc(title)}</h2><span>${rows.length} squadre</span></div><div class="league-scroll" tabindex="0"><table class="league-table cup-table"><thead><tr><th>#</th><th>Squadra</th><th>G</th><th>V</th><th>P</th><th>Diff.</th><th>PF</th></tr></thead><tbody>${rows.map((row,index)=>({row,index})).filter(({row})=>match(row)).map(({row,index})=>`<tr><td><span class="league-rank ${index===0?'direct':''}">${index+1}</span></td><td>${teamCell(row)}</td><td>${row.gp}</td><td class="league-wins">${row.wins}</td><td>${row.losses}</td><td class="${row.diff>0?'positive':row.diff<0?'negative':''}">${row.diff>0?'+':''}${row.diff}</td><td>${row.pf}</td></tr>`).join('')||'<tr><td colspan="7" class="league-empty">Nessun risultato.</td></tr>'}</tbody></table></div></section>`}
  function cupContent(){
    const controls=`<div class="cup-intro"><div><span class="cup-emblem">🏆</span><div><h2>Emirates NBA Cup 2026</h2><p>Gironi e corsa alle wild card</p></div></div><a href="https://www.nba.com/nba-cup/2026/standings" target="_blank" rel="noreferrer">Classifica ufficiale NBA ↗</a></div><div class="cup-mode"><button data-cup-mode="groups" class="${cupMode==='groups'?'active':''}">Gironi</button><button data-cup-mode="wildcard" class="${cupMode==='wildcard'?'active':''}">Wild card</button></div>`;
    if(!cupData)return controls+`<div class="league-empty">${cupLoading?'Caricamento delle giornate NBA Cup…':esc(cupError||'I dati dei gironi saranno disponibili a breve.')}</div>`;
    const groups=Object.fromEntries(Object.entries(CUP_GROUPS).map(([name,codes])=>[name,cupRank(codes.map(code=>cupData.rows[code]),cupData.matches)]));
    const tables=cupMode==='groups'?Object.entries(groups).map(([name,rows])=>cupTable(`Gruppo ${name}`,rows)).join(''):['Est','Ovest'].map(conf=>{const eligible=Object.entries(groups).filter(([name])=>name.startsWith(conf)).flatMap(([,rows])=>rows.slice(1));return cupTable(`Wild card · ${conf}`,cupRank(eligible,cupData.matches,false))}).join('');
    return controls+`<p class="cup-calculation">${cupData.matches.length} partite concluse · Aggiornato ${new Date(cupData.updatedAt).toLocaleString(window.CAMPETTO_LOCALE?.()||'it-IT',{dateStyle:'short',timeStyle:'short'})}. Dati calcolati dai risultati ESPN nei <a href="https://www.nba.com/nba-cup/2026/groups" target="_blank" rel="noreferrer">gironi NBA 2026</a>.</p>${cupError?`<p class="league-warning">${esc(cupError)}</p>`:''}<div class="cup-grid">${tables}</div><div class="league-legend">Ordine provvisorio per vittorie/sconfitte, scontro diretto tra due squadre a pari merito nel girone, differenza punti e punti segnati. Punti dei supplementari esclusi da differenza e totale. Le wild card confrontano le squadre che non guidano i rispettivi gironi; gli spareggi ufficiali completi sono su NBA.com.</div>`;
  }
  function page(){
    const rows=Array.isArray(standings)?standings:[],east=rows.filter(r=>r.conference==='east'),west=rows.filter(r=>r.conference==='west');
    const title=mode==='league'?'Tutte le 30 squadre':mode==='division'?'Le sei division NBA':mode==='cup'?'NBA Cup':'Eastern e Western Conference';
    const content=mode==='cup'?cupContent():!rows.length?'<div class="league-empty">Caricamento classifica NBA…</div>':mode==='league'?regularTable('Classifica generale',rows):mode==='division'?Object.entries(DIVISIONS).map(([name,codes])=>regularTable(name,rows.filter(r=>codes.includes(r.team)))).join(''):regularTable('Eastern Conference',east,true)+regularTable('Western Conference',west,true);
    return `<section class="page-heading"><div><div class="eyebrow">NBA · CLASSIFICHE 2026/27</div><h1>Ogni squadra. Ogni posizione.</h1><p class="section-sub">${title}. Seleziona una squadra per aprire rosa e statistiche.</p></div><button id="refresh-standings" class="secondary-button" ${refreshing||cupLoading?'disabled':''}>${refreshing||cupLoading?'Aggiornamento…':'↻ Aggiorna'}</button></section><nav class="league-tabs" aria-label="Tipo di classifica">${[['conference','Conference'],['league','Generale'],['division','Division'],['cup','🏆 NBA Cup']].map(([key,label])=>`<button data-league-mode="${key}" class="${mode===key?'active':''}" aria-current="${mode===key}">${label}</button>`).join('')}</nav><div class="league-toolbar"><label class="directory-search"><span>⌕</span><input id="league-search" type="search" placeholder="Cerca una squadra…" value="${esc(query)}"></label><span>${mode==='cup'?'Solo partite NBA Cup':window.CAMPETTO_STANDINGS_UPDATED?`ESPN · aggiornato alle ${new Date(window.CAMPETTO_STANDINGS_UPDATED).toLocaleTimeString(window.CAMPETTO_LOCALE?.()||'it-IT',{hour:'2-digit',minute:'2-digit'})}`:'Dati ESPN della stagione corrente'}</span></div>${window.CAMPETTO_STANDINGS_ERROR&&mode!=='cup'?`<p class="league-warning">${esc(window.CAMPETTO_STANDINGS_ERROR)}</p>`:''}<div class="league-content">${content}</div>${mode==='conference'?'<div class="league-legend"><i></i> Posizioni 1–6 · fascia playoff <i class="playin"></i> Posizioni 7–10 · fascia play-in. Indicazione della posizione attuale, non qualificazione definitiva. V/P: vittorie/sconfitte · Dist.: gare di distacco · PF/PS: punti segnati/subiti per partita.</div>':''}`;
  }
  const previousRender=render;
  render=function(){previousRender();if(view!=='standings')return;root.innerHTML=page();document.querySelector('#breadcrumb-current').textContent='Classifiche';document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view==='standings'));const search=root.querySelector('#league-search');search.oninput=()=>{query=search.value;const pos=search.selectionStart;render();const input=root.querySelector('#league-search');input.focus();input.setSelectionRange(pos,pos)};root.querySelector('#refresh-standings').onclick=async()=>{refreshing=true;render();if(mode==='cup')await loadCup(true);else await window.CAMPETTO_REFRESH_STANDINGS(true);refreshing=false;if(view==='standings')render()}};
  document.addEventListener('click',event=>{const button=event.target.closest('[data-league-mode],[data-cup-mode]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();if(button.dataset.leagueMode){mode=button.dataset.leagueMode;render();if(mode==='cup')loadCup();else window.CAMPETTO_REFRESH_STANDINGS()}else{cupMode=button.dataset.cupMode;render()}},true);
  setInterval(()=>{if(view==='standings'&&mode==='cup')loadCup()},5*60*1000);
})();
