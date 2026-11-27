import{C as e,H as t,L as n,O as r,Q as i,T as a,Z as o,_ as s,b as c,g as l,gt as u,p as d,v as f,vt as p,x as m,y as h,z as g}from"./modules/shiki-BdqBXHwB.js";import{Bt as _,c as v,fn as y,lt as b,mr as x,mt as S,pn as C,pt as w,tn as T}from"./index-D_873o8a.js";import{t as E}from"./slidev/default-_UvZb0bD.js";var D=[`viewBox`],O=[`d`],k=[`d`],A=[`x1`,`y1`,`x2`,`y2`],j=[`cx`,`cy`,`r`],M=[`x`],N=42,P=18,F=6,I=24,L=x(e({__name:`NoonSky`,setup(e){let{$slidev:t,$nav:i,$clicksContext:a,$clicks:o,$page:s,$renderContext:c,$frontmatter:p}=C(),[m,y]=v().scene.slide,[x,E]=r(T,null)===null?w.at:b,L=E+24,[R,z]=S.at,{radius:B,lat:V}=S,H=B*Math.cos(_(V)),U=[`M${String(R-B)} ${String(z)}`,`A${String(B)} ${String(B)} 0 0 1 ${String(R+B)} ${String(z)}`,`A${String(B)} ${String(H)} 0 0 0 ${String(R-B)} ${String(z)}`,`Z`].join(` `),W=y+P,G=Math.sqrt(N**2-P**2),K=[`M${String(R-G)} ${String(y)}`,`A${String(N)} ${String(N)} 0 0 1 ${String(R+G)} ${String(y)}`,`Z`].join(` `),q=[-34,-17,0,17,34].map(e=>{let t=Math.sqrt(N**2-e**2)+F;return{x:R+e,from:W-t,to:W-t-I}});return(e,t)=>(n(),h(`svg`,{class:`noon-sky in-figure`,viewBox:`0 0 ${u(m)} ${u(y)}`,"aria-hidden":`true`},[f(` in-figure: an article's figure shows it over the picture. `),l(`path`,{class:`noon-night`,d:u(U)},null,8,O),l(`path`,{class:`noon-sun`,d:u(K)},null,8,k),(n(!0),h(d,null,g(u(q),e=>(n(),h(`line`,{key:e.x,class:`noon-ray`,x1:e.x,y1:e.from,x2:e.x,y2:e.to},null,8,A))),128)),f(" no paint: it says where the clock is, on the canvas, so that an article's\n    figure keeps it in its crop (ArticleFigure.vue, `measureLabels`) "),l(`circle`,{cx:u(x),cy:u(E),r:u(w).radius,fill:`none`},null,8,j),l(`text`,{class:`noon-clock-word`,x:u(x),y:L},`Greenwich`,8,M)],8,D))}}),[[`__scopeId`,`data-v-29a66626`]]),R={class:`noon-sentence side-text`},z={class:`noon-paragraph text-dims after-watch`},B={class:`noon-paragraph text-dims after-watch`},V={class:`noon-paragraph text-dims`},H=x({__name:`slides.md__slidev_16`,setup(e){let{$slidev:r,$nav:d,$clicksContext:g,$clicks:_,$page:v,$renderContext:b,$frontmatter:x}=C();return g.setup(),(e,r)=>{let d=L,g=t(`click`);return n(),s(E,p(a(u(y)(u(x),15))),{default:o(()=>[r[4]||=l(`h1`,null,`Longitude From Time`,-1),r[5]||=l(`p`,null,`Noon comes later`,-1),m(d),l(`div`,R,[r[3]||=l(`div`,{class:`noon-paragraph text-dims`},`Noon at Greenwich, 0°`,-1),i((n(),h(`div`,z,[...r[0]||=[c(`Earth turns 15°/hour`,-1)]])),[[g,1]]),i((n(),h(`div`,B,[...r[1]||=[c(`Noon at ship`,-1),l(`br`,null,null,-1),c(`2 p.m. Greenwich`,-1)]])),[[g,2]]),i((n(),h(`div`,V,[...r[2]||=[c(`Hours × 15° = Longitude`,-1)]])),[[g,3]])]),f(` narration

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

`)]),_:1},16)}}},[[`__scopeId`,`data-v-f1de0188`]]);export{H as default};
//# sourceMappingURL=md-z1WgbKoA.js.map