import {useState,useRef,useEffect} from 'react';
import {placeCar,hostReveal,switchDecision,flipCoin,emptyStats,runBatch,pct,THEORY} from './engine.js';
import './styles.css';

let actx;
const beep=(on,f=440,d=.15)=>{if(!on)return;try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+d);}catch{}};
const STRATS=[{k:'stay',name:'Always Stay',icon:'🔒'},{k:'switch',name:'Always Switch',icon:'🔄'},{k:'coin',name:'Random Coin Flip',icon:'🪙'}];
const f2=x=>x.toFixed(2);

function Magician({say,mood}){return <div className="host"><div className={`mage ${mood||''}`} aria-hidden="true">🎩<span>🧙</span></div><p className="bubble" role="status">{say}</p></div>}
function Burst(){return <div className="burst" aria-hidden="true">{Array.from({length:28},(_,i)=><i key={i} style={{'--a':`${i*360/28}deg`,'--d':`${80+(i*37)%120}px`,'--c':['#d4af37','#f6e7a6','#8b5cf6','#c0392b'][i%4]}}/>)}</div>}
function Door({i,car,open,chosen,onClick,disabled}){
  return <button className={`door${open?' open':''}${chosen?' chosen':''}`} onClick={onClick} disabled={disabled}
    aria-label={`Door ${i+1}${chosen?', your choice':''}${open?(car?', car':', goat'):''}`}>
    <span className="behind">{open?(car?'🚗':'🐐'):''}</span><span className="leaf"><b>{i+1}</b></span></button>}
function Coin({side,flipping}){return <div className={`coin${flipping?' flip':''} ${side||''}`} aria-label={side?`Coin shows ${side}`:'Coin'}><div className="face h">H</div><div className="face t">T</div></div>}
function Scoreboard({s,coinMode,onReset}){
  const items=coinMode?[['Rounds',s.rounds],['Heads',s.heads],['Tails',s.tails],['Stayed',s.stayN],['Switched',s.swN],['Cars won',s.wins],['Goats',s.rounds-s.wins],['Win %',f2(pct(s.wins,s.rounds))]]
  :[['Rounds',s.rounds],['Wins',s.wins],['Losses',s.rounds-s.wins],['Win %',f2(pct(s.wins,s.rounds))],['Stayed',`${s.stayN} (${s.stayW} won, ${s.stayN-s.stayW} lost)`],['Switched',`${s.swN} (${s.swW} won, ${s.swN-s.swW} lost)`]];
  return <section className="panel score" aria-label="Scoreboard"><h3>Scoreboard</h3>
    {s.rounds===0&&<p className="muted">No rounds yet. Play one to start counting.</p>}
    <dl>{items.map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
    <button className="btn ghost" onClick={onReset}>Reset Scoreboard</button></section>}
const zero={rounds:0,wins:0,stayN:0,stayW:0,swN:0,swW:0,heads:0,tails:0};

function Game({coinMode,sound}){
  const fresh=()=>({car:placeCar(),pick:null,open:null,final:null,phase:'pick',side:null,flipping:false,action:null});
  const [g,setG]=useState(fresh);const [s,setS]=useState(zero);
  const choose=i=>{if(g.phase!=='pick')return;beep(sound,520);setG({...g,pick:i,open:hostReveal(g.car,i),phase:'decide'});};
  const finish=(action,side,st)=>{
    const final=action==='stay'?st.pick:switchDecision(st.pick,st.open),won=final===st.car;
    setG({...st,final,action,side,phase:'done',flipping:false});
    setS(p=>({rounds:p.rounds+1,wins:p.wins+won,stayN:p.stayN+(action==='stay'),stayW:p.stayW+(action==='stay'&&won),swN:p.swN+(action==='switch'),swW:p.swW+(action==='switch'&&won),heads:p.heads+(side==='heads'),tails:p.tails+(side==='tails')}));
    beep(sound,won?880:180,.3);};
  const flip=()=>{if(g.flipping)return;const side=flipCoin(),st=g;beep(sound,300,.5);setG({...g,flipping:true,side});setTimeout(()=>finish(side==='heads'?'stay':'switch',side,st),1700);};
  const won=g.phase==='done'&&g.final===g.car;
  const say={pick:'One door hides a sports car, the other two hide goats. Choose a door!',decide:`I know where the car is, and Door ${g.open!==null?g.open+1:''} is a goat. Trust your instinct, or change your fate?`,done:won?'Spectacular! The car is yours!':'Alas, the goat has claimed you.'}[g.phase];
  return <div className="stage">
    <Magician say={g.flipping?'The coin decides... heads stays, tails switches!':say} mood={g.phase==='done'?(won?'cheer':'sad'):''}/>
    <div className="doors">{[0,1,2].map(i=><Door key={i} i={i} car={g.car===i} open={g.phase==='done'||g.open===i} chosen={g.pick===i&&g.phase!=='done'||g.final===i} onClick={()=>choose(i)} disabled={g.phase!=='pick'}/>)}</div>
    {won&&<Burst/>}
    {g.phase==='decide'&&(coinMode?<div className="center"><Coin side={g.side} flipping={g.flipping}/><button className="btn" disabled={g.flipping} onClick={flip}>🪙 Flip the Coin</button><p className="muted">Heads = STAY, Tails = SWITCH</p></div>
      :<div className="center"><p className="prompt">Will you trust your first instinct or change your fate?</p><div className="row"><button className="btn big" onClick={()=>finish('stay',null,g)}>STAY — Keep My Door</button><button className="btn big alt" onClick={()=>finish('switch',null,g)}>SWITCH — Change My Door</button></div></div>)}
    {g.phase==='done'&&<section className="panel" aria-live="polite">
      <h2>{won?'You won the car!':'The goat got you!'}</h2>
      {coinMode&&<div className="center"><Coin side={g.side}/><p>The coin landed <b>{g.side}</b>, so you {g.action==='stay'?'stayed':'switched'}.</p></div>}
      <p>Your first door: <b>{g.pick+1}</b> · Host opened: <b>{g.open+1}</b> · Final door: <b>{g.final+1}</b> · Car was behind: <b>{g.car+1}</b></p>
      <p>{g.action==='stay'?(g.pick===g.car?'Your first pick held the car, so staying won.':'Your first pick was a goat (a 2 in 3 chance), so staying lost.'):(g.pick===g.car?'Your first pick held the car, so switching lost.':'Your first pick was a goat, so the host had to open the other goat, and switching led to the car.')}</p>
      <button className="btn" onClick={()=>setG(fresh())}>{coinMode?'Flip Again':'Play Again'}</button></section>}
    {coinMode&&s.rounds>0&&<p className="note">A fair coin picks stay or switch independently, so the expected win probability is (1/3 + 2/3) / 2 = 1/2 = 50%.</p>}
    <Scoreboard s={s} coinMode={coinMode} onReset={()=>setS(zero)}/></div>}

function Lab({sound}){
  const [s,setS]=useState(emptyStats());const [status,setStatus]=useState('idle');const [target,setTarget]=useState(0);const [el,setEl]=useState(0);
  const R=useRef({stats:emptyStats(),status:'idle',target:0,t0:0,acc:0,timer:0});
  const tick=()=>{const r=R.current;if(r.status!=='running')return;
    r.stats=runBatch(r.stats,Math.min(Math.max(1,Math.ceil(r.target/60)),r.target-r.stats.n));setS(r.stats);setEl(r.acc+performance.now()-r.t0);
    if(r.stats.n>=r.target){r.status='done';setStatus('done');beep(sound,880,.4);}else r.timer=setTimeout(tick,30);};
  const start=n=>{clearTimeout(R.current.timer);R.current={stats:emptyStats(),status:'running',target:n,t0:performance.now(),acc:0,timer:0};setTarget(n);setS(emptyStats());setEl(0);setStatus('running');tick();};
  const pause=()=>{const r=R.current;if(r.status!=='running')return;clearTimeout(r.timer);r.acc+=performance.now()-r.t0;r.status='paused';setStatus('paused');};
  const resume=()=>{const r=R.current;if(r.status!=='paused')return;r.status='running';r.t0=performance.now();setStatus('running');tick();};
  const reset=()=>{clearTimeout(R.current.timer);R.current.status='idle';setS(emptyStats());setStatus('idle');setTarget(0);setEl(0);};
  useEffect(()=>()=>clearTimeout(R.current.timer),[]);
  const busy=status==='running'||status==='paused';
  const best=status==='done'?Math.max(...STRATS.map(x=>s[x.k])):null;
  return <div className="stage"><Magician say={{idle:'Welcome to the laboratory. Choose how many games to simulate.',running:'Watch the doors fly...',paused:'The show is paused.',done:'The experiment is complete!'}[status]}/>
    <section className="panel"><div className="row">
      {[100,500,1000].map(n=><button key={n} className="btn" disabled={busy} onClick={()=>start(n)}>Run {n.toLocaleString()} Trials</button>)}
      <button className="btn alt" disabled={busy} onClick={()=>start(1000)}>Run All Experiments</button></div>
      <div className="row">
      <button className="btn ghost" disabled={status!=='running'} onClick={pause}>Pause</button>
      <button className="btn ghost" disabled={status!=='paused'} onClick={resume}>Resume</button>
      <button className="btn ghost" disabled={status==='idle'} onClick={reset}>Reset</button>
      <button className="btn ghost" disabled={status!=='done'} onClick={()=>start(target)}>Run Again</button></div>
      <p className="muted">“Run All Experiments” compares all three strategies over 1,000 trials each. Every trial uses one shared setup for all three strategies.</p></section>
    <section className="panel" aria-live="polite"><h3>{status==='idle'?'No experiment yet':`Trial ${s.n.toLocaleString()} of ${target.toLocaleString()} — ${{running:'running',paused:'paused',done:'completed'}[status]}`}</h3>
      <div className="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={target?Math.round(100*s.n/target):0}><div style={{width:`${target?100*s.n/target:0}%`}}/></div>
      <p className="muted">Elapsed: {(el/1000).toFixed(1)} s</p></section>
    <div className="cards">{STRATS.map(x=>{const a=pct(s[x.k],s.n),t=THEORY[x.k]*100,d=a-t;return <article key={x.k} className={`panel card${best!==null&&s[x.k]===best?' best':''}`}>
      <h3>{x.icon} {x.name}</h3>{best!==null&&s[x.k]===best&&<p className="tag">Highest in this run</p>}
      <p>Wins <b>{s[x.k]}</b> · Losses <b>{s.n-s[x.k]}</b></p><p className="pct">{f2(a)}%</p>
      <p>Theory: {f2(t)}% · Difference: {s.n?`${d>=0?'+':''}${f2(d)}`:'—'} pts</p></article>})}</div>
    <section className="panel"><h3>Actual vs theoretical win percentage</h3>
      <div className="chart">{STRATS.map(x=>{const a=pct(s[x.k],s.n),t=THEORY[x.k]*100;return <div key={x.k} className="col"><span className="val">{s.n?f2(a)+'%':'—'}</span>
        <div className="plot"><div className="actual" style={{height:`${a}%`}}/><div className="theory" style={{bottom:`${t}%`}}><em>{f2(t)}%</em></div></div><span>{x.name}</span></div>})}</div>
      <p className="muted">Gold bars: observed. Dashed line: theoretical value. Exact values are printed above each bar.</p>
      {status==='done'&&<p className="note">In this run the highest observed percentage went to the strategy with the most wins, but a different run could differ a little.</p>}</section>
    <section className="panel"><p>Probability predicts long-run behaviour, not the exact result of every experiment. With a small number of trials, the observed percentages may differ noticeably from the theoretical values. As the number of trials increases, the results generally tend to approach the theoretical probabilities.</p>
      <p>1,000 trials provide evidence for the probability pattern but do not guarantee exact percentages.</p>
      <details><summary>Why Does Switching Win More?</summary><p>When you first choose a door, your chance of selecting the car is 1/3, while your chance of selecting a goat is 2/3. If your first choice contains the car, switching loses. If your first choice contains a goat, the host must reveal the other goat, so switching leads to the car. Therefore, switching wins in 2 out of the 3 equally likely initial-choice cases.</p>
      <ul><li>Staying wins when the original choice contains the car.</li><li>Switching wins when the original choice contains a goat.</li><li>A fair coin gives equal probability to staying and switching, so its expected win probability is 50%.</li></ul></details></section></div>}

function Maths(){return <div className="stage"><section className="panel"><h2>Learn the Mathematics</h2>
  <h3>Theoretical probability</h3><p>Probability = Number of favourable outcomes / Total number of equally likely outcomes.</p>
  <table><thead><tr><th>Strategy</th><th>Theoretical probability</th><th>Percentage</th></tr></thead><tbody><tr><td>Always Stay</td><td>1/3</td><td>33.33%</td></tr><tr><td>Always Switch</td><td>2/3</td><td>66.67%</td></tr><tr><td>Random Coin Flip</td><td>1/2</td><td>50.00%</td></tr></tbody></table></section>
  <section className="panel"><h3>Three equally likely initial-choice cases</h3>
  {[['🚗','You pick the car','Staying wins, switching loses.'],['🐐','You pick goat 1','The host opens goat 2. Staying loses, switching wins.'],['🐐','You pick goat 2','The host opens goat 1. Staying loses, switching wins.']].map(([e,a,b])=><p key={a} className="case"><span>{e}</span><b>{a}.</b> {b}</p>)}
  <p>Staying wins in 1 case out of 3. Switching wins in 2 cases out of 3. The coin strategy picks each action with probability 1/2, so it wins with (1/2)(1/3) + (1/2)(2/3) = 1/2.</p></section>
  <section className="panel"><h3>Theoretical vs experimental probability</h3><p><b>Theoretical</b> probability is what mathematics predicts from the rules. <b>Experimental</b> probability is wins divided by trials in an actual run. They rarely match exactly, but they tend to get closer as trials increase (the law of large numbers).</p></section></div>}

const PAGES=[['home','Home'],['challenge','Magician’s Challenge'],['coin','Flip the Fate'],['lab','Grand Experiment'],['maths','Mathematics']];
export default function App(){
  const [page,setPage]=useState('home');const [sound,setSound]=useState(false);const [calm,setCalm]=useState(false);
  const cards=[['challenge','🚪','The Magician’s Challenge','Play the classic game. Stay or switch, and see which wins.'],['coin','🪙','Flip the Fate','Let a fair coin decide whether you stay or switch.'],['lab','🔬','The Grand Experiment','Simulate 100, 500 or 1,000 games and compare all three strategies.']];
  return <div className={`app${calm?' calm':''}`}>
    <header><nav aria-label="Main">{PAGES.map(([k,l])=><button key={k} className={page===k?'on':''} onClick={()=>setPage(k)} aria-current={page===k?'page':undefined}>{k==='home'?'🏠 ':''}{l}</button>)}</nav>
      <div className="toggles"><label><input type="checkbox" checked={sound} onChange={e=>setSound(e.target.checked)}/> Sound</label><label><input type="checkbox" checked={calm} onChange={e=>setCalm(e.target.checked)}/> Reduce motion</label></div></header>
    <main key={page} className="page">
    {page==='home'&&<div className="stage"><h1>The Magician’s Paradox</h1><p className="sub">Three doors. One car. One surprising mathematical secret.</p>
      <p className="intro">A magician has hidden a car behind one of three doors. The other two doors hide goats. Choose a door, watch the magician reveal a goat, and decide whether to trust your first choice or switch. Can mathematics outsmart intuition?</p>
      <div className="cards">{cards.map(([k,e,t,d])=><article key={k} className="panel card"><div className="emoji" aria-hidden="true">{e}</div><h3>{t}</h3><p>{d}</p><button className="btn" onClick={()=>setPage(k)}>Enter {t}</button></article>)}</div>
      <section className="panel"><h2>How It Works</h2><ol><li>Pick one of three doors.</li><li>The magician, who knows where the car is, opens a different door that hides a goat.</li><li>You choose: stay with your door or switch to the other closed door.</li><li>Your final door opens. Car wins!</li></ol></section>
      <section className="panel"><h2>Learn the Mathematics</h2><p>Switching wins 2 times in 3 and staying wins 1 time in 3. Why? <button className="link" onClick={()=>setPage('maths')}>Read the explanation</button></p></section></div>}
    {page==='challenge'&&<Game key="c" sound={sound}/>}
    {page==='coin'&&<Game key="f" coinMode sound={sound}/>}
    {page==='lab'&&<Lab sound={sound}/>}
    {page==='maths'&&<Maths/>}</main></div>}
