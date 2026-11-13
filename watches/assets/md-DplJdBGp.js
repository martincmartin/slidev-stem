import{A as e,C as t,H as n,L as r,Q as i,T as a,Z as o,_ as s,_t as c,bt as l,g as u,gt as d,h as f,p,v as m,vt as h,x as g,y as _,yt as v,z as y}from"./modules/shiki-BdqBXHwB.js";import{Ct as b,St as x,wn as S}from"./index-DNs3NGkP.js";import{t as C}from"./slidev/full-CwvJHCCg.js";var w=[`alt`],T={class:`clock-track`},E={class:`clock-words text-dims`},D=S(t({__name:`ClockBar`,props:{picture:{},alt:{},from:{},to:{},words:{},row:{},big:{},bigFrom:{default:0},dockAt:{},dimAt:{default:void 0}},setup(e){let t=e;if(!(t.bigFrom<t.dockAt))throw Error(`ClockBar ${t.picture}: bigFrom (${String(t.bigFrom)}) must come before dockAt (${String(t.dockAt)})`);if(t.dimAt!==void 0&&!(t.dockAt<t.dimAt))throw Error(`ClockBar ${t.picture}: dockAt (${String(t.dockAt)}) must come before dimAt (${String(t.dimAt)})`);let n=`/slidev-stem/watches/${t.picture}`,{$clicks:i}=b(),a=f(()=>i.value>=t.bigFrom),o=f(()=>i.value>=t.dockAt),s=f(()=>t.dimAt!==void 0&&i.value>=t.dimAt);return(t,i)=>(r(),_(`div`,{class:c([`clock-bar`,{docked:o.value,dimmed:s.value}]),style:v({"--from":e.from,"--to":e.to,"--row":e.row,"--big-left":`${e.big.left}px`,"--big-top":`${e.big.top}px`,"--big-width":`${e.big.width}px`,"--big-height":`${e.big.height}px`})},[u(`img`,{class:c([`clock-photo`,{shown:a.value}]),src:n,alt:e.alt},null,10,w),u(`div`,T,[i[0]||=u(`div`,{class:`clock-span`},null,-1),u(`div`,E,l(e.words),1)])],6))}}),[[`__scopeId`,`data-v-d17a2450`]]),O={class:`clock-rows`},k={class:`clock-axis`},A=S({__name:`slides.md__slidev_20`,setup(t){let{$slidev:c,$nav:l,$clicksContext:f,$clicks:v,$page:S,$renderContext:w,$frontmatter:T}=b();f.setup();let E=[{picture:`harrison/h1.jpg`,alt:`H1, a large brass machine.`,from:1730,to:1735,dockAt:1,big:{left:218,top:124,width:544,height:408},words:`Beat ship’s navigator by 60 miles.`},{picture:`harrison/h2.jpg`,alt:`H2, a tall brass frame.`,from:1737,to:1739,bigFrom:2,dockAt:3,big:{left:168,top:124,width:306,height:408},words:`Design flaw.`},{picture:`harrison/h3.jpg`,alt:`H3, a brass machine with a large arc.`,from:1740,to:1759,bigFrom:2,dockAt:3,big:{left:498,top:124,width:314,height:408},words:`Never sailed.`},{picture:`harrison/h4.jpg`,alt:`H4's movement, round and engraved, like a large pocket watch.`,from:1755,to:1759,bigFrom:4,dockAt:5,big:{left:218,top:124,width:544,height:408},words:`Sea trial.`}];function A(e){let t=E.filter(t=>t.dockAt>e.dockAt).map(e=>e.bigFrom??0);return t.length>0?Math.min(...t):void 0}return(t,c)=>{let l=D,f=n(`click`);return r(),s(C,h(a(d(x)(d(T),19))),{default:o(()=>[c[1]||=u(`h1`,null,`Same Time, Every Tick`,-1),c[2]||=u(`p`,null,`On a rolling ship, hot or cold`,-1),u(`div`,O,[(r(),_(p,null,y(E,(t,n)=>g(l,e({key:t.picture},{ref_for:!0},t,{row:n,"dim-at":A(t)}),null,16,[`row`,`dim-at`])),64)),i((r(),_(`div`,k,[...c[0]||=[u(`span`,{style:{"--year":`1730`}},`1730`,-1),u(`span`,{style:{"--year":`1740`}},`1740`,-1),u(`span`,{style:{"--year":`1750`}},`1750`,-1),u(`span`,{style:{"--year":`1760`}},`1760`,-1)]])),[[f,1]])]),m(` narration
Four clocks, one problem. Each tick is one swing of the balance, and every swing must take
the same time, on a rolling ship, hot or cold.

[nofigure]

[click]

[nofigure]

His aim was a clock for the sea that kept time within 3 seconds a day. In 1730,
at about 37 years old, he began one at home in Lincolnshire, probably with help
from his brother James. It took 5 years. H1 has two linked balances that a
ship's motion does not upset, and runs with no oil at all. To see it move, watch
this [30-second clip of H1 at
Greenwich](https://www.youtube.com/watch?v=_mRTMZ3pTtM).

H1 had its sea trial in 1736: to Lisbon and back. It did poorly on the way out. On the way
home, the ship's master put the ship 60 miles east of where it was, and H1 was right. That
won him money for a better clock.

[click]

[nofigure]

H2 took 2 years. He found a design flaw in its balances: a ship's turn changes the time of
their swing. So he abandoned it for H3. H2 never sailed.

H3 took 19 years, and it never sailed either. The swings of its two large, heavy balances
still varied.

But look at what he invented on the way, which we still use today. To cancel the effect of
heat, he joined brass and steel in a _bimetallic strip_, which still works in thermostats.
To cut friction, he kept rollers apart in a _caged roller bearing_, which is now nearly
everywhere in machinery.

[click:2]

[nofigure]

Then he gave up on big clocks. H4 took 4 years and weighs about 3 pounds: from the
outside, a large pocket watch. Its balance is small and fast, with five ticks a second.

[click]

In 1761, H4 went on a sea trial.

[figure: A timeline from 1730 to 1760, with a bar for each clock, and its photo at the
start of its bar. H1's bar is 5 years long and H2's is 2. H3's is 19, the longest. H4's
is 4, and ends the same year as H3's.]

`)]),_:1},16)}}},[[`__scopeId`,`data-v-2f01ebc5`]]);export{A as default};