import {hostReveal,switchDecision,runMany,pct} from './engine.js';
let bad=0;
for(let car=0;car<3;car++)for(let pick=0;pick<3;pick++)for(let i=0;i<200;i++){
  const o=hostReveal(car,pick);if(o===car||o===pick){bad++;}
  const sw=switchDecision(pick,o);if(sw===pick||sw===o)bad++;
  if(pick===car&&sw===car)bad++;if(pick!==car&&sw!==car)bad++;}
console.log('rule violations:',bad);
const r=runMany(200000);console.log('stay',pct(r.stay,r.n).toFixed(1),'switch',pct(r.switch,r.n).toFixed(1),'coin',pct(r.coin,r.n).toFixed(1));
process.exit(bad?1:0);
