(() => {
  const canonical=code=>({GS:'GSW',NY:'NYK',NO:'NOP',SA:'SAS',UTAH:'UTA',WSH:'WAS',PHO:'PHX'}[code]||code);
  const year=()=>new Date().getFullYear()+(new Date().getMonth()>=8?1:0);
  let pending;
  window.CAMPETTO_TEAM_LOGOS={};
  window.CAMPETTO_REFRESH_STANDINGS = function(force=false) {
    if(pending)return pending;
    const key=`campetto-standings-v2-${year()}`;
    const run=async()=>{
      let saved;try{saved=JSON.parse(localStorage.getItem(`${key}-meta`)||'null')}catch{}
      if(!force&&saved?.rows?.length===30&&Date.now()-saved.updatedAt<300000){window.standings=saved.rows;window.CAMPETTO_TEAM_LOGOS=Object.fromEntries(saved.rows.filter(r=>r.logo).map(r=>[r.team,r.logo]));window.CAMPETTO_STANDINGS_UPDATED=saved.updatedAt;return}
      try{
        const response=await fetch(`https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=${year()}`,{signal:AbortSignal.timeout(18000)});
        if(!response.ok)throw new Error(`Classifica HTTP ${response.status}`);
        const data=await response.json(),rows=[];
        for(const conference of data.children||[]){
          const entries=conference.standings?.entries||[];
          for(const entry of entries){
            const get=(name,numeric=false)=>{const stat=entry.stats?.find(s=>s.name===name||s.type===name.toLowerCase());return numeric?(Number.isFinite(Number(stat?.value))?Number(stat.value):null):stat?.displayValue??stat?.summary??'—'};
            rows.push({team:canonical(entry.team.abbreviation),name:entry.team.displayName,conference:/east/i.test(conference.name)?'east':'west',wins:get('wins',true),losses:get('losses',true),pct:get('winPercent',true),seed:get('playoffSeed',true),gb:get('gamesBehind'),home:get('Home'),away:get('Road'),last10:get('Last Ten Games'),streak:get('streak'),pts:get('avgPointsFor'),opp:get('avgPointsAgainst'),diff:get('differential'),logo:entry.team.logos?.[0]?.href});
          }
        }
        if(rows.length!==30)throw new Error('Classifica incompleta');
        window.standings=rows;window.CAMPETTO_STANDINGS_UPDATED=Date.now();window.CAMPETTO_STANDINGS_ERROR='';
        window.CAMPETTO_TEAM_LOGOS=Object.fromEntries(rows.filter(r=>r.logo).map(r=>[r.team,r.logo]));
        localStorage.setItem(key,JSON.stringify(rows));localStorage.setItem(`${key}-meta`,JSON.stringify({rows,updatedAt:window.CAMPETTO_STANDINGS_UPDATED}));
      }catch(error){window.CAMPETTO_STANDINGS_ERROR='Aggiornamento non disponibile. Riprova tra poco.';console.info('Classifica NBA:',error.message)}
    };
    pending=run().finally(()=>{pending=null;if(window.view==='standings'||window.view==='team'||window.view==='teams')window.render?.()});return pending;
  };
})();
