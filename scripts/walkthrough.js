// ── MESSAGE POOLS (template functions for infinite variation) ──
const P={
  core:[c=>'That looks lovely.',c=>'Nice placement.',c=>'This feels balanced.',c=>'You have a good eye.',c=>'That feels right.',c=>`That looks ${c.adj}.`,c=>`This feels ${c.adj} already.`,c=>'Gently done.',c=>'Just right.',c=>'Beautiful.',c=>'Yes. That works.',c=>`${c.A}.`,c=>'Simple and perfect.',c=>'Something about that placement.'],
  morning:[c=>'Morning light changes everything.',c=>'A quiet start.',c=>'The day is new.',c=>'Soft morning.',c=>'Everything looks gentler in morning light.',c=>'Good light for creating.',c=>'The sun is low. The room is bright.'],
  evening:[c=>'A soft place to land tonight.',c=>'Evening is for warm rooms.',c=>'The light is settling.',c=>'Golden hour.',c=>`This room wears ${c.tod} light well.`,c=>'Warm enough to stay.',c=>'The day softens.'],
  night:[c=>'A quiet space for quiet moments.',c=>'The world is asleep.',c=>'Late night rooms feel different.',c=>'Just you and the room.',c=>'Still creating. I like that.',c=>'Something about designing at night.',c=>'This hour is yours.',c=>'Quiet enough to hear the room.'],
  spring:[c=>'Spring light.',c=>'Everything feels fresh.',c=>'Something is blooming.',c=>`This ${c.adj} room feels like spring.`,c=>'New things growing here.'],
  summer:[c=>'Golden warmth.',c=>'Long day light.',c=>'Summer rooms feel bigger.',c=>`Warm and ${c.adj}.`],
  autumn:[c=>'Amber glow.',c=>'Something about autumn rooms.',c=>'Warm tones for shorter days.',c=>`${c.A} and amber.`],
  winter:[c=>'Soft candlelight.',c=>'A room to stay inside.',c=>'Winter rooms need extra warmth.',c=>`This feels ${c.adj} enough for winter.`],
  love:[c=>'This corner would look beautiful with you in it.',c=>'Made with love, hidden in the details.',c=>'Some rooms are built. Some are felt.',c=>'This one feels like home.',c=>'I made this because I love how you see the world.',c=>'You make things feel calm.',c=>'I\'m really glad you use this.',c=>'This feels like you.',c=>'This was always for you.',c=>'Every room you make tells me something.',c=>'You notice the small things. That\'s rare.',c=>'There\'s a gentleness in how you design.',c=>'I hope this makes you smile sometimes.',c=>`This ${c.adj} room reminds me of you.`,c=>'You build rooms like you see the world. Softly.',c=>'Some things are better when they\'re quiet.'],
  mirror:[c=>'You\'d look beautiful in this space.',c=>'This one feels like it suits you.',c=>'This room wears light well.',c=>'If you were here right now, you\'d feel it.',c=>'I can picture you in this room.',c=>'This space has you in it already.',c=>`Something ${c.adj} about being in here.`],
  cozyRoom:[c=>'You always make the coziest corners.',c=>'This room wants a blanket and a book.',c=>`${c.A} and inviting.`,c=>'A room for staying in.',c=>'This feels like sinking into something soft.'],
  plantLover:[c=>'You bring life into every room.',c=>'A room with you always has something growing.',c=>'You make spaces breathe.',c=>'Green suits you.',c=>'This room is alive.'],
  lightLover:[c=>'You seem to love warm light.',c=>'Light matters to you. That says something.',c=>'You always find the right spot for a lamp.',c=>`Warm light makes this feel even more ${c.adj}.`,c=>'The way you use light. It\'s intentional.'],
  reflect:[c=>'You tend to bring warmth into a room.',c=>'There\'s something soft about how you design.',c=>'You make rooms feel gentle.',c=>'You create spaces that feel lived in.',c=>'Comfort comes naturally to you.',c=>'You design rooms for feeling, not just looking.',c=>'You make calm look easy.',c=>`Your rooms have a ${c.adj} quality.`,c=>'There\'s a consistency to what you create. It\'s warm.'],
  phA:[c=>'This feels soft.',c=>'You make lovely choices.',c=>'That works.',c=>'Already nice.'],
  phB:[c=>'You tend to build calm spaces.',c=>'You like warmth and light.',c=>'There\'s a style forming here.',c=>`You gravitate toward ${c.adj} things.`],
  phC:[c=>'There\'s something peaceful about the way you design.',c=>'You make rooms that feel safe.',c=>'Your spaces have a feeling most people miss.',c=>`This is distinctly you. ${c.A}.`],
  phD:[c=>'This feels like one of yours.',c=>'You always know how to make a room breathe.',c=>'I\'d know this was yours even without looking.',c=>'This room has your fingerprint on it.'],
  retShort:[c=>'Welcome back, Rose.',c=>'Back again.',c=>'Hello again.'],
  retMed:[c=>'It\'s been a few days.',c=>'Your spaces have been waiting for you.',c=>'Welcome back. The rooms are the same. You might not be.'],
  retLong:[c=>'It has been a while. Your spaces missed you.',c=>'You\'ve been away. This place held still for you.',c=>'Everything is as you left it. Welcome home.'],
  retRoom:[c=>'You keep coming back to this one.',c=>'This room remembers you.',c=>'This one has grown softly.',c=>'You always return here.',c=>`This one gets more ${c.adj} every time.`],
  future:[c=>'Someday.',c=>'This could be real.',c=>'A room for later.',c=>'Keep this one safe.',c=>'For when the time comes.'],
  forUs:[c=>'Our kind of room.',c=>'This one feels like us.',c=>'A Sunday kitchen. A movie night den. Ours.',c=>'Slowly becoming for us.'],
  pause:[c=>'sit in the space',c=>'breathe',c=>'this is yours',c=>'just be here',c=>'no rush',c=>'feel the room',c=>'stay a moment',c=>'some rooms are felt before they\'re finished',c=>'this is enough',c=>'let it settle',c=>`${c.tod} stillness`,c=>'the light is soft right now',c=>'just you and the room'],
  noteP:[c=>'What would this corner be for?',c=>'How do you want this room to feel?',c=>'What would you do here on a quiet day?',c=>'If you lived here, what would you change?',c=>'What does this room sound like?',c=>'Who would you share this space with?',c=>`What makes this room feel ${c.adj}?`],
  bloom:[c=>'You found everything. But this was never about finding. It was about creating.',c=>'Full bloom. Not because you collected things. Because you cared.',c=>'The garden is full. But it keeps growing.'],
};

// ── DISCOVERY STATE (persistent) ──
let DS={seen:{},unlocked:{},totalEdits:0,totalVisits:0,walkUses:0,memoriesSaved:0,notesWritten:0,lateNights:0,
  roomVisits:{},patterns:{lamp:0,plant:0,rug:0,bed:0,sofa:0,warmPal:0,coolPal:0},phase:'A'};

async function loadDS(){const s=await dg('discovery');if(s)Object.assign(DS,s)}
async function saveDS(){await ds('discovery',JSON.parse(JSON.stringify(DS)))}

// ── SELECTION ENGINE ──
// Picks from pool, avoids recent repeats, weights toward least-seen
function pick(poolKey,ctx,cooldown=120000){
  const pool=P[poolKey];if(!pool||!pool.length)return null;
  const now=Date.now();
  const cands=pool.map((fn,i)=>{const h=poolKey+'_'+i;const ls=DS.seen[h]||0;if(now-ls<cooldown)return null;return{fn,h,age:now-ls}}).filter(Boolean);
  if(!cands.length)return null;
  cands.sort((a,b)=>b.age-a.age);
  const top=cands.slice(0,Math.max(1,Math.ceil(cands.length*.6)));
  const c=top[Math.floor(Math.random()*top.length)];
  DS.seen[c.h]=now;saveDS();
  return c.fn(ctx);
}

// ── UNLOCK CHECKS ──
function checkUnlocks(){
  if(DS.walkUses>=5)DS.unlocked.mirror=true;
  if(DS.memoriesSaved>=3)DS.unlocked.future=true;
  if(DS.totalEdits>=30)DS.unlocked.forUs=true;
  if(DS.lateNights>=3)DS.unlocked.lateNight=true;
  if(DS.patterns.lamp>=8)DS.unlocked.lightLover=true;
  if(DS.patterns.plant>=6)DS.unlocked.plantLover=true;
  if(DS.patterns.rug>=4&&DS.patterns.sofa>=3)DS.unlocked.cozyRoom=true;
  if(DS.totalEdits>=50&&DS.phase==='C')DS.phase='D';
  else if(DS.totalEdits>=25&&DS.phase==='B')DS.phase='C';
  else if(DS.totalEdits>=10&&DS.phase==='A')DS.phase='B';
  saveDS();
}

// ── GENTLE MESSAGE DISPLAY ──
let lastG=0,lastH=0,lastMir=0,lastNP=0,actionCount=0,recentAT=[];

function showGentle(msg){if(!msg)return;const el=document.getElementById('gentleMsg');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),7200)}

function maybeAffirm(){
  actionCount++;const now=Date.now();const ctx=getCtx();checkUnlocks();
  // Track patterns
  if(curRoom){const ls=(curRoom.furniture||[]).map(f=>resolveLabel(f.label));DS.patterns.lamp=ls.filter(l=>l==='lamp').length;DS.patterns.plant=ls.filter(l=>l==='plant').length;DS.patterns.rug=ls.filter(l=>l==='rug').length;DS.patterns.sofa=ls.filter(l=>l==='sofa').length;DS.patterns.bed=ls.filter(l=>l==='bed').length}
  DS.totalEdits++;saveDS();
  // Pace
  const pace=getPace();const iv=pace==='fast'?16:pace==='slow'?8:11;const cd=pace==='fast'?50000:pace==='slow'?20000:30000;
  if(actionCount%(iv+Math.floor(Math.random()*6))===0&&now-lastG>cd){
    lastG=now;let msg=null;const r=Math.random();
    if(r<.04&&DS.unlocked.forUs)msg=pick('forUs',ctx,90000);
    else if(r<.08&&DS.unlocked.future)msg=pick('future',ctx,90000);
    else if(r<.15)msg=pick('ph'+DS.phase,ctx,60000);
    else if(r<.25)msg=pick('reflect',ctx,75000);
    else if(r<.35){const tp=ctx.tod==='morning'?'morning':ctx.tod==='evening'?'evening':ctx.tod==='night'?'night':null;if(tp)msg=pick(tp,ctx,60000)}
    else if(r<.42)msg=pick(ctx.season,ctx,90000);
    if(!msg&&r<.5&&DS.unlocked.lightLover&&ctx.hasLamp)msg=pick('lightLover',ctx,75000);
    if(!msg&&r<.55&&DS.unlocked.plantLover&&ctx.hasPlant)msg=pick('plantLover',ctx,75000);
    if(!msg&&r<.6&&DS.unlocked.cozyRoom&&ctx.hasRug)msg=pick('cozyRoom',ctx,75000);
    if(!msg)msg=pick('core',ctx,45000);
    if(msg)showGentle(msg)}
  // Love notes — generous: 3min between, recycle from pool every 90s
  if(actionCount>15&&Math.random()<.008&&now-lastH>180000){lastH=now;const n=pick('love',ctx,90000);if(n)setTimeout(()=>showGentle(n),2500)}
}

function maybeMirror(){if(camMode!=='walk'||!DS.unlocked.mirror)return;const now=Date.now();if(now-lastMir<300000||Math.random()>.04)return;lastMir=now;const m=pick('mirror',getCtx(),90000);if(m)setTimeout(()=>showGentle(m),1500)}
function maybeNoteP(){const now=Date.now();if(now-lastNP<60000||Math.random()>.04)return;lastNP=now;const m=pick('noteP',getCtx(),60000);if(m)showGentle(m)}

// ── RETURN MOMENTS ──
async function checkReturn(){
  const lv=await dg('lastVisit');const now=Date.now();await ds('lastVisit',now);
  DS.totalVisits++;if(getTimeOfDay()==='night')DS.lateNights++;saveDS();
  if(!lv)return;const h=(now-lv)/3600000;const ctx=getCtx();
  let msg=null;
  if(h>336)msg=pick('retLong',ctx,0);else if(h>72)msg=pick('retMed',ctx,0);else if(h>24)msg=pick('retShort',ctx,0);
  if(msg)setTimeout(()=>showGentle(msg),1500)}

async function checkRoomReturn(rid){
  const rv=DS.roomVisits[rid]||{count:0,first:Date.now()};rv.count++;rv.last=Date.now();DS.roomVisits[rid]=rv;saveDS();
  if(rv.count>=5&&Math.random()<.3){const m=pick('retRoom',getCtx(),180000);if(m)setTimeout(()=>showGentle(m),2000)}}

// ── PAUSE ──
function enterPause(){const m=pick('pause',getCtx(),30000);document.getElementById('pauseText').textContent=m||'just be here';document.getElementById('pauseOv').classList.add('on')}
document.getElementById('pauseOv').addEventListener('click',function(){this.classList.remove('on')});

// ── IDLE (do-nothing) ──
let idleT=null,idleOn=false;
function resetIdle(){if(idleT)clearTimeout(idleT);if(idleOn){document.querySelectorAll('.ed-hdr,.tbar,.cam-btns').forEach(el=>{el.style.opacity='';el.style.transition=''});idleOn=false}
  if(is3D)idleT=setTimeout(()=>{idleOn=true;document.querySelectorAll('.ed-hdr,.tbar').forEach(el=>{el.style.opacity='0.12';el.style.transition='opacity 2.5s ease'});maybeMirror()},20000)}

// ── STORYBOOK (combinational) ──
async function generateStory(){
  if(!curRoom)return'A room waiting to be imagined.';const ctx=getCtx();
  const notes=await loadRoomNotes(curRoom.id);const nt=notes.length?notes[Math.floor(Math.random()*notes.length)].text:'';
  const rv=DS.roomVisits[curRoom.id];const wv=rv&&rv.count>5;
  const s=[];
  if(ctx.items>3&&(ctx.hasLamp||ctx.hasRug)){s.push(`A ${ctx.adj} room with warm light and space to breathe.`);s.push('Soft textures, calm corners, and a little bit of magic.');s.push(`A room that feels like a Sunday ${ctx.tod==='morning'?'morning':'moment'}.`)}
  if(ctx.items<=2){s.push('Simple. Intentional. Just enough.');s.push(`A ${ctx.adj} room that speaks softly.`)}
  if(ctx.hasBed){s.push('A place to rest, and maybe to dream.');s.push(`Pillows arranged just so. A ${ctx.adj} invitation.`)}
  if(ctx.hasPlant&&ctx.items>4)s.push(`Green corners and ${ctx.adj} light. A room that breathes.`);
  if(ctx.hasLamp)s.push(`Warm light turns any ${ctx.tod} room into a story.`);
  if(ctx.hasSofa&&ctx.hasRug)s.push(`${ctx.A} and inviting. Like it was always here.`);
  if(nt){s.push(`A room where someone once imagined: "${nt}"`);s.push(`She wanted this to feel like: "${nt}"`)}
  if(wv){s.push('This room has history now.');s.push(`You've been here ${rv.count} times. It knows you.`)}
  if(ctx.season==='winter')s.push('A warm room for cold days.');
  if(ctx.season==='spring')s.push('A room that smells like something new.');
  if(ctx.tod==='night')s.push('A room designed by moonlight.');
  s.push('A room is just walls until someone fills it with feeling.');s.push(`Something ${ctx.adj} about this one.`);
  return s[Math.floor(Math.random()*s.length)]}

async function showStory(){document.getElementById('storyText').textContent=await generateStory();document.getElementById('storyOv').classList.add('on')}
function closeStory(){document.getElementById('storyOv').classList.remove('on')}

// ── ROOM NOTES ──
async function loadRoomNotes(rid){return(await dg('notes_'+rid))||[]}
async function saveRoomNote(rid,text){const n=await loadRoomNotes(rid);n.push({text,time:Date.now(),tod:getTimeOfDay()});await ds('notes_'+rid,n);DS.notesWritten++;saveDS()}
async function maybeSurfaceNote(rid){const n=await loadRoomNotes(rid);if(!n.length||Math.random()>.3)return;const x=n[Math.floor(Math.random()*n.length)];const tl={morning:'one morning',afternoon:'one afternoon',evening:'one evening',night:'late one night'}[x.tod||'afternoon'];setTimeout(()=>showGentle(`You once imagined, ${tl}: "${x.text}"`),2500)}

// ── THE GARDEN ──
function getGardenStage(room){
  const t=(room.furniture||[]).length+(room.openings||[]).length+(room.structures||[]).length;
  const rv=DS.roomVisits[room.id];
  const visits=rv?.count||0;
  const care=t+visits;
  if(care<=1)return{i:'\u{1F331}',l:'baby sprout'};
  if(care<=4)return{i:'\u{1F33F}',l:'little plant'};
  if(care<=8)return{i:'\u{1FAB4}',l:'growing rose bush'};
  if(care<=14)return{i:'\u{1F338}',l:'rosebud'};
  return{i:'\u{1F339}',l:'full rose'};
}
function openGarden(){
  const c=document.getElementById('gardenRooms');
  if(!projects.length){c.innerHTML='<div style="font-size:12px;color:var(--taupe);padding:20px">Begin your first room to start the garden.</div>'}
  else{c.innerHTML=projects.map(p=>{
    const fav=p.mood==='keep forever';
    const st=fav?{i:'\u{1F940}',l:'kept forever rose'}:getGardenStage(p);
    const ml=p.mood?`<div style="font-size:6px;color:var(--taupe);margin-top:1px">${p.mood}</div>`:'';
    return`<div class="garden-room" onclick="closeGarden();openPrj('${p.id}')"><div class="gr-icon">${st.i}</div><div class="gr-name">${esc(p.name)}</div><div style="font-size:7px;color:var(--rose);font-weight:500">${st.l}</div>${ml}</div>`}).join('')}
  const gm=document.querySelector('#gardenOv > div:nth-child(3)');
  if(gm){gm.textContent=projects.length>=7?'Your little sprouts are turning into roses.':projects.length>=4?'Each room grows from a baby plant into a rose with care.':projects.length>=2?'Every room begins as a tiny sprout.':'The first room starts as a baby plant.'}
  document.getElementById('gardenOv').classList.add('on')}
function closeGarden(){document.getElementById('gardenOv').classList.remove('on')}

// ── MOOD TAGS ──
const MOODS=['Cozy','Dreamy','Elegant','Feels like home','Keep forever','Peaceful','Romantic','Bright','Moody'];
const MOOD_HELP={
  cozy:'Cozy softens the room story toward warmth, nesting, rugs, lamps, and comfortable lived-in language.',
  dreamy:'Dreamy leans airy, gentle, and hazy. It affects descriptive tone and how the app frames the room feeling.',
  elegant:'Elegant biases the room story toward refined, composed, and polished styling cues.',
  'feels like home':'Feels like home emphasizes familiarity, comfort, and settled lived-in atmosphere.',
  'keep forever':'Keep forever marks the room as especially meaningful in the app’s sentimental/story layer.',
  peaceful:'Peaceful leans calm, unhurried, and quiet in the room’s mood/story identity.',
  romantic:'Romantic biases the room story toward intimacy, warmth, and softer evening ambience.',
  bright:'Bright pushes the room identity toward airy, fresh, clear, and light-filled language.',
  moody:'Moody leans deeper, cinematic, shadow-rich, and more dramatic in the room story.',
};
function setRoomMood(mood){if(!curRoom)return;curRoom.mood=curRoom.mood===mood?'':mood;saveAll();document.querySelectorAll('.mood-tag').forEach(t=>t.classList.toggle('sel',t.textContent.toLowerCase()===curRoom.mood));if(curRoom.mood)toast('\u{1F339} '+curRoom.mood.charAt(0).toUpperCase()+curRoom.mood.slice(1))}
function showMoodHelp(){
  if(document.getElementById('moodHelpOv'))return;
  const body=Object.entries(MOOD_HELP).map(([k,v])=>`<div style="margin-top:10px"><div style="font-weight:700;color:var(--rose-d);text-transform:capitalize">${k}</div><div style="font-size:11px;color:var(--taupe);line-height:1.45">${v}</div></div>`).join('');
  document.body.insertAdjacentHTML('beforeend',`<div id="moodHelpOv" style="position:fixed;inset:0;z-index:4200;display:flex;align-items:center;justify-content:center;background:rgba(51,41,34,.28);backdrop-filter:blur(4px)" onclick="if(event.target===this)this.remove()"><div style="width:min(420px,calc(100vw - 24px));max-height:80vh;overflow:auto;background:var(--bg);border-radius:20px;padding:18px;box-shadow:var(--shl)"><div class="props-hdr"><h4>Mood Guide</h4><button class="props-close" onclick=\"document.getElementById('moodHelpOv').remove()\">×</button></div><div style="font-size:11px;color:var(--taupe);line-height:1.45">Mood tags do not replace your models. They drive the app’s emotional labeling, saved-room story tone, and how the room is framed inside the experience.</div>${body}</div></div>`);
}

// ── MEMORY KEEPSAKE ──
async function saveMemory(rid){const room=projects.find(p=>p.id===rid);if(!room)return;const ctx=getCtx();const tl={morning:'a quiet morning',afternoon:'a golden afternoon',evening:'a soft evening',night:'a late night'};const mem={roomId:rid,name:room.name,mood:room.mood||'',date:new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),timeLabel:tl[ctx.tod],caption:await generateStory(),createdAt:Date.now()};const ms=(await dg('memories'))||[];ms.push(mem);await ds('memories',ms);DS.memoriesSaved++;saveDS();checkUnlocks();toast('\u{1F339} Memory saved')}

// ── PACE ──
function trackPace(){recentAT.push(Date.now());if(recentAT.length>10)recentAT.shift()}
function getPace(){if(recentAT.length<3)return'normal';const a=(recentAT[recentAT.length-1]-recentAT[0])/recentAT.length;return a<1500?'fast':a>5000?'slow':'normal'}

// ── FULL BLOOM + DEEP ──
async function checkFullBloom(){const pc=(await dg('eggs')||[]).length;if(DS.totalEdits>40&&pc>=5&&DS.memoriesSaved>=2){const lb=await dg('lastBloom');const now=Date.now();if(!lb||(now-lb)>3*86400000){await ds('lastBloom',now);const m=pick('bloom',getCtx(),0);if(m)setTimeout(()=>showGentle(m),5000)}}}
async function checkDeep(){if(DS.totalEdits<50)return;const ld=await dg('lastDeep');const now=Date.now();if(ld&&(now-ld)<5*86400000)return;if(Math.random()>.12)return;await ds('lastDeep',now);setTimeout(()=>showGentle('I made this because I love how you see the world.'),8000)}

// ── SEASONAL ──
function getSeasonalTouch(){const s=getSeason();return{spring:{accent:'#D4A5A0'},summer:{accent:'#C4A872'},autumn:{accent:'#B8956A'},winter:{accent:'#A0BCC8'}}[s]}

// ── FOR-US NAMES ──
const FOR_US=['Sunday Kitchen','Movie Night Den','Morning Coffee Corner','Future Home','Garden Room','Soft Beginning','Our Living Room'];

// ── HOOK ──
function pushU(){pushUBase();trackPace();maybeAffirm();maybeNoteP();resetIdle()}

// ── WELCOME ──
function updateWelcomeForTime(){const g=document.querySelector('.w-greeting');if(!g)return;if(activeProfile!=='rose'){g.textContent='Welcome back';return}const t=getTimeOfDay();if(t==='morning')g.textContent='Good morning, Rose';else if(t==='evening')g.textContent='Good evening, Rose';else if(t==='night')g.textContent='Late night, Rose';else g.textContent='Hi Rose'}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
let selfTestPromise=null;
async function runSelfTest(){
  if(selfTestPromise)return selfTestPromise;
  selfTestPromise=(async()=>{
  const out=document.getElementById('selfTestResults');if(!out)return;
  out.style.display='block';
  const results=[];
  const note=(name,pass,detail='')=>results.push(`${pass?'PASS':'FAIL'} ${name}${detail?` - ${detail}`:''}`);
  try{
    const room=normalizeRoom({id:uid(),name:'Self Test Room',height:9,wallThickness:.5,polygon:[{x:0,y:0},{x:14,y:0},{x:14,y:12},{x:0,y:12}],openings:[],structures:[],furniture:[],materials:{wall:WALL_PALETTES[0].color,wallFinish:'warm_white',floor:FLOOR_TYPES[0].color,floorType:FLOOR_TYPES[0].id,ceiling:'#FAF7F2',trim:TRIM_COLORS[0],ceilingBrightness:1,lightingPreset:'daylight'},createdAt:Date.now(),updatedAt:Date.now()});
    projects=[room];curRoom=room;openEd(room);
    const wall0=curRoom.walls[0],wall1=curRoom.walls[1];
    curRoom.openings.push({id:uid(),type:'door',wallId:wall0.id,offset:4,width:3,height:7,swing:'in'});
    curRoom.openings.push({id:uid(),type:'window',wallId:wall1.id,offset:5,width:3,height:4,sillHeight:3});
    curRoom.openings.push({id:uid(),type:'window',wallId:wall1.id,offset:9,width:3.6,height:4,sillHeight:2.8});
    curRoom.structures.push({id:uid(),type:'closet',rect:{x:9,y:7,w:4,h:4},height:curRoom.height,look:'cabinetry',finish:'white_shaker'});
    const placedAssets=[
      {label:'Sofa',assetKey:'sofa',x:3.4,z:3.6,w:5,d:2.5,rotation:25,mountType:'floor',elevation:0},
      {label:'Bookshelf',assetKey:'bookshelf',x:11.2,z:2.1,w:3,d:1,rotation:180,mountType:'floor',elevation:0},
      {label:'Dining Table',assetKey:'dining_table',x:6.8,z:7.1,w:5,d:3,rotation:0,mountType:'floor',elevation:0},
      {label:'Blinds',assetKey:'blinds',x:14,z:6,w:3.6,d:.2,rotation:0,mountType:'wall',elevation:6},
      {label:'Wall Art',assetKey:'wall_art_01',x:0,z:6,w:2.4,d:.2,rotation:0,mountType:'wall',elevation:5.2},
      {label:'Floor Lamp',assetKey:'lamp_floor',x:2,z:9.5,w:1,d:1,rotation:0,mountType:'floor',elevation:0},
      {label:'Dresser',assetKey:'dresser',x:10.8,z:10,w:4,d:1.8,rotation:180,mountType:'floor',elevation:0},
      {label:'Curtains',assetKey:'curtains',x:14,z:9,w:3.8,d:.25,rotation:0,mountType:'wall',elevation:7.2},
      {label:'Mirror',assetKey:'mirror',x:0,z:3.6,w:2,d:.2,rotation:0,mountType:'wall',elevation:5},
    ];
    placedAssets.forEach(item=>curRoom.furniture.push({id:uid(),...item,yOffset:0}));
    pushU();draw();
    note('door created',curRoom.openings.some(o=>o.type==='door'));
    note('window created',curRoom.openings.filter(o=>o.type==='window').length===2);
    note('closet created',curRoom.structures.some(s=>s.type==='closet'&&s.finish==='white_shaker'));
    sel={type:'structure',idx:0};uS('finish','dark_walnut');note('closet finish options work',curRoom.structures[0].finish==='dark_walnut');
    sel={type:null,idx:-1};
    note('picker keys match placed asset keys',placedAssets.every(item=>curRoom.furniture.some(f=>f.assetKey===item.assetKey&&f.label===item.label)));
    sel={type:'opening',idx:1};panelHidden=false;showP();
    note('window panel opens',document.getElementById('propsP').innerHTML.includes('Window')&&document.getElementById('propsP').innerHTML.includes('props-close'));
    closeP();sel={type:'opening',idx:1};panelHidden=false;showP();
    note('panel reopens after close',document.getElementById('propsP').classList.contains('on'));
    sel={type:'furniture',idx:0};panelHidden=false;showP();closeP();
    const center=tS({x:curRoom.furniture[0].x,y:curRoom.furniture[0].z});
    note('rotated furniture hit test',hitTest(center)?.type==='furniture');
    setWallFinish('sage');setFloorType('checker_tile');setTrimColor(TRIM_COLORS[2]);setCeilingBrightness(1.2);setLightingPreset('warm_evening');
    note('room materials updated',curRoom.materials.wallFinish==='sage'&&curRoom.materials.floorType==='checker_tile'&&String(curRoom.materials.trim).toLowerCase()===String(TRIM_COLORS[2]).toLowerCase()&&curRoom.materials.lightingPreset==='warm_evening'&&curRoom.materials.ceilingBrightness===1.2);
    toggle3D();await sleep(4000);
    note('entered 3D',is3D&&!!scene&&!!ren);
    setCamMode('walk');await sleep(150);
    note('walk mode toggles',camMode==='walk');
    setCamMode('orbit');await sleep(150);
    note('orbit mode toggles',camMode==='orbit');
    note('lighting preset affects renderer',Math.abs((ren?.toneMappingExposure||0)-LIGHTING_PRESETS.warm_evening.exposure)<.001,`exp:${ren?.toneMappingExposure}`);
    note('checker tile texture active',scene?.children.some(ch=>ch.material&&ch.material.map&&ch.material.map.repeat&&Math.abs(ch.material.map.repeat.x-FLOOR_TYPES.find(f=>f.id==='checker_tile').repeat)<.01));
    const requiredRoomAssets=['sofa','bookshelf','dining_table','blinds','wall_art_01','lamp_floor','dresser','curtains','mirror'];
    note('room scene uses mapped models',requiredRoomAssets.every(k=>ROOM_MODEL_DEBUG.ok.has(k)),`room-ok:${[...ROOM_MODEL_DEBUG.ok].join(',')}`);
    note('room scene has no mapped fallback block',ROOM_MODEL_DEBUG.blocked.size===0,`blocked:${[...ROOM_MODEL_DEBUG.blocked].join(',')}`);
    note('room scene has no mapped load fail',ROOM_MODEL_DEBUG.fail.size===0,`fail:${[...ROOM_MODEL_DEBUG.fail].join(',')}`);
    exit3DView();await sleep(200);
    note('2D reselection after 3D',hitTest(center)?.type==='furniture');
    savePrj();await saveAll();projects=[];await loadAll();
    const reloaded=projects.find(p=>p.name==='Self Test Room');
    note('save/load persisted',!!reloaded&&reloaded.furniture.length===9&&reloaded.openings.length===3&&reloaded.structures.length===1&&reloaded.materials.floorType==='checker_tile'&&reloaded.materials.lightingPreset==='warm_evening');
    openEd(reloaded);await sleep(100);toggle3D();await sleep(4500);
    await sleep(600);
    note('save/load preserved real models',requiredRoomAssets.every(k=>ROOM_MODEL_DEBUG.ok.has(k))&&ROOM_MODEL_DEBUG.fail.size===0&&ROOM_MODEL_DEBUG.blocked.size===0,`room-ok:${[...ROOM_MODEL_DEBUG.ok].join(',')}`);
    exit3DView();await sleep(100);
    await openAssetVerification();await sleep(5000);
    const loadedCards=[...document.querySelectorAll('.verify-card .verify-badge.loaded')].length;
    const failedCards=[...document.querySelectorAll('.verify-card .verify-badge.fail')].length;
    note('asset verification gallery loaded',loadedCards===Object.keys(MODEL_REGISTRY).length,`loaded:${loadedCards} failed:${failedCards}`);
  }catch(err){
    note('self test runtime',false,err.message||String(err));
    console.error('SELF TEST ERROR',err);
  }
  out.innerHTML=`<pre>${results.join('\n')}</pre>`;
  document.body.setAttribute('data-selftest',results.join('|'));
  const summary={passed:results.filter(x=>x.startsWith('PASS')),failed:results.filter(x=>x.startsWith('FAIL')),roomModelsOk:[...ROOM_MODEL_DEBUG.ok],roomModelsFail:[...ROOM_MODEL_DEBUG.fail],roomModelsBlocked:[...ROOM_MODEL_DEBUG.blocked],mappedAssetsLoaded:[...MODEL_DEBUG.ok],mappedAssetsFailed:[...MODEL_DEBUG.fail],standIns:[]};
  window.__lastSelfTest=summary;
  console.log(JSON.stringify(summary,null,2));
  return summary;
  })();
  try{return await selfTestPromise}finally{selfTestPromise=null}
}

async function boot(){
  document.body.classList.toggle('dev-mode',DEV_MODE);
  const httpReady=await ensureHttpRuntime();
  if(!httpReady&&location.protocol==='file:')return;
  loadActiveProfile();
  loadEditorPrefs();
  bindEditorKeys();
  await migrateLegacyProjectsIntoProfile();
  await loadAssetManifest();
  await loadAll();await checkWelcome();await loadEggs();await loadDS();
  await preflightAllModels();
  applyTimeTheme();updateWelcomeForTime();checkReturn();
  renderHome();popPresets();
  if(!getLocal(profileSeenKey()))openProfileSwitcher();
  setInterval(applyTimeTheme,60000);
  checkFullBloom();checkDeep();
  if(location.hash==='#selftest')setTimeout(()=>runSelfTest(),400);
}
window.runRoseSelfTest=runSelfTest;
window.openAssetVerification=openAssetVerification;
window.runRoomModelAudit=runRoomModelAudit;
window.focusSelectedAsset=focusSelectedAsset;
