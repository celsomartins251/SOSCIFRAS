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
 return line.replace(/(\S+)( *)/g,function(_,t,sp){var pre=(t.match(/^\(+/)||[""])[0],core=t.slice(pre.length),suf="";while(core.endsWith(")")&&(core.match(/\)/g)||[]).length>(core.match(/\(/g)||[]).length){core=core.slice(0,-1);suf+=")";}if(!parse(core))return esc(t+sp);var tr=transpose(core);return esc(pre)+'<button type="button" class="chordTap" data-chord="'+esc(tr)+'" aria-label="Ver opções do acorde '+esc(tr)+'">'+esc(tr)+'</button>'+esc(suf+sp);});
}
function panel(){
 var x=parse(window.SOSChordSelected||"");if(!x)return "";
 var html='<div class="chord-panel" data-close-chord="1"><section class="chord-panel-card" role="dialog" aria-modal="true" aria-label="Opções do acorde"><div class="chord-panel-head"><div><small style="color:var(--mute)">ACORDE SELECIONADO</small><div style="font-size:26px;font-weight:800;color:var(--brand)">'+esc(x.name)+'</div></div><button type="button" class="tb" data-close-chord="1" aria-label="Fechar">✕</button></div>';
 html+='<h3>Estrutura do acorde</h3><p>Notas: <b>'+x.tones.join(" · ")+'</b></p><p>Intervalos: '+x.intervals.join(" – ")+' semitons a partir da tônica</p>';
 html+='<h3>Quatro opções de voicing</h3><div class="chord-options">';
 x.inversions.forEach(function(v,i){html+='<div class="chord-option"><b>Opção '+(i+1)+'</b><div class="chord-notes">'+esc(v)+'</div></div>';});
 html+='</div><h3>Contrabaixo · escala sugerida</h3><p><b>'+esc(x.scale)+'</b></p><div class="chord-notes">'+x.scaleNotes.join(" – ")+'</div><p>Escala calculada a partir da cifra. Outras escolhas podem funcionar conforme a função harmônica e o contexto.</p></section></div>';
 return html;
}
window.SOSChord={renderLine:renderLine,panel:panel,isNotationLine:function(t){return /^(?:[\s𝄆𝄇𝄋𝄌①②1ª2ª.\-|‖]+|D\.S\. al Coda)$/.test(t)&&(/[|‖𝄆𝄇𝄋𝄌①②]|1ª|2ª|D\.S\. al Coda/.test(t));}};
document.addEventListener("click",function(ev){
 var chord=ev.target.closest("[data-chord]");
 if(chord){ev.preventDefault();window.SOSChordSelected=chord.getAttribute("data-chord");var old=document.querySelector(".chord-panel");if(old)old.remove();document.body.insertAdjacentHTML("beforeend",panel());return;}
 if(ev.target.closest("[data-close-chord]")){var p=document.querySelector(".chord-panel");if(p)p.remove();window.SOSChordSelected="";return;}
 var mark=ev.target.closest("[data-mark]");
 if(!mark){var active=document.querySelector(".chord-panel");if(active)active.remove();window.SOSChordSelected="";}
 if(mark){var area=document.getElementById("eb");if(!area)return;var start=area.selectionStart,end=area.selectionEnd,text=area.value,ins="\n"+mark.getAttribute("data-mark")+"\n";area.value=text.slice(0,start)+ins+text.slice(end);area.focus();area.selectionStart=area.selectionEnd=start+ins.length;return;}
});
})();