/* Preferenze persistenti e traduzione del testo, senza sostituire i controlli. */
(() => {
  const supported=['it','en','es','fr'];
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  let language=read('campetto-language-v1','it');if(!supported.includes(language))language='it';
  let theme=read('campetto-theme-v1','dark');if(!['light','dark'].includes(theme))theme='dark';
  const locale=()=>({it:'it-IT',en:'en-US',es:'es-ES',fr:'fr-FR'})[language];
  const normalize=text=>String(text||'').replace(/\s+/g,' ').trim();
  const originals=new WeakMap(),attributeOriginals=new WeakMap();
  const catalogue=new Map((window.CAMPETTO_TRANSLATIONS||[]).map(row=>[normalize(row[0]),row]));
  const folded=new Map((window.CAMPETTO_TRANSLATIONS||[]).map(row=>[normalize(row[0]).toLowerCase(),row]));
  const dynamic=window.CAMPETTO_TRANSLATION_RULES||[];
  function t(source,values={}) {
    const key=normalize(source),row=catalogue.get(key)||folded.get(key.toLowerCase()),index=supported.indexOf(language);
    let result=row?.[index]||source;
    if(row&&language!=='it'&&key===key.toUpperCase()&&/[A-ZÀ-Ü]/.test(key))result=result.toLocaleUpperCase(locale());
    if(!row&&language!=='it')for(const rule of dynamic){const match=key.match(rule.pattern);if(match){result=rule.text[index-1].replace(/\$(\d+)/g,(_,n)=>t(match[Number(n)]||''));break}}
    if(result===source&&language!=='it'){
      const edge=key.match(/^([·←→↗＋+✓♥♡↻\s]*)(.*?)([←→↗\s]*)$/);
      if(edge&&edge[2]!==key&&edge[2])result=edge[1]+t(edge[2])+edge[3];
      else if(key.includes(' · '))result=key.split(' · ').map(part=>t(part)).join(' · ');
    }
    return String(result).replace(/\{(\w+)\}/g,(all,name)=>values[name]??all);
  }
  const skip=element=>!element||element.closest('script,style,noscript,textarea,[data-no-translate],.court-wordmark');
  function translateText(node) {
    if(skip(node.parentElement))return;
    const current=node.nodeValue;if(!normalize(current))return;
    let state=originals.get(node);
    if(!state||current!==state.output)state={source:current,output:current};
    const value=state.source,trimmed=normalize(value),translated=t(trimmed);
    state.output=translated===trimmed?value:value.replace(value.trim(),translated);
    if(node.nodeValue!==state.output)node.nodeValue=state.output;
    originals.set(node,state);
  }
  function translateElement(element) {
    if(skip(element))return;
    let values=attributeOriginals.get(element)||{};
    for(const attr of ['placeholder','aria-label','title'])if(element.hasAttribute(attr)){
      const value=element.getAttribute(attr),state=values[attr];
      const source=state&&state.output===value?state.source:value,output=t(source);
      if(value!==output)element.setAttribute(attr,output);values[attr]={source,output};
    }
    attributeOriginals.set(element,values);
  }
  function translateTree(scope=document.body) {
    if(!scope)return;if(scope.nodeType===3){translateText(scope);return}
    if(scope.nodeType!==1)return;
    translateElement(scope);
    const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    while(walker.nextNode()){const node=walker.currentNode;if(node.nodeType===3)translateText(node);else translateElement(node)}
  }
  let observer;
  function observe(){observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']})}
  function apply(scope=document.body){observer?.disconnect();translateTree(scope);observe()}
  function setTheme(next) {
    if(!['light','dark'].includes(next))return;
    theme=next;save('campetto-theme-v1',theme);document.documentElement.dataset.theme=theme;
    document.documentElement.style.colorScheme=theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#f3f6fa':'#0c1119');
    const button=document.querySelector('#theme-toggle');
    if(button){button.textContent=theme==='dark'?'☀':'☾';button.setAttribute('aria-label',t(theme==='dark'?'Passa al tema chiaro':'Passa al tema scuro'));button.setAttribute('aria-pressed',String(theme==='light'))}
    document.dispatchEvent(new CustomEvent('campetto:theme',{detail:theme}));
  }
  function setLanguage(next) {
    if(!supported.includes(next))return;
    language=next;save('campetto-language-v1',language);document.documentElement.lang=language;
    const select=document.querySelector('#language-select');if(select){select.value=language;select.setAttribute('aria-label',t('Lingua'))}
    document.title=t('Campetto — NBA, senza perdere un possesso');
    // Re-render dates, counters and dynamic views in the selected locale.
    document.dispatchEvent(new CustomEvent('campetto:language',{detail:language}));
    window.render?.();apply();setTheme(theme);
  }
  window.CAMPETTO_I18N={t,apply,setLanguage,setTheme,get language(){return language},get theme(){return theme},locale};
  window.CAMPETTO_LOCALE=locale;
  document.documentElement.lang=language;document.documentElement.dataset.theme=theme;
  function start(){
    const tools=document.createElement('div');tools.className='display-preferences';
    tools.innerHTML='<label class="language-picker"><span class="sr-only">Lingua</span><select id="language-select" aria-label="Lingua" data-no-translate><option value="it">IT · Italiano</option><option value="en">EN · English</option><option value="es">ES · Español</option><option value="fr">FR · Français</option></select></label><button id="theme-toggle" class="icon-button theme-toggle" type="button" aria-label="Passa al tema chiaro">☀</button>';
    document.querySelector('.topbar-actions')?.prepend(tools);
    tools.querySelector('select').value=language;tools.querySelector('select').addEventListener('change',event=>setLanguage(event.target.value));
    tools.querySelector('button').addEventListener('click',()=>setTheme(theme==='dark'?'light':'dark'));
    observer=new MutationObserver(records=>{
      observer.disconnect();
      for(const record of records){if(record.type==='characterData')translateText(record.target);else if(record.type==='attributes')translateElement(record.target);else record.addedNodes.forEach(translateTree)}
      observe();
    });
    apply();setTheme(theme);document.title=t('Campetto — NBA, senza perdere un possesso');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
