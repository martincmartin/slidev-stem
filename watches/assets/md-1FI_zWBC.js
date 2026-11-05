import{C as e,J as t,L as n,N as r,T as i,Z as a,_ as o,bt as s,ct as c,g as l,gt as u,h as d,j as f,p,q as m,v as h,vt as g,x as _,y as v,z as y}from"./modules/shiki-h-A-1wb4.js";import{Sn as b,bt as x,ht as S,xt as C}from"./index-LrLKqFR9.js";import{t as w}from"./slidev/full-C9jjrNAo.js";var T=2,E=60;function D(e){return typeof e==`object`&&!!e}function O(e){return typeof e==`number`&&e>0}function k(e,t){if(D(e)&&typeof e.text==`string`&&O(e.beats))return{text:e.text,beats:e.beats};throw Error(`${t}: each line needs a text and a number of beats`)}function A(e){if(!D(e)||typeof e.title!=`string`||!O(e.bpm)||!Array.isArray(e.lines)||e.lines.length===0)throw Error(`each song needs a title, bpm and lines`);let t=e.title;return{title:t,bpm:e.bpm,lines:e.lines.map(e=>k(e,t))}}function j(e){if(!Array.isArray(e))throw Error(`songs must be a list`);if(e.length===0)throw Error(`there must be at least one song`);return e.flatMap(e=>{let t=A(e),n=[];for(let e=0;e<t.lines.length;e+=T){let r=t.lines.slice(e,e+T),i=r.reduce((e,t)=>e+t.beats,0);n.push({lines:r.map(e=>e.text),seconds:i*E/t.bpm})}return n})}function M(e,t){if(!Array.isArray(e)||e.length===0)throw Error(`titles must be a list with at least one title`);if(!O(t))throw Error(`the time for a title must be above 0`);return e.map(e=>{if(typeof e!=`string`)throw Error(`each title must be text`);return{lines:[e],seconds:t}})}function N(e,t){if(e<2*t)throw Error(`a screen of ${String(e)} s is too short for its fades`);let n=t/e;return[{opacity:+(t===0),offset:0},{opacity:1,offset:n},{opacity:1,offset:1-n},{opacity:+(t===0),offset:1}]}var P={class:`song-lines`},F=b(e({__name:`SongLines`,props:{titles:{},secondsATitle:{}},setup(e){let i=e,[a]=Object.values([]),o=a===void 0?M(i.titles,i.secondsATitle):j(a),u=c(0),h=d(()=>{let e=o[u.value];if(e===void 0)throw Error(`no such screen`);return e}),g=m(`words`),{$page:_,$renderContext:b}=C(),{currentSlideNo:x,isPrintMode:w}=S(),T=d(()=>!w.value&&(b.value===`slide`||b.value===`presenter`)&&_.value===x.value),E;function D(){E?.cancel(),E=void 0,u.value=0}function O(e){return matchMedia(`(prefers-reduced-motion: reduce)`).matches?0:Number.parseFloat(getComputedStyle(e).getPropertyValue(`--text-fade`))}async function k(e){u.value=e,await f();let t=g.value;if(t===null||!T.value)return;let{seconds:n}=h.value,r=N(n,O(t)),i=t.animate(r,{duration:n*1e3,fill:`both`});E?.cancel(),E=i,i.onfinish=()=>{k((e+1)%o.length)}}return t(T,e=>{D(),e&&k(0)},{immediate:!0}),r(D),(e,t)=>(n(),v(`div`,P,[l(`div`,{ref_key:`words`,ref:g},[(n(!0),v(p,null,y(h.value.lines,e=>(n(),v(`div`,{key:e},s(e),1))),128))],512)]))}}),[[`__scopeId`,`data-v-a06ddf9b`]]),I=b({__name:`slides.md__slidev_23`,setup(e){let{$slidev:t,$nav:r,$clicksContext:s,$clicks:c,$page:d,$renderContext:f,$frontmatter:p}=C();return s.setup(),(e,t)=>{let r=F;return n(),o(w,g(i(u(x)(u(p),22))),{default:a(()=>[t[0]||=l(`h1`,null,`Questions?`,-1),t[1]||=l(`div`,{class:`questions-credits`},[l(`h2`,null,`Credits`),l(`p`,null,`John Harrison, Thomas King, c. 1767. Public domain.`),l(`p`,null,`H1, H2 and H4, Mike Prince. CC BY 2.0.`),l(`p`,null,`H3, Tony Hisgett. CC BY 2.0.`),l(`p`,null,`CC BY 2.0: creativecommons.org/licenses/by/2.0`)],-1),_(r,{class:`questions-songs`,titles:u(p).songTitles,"seconds-a-title":u(p).secondsATitle},null,8,[`titles`,`seconds-a-title`]),h(` narration
Thank you for reading. Here are some great songs about time:

- "Rock Around the Clock," by Max C. Freedman and James E. Myers
- "My Grandfather's Clock," by Henry Clay Work
- "The Windmills of Your Mind," by Michel Legrand, Alan Bergman and Marilyn Bergman
- "Time," by Pink Floyd
- "Clocks," by Coldplay
- "Does Anybody Really Know What Time It Is?" by Chicago
- "Time After Time," by Cyndi Lauper
- "TiK ToK," by Kesha
- "Stay," by Zedd and Alessia Cara
- "In the End," by Linkin Park
- "4 Minutes," by Madonna, with Justin Timberlake and Timbaland
- "Lose Yourself," by Eminem

The painting of John Harrison is by Thomas King, about 1767, and is in the
[public domain](https://commons.wikimedia.org/wiki/File:John_Harrison_(Gem%C3%A4lde).jpg).
The photos of
[H1](https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(32416544837).jpg),
[H2](https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(46635402754).jpg)
and
[H4](https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(32416554787).jpg)
are by Mike Prince, and the photo of
[H3](https://commons.wikimedia.org/wiki/File:Harrison_H3_Clock_(35491292866).jpg) is by
Tony Hisgett, all under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).

[nofigure]

`)]),_:1},16)}}},[[`__scopeId`,`data-v-77b22ed9`]]);export{I as default};