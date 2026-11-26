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
 const ins=INS[key],out=[],seen=new Set(),maxF=key==="bass4"?17:14,minNotes=key==="bass4"?2:Math.min(3,ins.tuning.length);
 for(let base=0;base<=Math.min(9,maxF-4);base++){
  const options=ins.tuning.map((t,s)=>{const a=[null];for(let f=0;f<=maxF;f++){if(f!==0&&(f<base||f>base+4))continue;const p=pc(t+f);if(x.tones.includes(p))a.push({string:s,fret:f,pc:p,finger:0})}const sorted=a.slice(1).sort((u,v)=>Math.abs(u.fret-(base+2))-Math.abs(v.fret-(base+2)));return [null].concat(sorted.slice(0,2))});
  const selected=Array(ins.tuning.length).fill(null);
  function evaluate(){
   const notes=selected.filter(Boolean);if(notes.length<minNotes)return;
   const pcs=[...new Set(notes.map(n=>n.pc))];const required=[x.root];if(x.intervals.includes(3))required.push(pc(x.root+3));else if(x.intervals.includes(4))required.push(pc(x.root+4));else if(x.intervals.includes(2))required.push(pc(x.root+2));else if(x.intervals.includes(5))required.push(pc(x.root+5));if(x.intervals.includes(10))required.push(pc(x.root+10));else if(x.intervals.includes(11))required.push(pc(x.root+11));else if(x.intervals.includes(9)&&x.tones.length>3)required.push(pc(x.root+9));if(x.tones.length<=3)x.tones.forEach(p=>required.push(p));if(required.some(p=>!pcs.includes(p)))return;if(x.bass!==null){const lowest=notes.slice().sort((a,b)=>a.string-b.string)[0];if(lowest.pc!==x.bass)return;}
   const missing=x.tones.filter(p=>!pcs.includes(p));if(missing.length>x.tones.length-2)return;
   const fs=notes.filter(n=>n.fret>0).map(n=>n.fret),span=fs.length?Math.max(...fs)-Math.min(...fs):0;if(span>4||new Set(fs).size>4)return;
   const k=notes.map(n=>n.string+":"+n.fret).join(",");if(seen.has(k))return;
   const score=missing.length*100+span*5+Math.abs((fs.reduce((a,b)=>a+b,0)/(fs.length||1))-(base+1))*1.2+(key==="bass4"?Math.max(0,notes.length-3)*2:0)-notes.length*1.4;
   out.push({name:"Região "+(base+1),base:base+1,notes:notes.map(n=>({...n,finger:n.fret===0?0:[...new Set(fs)].sort((a,b)=>a-b).indexOf(n.fret)+1})),barres:[],score,source:"Calculado pela afinação"});seen.add(k);
  }
  function walk(i){if(i===options.length){evaluate();return}for(const v of options[i]){selected[i]=v;walk(i+1)}selected[i]=null}
  walk(0);
 }
 out.sort((a,b)=>a.score-b.score);return out.slice(0,4);
}
function getShapes(x,key){
 let shapes=key==="guitar6"?apiShapes(x):[];
 if(shapes.length<4){const generated=calculateShapes(x,key),used=new Set(shapes.map(s=>s.notes.map(n=>n.string+":"+n.fret).join("|")));
  for(const s of generated){const k=s.notes.map(n=>n.string+":"+n.fret).join("|");if(!used.has(k)){shapes.push(s);used.add(k)}if(shapes.length>=4)break}}
 return shapes.slice(0,4);
}
function diagram(shape,ins,x){
 if(ins.tuning.length===4&&ins.tuning[0]===28){
  const left=28,top=25,cell=27,frets=12,w=left+frets*29+8,h=top+ins.tuning.length*cell+12;let svg='<div class="dict-bass-scroll"><svg viewBox="0 0 '+w+' '+h+'" class="dict-bass-svg" role="img" aria-label="Posição '+x.symbol+' no contrabaixo">';
  for(let f=0;f<=frets;f++){const xx=left+f*29;svg+='<line x1="'+xx+'" y1="'+top+'" x2="'+xx+'" y2="'+(top+ins.tuning.length*cell)+'" class="'+(f===0?"dict-nut":"dict-fret")+'"/><text x="'+xx+'" y="14" text-anchor="middle" class="dict-fret-no">'+f+'</text>'}
  ins.tuning.forEach((t,s)=>{const yy=top+s*cell;svg+='<text x="2" y="'+(yy+4)+'" class="dict-bass-name">'+ins.names[s]+'</text><line x1="'+left+'" y1="'+yy+'" x2="'+(left+frets*29)+'" y2="'+yy+'" class="dict-string"/>'});
  shape.notes.forEach(n=>{const xx=left+n.fret*29,yy=top+n.string*cell;svg+='<circle cx="'+xx+'" cy="'+yy+'" r="8.5" class="'+(n.pc===x.root?"dict-root":"dict-dot")+'"/><text x="'+xx+'" y="'+(yy+3)+'" text-anchor="middle" class="dict-dot-txt">'+pitch(n.pc)+'</text>'});
  return svg+'</svg></div>';
 }
 const count=5,top=27,left=18,w=ins.tuning.length===7?224:ins.tuning.length===4?154:194,step=w/(ins.tuning.length-1),cell=25,fs=shape.notes.map(n=>n.fret),min=fs.length?Math.min(...fs):0,start=min===0?0:Math.max(1,Math.min(shape.base||min,min));
 let svg='<svg viewBox="0 0 '+(w+36)+' 172" class="dict-svg" role="img" aria-label="Diagrama '+x.symbol+'">';
 for(let s=0;s<ins.tuning.length;s++){const xx=left+s*step,n=shape.notes.find(v=>v.string===s);svg+='<line x1="'+xx+'" y1="'+top+'" x2="'+xx+'" y2="'+(top+count*cell)+'" class="dict-string"/><text x="'+xx+'" y="17" text-anchor="middle" class="dict-open">'+(n?(n.fret===0?"○":""):"×")+'</text>'}
 for(let f=0;f<=count;f++){const yy=top+f*cell;svg+='<line x1="'+left+'" y1="'+yy+'" x2="'+(left+w)+'" y2="'+yy+'" class="'+(f===0&&start===0?"dict-nut":"dict-fret")+'"/>'}
 if(start>0)svg+='<text x="2" y="'+(top+cell*2.8)+'" class="dict-fret-no">'+start+'ª</text>';
 shape.notes.forEach(n=>{if(n.fret===0)return;const cy=top+(n.fret-start+.5)*cell;if(cy<top||cy>top+count*cell)return;const cx=left+n.string*step;svg+='<circle cx="'+cx+'" cy="'+cy+'" r="8.2" class="dict-dot"/><text x="'+cx+'" y="'+(cy+3)+'" text-anchor="middle" class="dict-dot-txt">'+(n.finger||"")+'</text>'});
 svg+='</svg><div class="dict-strings">'+ins.names.join("　")+'</div>';return svg;
}

let audioContext=null;
function playShape(shape,ins){
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC||!shape||!shape.notes||!shape.notes.length)return;
 try{
  audioContext=audioContext||new AC();const ctx=audioContext;if(ctx.state==="suspended")ctx.resume();
  const master=ctx.createGain(),filter=ctx.createBiquadFilter(),now=ctx.currentTime;
  filter.type="lowpass";filter.frequency.value=5200;filter.Q.value=.55;master.gain.setValueAtTime(.72,now);master.connect(filter);filter.connect(ctx.destination);
  shape.notes.slice().sort((a,b)=>a.string-b.string).forEach((n,i)=>{
   const midi=ins.tuning[n.string]+n.fret,f=440*Math.pow(2,(midi-69)/12),t=now+i*.035;
   const voice=ctx.createGain(),body=ctx.createBiquadFilter(),fund=ctx.createOscillator(),harm=ctx.createOscillator(),blend=ctx.createGain();
   fund.type="triangle";fund.frequency.setValueAtTime(f,t);harm.type="sine";harm.frequency.setValueAtTime(f*2.01,t);
   body.type="lowpass";body.frequency.setValueAtTime(Math.min(6500,f*8),t);blend.gain.value=.2;
   voice.gain.setValueAtTime(.0001,t);voice.gain.linearRampToValueAtTime(.105,t+.012);voice.gain.exponentialRampToValueAtTime(.0001,t+(ins.tuning[0]<35?1.15:.9));
   fund.connect(body);harm.connect(blend);blend.connect(body);body.connect(voice);voice.connect(master);
   fund.start(t);harm.start(t);fund.stop(t+1.2);harm.stop(t+1.2);
  });
  setTimeout(()=>{try{master.disconnect()}catch(_){}},1600);
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
 html+='</select><div class="chord-diagram-title">'+symbol+'</div><div class="dict-carousel" aria-label="Deslize para ver outras posições">';
 shapes.forEach((shape,i)=>{html+=shapeSlide(shape,i,ins,x)});
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
.dict-panel{max-width:420px;margin:8px auto 12px}.dict-panel .chord-panel-card{background:#17191c;border:1px solid #39342a;border-radius:15px;padding:10px}.dict-top,.dict-shape-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.dict-top{color:#d5aa42;font-size:10px;font-weight:800;letter-spacing:.12em;margin-bottom:9px}.dict-top button{font-size:23px;color:#aaa;background:none;border:0}.dict-carousel{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y pinch-zoom;scrollbar-width:none}.dict-carousel::-webkit-scrollbar{display:none}.dict-shape{flex:0 0 100%;min-width:0;scroll-snap-align:center;background:#101010;border:1px solid #39342a;border-radius:10px;padding:10px}.dict-shape-head b{font-size:11px;color:#f0c65b}.dict-play{border:1px solid #5a451b;border-radius:7px;background:#2b2415;color:#f0c65b;padding:5px 7px;font-size:10px}.dict-svg{display:block;width:100%;height:auto;max-height:190px}.dict-string{stroke:#8a8a8a;stroke-width:1.4}.dict-fret{stroke:#555;stroke-width:1.3}.dict-nut{stroke:#d5aa42;stroke-width:4}.dict-dot{fill:#f1f2f4;stroke:#f1f2f4}.dict-dot-txt{fill:#191919;font-size:7px;font-weight:800}.dict-open,.dict-fret-no,.dict-bass-name{fill:#aaa;font-size:10px}.dict-strings{text-align:center;color:#aaa;font:9px monospace;white-space:nowrap}.dict-shape>small{display:block;color:#8f8a80;font-size:9px;line-height:1.3;margin-top:5px}.dict-bass-scroll{width:100%;overflow:hidden}.dict-bass-svg{display:block;width:100%;min-width:0;height:auto}.dict-root{fill:#d5aa42;stroke:#f0c65b}.dict-swipe-hint{text-align:center;color:#aaa398;font-size:10px;margin:7px 0 0}.dict-panel .chord-instrument{margin:0 0 8px}@media(max-width:360px){.dict-shapes{grid-template-columns:1fr}.dict-shape{max-width:300px;width:100%;margin:auto}}`;
document.head.appendChild(style);api().then(()=>{const p=document.querySelector(".dict-panel");if(p&&window.SOSChordInstrument==="guitar6")refreshPanel(p,"guitar6")});
window.SOSChordDictionary={parseChord:parseChord,calculateShapes:calculateShapes,refresh:refreshPanel};
})();