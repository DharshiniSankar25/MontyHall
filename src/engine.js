// Pure maths/game logic: no React in here.
export const THEORY={stay:1/3,switch:2/3,coin:1/2};
const rand=n=>Math.floor(Math.random()*n);
export const placeCar=()=>rand(3);                 // random car placement
export const pickDoor=()=>rand(3);                 // random initial player choice
// Host opens a door that is NOT the player's and NOT the car; random if two qualify.
export function hostReveal(car,pick){const ok=[0,1,2].filter(d=>d!==pick&&d!==car);return ok[rand(ok.length)];}
export const stayDecision=pick=>pick;
export const switchDecision=(pick,open)=>[0,1,2].find(d=>d!==pick&&d!==open);
export const flipCoin=()=>Math.random()<0.5?'heads':'tails'; // fair, independent
// One trial: same setup is used for all three strategies; coin is independent.
export function runTrial(){
  const car=placeCar(),pick=pickDoor(),open=hostReveal(car,pick),side=flipCoin();
  const coinFinal=side==='heads'?stayDecision(pick):switchDecision(pick,open);
  return{car,pick,open,side,stay:stayDecision(pick)===car,switch:switchDecision(pick,open)===car,coin:coinFinal===car};
}
export const emptyStats=()=>({n:0,stay:0,switch:0,coin:0});
export function runBatch(s,k){const r={...s};for(let i=0;i<k;i++){const t=runTrial();r.n++;r.stay+=t.stay;r.switch+=t.switch;r.coin+=t.coin;}return r;}
export const runMany=k=>runBatch(emptyStats(),k);
export const pct=(w,n)=>n?100*w/n:0;
