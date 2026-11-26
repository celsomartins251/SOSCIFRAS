(function(){
"use strict";
var N=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var FL={Db:"C#",Eb:"D#",Gb:"F#",Ab:"G#",Bb:"A#"};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function note(n){return N[((n%12)+12)%12];}
function parse(token){
 var raw=String(token||"").replace(/^[()]+|[()]+$/g,"");
 var m=raw.match(/^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?)|\/(\d+))?$/);
 if(!m)return null;
 var rootName=m[1]+m[2],root=N.indexOf(FL[rootName]||rootName);
 if(root<0)return null;
 var q=m[3]||"",low=q.toLowerCase();
 var minor=/^m(?!aj)|^min/.test(low);
 var dim=/dim|°|º|ø/.test(low),aug=/aug|\+/.test(low);
 var sus4=/sus4|sus/.test(low)&&!/sus2/.test(low),sus2=/sus2/.test(low);
 var ints=dim?[0,3,6]:aug?[0,4,8]:sus4?[0,5,7]:sus2?[0,2,7]:minor?[0,3,7]:[0,4,7];
 var maj7=/maj7|Maj7|M7|7M|Δ7|^(?:maj|Maj)(?:9|11|13)/.test(q),has7=/(^|[^0-9])7/.test(q)||maj7||/^(maj|Maj)(9|11|13)/.test(q)||(/(^|[^0-9])(?:9|11|13)(?:$|[^0-9])/.test(q)&&!/add9/.test(q));
 function add(v){if(ints.indexOf(v)<0)ints.push(v);}
 if(has7)add(/dim7|°7|º7/.test(q)?9:(maj7?11:10));
 if(/6/.test(q)&&!/(1[236])/.test(q))add(9);
 if(/b5/.test(q))add(6);if(/#5/.test(q))add(8);
 if(/b9/.test(q))add(1);else if(/#9/.test(q))add(3);else if(/(^|[^#b])9/.test(q))add(2);
 if(/#11/.test(q))add(6);else if(/(^|[^#b])11/.test(q))add(5);
 if(/b13/.test(q))add(8);else if(/13/.test(q))add(9);
 if(/add2/.test(q))add(2);if(/add4/.test(q))add(5);if(/add9/.test(q))add(2);
 ints=ints.filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});
 var tones=ints.map(function(v){return note(root+v);});
 var inversions=ints.map(function(v,i){var a=ints.slice(i).concat(ints.slice(0,i).map(function(x){return x+12;}));return a.map(function(x){return note(root+x);}).join(" – ");});
 while(inversions.length<4)inversions.push(inversions.length===3?tones.concat([note(root+12)]).join(" – "):(inversions[inversions.length-1]||tones.join(" – ")));
 var scale="Maior (Jônio)",formula=[0,2,4,5,7,9,11];
 if(/#9/.test(q)||((/b9/.test(q))&&(/b13|#11/.test(q)))){scale="Alterada (Superlócria)";formula=[0,1,3,4,6,8,10];}
 else if(/b9/.test(q)){scale="Frígio dominante";formula=[0,1,4,5,7,8,10];}
 else if(/b13/.test(q)){scale="Mixolídio b13";formula=[0,2,4,5,7,8,10];}
 else if(/#11/.test(q)){scale=maj7?"Lídio":"Lídio dominante";formula=maj7?[0,2,4,6,7,9,11]:[0,2,4,6,7,9,10];}
 else if(dim){scale="Lócrio";formula=[0,1,3,5,6,8,10];}
 else if(minor&&maj7){scale="Menor melódica";formula=[0,2,3,5,7,9,11];}
 else if(minor){scale="Dórico";formula=[0,2,3,5,7,9,10];}
 else if(maj7){scale="Maior (Jônio)";formula=[0,2,4,5,7,9,11];}
 else if(has7||sus4){scale="Mixolídio";formula=[0,2,4,5,7,9,10];}
 else if(aug){scale="Tons inteiros";formula=[0,2,4,6,8,10];}
 return {name:raw,root:rootName,tones:tones,intervals:ints,inversions:inversions.slice(0,4),scale:scale,scaleNotes:formula.map(function(v){return note(root+v);})};
}
function renderLine(line,shift){
 var NAMES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
 function transpose(t){var m=t.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?|\d+))?$/);if(!m)return t;var r=FL[m[1]]||m[1],i=NAMES.indexOf(r);if(i<0)return t;var bass=m[3]?(/^\d/.test(m[3])?m[3]:NAMES[((NAMES.indexOf(FL[m[3]]||m[3])+shift)%12+12)%12]):"";return NAMES[((i+shift)%12+12)%12]+m[2]+(bass?"/"+bass:"");}
 return line.replace(/D\.S\.\s+al\s+Coda|(\S+)( *)/gi,function(full,t,sp){if(/^D\.S\.\s+al\s+Coda$/i.test(full))return '<span class="music-inline-marker">D.S. al Coda</span>';if(!t)return esc(full);if(t==="|"||t==="‖")return '<span class="music-inline-marker '+(t==="‖"?'doublebar':'barline')+'">'+esc(t)+'</span>'+esc(sp||"");var pre=(t.match(/^\(+/)||[""])[0],core=t.slice(pre.length),suf="";while(core.endsWith(")")&&(core.match(/\)/g)||[]).length>(core.match(/\(/g)||[]).length){core=core.slice(0,-1);suf+=")";}if(!parse(core))return esc(t+sp);var tr=transpose(core);return esc(pre)+'<button type="button" class="chordTap" data-chord="'+esc(tr)+'" aria-label="Ver opções do acorde '+esc(tr)+'">'+esc(tr)+'</button>'+esc(suf+sp);});
}
var INSTRUMENTS={
 guitar6:{label:"Violão · 6 cordas",tuning:[40,45,50,55,59,64],names:["E","A","D","G","B","E"],strings:6},
 guitar7:{label:"Violão · 7 cordas (Dó)",tuning:[36,40,45,50,55,59,64],names:["C","E","A","D","G","B","E"],strings:7},
 bass4:{label:"Contrabaixo · 4 cordas",tuning:[28,33,38,43],names:["E","A","D","G"],strings:4}
};
function fretNote(midi){return note(midi%12);}
function chordShapes(x,key){
 var ins=INSTRUMENTS[key]||INSTRUMENTS.guitar6, tones=x.intervals.map(function(v){return (x.tones.length?((N.indexOf(x.tones[0])+v)%12):0);});
 var roots=ins.tuning.map(function(t){return ((t%12)+12)%12;}),out=[];
 var configs=[{name:"A",anchor:1,shift:0},{name:"C",anchor:1,shift:-2},{name:"E",anchor:0,shift:0},{name:"D",anchor:2,shift:0}];
 configs.forEach(function(cfg){
  var rootFret=-1;for(var f=0;f<=14;f++)if(((ins.tuning[cfg.anchor]+f)%12)===x.rootIndex){rootFret=f;break;}
  if(rootFret<0){out.push({name:cfg.name,notes:[],reason:"A tônica não está disponível nesta região."});return;}
  var center=Math.max(0,rootFret+cfg.shift),low=Math.max(0,center-1),high=Math.min(15,center+4),choices=[];
  for(var s=0;s<ins.strings;s++){
   var arr=[];for(var fr=0;fr<=15;fr++){var pc=((ins.tuning[s]+fr)%12);if(tones.indexOf(pc)>=0&&fr>=low&&fr<=high)arr.push({string:s,fret:fr,pc:pc,interval:x.intervals.find(function(v){return ((x.rootIndex+v)%12)===pc;})});}
   arr.sort(function(a,b){return Math.abs(a.fret-center)-Math.abs(b.fret-center);});if(s===cfg.anchor)arr=arr.filter(function(v){return v.pc===x.rootIndex;});choices.push(arr.slice(0,3));
  }
  var best=null,selected=[];
  function evaluate(){
   var used=selected.filter(Boolean),present=used.map(function(n){return n.pc;}),missing=tones.filter(function(t){return present.indexOf(t)<0;});
   if(used.length<4||used.filter(function(n){return n.string===cfg.anchor&&n.pc===x.rootIndex;}).length===0)return;
   var frets=used.map(function(n){return n.fret;}),span=Math.max.apply(null,frets)-Math.min.apply(null,frets);
   if(span>4)return;
   var score=missing.length*100+span*4+Math.abs((frets.reduce(function(a,b){return a+b;},0)/frets.length)-center)+used.length*-0.3;
   if(!best||score<best.score)best={score:score,notes:used.slice(),missing:missing};
  }
  function walk(i){
   if(i===ins.strings){evaluate();return;}
   selected[i]=null;walk(i+1);
   choices[i].forEach(function(c){selected[i]=c;walk(i+1);});
   selected[i]=null;
  }
  walk(0);
  if(best){best.name=cfg.name;best.low=Math.min.apply(null,best.notes.map(function(n){return n.fret;}));best.complete=!best.missing.length;best.barres=[];for(var bf=1;bf<=15;bf++){var ss=best.notes.filter(function(n){return n.fret===bf;}).map(function(n){return n.string;}).sort(function(a,b){return a-b;});if(ss.length>=3&&ss[ss.length-1]-ss[0]+1===ss.length)best.barres.push({fret:bf,from:ss[0],to:ss[ss.length-1]});}var finger=1,barreFrets=best.barres.map(function(b){return b.fret;});best.notes.forEach(function(n){if(n.fret===0){n.finger="";return;}if(barreFrets.indexOf(n.fret)>=0){n.finger="1";return;}var lower=best.notes.filter(function(v){return v.fret>0&&v.fret<n.fret&&!barreFrets.includes(v.fret);}).map(function(v){return v.fret;}).filter(function(v,i,a){return a.indexOf(v)===i;}).length;n.finger=String(Math.min(4,1+barreFrets.length+lower));});out.push(best);}
  else out.push({name:cfg.name,notes:[],reason:"Não foi encontrada uma posição confortável nesta região."});
 });
 return {instrument:ins,shapes:out};
}
function fretSvg(shape,ins){
 if(!shape.notes.length)return '<div class="neck-unavailable">'+esc(shape.reason)+'</div>';
 var frets=shape.notes.map(function(n){return n.fret;}),min=Math.min.apply(null,frets),start=Math.max(0,min===0?0:min),count=5,top=25,left=26,w=190,h=118,step=w/(ins.strings-1),cell=18;
 var svg='<svg class="fret-svg" viewBox="0 0 230 158" role="img" aria-label="Diagrama forma '+shape.name+'">';
 for(var s=0;s<ins.strings;s++){var xx=left+s*step;svg+='<line x1="'+xx+'" y1="'+top+'" x2="'+xx+'" y2="'+(top+count*cell)+'" class="fret-string"/>';}
 for(var fr=0;fr<=count;fr++){var yy=top+fr*cell;svg+='<line x1="'+left+'" y1="'+yy+'" x2="'+(left+w)+'" y2="'+yy+'" class="fret-line"/>';}
 if(start===0)svg+='<line x1="'+left+'" y1="'+top+'" x2="'+(left+w)+'" y2="'+top+'" class="fret-nut"/>';
 else svg+='<text x="5" y="'+(top+cell*2.8)+'" class="fret-number">'+start+'º</text>';
 shape.barres.forEach(function(b){var yb=top+(b.fret-start+.5)*cell;svg+='<line x1="'+(left+b.from*step)+'" y1="'+yb+'" x2="'+(left+b.to*step)+'" y2="'+yb+'" class="fret-barre"/>';});
 for(var s2=0;s2<ins.strings;s2++){var n=shape.notes.find(function(v){return v.string===s2;});if(!n){svg+='<text x="'+(left+s2*step)+'" y="15" text-anchor="middle" class="fret-open">×</text>';continue;}if(n.fret===0){svg+='<text x="'+(left+s2*step)+'" y="15" text-anchor="middle" class="fret-open">○</text>';continue;}var yy2=top+(n.fret-start+.5)*cell;if(yy2<top-2||yy2>top+count*cell+2)continue;svg+='<circle cx="'+(left+s2*step)+'" cy="'+yy2+'" r="6.2" class="fret-dot"/><text x="'+(left+s2*step)+'" y="'+(yy2+2.5)+'" text-anchor="middle" class="fret-dot-text">'+(n.finger||"")+'</text>';}
 svg+='</svg><div class="fret-string-names">'+ins.names.map(esc).join("　")+'</div>';
 return svg;
}
function bassNeck(x){
 var ins=INSTRUMENTS.bass4,html='<div class="bass-neck"><div class="bass-fret-head"><span>CORDAS</span><span>CASAS</span></div><div class="bass-grid">';
 for(var s=ins.strings-1;s>=0;s--){html+='<div class="bass-row"><b>'+ins.names[s]+'</b>';for(var f=0;f<=12;f++){var pc=(ins.tuning[s]+f)%12,active=x.scaleNotes.some(function(n){return N.indexOf(n)===pc;});html+='<span class="'+(active?'scale-note':'')+'">'+(active?fretNote(pc):"")+'</span>';}html+='</div>';}
 return html+'</div><p class="bass-legend"><i></i> Notas da escala sugerida · '+esc(x.scale)+'</p></div>';
}
function panel(){
 var x=parse(window.SOSChordSelected||"");if(!x)return "";
 x.rootIndex=N.indexOf(FL[x.root]||x.root);
 var key=window.SOSChordInstrument||"guitar6",data=chordShapes(x,key);
 var html='<div class="chord-panel" data-close-chord="1"><section class="chord-panel-card" role="dialog" aria-modal="true" aria-label="Diagramas do acorde"><div class="chord-panel-head"><div><small style="color:var(--mute)">ACORDE SELECIONADO</small><div class="chord-panel-title">'+esc(x.name)+'</div></div><button type="button" class="tb" data-close-chord="1" aria-label="Fechar">✕</button></div>';
 html+='<label class="instrument-label" for="chord-instrument">Instrumento</label><select id="chord-instrument" class="chord-instrument"><option value="guitar6" '+(key==="guitar6"?"selected":"")+'>Violão de 6 cordas · E A D G B E</option><option value="guitar7" '+(key==="guitar7"?"selected":"")+'>Violão de 7 cordas · C E A D G B E</option><option value="bass4" '+(key==="bass4"?"selected":"")+'>Contrabaixo · E A D G</option></select>';
 if(key==="bass4"){html+='<h3>Escala no braço do contrabaixo</h3>'+bassNeck(x);}
 else{
  html+='<h3>Formas de acorde no braço</h3><p class="chord-help">Quatro referências de posição: A, C, E e D. A digitação é calculada para as notas deste acorde e para a afinação selecionada.</p><div class="chord-shapes">';
  data.shapes.forEach(function(sh){html+='<article class="shape-card"><b>Forma '+sh.name+'</b><div class="shape-diagram">'+fretSvg(sh,data.instrument)+'</div><small>'+(sh.notes.length?(sh.complete?"Todas as notas do acorde incluídas.":"Voicing adaptado; notas omitidas: "+sh.missing.map(fretNote).join(", "))+(sh.barres.length?" Pestana indicada.":""):"Posição indisponível")+'</small></article>';});
  html+='</div>';
 }
 html+='<details class="chord-theory"><summary>Ver notas e estrutura do acorde</summary><p>Notas: <b>'+x.tones.join(" · ")+'</b></p><p>Intervalos: '+x.intervals.join(" – ")+' semitons a partir da tônica</p><p>Escala sugerida: <b>'+esc(x.scale)+'</b></p><p>'+x.scaleNotes.join(" – ")+'</p></details></section></div>';
 return html;
}
window.SOSChord={renderLine:renderLine,panel:panel,isNotationLine:function(t){return /^(?:[\s𝄆𝄇𝄋𝄌①②1ª2ª.\-|‖]+|D\.S\. al Coda)$/.test(t)&&(/[|‖𝄆𝄇𝄋𝄌①②]|1ª|2ª|D\.S\. al Coda/.test(t));}};
document.addEventListener("change",function(ev){
 if(ev.target&&ev.target.id==="chord-instrument"){window.SOSChordInstrument=ev.target.value;var p=document.querySelector(".chord-panel");if(p)p.outerHTML=panel();}
});
document.addEventListener("click",function(ev){
 var chord=ev.target.closest("[data-chord]");
 if(chord){ev.preventDefault();window.SOSChordSelected=chord.getAttribute("data-chord");var old=document.querySelector(".chord-panel");if(old)old.remove();document.body.insertAdjacentHTML("beforeend",panel());return;}
 if(ev.target.closest("[data-close-chord]")){var p=document.querySelector(".chord-panel");if(p)p.remove();window.SOSChordSelected="";return;}
 var mark=ev.target.closest("[data-mark]");
 if(!mark&&!ev.target.closest(".chord-panel-card")){var active=document.querySelector(".chord-panel");if(active)active.remove();window.SOSChordSelected="";}
 if(mark){
  var area=document.getElementById("eb");if(!area)return;
  var start=area.selectionStart,end=area.selectionEnd,text=area.value,symbol=mark.getAttribute("data-mark"),ins;
  if(symbol==="|"||symbol==="‖"||symbol==="D.S. al Coda"){
   var lineStart=text.lastIndexOf("\n",Math.max(0,start-1))+1;
   var left=text.slice(lineStart,start),right=text.slice(end);
   var before=left&&!/\s$/.test(left)?" ":"";
   var after=right&&!/^\s/.test(right)?" ":"";
   ins=before+symbol+after;
  }else{ins="\n"+symbol+"\n";}
  area.value=text.slice(0,start)+ins+text.slice(end);
  area.focus();area.selectionStart=area.selectionEnd=start+ins.length;return;
 }
});
document.addEventListener("pointerover",function(ev){
 if(!window.matchMedia||!window.matchMedia("(hover: hover) and (pointer: fine)").matches)return;
 var chord=ev.target.closest("[data-chord]");if(!chord)return;
 var old=document.querySelector(".chord-hover");if(old)old.remove();
 window.SOSChordSelected=chord.getAttribute("data-chord");
 var x=parse(window.SOSChordSelected);if(!x)return;x.rootIndex=N.indexOf(FL[x.root]||x.root);
 var data=chordShapes(x,"guitar6"),html='<div class="chord-hover"><b>'+esc(x.name)+' · violão 6 cordas</b><div class="hover-shapes">';
 data.shapes.forEach(function(sh){html+='<div><strong>'+sh.name+'</strong>'+fretSvg(sh,data.instrument)+'</div>';});
 html+='</div><small>Clique para ampliar e escolher o instrumento</small></div>';
 chord.insertAdjacentHTML("afterend",html);
});
document.addEventListener("pointerout",function(ev){
 var chord=ev.target.closest("[data-chord]");if(!chord)return;
 if(ev.relatedTarget&&chord.contains(ev.relatedTarget))return;
 var hover=document.querySelector(".chord-hover");if(hover)hover.remove();
});
})();