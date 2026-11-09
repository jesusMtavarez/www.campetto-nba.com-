/* Anagrafica verificata: i campi assenti non diventano valori inventati. */
(() => {
  const key='campetto-player-details-v1',cache=readStorage(key,{}),pending=new Set();
  const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const text=value=>typeof value==='string'&&value.trim()&&!['—','-','null','undefined'].includes(value.trim())?value.trim():'';
  function facts(player){
    const entry=cache[String(player.espn)],a=entry&&norm(entry.name)===norm(player.name)?entry.athlete||{}:{};
    const birth=text(a.dateOfBirth||player.birth),match=birth.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const date=match?new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00Z`):null;
    const valid=date&&Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===match[0];
    const now=new Date();let age=valid?now.getUTCFullYear()-date.getUTCFullYear()-Number(now.getUTCMonth()<date.getUTCMonth()||(now.getUTCMonth()===date.getUTCMonth()&&now.getUTCDate()<date.getUTCDate())):Number(a.age||player.age);
    age=Number.isInteger(age)&&age>0&&age<110?age:null;
    const rows=[];
    if(valid)rows.push(['DATA DI NASCITA',date.toLocaleDateString(window.CAMPETTO_LOCALE?.()||'it-IT',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})]);
    if(age)rows.push(['Età',`${age} ${window.CAMPETTO_I18N?.t('anni')||'anni'}`]);
    const college=text(a.college?.name||a.college||player.college?.name||player.college);if(college)rows.push(['FORMAZIONE',college]);
    const birthplace=text(a.displayBirthPlace)||[a.birthPlace?.city,a.birthPlace?.state,a.birthPlace?.country].map(text).filter(Boolean).join(', ')||text(player.city);if(birthplace)rows.push(['CITTÀ NATALE',birthplace]);
    const draft=window.CAMPETTO_DRAFT?.infoFor({...player,draft:a.draft||player.draft,displayDraft:a.displayDraft||player.displayDraft});
    if(draft&&draft.status!=='unknown'){const description=window.CAMPETTO_DRAFT.describe(draft);rows.push(['DRAFT NBA',`${description.label} · ${description.detail}`])}
    else if(typeof player.draft==='string'&&text(player.draft))rows.push(['DRAFT NBA',player.draft]);
    return rows;
  }
  async function load(player){
    const id=String(player.espn||''),entry=cache[id];
    if(!/^\d+$/.test(id)||pending.has(id)||(entry&&norm(entry.name)===norm(player.name)&&Date.now()-entry.updatedAt<(entry.failed?60000:86400000)))return;
    pending.add(id);
    try{
      const response=await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${id}?region=us&lang=en&contentorigin=espn`,{signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Profilo non disponibile');const data=await response.json(),athlete=data.athlete;
      if(String(athlete?.id)!==id||norm(athlete.displayName||athlete.fullName)!==norm(player.name))throw new Error('Profilo non corrispondente');
      cache[id]={name:player.name,updatedAt:Date.now(),athlete:{age:athlete.age,dateOfBirth:athlete.dateOfBirth,displayBirthPlace:athlete.displayBirthPlace,birthPlace:athlete.birthPlace,college:athlete.college,draft:athlete.draft,displayDraft:athlete.displayDraft}};
    }catch{cache[id]={...entry,name:player.name,updatedAt:Date.now(),failed:true}}
    finally{pending.delete(id);saveStorage(key,cache);if(view==='profile'&&String(currentPlayer?.espn)===id)render()}
  }
  window.CAMPETTO_PLAYER_DETAILS={facts,load};
})();
