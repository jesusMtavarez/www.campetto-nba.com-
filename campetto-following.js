(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const key='campetto-followed-news-v2',cache=readStorage(key,{}),pending=new Set();
  let query='';
  const mobileMenu=document.querySelector('#mobile-menu'),sidebar=document.querySelector('#sidebar');
  const backdrop=document.createElement('button');backdrop.className='mobile-nav-backdrop';backdrop.hidden=true;backdrop.setAttribute('aria-label','Chiudi il menu');document.body.appendChild(backdrop);
  function closeMenu(){sidebar?.classList.remove('open');document.body.classList.remove('mobile-nav-open');backdrop.hidden=true;mobileMenu?.setAttribute('aria-expanded','false')}
  if(mobileMenu){mobileMenu.setAttribute('aria-controls','sidebar');mobileMenu.setAttribute('aria-expanded','false');mobileMenu.addEventListener('click',()=>{const open=!sidebar.classList.contains('open');if(!open){closeMenu();return}sidebar.classList.add('open');backdrop.hidden=false;document.body.classList.add('mobile-nav-open');mobileMenu.setAttribute('aria-expanded','true')})}
  backdrop.onclick=closeMenu;document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  const followed=()=>favorites.map(playerById).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,'it'));
  const relevant=(article,p)=>article.categories?.some(c=>String(c.athleteId||c.athlete?.id||'')===String(p.espn))||norm(`${article.headline||article.title||''} ${article.description||article.summary||''}`).includes(norm(p.name));
  function loadNews(players){
    for(const p of players){if(pending.size>=3)break;const id=String(p.espn||'');if(!id||pending.has(id)||cache[id]&&Date.now()-cache[id].updatedAt<10*60*1000)continue;
      pending.add(id);
      (async()=>{
        try{
          const year=new Date().getFullYear()+(new Date().getMonth()>=8?1:0);
          const response=await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${encodeURIComponent(id)}/overview?region=us&lang=en&contentorigin=espn&season=${year}`,{signal:AbortSignal.timeout(18000)});
          if(!response.ok)throw new Error('Notizie giocatore non raggiungibili');
          const data=await response.json();
          const source=(Array.isArray(data.news)?data.news:data.news?.articles||[]).filter(article=>relevant(article,p)).sort((a,b)=>(Date.parse(b.published)||0)-(Date.parse(a.published)||0)).slice(0,4).map(article=>({id:article.id,title:article.headline||article.title,summary:article.description||'',sourceUrl:article.links?.web?.href||'',image:article.images?.[0]?.url||'',published:article.published||'',playerIds:[p.id]})).filter(a=>a.title&&a.sourceUrl);
          const articles=window.CAMPETTO_LOCALIZE_NEWS?await window.CAMPETTO_LOCALIZE_NEWS(source,{persistArticles:false}):source;
          cache[id]={updatedAt:Date.now(),articles,error:false};
        }catch(error){cache[id]={updatedAt:Date.now(),articles:cache[id]?.articles||[],error:true};console.info('Notizie seguiti:',error.message)}
        finally{pending.delete(id);saveStorage(key,cache);if(view==='favorites')render()}
      })();
    }
  }
  function articlesFor(players){
    const articles=new Map();
    for(const p of players){const cached=cache[String(p.espn)]?.articles||[];const general=(window.NEWS_ITEMS||[]).filter(a=>norm(`${a.originalTitle||a.title} ${a.originalSummary||a.summary}`).includes(norm(p.name))).map(a=>({...a,playerIds:[p.id]}));
      for(const item of [...cached,...general]){const id=item.sourceUrl;if(!id)continue;const existing=articles.get(id);articles.set(id,{...item,playerIds:[...new Set([...(existing?.playerIds||[]),p.id])]})}
    }
    return [...articles.values()].sort((a,b)=>(Date.parse(b.published)||0)-(Date.parse(a.published)||0));
  }
  function page(){
    const all=followed(),players=all.filter(p=>norm(`${p.name} ${p.team}`).includes(norm(query))),articles=articlesFor(players);
    if(!all.length)return `<section class="page-heading"><div><div class="eyebrow">IL TUO CAMPETTO · PREFERITI</div><h1>I giocatori che segui</h1><p class="section-sub">Statistiche, notizie e risultati raccolti in un unico posto.</p></div></section><section class="following-empty"><span>♡</span><h2>Il tuo basket, su misura</h2><p>Apri il profilo di un giocatore e premi “Aggiungi ai preferiti”. Qui ritroverai le sue statistiche stagionali e le notizie che lo riguardano.</p><button class="primary-button" data-follow-catalog>Scopri i giocatori →</button></section>`;
    const watchedTeams=new Set(players.map(p=>p.team));const canonical=code=>({GS:'GSW',NY:'NYK',NO:'NOP',SA:'SAS',UTAH:'UTA',WSH:'WAS'}[code]||code);const matches=games.filter(g=>watchedTeams.has(canonical(g.home))||watchedTeams.has(canonical(g.away)));
    return `<section class="page-heading"><div><div class="eyebrow">IL TUO CAMPETTO · PREFERITI</div><h1>I giocatori che segui</h1><p class="section-sub">Le loro statistiche, le notizie e le partite delle loro squadre.</p></div><button class="secondary-button" data-follow-catalog>+ Cerca altri giocatori</button></section><div class="following-summary"><article><small>GIOCATORI SEGUITI</small><b>${all.length}</b></article><article><small>NOTIZIE COLLEGATE</small><b>${articles.length}</b></article><article><small>PARTITE NEL TABELLONE</small><b>${matches.length}</b></article></div><label class="directory-search following-search"><span>⌕</span><input id="favorites-search" type="search" value="${esc(query)}" placeholder="Cerca tra i tuoi giocatori…"></label><section class="section-block"><div class="section-head"><div><h2 class="section-title">La tua lista</h2><p class="section-sub">Medie stagionali. Apri una scheda per tutti i numeri e le migliori giocate.</p></div></div><div class="player-grid large-grid followed-grid">${players.map(p=>`<article class="followed-card-shell">${playerCard(p)}<button class="unfollow-player" data-unfollow="${esc(p.id)}" aria-label="Smetti di seguire ${esc(p.name)}">♥ &nbsp; Seguito · rimuovi</button></article>`).join('')||'<div class="empty-state">Nessun giocatore corrisponde alla ricerca.</div>'}</div></section><section class="section-block"><div class="section-head"><div><h2 class="section-title">Notizie dei tuoi giocatori</h2><p class="section-sub">Notizie ESPN collegate ai giocatori che segui, in italiano.</p></div><span class="data-note">${players.some(p=>pending.has(String(p.espn)))?'Aggiornamento in corso…':`${articles.length} notizie`}</span></div><div class="following-news-grid">${articles.slice(0,12).map(item=>`<a class="following-news-card" href="${esc(item.sourceUrl)}" target="_blank" rel="noreferrer"><div>${item.image?`<img src="${esc(item.image)}" alt="" loading="lazy">`:'<span>NBA</span>'}</div><section><small>${item.playerIds.map(id=>playerById(id)?.name).filter(Boolean).map(esc).join(' · ')}</small><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p><b>Leggi su ESPN ↗</b></section></a>`).join('')||`<div class="following-news-empty">${players.some(p=>pending.has(String(p.espn)))?'Sto cercando le notizie dei giocatori che segui…':'Non ci sono notizie collegate a questi giocatori nel feed disponibile.'}</div>`}</div></section><section class="section-block"><div class="section-head"><div><h2 class="section-title">Le loro squadre in campo</h2><p class="section-sub">Seleziona un risultato per aprire il tabellino della partita.</p></div></div><div class="following-matches">${matches.map(g=>`<button data-game="${esc(g.id)}"><span><img src="${esc(logoUrl(g.away))}" alt="">${esc(team(g.away).name)}</span><strong>${esc(g.awayScore??'—')} – ${esc(g.homeScore??'—')}</strong><span>${esc(team(g.home).name)}<img src="${esc(logoUrl(g.home))}" alt=""></span><small>${/final/i.test(g.status)?'Finale':esc(g.status)}</small></button>`).join('')||'<p class="data-note">Nessuna partita delle squadre seguite nel tabellone attuale.</p>'}</div></section>`;
  }
  const previousRender=render;
  document.addEventListener('campetto:language',()=>{Object.keys(cache).forEach(id=>delete cache[id]);if(view==='favorites')render()});
  render=function(){
    const focus=document.activeElement?.id==='favorites-search',pos=focus?document.activeElement.selectionStart:0;
    previousRender();
    if(view==='favorites'){
      loadNews(followed());
      root.innerHTML=page();document.querySelector('#breadcrumb-current').textContent='Giocatori seguiti';document.querySelector('#favorite-count').textContent=favorites.length;
      document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view==='favorites'));
      root.querySelectorAll('[data-follow-catalog]').forEach(b=>b.onclick=()=>{view='players';render()});
      const input=root.querySelector('#favorites-search');if(input){input.oninput=()=>{query=input.value;render()};if(focus){input.focus();input.setSelectionRange(pos,pos)}}
    }
    if(view==='profile'&&previousView==='favorites'){const back=root.querySelector('.back-link');if(back){back.textContent='← Torna ai giocatori seguiti';back.dataset.view='favorites'}}
  };
  document.addEventListener('click',event=>{
    if(event.target.closest('.nav-link[data-view]'))closeMenu();
    const brand=event.target.closest('.brand');if(brand){event.preventDefault();event.stopImmediatePropagation();view='home';render();closeMenu();window.scrollTo({top:0,behavior:'smooth'});return}
    const nav=event.target.closest('[data-view="favorites"]');if(nav){event.preventDefault();event.stopImmediatePropagation();view='favorites';render();closeMenu();window.scrollTo({top:0,behavior:'smooth'});return}
    const remove=event.target.closest('[data-unfollow]');if(remove){event.preventDefault();event.stopImmediatePropagation();toggleFavorite(remove.dataset.unfollow)}
  },true);
})();
