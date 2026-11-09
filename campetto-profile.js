/* Pagina personale: ospiti locali e account online con dati separati. */
(() => {
  const prefix='campetto-profile-details-v2-';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t=source=>window.CAMPETTO_I18N?.t(source)||source;
  const state=()=>window.CAMPETTO_ACCOUNT?.getState()||{connected:false,id:'',email:'',metadata:{}};
  const clean=data=>({name:String(data?.name||'').trim().slice(0,40),team:Object.hasOwn(TEAM_INFO,data?.team)?data.team:''});
  const owner=()=>state().id||'guest';
  let busy=false,message='',error=false,lastOwner=owner(),draft=null;
  function details(){
    const account=state(),key=prefix+owner();let saved=readStorage(key,null);
    // Preserve the old modal's details once, without copying them to another account.
    if(!saved&&!readStorage('campetto-profile-migrated-v2',false)){
      saved=clean(readStorage('campetto-local-profile-v1',{}));saveStorage(key,saved);saveStorage('campetto-profile-migrated-v2',true);
    }
    if(account.connected){
      const metadata=account.metadata||{};
      if(Object.hasOwn(metadata,'display_name')||Object.hasOwn(metadata,'favorite_team'))return clean({name:metadata.display_name,team:metadata.favorite_team});
    }
    return clean(saved);
  }
  function decorate(){
    const button=document.querySelector('#account-button');if(!button)return;
    const account=state(),profile=details(),name=profile.name||account.email||t('Il mio profilo');
    const label=button.querySelector('span:not(.avatar-mini)');if(label)label.textContent=name;
    const initials=profile.name?profile.name.split(/\s+/).map(word=>word[0]).slice(0,2).join(''):account.email.slice(0,2)||'CA';
    const avatar=button.querySelector('.avatar-mini');if(avatar)avatar.textContent=initials.toUpperCase();
    button.setAttribute('aria-label',t('Apri il mio profilo'));button.setAttribute('aria-current',view==='account'?'page':'false');
  }
  function page(){
    const account=state(),profile=details(),form=draft||profile,pref=window.CAMPETTO_I18N;
    const teamInfo=profile.team?team(profile.team):null;
    const slots=['PG','SG','SF','PF','C'].map(slot=>({slot,player:playerById(lineup[slot])})).filter(row=>row.player);
    const players=favorites.map(playerById).filter(Boolean);
    const options=Object.keys(TEAM_INFO).sort((a,b)=>(team(a).city+' '+team(a).name).localeCompare(team(b).city+' '+team(b).name,'it')).map(code=>`<option value="${esc(code)}" ${form.team===code?'selected':''}>${esc(team(code).city)} ${esc(team(code).name)}</option>`).join('');
    return `<div class="account-page"><section class="page-heading"><div><div class="eyebrow">CAMPETTO · PROFILO</div><h1>Il mio profilo</h1><p class="section-sub">I tuoi dati, i giocatori che segui e il tuo quintetto.</p></div><button class="secondary-button" data-account-view="home">← Panoramica</button></section>
    <section class="member-hero"><div class="member-avatar" data-no-translate>${esc((profile.name||account.email||'CA').trim().split(/\s+/).map(word=>word.slice(0,1)).slice(0,2).join('').toUpperCase())}</div><div class="member-identity"><h2 data-no-translate>${esc(profile.name||t('Il tuo Campetto'))}</h2>${account.connected?`<p class="member-email" data-no-translate>${esc(account.email)}</p>`:'<p>Profilo su questo dispositivo</p>'}<span class="member-status ${account.connected?'is-connected':''}">${account.connected?'Account collegato':'Profilo locale'}</span></div>${teamInfo?`<button class="member-team" data-team="${esc(profile.team)}"><img src="${esc(logoUrl(profile.team))}" alt=""><span><small>Squadra preferita</small><b data-no-translate>${esc(teamInfo.city)} ${esc(teamInfo.name)}</b></span></button>`:''}</section>
    <div class="member-summary"><button data-account-view="favorites"><strong>${players.length}</strong><span>Giocatori seguiti</span><small>Notizie e statistiche →</small></button><button data-account-view="fantasy"><strong>${slots.length} / 5</strong><span>Il mio quintetto</span><small>Apri il mio Campetto →</small></button></div>
    <div class="member-layout"><section class="member-panel"><h2>Dati del profilo</h2><form id="member-profile-form"><label>Nome visualizzato<input id="member-name" name="display_name" maxlength="40" autocomplete="nickname" placeholder="Il tuo nome" value="${esc(form.name)}" ${busy?'disabled':''}></label><label>Squadra preferita<select id="member-team" ${busy?'disabled':''}><option value="">Nessuna preferenza</option>${options}</select></label><div class="profile-preference-row"><label>Lingua<select id="profile-language" data-no-translate>${[['it','Italiano'],['en','English'],['es','Español'],['fr','Français']].map(([code,name])=>`<option value="${code}" ${pref.language===code?'selected':''}>${name}</option>`).join('')}</select></label><label>Tema<select id="profile-theme"><option value="dark" ${pref.theme==='dark'?'selected':''}>Scuro</option><option value="light" ${pref.theme==='light'?'selected':''}>Chiaro</option></select></label></div><p class="member-save-note">${account.connected?'Nome e squadra preferita vengono salvati nel tuo account. Lingua e tema restano su questo dispositivo.':'Il profilo è salvato in questo browser. Accedi per salvare i tuoi dati anche online.'}</p><button class="primary-button account-submit" type="submit" ${busy?'disabled':''}>${busy?'Attendi…':'Salva profilo'}</button><p class="member-feedback ${error?'is-error':''}" role="status" aria-live="polite">${esc(t(message))}</p></form></section>
    <section class="member-panel"><h2>Account online</h2>${account.connected?`<dl class="member-account-facts"><div><dt>Email</dt><dd data-no-translate>${esc(account.email)}</dd></div><div><dt>Stato</dt><dd>${account.confirmed?'Email confermata':'Account collegato'}</dd></div></dl><p>Preferiti e quintetto sono associati al tuo account.</p><button class="secondary-button member-signout" data-member-signout ${busy?'disabled':''}>Esci dal profilo</button>`:`<p>Salva i tuoi giocatori preferiti e il quintetto con il tuo account.</p><div class="profile-online-actions"><button class="secondary-button" data-cloud-mode="login">Accedi</button><button class="primary-button" data-cloud-mode="signup">Crea profilo</button></div><button class="account-link" data-cloud-mode="recover">Ho dimenticato la password</button>`}</section></div>
    <section class="member-panel member-collection"><div class="section-head"><h2>I tuoi giocatori</h2><button class="text-button" data-account-view="favorites">Giocatori seguiti →</button></div><div class="member-player-list">${players.slice(0,8).map(player=>`<button data-player="${esc(player.id)}"><img src="${esc(player.headshot||`https://a.espncdn.com/i/headshots/nba/500/${player.espn}.png`)}" alt="" loading="lazy"><span><b data-no-translate>${esc(player.name)}</b><small>${esc(player.team)} · ${esc(player.position)}</small></span></button>`).join('')||'<p>Non segui ancora nessun giocatore.</p>'}</div></section></div>`;
  }
  async function save(event){
    event.preventDefault();if(busy)return;
    draft=clean({name:root.querySelector('#member-name').value,team:root.querySelector('#member-team').value});
    const submitted={...draft},submittedOwner=owner();busy=true;message='';error=false;render();
    try{
      if(state().connected)await window.CAMPETTO_ACCOUNT.updateDetails(submitted);
      if(owner()!==submittedOwner)return;
      saveStorage(prefix+submittedOwner,submitted);draft=null;
      message=state().connected?'Profilo salvato nel tuo account.':'Profilo salvato su questo dispositivo.';
    }catch(problem){if(owner()===submittedOwner){error=true;message=problem.message||'Non è stato possibile salvare il profilo. Riprova.'}}
    finally{busy=false;render()}
  }
  function bind(){
    root.querySelector('#member-profile-form')?.addEventListener('submit',save);
    for(const id of ['#member-name','#member-team'])root.querySelector(id)?.addEventListener('input',()=>{draft=clean({name:root.querySelector('#member-name').value,team:root.querySelector('#member-team').value})});
    root.querySelector('#profile-language')?.addEventListener('change',event=>window.CAMPETTO_I18N.setLanguage(event.target.value));
    root.querySelector('#profile-theme')?.addEventListener('change',event=>window.CAMPETTO_I18N.setTheme(event.target.value));
    root.querySelectorAll('[data-cloud-mode]').forEach(button=>button.onclick=()=>window.CAMPETTO_OPEN_ACCOUNT?.(button.dataset.cloudMode));
    root.querySelector('[data-member-signout]')?.addEventListener('click',()=>window.CAMPETTO_ACCOUNT?.signOut());
    root.querySelectorAll('[data-account-view]').forEach(button=>button.onclick=()=>{view=button.dataset.accountView;if(location.hash==='#account')history.replaceState({},'',location.pathname+location.search);render();window.scrollTo({top:0,behavior:'smooth'})});
  }
  function open(){
    message='';error=false;draft=null;view='account';
    if(location.hash!=='#account')history.pushState({page:'account'},'',`${location.pathname}${location.search}#account`);
    render();window.scrollTo({top:0,behavior:'smooth'});root.querySelector('h1')?.setAttribute('tabindex','-1');root.querySelector('h1')?.focus({preventScroll:true});
  }
  const previous=window.render;
  window.render=function(){
    if(view==='account'){
      root.innerHTML=page();document.querySelector('#breadcrumb-current').textContent=t('Il mio profilo');
      document.querySelectorAll('.nav-link').forEach(button=>button.classList.remove('active'));
      bind();window.CAMPETTO_I18N?.apply(root);
    }else {
      if(location.hash==='#account')history.replaceState({},'',location.pathname+location.search);
      previous();
    }
    decorate();
  };
  document.addEventListener('click',event=>{if(event.target.closest('#account-button')){event.preventDefault();event.stopImmediatePropagation();open()}},true);
  document.addEventListener('campetto:account',()=>{
    if(lastOwner!==owner()){lastOwner=owner();draft=null;message='';error=false}
    decorate();if(view==='account')render();
  });
  window.addEventListener('popstate',()=>{if(location.hash==='#account'){view='account';render()}else if(view==='account'){view='home';render()}});
  window.CAMPETTO_OPEN_PROFILE=open;
  window.CAMPETTO_LOCAL_PROFILE={open,get:()=>({...details()})};
  if(location.hash==='#account'){view='account';render()}else decorate();
})();
