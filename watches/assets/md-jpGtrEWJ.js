import{A as e,C as t,H as n,L as r,Q as i,T as a,Z as o,_ as s,_t as c,bt as l,g as u,gt as d,h as f,p,v as m,vt as h,x as g,y as _,yt as v,z as y}from"./modules/shiki-BdqBXHwB.js";import{fn as b,mr as x,pn as S}from"./index-D_873o8a.js";import{t as C}from"./slidev/full-BsssmYXb.js";var w=[`alt`],T={class:`clock-track`},E={class:`clock-words text-dims`},D=x(t({__name:`ClockBar`,props:{picture:{},alt:{},from:{},to:{},words:{},row:{},big:{},bigFrom:{default:0},dockAt:{},dimAt:{default:void 0}},setup(e){let t=e;if(!(t.bigFrom<t.dockAt))throw Error(`ClockBar ${t.picture}: bigFrom (${String(t.bigFrom)}) must come before dockAt (${String(t.dockAt)})`);if(t.dimAt!==void 0&&!(t.dockAt<t.dimAt))throw Error(`ClockBar ${t.picture}: dockAt (${String(t.dockAt)}) must come before dimAt (${String(t.dimAt)})`);let n=`/slidev-stem/watches/${t.picture}`,{$clicks:i}=S(),a=f(()=>i.value>=t.bigFrom),o=f(()=>i.value>=t.dockAt),s=f(()=>t.dimAt!==void 0&&i.value>=t.dimAt);return(t,i)=>(r(),_(`div`,{class:c([`clock-bar`,{docked:o.value,dimmed:s.value}]),style:v({"--from":e.from,"--to":e.to,"--row":e.row,"--big-left":`${e.big.left}px`,"--big-top":`${e.big.top}px`,"--big-width":`${e.big.width}px`,"--big-height":`${e.big.height}px`})},[u(`img`,{class:c([`clock-photo`,{shown:a.value}]),src:n,alt:e.alt},null,10,w),u(`div`,T,[i[0]||=u(`div`,{class:`clock-span`},null,-1),u(`div`,E,l(e.words),1)])],6))}}),[[`__scopeId`,`data-v-481b729d`]]),O={class:`clock-rows`},k={class:`clock-axis`},A=x({__name:`slides.md__slidev_20`,setup(t){let{$slidev:c,$nav:l,$clicksContext:f,$clicks:v,$page:x,$renderContext:w,$frontmatter:T}=S();f.setup();let E=[{picture:`harrison/h1.jpg`,alt:`H1, a large brass machine.`,from:1730,to:1735,dockAt:1,big:{left:218,top:124,width:544,height:408},words:`Catches the navigator’s 70-mile error.`},{picture:`harrison/h2.jpg`,alt:`H2, a tall brass frame.`,from:1737,to:1739,bigFrom:2,dockAt:3,big:{left:168,top:124,width:306,height:408},words:`Design flaw.`},{picture:`harrison/h3.jpg`,alt:`H3, a brass machine with a large arc.`,from:1740,to:1759,bigFrom:2,dockAt:3,big:{left:498,top:124,width:314,height:408},words:`Never goes to sea.`},{picture:`harrison/h4.jpg`,alt:`H4's movement, round and engraved, like a large pocket watch.`,from:1755,to:1759,bigFrom:4,dockAt:5,big:{left:218,top:124,width:544,height:408},words:`Sea trial.`}];function A(e){let t=E.filter(t=>t.dockAt>e.dockAt).map(e=>e.bigFrom??0);return t.length>0?Math.min(...t):void 0}return(t,c)=>{let l=D,f=n(`click`);return r(),s(C,h(a(d(b)(d(T),19))),{default:o(()=>[c[1]||=u(`h1`,null,`Thirty Years, Four Tries`,-1),c[2]||=u(`p`,null,`Same time, every tick, on a rolling ship`,-1),u(`div`,O,[(r(),_(p,null,y(E,(t,n)=>g(l,e({key:t.picture},{ref_for:!0},t,{row:n,"dim-at":A(t)}),null,16,[`row`,`dim-at`])),64)),i((r(),_(`div`,k,[...c[0]||=[u(`span`,{style:{"--year":`1730`}},`1730`,-1),u(`span`,{style:{"--year":`1740`}},`1740`,-1),u(`span`,{style:{"--year":`1750`}},`1750`,-1),u(`span`,{style:{"--year":`1760`}},`1760`,-1)]])),[[f,1]])]),m(` narration

[nofigure]

[click]

[nofigure]

In 1730, at about 37 years old, he took on Newton's obstacles: he began work on
a clock for the Longitude prize. His first took 5 years and, like his wooden
clocks, needed no oil. To see it move, watch this [30-second
clip](https://www.youtube.com/watch?v=_mRTMZ3pTtM).

It had its sea trial in 1736, to Lisbon and back. It did poorly on the way out,
but on the way home, the ship's master put the ship about 70 miles east of where
it was, while Harrison's clock got the longitude right. It had started as a
side project. Now it worked, and from 1737 the Board of Longitude paid him to
build a better one.

[click]

[nofigure]

After 2 years on his second, he realized a design flaw and abandoned it.  It
never sailed.

He spent 19 years on his third clock. Along the way, he invented the
_bimetallic strip_, his answer to Newton's heat and cold, and the _caged roller
bearing_, to cut friction. Both are still in wide use today.  But he couldn't get it to keep time
regularly in all conditions.

[click:2]

[nofigure]

[click]

By 1755, after twenty-five years of heavy, table-sized clocks, the third was
still not right. But a watch that John Jefferys made to his design, in 1753,
had shown him that a small timekeeper could work. And a small, fast-beating balance wheel resisted a ship's
motion, Newton's first obstacle, far better than a large, slow one. So he began a
fourth, and kept working on the third alongside it. The fourth was an oversized
pocket watch, just five inches across and three pounds in weight. He finished
both in 1759. In 1761, the watch went to sea.

[figure: A timeline from 1730 to 1760, with a bar for each clock, and its photo at the
start of its bar. H1's bar is 5 years long and H2's is 2. H3's is 19, the longest. H4's
is 4, the same 4 years as the end of H3's.]

> [!credit]
> Photos of [H1](https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(32416544837).jpg), [H2](https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(46635402754).jpg) and [H4](https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(32416554787).jpg) by Mike Prince, and of [H3](https://commons.wikimedia.org/wiki/File:Harrison_H3_Clock_(35491292866).jpg) by Tony Hisgett, under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).

`)]),_:1},16)}}},[[`__scopeId`,`data-v-bcdc09af`]]);export{A as default};
//# sourceMappingURL=md-jpGtrEWJ.js.map