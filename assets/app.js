/* Lógica del tablero SVCA CORPONOR: lectura y validación de reportes, ICA, gráficas, informe PDF y panel de administración. */
const MW=703,MH=677;
let POS={...POS_INICIAL},ADM=false,DR=null; // fracciones (x,y) sobre la imagen; el administrador puede arrastrarlas (se recuerdan en este navegador)
try{const q=JSON.parse(localStorage.getItem('svca_pos'));if(q)POS={...POS,...q}}catch(_){}
const PAL={'Centro':'#0f2b43','Comuneros':'#1b7fc0','El Salado':'#7ab800','Punto Blanco':'#e08a00'};
const $=id=>document.getElementById(id),H=36e5,D=864e5,p2=n=>String(n).padStart(2,'0');
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MESL=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CAT=[[50,'Buena','#00b050','#fff','0–12'],[100,'Aceptable','#ffff00','#111','13–37'],[150,'Dañina a la salud de grupos sensibles','#ff9900','#111','38–55'],[200,'Dañina a la salud','#ff0000','#fff','56–150'],[300,'Muy dañina a la salud','#7030a0','#fff','151–250'],[500,'Peligrosa','#993300','#fff','251–500']];
const BP=[[0,12,0,50],[13,37,51,100],[38,55,101,150],[56,150,151,200],[151,250,201,300],[251,500,301,500]];
const ica=c=>{if(c==null)return null;const b=BP.find(r=>c<=r[1])||BP[5];return Math.min(500,Math.floor((b[3]-b[2])/(b[1]-b[0])*(c-b[0])+b[2]+1e-9))}; // I=(Ihi-Ilo)/(BPhi-BPlo)*(C-BPlo)+Ilo con C sin redondear; se trunca al entero (regla del boletín oficial de CORPONOR)
const cat=i=>CAT.find(k=>i<=k[0])||CAT[5];
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const at=(t,r,w)=>{if(t==null||r==null||w==null)return null;const e=r/100*6.105*Math.exp(17.27*t/(237.7+t));return t+.33*e-.7*w-4};
const fdt=t=>{const d=new Date(t);return `${p2(d.getUTCDate())}/${p2(d.getUTCMonth()+1)}/${d.getUTCFullYear()}`};
const lab=h=>{const d=new Date(h*H);return `${d.getUTCDate()} ${MES[d.getUTCMonth()]} ${p2(d.getUTCHours())}:00`};
let ROWS=new Map(),HR={},DAY={},MET={},LAST={},ST=ST0,END=0,SEL='Comuneros',CY=2026,CM=9,C1,C2,MC={},MINH=0;

function rng(s){return()=>(s=(s*16807)%2147483647)/2147483647}
function demo(){const e0=Math.floor((Date.now()-5*H)/H),s0=Date.UTC(2025,0,1)/H;
 ST0.forEach((e,k)=>{const r=rng(900+k*131),base=[9,12,14,10][k];
  for(let h=s0;h<=e0;h++){if(k===0&&h>e0-110)break;
   const hr=h%24,doy=(h/24)%365,ph=Math.sin((hr-8)/24*6.283),rain=Math.sin(h/57+k)>.93,
   w=+Math.max(.3,2.2+1.6*Math.sin((hr-10)/24*6.283)+(r()-.5)*1.4).toFixed(1),
   v=base*(1+.4*Math.sin((hr-3)/24*6.283)+.25*Math.cos((doy-60)/365*6.283)+.5*(r()-.5))*(1.45-.22*w)*(rain?.55:1)+(r()<.01?base*2:0),
   noPM=r()<.04||(k===3&&h>Date.UTC(2026,3,10)/H);
   ROWS.set(e+'|'+h,{e,h,a:noPM?null:+Math.max(2,v).toFixed(1),b:null,t:+(29+6.5*ph-(rain?3:0)+(r()-.5)*1.5).toFixed(1),r:+Math.min(98,Math.max(35,72-22*ph+(rain?15:0)+(r()-.5)*6)).toFixed(0),w,d:Math.round(((hr>=9&&hr<=18?225:45)+(r()-.5)*100+360)%360)})}})}
function pt(s){s=s.trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})/);if(m)return Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5]);
 m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T,]+(\d{1,2}):(\d{2})/);return m?Date.UTC(+m[3],m[2]-1,+m[1],+m[4],+m[5]):NaN}
function ingest(txt){let n=0;const L=txt.split(/\r?\n/).filter(l=>l.trim()),sep=L[0]&&L[0].includes(';')?';':',',num=x=>{const v=parseFloat((x||'').replace(',','.'));return isFinite(v)?v:null};
 L.forEach(l=>{const c=l.split(sep),t=pt(c[0]||''),e=(c[1]||'').trim(),R={a:num(c[2]),b:num(c[3]),t:num(c[4]),r:num(c[5]),w:num(c[6]),d:num(c[7])};
  if(!isFinite(t)||!e||(R.a==null&&R.t==null&&R.r==null&&R.w==null))return;const h=Math.floor(t/H);ROWS.set(e+'|'+h,{e,h,...R});n++});return n}
function index(){HR={};DAY={};MET={};LAST={};ST=[...ST0];END=0;MINH=1e9;
 ROWS.forEach(r=>{if(r.h>END)END=r.h;if(r.h<MINH)MINH=r.h;if(!ST.includes(r.e))ST.push(r.e);
  if(r.a!=null){(HR[r.e]=HR[r.e]||new Map()).set(r.h,r.a);const dk=Math.floor((r.h-1)/24),M=DAY[r.e]=DAY[r.e]||new Map(),d=M.get(dk)||{s:0,n:0};d.s+=r.a;d.n++;M.set(dk,d);if(!(LAST[r.e]>=r.h))LAST[r.e]=r.h}
  if(r.t!=null||r.r!=null||r.w!=null)(MET[r.e]=MET[r.e]||new Map()).set(r.h,r)});
 for(const e in DAY)for(const dk of [...DAY[e].keys()])if((dk+1)*24>END)DAY[e].delete(dk); // un día solo se evalúa cuando ya cerró (24:00)
 if(!ST.includes(SEL))SEL=ST[0]}
function mm(e,h){const m=HR[e];if(!m)return null;let s=0,n=0;for(let i=h-23;i<=h;i++){const v=m.get(i);if(v!=null){s+=v;n++}}return n>=18?s/n:null}
const dayV=(e,dk)=>{const d=DAY[e]&&DAY[e].get(dk);return d&&d.n>=18?d.s/d.n:null};
function now(e){const l=LAST[e],on=l!=null&&END-l<=6,m=on?mm(e,l):null,i=ica(m);return{l,on,m,i,c:i!=null?cat(i):null}}
function metNow(e){const M=MET[e];if(!M)return null;for(let h=END;h>END-4;h--)if(M.has(h))return M.get(h);return null}

function cards(){$('cards').innerHTML=ST.map(e=>{const n=now(e),w=metNow(e),s=w&&at(w.t,w.r,w.w);
 return `<div class="sc"><h3>Estación ${e}</h3><div class="st ${n.on?'on':'off'}">${n.on?'● En línea':'● Sin transmisión de PM2.5'+(n.l!=null?' desde '+fdt(n.l*H):'')}</div>
 <div class="kv">Concentración (µg/m³)<b>${n.on?HR[e].get(n.l).toFixed(1):'—'}</b></div>
 <div class="kv">Media móvil (µg/m³)<b>${n.m!=null?n.m.toFixed(1):'—'}</b></div>
 <div class="kv">ICA<span class="ica" style="background:${n.c?n.c[2]:'#e6edf2'};color:${n.c?n.c[3]:'#555'}">${n.i!=null?n.i:'—'}</span></div>
 <div class="mut">${n.c?n.c[1]:'Sin dato válido'}</div>
 ${w?`<div class="mut" style="margin-top:6px;border-top:1px solid var(--line);padding-top:6px">${w.t!=null?w.t.toFixed(1)+' °C':''} ${w.r!=null?'· HR '+w.r+' %':''} ${w.w!=null?'· '+w.w+' m/s':''} ${s!=null?'· Sensación '+s.toFixed(1)+' °C':''}</div>`:''}</div>`}).join('');
 $('cut').textContent=`${fdt(END*H)} ${p2(END%24)}:00 h`;
 $('tabs').innerHTML=ST.map(e=>`<button data-e="${e}" class="${e===SEL?'sel':''}">${e}</button>`).join('')}
function map(){let g='';ST.forEach(e=>{if(!POS[e])POS[e]=[.5,.5];const n=now(e),x=POS[e][0]*MW,y=POS[e][1]*MH;
  g+=`<g data-e="${e}"><circle cx="${x}" cy="${y}" r="23" fill="${n.c?n.c[2]:'#b0bcc6'}" stroke="${e===SEL?'#0f2b43':'#fff'}" stroke-width="${e===SEL?5:3.5}"/><text x="${x}" y="${y+6}" text-anchor="middle" font-size="13.5" font-weight="800" fill="${n.c?n.c[3]:'#fff'}">${n.on?HR[e].get(n.l).toFixed(1):'—'}</text>
  <rect x="${x-44}" y="${y+25}" width="88" height="19" rx="9.5" fill="#0f2b43"/><text x="${x}" y="${y+38.5}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">${e}</text>${n.on?`<text x="${x}" y="${y+58}" text-anchor="middle" font-size="11" font-weight="700" fill="#0f2b43" stroke="#fff" stroke-width="3" paint-order="stroke">ICA ${n.i!=null?n.i:'—'}</text>`:`<text x="${x}" y="${y+58}" text-anchor="middle" font-size="11" font-weight="700" fill="#c62828" stroke="#fff" stroke-width="3" paint-order="stroke">Sin transmisión</text>`}</g>`});
 $('mk').innerHTML=g;$('pos').value=JSON.stringify(POS)}
const bands={id:'bands',beforeDatasetsDraw(c){const{ctx,chartArea:a,scales:{y}}=c;
 [[0,12,'#00b050'],[12,37,'#ffff00'],[37,55,'#ff9900'],[55,150,'#ff0000'],[150,250,'#7030a0'],[250,500,'#993300']].forEach(([l,h,col])=>{if(l>=y.max)return;
  const y1=y.getPixelForValue(Math.min(h,y.max)),y0=y.getPixelForValue(l);ctx.save();ctx.globalAlpha=.3;ctx.fillStyle=col;ctx.fillRect(a.left,y1,a.right-a.left,y0-y1);ctx.restore()})}};
function chart(){const e=SEL,n=+$('rg').value,bar=$('bar').classList.contains('sel'),end=LAST[e]!=null?LAST[e]:END,hs=Array.from({length:n},(_,k)=>end-n+1+k);
 const hv=hs.map(h=>HR[e]&&HR[e].has(h)?HR[e].get(h):null),mv=hs.map(h=>{const v=mm(e,h);return v==null?null:+v.toFixed(1)}),ok=mv.filter(v=>v!=null);
 const mx=Math.max(45,...hv.filter(v=>v!=null),...ok);C1&&C1.destroy();
 const ds=[{label:'Media móvil 24 h',data:mv,type:bar?'bar':'line',borderColor:'#0f2b43',backgroundColor:bar?mv.map(v=>v==null?'#ccc':cat(ica(v))[2]):'#0f2b43',borderWidth:bar?1:3,borderRadius:2,pointRadius:0,tension:0}];
 if(!bar)ds.push({label:'Concentración horaria',data:hv,borderColor:'#1b7fc0',borderWidth:1,pointRadius:0,tension:0});
 C1=new Chart($('c1'),{type:bar?'bar':'line',plugins:[bands],data:{labels:hs.map(lab),datasets:ds},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{boxWidth:12}}},
  scales:{x:{ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:8},grid:{display:false}},y:{min:0,max:Math.ceil(mx*1.15/5)*5,title:{display:true,text:'PM2.5 (µg/m³)'}}}}});
 const nw=now(e);$('cinfo').textContent=LAST[e]==null?'Esta estación no tiene datos de PM2.5 cargados.':(nw.on?'':'Estación sin transmisión · ')+'Último dato: '+lab(LAST[e]);
 const bd=(t,v,h)=>{const c=cat(ica(v));return `<div class="b"><span class="n" style="background:${c[2]};color:${c[3]}">${ica(v)}</span><span><small><b>${t}</b> · ${v} µg/m³</small><small>${lab(h)}</small></span></div>`};
 if(ok.length){const mn=Math.min(...ok),mxv=Math.max(...ok);$('bg').innerHTML=bd('↓ Mín.',mn,hs[mv.indexOf(mn)])+bd('↑ Máx.',mxv,hs[mv.indexOf(mxv)])}else $('bg').innerHTML='';
 $('strip').innerHTML=ok.length?`Horas con media móvil sobre la recomendación diaria de la OMS (15 µg/m³): <b>${ok.filter(v=>v>15).length}/${ok.length}</b> · sobre la norma colombiana (37 µg/m³): <b>${ok.filter(v=>v>37).length}/${ok.length}</b>`:'';
 document.querySelectorAll('.sn').forEach(x=>x.textContent=e)}
function cal(){const e=SEL,first=Date.UTC(CY,CM,1),dim=new Date(Date.UTC(CY,CM+1,0)).getUTCDate(),off=(new Date(first).getUTCDay()+6)%7;
 let h=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(x=>`<i>${x}</i>`).join('')+'<span></span>'.repeat(off);
 for(let d=1;d<=dim;d++){const v=ica(dayV(e,Math.floor((first+(d-1)*D)/D))),c=v!=null?cat(v):null;
  h+=`<div class="d" style="${c?`background:${c[2]};color:${c[3]}`:''}"><small>${d}</small><b>${v!=null?v:''}</b></div>`}
 $('cal').innerHTML=h;$('cmt').textContent=MESL[CM]+' '+CY}

function trends(){const e=SEL;C2&&C2.destroy();const dys=[];
 if(DAY[e])for(const[dk,d] of DAY[e]){if(d.n<18)continue;const t=new Date(dk*D);dys.push({y:t.getUTCFullYear(),m:t.getUTCMonth(),d:t.getUTCDate(),i:ica(d.s/d.n)})}
 if(!dys.length){$('c2w').style.height='60px';$('side').innerHTML='<div class="mut">Sin datos suficientes.</div>';return}
 const G={},Y={};dys.forEach(o=>{(G[o.y*12+o.m]=G[o.y*12+o.m]||[]).push(o);(Y[o.y]=Y[o.y]||[]).push(o)});
 const R=Object.keys(G).map(Number).sort((a,b)=>a-b).map(k=>{const y=Math.floor(k/12),m=k%12,dim=new Date(Date.UTC(y,m+1,0)).getUTCDate();return{y,m,n:G[k].length,dim,v:Math.round(mean(G[k].map(o=>o.i))),par:G[k].length<.75*dim}});
 const LG=R.length>24;$('c2w').style.height=LG?'380px':(R.length*16+50)+'px';
 C2=new Chart($('c2'),{type:'bar',data:{labels:R.map(r=>MES[r.m]+' '+String(r.y).slice(2)+(r.par?'*':'')),datasets:[{data:R.map(r=>r.v),borderRadius:3,backgroundColor:R.map(r=>cat(r.v)[2])}]},
  options:{indexAxis:LG?'x':'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>{const r=R[c.dataIndex];return `ICA promedio ${r.v} · ${cat(r.v)[1]} · ${r.n} de ${r.dim} días con dato`}}}},scales:LG?{x:{ticks:{font:{size:9},maxTicksLimit:16,maxRotation:0},grid:{display:false}},y:{beginAtZero:true,title:{display:true,text:'ICA promedio de los días del mes'}}}:{x:{beginAtZero:true,title:{display:true,text:'ICA promedio de los días del mes'}},y:{ticks:{font:{size:9}},grid:{display:false}}}}});
 const yrs=Object.keys(Y).map(Number).sort((a,b)=>a-b),key=o=>o.m*100+o.d,avg=y=>mean(Y[y].map(o=>o.i));
 const rows=yrs.map((y,k)=>{const a=Math.round(avg(y));let tx=`${Y[y].length} días con dato`;
  if(k){const pv=new Map(Y[yrs[k-1]].map(o=>[key(o),o.i])),P=Y[y].filter(o=>pv.has(key(o)));
   if(P.length>=60){const dd=Math.round(mean(P.map(o=>o.i))-mean(P.map(o=>pv.get(key(o)))));tx=`<span class="${dd>0?'up':dd<0?'dn':''}">${dd>0?'▲ Empeoró '+dd+' pts':dd<0?'▼ Mejoró '+(-dd)+' pts':'Sin cambio'}</span> vs mismo periodo de ${yrs[k-1]} (${P.length} días)`}}
  return `<div class="yr"><b>${y}</b><div class="bar" style="width:${Math.max(4,a/Math.max(...yrs.map(q=>avg(q)))*70)}px;background:${cat(a)[2]}"></div><span class="v">${a}</span><span class="cg">${tx}</span></div>`}).join('');
 const ok=R.filter(r=>!r.par),chip=r=>`<span class="n" style="background:${cat(r.v)[2]};color:${cat(r.v)[3]}">${r.v}</span>`;let mm2='';
 if(ok.length>1){const hi=ok.reduce((p,c)=>c.v>p.v?c:p),lo=ok.reduce((p,c)=>c.v<p.v?c:p);mm2=`<h3>Meses más y menos contaminados</h3><div class="box"><div class="rw"><span><small class="up">Más contaminado</small><br><b>${MESL[hi.m]} ${hi.y}</b></span>${chip(hi)}</div><div class="rw"><span><small class="dn">Menos contaminado</small><br><b>${MESL[lo.m]} ${lo.y}</b></span>${chip(lo)}</div></div>`}
 $('side').innerHTML=`<h3>ICA promedio por año</h3><div class="box">${rows}<div class="mut">Promedio de los ICA diarios del año. La comparación usa solo los mismos días del calendario con dato en ambos años.</div></div>${mm2}`}
function heat(){const e=SEL,y=+$('yr').value;let h='<span></span>'+Array.from({length:31},(_,i)=>`<i>${i+1}</i>`).join('');
 for(let m=0;m<12;m++){h+=`<b>${MES[m]}</b>`;const dim=new Date(Date.UTC(y,m+1,0)).getUTCDate();
  for(let d=1;d<=31;d++){if(d>dim){h+='<span></span>';continue}const v=ica(dayV(e,Math.floor(Date.UTC(y,m,d)/D))),c=v!=null?cat(v):null;
   h+=`<span class="c" style="${c?'background:'+c[2]:''}" title="${d} ${MES[m]} ${y}: ${v!=null?'ICA '+v+' · '+c[1]:'sin dato válido'}"></span>`}}
 $('hm').innerHTML=h}
function dist(){const y=+$('yr').value;$('dist').innerHTML=ST.map(e=>{const cnt=CAT.map(()=>0);let tot=0;
 if(DAY[e])for(const dk of DAY[e].keys()){if(new Date(dk*D).getUTCFullYear()!==y)continue;const v=ica(dayV(e,dk));if(v==null)continue;cnt[CAT.indexOf(cat(v))]++;tot++}
 return `<div class="db"><span>${e}</span><div class="bar">${tot?cnt.map((n,i)=>n?`<span style="width:${n/tot*100}%;background:${CAT[i][2]};color:${CAT[i][3]}" title="${CAT[i][1]}: ${n} días">${n/tot>.07?Math.round(n/tot*100)+'%':''}</span>`:'').join(''):'<em class="mut" style="padding:4px 8px">Sin datos</em>'}</div><span class="nd">${tot} días válidos</span></div>`}).join('')}
const VARS=[['Temperatura (°C)',w=>w.t],['Sensación térmica (°C)',w=>at(w.t,w.r,w.w)],['Humedad relativa (%)',w=>w.r],['Velocidad del viento (m/s)',w=>w.w]];
const DIRS=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
const fx=(x,d=1)=>x==null?'—':x.toFixed(d).replace('.',',');
const sdv=a=>{const m=mean(a);return Math.sqrt(a.reduce((q,x)=>q+(x-m)**2,0)/(a.length-1))};
const qt=(s,p)=>{const i=(s.length-1)*p,l=Math.floor(i);return s[l]+(s[Math.min(l+1,s.length-1)]-s[l])*(i-l)};
const per=()=>{const n=+$('sp').value;return[n?END-n+1:MINH,END]};
function mrows(e){const[h0,h1]=per(),o=[];if(MET[e])for(const[h,w] of MET[e])if(h>=h0&&h<=h1)o.push([h,w]);return o}

function rk(a){const ix=a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]),r=Array(a.length);for(let i=0;i<ix.length;){let j=i;while(j+1<ix.length&&ix[j+1][0]===ix[i][0])j++;const m=(i+j)/2+1;for(let k=i;k<=j;k++)r[ix[k][1]]=m;i=j+1}return r}
function pear(x,y){const mx=mean(x),my=mean(y);let a=0,b=0,c=0;x.forEach((v,i)=>{a+=(v-mx)*(y[i]-my);b+=(v-mx)**2;c+=(y[i]-my)**2});return a/Math.sqrt(b*c)}

function lerp(st,t){const n=st.length-1,x=Math.min(1,Math.max(0,t))*n,i=Math.min(n-1,Math.floor(x)),f=x-i,A=st[i],B=st[i+1],c=k=>Math.round(parseInt(A.slice(k,k+2),16)*(1-f)+parseInt(B.slice(k,k+2),16)*f);return `rgb(${c(1)},${c(3)},${c(5)})`}

function rose(e){const R=mrows(e).filter(([h,w])=>w.w!=null&&w.d!=null),N=R.length,CL=[2,4,6,99],CC=['#bfe3f5','#6cb7e0','#1b7fc0','#0f2b43'],NM=['0,5–2','2–4','4–6','≥ 6'];
 if(N<24){$('rose').innerHTML='<div class="mut" style="text-align:left">Aún no hay datos de dirección del viento cargados para esta estación. Al cargar el reporte que incluya la dirección (grados), la rosa se dibuja automáticamente.</div>';return}
 const S=Array.from({length:16},()=>[0,0,0,0]);let calm=0;
 R.forEach(([h,w])=>{if(w.w<.5){calm++;return}S[Math.round(w.d/22.5)%16][CL.findIndex(x=>w.w<x)]++});
 const mx=Math.max(...S.map(c=>c[0]+c[1]+c[2]+c[3]))/N*100,Rr=110,cx=150,cy=150,sc=f=>Rr*f/(mx*1.1),P=(r,a)=>[cx+r*Math.sin(a*Math.PI/180),cy-r*Math.cos(a*Math.PI/180)].map(v=>v.toFixed(1));
 let g='<svg viewBox="0 0 300 300" style="width:100%;max-width:340px">';
 [.25,.5,.75,1].forEach(q=>{const r=Rr*q/1.1;g+=`<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="#d9e4ec"/><text x="${cx+3}" y="${(cy-r+9).toFixed(1)}" font-size="8" fill="#5b7184">${(mx*q).toFixed(0)}%</text>`});
 S.forEach((c,i)=>{let acc=0;c.forEach((n,k)=>{if(!n)return;const r0=sc(acc/N*100);acc+=n;const r1=sc(acc/N*100),[x0,y0]=P(r1,i*22.5-9),[x1,y1]=P(r1,i*22.5+9),[x2,y2]=P(r0,i*22.5+9),[x3,y3]=P(r0,i*22.5-9);
  g+=`<path d="M${x0} ${y0}A${r1.toFixed(1)} ${r1.toFixed(1)} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r0.toFixed(1)} ${r0.toFixed(1)} 0 0 0 ${x3} ${y3}Z" fill="${CC[k]}" stroke="#fff" stroke-width=".5"><title>${DIRS[i]}: ${(n/N*100).toFixed(1)} % (${NM[k]} m/s)</title></path>`})});
 [0,2,4,6,8,10,12,14].forEach(i=>{const[x,y]=P(Rr+16,i*22.5);g+=`<text x="${x}" y="${+y+4}" text-anchor="middle" font-size="11" font-weight="700" fill="#0f2b43">${DIRS[i]}</text>`});
 $('rose').innerHTML=g+'</svg><div>'+CC.map((c,i)=>`<span class="lg"><i style="background:${c}"></i>${NM[i]} m/s</span>`).join('')+`</div><div class="mut">Dirección de donde sopla el viento · calmas (< 0,5 m/s): <b>${(calm/N*100).toFixed(1).replace('.',',')} %</b> · n = ${N} horas. La dirección se resume por frecuencias, no por promedio aritmético de ángulos.</div>`}

async function informe(o){
 if(!window.jspdf){$('info').textContent='No se pudo cargar el generador de PDF (se necesita conexión a internet la primera vez).';return}
 const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),C=o.corte,Dc=new Date(C*H),NAVY='#0f2b43',VERDE='#8dc63f',AZUL='#1b7fc0',GR='#5b7184',
 LT=['#c9edd8','#fffbbd','#ffe2b8','#ffc6c6','#e4d3f1','#e3cbbd'],RG=['0 - 50','51 - 100','101 - 150','151 - 200','201 - 300','301 - 500'],COLN=['Verde','Amarillo','Naranja','Rojo','Púrpura','Marrón'],
 MSG=['La calidad del aire es satisfactoria; la contaminación presenta poco o ningún riesgo.','Calidad aceptable. Personas extremadamente sensibles podrían presentar síntomas respiratorios.','Niños, adultos mayores y personas con enfermedades respiratorias o cardiacas pueden sentir efectos; deben reducir el esfuerzo prolongado al aire libre.','Toda la población puede empezar a sentir efectos; los grupos sensibles pueden presentarlos más graves.','Estado de alerta: todos pueden experimentar efectos más graves para la salud.','Advertencia sanitaria: toda la población puede presentar efectos adversos graves; evite la actividad al aire libre.'],
 PAL={'Centro':'#e8590c','Comuneros':'#1b7fc0','El Salado':'#2f9e44','Punto Blanco':'#7b4fa3','Unidad Móvil':'#0f2b43'},
 fecha=`${Dc.getUTCDate()} de ${MESL[Dc.getUTCMonth()].toLowerCase()} de ${Dc.getUTCFullYear()}`,hora=`${p2(Dc.getUTCHours())}:${p2(Dc.getUTCMinutes())}`,YR=Dc.getUTCFullYear(),
 rect=(x,y,w,h,c)=>{doc.setFillColor(c);doc.rect(x,y,w,h,'F')},rr=(x,y,w,h,r,c)=>{doc.setFillColor(c);doc.roundedRect(x,y,w,h,r,r,'F')},
 box=(x,y,w,h,c,lw=.25)=>{doc.setDrawColor(c);doc.setLineWidth(lw);doc.rect(x,y,w,h,'S')},ln=(a,b,c2,d,c,lw=.2)=>{doc.setDrawColor(c);doc.setLineWidth(lw);doc.line(a,b,c2,d)},
 tx=(t,x,y,q={})=>{doc.setFontSize(q.s||9);doc.setFont('helvetica',q.b?'bold':'normal');doc.setTextColor(q.c||NAVY);doc.text(String(t),x,y,{align:q.a||'left'})},
 par=(t,x,y,w,q={})=>{const s=q.s||8.5;doc.setFontSize(s);doc.setFont('helvetica',q.b?'bold':'normal');doc.setTextColor(q.c||NAVY);const L=doc.splitTextToSize(String(t),w);doc.text(L,x,y,{lineHeightFactor:1.25});return y+L.length*s*.3528*1.25},
 hdr=()=>{rect(0,0,210,14,NAVY);rect(0,14,210,1.2,VERDE);tx('Corponor',14,9.6,{s:14,b:1,c:VERDE});tx('Calidad del Aire · Boletín N° '+o.num,196,9.6,{s:9,b:1,c:'#9ccbe8',a:'right'})},
 sec=(n,t,y)=>{rect(14,y,182,8,NAVY);rect(14,y,3,8,VERDE);tx(n+'   '+t,20,y+5.6,{s:10,b:1,c:'#fff'})},
 np=()=>{doc.addPage();hdr()},f1=v=>v==null?'-':v.toFixed(1).replace('.',','),dmy=h=>{const d=new Date(h*H);return `${p2(d.getUTCDate())}/${p2(d.getUTCMonth()+1)}/${d.getUTCFullYear()} ${p2(d.getUTCHours())}:00`},
 dayC=(e,dk)=>(dk+1)*24>C?null:dayV(e,dk);
 // ---- estado de cada estación en el corte
 const ES=ST.filter(e=>HR[e]).map(e=>{let l=null;for(let h=C;h>C-6;h--)if(HR[e].has(h)){l=h;break}let last=l;if(last==null){last=-1;for(const h of HR[e].keys())if(h<=C&&h>last)last=h;if(last<0)last=null}
  const m=l!=null?mm(e,l):null,i=ica(m);return{e,on:l!=null,l,last,v:l!=null?HR[e].get(l):null,m,i,c:i!=null?cat(i):null}});
 // ---- 1. PORTADA
 rect(0,0,210,297,NAVY);rect(0,0,210,6,VERDE);tx('Corponor',22,46,{s:34,b:1,c:VERDE});tx('Calidad del Aire',22,58,{s:17,b:1,c:'#9ccbe8'});
 tx('Boletín del Estado de la',22,128,{s:30,b:1,c:VERDE});tx('Calidad del Aire',22,142,{s:30,b:1,c:VERDE});tx('N° '+o.num,22,162,{s:34,b:1,c:VERDE});
 tx('San José de Cúcuta',22,186,{s:20,b:1,c:'#fff'});tx(fecha,22,196,{s:14,c:'#fff'});tx('Hora de corte: '+hora+' h',22,205,{s:14,c:'#fff'});
 tx('Estado en el momento del corte (ICA con la media móvil de 24 h de PM2.5)',22,226,{s:9,c:'#9ccbe8'});
 ES.forEach((s,k)=>{const x=22+k*35.6;rr(x,231,33,26,3,s.c?s.c[2]:'#b0bcc6');tx(s.e,x+16.5,238,{s:8,b:1,c:s.c?s.c[3]:'#fff',a:'center'});tx(s.i!=null?s.i:'-',x+16.5,248.5,{s:17,b:1,c:s.c?s.c[3]:'#fff',a:'center'});tx(s.c?s.c[1].replace('Dañina a la salud de grupos sensibles','Dañina grupos sens.'):'Sin dato',x+16.5,254.5,{s:5.6,c:s.c?s.c[3]:'#fff',a:'center'})});
 tx('Sistema de Vigilancia de la Calidad del Aire (SVCA) · Resolución 2254 de 2017',22,280,{s:8,c:'#9ccbe8'});
 // ---- 2. ESTADO EN EL CORTE
 np();sec('1.','Estado de la calidad del aire en el corte',22);
 let y=par('En atención a lo establecido en los artículos 18 al 21 de la Resolución 2254 de 2017, el Índice de Calidad del Aire (ICA) reporta el estado de la calidad del aire mediante un código de colores asociado a posibles efectos en la salud. Para el PM2.5 se calcula con la concentración diaria (promedio de 24 horas) y los puntos de corte de la Tabla 6 de la resolución. Un valor horario elevado no configura por sí mismo un episodio de contaminación: este se determina con la media móvil y su ICA (artículos 9 al 13).',14,34,182,{s:8.3});
 y+=3;ES.forEach((s,k)=>{const cy=y+k*37,col=s.c?s.c[2]:'#b0bcc6';rect(14,cy,96,34,'#f4f8fb');rect(14,cy,3.2,34,col);tx(s.e,20,cy+6,{s:10,b:1});
  tx(s.on?'En línea':'Sin transmisión',20,cy+10.5,{s:7,b:1,c:s.on?'#2f9e44':'#c62828'});if(!s.on)tx(s.last!=null?'último dato: '+dmy(s.last):'sin datos',44,cy+10.5,{s:7,c:'#c62828'});
  rr(92,cy+3,16,13,2,col);tx(s.i!=null?s.i:'-',100,cy+11.4,{s:13,b:1,c:s.c?s.c[3]:'#fff',a:'center'});tx('ICA',100,cy+15,{s:5.5,c:s.c?s.c[3]:'#fff',a:'center'});
  tx('Concentración horaria: '+(s.on?f1(s.v)+' µg/m3':'-'),20,cy+16,{s:7.5});tx('Media móvil 24 h: '+(s.m!=null?f1(s.m)+' µg/m3':'-'),20,cy+20.5,{s:7.5});
  tx(s.c?s.c[1]:'Sin dato válido',20,cy+25,{s:7.5,b:1,c:s.c?(s.c[2]==='#ffff00'?'#8a6d00':s.c[2]):'#c62828'});
  par(s.c?MSG[CAT.indexOf(s.c)]:'No hay datos suficientes (mínimo 18 de 24 horas) para calcular el ICA.',20,cy+28.2,88,{s:6,c:GR})});
 // mapa
 const img=document.querySelector('#map image'),mw=84,mh=mw*677/703,mx0=114;
 if(img)try{doc.addImage(img.getAttribute('href'),'JPEG',mx0,y,mw,mh)}catch(_){}
 box(mx0,y,mw,mh,'#c5d3de');ES.forEach(s=>{const p=POS[s.e]||[.5,.5],X=mx0+p[0]*mw,Y=y+p[1]*mh;doc.setFillColor(s.c?s.c[2]:'#b0bcc6');doc.setDrawColor('#ffffff');doc.setLineWidth(.6);doc.circle(X,Y,4,'FD');tx(s.i!=null?s.i:'-',X,Y+1.3,{s:6.5,b:1,c:s.c?s.c[3]:'#fff',a:'center'});rr(X-9,Y+4.6,18,3.8,1.9,NAVY);tx(s.e,X,Y+7.4,{s:5,b:1,c:'#fff',a:'center'})});
 tx('Ubicación de las estaciones (aproximada) e ICA en el corte',mx0,y+mh+4,{s:6.5,c:GR});
 let ly=y+mh+10;tx('Categorías del ICA (Res. 2254/2017)',mx0,ly,{s:8,b:1});CAT.forEach((c,i)=>{rect(mx0,ly+2+i*6.2,6,5,c[2]);tx(RG[i]+'  '+c[1],mx0+8,ly+5.8+i*6.2,{s:6.5})});
 y=y+37*ES.length+2;const off=ES.filter(s=>!s.on);if(off.length){tx('Observaciones',14,y+4,{b:1,s:9});let oy=y+9;off.forEach(s=>{oy=par(`La estación ${s.e} no reporta datos de PM2.5 `+(s.last!=null?'desde el '+dmy(s.last)+'.':'en el periodo consultado.'),14,oy,182,{s:7.8})+1})}
 // ---- 3-4. MEDIA MÓVIL 72 h
 const nice=(a,b)=>{const st=[.5,1,2,5,10,20,50,100].find(s=>(b-a)/s<=5)||200;return[Math.floor(a/st)*st,Math.ceil(b/st)*st,st]};
 const dayTicks=(x,y,w,h,hs)=>{hs.forEach((t,k)=>{if(t%24===0){const X=x+k/(hs.length-1)*w,d=new Date(t*H);doc.setDrawColor('#8d9db0');doc.setLineWidth(.15);doc.setLineDashPattern([.8,.8],0);doc.line(X,y,X,y+h);doc.setLineDashPattern([],0);tx(`${d.getUTCDate()}/${d.getUTCMonth()+1}`,X,y+h+4,{s:6,a:'center',c:GR})}})};
 const bandChart=(x,y,w,h,e)=>{const n=72,hs=Array.from({length:n},(_,k)=>C-n+1+k),mv=hs.map(t=>mm(e,t)),hv=hs.map(t=>HR[e].has(t)?HR[e].get(t):null),al=[...mv,...hv].filter(v=>v!=null);
  const mx=Math.max(45,Math.ceil(Math.max(0,...al)*1.12/10)*10),Y=v=>y+h-Math.min(v,mx)/mx*h,X=k=>x+k/(n-1)*w;
  [[0,12],[12,37],[37,55],[55,150],[150,250],[250,500]].forEach(([a,b],i)=>{if(a<mx)rect(x,Y(Math.min(b,mx)),w,Y(a)-Y(Math.min(b,mx)),LT[i])});
  const st=mx<=60?10:mx<=120?20:50;for(let v=0;v<=mx;v+=st){ln(x,Y(v),x+w,Y(v),'#ffffff',.2);tx(v,x-1.5,Y(v)+1,{s:6,a:'right',c:GR})}
  [[12,12],[37,37],[55,55],[150,150]].forEach(([l,p])=>{if(p<mx)tx(l,x+w+1.2,Y(p)+1,{s:5.8,b:1,c:GR})});dayTicks(x,y,w,h,hs);
  const dr=(arr,c,lw)=>{doc.setDrawColor(c);doc.setLineWidth(lw);let pr=null;arr.forEach((v,k)=>{if(v==null){pr=null;return}if(pr)doc.line(pr[0],pr[1],X(k),Y(v));pr=[X(k),Y(v)]})};dr(hv,AZUL,.2);dr(mv,NAVY,.7);box(x,y,w,h,'#9fb1c2',.25);
  const ok=mv.map((v,k)=>[v,k]).filter(q=>q[0]!=null);if(!ok.length){tx('Sin datos en las últimas 72 horas',x+w/2,y+h/2,{s:9,b:1,c:'#c62828',a:'center'});return}
  const m=ok.reduce((p,c)=>c[0]>p[0]?c:p);doc.setFillColor('#c62828');doc.circle(X(m[1]),Y(m[0]),.9,'F');tx('máx. '+f1(m[0])+' µg/m3 · '+dmy(hs[m[1]]),Math.min(X(m[1]),x+w-34),Y(m[0])-2,{s:6,b:1,c:'#c62828'})};
 const blk=(e,y0)=>{const s=ES.find(q=>q.e===e);rect(14,y0,182,7,'#e9f0f6');tx('Estación '+e,17,y0+4.9,{s:9,b:1});tx(s.on?'En línea':'Sin transmisión (último dato '+(s.last!=null?dmy(s.last):'-')+')',193,y0+4.9,{s:7,b:1,c:s.on?'#2f9e44':'#c62828',a:'right'});bandChart(24,y0+10,160,52,e);
  rect(24,y0+66.5,3,1.2,NAVY);tx('Media móvil 24 h',28,y0+67.4,{s:6.2});rect(52,y0+66.5,3,.5,AZUL);tx('Concentración horaria',56,y0+67.4,{s:6.2})};
 np();sec('2.','Comportamiento de la media móvil de PM2.5 (µg/m3) · últimas 72 horas',22);ES.slice(0,3).forEach((s,k)=>blk(s.e,32+k*74));
 tx('Eje vertical: µg/m3. Los números a la derecha son los límites superiores de cada categoría del ICA (12, 37, 55 y 150 µg/m3).',14,256,{s:6.8,c:GR});
 if(ES.length>3){np();ES.slice(3).forEach((s,k)=>blk(s.e,22+k*74));
  const gy=22+(ES.length-3)*74+4;rect(14,gy,182,36,'#f4f8fb');tx('Cómo leer estas gráficas',18,gy+6,{s:9,b:1});
  par('La línea azul delgada es la concentración promedio de cada hora. La línea oscura es la media móvil de 24 horas: en cada hora se promedian las 24 horas que terminan en ella (se exigen al menos 18 datos válidos, 75 %). Los colores de fondo son las categorías del ICA según la Resolución 2254 de 2017: verde (buena, hasta 12 µg/m3), amarillo (aceptable, 13 a 37), naranja (dañina de grupos sensibles, 38 a 55), rojo (dañina, 56 a 150) y púrpura (muy dañina, 151 a 250). Un pico horario aislado no implica una emergencia; lo que determina el estado es la media móvil.',18,gy+11,174,{s:7.6})}
 // ---- 5. ICA DIARIO DEL MES
 np();const CM2=Dc.getUTCMonth(),first=Date.UTC(YR,CM2,1),dim=new Date(Date.UTC(YR,CM2+1,0)).getUTCDate(),offs=(new Date(first).getUTCDay()+6)%7;
 sec('3.','ICA diario · '+MESL[CM2]+' '+YR+' (promedio de 24 horas)',22);
 const cal=(x,y,e)=>{rect(x,y,88,6.5,NAVY);tx('Estación '+e,x+44,y+4.6,{s:8.5,b:1,c:'#fff',a:'center'});['L','M','M','J','V','S','D'].forEach((l,j)=>tx(l,x+6.3+j*12.5,y+10.5,{s:6.5,a:'center',c:GR}));
  for(let q=1;q<=dim;q++){const pos=offs+q-1,X=x+(pos%7)*12.5,Y=y+12.5+Math.floor(pos/7)*8.2,v=ica(dayC(e,Math.floor((first+(q-1)*D)/D))),c=v!=null?cat(v):null;if(c){rect(X+.3,Y,11.9,7.4,c[2]);tx(v,X+6.3,Y+5,{s:7.5,b:1,c:c[3],a:'center'})}else{box(X+.3,Y,11.9,7.4,'#e2e8ee',.15);tx(q,X+6.3,Y+5,{s:6.5,c:'#9aa8b5',a:'center'})}}};
 ES.forEach((s,k)=>cal(14+(k%2)*94,34+Math.floor(k/2)*68,s.e));
 // resumen mensual (6.ª casilla)
 {const x=14+(ES.length%2)*94,y0=34+Math.floor(ES.length/2)*68;if(ES.length<6){rect(x,y0,88,6.5,NAVY);tx('Resumen del mes (días con ICA)',x+44,y0+4.6,{s:8.5,b:1,c:'#fff',a:'center'});
  ['Estación','Días','Buena','Acept.','D.G.S.','Prom.'].forEach((t,j)=>tx(t,[x+2,x+32,x+43,x+54,x+66,x+80][j],y0+11,{s:6.3,b:1,c:GR}));
  ES.forEach((s,k)=>{const V=[];for(let q=1;q<=dim;q++){const v=ica(dayC(s.e,Math.floor((first+(q-1)*D)/D)));if(v!=null)V.push(v)}const cn=a=>V.filter(a).length,yy=y0+16+k*5.2;if(k%2==0)rect(x,yy-3.6,88,5.2,'#f4f8fb');
   [s.e,V.length,cn(v=>v<=50),cn(v=>v>50&&v<=100),cn(v=>v>100),V.length?Math.round(mean(V)):'-'].forEach((t,j)=>tx(t,[x+2,x+32,x+43,x+54,x+66,x+80][j],yy,{s:6.8,b:j===0}))});
  par('D.G.S.: dañina a la salud de grupos sensibles o peor. Los días sin color no tienen ICA (día aún no cerrado o menos de 18 horas válidas).',x+2,y0+16+ES.length*5.2+2,84,{s:5.8,c:GR})}}
 CAT.forEach((c,i)=>{rect(14+i*31,243,5,5,c[2]);tx(COLN[i]+' '+RG[i],20+i*31,246.8,{s:6})});
 par('Cada casilla muestra el ICA del día (promedio de 24 horas de PM2.5, con al menos 18 datos horarios válidos). Un día se evalúa solo cuando ya cerró.',14,254,182,{s:7.5,c:GR});
 // ---- 6. ICA ACUMULADO DEL AÑO
 np();sec('4.','ICA acumulado '+YR+' y cumplimiento de la norma',22);
 const k0=Math.floor(Date.UTC(YR,0,1)/D),kmax=Math.floor(C/24)-1,trans=kmax-k0+1;
 const AC=ES.map(s=>{const V=[],Cc=[],M={};if(DAY[s.e])for(const[dk,d] of DAY[s.e]){if(d.n<18||dk<k0||dk>kmax)continue;const c=d.s/d.n,i=ica(c);V.push(i);Cc.push(c);const m=new Date(dk*D).getUTCMonth();(M[m]=M[m]||[]).push(i)}return{e:s.e,V,Cc,M}});
 tx('Distribución de los días según la categoría del ICA',14,34,{s:9,b:1});
 AC.forEach((a,k)=>{const yy=40+k*13,n=a.V.length;tx(a.e,14,yy+5,{s:8,b:1});const cn=[0,1,2,3,4,5].map(i=>a.V.filter(v=>cat(v)===CAT[i]).length);let X=44;
  if(!n)tx('Sin datos válidos en el año',X,yy+5,{s:7.5,c:'#c62828'});else{cn.forEach((c,i)=>{const w=c/n*110;if(w>0){rect(X,yy,w,8,CAT[i][2]);if(w>11)tx(f1(c/n*100)+' %',X+w/2,yy+5.2,{s:6.3,b:1,c:CAT[i][3],a:'center'});X+=w}});tx(n+' de '+trans+' días ('+Math.round(n/trans*100)+' %)',158,yy+5,{s:6.8,c:GR})}});
 CAT.forEach((c,i)=>{rect(44+i*26,40+AC.length*13+1,4,4,c[2]);tx(c[1].replace('Dañina a la salud de grupos sensibles','Dañina g. sensibles'),49.5+i*26,40+AC.length*13+4.2,{s:5.8})});
 let ty=40+AC.length*13+14;tx('Cumplimiento de los niveles máximos permisibles de PM2.5 (Res. 2254/2017)',14,ty,{s:9,b:1});ty+=3;rect(14,ty,182,9,NAVY);
 [['Estación',16],['Días válidos',50],['Promedio (µg/m3)',72],['Norma anual 25',100],['Días > 37 µg/m3',128],['Máx. diario',158],['ICA prom.',182]].forEach(([t,x])=>tx(t,x,ty+5.8,{s:6.8,b:1,c:'#fff'}));
 AC.forEach((a,k)=>{const yy=ty+9+k*7,n=a.Cc.length,pm=n?mean(a.Cc):null,ex=a.Cc.filter(c=>c>37).length;rect(14,yy,182,7,k%2?'#fff':'#f1f6fa');
  tx(a.e,16,yy+4.8,{s:7.5,b:1});tx(n,50,yy+4.8,{s:7.5});tx(pm!=null?f1(pm):'-',72,yy+4.8,{s:7.5});tx(pm==null?'-':pm>25?'Excede':'Cumple',100,yy+4.8,{s:7.5,b:1,c:pm!=null&&pm>25?'#c62828':'#2f9e44'});tx(n?ex+(ex?' (excedencias)':''):'-',128,yy+4.8,{s:7.5,c:ex?'#c62828':NAVY});tx(n?f1(Math.max(...a.Cc)):'-',158,yy+4.8,{s:7.5});tx(n?Math.round(mean(a.V)):'-',182,yy+4.8,{s:7.5})});
 ty+=9+AC.length*7+2;par('El nivel máximo permisible diario de PM2.5 es 37 µg/m3 (equivale al límite superior de la categoría Aceptable; ICA 100) y el anual es 25 µg/m3. El promedio anual es indicativo: se calcula con los días válidos disponibles del año en curso y debe interpretarse junto con la disponibilidad de datos de cada estación.',14,ty,182,{s:7.2,c:GR});
 // tendencia mensual
 ty+=14;tx('Tendencia mensual: ICA promedio de los días de cada mes',14,ty,{s:9,b:1});const gx=24,gy=ty+4,gw=166,gh=52,gmax=Math.max(100,Math.ceil(Math.max(0,...AC.flatMap(a=>Object.values(a.M).map(v=>mean(v))))*1.1/25)*25),GY=v=>gy+gh-Math.min(v,gmax)/gmax*gh;
 [[0,50],[50,100],[100,150],[150,200],[200,300]].forEach(([a,b],i)=>{if(a<gmax)rect(gx,GY(Math.min(b,gmax)),gw,GY(a)-GY(Math.min(b,gmax)),LT[i])});for(let v=0;v<=gmax;v+=25)tx(v,gx-1.5,GY(v)+1,{s:6,a:'right',c:GR});
 const GX=m=>gx+(m+.5)/12*gw;MES.forEach((m,i)=>tx(m,GX(i),gy+gh+4,{s:6.2,a:'center',c:GR}));
 AC.forEach(a=>{doc.setDrawColor(PAL[a.e]);doc.setLineWidth(.7);let pr=null;for(let m=0;m<12;m++){const v=a.M[m]&&a.M[m].length>=15?mean(a.M[m]):null;if(v==null){pr=null;continue}if(pr)doc.line(pr[0],pr[1],GX(m),GY(v));pr=[GX(m),GY(v)];doc.setFillColor(PAL[a.e]);doc.circle(GX(m),GY(v),.9,'F')}});box(gx,gy,gw,gh,'#9fb1c2',.25);
 AC.forEach((a,k)=>{rect(24+k*34,gy+gh+8,5,1.6,PAL[a.e]);tx(a.e,30+k*34,gy+gh+9.4,{s:6.5})});tx('Solo se grafican los meses con al menos 15 días válidos.',24,gy+gh+14,{s:6,c:GR});
 // ---- 7. METEOROLOGÍA
 const multi=(x,y,w,h,title,get)=>{const n=72,hs=Array.from({length:n},(_,k)=>C-n+1+k),S=ES.map(s=>({e:s.e,v:hs.map(t=>{const m=MET[s.e]&&MET[s.e].get(t);return m?get(m):null})})).filter(s=>s.v.some(v=>v!=null)),al=S.flatMap(s=>s.v).filter(v=>v!=null);
  rect(x-10,y-8,w+10,6.5,'#e9f0f6');tx(title,x-7,y-3.4,{s:8.2,b:1});if(!al.length){tx('Sin datos',x+w/2,y+h/2,{s:9,c:'#c62828',a:'center'});return}
  const [lo,hi,st]=nice(Math.min(...al),Math.max(...al)),Y=v=>y+h-(v-lo)/(hi-lo)*h,X=k=>x+k/(n-1)*w;rect(x,y,w,h,'#fafcfe');for(let v=lo;v<=hi+1e-9;v+=st){ln(x,Y(v),x+w,Y(v),'#dde5ec',.2);tx(Number.isInteger(v)?v:v.toFixed(1),x-1.5,Y(v)+1,{s:6,a:'right',c:GR})}dayTicks(x,y,w,h,hs);
  S.forEach(s=>{doc.setDrawColor(PAL[s.e]);doc.setLineWidth(.45);let pr=null;s.v.forEach((v,k)=>{if(v==null){pr=null;return}if(pr)doc.line(pr[0],pr[1],X(k),Y(v));pr=[X(k),Y(v)]})});box(x,y,w,h,'#9fb1c2',.25);
  S.forEach((s,k)=>{rect(x+k*34,y+h+7,5,1.6,PAL[s.e]);tx(s.e,x+6+k*34,y+h+8.4,{s:6.5})})};
 np();sec('5.','Variables meteorológicas · últimas 72 horas',22);
 multi(24,42,166,52,'Temperatura (°C)',m=>m.t);multi(24,120,166,52,'Humedad relativa (%)',m=>m.r);multi(24,198,166,52,'Velocidad del viento (m/s)',m=>m.w);
 par('Las variables meteorológicas ayudan a interpretar el comportamiento del PM2.5: con viento débil y alta humedad la dispersión es menor y las concentraciones tienden a acumularse.',14,268,182,{s:7.5,c:GR});
 // ---- 8. ROSAS DE LOS VIENTOS
 np();sec('6.','Rosa de los vientos · últimos 30 días',22);
 const sector=(cx,cy,r,a0,a1,c)=>{const P=[[0,0]];for(let a=a0;a<=a1+1e-6;a+=(a1-a0)/5){const t=a*Math.PI/180;P.push([r*Math.sin(t),-r*Math.cos(t)])}const rel=[];for(let i=1;i<P.length;i++)rel.push([P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]]);doc.setFillColor(c);doc.lines(rel,cx,cy,[1,1],'F',true)};
 const RC=['#c3e1f4','#6cb7e0','#1b7fc0','#0f2b43'];let nr=0;
 ES.forEach(s=>{const M=MET[s.e],B=Array.from({length:16},()=>[0,0,0,0]);let n=0,calm=0;if(M)for(let h=C-720;h<=C;h++){const w=M.get(h);if(!w||w.w==null||w.d==null)continue;n++;if(w.w<.5){calm++;continue}B[Math.round(w.d/22.5)%16][w.w<2?0:w.w<4?1:w.w<6?2:3]++}
  const px=14+(nr%2)*94,py=34+Math.floor(nr/2)*76;if(n<24)return;nr++;rect(px,py,88,6.5,NAVY);tx('Estación '+s.e,px+44,py+4.6,{s:8.5,b:1,c:'#fff',a:'center'});
  const cx=px+44,cy=py+38,R=24,mxf=Math.max(...B.map(b=>b.reduce((p,c)=>p+c,0)))/n;[.25,.5,.75,1].forEach(f=>{doc.setDrawColor('#c5d3de');doc.setLineWidth(.15);doc.circle(cx,cy,R*f,'S')});
  B.forEach((b,k)=>{let cum=0;for(let c=3;c>=0;c--){cum=b.slice(0,c+1).reduce((p,q)=>p+q,0);const r=cum/n/mxf*R;if(r>0)sector(cx,cy,r,k*22.5-9.5,k*22.5+9.5,RC[c])}});
  [['N',0],['E',90],['S',180],['O',270]].forEach(([l,a])=>{const t=a*Math.PI/180;tx(l,cx+(R+4)*Math.sin(t),cy-(R+4)*Math.cos(t)+1.2,{s:7.5,b:1,a:'center'})});tx(f1(mxf*100)+' %',cx+1,cy-R-.6,{s:5.5,c:GR});
  tx('Calmas (< 0,5 m/s): '+f1(calm/n*100)+' %  ·  n = '+n+' h',px+44,py+74.5,{s:6.2,c:GR,a:'center'})});
 if(!nr)tx('No hay datos de dirección del viento en los últimos 30 días.',14,40,{s:9,c:'#c62828'});
 {const ly=38+Math.ceil(Math.max(nr,1)/2)*76;[['0,5 a 2 m/s',0],['2 a 4 m/s',1],['4 a 6 m/s',2],['6 m/s o más',3]].forEach(([t,i],k)=>{rect(14+k*40,ly,5,4,RC[i]);tx(t,20+k*40,ly+3.2,{s:6.5})});
  par('La rosa muestra de dónde sopla el viento: cada pétalo es el porcentaje de horas con viento desde esa dirección, dividido por rangos de velocidad. La dirección se resume por frecuencias (no por promedio aritmético de ángulos).',14,ly+10,182,{s:7.5,c:GR})}
 // ---- 9. NORMATIVA I
 np();sec('7.','Marco normativo de la calidad del aire',22);
 const TL=[['Decreto 1076 de 2015','Decreto Único Reglamentario del Sector Ambiente y Desarrollo Sostenible. Establece las medidas para la atención de episodios según los niveles de declaratoria de las contingencias.'],['Resolución 2254 de 2017','Adopta la norma de calidad del aire. Define los niveles máximos permisibles, el Índice de Calidad del Aire (ICA) y los niveles de prevención, alerta y emergencia.'],['Decreto 835 de 2023','Adopta y reglamenta el Plan de Prevención, Reducción y Control de la Contaminación del Aire Cúcuta Región en el departamento de Norte de Santander.'],['Decreto 1452 de 2026','Actualiza y adopta el Plan de Contingencia ante eventos o episodios de contaminación atmosférica de San José de Cúcuta y su Área Metropolitana, en el marco del Decreto 835 de 2023.']];
 TL.forEach((t,k)=>{const x=14+k*46;rect(x,34,43,3,VERDE);rect(x,37,43,42,'#f1f6fa');tx(t[0],x+2,43,{s:7.6,b:1});par(t[1],x+2,48,39,{s:6.5,c:GR})});
 tx('Niveles máximos permisibles de contaminantes criterio (Resolución 2254 de 2017)',14,90,{s:9,b:1});rect(14,93,182,7,NAVY);[['Contaminante',16],['Tiempo de exposición',62],['Nivel vigente (µg/m3)',108],['Meta desde 1 de enero de 2030',150]].forEach(([t,x])=>tx(t,x,97.8,{s:7,b:1,c:'#fff'}));
 const NV=[['PM10','Anual','50','30'],['PM10','24 horas','75 (desde 1 jul 2018)','-'],['PM2.5','Anual','25','15'],['PM2.5','24 horas','37 (desde 1 jul 2018)','-'],['SO2','24 horas','50','20'],['SO2','1 hora','100','-'],['NO2','Anual','60','40'],['NO2','1 hora','200','-'],['O3','8 horas','100','-'],['CO','8 horas','5.000','-'],['CO','1 hora','35.000','-']];
 NV.forEach((r,k)=>{const yy=100+k*6.4,hl=r[0]==='PM2.5';rect(14,yy,182,6.4,hl?'#e5f3d4':k%2?'#fff':'#f1f6fa');[[r[0],16,1],[r[1],62,0],[r[2],108,hl],[r[3],150,0]].forEach(([t,x,b])=>tx(t,x,yy+4.4,{s:7.2,b:b}))});
 let ny=100+NV.length*6.4+4;par('Los niveles de PM10 y PM2.5 a 24 horas rigen desde el 1 de julio de 2018 (parágrafo 1 del artículo 2): 75 y 37 µg/m3. Los valores anteriores a esa fecha (100 y 50 µg/m3) ya no aplican. Para verificar el cumplimiento, la concentración debe evaluarse por cada punto de monitoreo (parágrafo 2).',14,ny,182,{s:7.3,c:GR});
 ny+=17;tx('¿Cómo se calcula el ICA del PM2.5?',14,ny,{s:9,b:1});
 par('ICA = (I_alto - I_bajo) / (BP_alto - BP_bajo) x (C - BP_bajo) + I_bajo, donde C es la concentración promedio de 24 horas (µg/m3) y BP e I son los puntos de corte de concentración e índice de la Tabla 6 de la Resolución 2254 de 2017 (artículo 21).',14,ny+5,182,{s:7.6});
 // ---- 10. NORMATIVA II
 np();sec('8.','Índice de Calidad del Aire y niveles de contingencia',22);
 tx('Índice de Calidad del Aire - ICA (Capítulo IV, Resolución 2254 de 2017)',14,34,{s:9,b:1});rect(14,37,182,7,NAVY);[['ICA',16],['Color',36],['Clasificación',58],['PM2.5 24 h',116],['Efecto en la salud (resumen)',138]].forEach(([t,x])=>tx(t,x,41.8,{s:6.8,b:1,c:'#fff'}));
 const BPR=['0 - 12','13 - 37','38 - 55','56 - 150','151 - 250','251 - 500'];CAT.forEach((c,i)=>{const yy=44+i*15;rect(14,yy,102,15,c[2]);[[RG[i],16],[COLN[i],36],[c[1],58]].forEach(([t,x])=>par(t,x,yy+5.6,i===2&&x===58?56:54,{s:7,b:1,c:c[3]}));rect(116,yy,22,15,c[2]);tx(BPR[i],118,yy+8.4,{s:7.2,b:1,c:c[3]});rect(138,yy,58,15,'#f8fafc');par(MSG[i],139.5,yy+4,55,{s:5.6,c:NAVY});box(14,yy,182,15,'#ffffff',.3)});
 let cy2=44+6*15+8;tx('Niveles de contingencia: preparación, prevención, alerta y emergencia',14,cy2,{s:9,b:1});cy2+=3;rect(14,cy2,182,11,NAVY);
 [['Contaminante',16],['Tiempo',46],['Preparación (Nivel I)',66],['Prevención (Nivel II)',96],['Alerta (Nivel III)',128],['Emergencia (Nivel IV)',160]].forEach(([t,x])=>tx(t,x,cy2+6.8,{s:6.6,b:1,c:'#fff'}));
 const CT=[['PM10','24 horas','75 - 154','155 - 254','255 - 354','>= 355'],['PM2.5','24 horas','25 - 37','38 - 55','56 - 150','>= 151'],['O3','8 horas','n.a.','139 - 167','168 - 207','>= 208'],['SO2','1 hora','n.a.','198 - 486','487 - 797','>= 798'],['NO2','1 hora','n.a.','190 - 677','678 - 1221','>= 1222'],['CO','8 horas','n.a.','10820 - 14254','14255 - 17688','>= 17689'],['ICA equivalente (PM2.5)','',ica(25)+' - 100','101 - 150','151 - 200','>= 201']];
 CT.forEach((r,k)=>{const yy=cy2+11+k*6.4,hl=r[0]==='PM2.5'||k===6;rect(14,yy,182,6.4,hl?'#e5f3d4':k%2?'#fff':'#f1f6fa');r.forEach((t,j)=>tx(t,[16,46,66,96,128,160][j],yy+4.4,{s:j===0&&k===6?6.4:7,b:j===0}))});
 par('Concentraciones en µg/m3. Los niveles de prevención, alerta y emergencia corresponden a la Resolución 2254 de 2017; el nivel de preparación, a los Decretos 835 de 2023 y 1452 de 2026. La declaratoria de un episodio se hace con la media móvil y su ICA, según los artículos 9 al 13 de la resolución; un valor horario elevado no configura por sí mismo una emergencia. Este resumen es informativo: el texto oficial es el de la norma.',14,cy2+11+CT.length*6.4+4,182,{s:7,c:GR});
 // ---- 11. METODOLOGÍA Y CALIDAD DE DATOS
 np();sec('9.','Metodología y calidad de los datos',22);
 let my=par('1. Fuente: estaciones del Sistema de Vigilancia de la Calidad del Aire (SVCA) de CORPONOR. Los datos se reciben como promedios de 10 minutos o de 1 hora y se agrupan en promedios horarios, válidos con al menos el 75 % de los registros del intervalo.',14,34,182,{s:7.6});
 my=par('2. Cada dato horario lleva la hora de cierre del intervalo (24:00 cierra el día). La media móvil de 24 horas promedia las 24 horas que terminan en la hora de consulta y exige al menos 18 datos válidos (75 %).',14,my+1.5,182,{s:7.6});
 my=par('3. El ICA diario es el ICA de la concentración promedio de 24 horas de un día cerrado. Se interpola linealmente en el tramo de la Tabla 6 que corresponde a la concentración, sin redondearla, y el resultado se trunca al entero (la misma regla del boletín oficial de CORPONOR).',14,my+1.5,182,{s:7.6});
 my=par('4. Se excluyen los registros sin dato (NoData), con muestras insuficientes (<Samp), con códigos de error (9999999) y los valores físicamente imposibles. No se corrige ni se elimina ningún otro valor. Los datos se validan por una persona responsable antes de cargarse.',14,my+1.5,182,{s:7.6});
 my+=4;tx('Disponibilidad de datos de PM2.5',14,my,{s:9,b:1});my+=3;rect(14,my,182,8,NAVY);[['Estación',16],['Último dato',46],['Estado',86],['Últimos 30 días',112],['Año '+YR,146],['Datos válidos del año',170]].forEach(([t,x])=>tx(t,x,my+5.4,{s:6.6,b:1,c:'#fff'}));
 ES.forEach((s,k)=>{const yy=my+8+k*6.6;let n30=0,nY=0;for(let h=C-719;h<=C;h++)if(HR[s.e].has(h))n30++;const hy=Math.floor(Date.UTC(YR,0,1)/H);for(let h=hy;h<=C;h++)if(HR[s.e].has(h))nY++;
  rect(14,yy,182,6.6,k%2?'#fff':'#f1f6fa');tx(s.e,16,yy+4.5,{s:7.2,b:1});tx(s.last!=null?dmy(s.last):'-',46,yy+4.5,{s:7});tx(s.on?'En línea':'Sin transmisión',86,yy+4.5,{s:7,b:1,c:s.on?'#2f9e44':'#c62828'});tx(Math.round(n30/720*100)+' %',112,yy+4.5,{s:7});tx(Math.round(nY/(C-hy+1)*100)+' %',146,yy+4.5,{s:7});tx(nY.toLocaleString('es-CO')+' horas',170,yy+4.5,{s:7})});
 my+=8+ES.length*6.6+6;tx('Observaciones',14,my,{s:9,b:1});my+=4.5;const OB=[];ES.filter(s=>!s.on).forEach(s=>OB.push(`La estación ${s.e} no reporta datos de PM2.5 `+(s.last!=null?'desde el '+dmy(s.last)+'.':'en el periodo consultado.')));if(o.obs)OB.push(o.obs);
 (OB.length?OB:['Sin observaciones.']).forEach(t=>{my=par('- '+t,14,my,182,{s:7.6})+1});
 let vl=null;try{const lg=JSON.parse(await idb('get',null,'log')||'[]');vl=lg.length?lg[lg.length-1]:null}catch(_){}
 if(vl){my+=2;my=par(`Última carga de datos validada por ${vl.v} el ${vl.f} (${vl.a}; ${vl.p}).`,14,my,182,{s:7.2,c:GR})}
 // firmas
 const fy=Math.max(my+16,236);ln(24,fy,92,fy,NAVY,.3);ln(118,fy,186,fy,NAVY,.3);tx((o.elab||'').toUpperCase(),58,fy+4.5,{s:7.8,b:1,a:'center'});tx(o.cargoE||'',58,fy+8.5,{s:7,a:'center'});tx('Elaboró',58,fy+12.5,{s:7,b:1,a:'center'});
 tx((o.rev||'').toUpperCase(),152,fy+4.5,{s:7.8,b:1,a:'center'});tx(o.cargoR||'',152,fy+8.5,{s:7,a:'center'});tx('Revisó',152,fy+12.5,{s:7,b:1,a:'center'});
 // pies de página
 const N=doc.getNumberOfPages();for(let i=2;i<=N;i++){doc.setPage(i);ln(14,287,196,287,'#c5d3de',.2);tx('Boletín del Estado de la Calidad del Aire · San José de Cúcuta · Corte: '+fecha+' '+hora+' h',14,291,{s:6.5,c:GR});tx(i+' / '+N,196,291,{s:7.5,b:1,a:'right'})}
 doc.save(`Boletin_Calidad_del_Aire_${YR}-${p2(Dc.getUTCMonth()+1)}-${p2(Dc.getUTCDate())}_${p2(Dc.getUTCHours())}h.pdf`)}


function csv24all(){const q=v=>v==null?'':String(v).replace('.',','),L=['hora_cierre;estacion;pm25_horario;pm10_horario;horas_validas_24h;media_movil_24h;ica;categoria;temperatura;humedad;viento;direccion;sensacion_termica'];
 ST.forEach(e=>{if(!HR[e]&&!MET[e])return;for(let k=23;k>=0;k--){const h=END-k,r=ROWS.get(e+'|'+h)||{},m=mm(e,h),i=ica(m);let n=0;for(let z=h-23;z<=h;z++)if(HR[e]&&HR[e].has(z))n++;const w=MET[e]&&MET[e].get(h);
  L.push([fdt(h*H)+' '+p2(h%24)+':00',e,q(r.a),q(r.b),n,m==null?'':q(+m.toFixed(2)),i==null?'':i,i==null?'':cat(i)[1],q(r.t),q(r.r),q(r.w),r.d==null?'':Math.round(r.d),w&&at(w.t,w.r,w.w)!=null?q(+at(w.t,w.r,w.w).toFixed(1)):''].join(';'))}});
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+L.join('\n')],{type:'text/csv'}));a.download='datos_ultimas_24h_'+fdt(END*H).replace(/\//g,'-')+'.csv';a.click()}
function initRep(){if(!$('rc').value||$('rc').dataset.auto){const d=new Date(END*H);$('rc').value=`${d.getUTCFullYear()}-${p2(d.getUTCMonth()+1)}-${p2(d.getUTCDate())}T${p2(d.getUTCHours())}:00`;$('rc').dataset.auto='1'}
 try{const f=JSON.parse(localStorage.getItem('svca_rep')||'null');if(f&&!$('re').value){$('re').value=f.e||'';$('rce').value=f.ce||$('rce').value;$('rr').value=f.r||'';$('rcr').value=f.cr||$('rcr').value}}catch(_){}}
function legend(){$('leg').innerHTML=CAT.map(c=>`<span class="lg"><i style="background:${c[2]}"></i>${c[1]} (${c[4]} µg/m³)</span>`).join('')}
function years(){const ys=new Set();for(const e in DAY)for(const[dk,d] of DAY[e])if(d.n>=18)ys.add(new Date(dk*D).getUTCFullYear());
 const a=[...ys].sort((x,y)=>y-x),cur=$('yr').value;$('yr').innerHTML=a.map(y=>`<option>${y}</option>`).join('');if(a.includes(+cur))$('yr').value=cur}
function info(){const n=ROWS.size;let mn=1e15;ROWS.forEach(r=>{if(r.h<mn)mn=r.h});$('info').textContent=n?`Base actual: ${n.toLocaleString('es-CO')} registros horarios · ${fdt(mn*H)} a ${fdt(END*H)}.`:'Sin datos.'}
function sel(e){SEL=e;cards();map();chart();cal();trends();heat();stat();t24()}
function all(){index();years();const d=new Date(END*H);CY=d.getUTCFullYear();CM=d.getUTCMonth();cards();map();chart();cal();trends();heat();dist();stat();legend();info();t24();initRep()}
function dl(){const f=v=>v==null?'':v,L=[...ROWS.values()].sort((a,b)=>a.e<b.e?-1:a.e>b.e?1:a.h-b.h).map(r=>{const d=new Date(r.h*H);return `${d.getUTCFullYear()}-${p2(d.getUTCMonth()+1)}-${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:00;${r.e};${f(r.a)};${f(r.b)};${f(r.t)};${f(r.r)};${f(r.w)};${f(r.d)}`});
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufefffecha;estacion;pm25;pm10;temperatura;humedad;viento;direccion\n'+L.join('\n')],{type:'text/csv'}));a.download='base_svca_consolidada.csv';a.click()}

$('tabs').onclick=ev=>{const e=ev.target.dataset.e;if(e)sel(e)};
$('map').onclick=ev=>{const g=ev.target.closest('[data-e]');if(g)sel(g.dataset.e)};
let T24=[];
function t24(){const e=SEL,V=h=>HR[e]&&HR[e].get(h),W=h=>MET[e]&&MET[e].get(h),f=x=>x==null?'—':fx(x);
 T24=Array.from({length:24},(_,k)=>END-k).map(h=>{const v=V(h),m=mm(e,h),i=ica(m),w=W(h);let n=0;for(let q=h-23;q<=h;q++)if(V(q)!=null)n++;
  return{h,v,n,m,i,c:i!=null?cat(i):null,t:w?w.t:null,r:w?w.r:null,w:w?w.w:null,s:w?at(w.t,w.r,w.w):null}});
 $('tb24').innerHTML=ST.map(x=>`<button data-e="${x}" class="${x===e?'sel':''}">${x}</button>`).join('');
 $('t24').innerHTML='<tr><th>Hora (cierre)</th><th>PM2.5 horario (µg/m³)</th><th>Horas válidas (de 24)</th><th>Media móvil 24 h (µg/m³)</th><th>ICA</th><th style="text-align:left">Categoría</th><th>Temp. (°C)</th><th>HR (%)</th><th>Viento (m/s)</th><th>Sensación (°C)</th></tr>'+T24.map(o=>`<tr><td>${lab(o.h)}</td><td>${f(o.v)}</td><td class="${o.n<18?'up':''}">${o.n}</td><td>${f(o.m)}</td><td>${o.c?`<b style="background:${o.c[2]};color:${o.c[3]};padding:2px 10px;border-radius:6px">${o.i}</b>`:'—'}</td><td style="text-align:left">${o.c?o.c[1]:'Sin dato válido'}</td><td>${f(o.t)}</td><td>${o.r==null?'—':o.r}</td><td>${f(o.w)}</td><td>${f(o.s)}</td></tr>`).join('')}
$('t24w').onclick=ev=>{const e=ev.target.dataset.e;if(e)sel(e)};
$('rg').onchange=chart;$('sp').onchange=$('sp2').onchange=ev=>{$('sp').value=$('sp2').value=ev.target.value;stat()};$('csv24').onclick=csv24all;
$('dlj').onclick=async()=>{try{if(!ROWS.size)return;$('info').textContent='Preparando historico.js…';await new Promise(r=>setTimeout(r,30));const gz=new Uint8Array(await new Response(new Blob([csvText()]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());let b='';for(let i=0;i<gz.length;i+=32768)b+=String.fromCharCode.apply(null,gz.subarray(i,i+32768));
 const ts=Date.now(),js=`/* Base consolidada SVCA CORPONOR · ${new Date(ts).toISOString().slice(0,16).replace('T',' ')} UTC · ${ROWS.size} horas-estación */\nwindow.HISTORICO_TS=${ts};\nwindow.HISTORICO_GZ="${btoa(b)}";\n`;
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([js],{type:'text/javascript'}));a.download='historico.js';a.click();$('info').textContent=`Se descargó historico.js (${ROWS.size.toLocaleString('es-CO')} horas-estación, ${(js.length/1e6).toFixed(1)} MB). Reemplace con él el archivo datos/historico.js que está junto al HTML (o en el servidor).`}catch(x){$('info').textContent='No se pudo generar historico.js: '+x.message}};
$('rc').oninput=()=>{delete $('rc').dataset.auto};
$('pdf').onclick=async()=>{const m=$('rc').value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);if(!m){$('info').textContent='Indique la fecha y hora de corte del informe.';return}
 const corte=Math.floor(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5])/H);try{localStorage.setItem('svca_rep',JSON.stringify({e:$('re').value,ce:$('rce').value,r:$('rr').value,cr:$('rcr').value}))}catch(_){}
 $('info').textContent='Generando el informe…';try{await informe({corte,num:$('rn').value.trim()||'___',elab:$('re').value.trim(),cargoE:$('rce').value.trim(),rev:$('rr').value.trim(),cargoR:$('rcr').value.trim(),obs:$('ro').value.trim()});$('info').textContent='Informe generado.'}catch(x){$('info').textContent='No se pudo generar el informe: '+x.message}};
$('lin').onclick=()=>{$('lin').classList.add('sel');$('bar').classList.remove('sel');chart()};
$('bar').onclick=()=>{$('bar').classList.add('sel');$('lin').classList.remove('sel');chart()};
$('yr').onchange=()=>{heat();dist()};
$('pm').onclick=()=>{CM--;if(CM<0){CM=11;CY--}cal()};$('nm').onclick=()=>{CM++;if(CM>11){CM=0;CY++}cal()};
$('dl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csvText()],{type:'text/csv'}));a.download='historico.csv';a.click()};
$('al').onclick=()=>{$('pinw').hidden=!$('pinw').hidden};
$('pb').onclick=()=>{if($('pin').value===ADMIN_CLAVE){ADM=true;$('adm').hidden=false;$('adm').open=true;$('pinw').hidden=true;$('pin').value='';$('adm').scrollIntoView({behavior:'smooth',block:'start'});map()}else $('pin').style.borderColor='#c62828'};
$('pin').onkeydown=ev=>{if(ev.key==='Enter')$('pb').click()};
if(location.hash==='#admin')$('pinw').hidden=false;
$('map').addEventListener('pointerdown',ev=>{MOV=false;const g=ev.target.closest('[data-e]');DOWN=g?g.dataset.e:null;if(!ADM||!g)return;DR=g.dataset.e;$('map').setPointerCapture(ev.pointerId);ev.preventDefault()});
$('map').addEventListener('pointermove',ev=>{if(!DR)return;MOV=true;const sv=$('map'),pt=sv.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;const q=pt.matrixTransform(sv.getScreenCTM().inverse());POS[DR]=[Math.min(1,Math.max(0,q.x/MW)),Math.min(1,Math.max(0,q.y/MH))];map()});
$('map').addEventListener('pointerup',()=>{if(DR){DR=null;try{localStorage.setItem('svca_pos',JSON.stringify(POS))}catch(_){}}});
const idb=(m,v,k='csv')=>new Promise((ok,no)=>{const r=indexedDB.open('svca',1);r.onupgradeneeded=()=>r.result.createObjectStore('k');r.onerror=()=>no(r.error);r.onsuccess=()=>{const t=r.result.transaction('k',m==='get'?'readonly':'readwrite'),st=t.objectStore('k'),q=m==='get'?st.get(k):m==='put'?st.put(v,k):st.delete(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)}});
function cells(l,sep){const o=[];let c='',q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===sep&&!q){o.push(c);c=''}else c+=ch}o.push(c);return o.map(x=>x.trim())}
const LIMV={a:[0,1e9],b:[0,1e9],r:[0,100],w:[0,60],d:[0,360],t:[-10,60]},BS=['a','b','t','r','w','d'];
function parseRep(txt){const L=txt.replace(/^\ufeff/,'').split(/\r?\n/),k=L.findIndex(l=>/Fecha\s*&\s*Hora/i.test(l));if(k<0||!L[k+1])return null;
 const sep=L[k].split(';').length>L[k].split(',').length?';':',',st=cells(L[k],sep),vr=cells(L[k+1],sep),
 NM={'barrio centro':'Centro','barrio comuneros':'Comuneros','barrio el salado':'El Salado','punto blanco':'Punto Blanco','unidad movil':'Unidad Móvil','unidad móvil':'Unidad Móvil'},VM={'PM2.5':'a','PM10':'b','TEMP':'t','RH':'r','WS':'w','WD':'d','WDIR':'d'},col=[],acol=[];let cur='';
 st.forEach((x,i)=>{if(x)cur=x;const vn=(vr[i]||'').toUpperCase(),v=VM[vn];if(i&&(v||vn==='PB')){const e=NM[cur.toLowerCase()]||cur;acol.push([i,e,vn,v]);if(v)col.push([i,e,v])}});
 const tit=L.slice(0,k).join(' '),mt=tit.match(/AVG\s+(\d+)\s*(Min|Hr)/i);let step=mt?(+mt[1])*(/^h/i.test(mt[2])?60:1):0;
 const num=x=>{const v=parseFloat((x||'').replace(',','.'));return isFinite(v)?v:null},A=new Map(),cnt=Array(st.length).fill(0),rej={a:0,b:0,t:0,r:0,w:0,d:0},seen=new Set(),dts=[],runs=[],cur2={},run=(ix,e,vn,cd,t)=>{const c=cur2[ix];if(c&&c.cd===cd){c.te=t;if(cd)c.n++;return}if(c&&c.cd)runs.push([c.e,c.vn,c.cd,c.ts,c.te,c.n]);cur2[ix]={e,vn,cd,ts:t,te:t,n:cd?1:0}};
 let nrec=0,dup=0,ooo=0,t0=1e18,t1=-1e18,pv=null;
 for(let i=k+2;i<L.length;i++){const l=L[i];if(!/^\s*"?\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}/.test(l))continue;const c=cells(l,sep),t=pt(c[0].replace(/"/g,''));if(!isFinite(t))continue;
  nrec++;if(seen.has(t))dup++;seen.add(t);if(pv!=null){if(t<pv)ooo++;else if(t>pv&&dts.length<200)dts.push((t-pv)/6e4)}pv=t;if(t<t0)t0=t;if(t>t1)t1=t;const h=Math.ceil(t/H);
  acol.forEach(([ix,e,vn,v])=>{const r0=c[ix];let cd=null,x=null;if(r0===undefined||r0==='')cd='Vacío';else{x=num(r0);if(x==null)cd=/^no\s*data$/i.test(r0)?'NoData':/^<\s*samp/i.test(r0)?'<Samp':'Texto';else{cnt[ix]++;if(x>=9999990)cd='9999999';else if(v&&(x<LIMV[v][0]||x>LIMV[v][1])){cd='Imposible';rej[v]++}}}run(ix,e,vn,cd,t);if(cd||!v)return;
   const key=e+'|'+h;let o=A.get(key);if(!o){o={e,h,s:{}};A.set(key,o)}const q=o.s[v]=o.s[v]||{s:0,n:0,sn:0,cs:0};q.n++;if(v==='d'){const rd=x*Math.PI/180;q.sn+=Math.sin(rd);q.cs+=Math.cos(rd)}else q.s+=x})}
 Object.values(cur2).forEach(c=>{if(c.cd)runs.push([c.e,c.vn,c.cd,c.ts,c.te,c.n])});if(!step){dts.sort((a,b)=>a-b);step=dts.length?dts[dts.length>>1]:60}
 const per=step<60?Math.max(1,Math.round(60/step)):1,need=Math.ceil(.75*per),rows=new Map();let parc=0;
 A.forEach((o,key)=>{const r={e:o.e,h:o.h,a:null,b:null,t:null,r:null,w:null,d:null};for(const v in o.s){const q=o.s[v];if(q.n>=need)r[v]=v==='d'?(Math.atan2(q.sn,q.cs)*180/Math.PI+360)%360:q.s/q.n;else if(v==='a')parc++}
  if(r.a!=null||r.t!=null||r.r!=null||r.w!=null)rows.set(key,r)});
 const nl=L.find(l=>/^\s*"?Num"?\s*[,;]/.test(l)),chk={ok:0,tot:0,bad:[]};
 if(nl){const nc=cells(nl,sep);col.forEach(([ix,e,v])=>{if(nc[ix]===undefined||nc[ix]==='')return;chk.tot++;if(+nc[ix]===cnt[ix])chk.ok++;else chk.bad.push(`${e} ${vr[ix]}: reporte ${nc[ix]} · leídos ${cnt[ix]}`)})}
 return{rows,step,per,need,nrec,dup,ooo,t0,t1,rej,parc,chk,runs,hasNum:!!nl}}
function mergeInto(T,M){let nuevas=0;M.forEach((r,k)=>{const o=T.get(k);if(o){for(const q of BS)if(r[q]==null&&o[q]!=null)r[q]=o[q]}else nuevas++;T.set(k,r)});return nuevas}
function ingestRep(txt){const P=parseRep(txt);if(!P)return 0;mergeInto(ROWS,P.rows);return P.rows.size}
function csvText(){const f=v=>v==null?'':+v.toFixed(2);return '\ufefffecha;estacion;pm25;pm10;temperatura;humedad;viento;direccion\n'+[...ROWS.values()].sort((a,b)=>a.e<b.e?-1:a.e>b.e?1:a.h-b.h).map(r=>{const d=new Date(r.h*H);return `${d.getUTCFullYear()}-${p2(d.getUTCMonth()+1)}-${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:00;${r.e};${f(r.a)};${f(r.b)};${f(r.t)};${f(r.r)};${f(r.w)};${r.d==null?'':+r.d.toFixed(1)}`}).join('\n')}
const ingest2=txt=>/Fecha\s*&\s*Hora/i.test(txt.slice(0,4000))?ingestRep(txt):ingest(txt);
function vreport(names,Ps){const M=new Map(),by={},I=[],ok=t=>`<div class="on">✔ ${t}</div>`,wn=t=>`<div class="up">⚠ ${t}</div>`,N=n=>n.toLocaleString('es-CO');let h0=1e18,h1=-1e18;
 Ps.forEach(P=>mergeInto(M,P.rows));M.forEach(r=>{(by[r.e]=by[r.e]||[]).push(r);if(r.h<h0)h0=r.h;if(r.h>h1)h1=r.h});const tot=h1-h0+1;
 Ps.forEach((P,i)=>{I.push(`<div style="margin-top:6px"><b>${names[i]}</b> · promedio de ${P.step<60?P.step+' min':'1 h'} · ${fdt(P.t0)} a ${fdt(P.t1)} · ${N(P.nrec)} registros → ${N(P.rows.size)} horas-estación (hora válida con ≥ ${P.need} de ${P.per} registros)</div>`);
  I.push(!P.hasNum?wn('El reporte no trae la fila «Num»: no se pudo cruzar el conteo de datos.'):P.chk.bad.length?wn(`El conteo no coincide con la fila «Num» del reporte en ${P.chk.bad.length} de ${P.chk.tot} columnas: ${P.chk.bad.slice(0,3).join('; ')}`):ok(`El conteo de datos coincide con la fila «Num» del reporte (${P.chk.ok}/${P.chk.tot} columnas).`));
  const rj=Object.entries(P.rej).filter(([,n])=>n);I.push(rj.length?wn('Valores físicamente imposibles excluidos: '+rj.map(([v,n])=>`${{a:'PM2.5',b:'PM10',t:'temperatura',r:'HR',w:'viento',d:'dirección'}[v]} ${n}`).join(', ')+'.'):ok('Sin valores físicamente imposibles (PM negativo, HR fuera de 0–100, viento &lt; 0 o &gt; 60 m/s, dirección fuera de 0–360°, temperatura fuera de −10 a 60 °C).'));
  const tot={},tl={},CD=['NoData','<Samp','9999999','Imposible','Texto','Vacío'];P.runs.forEach(([e,vn,cd,ts,te,n])=>{tot[cd]=(tot[cd]||0)+n;const k=e+'|'+vn;(tl[k]=tl[k]||{e,vn})[cd]=(tl[k][cd]||0)+n});
  I.push(`<div>Códigos especiales (registros de ${P.step<60?P.step+' min':'1 h'}): ${CD.filter(c=>tot[c]).map(c=>`<b>${c.replace('<','&lt;')}</b> ${N(tot[c])}`).join(' · ')||'ninguno'}. <i>NoData</i> = el equipo no reportó; <i>&lt;Samp</i> = muestras insuficientes en el intervalo; <i>9999999</i> = código de error del equipo. Ninguno entra al cálculo.</div>`);
  const us=Object.values(tl).filter(o=>o.vn!=='PB'&&(o['9999999']||o['Imposible']||o['Texto']));
  if(us.length)I.push(wn('Códigos de error en variables que usa el dashboard: '+us.map(o=>`${o.e} ${o.vn}: `+['9999999','Imposible','Texto'].filter(c=>o[c]).map(c=>o[c]+' × '+c.replace('<','&lt;')).join(', ')).join('; ')+'.'));
  I.push(`<details><summary>Auditoría por estación y variable (registros)</summary><div class="tw"><table><tr><th>Estación</th><th>Variable</th><th>NoData</th><th>&lt;Samp</th><th>9999999</th><th>Imposibles</th><th>Texto</th></tr>${Object.values(tl).sort((x,y)=>x.e<y.e?-1:x.e>y.e?1:x.vn<y.vn?-1:1).map(o=>`<tr><td>${o.e}</td><td>${o.vn}</td><td>${N(o['NoData']||0)}</td><td>${N(o['<Samp']||0)}</td><td${o['9999999']&&o.vn!=='PB'?' class="up"':''}>${N(o['9999999']||0)}</td><td>${N(o['Imposible']||0)}</td><td>${N(o['Texto']||0)}</td></tr>`).join('')}</table></div></details>`);
  if(P.dup||P.ooo)I.push(wn(`Marcas de tiempo: ${P.dup} repetidas y ${P.ooo} fuera de orden.`));if(P.parc)I.push(wn(`${N(P.parc)} horas-estación con PM2.5 incompleto (menos del 75 % de los registros) quedaron sin dato.`))});
 let T='<table><tr><th>Estación</th><th>Horas PM2.5 válidas</th><th>% del periodo</th><th>Mayor vacío (h)</th><th>PM2.5 máx. (µg/m³)</th><th>Horas &gt; 150</th><th>PM2.5 &gt; PM10</th><th>Series pegadas ≥ 12 h</th><th>Ya cargadas</th><th>Con cambios</th></tr>',nuevas=0;
 Object.keys(by).forEach(e=>{const R=by[e].sort((x,y)=>x.h-y.h),pm=R.filter(r=>r.a!=null);let mg=0,run=1,pg=0,sol=0,cam=0;
  for(let i=1;i<pm.length;i++){mg=Math.max(mg,pm[i].h-pm[i-1].h-1);if(pm[i].a===pm[i-1].a&&pm[i].h===pm[i-1].h+1){run++;if(run===12)pg++}else run=1}
  R.forEach(r=>{const o=ROWS.get(r.e+'|'+r.h);if(!o)nuevas++;else{sol++;if((o.a==null)!==(r.a==null)||(o.a!=null&&Math.abs(o.a-r.a)>.05))cam++}});
  const mx=pm.length?pm.reduce((p,c)=>c.a>p.a?c:p):null,inc=pm.filter(r=>r.b!=null&&r.a>r.b+.05).length,al=pm.filter(r=>r.a>150).length,cl=(c,n)=>c?` class="up"`:'';
  T+=`<tr><td>${e}</td><td>${N(pm.length)}</td><td${pm.length/tot<.75?' class="up"':''}>${fx(pm.length/tot*100,1)} %</td><td>${N(mg)}</td><td>${mx?fx(mx.a)+' · '+lab(mx.h):'—'}</td><td>${N(al)}</td><td${inc?' class="up"':''}>${N(inc)}</td><td${pg?' class="up"':''}>${pg}</td><td>${N(sol)}</td><td${cam?' class="up"':''}>${N(cam)}</td></tr>`});
 const SP=[];Object.keys(by).forEach(e=>{const m=new Map(by[e].filter(r=>r.a!=null).map(r=>[r.h,r.a]));m.forEach((v,h)=>{if(v<25)return;const nb=[];for(let k=-3;k<=3;k++)if(k&&m.has(h+k))nb.push(m.get(h+k));if(nb.length<4)return;nb.sort((a,b)=>a-b);const md=nb[nb.length>>1];if(v>=3.5*md)SP.push([e,h,v,md])})});
 SP.sort((a,b)=>b[2]/b[3]-a[2]/a[3]);const SPH=SP.length?`<details><summary class="up">⚠ ${N(SP.length)} picos horarios aislados para revisar (PM2.5 ≥ 25 µg/m3 y ≥ 3,5 veces la mediana de las horas vecinas)</summary><div class="tw"><table><tr><th>Estación</th><th>Hora (cierre)</th><th>PM2.5 (µg/m3)</th><th>Mediana vecina</th></tr>${SP.slice(0,20).map(q=>`<tr><td>${q[0]}</td><td>${lab(q[1])}</td><td class="up">${fx(q[2])}</td><td>${fx(q[3])}</td></tr>`).join('')}</table></div><div class="mut">Un pico aislado puede ser real (quema, tráfico) o una falla del equipo. No se elimina automáticamente: quien valida decide.</div></details>`:'';
 return{M,nuevas,Ps,names,periodo:`${fdt(h0*H)} a ${fdt(h1*H)}`,html:I.join('')+'<div class="tw">'+T+'</table></div>'+SPH+'<div class="mut">Rojo = requiere revisión (menos de 75 % del periodo, PM2.5 mayor que PM10, series pegadas o diferencias con lo ya cargado). Los valores altos no se corrigen ni se eliminan: se muestran para que la persona que valida decida.</div>'}}
function clima(e){const M=MET[e];let h=-1;if(M)for(let q=END;q>END-6;q--){const w=M.get(q);if(w&&(w.t!=null||w.w!=null||w.r!=null)){h=q;break}}
 if(h<0){$('now').innerHTML='<div class="mut">Esta estación no tiene datos del clima recientes.</div>';return}
 const w=M.get(h),rg=f=>{const v=[];for(let q=h-23;q<=h;q++){const x=M.get(q),y=x?f(x):null;if(y!=null)v.push(y)}return v.length?`últimas 24 h: ${fx(Math.min(...v),1)} a ${fx(Math.max(...v),1)}`:''},
 T=[['Temperatura','°C',w.t,x=>x.t],['Sensación térmica','°C',at(w.t,w.r,w.w),x=>at(x.t,x.r,x.w)],['Humedad relativa','%',w.r,x=>x.r],['Viento','m/s',w.w,x=>x.w]];
 $('now').innerHTML=T.map(([n,u,v,f])=>`<div class="tile"><small>${n}</small><b>${v==null?'—':fx(v,u==='%'?0:1)+' '+u}</b><small>${n==='Viento'&&v!=null&&w.d!=null?'viene del '+DIRS[Math.round(w.d/22.5)%16]+' · ':''}${rg(f)}</small></div>`).join('');
 $('nowt').textContent='Condiciones a las '+lab(h)+(END-h>1?' (último dato disponible)':'')}
const SC={t:['#2c7bb6','#abd9e9','#ffffbf','#fdae61','#d7191c'],h:['#fff7fb','#a6bddb','#3690c0','#034e7b'],w:['#f7fcfd','#99d8c9','#2ca25f','#00441b']},SCK=['t','t','h','w'];
function diu(e){const[h0,h1]=per(),R=mrows(e),d0=Math.floor(h0/24),nd=Math.floor(h1/24)-d0+1;
 VARS.forEach(([nm,fn],k)=>{const cv=$('h'+k),g=Array.from({length:nd},()=>Array(24).fill(null)),vs=[];
  R.forEach(([h,w])=>{const v=fn(w);if(v==null)return;g[Math.floor(h/24)-d0][h%24]=v;vs.push(v)});vs.sort((a,b)=>a-b);
  if(vs.length<24){cv.width=300;cv.height=50;const x=cv.getContext('2d');x.clearRect(0,0,300,50);x.fillStyle='#5b7184';x.font='13px sans-serif';x.fillText('Sin datos suficientes',10,28);$('l'+k).innerHTML='';return}
  const st=SC[SCK[k]],lo=qt(vs,.02),hi=qt(vs,.98),L=36,T=16,cw=Math.max(2,Math.floor(860/nd)),ch=10,W=L+nd*cw+4;
  cv.width=W;cv.height=T+24*ch+4;const x=cv.getContext('2d');x.clearRect(0,0,W,cv.height);
  g.forEach((col,i)=>col.forEach((v,r)=>{x.fillStyle=v==null?'#e6edf2':lerp(st,(v-lo)/((hi-lo)||1));x.fillRect(L+i*cw,T+r*ch,cw,ch)}));
  x.fillStyle='#5b7184';x.font='10px sans-serif';x.textAlign='right';[0,6,12,18,23].forEach(r=>x.fillText(r+':00',L-4,T+r*ch+8));
  x.textAlign='center';const step=Math.max(1,Math.ceil(nd/8));for(let i=0;i<nd;i+=step){const d=new Date((d0+i)*D);x.fillText(d.getUTCDate()+' '+MES[d.getUTCMonth()],L+i*cw+cw/2,T-5)}
  cv.onmousemove=ev=>{const b=cv.getBoundingClientRect(),i=Math.floor(((ev.clientX-b.left)*cv.width/b.width-L)/cw),r=Math.floor(((ev.clientY-b.top)*cv.height/b.height-T)/ch);
   $('t'+k).textContent=i>=0&&i<nd&&r>=0&&r<24?`${fdt((d0+i)*D)} ${r}:00 · ${g[i][r]==null?'sin dato':fx(g[i][r])}`:'\u00a0'};
  $('l'+k).innerHTML=`<div class="hl" style="background:linear-gradient(90deg,${st.join(',')})"></div><div class="hlab"><span>${fx(lo)}</span><span>${fx(hi)}</span></div>`})}
let C3,C4;
function rotulos(e){const[h0,h1]=per(),d0=fdt(Math.max(h0,MINH)*H),d1=fdt(h1*H),t=`${$('sp2').options[$('sp2').selectedIndex].text} · ${d0} a ${d1}`;$('perHW').textContent='('+d0+' a '+d1+')';$('thp').textContent=`PM2.5 promedio de cada hora del día, estación ${e}. Periodo: ${t}.`;$('twp').textContent=`ICA diario promedio de cada día de la semana, estación ${e}. Mismo periodo: ${t}.`}
function hora(e){C3&&C3.destroy();rotulos(e);$('chh').parentElement.style.height='220px';const[h0,h1]=per(),P=Array.from({length:24},()=>[0,0]);if(HR[e])for(const[h,v] of HR[e])if(h>=h0&&h<=h1){const o=P[((h-1)%24+24)%24];o[0]+=v;o[1]++}
 const A=P.map(o=>o[1]>=5?o[0]/o[1]:null),ok=A.map((v,i)=>[v,i]).filter(x=>x[0]!=null);
 if(ok.length<12){$('hs').textContent='Datos insuficientes para este periodo.';$('chh').parentElement.style.height='24px';return}
 const peor=[...ok].sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>x[1]),mx=ok.reduce((p,c)=>c[0]>p[0]?c:p),mn=ok.reduce((p,c)=>c[0]<p[0]?c:p),hh=i=>`${i}:00 a ${i+1}:00`;
 C3=new Chart($('chh'),{type:'bar',data:{labels:A.map((_,i)=>i+'h'),datasets:[{data:A.map(v=>v==null?null:+v.toFixed(1)),backgroundColor:A.map((_,i)=>peor.includes(i)?'#0f2b43':'#1b7fc0'),borderRadius:2}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:c=>hh(c[0].dataIndex),label:c=>`PM2.5 promedio: ${fx(c.parsed.y)} µg/m³`}}},scales:{x:{ticks:{maxTicksLimit:12,maxRotation:0},grid:{display:false}},y:{beginAtZero:true,title:{display:true,text:'PM2.5 promedio (µg/m³)'}}}}});
 $('hs').innerHTML=`Suele estar peor de <b>${hh(mx[1])}</b> (${fx(mx[0])} µg/m³) y mejor de <b>${hh(mn[1])}</b> (${fx(mn[0])} µg/m³). En azul oscuro, las 3 horas más altas.`}
function semana(e){C4&&C4.destroy();$('chw').parentElement.style.height='238px';const[h0,h1]=per(),S=Array.from({length:7},()=>[]);
 if(DAY[e])for(const[dk,d] of DAY[e]){const c=(dk+1)*24;if(d.n<18||c<h0||c>h1)continue;S[(new Date(dk*D).getUTCDay()+6)%7].push(ica(d.s/d.n))}
 const NM=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],A=S.map(a=>a.length>=3?mean(a):null),ok=A.map((v,i)=>[v,i]).filter(x=>x[0]!=null);
 if(ok.length<5){$('ws').textContent='Datos insuficientes para este periodo (se necesitan varias semanas).';$('chw').parentElement.style.height='24px';return}
 const mx=ok.reduce((p,c)=>c[0]>p[0]?c:p),mn=ok.reduce((p,c)=>c[0]<p[0]?c:p);
 C4=new Chart($('chw'),{type:'bar',data:{labels:NM.map(n=>n.slice(0,3)),datasets:[{data:A.map(v=>v==null?null:Math.round(v)),backgroundColor:A.map(v=>v==null?'#ccc':cat(Math.round(v))[2]),borderRadius:3}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:c=>NM[c[0].dataIndex],label:c=>`ICA promedio ${c.parsed.y} · ${S[c.dataIndex].length} días`}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,title:{display:true,text:'ICA promedio del día'}}}}});
 $('ws').innerHTML=`El aire suele ser mejor los <b>${NM[mn[1]].toLowerCase()}</b> (ICA ${Math.round(mn[0])}) y peor los <b>${NM[mx[1]].toLowerCase()}</b> (ICA ${Math.round(mx[0])}). Cada barra es el promedio de todos los ${NM[0].toLowerCase()}, todos los ${NM[1].toLowerCase()}, etc. del periodo (solo días con al menos 18 horas de dato).`}
function stat(){const e=SEL,[h0,h1]=per();clima(e);hora(e);semana(e);diu(e);rose(e);$('snote').textContent=`Periodo de los gráficos: ${fdt(h0*H)} a ${fdt(h1*H)}. Sensación térmica: temperatura aparente de la BOM (Australia) = T + 0,33·e − 0,70·v − 4,00, con e = (HR/100)·6,105·exp(17,27·T/(237,7+T)) y v = viento en m/s.`}
const COLN=['VERDE','AMARILLO','NARANJA','ROJO','PÚRPURA','MARRÓN'];
function icaMini(){$('icam').style.overflowX='auto';$('icam').innerHTML=`<table class="icam"><tr><th colspan="6" class="tt">ÍNDICE CALIDAD DEL AIRE · Capítulo IV Resolución 2254 de 2017</th></tr><tr><th colspan="2">ICA</th><th>COLOR</th><th>CLASIFICACIÓN</th><th colspan="2">PM2.5 24 h µg/m³</th></tr>${BP.map((b,k)=>`<tr style="color:${CAT[k][3]}"><td style="background:${CAT[k][2]}">${b[2]}</td><td style="background:${CAT[k][2]}">${b[3]}</td><td style="background:${CAT[k][2]}">${COLN[k]}</td><td style="background:${CAT[k][2]};text-transform:uppercase">${CAT[k][1]}</td><td class="w">${b[0]}</td><td class="w">${b[1]}</td></tr>`).join('')}</table>`}
const FOTOS={}; // estación -> imagen (data URI); opcional. Normalmente las fotos se declaran en assets/config.js (FOTOS_ESTACIONES)
const slug=e=>e.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,'-');
let MOV=false,DOWN=null; // DOWN: estación donde se presionó (en modo administrador el mapa captura el puntero y el clic llega al mapa, no a la estación)
function cerrarFoto(){$('mdl').hidden=true}
function abrirFoto(e){const n=now(e),l=n.on?n.l:LAST[e],m=n.on?mm(e,n.l):null,src=FOTOS[e]||FOTOS_ESTACIONES[e],c=n.c;
 $('mdf').innerHTML=`<button class="mdx" id="mdx" aria-label="Cerrar">×</button>`;const im=new Image();im.alt='Foto de la estación '+e;
 im.onload=()=>$('mdf').prepend(im);const sinFoto=()=>$('mdf').insertAdjacentHTML('afterbegin',`<div style="padding:20px"><svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#5b7184" stroke-width="1.6"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.6"/></svg><div style="margin-top:6px;font-weight:700">Foto de la estación pendiente</div><div>Se mostrará aquí cuando se cargue</div></div>`);im.onerror=sinFoto;if(src)im.src=src;else sinFoto();
 $('mdb').innerHTML=`<h3>Estación ${e}</h3><div><span style="font-weight:700;color:${n.on?'#2f9e44':'#c62828'}">${n.on?'En línea':'Sin transmisión'}</span>${l!=null?` · último dato: ${lab(l)}`:''}</div>
 <div class="kv"><div>ICA<b><span style="background:${c?c[2]:'#b0bcc6'};color:${c?c[3]:'#fff'};padding:1px 10px;border-radius:7px">${n.i!=null?n.i:'—'}</span> ${c?'<small style="font-size:12px;font-weight:400">'+c[1]+'</small>':''}</b></div><div>Concentración horaria<b>${n.on?fx(HR[e].get(n.l)):'—'} <small style="font-size:11px;font-weight:400">µg/m³</small></b></div><div>Media móvil 24 h<b>${m!=null?fx(m):'—'} <small style="font-size:11px;font-weight:400">µg/m³</small></b></div></div>
 <div class="mut" style="margin-top:10px">Ubicación aproximada en el mapa. El ICA se obtiene de la media móvil de 24 h según la Resolución 2254 de 2017.</div>`;
 $('mdl').hidden=false;sel(e)}
$('mdl').addEventListener('click',ev=>{if(ev.target===$('mdl')||ev.target.id==='mdx')cerrarFoto()});document.addEventListener('keydown',ev=>{if(ev.key==='Escape')cerrarFoto()});
$('map').addEventListener('click',ev=>{if(MOV){MOV=false;DOWN=null;return}const g=ev.target.closest('[data-e]'),e=g?g.dataset.e:DOWN;DOWN=null;if(e)abrirFoto(e)});
let STG=null;
async function showLog(){try{const lg=JSON.parse(await idb('get',null,'log')||'[]');$('logv').innerHTML=lg.length?'<p class="mut" style="margin-bottom:2px"><b>Bitácora de cargas</b></p>'+lg.slice(-6).reverse().map(x=>`<div class="mut">${x.f} · validó: ${x.v} · ${x.a} · ${x.p} · ${x.n.toLocaleString('es-CO')} horas-estación</div>`).join(''):''}catch(_){}}
$('fi').onchange=async ev=>{const fs=[...ev.target.files];ev.target.value='';if(!fs.length)return;const Ps=[],names=[];let msg='';
 for(const f of fs){$('info').textContent=`Leyendo ${f.name} (${(Math.round(f.size/1e5)/10).toLocaleString('es-CO')} MB)…`;await new Promise(r=>setTimeout(r,30));const t=await f.text(),P=parseRep(t);if(P&&P.rows.size){Ps.push(P);names.push(f.name)}else{const n=ingest(t);msg+=n?`${f.name}: CSV simple, ${n} registros cargados sin informe de validación. `:`${f.name}: no se encontraron registros válidos. `}}
 if(msg.includes('cargados')){all();try{await idb('put',csvText());await idb('put',String(Date.now()),'csvts')}catch(_){}}
 if(!Ps.length){$('info').textContent=msg+'Se espera el reporte multiestación del servidor (promedio de 10 minutos o de 1 hora) o el CSV simple.';return}
 const R=vreport(names,Ps);STG={...R,names};$('vbody').innerHTML=R.html;$('vk').checked=false;$('vok').disabled=true;$('vrep').hidden=false;$('info').textContent=msg;$('vrep').scrollIntoView({behavior:'smooth',block:'nearest'})};
$('vn').oninput=$('vk').onchange=()=>{$('vok').disabled=!($('vn').value.trim()&&$('vk').checked)};
$('vaud').onclick=()=>{if(!STG)return;const f=t=>{const d=new Date(t);return `${d.getUTCFullYear()}-${p2(d.getUTCMonth()+1)}-${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`},L=['archivo;estacion;variable;codigo;inicio;fin;registros'];
 STG.Ps.forEach((P,i)=>P.runs.forEach(([e,vn,cd,ts,te,n])=>L.push([STG.names[i],e,vn,cd,f(ts),f(te),n].join(';'))));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+L.join('\n')],{type:'text/csv'}));a.download='auditoria_codigos.csv';a.click()};
$('vno').onclick=()=>{STG=null;$('vrep').hidden=true;$('info').textContent='Carga descartada: no se modificó ningún dato.'};
$('vok').onclick=async()=>{if(!STG)return;const g=STG;STG=null;$('vrep').hidden=true;mergeInto(ROWS,g.M);all();let sv='Guardado en este navegador.';
 try{await idb('put',csvText());await idb('put',String(Date.now()),'csvts');const lg=JSON.parse(await idb('get',null,'log')||'[]');lg.push({f:new Date().toISOString().slice(0,16).replace('T',' '),v:$('vn').value.trim(),a:g.names.join(' + '),p:g.periodo,n:g.M.size});await idb('put',JSON.stringify(lg),'log')}catch(_){sv='No se pudo guardar en este navegador: descargue la base consolidada.'}
 $('src').textContent='Fuente: reportes del SVCA de CORPONOR (promedio horario). Ubicación de estaciones aproximada.';
 $('info').textContent=`Carga validada por ${$('vn').value.trim()}: ${g.M.size.toLocaleString('es-CO')} horas-estación (${g.nuevas.toLocaleString('es-CO')} nuevas). ${sv} Para que no se pierdan, pulse «Descargar base para publicar» y reemplace el archivo datos/historico.js.`;showLog()};
$('clr').onclick=async()=>{try{await idb('del')}catch(_){}try{await idb('del',null,'log')}catch(_){}$('info').textContent='Se borraron los datos y la bitácora guardados en este navegador. Recargue la página para volver a la base publicada.';$('logv').innerHTML=''};
icaMini();demo();$('demobar').hidden=false;all();
(async()=>{let ok=false,base=false;
 try{const b=Uint8Array.from(atob(window.HISTORICO_GZ),c=>c.charCodeAt(0)),t=await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();ROWS.clear();ok=ingest(t)>0;base=ok;if(ok){all();$('src').textContent='Fuente: reportes del SVCA de CORPONOR (promedio horario). Ubicación de estaciones aproximada.'}}catch(_){}
 try{const t=await idb('get'),ts=+(await idb('get',null,'csvts'))||0,bt=window.HISTORICO_TS||0;if(t&&(!bt||ts>bt)&&ingest(t)){ok=true;all()}}catch(_){}showLog();$('demobar').hidden=!!ok;
 if(!base)try{const r=await fetch('datos/historico.csv');if(r.ok){const t=await r.text();if(!ok)ROWS.clear();if(ingest(t)){all();$('src').textContent='Fuente: reportes del SVCA de CORPONOR (promedio horario). Ubicación de estaciones aproximada.'}}}catch(_){}
})();
