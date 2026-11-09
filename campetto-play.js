(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const slots = ['PG','SG','SF','PF','C'];
  const slotNames = {PG:'Playmaker',SG:'Guardia',SF:'Ala piccola',PF:'Ala grande',C:'Centro'};
  const budget = 100;
  let query = '', role = 'Tutti', order = 'name', target = 'PG', affordable = false;
  let captain = readStorage('campetto-captain-v1','');
  let costs = readStorage('campetto-purchase-prices-v1',{});
  let message = '';
  window.CAMPETTO_FANTASY_IMPORT = saved => {costs=saved._prices||{};captain=saved._captain||'';saveStorage('campetto-purchase-prices-v1',costs);saveStorage('campetto-captain-v1',captain)};
  const number = (p,key) => Number(String(p?.stats?.[key] ?? 0).replace('%','')) || 0;
  const fantasyPoints = p => number(p,'pts') + number(p,'reb')*1.2 + number(p,'ast')*1.5 + number(p,'stl')*3 + number(p,'blk')*3 - number(p,'tov');
  const statsReady = p => p.statsSource==='ESPN' && ['pts','reb','ast','stl','blk','tov'].every(key=>p.stats?.[key]!=null&&String(p.stats[key]).trim()!==''&&Number.isFinite(Number(p.stats[key])));
  const price = p => Math.max(4,Math.min(38,Math.round(4 + fantasyPoints(p)*.5)));
  const purchasePrice = p => costs[p.id] ?? price(p);
  const used = () => Object.values(lineup).map(playerById).filter(Boolean).reduce((sum,p)=>sum+purchasePrice(p),0);
  const money = n => `${Number(n).toLocaleString(window.CAMPETTO_LOCALE?.()||'it-IT',{maximumFractionDigits:1})} M`;
  function eligible(p,slot) {
    const pos = String(p.position || '').toUpperCase();
    if(pos.includes(slot)) return true;
    if(pos==='G'||pos==='GUARD') return slot==='PG'||slot==='SG';
    if(pos==='F'||pos==='FORWARD') return slot==='SF'||slot==='PF';
    if(pos.includes('G')&&pos.includes('F')) return ['SG','SF'].includes(slot);
    if(pos.includes('F')&&pos.includes('C')) return ['PF','C'].includes(slot);
    return pos==='CENTER'&&slot==='C';
  }
  function persist() {
    if(!Object.values(lineup).includes(captain)) captain='';
    saveStorage('campetto-lineup-v2',lineup);
    saveStorage('campetto-purchase-prices-v1',costs);
    saveStorage('campetto-captain-v1',captain);
    roster={...lineup,_prices:costs,_captain:captain};
    saveStorage('campetto-roster-v1',roster);
    window.CAMPETTO_SYNC_PROFILE?.();
  }
  function buy(id) {
    const p=playerById(id); if(!p)return;
    if(!statsReady(p)){message='Le statistiche complete devono essere disponibili prima dell’acquisto.';render();return}
    if(Object.values(lineup).includes(id)){message='Questo giocatore è già nel quintetto.';render();return}
    if(!eligible(p,target)){message=`Scegli un giocatore adatto al ruolo ${target}.`;render();return}
    const old=playerById(lineup[target]), nextCost=used()-(old?purchasePrice(old):0)+price(p);
    if(nextCost>budget){message='Budget insufficiente. Vendi un giocatore o scegli un prezzo più basso.';render();return}
    if(old) delete costs[old.id];
    lineup={...lineup,[target]:id}; costs[id]=price(p);
    if(!captain) captain=id;
    message=`${p.name} è nel tuo Campetto!`;
    persist(); target=slots.find(slot=>!lineup[slot]) || target; render();
  }
  function portrait(p) {return `<img src="${esc(p.headshot || `https://a.espncdn.com/i/headshots/nba/500/${p.espn}.png`)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`}
  function renderFantasy() {
    const chosen=slots.map(slot=>playerById(lineup[slot])).filter(Boolean), spent=used();
    const projection=chosen.reduce((sum,p)=>sum+fantasyPoints(p)*(p.id===captain?1.5:1),0);
    const replace=playerById(lineup[target]), available=budget-spent+(replace?purchasePrice(replace):0);
    const list=activePlayers().filter(p=>normalize(`${p.name} ${p.team}`).includes(normalize(query)) && (role==='Tutti'||eligible(p,role)) && (!affordable||price(p)<=available)).sort((a,b)=>order==='price'?price(a)-price(b):order==='points'?fantasyPoints(b)-fantasyPoints(a):a.name.localeCompare(b.name,'it',{sensitivity:'base'}));
    const hasAll=chosen.length===5;
    return `<section class="campetto-heading"><div><div class="eyebrow">CAMPETTO · FANTABASKET</div><h1>Il mio Campetto<span>🏀</span></h1><p>Cinque giocatori. Cento milioni. La tua idea di basket.</p></div><span class="draft-status ${hasAll?'complete':''}">${hasAll?'✓ Quintetto completo':`DRAFT IN CORSO · ${chosen.length}/5`}</span></section><div class="draft-wallet"><article><small>BUDGET INIZIALE</small><b>100 <em>M</em></b></article><article><small>INVESTITI</small><b>${money(spent)}</b></article><article class="wallet-left ${spent>budget?'over-budget':''}"><small>DA SPENDERE</small><b>${money(budget-spent)}</b></article><article><small>FANTAPUNTI STIMATI</small><b>${projection.toFixed(1)} <em>FP</em></b></article><div class="wallet-meter"><span style="width:${Math.min(100,spent)}%"></span></div></div><div class="draft-layout"><section class="draft-arena"><div class="draft-arena-title"><div><small>HOME COURT</small><h2>Il tuo quintetto</h2></div><span>${chosen.length}/5 pronti</span></div><div class="draft-court"><div class="draft-court-lines"><i></i><i></i><i></i></div><span class="court-wordmark">CAMPETTO</span>${slots.map((slot,index)=>{const p=playerById(lineup[slot]);return `<button class="draft-slot slot-${slot} ${target===slot?'selected':''} ${p?'filled':''}" data-draft-slot="${slot}">${p?`${portrait(p)}${p.id===captain?'<i class="captain-badge">C</i>':''}<b>${esc(p.name)}</b><small>${slot} · ${money(purchasePrice(p))}</small>`:`<strong>＋</strong><b>${slot}</b><small>${slotNames[slot]}</small>`}</button>`}).join('')}</div><div class="draft-lineup">${slots.map(slot=>{const p=playerById(lineup[slot]);return `<div class="draft-roster-row"><span>${slot}</span><div>${p?`<button class="draft-player-detail" data-fantasy-inspect="${esc(p.id)}"><b>${esc(p.name)}</b></button>`:`<b>${esc(slotNames[slot])}</b>`}<small>${p?`${esc(p.team)} · ${fantasyPoints(p).toFixed(1)} FP stimati`:'Posto da assegnare'}</small></div>${p?`<button class="captain-choice ${captain===p.id?'active':''}" data-captain="${esc(p.id)}" aria-label="Nomina capitano ${esc(p.name)}" title="Capitano: bonus 1,5×">C</button><b>${money(purchasePrice(p))}</b><button class="draft-sell" data-draft-sell="${slot}" aria-label="Vendi ${esc(p.name)}">×</button>`:'<small>LIBERO</small>'}</div>`}).join('')}</div><details class="draft-rules"><summary>Come si gioca · regole e punteggio</summary><p>Budget virtuale di 100 milioni per 5 giocatori, uno per ruolo. I giocatori G coprono PG/SG e quelli F SF/PF. Puoi vendere al prezzo d’acquisto e sostituire ogni posto. Il capitano moltiplica i propri fantapunti per 1,5.</p><p>FP = punti + 1,2 × rimbalzi + 1,5 × assist + 3 × recuperi + 3 × stoppate − palle perse. Le cifre mostrate sono proiezioni dalle medie stagionali disponibili, non punti di una lega o premi reali. I prezzi sono valutazioni di gioco: da 4 a 38 milioni, fissati all’acquisto.</p></details></section><section class="draft-market"><div class="draft-market-head"><div><small>PLAYER MARKET</small><h2>Costruisci la squadra</h2></div><span>${list.length} giocatori</span></div><div class="draft-market-controls"><label class="draft-search"><span>⌕</span><input id="draft-search" type="search" placeholder="Cerca nome o squadra…" value="${esc(query)}"></label><div class="draft-selects"><label>Posto da riempire<select id="draft-target">${slots.map(slot=>`<option value="${slot}" ${slot===target?'selected':''}>${slot} · ${slotNames[slot]}${lineup[slot]?' (sostituisci)':''}</option>`).join('')}</select></label><label>Ordina per<select id="draft-order"><option value="name" ${order==='name'?'selected':''}>Nome A–Z</option><option value="price" ${order==='price'?'selected':''}>Prezzo crescente</option><option value="points" ${order==='points'?'selected':''}>Fantapunti stimati</option></select></label></div><div class="draft-role-filter">${['Tutti',...slots].map(slot=>`<button data-draft-role="${slot}" class="${role===slot?'active':''}">${slot}</button>`).join('')}</div><label class="draft-affordable"><input id="draft-affordable" type="checkbox" ${affordable?'checked':''}> Solo giocatori nel budget <b>${money(available)}</b></label></div><p class="draft-message" role="status">${esc(message||`Seleziona un giocatore per ${target}. Il costo include l’eventuale sostituzione.`)}</p><div class="draft-market-list">${list.slice(0,80).map(p=>{const owned=Object.values(lineup).includes(p.id), ready=statsReady(p), canBuy=ready&&price(p)<=available&&eligible(p,target)&&!owned;return `<article class="draft-market-player">${portrait(p)}<div><b>${esc(p.name)}</b><small>${esc(p.team)} · ${esc(p.position)} <span>${ready?fantasyPoints(p).toFixed(1):'—'} FP</span></small></div><strong>${ready?money(price(p)):'—'}</strong><button data-draft-buy="${esc(p.id)}" ${canBuy?'':'disabled'} aria-label="Acquista ${esc(p.name)}">${!ready?'Attendi':owned?'In rosa':!eligible(p,target)?'Altro ruolo':price(p)>available?'Budget':'＋'}</button></article>`}).join('')||'<div class="empty-state">Nessun giocatore trovato. Prova un altro nome o filtro.</div>'}</div>${list.length>80?'<p class="draft-list-note">Mostrati i primi 80 risultati. Cerca per nome o filtra per restringere il mercato.</p>':''}</section></div>`;
  }
  const baseRender=render;
  render=function(){
    if(view==='fantasy') {
      root.innerHTML=renderFantasy();
      document.querySelector('#breadcrumb-current').textContent='Il mio Campetto';
      document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view==='fantasy'));
      const input=document.querySelector('#draft-search');
      input.oninput=()=>{query=input.value;const pos=input.selectionStart;render();const next=document.querySelector('#draft-search');next.focus();next.setSelectionRange(pos,pos)};
      document.querySelector('#draft-target').onchange=e=>{target=e.target.value;message='';render()};
      document.querySelector('#draft-order').onchange=e=>{order=e.target.value;render()};
      document.querySelector('#draft-affordable').onchange=e=>{affordable=e.target.checked;render()};
    } else baseRender();
    setupNewsSlider(); setupTableScrolling();
  };
  document.addEventListener('click',event=>{
    const control=event.target.closest('[data-draft-slot],[data-draft-role],[data-draft-buy],[data-draft-sell],[data-captain]');
    if(!control)return;event.preventDefault();event.stopImmediatePropagation();
    if(control.dataset.draftSlot){const id=lineup[control.dataset.draftSlot];if(id){window.CAMPETTO_FANTASY_OPEN?.(id);return}target=control.dataset.draftSlot;role=target;message='';render();document.querySelector('#draft-search')?.focus()}
    else if(control.dataset.draftRole){role=control.dataset.draftRole;render()}
    else if(control.dataset.draftBuy)buy(control.dataset.draftBuy);
    else if(control.dataset.draftSell){const p=playerById(lineup[control.dataset.draftSell]);delete lineup[control.dataset.draftSell];if(p)delete costs[p.id];message='Giocatore venduto: budget restituito.';persist();render()}
    else if(control.dataset.captain){captain=control.dataset.captain;persist();render()}
  },true);
  addToRoster=function(id){const p=playerById(id);if(!p)return;target=slots.find(slot=>!lineup[slot]&&eligible(p,slot))||slots.find(slot=>eligible(p,slot))||'PG';query=p.name;role='Tutti';message='Conferma l’acquisto dal mercato.';view='fantasy';render()};
  window.CAMPETTO_FANTASY_REPLACE=function(id){const slot=slots.find(slot=>lineup[slot]===id);if(!slot)return;target=slot;role=slot;query='';message='';view='fantasy';render();document.querySelector('#draft-search')?.focus()};

  let sliderTimer, slideIndex=0, sliderPaused=false,slideDeadline=0,slideSignature='';
  function setupNewsSlider(){
    clearTimeout(sliderTimer);
    const lead=root.querySelector('.news-lead');if(!lead){slideDeadline=0;return}
    const stories=[...(window.NEWS_ITEMS||[])].sort((a,b)=>(Date.parse(b.published)||0)-(Date.parse(a.published)||0)).slice(0,5);
    if(!stories.length)return;
    const signature=stories.map(story=>story.sourceUrl||story.originalTitle||story.title).join('|');
    if(signature!==slideSignature){slideSignature=signature;slideDeadline=0;slideIndex=0}
    slideIndex%=stories.length;
    const slider=document.createElement('section');slider.className='news-slider';slider.setAttribute('aria-label','Le cinque ultime notizie NBA');slider.setAttribute('aria-roledescription','carosello');
    slider.innerHTML=`<div class="news-slider-stage">${stories.map((story,index)=>`<a class="news-lead news-slide ${index===slideIndex?'is-active':''}" aria-hidden="${index!==slideIndex}" tabindex="${index===slideIndex?'0':'-1'}" href="${esc(story.sourceUrl||'#')}" target="_blank" rel="noreferrer" style="--news-image:url('${esc(story.image)}')"><img class="news-slide-image" src="${esc(story.image)}" alt="" loading="lazy"><span class="news-kicker">NBA · ESPN</span><div><small>IN PRIMO PIANO · ${index+1}/${stories.length}</small><h2>${esc(story.title)}</h2><p>${esc(story.summary)}</p><b>Leggi la notizia ↗</b></div></a>`).join('')}</div><div class="news-slider-controls"><button data-news-prev aria-label="Notizia precedente">←</button><div>${stories.map((story,i)=>`<button data-news-index="${i}" class="${i===slideIndex?'active':''}" aria-label="Vai alla notizia ${i+1}" aria-current="${i===slideIndex}"><span><i></i></span><small>${esc(story.title)}</small></button>`).join('')}</div><span class="news-slide-counter">${slideIndex+1} / ${stories.length}</span><button data-news-pause aria-label="${sliderPaused?'Riprendi':'Pausa'} scorrimento automatico">${sliderPaused?'▶':'Ⅱ'}</button><button data-news-next aria-label="Notizia successiva">→</button></div>`;
    lead.replaceWith(slider);
    const show=index=>{slideIndex=(index+stories.length)%stories.length;slider.querySelectorAll('.news-slide').forEach((el,i)=>{el.classList.toggle('is-active',i===slideIndex);el.setAttribute('aria-hidden',i!==slideIndex);el.tabIndex=i===slideIndex?0:-1});slider.querySelectorAll('[data-news-index]').forEach((el,i)=>{el.classList.toggle('active',i===slideIndex);el.setAttribute('aria-current',i===slideIndex)});slider.querySelector('.news-slide-counter').textContent=`${slideIndex+1} / ${stories.length}`};
    const start=(reset=false)=>{
      clearTimeout(sliderTimer);
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reset||!slideDeadline)slideDeadline=Date.now()+6000;
      const remaining=Math.max(0,slideDeadline-Date.now());
      slider.classList.remove('progress-running');slider.classList.toggle('is-paused',sliderPaused||reduced);
      slider.style.setProperty('--news-progress-delay',`${-Math.max(0,6000-remaining)}ms`);
      requestAnimationFrame(()=>{if(slider.isConnected&&!sliderPaused&&!reduced)slider.classList.add('progress-running')});
      if(!sliderPaused&&!reduced)sliderTimer=setTimeout(()=>{
        if(!document.hidden)show(slideIndex+1);
        start(true);
      },remaining);
    };
    slider.querySelector('[data-news-prev]').onclick=()=>{show(slideIndex-1);start(true)};slider.querySelector('[data-news-next]').onclick=()=>{show(slideIndex+1);start(true)};
    slider.querySelectorAll('[data-news-index]').forEach(b=>b.onclick=()=>{show(Number(b.dataset.newsIndex));start(true)});
    slider.querySelector('[data-news-pause]').onclick=e=>{sliderPaused=!sliderPaused;e.currentTarget.textContent=sliderPaused?'▶':'Ⅱ';e.currentTarget.setAttribute('aria-label',`${sliderPaused?'Riprendi':'Pausa'} scorrimento automatico`);start(true)};
    let x=0;slider.addEventListener('touchstart',e=>{x=e.changedTouches[0].clientX},{passive:true});slider.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-x;if(Math.abs(delta)>45){show(slideIndex+(delta<0?1:-1));start(true)}},{passive:true});start();
  }
  function setupTableScrolling(){root.querySelectorAll('.game-boxscore-scroll').forEach(wrapper=>{wrapper.tabIndex=0;wrapper.setAttribute('aria-label','Tabellino giocatori: scorri per vedere tutte le statistiche');if(wrapper.previousElementSibling?.classList.contains('table-scroll-tools'))return;const tools=document.createElement('div');tools.className='table-scroll-tools';tools.innerHTML='<span>Scorri per tutte le statistiche</span><button aria-label="Scorri statistiche a sinistra">←</button><button aria-label="Scorri statistiche a destra">→</button>';wrapper.before(tools);tools.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>wrapper.scrollBy({left:(i?1:-1)*Math.max(180,wrapper.clientWidth*.7),behavior:'smooth'}));const update=()=>{tools.querySelectorAll('button')[0].disabled=wrapper.scrollLeft<=1;tools.querySelectorAll('button')[1].disabled=wrapper.scrollLeft+wrapper.clientWidth>=wrapper.scrollWidth-2};wrapper.addEventListener('scroll',update,{passive:true});requestAnimationFrame(update)})}
  document.querySelectorAll('.nav-link[data-view="fantasy"]').forEach((b,i)=>{b.innerHTML=i===0?'<span class="nav-icon">♟</span> Il mio Campetto <span class="nav-new">FANTA</span>':'<span class="nav-icon">◉</span> Il mio Campetto'});
  render();
})();
