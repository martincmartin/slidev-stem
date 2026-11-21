import{C as e,H as t,L as n,O as r,Q as i,T as a,Z as o,_ as s,b as c,g as l,gt as u,p as d,v as f,vt as p,x as m,y as h,z as g}from"./modules/shiki-BdqBXHwB.js";import{n as _,t as v}from"./slidev/context-DpYtgo2-.js";import{$ as y,c as b}from"./index-D0ms_7De.js";import{b as x,h as S,y as C}from"./voyage-yCCgbhAw.js";import{t as w}from"./_plugin-vue_export-helper-BDNMzG2s.js";import{t as T}from"./slidev/default-DUZX6Nft.js";var E=[`viewBox`],D=[`d`],O=[`d`],k=[`x1`,`y1`,`x2`,`y2`],A=[`cx`,`cy`,`r`],j=[`x`],M=42,N=18,P=6,F=24,I=w(e({__name:`NoonSky`,setup(e){let{$slidev:t,$nav:i,$clicksContext:a,$clicks:o,$page:s,$renderContext:c,$frontmatter:p}=_(),[m,v]=b().scene.slide,[w,T]=r(y,null)===null?C.at:S,I=T+24,[L,R]=x.at,{radius:z,lat:B}=x,V=z*Math.cos(B*Math.PI/180),H=[`M${String(L-z)} ${String(R)}`,`A${String(z)} ${String(z)} 0 0 1 ${String(L+z)} ${String(R)}`,`A${String(z)} ${String(V)} 0 0 0 ${String(L-z)} ${String(R)}`,`Z`].join(` `),U=v+N,W=Math.sqrt(M**2-N**2),G=[`M${String(L-W)} ${String(v)}`,`A${String(M)} ${String(M)} 0 0 1 ${String(L+W)} ${String(v)}`,`Z`].join(` `),K=[-34,-17,0,17,34].map(e=>{let t=Math.sqrt(M**2-e**2)+P;return{x:L+e,from:U-t,to:U-t-F}});return(e,t)=>(n(),h(`svg`,{class:`noon-sky in-figure`,viewBox:`0 0 ${u(m)} ${u(v)}`,"aria-hidden":`true`},[f(` in-figure: an article's figure shows it over the picture. `),l(`path`,{class:`noon-night`,d:u(H)},null,8,D),l(`path`,{class:`noon-sun`,d:u(G)},null,8,O),(n(!0),h(d,null,g(u(K),e=>(n(),h(`line`,{key:e.x,class:`noon-ray`,x1:e.x,y1:e.from,x2:e.x,y2:e.to},null,8,k))),128)),f(" no paint: it says where the clock is, on the canvas, so that an article's\n    figure keeps it in its crop (ArticleFigure.vue, `measureLabels`) "),l(`circle`,{cx:u(w),cy:u(T),r:u(C).radius,fill:`none`},null,8,A),l(`text`,{class:`noon-clock-word`,x:u(w),y:I},`Greenwich`,8,j)],8,E))}}),[[`__scopeId`,`data-v-a869ca60`]]),L={class:`noon-sentence side-text`},R={class:`noon-paragraph text-dims after-watch`},z={class:`noon-paragraph text-dims after-watch`},B={class:`noon-paragraph text-dims`},V=w({__name:`slides.md__slidev_16`,setup(e){let{$slidev:r,$nav:d,$clicksContext:g,$clicks:y,$page:b,$renderContext:x,$frontmatter:S}=_();return g.setup(),(e,r)=>{let d=I,g=t(`click`);return n(),s(T,p(a(u(v)(u(S),15))),{default:o(()=>[r[4]||=l(`h1`,null,`Longitude From Time`,-1),r[5]||=l(`p`,null,`Noon comes later`,-1),m(d),l(`div`,L,[r[3]||=l(`div`,{class:`noon-paragraph text-dims`},`Noon at Greenwich, 0°`,-1),i((n(),h(`div`,R,[...r[0]||=[c(`Earth turns 15°/hour`,-1)]])),[[g,1]]),i((n(),h(`div`,z,[...r[1]||=[c(`Noon at ship`,-1),l(`br`,null,null,-1),c(`2 p.m. Greenwich`,-1)]])),[[g,2]]),i((n(),h(`div`,B,[...r[2]||=[c(`Hours × 15° = Longitude`,-1)]])),[[g,3]])]),f(` narration

[figure: A globe from above the Equator, with the Atlantic in the middle and a
meridian every 15 degrees. The Sun is under the globe, and a line runs from the
pole down the meridian through Greenwich. It is noon in Greenwich, and a clock beside
the globe says so. The ship is 30 degrees to the west.]

What does this have to do with watches?  Noon does not come to everyone at once,
which is why we have time zones. The Earth turns toward the east.  When it is
noon at the Royal Observatory in Greenwich, England (the definition of 0°
longitude), a ship 30 degrees to the west has not reached noon yet.

[click]

[figure: The globe has turned by one meridian. The line now runs along the
meridian 15 degrees west of Greenwich. The clock says 1 p.m.]

[click]

The Earth turns a full 360° in 24 hours.  That's 15° per hour, one meridian line
on this globe. Noon has moved 15 degrees west, and it has not reached the ship
yet.

[click]

[figure: The line runs through the ship, and Greenwich is 30 degrees to the east of
it. The clock says 2 p.m.]

A navigator can measure noon at sea: it is when the Sun stands highest. After a
second hour, noon reaches the ship. If the ship carried a watch that keeps
Greenwich's time, at the ship's noon, it reads 2 p.m. Each hour behind Greenwich
is 15 degrees west, so the ship is 30 degrees west.

`)]),_:1},16)}}},[[`__scopeId`,`data-v-f1de0188`]]);export{V as default};