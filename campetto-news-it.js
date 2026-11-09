/* I titoli originali restano leggibili anche se il servizio di traduzione è offline. */
(() => {
  const CACHE='campetto-news-italian-v1',LANG_CACHE='campetto-news-languages-v1';
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
  const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  const valid=text=>typeof text==='string'&&text.trim()&&!/traduzione in preparazione|traducci[oó]n en preparaci[oó]n|traduction en pr[eé]paration|MYMEMORY WARNING|USED ALL AVAILABLE FREE TRANSLATIONS|QUERY LENGTH LIMIT EXCEEDED/i.test(text);
  const italian=Object.fromEntries(Object.entries(read(CACHE,{})).filter(([,text])=>valid(text)));
  const other=Object.fromEntries(Object.entries(read(LANG_CACHE,{})).filter(([,text])=>valid(text)));
  const pending=new Map(),jobs=new Map(),retryAt={},retryTimers={},sources=new Map(),providerRetryAt={};
  let refreshTimer,needsRender=false;
  const language=()=>['it','en','es','fr'].includes(window.CAMPETTO_I18N?.language)?window.CAMPETTO_I18N.language:'it';
  const decode=text=>{const element=document.createElement('textarea');element.innerHTML=String(text||'');return element.value};
  const original=item=>({...item,originalTitle:item.originalTitle||item.title||'',originalSummary:item.originalSummary??item.summary??''});
  const cached=(text,target)=>target==='en'?text:target==='it'?italian[text]:other[`${target}:${text}`];
  const store=(text,target,value)=>{
    if(target==='it'){italian[text]=value;save(CACHE,Object.fromEntries(Object.entries(italian).slice(-600)))}
    else{other[`${target}:${text}`]=value;save(LANG_CACHE,Object.fromEntries(Object.entries(other).slice(-600)))}
  };
  function instant(items,target=language()) {
    return items.map(article=>{
      const item=original(article),title=cached(item.originalTitle,target),summary=cached(item.originalSummary,target);
      return {...item,title:title||item.originalTitle,summary:summary||item.originalSummary,language:target,
        contentLanguage:title||target==='en'?target:'en',translationReady:target==='en'||!!title,
        summaryTranslationReady:target==='en'||!item.originalSummary||!!summary};
    });
  }
  const seed=fetch('news-it.json',{signal:AbortSignal.timeout(7000)})
    .then(response=>response.ok?response.json():{})
    .then(data=>{for(const [text,value] of Object.entries(data))if(valid(value))italian[text]=value})
    .catch(()=>{});
  function apply(target) {
    if(target!==language()||!window.NEWS_ITEMS?.length)return;
    const next=instant(window.NEWS_ITEMS,target);
    if(!next.some((item,index)=>['title','summary','language','translationReady','summaryTranslationReady'].some(key=>item[key]!==window.NEWS_ITEMS[index][key])))return;
    window.NEWS_ITEMS.splice(0,window.NEWS_ITEMS.length,...next);
    if(target==='it')save(`${CACHE}-articles`,next);
    needsRender=true;requestRender();
  }
  function requestRender(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{
      // The language selector lives outside the rendered page and retains focus.
      // Only a form being edited inside the page needs to delay replacement.
      const editing=window.root?.contains(document.activeElement)&&document.activeElement?.matches?.('input,select,textarea');
      if(needsRender&&['home','news','favorites'].includes(window.view)&&!editing){needsRender=false;window.render?.()}
      document.dispatchEvent(new CustomEvent('campetto:news-updated'));
    },120);
  }
  async function requestTranslation(text,target,provider){
    if(Date.now()<(providerRetryAt[provider]||0))throw new Error('Provider cooling down');
    try{
      const google=provider==='google';
      const params=new URLSearchParams(google?{client:'gtx',sl:'en',tl:target,dt:'t',q:text}:{q:text,langpair:`en|${target}`});
      const url=google?`https://translate.googleapis.com/translate_a/single?${params}`:`https://api.mymemory.translated.net/get?${params}`;
      const response=await fetch(url,{signal:AbortSignal.timeout(7000)});
      if(!response.ok){const error=new Error('Translation unavailable');error.quota=response.status===429;throw error}
      const data=await response.json();
      if(google){
        const value=Array.isArray(data?.[0])?data[0].filter(part=>Array.isArray(part)&&typeof part[0]==='string').map(part=>part[0]).join(''):'';
        if(!valid(value))throw new Error('Invalid translation');return value;
      }
      const value=decode(data.responseData?.translatedText);
      if(Number(data.responseStatus)!==200||data.quotaFinished||!valid(value)){
        const error=new Error('Translation unavailable');error.quota=!!data.quotaFinished||Number(data.responseStatus)===429||/quota|free translations|limit/i.test(data.responseDetails||value);throw error;
      }
      return value;
    }catch(error){providerRetryAt[provider]=Date.now()+(error.quota?10*60*1000:60*1000);throw error}
  }
  async function translate(text,target) {
    if(!text||target==='en')return text||'';
    if(cached(text,target))return cached(text,target);
    if(Date.now()<(retryAt[target]||0))return '';
    const key=`${target}:${text}`;
    if(pending.has(key))return pending.get(key);
    const task=(async()=>{
      const chunks=[];let chunk='';
      for(const word of text.split(/\s+/)){
        const next=chunk?`${chunk} ${word}`:word;
        if(new TextEncoder().encode(next).length>450){if(chunk)chunks.push(chunk);chunk=word}else chunk=next;
      }
      if(chunk)chunks.push(chunk);
      const results=[];
      try{
        for(const q of chunks){
          // MyMemory accepts at most 500 UTF-8 bytes per request.
          if(new TextEncoder().encode(q).length>500)throw new Error('Translation text too long');
          // Independent providers prevent a quota failure from disabling all languages.
          // This public Google endpoint has no SLA; MyMemory remains a fallback.
          let value='';
          for(const provider of ['google','mymemory']){
            try{value=await requestTranslation(q,target,provider);break}catch{}
          }
          if(!value)throw new Error('Translation unavailable');
          results.push(value);
        }
        const value=results.join(' ');store(text,target,value);return value;
      }catch(error){retryAt[target]=Math.min(...Object.values(providerRetryAt).filter(value=>value>Date.now()),Date.now()+10*60*1000);return ''}
    })().finally(()=>pending.delete(key));
    pending.set(key,task);return task;
  }
  function queue(items,target=language()) {
    sources.set(target,items.map(original));
    if(target==='en'||jobs.has(target))return jobs.get(target)||Promise.resolve();
    clearTimeout(retryTimers[target]);
    const task=(async()=>{
      await seed;
      apply(target);
      // Headlines are visible immediately and get the translation quota first.
      const batch=sources.get(target)||[];
      // Two bounded workers keep titles and subtitles responsive without a request burst.
      async function phase(field){
        let index=0;
        await Promise.all([0,1].map(async()=>{
          while(index<batch.length&&target===language()){
            const item=batch[index++];await translate(item[field],target);apply(target);
          }
        }));
      }
      await phase('originalTitle');await phase('originalSummary');
    })().finally(()=>{
      jobs.delete(target);
      if(target!==language())return;
      needsRender=true;requestRender();
      if((retryAt[target]||0)>Date.now())retryTimers[target]=setTimeout(()=>{
        if(target===language())queue(window.NEWS_ITEMS||sources.get(target)||[],target);
      },retryAt[target]-Date.now()+100);
      else if((sources.get(target)||[]).some(item=>(item.originalTitle&&!cached(item.originalTitle,target))||(item.originalSummary&&!cached(item.originalSummary,target)))) {
        // A new feed may have arrived while the previous batch was running.
        retryTimers[target]=setTimeout(()=>queue(sources.get(target)||[],target),1000);
      }
    });
    jobs.set(target,task);return task;
  }
  async function localize(items,{persistArticles=true}={}) {
    const target=language(),result=instant(items,target);
    if(!persistArticles){
      // The followed-player panel awaits its small batch before saving its own cache.
      await seed;
      const originals=items.map(original);
      for(const item of originals)await translate(item.originalTitle,target);
      for(const item of originals)await translate(item.originalSummary,target);
      return target===language()?instant(originals,target):localize(originals,{persistArticles:false});
    }
    if(persistArticles&&target==='it')save(`${CACHE}-articles`,result);
    // Do not hold the whole scoreboard/news feed behind a translation request.
    setTimeout(()=>queue(items,target),0);
    return result;
  }
  function refresh(force=false){
    if(force){delete retryAt[language()];for(const provider of Object.keys(providerRetryAt))delete providerRetryAt[provider]}
    const items=window.NEWS_ITEMS||[];
    if(!items.length)return;
    const target=language();apply(target);queue(items,target);
  }
  const statusLabel=()=>{
    const target=language(),items=window.NEWS_ITEMS||[],hasOriginal=items.some(item=>!item.translationReady||!item.summaryTranslationReady);
    const labels={it:hasOriginal?'Traduzione in corso · ESPN':'Notizie in italiano · ESPN',en:'News in English · ESPN',es:hasOriginal?'Traduciendo noticias · ESPN':'Noticias en español · ESPN',fr:hasOriginal?'Traduction en cours · ESPN':'Actualités en français · ESPN'};
    if(hasOriginal&&(retryAt[target]||0)>Date.now())return {it:'ESPN · traduzione temporaneamente non disponibile',en:labels.en,es:'ESPN · traducción temporalmente no disponible',fr:'ESPN · traduction temporairement indisponible'}[target];
    return labels[target];
  };
  window.CAMPETTO_NEWS={instant,original,refresh,statusLabel,whenIdle:()=>Promise.all([...jobs.values()])};
  window.CAMPETTO_CACHED_NEWS_IT=instant(read(`${CACHE}-articles`,[]));
  window.CAMPETTO_LOCALIZE_NEWS=localize;
  window.addEventListener('online',()=>refresh(true));
  document.addEventListener('focusout',()=>{if(needsRender)requestRender()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
