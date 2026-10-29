// Mast portraits: portrait(name, expression, size) -> SVG string. size<=96 simplifies fine linework.
export const CH={
Skipper:{nick:'The Skipper',insp:'Gerald · congreve274',acc:'#2FA3B4',prop:'linen shirt, salt in the beard, the helm, and a gold sax for the good days',tag:'Steady hands. Read the wind.',line:['blunder_when_winning','+{eval}. We\'re in the harbour, lads. Nobody touches the wheel now.']},
Tempo:{nick:'Tempo',insp:'You · Lloydsputin · Final boss',acc:'#FFC857',prop:'drumsticks, headphones round the neck, linen shirt, half-closed eyes',tag:'Never rushed. Never late. Never beaten.',line:['time_trouble','{secs} seconds? Man, I had time for a whole drum fill. Breathe.']},
Tal:{nick:'The Magician',insp:'Mikhail Tal',acc:'#E0563B',prop:'a cigarette held like a wand, eyes glittering',tag:'Into the dark forest.',line:['blunder_when_winning','You were winning, my friend, and then you relaxed. Never relax. Relaxing is for after the handshake.']},
Capablanca:{nick:'The Machine',insp:'José Raúl Capablanca',acc:'#E8D9B5',prop:'white linen suit and a folded handkerchief',tag:'Simplicity is the art.',line:['time_trouble','{secs} seconds for a simple position. The answer was obvious; trust it.']},
Morphy:{nick:'The Pride of New Orleans',insp:'Paul Morphy',acc:'#4FA3C7',prop:"a gentleman's top hat set beside the board",tag:'Develop, sir. Then strike.',line:['fail','{played}, while your pieces are still at home? I fear not. {move}, sir.']},
Carlsen:{nick:'The Grinder',insp:'Magnus Carlsen',acc:'#3FB37F',prop:'hoodie and an energy drink, slouched',tag:'Just improve the worst piece.',line:['blunder_when_winning','You were +{eval}. Don\'t do anything. Just don\'t blunder. That\'s the whole job.']},
Kasparov:{nick:'The Beast of Baku',insp:'Garry Kasparov',acc:'#C23B6E',prop:'a wristwatch he keeps tapping, papers of preparation',tag:'Initiative is everything!',line:['solve','{move}! Yes! This is the critical moment and you found it!']},
Leela:{nick:'Leela',insp:'Leela Chess Zero (Lc0)',acc:'#7C6CFF',prop:'a softly glowing neural lattice where a face would be',tag:'Material is a number. The position is the truth.',line:['missed_mate','Forced mate was available. {played} let it go.']}};
/* outfits: [base, alt1, alt2] per character; alt index stored in localStorage mast.outfit {name:i}. Unlocks in crewstate.js */
export const OUTFITS={
 Skipper:[{n:'Linen & deck shoes',kind:'shirt',jk:'#E4EAE2',jkD:'#9fb0a4',tr:'#C9B48A',trD:'#937f58',shorts:1,roll:1,shoe:'#7a4a26'},
  {n:'Storm jacket',kind:'jacket',jk:'#E9B630',jkD:'#a87814',tr:'#22344a',trD:'#121e2c',shoe:'#2a2a2a'},
  {n:"Captain's reefer",kind:'suit',jk:'#1d2c4a',jkD:'#0e1628',sh:'#F3F1EC',tie:null,tr:'#E8E2D0',trD:'#b0a88e',shoe:'#3a2414',brass:1}],
 Tempo:[{n:'Linen over a white tee',kind:'open',jk:'#DCCDB0',jkD:'#9c8a6c',sh:'#FAFAF6',tr:'#3a4252',trD:'#222833',shoe:'#F2F2EE'},
  {n:'Stage blacks',kind:'open',jk:'#1c1c22',jkD:'#060608',sh:'#34343c',tr:'#121216',trD:'#050506',shoe:'#18181c'},
  {n:'Studio hoodie',kind:'hoodie',jk:'#E8B23C',jkD:'#a57818',tr:'#2b2e38',trD:'#15171c',shoe:'#F2F2EE'}],
 Tal:[{n:'1960s dark suit',kind:'suit',jk:'#2a2a34',jkD:'#131319',sh:'#F3F1EC',tie:'#0c0c10',tr:'#24242c',trD:'#101014',shoe:'#111'},
  {n:'1960 title-match suit',kind:'suit',jk:'#62667a',jkD:'#383b48',sh:'#F3F1EC',tie:'#7a1d2e',tr:'#585c6c',trD:'#30333c',shoe:'#1a1410'},
  {n:'Riga overcoat',kind:'suit',long:1,jk:'#5a4636',jkD:'#33271d',sh:'#F3F1EC',tie:'#0c0c10',tr:'#24242c',trD:'#101014',shoe:'#111'}],
 Capablanca:[{n:'Cream linen suit',kind:'suit',jk:'#F3EBD6',jkD:'#BFAF8C',sh:'#fff',tie:'#B8222C',tr:'#EDE3CA',trD:'#b6a682',shoe:'#6b4423',hk:1},
  {n:'White dinner jacket',kind:'suit',jk:'#FBFAF5',jkD:'#cfcabb',sh:'#fff',tie:'#16161a',bow:1,tr:'#1a1a1e',trD:'#050506',shoe:'#0a0a0a',hk:1},
  {n:'Havana navy blazer',kind:'suit',jk:'#22305a',jkD:'#111a36',sh:'#fff',tie:'#C9A43A',tr:'#EDE3CA',trD:'#b6a682',shoe:'#6b4423',brass:1}],
 Morphy:[{n:'1850s frock coat',kind:'suit',long:1,jk:'#2c3448',jkD:'#141a26',sh:'#F4F1EA',tie:'#17171c',bow:1,tr:'#3a3a3e',trD:'#1c1c20',shoe:'#0c0c0c',vest:'#6b2430'},
  {n:'Opera cloak',kind:'suit',long:1,cloak:'#101016',lining:'#9a1b2c',jk:'#1a1a22',jkD:'#08080c',sh:'#F4F1EA',tie:'#F4F1EA',bow:1,tr:'#16161a',trD:'#050506',shoe:'#0c0c0c'},
  {n:'New Orleans summer',kind:'suit',long:1,jk:'#E9E2CC',jkD:'#b2a888',sh:'#fff',tie:'#2f7fa3',bow:1,tr:'#d8d0b8',trD:'#a49a7c',shoe:'#5a3a1e',vest:'#c9a43a'}],
 Carlsen:[{n:'Hoodie & jeans',kind:'hoodie',jk:'#52637a',jkD:'#2b3646',tr:'#3d5a80',trD:'#22344c',shoe:'#F2F2EE'},
  {n:'Tracksuit',kind:'track',jk:'#1f7a4d',jkD:'#0f4229',tr:'#1f7a4d',trD:'#0f4229',shoe:'#F2F2EE'},
  {n:'Tournament blazer',kind:'suit',jk:'#2b3446',jkD:'#151a24',sh:'#F3F1EC',tie:null,tr:'#3d5a80',trD:'#22344c',shoe:'#7a4a26'}],
 Kasparov:[{n:'80s power suit',kind:'suit',jk:'#2e2b3b',jkD:'#15131c',sh:'#F3F1EC',tie:'#7a1d2e',tr:'#2a2736',trD:'#121018',shoe:'#111',pads:1},
  {n:'1985 blazer',kind:'suit',jk:'#1f2d55',jkD:'#0f1730',sh:'#F3F1EC',tie:'#C23B6E',tr:'#7c7f88',trD:'#4c4f57',shoe:'#111',brass:1,pads:1},
  {n:'Red training sweater',kind:'sweater',jk:'#A3263f',jkD:'#5e1222',sh:'#F3F1EC',tr:'#2a2736',trD:'#121018',shoe:'#111'}],
 Leela:[{n:'Violet lattice',glow:'#7C6CFF',lt:'#B9AFFF'},{n:'Gold lattice',glow:'#E3AE3A',lt:'#FFE38A'},{n:'Ice lattice',glow:'#2FB9D8',lt:'#B8F1FF'}]};
export const outfitIdx=n=>{try{return (JSON.parse(localStorage.getItem('mast.outfit'))||{})[n]|0}catch(e){return 0}};
/* spec for an ALT outfit only (base look is the hand-drawn default); i undefined = stored choice */
export const outfitSpec=(n,i)=>{const k=i==null?outfitIdx(n):i;return k>0&&OUTFITS[n]?OUTFITS[n][k]:null};
export const fill=s=>s.replace('{move}','Bxh7+').replace('{played}','Qd2').replace('{secs}','41').replace('{eval}','3.2');
export const EX=['pleased','disappointed','excited','thinking'];
let uid=0;
/* ---- portrait rig: per-character face geometry + shared feature helpers ---- */
const XP={pleased:{bi:0,bo:0,lid:0,tilt:-3,look:[0,0]},disappointed:{bi:-5,bo:3.5,lid:.3,tilt:6,look:[-.5,1.5]},
 excited:{bi:-6.5,bo:-5,lid:-.35,tilt:-7,look:[0,-.3]},thinking:{bi:2.5,bo:-.5,lid:.22,tilt:6,look:[2.6,-1.8]}};
const PF={// sk=[light,mid,shadow] w/h=face half-width/half-length jaw/chin widths ex=eye offset eye=[w,h] brow=[thick,col,len] nose=[len,wid,hook] mw=mouth half-width lop=smirk
 Skipper:{sk:['#E2AE84','#C48D63','#93603D'],w:31,h:37,jaw:28,chin:13,ex:15,eye:[6.6,3.2],iris:'#5b3a22',lid:.18,brow:[5.6,'#1c1410',11.5],nose:[15,7.5,1],mw:8.5,lop:1.5,hair:'#211712',hl:'#5a4232',lip:'#b8705e',ear:[5.5,9],nw:13},
 Tempo:{sk:['#F7DAC6','#E8B79C','#C98E72'],w:30,h:37,jaw:25,chin:11,ex:14.5,eye:[6.4,3.3],iris:'#6f93a8',lid:.4,brow:[3.4,'#7a5434',10],nose:[13,5.5,0],mw:9,lop:5,hair:'#7d5636',hl:'#c49a68',lip:'#c27866',ear:[8,12],nw:12},
 Tal:{sk:['#EFD5B9','#D2A785','#A57858'],w:26,h:40,jaw:18,chin:8,ex:12.5,eye:[6,3.5],iris:'#2a1a12',lid:.04,brow:[4.4,'#14111a',10],nose:[20,7.5,6],mw:7.5,lop:1,hair:'#16131b',hl:'#5a5068',lip:'#ad6c5b',ear:[5,10],nw:10},
 Capablanca:{sk:['#E8B88F','#CC976F','#9E6B4A'],w:32.5,h:35,jaw:30,chin:15,ex:15,eye:[6.4,3],iris:'#3a2416',lid:.34,brow:[3.6,'#141218',11],nose:[13,5.5,0],mw:10,lop:2,hair:'#121016',hl:'#6a6a84',lip:'#b5695a',ear:[5.5,9],nw:13},
 Morphy:{sk:['#F6DAC4','#E2B598','#BD8A6A'],w:27,h:36,jaw:21,chin:9,ex:13,eye:[5.8,3.1],iris:'#4a3624',lid:.16,brow:[3,'#4e3222',9],nose:[13,4.5,1],mw:7,lop:1,hair:'#563826',hl:'#9a7052',lip:'#c27a6a',ear:[4.5,8.5],nw:11},
 Carlsen:{sk:['#F5D6BE','#DFB295','#BB8A6B'],w:30,h:38,jaw:28,chin:14,ex:14.5,eye:[6,2.9],iris:'#5d8a8f',lid:.3,brow:[3.4,'#7c5a38',10.5],nose:[14,5.5,1],mw:9,lop:2.5,hair:'#9a7246',hl:'#d8b482',lip:'#c07a68',ear:[5.5,9.5],nw:13},
 Kasparov:{sk:['#E9BB96','#CC946E','#99664A'],w:31,h:39,jaw:30,chin:14,ex:14.5,eye:[6.2,3.1],iris:'#2c1b12',lid:.1,brow:[7,'#120f0d',12.5],nose:[17,6.5,3],mw:9.5,lop:0,hair:'#15110f',hl:'#4e4038',lip:'#a9604f',ear:[5.5,9.5],nw:15}};
/* eye boxes for the blink overlay, in % of the 200-unit portrait box */
export const EYE=Object.fromEntries(Object.entries(PF).map(([n,P])=>{const w=P.eye[0]+1.6;return [n,{skin:P.sk[1],lash:'#1d1216',w:2*w/2,y:41.5,h:4.6,xs:[100-P.ex-w,100+P.ex-w].map(x=>x/2),ww:w}]}));
const STP=s=>s.map(([o,c,a=1])=>`<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
const LG=(id,s,x2=0,y2=1)=>`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${STP(s)}</linearGradient>`;
const RG=(id,s,cx=.5,cy=.5,r=.6)=>`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${STP(s)}</radialGradient>`;
const facePath=(w,h,jaw,chin,cy=86)=>{const t=cy-h,b=cy+h;return `M100 ${t}C${100+w*.92} ${t} ${100+w} ${cy-h*.45} ${100+w} ${cy}C${100+w} ${cy+h*.42} ${100+jaw} ${cy+h*.66} ${100+chin} ${b-h*.07}Q100 ${b+2} ${100-chin} ${b-h*.07}C${100-jaw} ${cy+h*.66} ${100-w} ${cy+h*.42} ${100-w} ${cy}C${100-w} ${cy-h*.45} ${100-w*.92} ${t} 100 ${t}Z`};
function eyeSVG(id,x,y,P,lid,look,shut){
 const [w,h]=P.eye,ink='#1d1216';
 if(shut) return `<path d="M${x-w} ${y}Q${x} ${y+h*1.6} ${x+w} ${y}" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${x-w+1} ${y-h-1}Q${x} ${y-h*1.6} ${x+w} ${y-h}" stroke="${ink}" stroke-opacity=".3" stroke-width="1.2" fill="none"/>`;
 lid=Math.max(0,Math.min(.8,lid));const al=`M${x-w} ${y}Q${x} ${y-2.6*h} ${x+w} ${y}Q${x} ${y+2*h} ${x-w} ${y}Z`,ir=h*1.5,ix=x+look[0],iy=y+look[1],lc=y-2.6*h+lid*3.4*h;
 return `<ellipse cx="${x}" cy="${y-h*.6}" rx="${w+2.5}" ry="${h+2}" fill="${P.sk[2]}" opacity=".28"/><clipPath id="${id}"><path d="${al}"/></clipPath><path d="${al}" fill="#f7f1ea"/>
 <g clip-path="url(#${id})"><circle cx="${ix}" cy="${iy}" r="${ir}" fill="${P.iris}"/><circle cx="${ix}" cy="${iy+ir*.3}" r="${ir*.7}" fill="#fff" opacity=".18"/><circle cx="${ix}" cy="${iy}" r="${ir*.48}" fill="#0b0707"/><circle cx="${ix}" cy="${iy}" r="${ir}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width=".9"/><circle cx="${ix-ir*.38}" cy="${iy-ir*.4}" r="${ir*.3}" fill="#fff"/>
 <path d="M${x-w-1} ${y}Q${x} ${y-2.6*h-5} ${x+w+1} ${y}Q${x} ${lc+1.5} ${x-w-1} ${y}Z" fill="#000" opacity=".16"/><path d="M${x-w-1} ${y}Q${x} ${y-2.6*h-5} ${x+w+1} ${y}Q${x} ${lc} ${x-w-1} ${y}Z" fill="${P.sk[1]}"/></g>
 <path d="M${x-w-1.2} ${y+.4}Q${x} ${lc} ${x+w+1.2} ${y-.4}" stroke="${ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M${x+w-1} ${y-.6}l2.4 -1.4" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
 <path d="M${x-w+1} ${y-h-1.5}Q${x} ${y-2.6*h-3+lid*3} ${x+w} ${y-h*.9-1.5}" stroke="${P.sk[2]}" stroke-width="1.2" fill="none"/>`;
}
const browSVG=(x,y,s,P,di,dO)=>{const [th,col,len]=P.brow,xi=x-s*len*.45,xo=x+s*len*.62,yi=y+di,yo=y+dO+1.5,xm=(xi+xo)/2,ym=Math.min(yi,yo)-2.4;
 return `<path d="M${xi} ${yi+th*.5}Q${xm} ${ym-th*.45} ${xo} ${yo}Q${xm} ${ym+th*.6} ${xi} ${yi-th*.5}Z" fill="${col}"/>`};
const noseSVG=(y,P)=>{const [len,wid,hk]=P.nose,t=y+len,x=100,sk=P.sk;
 return `<path d="M${x+2} ${y-3}C${x+3+hk} ${y+len*.35} ${x+wid*.6+hk} ${t-len*.3} ${x+wid*.55+hk*.6} ${t-1}Q${x+wid*.3} ${t+3} ${x} ${t+2.5}Q${x+wid*.4} ${t-1} ${x+wid*.2+hk*.4} ${t-len*.35}C${x+hk*.3} ${t-len*.55} ${x-1} ${y+len*.3} ${x+2} ${y-3}Z" fill="${sk[2]}" opacity=".6"/>
 <path d="M${x+2} ${y-3}C${x+3+hk} ${y+len*.35} ${x+wid*.6+hk} ${t-len*.3} ${x+wid*.55+hk*.6} ${t-1}" stroke="${sk[2]}" stroke-width="1.6" fill="none"/>
 <path d="M${x-wid} ${t-.5}Q${x-wid-1.5} ${t+3.5} ${x-wid*.3} ${t+3.2}M${x+wid+hk*.4} ${t-.5}Q${x+wid+1.5+hk*.4} ${t+3.5} ${x+wid*.3} ${t+3.2}" stroke="${sk[2]}" stroke-width="2" fill="none" stroke-linecap="round"/>
 <ellipse cx="${x-wid*.42}" cy="${t+2.4}" rx="1.9" ry="1.1" fill="#3a1f18" opacity=".65"/><ellipse cx="${x+wid*.42}" cy="${t+2.4}" rx="1.9" ry="1.1" fill="#3a1f18" opacity=".65"/>
 <ellipse cx="${x-1+hk*.3}" cy="${t-2}" rx="${wid*.4}" ry="2.2" fill="#fff" opacity=".3"/><path d="M${x-1.5} ${y+3}L${x-1.2} ${t-6}" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>`};
const mouthSVG=(ex,mx,my,P)=>{const mw=P.mw,lop=P.lop,ink='#5a2422',L=P.lip;
 if(ex==='excited') return `<path d="M${mx-mw-1} ${my-1}Q${mx} ${my+mw*1.35} ${mx+mw+1} ${my-1-lop*.5}Q${mx} ${my+1} ${mx-mw-1} ${my-1}Z" fill="#43121a" stroke="${L}" stroke-width="2.2"/><path d="M${mx-mw+1.5} ${my}Q${mx} ${my+4} ${mx+mw-1.5} ${my-lop*.5}Q${mx} ${my+1.2} ${mx-mw+1.5} ${my}Z" fill="#fff"/><ellipse cx="${mx}" cy="${my+mw*.85}" rx="${mw*.48}" ry="${mw*.22}" fill="#d0646a"/>`;
 const lower=(y,r)=>`<ellipse cx="${mx}" cy="${y}" rx="${r}" ry="2.4" fill="${L}"/><ellipse cx="${mx-1}" cy="${y-.6}" rx="${r*.4}" ry=".9" fill="#fff" opacity=".45"/>`;
 if(ex==='disappointed') return lower(my+4,mw*.45)+`<path d="M${mx-mw*.85} ${my+3.5}Q${mx} ${my-2} ${mx+mw*.85} ${my+3.5-lop*.2}" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
 if(ex==='thinking') return lower(my+3,mw*.35)+`<path d="M${mx-mw*.55} ${my+1.5}Q${mx+mw*.1} ${my+2.8} ${mx+mw*.75} ${my-1.5}" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
 return lower(my+mw*.42+1,mw*.5)+`<path d="M${mx-mw} ${my-1}Q${mx} ${my+mw*.55} ${mx+mw} ${my-1-lop}" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${mx+mw-.5} ${my-2-lop}q2 1 2.5 3" stroke="${P.sk[2]}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
};
const curls=(cx,cy,R,a0,a1,n,rr,col,hl)=>{let s='';for(let i=0;i<n;i++){const a=(a0+(a1-a0)*i/(n-1))*Math.PI/180,x=cx+R*Math.cos(a),y=cy+R*Math.sin(a),r=rr*(.85+.35*((i*37)%7)/7);
 s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${col}"/><path d="M${(x-r*.6).toFixed(1)} ${(y).toFixed(1)}a${(r*.6).toFixed(1)} ${(r*.6).toFixed(1)} 0 0 1 ${(r*1.1).toFixed(1)} ${(-r*.3).toFixed(1)}" stroke="${hl}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`}return s};
const stick=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#7a5a32" stroke-width="7" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="#EACB96" stroke-width="4.6" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="3.2" fill="#F8E8C6"/>`;
const fist=(x,y,r,sk)=>`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-11 -6Q-13 9 -3 12H9Q15 7 13 -6Q9 -12 0 -12Q-8 -12 -11 -6Z" fill="${sk[1]}" stroke="${sk[2]}" stroke-width="1.5"/><path d="M-6 -11V-3M0 -12V-3M6 -11V-3" stroke="${sk[2]}" stroke-width="1.4" stroke-linecap="round"/><path d="M-9 -4Q-6 -9 -2 -8" stroke="${sk[0]}" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
const smoke=(x,y,o=.55)=>`<g class="smk"><path d="M${x} ${y}q-7-8 0-15t0-15q-6-7 2-14" stroke="#fff" stroke-opacity="${o}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${x+3} ${y-6}q6-6 0-12" stroke="#fff" stroke-opacity="${o*.6}" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
export function portrait(name,ex,size=200,opt={}){
 const sm=size<=96,OV=outfitSpec(name,opt.outfit);
 const c=CH[name],id='p'+(uid++),A=c.acc;
 let defs=`<clipPath id="${id}"><circle cx="100" cy="100" r="90"/></clipPath>`;
 let back=`<circle cx="100" cy="100" r="96" fill="${A}"/><circle cx="100" cy="100" r="96" fill="url(#${id}g)"/>`;
 defs+=`<radialGradient id="${id}g" cx=".5" cy=".15" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient>`;
 let body='';
 if(name==='Leela'){
  if(opt.head) return null;
  const g={pleased:.9,disappointed:.35,excited:1.3,thinking:.7}[ex];
  const nodes=[[100,60],[70,80],[130,80],[55,112],[100,100],[145,112],[80,140],[120,140],[100,170]];
  const edges=[[0,1],[0,2],[1,4],[2,4],[0,4],[1,3],[2,5],[3,4],[4,5],[3,6],[5,7],[4,6],[4,7],[6,8],[7,8],[6,7]];
  body=`<defs><radialGradient id="${id}o"><stop offset="0" stop-color="#fff" stop-opacity="${.9*g}"/><stop offset=".35" stop-color="#B9AFFF" stop-opacity="${.7*g}"/><stop offset="1" stop-color="#7C6CFF" stop-opacity="0"/></radialGradient></defs>
  <path d="M30 200q4-42 40-52h60q36 10 40 52z" fill="#1c1840"/><path d="M70 148h60l-8 20h-44z" fill="#2b2563"/>
  <circle cx="100" cy="102" r="${58+g*10}" fill="url(#${id}o)"/>
  <g class="lat"><g stroke="#E4DFFF" stroke-width="1.8" stroke-opacity=".8">${edges.map(([a,b])=>`<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}"/>`).join('')}</g>
  ${nodes.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${ex==='excited'?5.5:ex==='disappointed'?3:4.2}" fill="#fff"/>`).join('')}</g>
  ${ex==='thinking'?`<circle cx="100" cy="100" r="62" fill="none" stroke="#fff" stroke-opacity=".5"/><circle cx="100" cy="100" r="78" fill="none" stroke="#fff" stroke-opacity=".25"/>`:''}
  ${ex==='excited'?`<circle cx="100" cy="100" r="70" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>`:''}`;
 } else {
  const P=PF[name],X=XP[ex],sk=P.sk,cy=86,ey=88,by=ey-9.5,nt=ey+P.nose[0],my=Math.max(cy+P.h*.66,nt+8),fp=facePath(P.w,P.h,P.jaw,P.chin,cy);
  let lid=P.lid+X.lid,look=X.look,shut=false,tilt=X.tilt,bi=X.bi,bo=X.bo;
  if(name==='Tempo') lid=Math.max(.2,Math.min(.62,lid));
  if(name==='Skipper'&&ex==='excited') shut=true;
  if(name==='Skipper'&&ex==='thinking') lid=.5;
  if(name==='Carlsen'&&ex==='disappointed'){look=[1.5,-2.6];lid=.42}
  if(name==='Tal'&&ex!=='disappointed') lid=Math.min(lid,.08);
  if(name==='Kasparov'&&ex==='thinking'){bi=4;bo=1}
  defs+=RG(id+'s',[[0,sk[0]],[.55,sk[1]],[1,sk[2]]],.38,.38,.75)+LG(id+'h',[[0,P.hl],[.55,P.hair],[1,P.hair]])+`<clipPath id="${id}f"><path d="${fp}"/></clipPath>`;
  const torsoD='M8 212Q12 150 66 140L100 152L134 140Q188 150 192 212Z';
  const torso=(col,dk)=>{if(OV&&OV.jk){col=OV.jk;dk=OV.jkD}defs+=LG(id+'t',[[0,col],[.45,col],[1,dk]],1,0);return `<path d="${torsoD}" fill="${A}" transform="translate(-3 -2)"/><path d="${torsoD}" fill="url(#${id}t)"/><path d="M40 170q8 14 6 40M160 168q-8 16-6 42" stroke="${dk}" stroke-width="2.5" fill="none" opacity=".7"/>`};
  const suit=(col,dk,tie,tw)=>(OV&&OV.jk&&(col=OV.jk,dk=OV.jkD,tie=OV.tie===undefined?tie:OV.tie),torso(col,dk))+`<path d="M82 140L100 160L118 140L114 212H86Z" fill="#F3F1EC"/><path d="M82 140L100 160L118 140" stroke="#c9c6c0" stroke-width="2" fill="none"/>`+(tie?`<path d="M${100-tw} 155h${2*tw}l2 5-${2+tw*.4} 52H${100-tw*.6}l-${2+tw*.4}-52z" fill="${tie}"/><path d="M${100-tw} 155h${2*tw}l-${tw*.5} 6h-${tw}z" fill="#000" opacity=".3"/>`:'')
   +`<path d="M66 141L92 168L84 212H54Q56 168 66 141Z" fill="${col}"/><path d="M134 141L108 168L116 212H146Q144 168 134 141Z" fill="${dk}"/><path d="M66 141L92 168L80 176L74 160Z" fill="#000" opacity=".18"/><path d="M134 141L108 168L120 176L126 160Z" fill="#000" opacity=".28"/>`;
  let bg='',T='',hair='',over='',fore='',prop='';
  const neck=`<path d="M${100-P.nw} 104V146Q100 158 ${100+P.nw} 146V104Z" fill="${sk[1]}"/><path d="M${100-P.nw} 120Q100 ${cy+P.h+12} ${100+P.nw} 120V104H${100-P.nw}Z" fill="${sk[2]}" opacity=".75"/>`;
  if(name==='Skipper'){
   defs+=LG(id+'k',[[0,A],[.45,'#9fc3c0'],[.62,'#F2A65A'],[.78,'#E8705C'],[.79,'#1f5d6c'],[1,'#123c48']]);
   let sp='';for(let a=0;a<8;a++)sp+=`<path d="M100 150v-78" transform="rotate(${a*45+22} 100 150)"/>`;
   bg=`<rect width="200" height="200" fill="url(#${id}k)"/><circle cx="150" cy="150" r="16" fill="#FFD58A" opacity=".85"/><path d="M110 160h60M126 166h34" stroke="#FFD58A" stroke-opacity=".5" stroke-width="2"/>
    <g stroke-linecap="round" fill="none"><g stroke="#5a3418" stroke-width="7">${sp}</g><circle cx="100" cy="150" r="62" stroke="#6b3e1e" stroke-width="10"/><circle cx="100" cy="150" r="62" stroke="#b07a44" stroke-width="3" stroke-dasharray="40 30"/></g>`;
   T=torso('#C3CEC4','#7f8f86')+`<path d="M82 140L100 178L118 140Z" fill="${sk[1]}"/><path d="M90 150q4 4 2 8m10-6q-3 4 0 8m-6 6q3 3 0 6" stroke="#2a1c14" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M68 140L96 170L88 140Z" fill="#E1E8E1"/><path d="M132 140L104 170L112 140Z" fill="#AFBDB2"/><path d="M98 182v30" stroke="#8f9e94" stroke-width="2"/>`;
   hair=`<path d="M64 94Q56 60 72 44Q90 26 112 30Q140 34 142 64Q144 80 137 94Q135 76 128 66L120 70Q112 58 100 60Q88 58 80 70L72 66Q66 78 64 94Z" fill="url(#${id}h)"/>`+curls(100,64,34,175,365,13,9.5,P.hair,P.hl)+curls(100,58,22,200,340,6,8,P.hair,P.hl);
   const beard=`M67 88Q66 122 80 142Q92 158 100 158Q108 158 120 142Q134 122 133 88Q130 104 121 108Q111 102 100 103Q89 102 79 108Q70 104 67 88Z`;
   over=`<path d="${beard}" fill="url(#${id}h)"/>`+curls(100,112,36,30,150,9,7,P.hair,P.hl)+`<path d="M78 120q4 6 2 12M92 132q3 5 0 10M112 130q-3 6 0 11M124 118q-4 6-2 12" stroke="${P.hl}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    +(ex==='excited'?'':`<path d="M${100-P.mw-2} ${my-3}Q100 ${my+7} ${100+P.mw+2} ${my-3}Q100 ${my+1} ${100-P.mw-2} ${my-3}Z" fill="${sk[1]}"/>`)+`<path d="M82 ${my-4}Q92 ${my-12} 100 ${my-7}Q108 ${my-12} 118 ${my-4}Q108 ${my-3} 100 ${my-4}Q92 ${my-3} 82 ${my-4}Z" fill="${P.hair}"/><path d="M88 ${my-8}q6-2 10 0M104 ${my-8}q6-2 10 0" stroke="${P.hl}" stroke-width="1.2" fill="none"/>`;
   if(ex==='excited'){defs+=LG(id+'x',[[0,'#FFE38A'],[.5,'#E3AE3A'],[1,'#94661a']],1,0);
    over+=`<g><path d="M100 ${my-1}Q118 ${my} 126 128" stroke="#94661a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M100 ${my-1}Q118 ${my} 126 128" stroke="#F2CB62" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="94" y="${my-4}" width="9" height="6" rx="2" fill="#222"/>
     <path d="M124 126Q140 132 140 150L141 182Q142 204 122 205Q102 205 104 186" stroke="url(#${id}x)" stroke-width="15" fill="none" stroke-linecap="round"/><ellipse cx="104" cy="182" rx="11" ry="6" fill="#94661a" transform="rotate(-20 104 182)"/><ellipse cx="104" cy="181" rx="8" ry="3.5" fill="#3a2608" transform="rotate(-20 104 181)"/>
     <g fill="#FFF3C4" stroke="#94661a" stroke-width="1.2">${[148,160,172].map(y=>`<circle cx="141" cy="${y}" r="3.2"/>`).join('')}</g></g>`;
    prop=`<g fill="#fff" font-family="serif"><text x="30" y="74" font-size="26">♪</text><text x="44" y="104" font-size="18" opacity=".8">♫</text><text x="160" y="66" font-size="20" opacity=".85">♪</text></g>`}
   if(ex==='disappointed') prop=fist(76,150,-20,sk);
  }
  if(name==='Tempo'){
   T=torso('#DCCDB0','#9c8a6c')+`<path d="M80 141Q100 160 120 141L118 212H82Z" fill="#FAFAF6"/><path d="M80 141Q100 160 120 141" stroke="#d6d4cc" stroke-width="3" fill="none"/><path d="M66 141L88 150L94 212H56Q58 168 66 141Z" fill="#E6D8BC"/><path d="M134 141L112 150L106 212H144Q142 168 134 141Z" fill="#B8A684"/><path d="M68 142L86 150L80 162Z" fill="#000" opacity=".12"/>`
    +`<path d="M68 146Q100 176 132 146" stroke="#1f2026" stroke-width="7" fill="none"/><g fill="#26272e"><ellipse cx="66" cy="146" rx="10" ry="12"/><ellipse cx="134" cy="146" rx="10" ry="12"/></g><g fill="none" stroke="${A}" stroke-width="2.5"><ellipse cx="66" cy="146" rx="6" ry="8"/><ellipse cx="134" cy="146" rx="6" ry="8"/></g>`;
   hair=`<path d="M68 86Q62 56 76 42Q92 26 116 30Q138 34 138 56Q139 72 133 86Q130 66 118 60Q100 55 84 61Q72 68 68 86Z" fill="url(#${id}h)"/><path d="M76 50Q84 20 116 22Q138 26 138 46Q122 32 100 36Q86 38 76 50Z" fill="#9b6f48"/><path d="M80 46Q94 28 118 28Q132 30 134 40M86 42Q100 32 120 34M90 52Q104 42 126 44" stroke="${P.hl}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
   defs+=LG(id+'p',[[0,'#6b4023',0],[.45,'#6b4023',.28],[1,'#6b4023',.62]]);
   const sb=`M70 94Q71 122 84 138Q92 146 100 147Q108 146 116 138Q129 122 130 94Q126 108 118 112Q110 106 100 106Q90 106 82 112Q74 108 70 94Z`;
   over=`<ellipse cx="80" cy="102" rx="8" ry="5" fill="#ef8f7c" opacity=".35"/><ellipse cx="120" cy="102" rx="8" ry="5" fill="#ef8f7c" opacity=".35"/><path d="${sb}" fill="url(#${id}p)"/>${sm?'':`<path d="M82 128q6 5 12 6M118 128q-6 5-12 6M96 118q4 3 8 0" stroke="#6b4023" stroke-width="1.2" stroke-opacity=".35" fill="none" stroke-linecap="round"/>`}<path d="M86 ${my-4}Q100 ${my-9} 114 ${my-4-P.lop*.4}" stroke="#a86d44" stroke-width="3.5" fill="none" opacity=".7" stroke-linecap="round"/>`;
   if(ex==='excited'){prop=stick(48,170,30,96)+stick(152,170,170,96)+fist(48,170,-15,sk)+fist(152,170,15,sk)+`<path d="M22 84l-8-6M30 78l-2-10M178 84l8-6M170 78l2-10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`}
   else if(ex==='thinking'){prop=stick(150,186,108,128)+fist(150,184,-30,sk)}
   else if(ex==='pleased'){prop=stick(140,200,166,132)+fist(144,186,10,sk)+`<path d="M152 120a18 18 0 0 1 28 10" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/><text x="38" y="66" font-size="16" fill="#fff" opacity=".8" font-family="Oswald,sans-serif">z</text>`}
   else prop=stick(52,206,74,140)+stick(60,208,86,142);
  }
  if(name==='Tal'){
   T=suit('#2a2a34','#131319','#0c0c10',3.2);
   hair=`<path d="M70 88Q56 54 70 34Q88 12 120 18Q150 26 142 62Q140 76 133 88Q131 68 119 55Q101 46 85 56Q74 66 70 88Z" fill="url(#${id}h)"/><path d="M84 54Q96 30 128 24" stroke="${P.hl}" stroke-width="${sm?3:2.4}" fill="none" stroke-linecap="round" opacity=".8"/>`+(sm?'':`<path d="M78 60Q88 34 112 26" stroke="${P.hl}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>`);
   over=sm?'':`<path d="M77 98q4 12 10 16M123 98q-4 12-10 16" stroke="${sk[2]}" stroke-width="2" fill="none" opacity=".3" stroke-linecap="round"/>`;
   if(ex==='thinking'){over+=`<path d="M${100+P.mw-2} ${my}l20 6" stroke="#F4F2EC" stroke-width="3.6" stroke-linecap="round"/><circle cx="${100+P.mw+19}" cy="${my+6}" r="2.2" fill="#ff7a2d"/>`;prop=smoke(132,100)}
   else{const hy=ex==='excited'?132:ex==='disappointed'?168:150;prop=`<path d="M150 ${hy+6}l-22-${ex==='disappointed'?2:14}" stroke="#F4F2EC" stroke-width="3.6" stroke-linecap="round"/><circle cx="${128}" cy="${hy+6-(ex==='disappointed'?2:14)}" r="2.2" fill="#ff7a2d"/>`+fist(152,hy+10,20,sk)+smoke(126,hy-10,ex==='disappointed'?.3:.6)+`<path d="M152 ${hy+22}L160 212H190Z" fill="#20202a"/>`}
   if(ex==='excited') over+=`<path d="M84 76l-3-4M116 76l3-4" stroke="#fff" stroke-width="1.6"/>`;
  }
  if(name==='Capablanca'){
   back=`<circle cx="100" cy="100" r="96" fill="${A}"/><circle cx="100" cy="100" r="96" fill="url(#${id}g)"/><circle cx="100" cy="100" r="90" fill="url(#${id}d)"/>`;
   defs+=RG(id+'d',[[0,'#6a5236'],[.7,'#3a2a1c'],[1,'#22180f']],.5,.3,.8)+LG(id+'c',[[0,'#a8743e'],[.5,'#6e4420'],[1,'#3e240e']]);
   T=suit('#F3EBD6','#BFAF8C','#B8222C',5.5)+`<path d="M124 168l14-4 3 9-15 3z" fill="#fff"/><path d="M126 166l3-6 3 5 3-6 3 6" fill="#fff"/><path d="M60 180q10-4 16 6M140 190q-8-6-14 0" stroke="#a8987a" stroke-width="2" fill="none"/>`;
   hair=`<path d="M67 90Q54 52 76 34Q92 24 100 30L100 52Q88 54 80 62Q72 72 67 90Z" fill="url(#${id}h)"/><path d="M133 90Q146 52 124 34Q108 24 100 30L100 52Q112 54 120 62Q128 72 133 90Z" fill="url(#${id}h)"/><path d="M100 30L100 53" stroke="${sk[1]}" stroke-width="${sm?1.6:1.2}" opacity=".9"/><path d="M76 52Q84 38 96 36M124 52Q116 38 104 36" stroke="#9a9ab8" stroke-width="${sm?3:2.4}" fill="none" stroke-linecap="round" opacity=".6"/>`;
   const cig=(x,y,a)=>`<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 -3L26 -4Q28 0 26 4L0 3Q-2 0 0 -3Z" fill="url(#${id}c)"/><rect x="5" y="-3.6" width="4" height="7.2" fill="#D9B04A"/><path d="M26 -4h4v8h-4z" fill="#b8b2a8"/><circle cx="31" cy="0" r="1.6" fill="#ff7a2d"/></g>`+smoke(x+28*Math.cos(a*Math.PI/180),y+28*Math.sin(a*Math.PI/180)-4,.5);
   if(ex==='excited') prop=fist(150,166,10,sk)+cig(146,156,-50);
   else over=cig(100+P.mw-3,my+1,ex==='disappointed'?40:16);
  }
  if(name==='Morphy'){
   T=torso('#2c3448','#141a26')+`<path d="M84 138L80 122L98 142ZM116 138L120 122L102 142Z" fill="#fff"/><path d="M84 140H116L112 166H88Z" fill="#F4F1EA"/><path d="M86 142Q100 150 114 142L110 154Q100 158 90 154Z" fill="#17171c"/><path d="M92 148l8 4 8-4-8-4z" fill="#22222a"/><circle cx="100" cy="160" r="2.4" fill="${A}"/><path d="M66 141L90 164L82 212H54Q56 168 66 141ZM134 141L110 164L118 212H146Q144 168 134 141Z" fill="#232a3c"/><path d="M66 141L90 164L80 170Z" fill="#000" opacity=".25"/>`;
   hair=`<path d="M70 88Q64 62 78 54L124 52Q136 62 130 88Q127 70 118 66Q100 68 84 60Q74 70 70 88Z" fill="url(#${id}h)"/><path d="M76 62Q92 66 106 56" stroke="${P.hl}" stroke-width="2" fill="none"/>`;
   over=`<path d="M92 ${my-4}Q96 ${my-7} 100 ${my-5}Q104 ${my-7} 108 ${my-4}Q104 ${my-3} 100 ${my-4}Q96 ${my-3} 92 ${my-4}Z" fill="${P.hair}"/>`;
   defs+=LG(id+'o',[[0,'#3a3f4e'],[.3,'#1a1d26'],[1,'#07080c']],1,0);
   const up=ex==='excited';
   over+=`<g transform="${up?'translate(18 -14) rotate(14 100 56)':'rotate(-5 100 56)'}"><path d="M70 14Q100 8 130 14L126 54H74Z" fill="url(#${id}o)"/><path d="M74 44H126L125 54H75Z" fill="${A}"/><path d="M80 18L82 42" stroke="#fff" stroke-opacity=".25" stroke-width="3"/><path d="M52 58Q100 44 148 58Q150 64 140 62Q100 54 60 62Q50 64 52 58Z" fill="#0c0e14"/><path d="M58 59Q100 49 142 59" stroke="#4a5068" stroke-width="1.4" fill="none"/></g>`;
   if(up) prop=fist(150,62,30,sk);
  }
  if(name==='Carlsen'){
   T=`<g transform="rotate(3 100 200)">`+torso('#52637a','#2b3646')+`<path d="M58 146Q100 118 142 146Q134 164 100 164Q66 164 58 146Z" fill="#3c4a5c"/><path d="M70 148Q100 136 130 148Q120 158 100 158Q80 158 70 148Z" fill="#232c38"/><path d="M90 158v34M110 158v34" stroke="#dfe6ec" stroke-width="2.4" stroke-linecap="round"/><circle cx="90" cy="193" r="2.6" fill="#dfe6ec"/><circle cx="110" cy="193" r="2.6" fill="#dfe6ec"/></g>`;
   hair=`<path d="M66 88Q58 56 76 42Q94 28 116 32Q140 38 136 66L134 88Q130 72 124 64L119 72L112 60L104 70L96 58L88 70L80 62Q70 72 66 88Z" fill="url(#${id}h)"/><path d="M78 44l-8-8 12 2M96 34l-2-10 8 8M114 34l8-8-2 10M128 44l10-4-6 9" fill="${P.hair}" stroke="${P.hair}" stroke-width="3" stroke-linejoin="round"/><path d="M80 52q10-10 22-8M106 42q12 0 20 10" stroke="${P.hl}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
   defs+=LG(id+'n',[[0,'#7fe0a8'],[.4,'#2fbf71'],[1,'#126b3c']],1,0);
   const cx=ex==='excited'?146:150,cyy=ex==='excited'?116:150;
   prop=`<g transform="translate(${cx} ${cyy}) rotate(${ex==='excited'?-12:8})"><rect x="0" y="0" width="22" height="42" rx="4" fill="url(#${id}n)"/><rect x="0" y="14" width="22" height="10" fill="#0d3b25"/><path d="M4 18l6 3 4-4 4 3" stroke="${A}" stroke-width="1.6" fill="none"/><rect x="2" y="-3" width="18" height="5" rx="2" fill="#c3c8d0"/></g>`+fist(cx+6,cyy+32,0,sk)+(ex==='excited'?`<g fill="#9ff0c4"><circle cx="150" cy="104" r="2"/><circle cx="162" cy="98" r="2.6"/><circle cx="168" cy="108" r="1.6"/></g>`:'');
  }
  if(name==='Kasparov'){
   T=suit('#2e2b3b','#15131c','#7a1d2e',6.5);
   hair=`<path d="M64 92Q56 56 74 42Q92 28 114 32Q140 38 140 66Q140 82 136 92Q134 74 122 68Q104 62 84 66Q70 72 64 92Z" fill="url(#${id}h)"/>`+curls(100,66,36,170,370,15,8,P.hair,P.hl)+curls(100,56,22,200,340,6,7,P.hair,P.hl);
   over=`<path d="M86 ${by+6}q4-4 0-8M114 ${by+6}q-4-4 0-8" stroke="${sk[2]}" stroke-width="1.4" fill="none" opacity="${ex==='thinking'||ex==='disappointed'?.8:0}"/>`;
   const wx=ex==='excited'?150:ex==='disappointed'?122:148,wy=ex==='excited'?92:ex==='disappointed'?70:150;
   const arm=`<path d="M200 212Q172 ${wy+70} ${wx+8} ${wy+16}L${wx+24} ${wy+28}Q186 ${wy+80} 212 212Z" fill="#26232f"/><path d="M${wx+4} ${wy+12}l18 12" stroke="#f0f0f4" stroke-width="5"/>`;
   const watch=`<g transform="translate(${wx+12} ${wy+18}) rotate(35)"><rect x="-4" y="-11" width="8" height="22" fill="#2a1a10"/><circle r="6.5" fill="#E2C46A" stroke="#8a6a20" stroke-width="1.6"/><circle r="4.4" fill="#fbfaf4"/><path d="M0 0V-3.4M0 0l2.4 1.4" stroke="#222" stroke-width="1.1"/></g>`;
   prop=arm+fist(wx,wy,ex==='disappointed'?-60:-10,sk)+watch+(ex==='excited'?`<path d="M164 44l8-10M178 60l12-2M148 40l0-12" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`:'')+(ex==='thinking'?`<path d="M178 132l8-4M180 144h9" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`:'');
   if(ex==='disappointed') tilt=8;
  }
  const ear=s=>{const x=100+s*(P.w-1),[rx,ry]=P.ear;return `<ellipse cx="${x+s*rx*.5}" cy="${cy+5}" rx="${rx}" ry="${ry}" fill="${sk[1]}"/><path d="M${x+s*rx*.9} ${cy-1}q${s*-3} 6 0 12" stroke="${sk[2]}" stroke-width="2" fill="none" stroke-linecap="round"/>`};
  const face=`<path d="${fp}" fill="${A}" transform="translate(-2.6 -.6)"/><path d="${fp}" fill="url(#${id}s)"/><g clip-path="url(#${id}f)"><ellipse cx="${100+P.w*.95}" cy="${cy+12}" rx="${P.w*.42}" ry="${P.h*1.05}" fill="${sk[2]}" opacity=".45"/><ellipse cx="100" cy="${cy+P.h+4}" rx="${P.jaw}" ry="7" fill="${sk[2]}" opacity=".35"/><ellipse cx="${100-P.w*.5}" cy="${cy+8}" rx="7" ry="5" fill="#fff" opacity=".14"/></g>`;
  const L=X,lb=name==='Kasparov'&&ex==='thinking'?[4,1]:ex==='thinking'?[-7,-5]:[bi,bo],rb=ex==='thinking'?[2.5,-.5]:[bi,bo];
  const feats=eyeSVG(id+'l',100-P.ex,ey,P,lid,look,shut)+eyeSVG(id+'r',100+P.ex,ey,P,lid,look,shut)+browSVG(100-P.ex,by,-1,P,...lb)+browSVG(100+P.ex,by,1,P,...rb)+noseSVG(ey,P)+(name==='Skipper'?'':mouthSVG(ex,100,my,P));
  const head=`<g transform="rotate(${tilt} 100 128) translate(100 132) scale(1.1) translate(-100 -132)">${ear(-1)+ear(1)+face+feats+hair+over+(name==='Skipper'&&ex!=='excited'?mouthSVG(ex,100,my,P):'')}</g>`;
  if(opt.head) return {defs,head,P,A};
  body=bg+T+neck+head+prop;
 }
 if(name==='Leela'&&OV) body=body.replaceAll('#7C6CFF',OV.glow).replaceAll('#B9AFFF',OV.lt);
 return `<svg viewBox="0 0 200 200" role="img" aria-label="${name} ${ex}"><defs>${defs}</defs>${back}<g clip-path="url(#${id})">${body}</g><circle cx="100" cy="100" r="96" fill="none" stroke="#fff" stroke-width="5"/></svg>`;
}

