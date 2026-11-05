import{C as e,H as t,L as n,Q as r,T as i,Z as a,_ as o,b as s,g as c,gt as l,p as u,v as d,vt as f,x as p,y as m,z as h}from"./modules/shiki-h-A-1wb4.js";import{Sn as g,_,bt as v,o as y,v as b,xt as x}from"./index-LrLKqFR9.js";import{t as S}from"./slidev/default-CdWacsWo.js";var C=[`viewBox`],w=[`d`],T=[`d`],E=[`x1`,`y1`,`x2`,`y2`],D=[`cx`,`cy`,`r`],O=[`x`],k=42,A=18,j=6,M=24,N=g(e({__name:`NoonSky`,setup(e){let{$slidev:t,$nav:r,$clicksContext:i,$clicks:a,$page:o,$renderContext:s,$frontmatter:f}=x(),[p,g]=y.scene.slide,v=_.at[0],S=_.at[1]+24,[N,P]=b.at,{radius:F,lat:I}=b,L=F*Math.cos(I*Math.PI/180),R=[`M${String(N-F)} ${String(P)}`,`A${String(F)} ${String(F)} 0 0 1 ${String(N+F)} ${String(P)}`,`A${String(F)} ${String(L)} 0 0 0 ${String(N-F)} ${String(P)}`,`Z`].join(` `),z=g+A,B=Math.sqrt(k**2-A**2),V=[`M${String(N-B)} ${String(g)}`,`A${String(k)} ${String(k)} 0 0 1 ${String(N+B)} ${String(g)}`,`Z`].join(` `),H=[-34,-17,0,17,34].map(e=>{let t=Math.sqrt(k**2-e**2)+j;return{x:N+e,from:z-t,to:z-t-M}});return(e,t)=>(n(),m(`svg`,{class:`noon-sky in-figure`,viewBox:`0 0 ${l(p)} ${l(g)}`,"aria-hidden":`true`},[d(` in-figure: an article's figure shows it over the picture. `),c(`path`,{class:`noon-night`,d:l(R)},null,8,w),c(`path`,{class:`noon-sun`,d:l(V)},null,8,T),(n(!0),m(u,null,h(l(H),e=>(n(),m(`line`,{key:e.x,class:`noon-ray`,x1:e.x,y1:e.from,x2:e.x,y2:e.to},null,8,E))),128)),d(" no paint: it says where the clock is, on the canvas, so that an article's\n    figure keeps it in its crop (ArticleFigure.vue, `measureLabels`) "),c(`circle`,{cx:l(v),cy:l(_).at[1],r:l(_).radius,fill:`none`},null,8,D),c(`text`,{class:`noon-clock-word`,x:l(v),y:S},`Greenwich`,8,O)],8,C))}}),[[`__scopeId`,`data-v-983c8f4f`]]),P={class:`noon-sentence side-text`},F={class:`noon-paragraph text-dims after-watch`},I={class:`noon-paragraph text-dims after-watch`},L={class:`noon-paragraph text-dims`},R=g({__name:`slides.md__slidev_17`,setup(e){let{$slidev:u,$nav:h,$clicksContext:g,$clicks:_,$page:y,$renderContext:b,$frontmatter:C}=x();return g.setup(),(e,u)=>{let h=N,g=t(`click`);return n(),o(S,f(i(l(v)(l(C),16))),{default:a(()=>[u[4]||=c(`h1`,null,`Longitude From Time`,-1),u[5]||=c(`p`,null,`Noon comes later`,-1),p(h),c(`div`,P,[u[3]||=c(`div`,{class:`noon-paragraph text-dims`},[s(`Noon in Greenwich`),c(`br`),s(`Ship: not noon yet`)],-1),r((n(),m(`div`,F,[...u[0]||=[s(`360°/24 hr = 15°/hr`,-1)]])),[[g,1]]),r((n(),m(`div`,I,[...u[1]||=[s(`2 p.m. in Greenwich`,-1),c(`br`,null,null,-1),s(`Noon at the ship`,-1)]])),[[g,2]]),r((n(),m(`div`,L,[...u[2]||=[s(`Hours × 15 = Longitude`,-1)]])),[[g,3]])]),d(` narration
[figure: A globe from above the Equator, with the Atlantic in the middle and a
meridian every 15 degrees. The Sun is under the globe, and a line runs from the
pole down the meridian through Greenwich. It is noon in Greenwich, and a clock beside
the globe says so. The ship is 30 degrees to the west.]

Why would a clock help? Because noon does not come to everyone at once. The
Earth turns toward the east, so the Sun's highest point sweeps west. When it is
noon in Greenwich, the part of London that gave Greenwich Mean Time its name, a
ship 30 degrees to the west has not reached noon yet.

[click]

[figure: The globe has turned by one meridian. The line now runs along the
meridian 15 degrees west of Greenwich. The clock says 1:00.]

In an hour, the Earth turns by 15 degrees, one line on this globe. Noon has moved
15 degrees west, and it has not reached the ship yet.

[click]

A navigator can measure noon at sea: it is when the Sun stands highest. After a
second hour, noon reaches the ship. Suppose that the ship carries a clock that
still keeps Greenwich's time. At the ship's noon, it reads 2:00. Two hours behind
Greenwich means 30 degrees west of it.

[click]

[figure: The line runs through the ship, and Greenwich is 30 degrees to the east of
it. The clock says 2:00.]

So the clock measures the ship's longitude. Take the hours behind Greenwich,
multiply by 15, and that is how many degrees west the ship is.

> [!aside] The Sun in the picture
> The real Sun is behind you as you look at this globe, and over the Equator. The
> picture puts it under the globe so that it fits, and leaves the night where
> the real Sun would put it. The real noon also runs up to about 16 minutes
> ahead of or behind a steady clock through the year. Navigators corrected for
> that with a table, the _equation of time_.

`)]),_:1},16)}}},[[`__scopeId`,`data-v-c76c88b7`]]);export{R as default};