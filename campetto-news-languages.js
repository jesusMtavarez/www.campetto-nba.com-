/* Un unico traduttore conserva le fonti e le cache di tutte e quattro le lingue. */
(() => {
  document.addEventListener('campetto:language',()=>window.CAMPETTO_NEWS?.refresh());
  document.addEventListener('DOMContentLoaded',()=>window.CAMPETTO_NEWS?.refresh(),{once:true});
})();
