/* Google CMP controls consent; this module never creates a consent record.
   One persistent display unit per page load: data refreshes do not refresh ads. */
(() => {
  'use strict';
  const fc=window.googlefc=window.googlefc||{};
  fc.callbackQueue=fc.callbackQueue||[];
  const slot=document.getElementById('campetto-ad-slot');
  const ad=slot?.querySelector('ins.adsbygoogle');
  const allowedViews=new Set(['home','news']);
  let consentReady=false,requested=false;
  function eligible(){return !!slot&&allowedViews.has(window.view)}
  function update(){
    if(!slot||!ad)return;
    const active=eligible(),filled=ad.getAttribute('data-ad-status')==='filled';
    slot.hidden=!active||ad.getAttribute('data-ad-status')==='unfilled';
    const lang=window.CAMPETTO_I18N?.language||document.documentElement.lang||'it';
    const label={it:'Pubblicità',en:'Advertisement',es:'Publicidad',fr:'Publicité'}[lang]||'Pubblicità';
    slot.setAttribute('aria-label',label);
    const caption=slot.querySelector('.campetto-ad-label');
    if(caption){caption.textContent=label;caption.hidden=!filled}
    slot.classList.toggle('has-ad',filled);
    // Wait for Google's consent flow and a visible, measurable content page.
    if(active&&consentReady&&!requested&&ad.getBoundingClientRect().width>0){
      requested=true;
      try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}
      catch(error){console.info('Campetto: annuncio non disponibile.');slot.hidden=true}
    }
  }
  fc.callbackQueue.push({CONSENT_DATA_READY:()=>{consentReady=true;update()}});
  fc.callbackQueue.push({CONSENT_API_READY:()=>{
    document.querySelectorAll('[data-cookie-settings]').forEach(button=>{
      if(typeof fc.showRevocationMessage!=='function')return;
      button.hidden=false;
      button.onclick=()=>fc.callbackQueue.push({CONSENT_API_READY:()=>fc.showRevocationMessage()});
    });
  }});
  if(ad)new MutationObserver(update).observe(ad,{attributes:true,attributeFilter:['data-ad-status']});
  if(typeof window.render==='function'){
    const previous=window.render;
    window.render=function(){const result=previous.apply(this,arguments);update();return result};
  }
  window.addEventListener('resize',update);
  document.addEventListener('campetto:language',update);
  update();
})();
