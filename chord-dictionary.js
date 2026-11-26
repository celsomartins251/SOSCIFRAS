/* SOS CIFRAS — Dicionário de shapes v1.0 */
(function(){
"use strict";
const PC=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],FL={Db:"C#",Eb:"D#",Gb:"F#",Ab:"G#",Bb:"A#"};
const INS={
 guitar6:{label:"Violão · 6 cordas",tuning:[40,45,50,55,59,64],names:["E","A","D","G","B","E"]},
 guitar7:{label:"Violão · 7 cordas (Dó)",tuning:[36,40,45,50,55,59,64],names:["C","E","A","D","G","B","E"]},
 cavaquinho4:{label:"Cavaquinho · 4 cordas",tuning:[62,67,71,74],names:["D","G","B","D"]},
 bass4:{label:"Contrabaixo · 4 cordas",tuning:[28,33,38,43],names:["E","A","D","G"]}
};
let apiData=null,apiPromise=null;
function api(){if(apiData)return Promise.resolve(apiData);if(!apiPromise)apiPromise=fetch("https://openguitarchords.com/data/chords.json",{mode:"cors"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>(apiData=d,d)).catch(()=>null);return apiPromise}
function pc(n){return((n%12)+12)%12}function pitch(n){return PC[pc(n)]}function rootIndex(n){return PC.indexOf(FL[n]||n)}
function parseChord(symbol){
 const m=String(symbol||"").trim().match(/^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?)|\/(\d+))?$/);if(!m)return null;
 const rootName=m[1]+m[2],root=rootIndex(rootName);if(root<0)return null;
 const q=m[3]||"",l=q.toLowerCase(),minor=/^m(?!aj)|^min/.test(l),halfDim=/ø|m7b5/.test(l),dim=/dim|°|º/.test(l),aug=/aug|\+/.test(l),sus2=/sus2/.test(l),sus4=/sus4|sus(?!2)/.test(l);
 let ints=halfDim?[0,3,6]:dim?[0,3,6]:aug?[0,4,8]:sus2?[0,2,7]:sus4?[0,5,7]:minor?[0,3,7]:[0,4,7];
 const maj7=/maj7|Maj7|M7|7M|Δ7|^maj(?:9|11|13)/.test(q),has7=/(^|[^0-9])7/.test(q)||maj7||(/(^|[^0-9])(9|11|13)/.test(q)&&!/add(?:2|9|4)/.test(q)),add=n=>{if(!ints.includes(n))ints.push(n)};
 if(has7)add(/dim7|°7|º7/.test(q)?9:maj7?11:10);
 if(halfDim&&!ints.includes(10))add(10);
 if(/b5/.test(q)){ints=ints.filter(v=>v!==7);add(6)}if(/#5/.test(q)){ints=ints.filter(v=>v!==7);add(8)}if(/b9/.test(q))add(1);else if(/#9/.test(q))add(3);else if(/(^|[^#b])9/.test(q)&&!/add9/.test(q))add(2);
 if(/#11/.test(q))add(6);else if(/(^|[^#b])11/.test(q))add(5);if(/b13/.test(q))add(8);else if(/(^|[^#b])13/.test(q))add(9);
 if(/add2/.test(q)||/add9/.test(q))add(2);if(/add4/.test(q))add(5);if(/6/.test(q)&&!/(1[236])/.test(q))add(9);
 ints=ints.filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b);
 return{symbol,root,rootName,quality:q,intervals:ints,tones:ints.map(v=>pc(root+v)),bass:m[4]?rootIndex(m[4]+(m[5]||"")):null};
}
function apiShapes(x){
 if(!apiData)return[];const all=Array.isArray(apiData.chords)?apiData.chords:Object.values(apiData.chords||{});
 const entry=all.find(c=>c&&c.symbol&&String(c.symbol).toLowerCase()===x.symbol.toLowerCase());if(!entry)return[];
 const list=entry.voicings&&entry.voicings.length?entry.voicings:[entry];
 return list.map((v,i)=>({name:"Posição "+(i+1),base:Number(v.baseFret||entry.baseFret||1),frets:v.frets||entry.frets,fingers:v.fingers||entry.fingers,barres:v.barres||entry.barres||[],source:"Open Guitar Chords"}))
 .filter(v=>Array.isArray(v.frets)&&v.frets.length===6).slice(0,8)
 .map(v=>({name:v.name,base:v.base,notes:v.frets.map((f,s)=>f==="x"||f===null?null:{string:s,fret:Number(f),finger:Number((v.fingers||[])[s]||0)}).filter(Boolean),barres:v.barres,source:v.source}));
}
function calculateShapes(x,key){
 const ins=INS[key],out=[],seen=new Set(),maxF=key==="bass4"?17:15;
 const required=[x.root],third=x.intervals.includes(3)?3:x.intervals.includes(4)?4:x.intervals.includes(2)?2:x.intervals.includes(5)?5:null;
 if(third!==null)required.push(pc(x.root+third));
 if(x.intervals.includes(10))required.push(pc(x.root+10));else if(x.intervals.includes(11))required.push(pc(x.root+11));
 if(required.length===1)required.push(...x.tones.slice(1,Math.min(3,x.tones.length)));
 for(let base=0;base<=Math.min(12,maxF-4);base++){
  const choices=ins.tuning.map((t,s)=>{const arr=[];for(let fret=0;fret<=maxF;fret++){if(base===0?(fret>4):(fret<base||fret>base+4))continue;const tone=pc(t+fret);if(x.tones.includes(tone))arr.push({string:s,fret,pc:tone})}arr.sort((u,v)=>Math.abs(u.fret-(base+2))-Math.abs(v.fret-(base+2)));return[null,...arr.slice(0,3)]});
  const selected=Array(ins.tuning.length).fill(null);
  function evaluate(){
   const notes=selected.filter(Boolean);if(notes.length<(key==="bass4"?2:3))return;
   const pcs=[...new Set(notes.map(n=>n.pc))];if(required.some(t=>!pcs.includes(t)))return;
   if(x.bass!==null&&notes.slice().sort((u,v)=>u.string-v.string)[0].pc!==x.bass)return;
   const frets=notes.filter(n=>n.fret>0).map(n=>n.fret),span=frets.length?Math.max(...frets)-Math.min(...frets):0;if(span>4)return;
   const missing=x.tones.filter(t=>!pcs.includes(t));if(missing.length>(x.tones.length>3?2:0))return;
   const k=notes.map(n=>n.string+":"+n.fret).join("|");if(seen.has(k))return;
   const avg=frets.length?frets.reduce((u,v)=>u+v,0)/frets.length:0,score=missing.length*100+span*7+Math.abs(avg-(base+2))*1.5-notes.length*2+base*.08;
   const ranks=[...new Set(frets)].sort((u,v)=>u-v);
   out.push({name:"Posição",base:base===0?1:base,notes:notes.map(n=>({...n,finger:n.fret===0?0:ranks.indexOf(n.fret)+1})),barres:[],score,source:"Digitação calculada"});seen.add(k);
  }
  function walk(i){if(i===choices.length){evaluate();return}for(const n of choices[i]){selected[i]=n;walk(i+1)}selected[i]=null}
  walk(0);
 }
 out.sort((u,v)=>u.score-v.score);return out.slice(0,4).map((s,i)=>({...s,name:"Posição "+(i+1)}));
}
function getShapes(x,key){return calculateShapes(x,key).filter(v=>v.notes&&v.notes.length).slice(0,4);}

function diagram(shape,ins,x){
 const strings=ins.tuning.length,step=strings===7?25:strings===6?29:38,left=24,right=24,top=48,cell=50,frets=5,w=left+right+(strings-1)*step,h=top+cell*frets+24;
 const fs=shape.notes.map(n=>n.fret).filter(f=>f>0),min=fs.length?Math.min(...fs):0,start=min===0?0:Math.max(1,Math.min(Number(shape.base)||min,min));
 let svg='<div class="dict-guitar-wrap"><svg viewBox="0 0 '+w+' '+h+'" class="dict-svg" role="img" aria-label="Braço do instrumento '+x.symbol+'">';
 for(let s=0;s<strings;s++){const xx=left+s*step,n=shape.notes.find(v=>v.string===s);svg+='<line x1="'+xx+'" y1="'+top+'" x2="'+xx+'" y2="'+(top+cell*frets)+'" class="dict-string"/><text x="'+xx+'" y="'+(top-13)+'" text-anchor="middle" class="dict-open">'+(n?(n.fret===0?"○":""):"×")+'</text>'}
 for(let f=0;f<=frets;f++){const yy=top+f*cell;svg+='<line x1="'+left+'" y1="'+yy+'" x2="'+(w-right)+'" y2="'+yy+'" class="'+(f===0&&start===0?"dict-nut":"dict-fret")+'"/>'}
 if(start>0)svg+='<rect x="'+(w/2-38)+'" y="5" width="76" height="28" rx="14" class="dict-position-bg"/><text x="'+(w/2)+'" y="24" text-anchor="middle" class="dict-position-label">'+start+'ª casa</text>';
 const bm={};shape.notes.forEach(n=>{if(n.fret>0)(bm[n.fret]||(bm[n.fret]=[])).push(n.string)});
 Object.keys(bm).forEach(f=>{const ss=bm[f].sort((a,b)=>a-b);if(ss.length>=3&&ss[ss.length-1]-ss[0]+1===ss.length){const y=top+(Number(f)-start+.5)*cell;if(y>=top&&y<=top+cell*frets)svg+='<line x1="'+(left+ss[0]*step)+'" y1="'+y+'" x2="'+(left+ss[ss.length-1]*step)+'" y2="'+y+'" class="dict-barre"/>'}});
 shape.notes.forEach(n=>{if(n.fret===0)return;const cy=top+(n.fret-start+.5)*cell;if(cy<top||cy>top+cell*frets)return;const cx=left+n.string*step;svg+='<circle cx="'+cx+'" cy="'+cy+'" r="10" class="'+(n.pc===x.root?"dict-root":"dict-dot")+'"/>'});
 svg+='</svg></div>';return svg;
}
let audioContext=null;
function playShape(shape,ins){
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC||!shape||!shape.notes||!shape.notes.length)return;
 try{
  audioContext=audioContext||new AC();const ctx=audioContext;if(ctx.state==="suspended")ctx.resume();
  const master=ctx.createGain(),tone=ctx.createBiquadFilter(),now=ctx.currentTime;
  tone.type="lowpass";tone.frequency.setValueAtTime(ins.tuning[0]<35?2400:4200,now);tone.Q.value=.7;
  master.gain.setValueAtTime(.82,now);master.connect(tone);tone.connect(ctx.destination);
  shape.notes.slice().sort((a,b)=>a.string-b.string).forEach((n,i)=>{
   const midi=ins.tuning[n.string]+n.fret,f=440*Math.pow(2,(midi-69)/12),t=now+i*.045,duration=ins.tuning[0]<35?1.65:1.35;
   const env=ctx.createGain(),body=ctx.createBiquadFilter();body.type="lowpass";body.frequency.setValueAtTime(Math.min(6000,f*7),t);body.Q.value=.45;
   env.gain.setValueAtTime(.0001,t);env.gain.linearRampToValueAtTime(.16,t+.009);env.gain.exponentialRampToValueAtTime(.0001,t+duration);
   body.connect(env);env.connect(master);
   [[1,.72,"triangle"],[2.01,.19,"sine"],[3.02,.07,"sine"]].forEach(([ratio,level,type])=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(f*ratio,t);gain.gain.value=level;osc.connect(gain);gain.connect(body);osc.start(t);osc.stop(t+duration+.04);
   });
  });
  setTimeout(()=>{try{master.disconnect()}catch(_){}},2100);
 }catch(err){console.warn("Áudio do acorde:",err)}
}

function shapeSlide(shape,i,ins,x){
 return '<article class="dict-shape dict-slide"><div class="dict-shape-head"><b>Posição '+(i+1)+' de '+(window.__sosCurrentShapes||[]).length+'</b><button type="button" class="dict-play" data-play-shape="'+i+'" aria-label="Ouvir acorde '+x.symbol+'">▶ Ouvir</button></div>'+diagram(shape,ins,x)+'</article>';
}
function panel(symbol){
 const x=parseChord(symbol);if(!x)return"";
 const key=window.SOSChordInstrument||"guitar6",ins=INS[key]||INS.guitar6,shapes=getShapes(x,key);
 window.__sosCurrentShapes=shapes;window.__sosCurrentInstrument=key;
 let html='<div class="chord-panel-inline dict-panel" data-selected-chord="'+symbol.replace(/"/g,"&quot;")+'"><section class="chord-panel-card"><div class="dict-top"><span>ACORDE</span><button type="button" data-close-chord aria-label="Fechar">×</button></div><select id="chord-instrument" class="chord-instrument" aria-label="Instrumento">';
 Object.keys(INS).forEach(k=>html+='<option value="'+k+'" '+(k===key?"selected":"")+'>'+INS[k].label+'</option>');
 html+='</select><div class="chord-diagram-title">'+symbol+'</div><div class="dict-credit">Banco de posições: Fretwork · CC BY 4.0</div><div class="dict-carousel" aria-label="Deslize para ver outras posições">';
 shapes.forEach((shape,i)=>{html+=shapeSlide(shape,i,ins,x)});if(!shapes.length)html+='<p class="chord-diagram-empty">Carregando banco de acordes ou posição não cadastrada para este acorde.</p>';
 html+='</div><div class="dict-swipe-hint">'+(shapes.length>1?'Deslize para o lado para ver outras posições':'Posição disponível')+'</div></section></div>';
 return html;
}

function refreshPanel(p,key){
 const symbol=p.getAttribute("data-selected-chord"),x=parseChord(symbol);if(!x)return;
 const ins=INS[key]||INS.guitar6,shapes=getShapes(x,key);window.__sosCurrentShapes=shapes;window.__sosCurrentInstrument=key;
 p.querySelector(".dict-carousel").innerHTML=shapes.map((shape,i)=>shapeSlide(shape,i,ins,x)).join("")||'<p class="chord-diagram-empty">Posição não encontrada.</p>';
 p.querySelector(".dict-swipe-hint").textContent=shapes.length>1?"Deslize para o lado para ver outras posições":"Posição disponível";
}
document.addEventListener("click",function(ev){
 const chord=ev.target.closest&&ev.target.closest("[data-chord]");
 if(chord){ev.preventDefault();ev.stopImmediatePropagation();const symbol=chord.getAttribute("data-chord"),current=document.querySelector(".dict-panel");if(current&&current.getAttribute("data-selected-chord")===symbol){current.remove();window.SOSChordSelected="";return}if(current)current.remove();document.querySelectorAll(".chord-panel-inline:not(.dict-panel)").forEach(el=>el.remove());window.SOSChordSelected=symbol;const row=chord.closest(".cs")||chord.parentElement;row.insertAdjacentHTML("afterend",panel(symbol));return}
 const play=ev.target.closest&&ev.target.closest("[data-play-shape]");if(play){ev.preventDefault();const i=Number(play.getAttribute("data-play-shape")),s=(window.__sosCurrentShapes||[])[i],ins=INS[window.__sosCurrentInstrument||"guitar6"];if(s)playShape(s,ins);ev.stopImmediatePropagation();return}
 if(ev.target.closest&&ev.target.closest("[data-close-chord]")){ev.target.closest(".dict-panel")?.remove();window.SOSChordSelected="";ev.stopImmediatePropagation();return}
},true);
document.addEventListener("change",function(ev){if(ev.target&&ev.target.id==="chord-instrument"){const p=ev.target.closest(".dict-panel");if(!p)return;window.SOSChordInstrument=ev.target.value;refreshPanel(p,ev.target.value);ev.stopImmediatePropagation()}},true);
const style=document.createElement("style");style.textContent=`
.dict-panel{max-width:420px;margin:8px auto 12px}.dict-panel .chord-panel-card{background:#17191c;border:1px solid #39342a;border-radius:15px;padding:10px}.dict-top,.dict-shape-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.dict-top{color:#d5aa42;font-size:10px;font-weight:800;letter-spacing:.12em;margin-bottom:9px}.dict-top button{font-size:23px;color:#aaa;background:none;border:0}.dict-carousel{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y pinch-zoom;scrollbar-width:none}.dict-carousel::-webkit-scrollbar{display:none}.dict-shape{flex:0 0 100%;min-width:0;scroll-snap-align:center;background:#101010;border:1px solid #39342a;border-radius:10px;padding:10px}.dict-shape-head b{font-size:11px;color:#f0c65b}.chord-diagram-title{font-size:25px;font-weight:800;color:#f0c65b;text-align:center;margin:4px 0 4px}.dict-credit{text-align:center;color:#8f8a80;font-size:9px;margin:0 0 8px}.dict-play{border:1px solid #5a451b;border-radius:7px;background:#2b2415;color:#f0c65b;padding:5px 7px;font-size:10px}.dict-guitar-wrap{width:100%;display:flex;justify-content:center;background:#f6f4ee;border-radius:8px;padding:8px 3px}.dict-svg{display:block;width:auto;max-width:100%;height:auto;max-height:360px}.dict-string{stroke:#222;stroke-width:2}.dict-fret{stroke:#222;stroke-width:2}.dict-nut{stroke:#080808;stroke-width:8}.dict-open{fill:#222;font-size:15px;font-weight:800}.dict-dot{fill:#080808;stroke:#080808;stroke-width:1}.dict-root{fill:#080808;stroke:#080808;stroke-width:1}.dict-barre{stroke:#080808;stroke-width:17;stroke-linecap:round}.dict-position-bg{fill:#080808}.dict-position-label{fill:#fff;font-size:15px;font-weight:800}.dict-fret-no,.dict-bass-name{fill:#222;font-size:11px}.dict-strings{text-align:center;color:#aaa;font:9px monospace;white-space:nowrap}.dict-shape>small{display:block;color:#8f8a80;font-size:9px;line-height:1.3;margin-top:5px}.dict-bass-scroll{width:100%;overflow:hidden}.dict-bass-svg{display:block;width:100%;min-width:0;height:auto;background:#f6f4ee;border-radius:8px;padding:5px 2px;box-sizing:border-box}.dict-root{fill:#d5aa42;stroke:#f0c65b}.dict-swipe-hint{text-align:center;color:#aaa398;font-size:10px;margin:7px 0 0}.dict-panel .chord-instrument{margin:0 0 8px}`;
document.head.appendChild(style);
/* Banco Fretwork: posições publicadas e verificadas para violão em afinação padrão. */
let fretworkDB=null;
function fretworkKey(x){
 const q=(x.quality||'').trim(),r=x.rootName;
 if(x.bass!==null)return r+'/'+PC[x.bass];
 if(!q)return r;
 if(/^(7M|M7|maj7|maj9|maj11|maj13)$/i.test(q))return r+'maj7';
 if(/^(m7b5|m7\\(b5\\)|ø)$/i.test(q))return r+'m7b5';
 if(/^(m|min)$/i.test(q))return r+'m';
 if(/^(dim|°|º)$/i.test(q))return r+'dim';
 if(/^(dim7|°7|º7)$/i.test(q))return r+'dim7';
 return r+q;
}
const getShapesFallback=getShapes;
getShapes=function(x,key){
 if(key==='guitar6'||key==='guitar7'){
  if(!fretworkDB)return [];
  const entry=fretworkDB.find(c=>c.symbol.toLowerCase()===fretworkKey(x).toLowerCase());
  if(entry&&Array.isArray(entry.shapes)){
   const offset=key==='guitar7'?1:0;
   return entry.shapes.map((v,i)=>({name:v.position||('Posição '+(i+1)),base:(v.frets.filter(n=>n!==null&&n>0).sort((a,b)=>a-b)[0]||1),notes:v.frets.map((f,j)=>f===null?null:{string:j+offset,fret:Number(f),finger:0}).filter(Boolean),barres:[],source:'Fretwork CC BY 4.0',fretString:v.fret_string})).filter(v=>v.notes.length).slice(0,4);
  }
  return [];
 }
 const shapes=getShapesFallback(x,key),seen=new Set();
 return shapes.filter(v=>{const sig=v.notes.map(n=>n.string+':'+n.fret).sort().join('|');if(seen.has(sig))return false;seen.add(sig);return true});
};
function loadFretwork(){
 let cached=null;try{cached=JSON.parse(localStorage.getItem('sos_fretwork_chords_v1')||'null')}catch(_){}
 if(Array.isArray(cached)&&cached.length)fretworkDB=cached;
 return fetch('https://guitarfretwork.com/data/chords.json',{mode:'cors',cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(d=>{if(!Array.isArray(d))throw Error('Formato Fretwork inválido');fretworkDB=d;try{localStorage.setItem('sos_fretwork_chords_v1',JSON.stringify(d))}catch(_){};const p=document.querySelector('.dict-panel');if(p)refreshPanel(p,window.SOSChordInstrument||'guitar6');window.SOSChordDatabaseStatus={source:'Fretwork',records:d.length,loaded:true};return d}).catch(err=>{window.SOSChordDatabaseStatus={source:fretworkDB?'Fretwork cache':'fallback',loaded:!!fretworkDB};console.warn('Fretwork:',err);return fretworkDB});
}
loadFretwork();
window.SOSChordDictionary={parseChord:parseChord,calculateShapes:calculateShapes,refresh:refreshPanel ,loadDatabase:loadFretwork};
})()