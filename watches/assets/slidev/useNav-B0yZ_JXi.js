const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/md-Df-iu5Pw.js","assets/modules/shiki-BdeKa7dA.js","assets/rolldown-runtime-XKyaHtl9.js","assets/modules/shiki-V4-KMA-J.css","assets/slidev/context-ZC1NQEyD.js","assets/modules/vue-Cu4syqKD.js","assets/side-DUO1L8F5.js","assets/md-Ch-Zz2cI.js","assets/section-DfJjYJJe.js","assets/md-B0_30umj.js","assets/slidev/default-Cyt1Jx81.js","assets/_plugin-vue_export-helper-BDNMzG2s.js","assets/md-DpvcvhvT.js","assets/md-BZABUqNR.css","assets/md-B1dZSry8.js","assets/index-CdKjxnGW.js","assets/syncState-CCIDHun5.js","assets/index-k2Jal74a.css","assets/WatchCallout-Dcgx-sv_.js","assets/WatchCallout-C0HS2701.css","assets/md-DJr6CAye.css","assets/md-CixruCZF.js","assets/md-Clc_oVtF.css","assets/md-DnEgu2tJ.js","assets/md-nweiz-5n.css","assets/md-xxtucC5A.js","assets/md-DvDXOfbp.css","assets/md-DVLNaA7A.js","assets/md-6OF9_XmN.css","assets/md-gPBCRMte.js","assets/md-CEINdWuQ.css","assets/md-BBMCKE03.js","assets/md-CqGITEDJ.css","assets/md-78c6MNUj.js"])))=>i.map(i=>d[i]);
import{C as e,D as t,F as n,I as r,L as i,S as a,at as o,ct as s,dt as c,g as l,h as u,ht as d,j as f,mt as p,p as m,q as h,st as g,tt as _,ut as v,v as y,y as b,yt as ee}from"../modules/shiki-BdeKa7dA.js";import{t as te}from"../_plugin-vue_export-helper-BDNMzG2s.js";import{A as x,B as S,E as ne,I as re,T as ie,a as C,c as ae,g as oe,h as w,k as T,l as se,m as ce,z as le}from"../modules/vue-Cu4syqKD.js";import{l as E,y as ue}from"./context-ZC1NQEyD.js";function D(e,t,n){return Math.min(n,Math.max(t,e))}function de(...e){return pe(e).reduce((e,t)=>e+t,0)}function fe(e){return e??=[],Array.isArray(e)?e:[e]}function pe(e){return fe(e).flat(1)}function me(e){return Array.from(new Set(e))}function he(...e){let t,n,r;e.length===1?(t=0,r=1,[n]=e):[t,n,r=1]=e;let i=[],a=t;for(;a<n;)i.push(a),a+=r||1;return i}function ge(e){return e!=null}function _e(e,t){return Object.fromEntries(Object.entries(e).map(([e,n])=>t(e,n)).filter(ge))}var O={theme:`house`,title:`What Every Nerd Should Know About Watches`,titleTemplate:`%s - Slidev`,addons:[`palette-ledger`,`@/addons/narration`],remoteAssets:!1,monaco:!0,monacoTypesSource:`local`,monacoTypesAdditionalPackages:[],monacoTypesIgnorePackages:[],monacoRunAdditionalDeps:[],monacoRunUseStrict:!0,download:!1,export:{},info:!1,highlighter:`shiki`,twoslash:!0,lineNumbers:!1,colorSchema:`light`,routerMode:`history`,aspectRatio:1.7777777777777777,canvasWidth:980,exportFilename:``,selectable:!1,themeConfig:{},fonts:{sans:[`"IBM Plex Sans"`,`ui-sans-serif`,`system-ui`,`-apple-system`,`BlinkMacSystemFont`,`"Segoe UI"`,`Roboto`,`"Helvetica Neue"`,`Arial`,`"Noto Sans"`,`sans-serif`,`"Apple Color Emoji"`,`"Segoe UI Emoji"`,`"Segoe UI Symbol"`,`"Noto Color Emoji"`],serif:[`"Fraunces"`,`ui-serif`,`Georgia`,`Cambria`,`"Times New Roman"`,`Times`,`serif`],mono:[`"IBM Plex Mono"`,`ui-monospace`,`SFMono-Regular`,`Menlo`,`Monaco`,`Consolas`,`"Liberation Mono"`,`"Courier New"`,`monospace`],webfonts:[`IBM Plex Sans`,`Fraunces`,`IBM Plex Mono`],provider:`none`,local:[],italic:!1,weights:[`200`,`400`,`600`]},favicon:!1,drawings:{enabled:!0,persist:!1,presenterOnly:!1,syncAll:!0},plantUmlServer:`https://www.plantuml.com/plantuml`,codeCopy:!0,magicMoveCopy:!0,author:`Martin C. Martin`,record:`dev`,css:`unocss`,presenter:!0,browserExporter:`dev`,htmlAttrs:{},transition:`text-fade`,editor:!0,mcp:!0,contextMenu:null,wakeLock:!0,pwa:!1,mdc:!1,comark:!1,seoMeta:{},notesAutoRuby:{},duration:`30min`,timer:`stopwatch`,magicMoveDuration:800,shiki:{},preloadImages:!0,clickAnimation:``,hide:!0,slidesTitle:`What Every Nerd Should Know About Watches - Slidev`},ve=`build`,ye=u(()=>O.aspectRatio),be=u(()=>O.canvasWidth),xe=u(()=>Math.ceil(be.value/ye.value)),Se=u(()=>_e(O.themeConfig||{},(e,t)=>[`--slidev-theme-${e}`,t])),Ce=O.slidesTitle,we=`/slidev-stem/watches/`,Te=`modulepreload`,Ee=function(e){return`/slidev-stem/watches/`+e},De={},Oe=function(e){return e.pathname.endsWith(`.css`)},ke=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},k=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=Ee(t,n);let r=s(t),i=Oe(r);return ke(De,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:Te,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{t.addEventListener(`load`,e),t.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${r}`)))})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Ae=g(!1),je=g(!1),Me=g(!1),Ne=g(!1),A=g(!1),Pe=g(!1),Fe=g(!0),Ie=o(new Set),Le=u(()=>Ie.size>0),Re=se({xs:460,...C}),ze=ie(),Be=oe(),Ve=u(()=>ze.height.value-ze.width.value/ye.value>120),He=ce(x?document.body:null),Ue=ae(),We=u(()=>[`INPUT`,`TEXTAREA`].includes(Ue.value?.tagName||``)),Ge=u(()=>[`BUTTON`,`A`].includes(Ue.value?.tagName||``));w(`slidev-camera`,`default`,{listenToStorageChanges:!1}),w(`slidev-mic`,`default`,{listenToStorageChanges:!1});var Ke=w(`slidev-scale`,0),qe=w(`slidev-wake-lock`,!0),Je=w(`slidev-hide-cursor-idle`,!0);w(`slidev-skip-export-pdf-tip`,!1),w(`slidev-export-capture-delay`,400,{listenToStorageChanges:!1});var j=w(`slidev-presenter-cursor`,!0,{listenToStorageChanges:!1}),Ye=w(`slidev-cursor-style`,`cursor`,{listenToStorageChanges:!1});function Xe(){j.value=!j.value}var Ze=w(`slidev-show-editor`,!1,{listenToStorageChanges:!1}),Qe=w(`slidev-editor-vertical`,!1,{listenToStorageChanges:!1}),$e=w(`slidev-editor-width`,x?window.innerWidth*.4:318,{listenToStorageChanges:!1}),et=w(`slidev-editor-height`,x?window.innerHeight*.4:300,{listenToStorageChanges:!1}),tt=v(null),M=w(`slidev-presenter-font-size`,1,{listenToStorageChanges:!1}),N=w(`slidev-presenter-layout`,1,{listenToStorageChanges:!1}),P={invert:!1,contrast:1,brightness:1,hueRotate:0,saturate:1,sepia:0},nt=w(`slidev-viewer-css-filter`,P,{listenToStorageChanges:!1,mergeDefaults:!0,deep:!0}),rt=u(()=>Object.keys(P).some(e=>nt.value[e]!==P[e]));function it(){N.value+=1,N.value>3&&(N.value=1)}function at(){M.value=Math.min(2,M.value+.1)}function ot(){M.value=Math.max(.5,M.value-.1)}var st=re(Ne),ct=w(`slidev-sync-directions`,{viewerSend:!0,viewerReceive:!0,presenterSend:!0,presenterReceive:!0},{listenToStorageChanges:!1,mergeDefaults:!0}),lt=/[a-z]/i;function ut(e){if(typeof e==`number`)return{seconds:e,relative:!1};let t=e.startsWith(`+`);t&&(e=e.slice(1));let n=0;if(e.includes(`:`)){let t=e.split(`:`).map(Number),r=0,i=0,a=0;if(t.length===3)r=t[0],i=t[1],a=t[2];else if(t.length===2)i=t[0],a=t[1];else if(t.length===1)a=t[0];else throw TypeError(`Invalid timestamp format`);if(Number.isNaN(r)||Number.isNaN(i)||Number.isNaN(a))throw TypeError(`Invalid timestamp format`);n=(r||0)*3600+(i||0)*60+(a||0)}else if(lt.test(e)){let t={s:1,sec:1,secs:1,m:60,min:60,mins:60,h:3600,hr:3600,hrs:3600,hour:3600,hours:3600,day:86400,days:86400,week:604800,weeks:604800,month:2629746,months:2629746,year:31556952,years:31556952},r=/([\d.]+)([a-z]+)/gi,i=e.matchAll(r);if(i)for(let e of i){let r=Number(e[1]);if(Number.isNaN(r))throw TypeError(`Invalid timestamp value: ${e[1]}`);let i=e[2].toLowerCase();if(!(i in t))throw TypeError(`Invalid timestamp unit: ${i}`);n+=r*t[i]}let a=e.replace(r,``).trim();if(a)throw TypeError(`Unknown timestamp remaining: ${a}`)}else if(n=Number(e),Number.isNaN(n))throw TypeError(`Invalid timestamp format`);return{seconds:n,relative:t}}function dt(e,t){if(!t||t===`all`||t===`*`)return he(1,e+1);if(t===`none`)return[];let n=[];for(let r of t.split(/[,;]/g))if(!r.includes(`-`))n.push(+r);else{let[t,i]=r.split(`-`,2);n.push(...he(+t,i?+i+1:e+1))}return me(n).filter(t=>t<=e).sort((e,t)=>e-t)}var ft={},pt={class:`px-4 py-10 text-center text-red-700 dark:text-red-500 font-bold font-mono`};function mt(e,t){return i(),b(`div`,pt,ee(`Failed to fetch this slide. Please check your network connection.`))}var F=te(ft,[[`render`,mt]]),ht={class:`h-full w-full flex items-center justify-center gap-2 slidev-slide-loading`},gt=e({__name:`SlideLoading`,setup(e){let t=g(!1);return n(()=>{setTimeout(()=>{t.value=!0},200)}),(e,n)=>(i(),b(`div`,ht,[t.value?(i(),b(m,{key:0},[n[0]||=l(`div`,{class:`i-svg-spinners-90-ring-with-bg text-xl`},null,-1),n[1]||=l(`div`,null,`Loading slide...`,-1)],64)):y(`v-if`,!0)]))}}),I=o({layout:`cover`,side:`left`,watch:`all`,watchView:`cover`,article:{0:{view:`centred cover`}},narration:[{clicks:0,noFigure:!1,blocks:[{kind:`prose`,text:`<p>Mechanical watches have kept time for 500 years.  Many of their core parts were
invented even earlier for giant cathedral tower clocks before being shrunk into
portable timepieces.  This page explains how a modern one works.  I personally
think it’s fascinating that a purely mechanical device can keep time with 99.99%
accuracy for $100.  They also changed the world and look good on your wrist.</p>
<p>This presentation was partially inspired by Bartosz Ciechanowski’s <a href="https://ciechanow.ski/mechanical-watch/">Mechanical
Watch</a> page.  You can think of this
page as a simpler introduction or background.  When you’re finished with this,
that page gives more depth.</p>
`},{kind:`figure`,from:null,to:null,play:!1,alt:`The whole watch, running: its wheels, its balance wheel and its
hands, inside the case.`}]}]}),_t=s({get layout(){return I.layout},get transition(){return I.transition},get class(){return I.class},get clicks(){return I.clicks},get name(){return I.name},get preload(){return I.preload},slide:{content:``,revision:`-dp8imw`,frontmatterRaw:`# The live watch stays in the same view on the cover and section.
layout: cover
side: left
watch: all
watchView: cover
# the slide's right edge cuts the watch: the article shows it whole
article:
  0:
    view: centred cover
`,note:``,title:`What Every Nerd Should Know About Mechanical Watches`,level:1,index:0,noteHTML:`<ul>
<li>500 years</li>
<li>$20 • 99.9% accurate</li>
<li>Changed the world</li>
<li>Look good on wrist</li>
</ul>
`,images:[],raw:``,frontmatter:I,filepath:``,start:24,sourceIndex:1,id:0,no:1},__clicksContext:null,__preloaded:!1}),L=o({layout:`section`,side:`left`,eyebrow:`PART 1`,watch:`all`,watchView:`cover`,transition:`watch-zoom`}),vt=s({get layout(){return L.layout},get transition(){return L.transition},get class(){return L.class},get clicks(){return L.clicks},get name(){return L.name},get preload(){return L.preload},slide:{content:``,revision:`fko4dl`,frontmatterRaw:`layout: section
side: left
eyebrow: PART 1
watch: all
watchView: cover
transition: watch-zoom
`,note:``,title:`Mechanical Marvels`,level:1,index:1,noteHTML:``,images:[],raw:``,frontmatter:L,filepath:``,start:64,sourceIndex:2,id:1,no:2},__clicksContext:null,__preloaded:!1}),R=o({watch:[`hairspring`,`collet`,`stud`],watchView:`hairspring`,watchFlash:[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`],watchMoveWith:`all`,watchTilt:20,watchClicks:{2:{watchAtRest:!0},3:{watchAtRest:!1}},board:1,boardCurl:2,clicks:3,article:{2:{slider:`curl`},3:{slider:`twist`}},history:`c. 1675`,narration:[{clicks:0,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`A hairspring, seen at an angle: a flat spiral of steel ribbon. Its
outer end is held in a small block, and its inner end is on a hub at the
center. The spiral winds and unwinds.`},{kind:`prose`,text:`<p>Start with the part that keeps time.  In 1675 Christiaan Huygens, a Dutch
scientist, invented the <em>hairspring</em>. It is a flat spiral of steel ribbon, finer
than a hair. Its outer end is held still, and its inner end is free to
turn. Twist the inner end and let go, and the spiral winds and unwinds, back and
forth, at a steady rate. In this drawing it swings once every two seconds, and
the rest of the watch follows that beat.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`A diving board over a pool. It bends, is let go, and swings up and
down past its straight shape, which a dashed line shows. The label reads:
"Bend it away from straight, it pushes back".`},{kind:`prose`,text:`<p>Why does a spring swing? Think of a diving board. Bend it down, and
it pushes back: an <em>elastic restoring force</em>. Let go, and it does not stop at
straight. It overshoots, bends the other way, and comes back again: it
<em>oscillates</em>. With no friction, it would oscillate forever.</p>
`}]},{clicks:2,noFigure:!1,blocks:[{kind:`prose`,text:`<p>A hairspring is a diving board rolled up. The board’s rest shape is a
straight line; the hairspring’s is a spiral. Take hold of the slider under
the next picture, and drag it to the right.</p>
`},{kind:`figure`,from:2,to:2,play:!1,alt:`The diving board curls up into the hairspring, at rest.`}]},{clicks:3,noFigure:!1,blocks:[{kind:`prose`,text:`<p>“Bend” becomes “wind”, and “straight” becomes “rest”. Now give the
hairspring a twist: drag the slider to wind the spiral away from its rest
shape, and let go.</p>
`},{kind:`figure`,from:3,to:3,play:!1,alt:`The hairspring at rest. Wound away from rest and let go, it swings
back and forth.`},{kind:`prose`,text:`<p>It pushes back. It overshoots and swings, just as the board did. This one
move is the whole idea of the hairspring.</p>
`}]}]}),yt=s({get layout(){return R.layout},get transition(){return R.transition},get class(){return R.class},get clicks(){return R.clicks},get name(){return R.name},get preload(){return R.preload},slide:{content:``,revision:`lil02n`,frontmatterRaw:`watch: [hairspring, collet, stud]
watchView: hairspring
# the oscillator flashes; then the camera zooms in with the whole watch on the
# screen, and the rest fades out (docs/watch.md)
watchFlash:
  [
    balance wheel,
    balance staff,
    hairspring,
    collet,
    stud,
    roller,
    impulse jewel,
  ]
watchMoveWith: all
watchTilt: 20
# click 2: the balance comes to rest while the diving board covers it;
# click 3: it swings again (docs/watch.md, "The diving board")
watchClicks:
  2:
    watchAtRest: true
  3:
    watchAtRest: false
board: 1
boardCurl: 2
clicks: 3
# In the article, the figure at click 2 has a slider that curls the board
# into the hairspring at rest, and the figure at click 3 one that winds the
# hairspring and lets it go (docs/article.md)
article:
  2:
    slider: curl
  3:
    slider: twist
# the history line, in a corner of the slide and under the heading in the
# article; the speaker does not say it (docs/slide-patterns.md)
history: "c. 1675"
`,note:``,title:`Hairspring`,level:1,index:2,noteHTML:`<ul>
<li>
<p>In 1675 Christiaan Huygens, a Dutch scientist, invented</p>
</li>
<li>
<p>Keeps time</p>
</li>
<li>
<p>Why swing?</p>
</li>
</ul>
`,images:[],raw:``,frontmatter:R,filepath:``,start:75,sourceIndex:3,id:2,no:3},__clicksContext:null,__preloaded:!1}),z=o({watch:[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`],watchView:`hairspring`,watchTilt:20,watchFlash:[`balance wheel`,`balance staff`],class:`balance-wheel`,clicks:3,history:`c. 1364`,narration:[{clicks:0,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The hairspring is only half of the timekeeper. The other half is the <em>balance
wheel</em>.  While most of its mass is around the outside, it is actually fixed to
the spring’s inner end. The spring provides the <em>restoring force</em>. The wheel
provides the <em>mass</em> and <em>inertia</em>.</p>
`},{kind:`figure`,from:3,to:3,play:!1,alt:`The balance wheel on the hairspring, swinging. The wheel is
marked.`},{kind:`prose`,text:`<p>A hairspring alone would oscillate far too fast to count.  The wheel slows it to a
pace that the gears can count.</p>
`},{kind:`aside`,title:`Why a wheel, and not a disc?`,text:`<p>Mass at the rim counts most, like a figure skater who spins slower with her
arms out. Old balance wheels had screws around the rim, and watchmakers moved
them in or out to make the watch run slower or faster. The swing also takes
about the same time whether it swings through a big angle or small angle
(<em>isochronism</em>). That comes from the spring and the mass together, and it is
why a watch keeps time even while the watch winds down.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`prose`,text:`<p>Mass also makes the swing steady. Push an empty playground swing, and it
jerks about. Put a child on it and it swings much more gracefully. A heavy wheel
carries its own momentum, so a knock to your wrist, or turning it upside down,
barely changes its rhythm.</p>
`}]},{clicks:2,noFigure:!1,blocks:[{kind:`prose`,text:`<p>How good is it? A well-calibrated mechanical watch, even an everyday
Seiko or Citizen, is about 99.99% accurate.  A day has 86,400 seconds, so a good
watch gains or loses about nine seconds a day.</p>
<p>I’m not particularly handy with mechanical things. If I tried to build a table
it would wobble because things would be off by a few percent.  So it kind of
blows my mind that, for $100, I can get a simple, everyday, purely mechanical
system and tweak it to be 99.99% accurate!</p>
`}]}]}),bt=s({get layout(){return z.layout},get transition(){return z.transition},get class(){return z.class},get clicks(){return z.clicks},get name(){return z.name},get preload(){return z.preload},slide:{content:``,revision:`-czp9jj`,frontmatterRaw:`watch: [balance wheel, balance staff, hairspring, collet, stud]
watchView: hairspring
watchTilt: 20
watchFlash: [balance wheel, balance staff]
class: balance-wheel
clicks: 3
history: "c. 1364"
`,note:``,title:`Balance Wheel`,level:1,index:3,noteHTML:`<p><span class="slidev-note-click-mark" data-clicks="1"></span> - wrist bump or upside down</p>
`,images:[],raw:``,frontmatter:z,filepath:``,start:166,sourceIndex:4,id:3,no:4},__clicksContext:null,__preloaded:!1}),B=o({watch:[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`escape arbor`],watchView:[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`escape arbor`],watchTilt:20,watchClicks:{1:{watch:[`escape wheel`,`escape arbor`,`escape wheel drive`],watchSpin:135},2:{watch:[[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`escape arbor`],`escape wheel drive`],watchSpin:!1},3:{watchAtRest:!0},4:{watchAtRest:!1,watchTickTock:!0}},clicks:4,history:`Verge escapement: c. 1275; Lever escapement: c. 1755`,narration:[{clicks:0,noFigure:!0,blocks:[{kind:`prose`,text:`<p>A second hand that just moves back and forth isn’t very useful.  We need it to
turn one way only.  The <em>escapement</em> turns the swing into steps.</p>
<p>The <em>escape wheel</em> is being turned by a mechanism we’ll explain soon, so it’s
hidden on this diagram.  Without something to stop it, it would just turn and
turn.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`The escape wheel alone, spinning freely. A curved arrow shows the
push on it.`}]},{clicks:2,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The <em>pallet fork</em> stops it.</p>
`},{kind:`figure`,from:null,to:null,play:!1,alt:`The balance wheel on the left, the pallet fork in the middle, and
the escape wheel on the right. A stone at the end of the fork holds a tooth
of the wheel. Labels: "Wheel driven by hidden mechanism" and "Pallet blocks
wheel".`},{kind:`prose`,text:`<p>Its two prongs (called <em>stones</em>) stick in the wheel’s teeth: a tooth lands on a
stone, and the wheel stops. Each time the fork rocks, one stone lets a tooth go,
and the other stone catches the next tooth.  The tooth <em>escapes</em>, and that is
where the name comes from.</p>
`}]},{clicks:3,noFigure:!1,blocks:[{kind:`prose`,text:`<p>What rocks the fork? The balance does. On its staff is a small <em>impulse
jewel</em>, which sits in the notch at the end of the fork.  It’s actually a
synthetic ruby or sapphire, so it really is a jewel, a precious stone.</p>
`},{kind:`figure`,from:null,to:null,play:!1,alt:`The escapement at rest, labeled: the escape wheel, the pallet
fork, and the impulse jewel in the fork's notch.`},{kind:`prose`,text:`<p>As the balance swings through the middle, the jewel strikes the fork and
flips it one way. On the swing back, it flips it the other way.</p>
`}]},{clicks:4,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`The escapement at work. The balance swings, its jewel strikes the
fork, the fork rocks, and the escape wheel moves on one tooth. "Tick" and
"tock" show each time a tooth lands on a stone. Labels: "Jewel strikes
pallet", "Wheel driven by hidden mechanism" and "Pallet blocks wheel".`},{kind:`prose`,text:`<p>So, at each swing, the balance lets the wheel take one small step.  The step
ends when the next tooth lands on a stone, hard enough to make a sound, this is
the tick and the tock of a watch.</p>
`}]}]}),xt=s({get layout(){return B.layout},get transition(){return B.transition},get class(){return B.class},get clicks(){return B.clicks},get name(){return B.name},get preload(){return B.preload},slide:{content:``,revision:`kgm5a2`,frontmatterRaw:`watch:
  &escapement [
    balance wheel,
    balance staff,
    hairspring,
    collet,
    stud,
    roller,
    impulse jewel,
    pallet fork,
    escape wheel,
    escape arbor,
  ]
watchView: *escapement # the camera stays when click 2 shows less
watchTilt: 20
watchClicks:
  # the wheel's callout appears; the pallet and the balance fade, and then
  # the drive arrow fades in, and the escape wheel spins freely
  1:
    watch: [escape wheel, escape arbor, escape wheel drive]
    watchSpin: 135 # degrees a second
  # they fade back in, and the pallet stops the wheel (docs/watch.md)
  2:
    watch: [*escapement, escape wheel drive]
    watchSpin: false
  # the balance comes to rest, with the jewel under its leader
  3:
    watchAtRest: true
  # it swings again, and the leader fades out; "tick" and "tock" show each
  # time a tooth lands on a pallet stone (docs/watch.md)
  4:
    watchAtRest: false
    watchTickTock: true
clicks: 4
history: "Verge escapement: c. 1275; Lever escapement: c. 1755"
`,note:``,title:`Escapement`,level:1,index:4,noteHTML:`<ul>
<li>second hand: turn one direction</li>
</ul>
<p><span class="slidev-note-click-mark" data-clicks="1"></span>  turning force, explained soon</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span>  Stick in teeth.</p>
<ul>
<li>Each rock lets a tooth <em>escape</em>.</li>
</ul>
<p><span class="slidev-note-click-mark" data-clicks="3"></span> Synthetic ruby or sapphire.  Really is a jewel!</p>
<p><span class="slidev-note-click-mark" data-clicks="4"></span> Tooth lands on stone: tick, tock.</p>
`,images:[],raw:``,frontmatter:B,filepath:``,start:293,sourceIndex:5,id:4,no:5},__clicksContext:null,__preloaded:!1}),V=o({watch:[`seconds hand`,`fourth arbor`],watchView:[`seconds hand`],watchRight:438,watchTilt:20,class:`ticks-and-turns`,clicks:3,narration:[{clicks:0,noFigure:!1,blocks:[{kind:`prose`,text:`<p>Before we go on, something that trips people up until they think it through. How
long does the second hand take to go once around the dial?</p>
`},{kind:`figure`,from:3,to:3,play:!1,alt:`The second hand alone, pinned on its arbor, ticking once a
second.`},{kind:`prose`,text:`<p>Each tick is one second, and sixty ticks brings it all the way around. So the
second hand makes a complete circle once a minute. A hand is named for what it
counts, not for how long it takes to make a full 360° turn.</p>
<table>
<thead>
<tr>
<th>Hand</th>
<th>A full turn</th>
</tr>
</thead>
<tbody>
<tr>
<td>Second hand</td>
<td>Once a minute</td>
</tr>
<tr>
<td>Minute hand</td>
<td>Once an hour</td>
</tr>
<tr>
<td>Hour hand</td>
<td>Twice a day</td>
</tr>
</tbody>
</table>
`},{kind:`aside`,title:`Why is this second hand not in the middle?`,text:`<p>On most watches the second hand is in the middle, with the minute and hour
hands.  But putting three hands all on the same shaft makes the diagram
confusing, and many older watches had their second hand off center.
Watchmakers call it <em>small seconds</em>.</p>
`}]}]}),St=s({get layout(){return V.layout},get transition(){return V.transition},get class(){return V.class},get clicks(){return V.clicks},get name(){return V.name},get preload(){return V.preload},slide:{content:``,revision:`-hrpl5v`,frontmatterRaw:`# the seconds hand alone, so that the eye has only its ticks to count, one
# a second (docs/watch.md, "The Ticks and Turns slide"). Its arbor shows as a
# post under its cap at tilt 20, as on the Gears slide: the hand is pinned
# there. The view fits the hand's whole turn; its circle is against the left
# edge (FIT_LEFT, 16 px, plus its width at this tilt, about 421.6 px), so
# that the table, 483 px wide, fits on the right. Neither the Escapement
# slide nor the Gears slide shows these pieces at the step, so both steps
# jump the camera
watch: [seconds hand, fourth arbor]
watchView: [seconds hand]
watchRight: 438
watchTilt: 20
class: ticks-and-turns
clicks: 3
`,note:``,title:`Ticks and Turns`,level:1,index:5,noteHTML:`<p>Trips people up until they think it through.  How long for a full circle?</p>
<p><span class="slidev-note-click-mark" data-clicks="1"></span></p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span> Named for what it counts.</p>
<p><span class="slidev-note-click-mark" data-clicks="3"></span></p>
`,images:[],raw:``,frontmatter:V,filepath:``,start:451,sourceIndex:6,id:5,no:6},__clicksContext:null,__preloaded:!1}),H=o({watchView:[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`],watch:[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`],`fourth wheel span plain`,`escape pinion span plain`],watchRight:489,watchTilt:20,watchMoveWith:`none`,watchSpin:90,class:`gears`,watchClicks:{1:{watch:[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`],`fourth wheel span`,`escape pinion span`],watchFlash:[`fourth wheel span plain`,`escape pinion span plain`],watchCut:[`fourth wheel span plain`,`escape pinion span plain`,`fourth wheel span`,`escape pinion span`]},5:{watchSpin:!1,watch:[`fourth wheel drive`,[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`],`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`]},6:{watch:[[`fourth wheel drive`,[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`],`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`],`seconds hand`]}},clicks:6,history:`Second hand: c. 1670`,narration:[{clicks:0,noFigure:!0,blocks:[{kind:`prose`,text:`<p>The escapement gets the escape wheel turning at a precise rate.  But the second
hand must turn once a minute, and the escape wheel turns faster than that. To
convert a faster rotation into a slower one, a watch uses gears: a small gear
that meshes with a big one.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`figure`,from:4,to:4,play:!1,alt:`Two gears, turning: a small gear with eight teeth drives a big
gear with sixteen. Four teeth on each gear are colored.`},{kind:`aside`,title:`Must the teeth be the same size?`,text:`<p>Strictly, the <em>pitch</em> must match: a tooth and its gap on one wheel must be as
long as a tooth and its gap on the other. One wheel can have wider teeth
than the other, as long as it has narrower gaps.</p>
`},{kind:`prose`,text:`<p>The teeth on the two gears must have the same spacing, so they mesh neatly.
Each tooth fits in a gap of the other gear, so the teeth go past each other one
for one, and both rims move at the same speed.  Four teeth on each gear are
colored. Those four teeth are half of the small gear, but only a quarter of the
big one. So the small gear turns twice for each turn of the big one: twice the
circumference, half the speed.</p>
`}]},{clicks:6,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`The pinion, now under the escape wheel, meshes with the big gear,
and the pallet fork is beside the escape wheel. The second hand is on the big
gear's axle, and steps around clockwise, once a minute.`},{kind:`aside`,title:`Why does this second hand jump, when mine sweeps?`,text:`<p>This watch ticks once a second, to make the hairspring slow enough to
see. Most real mechanical watches tick five to eight times a second, so their
second hands seem to sweep.</p>
`},{kind:`prose`,text:`<p>Now attach the smaller gear (called a <em>pinion</em>) to the escape wheel.
The gears do not spin freely any more: they move on one tick at a time, with the
escape wheel. The escapement controls the speed of the whole train of gears.</p>
<p>The big gear pushing the small gear (pinion) is the force turning the escape
wheel.  What turns the big wheel?  That’s a mechanism we’ll explain soon.</p>
<p>In this watch, the big gear (called the <em>fourth wheel</em>) turns exactly once a
minute: just what the second hand needs! So the second hand goes on the big
gear’s axle. It is the first part of the watch that we can read.</p>
`}]}]}),Ct=s({get layout(){return H.layout},get transition(){return H.transition},get class(){return H.class},get clicks(){return H.clicks},get name(){return H.name},get preload(){return H.preload},slide:{content:``,revision:`-ah564h`,frontmatterRaw:`# the camera stays when a click adds pieces
watchView: &gears [fourth wheel, fourth arbor, escape pinion, escape arbor]
# the span, in the gears' own colours: it cannot be seen until click 1
# flashes it
watch: [*gears, fourth wheel span plain, escape pinion span plain]
# the fourth wheel's teeth reach 70 px short of the text (.gears-sentence,
# left: 560px): this edge, plus half the outline, is 70 px left of the "A"
watchRight: 489
watchTilt: 20
# the audience has not seen these gears, so their place in the watch does
# not matter: the Ticks and Turns slide's picture fades out, the camera jumps,
# and this one fades in, both ways (docs/watch.md, "The Gears slide")
watchMoveWith: none
# the gears turn freely, from the start: the pinion once in 4 s (360 / 4 = 90
# degrees a second), so the fourth wheel once in 8 s
watchSpin: 90
class: gears
watchClicks:
  # a span: four teeth of the wheel, and the four leaves that they drive.
  # Four teeth are a quarter of the wheel and half the pinion. The gears
  # turn on. The span is in the flash's colours (second-wash faces, second
  # outline), and the text comes one line a click (clicks 2 to 4: two
  # callouts, then a sentence). The span comes in with a flash, not a fade:
  # its plain teeth flash, and when the flash ends, they go and the span
  # shows, at once. No flash for the text: each callout's leader shows which
  # gear it means
  1:
    watch: [*gears, fourth wheel span, escape pinion span]
    watchFlash: [fourth wheel span plain, escape pinion span plain]
    watchCut:
      [
        fourth wheel span plain,
        escape pinion span plain,
        fourth wheel span,
        escape pinion span,
      ]
  # the rest of the Escapement slide's mechanism fades in, in this view
  # (much of it off the slide on the left), with the drive arrow on the
  # fourth wheel, and the span goes. The pallet stops the spin: the gears
  # tick with the escape wheel
  5:
    watchSpin: false
    watch:
      &mechanism [
        fourth wheel drive,
        *gears,
        balance wheel,
        balance staff,
        hairspring,
        collet,
        stud,
        roller,
        impulse jewel,
        pallet fork,
        escape wheel,
      ]
  # the seconds hand, on the fourth wheel's arbor: it turns once a minute,
  # and the text says so after the hand has faded in
  6:
    watch: [*mechanism, seconds hand]
clicks: 6
history: "Second hand: c. 1670"
`,note:``,title:`Gears`,level:1,index:6,noteHTML:`<p>Have wheel turning one way, but too fast.</p>
<p>Teeth must move at same speed because they mesh.</p>
<p><span class="slidev-note-click-mark" data-clicks="1"></span> These 4 teeth move at same speed.</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span></p>
<p><span class="slidev-note-click-mark" data-clicks="3"></span> Same length of rim.</p>
<p><span class="slidev-note-click-mark" data-clicks="4"></span></p>
<p><span class="slidev-note-click-mark" data-clicks="5"></span> Attach the small gear to the escape wheel.</p>
<p><span class="slidev-note-click-mark" data-clicks="6"></span> IF ASKED: This watch ticks once a second. Most real mechanical watches tick 5 to 8 times a second, so their second hands seem to sweep.</p>
`,images:[],raw:``,frontmatter:H,filepath:``,start:582,sourceIndex:7,id:6,no:7},__clicksContext:null,__preloaded:!1}),U=o({watch:[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],`fourth wheel drive`],watchView:[`escape wheel`,`fourth wheel`,`third wheel`,`centre wheel`],watchRight:489,watchTilt:20,class:`gear-train`,watchClicks:{1:{watch:[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],`fourth pinion`,`one-step wheel`,[`case band`,`lug`,`crown`,`raised strap`,`chapter ring`]],watchView:[`case band`],watchTilt:0,watchLater:[`case band`,`lug`,`crown`,`raised strap`,`chapter ring`],watchGoLater:[`fourth wheel drive`],watchFlash:[`one-step wheel`,`fourth pinion`]},2:{watch:[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],[`fourth pinion`,`third wheel`,`third arbor`],`third wheel drive`],watchView:[`escape wheel`,`fourth wheel`,`third wheel`,`centre wheel`],watchTilt:20,watchFlash:[`fourth pinion`,`third wheel`,`third arbor`]},3:{watch:[[[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],[`fourth pinion`,`third wheel`,`third arbor`],`third pinion`],`centre wheel`,`centre arbor`],`centre wheel drive`],watchFlash:[`third pinion`,`centre wheel`,`centre arbor`]},4:{watch:[[[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],[`fourth pinion`,`third wheel`,`third arbor`],`third pinion`],`centre wheel`,`centre arbor`],`centre wheel drive`,`centre pivot`,[`minute hand`,`chapter ring`,`case band`,`lug`,`crown`,`strap`]]},5:{watchDim:[[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],[`fourth pinion`,`third wheel`,`third arbor`],`third pinion`],[`minute hand`,`chapter ring`,`case band`,`lug`,`crown`,`strap`]]}},clicks:5,history:`Minute hand: c. 1656`,narration:[{clicks:0,noFigure:!0,blocks:[{kind:`prose`,text:`<p>The second hand turns once a minute. The minute hand must turn once an hour:
sixty times slower. So we could try the same trick, and have a gear that’s 60
times bigger than the small gear.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`The watch, with a gear sixty times the size of the second hand's
pinion drawn in place. The gear is far larger than the whole watch, and sticks
out of the case.`},{kind:`prose`,text:`<p>But there’s a limit to how small you can manufacture the small gear, so
the big gear would be huge.  And it would have a lot of teeth which adds to
the cost.  Plus, it would turn the wrong way, counterclockwise, because every gear
turns the opposite direction from the one it meshes with.</p>
`}]},{clicks:2,noFigure:!1,blocks:[{kind:`figure`,from:2,to:3,play:!1,alt:`Two more pairs of gears, between the second hand's wheel and the
center wheel.`},{kind:`prose`,text:`<p>So the watch slows in two stages. The <em>third wheel</em> runs 7½ times slower, and
the <em>center wheel</em> runs 8 times slower than that.</p>
`}]},{clicks:3,noFigure:!1,blocks:[{kind:`prose`,text:`<p>7½ times 8 is 60, so the center wheel turns once an hour.</p>
`}]},{clicks:4,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`The minute hand on the center wheel's arbor, in the middle of the
case.`},{kind:`prose`,text:`<p>The minute hand goes on the center wheel’s axle (<em>arbor</em>), in the middle of the dial.
It makes a full turn once an hour.</p>
`}]},{clicks:5,noFigure:!0,blocks:[{kind:`prose`,text:`<p>The center wheel pushes the third wheel which pushes the fourth wheel
which pushes the escape wheel.  Next up, the mechanism that pushes the center
wheel and powers the whole watch.</p>
`}]}]}),wt=s({get layout(){return U.layout},get transition(){return U.transition},get class(){return U.class},get clicks(){return U.clicks},get name(){return U.name},get preload(){return U.preload},slide:{content:``,revision:`5mwbdf`,frontmatterRaw:`# the Gears slide's last picture, in a view that frames the train from the
# escape wheel to the centre wheel, which do not show yet. The pieces stay on
# the screen while the camera moves; the balance is partly off the slide
watch:
  [
    &seconds [
      fourth wheel,
      fourth arbor,
      escape pinion,
      escape arbor,
      balance wheel,
      balance staff,
      hairspring,
      collet,
      stud,
      roller,
      impulse jewel,
      pallet fork,
      escape wheel,
      seconds hand,
    ],
    fourth wheel drive,
  ]
watchView: &frame [escape wheel, fourth wheel, third wheel, centre wheel]
watchRight: 489
watchTilt: 20
class: gear-train
watchClicks:
  # one wheel that is sixty times slower, in one step: it drives the
  # fourth pinion, from the line from the escape arbor through the fourth
  # arbor (docs/watch.md, "The Gear Train slide"). The camera untilts and
  # zooms out until the case band fills the picture band, so the case shows
  # how large the wheel is. The drive arrow stays on the fourth wheel while
  # the camera moves, and then goes. The wheel and the pinion fade in, then
  # the case, and then they flash. The case's strap is the raised strap,
  # above the wheel
  1:
    watch:
      [
        *seconds,
        fourth pinion,
        one-step wheel,
        &case [case band, lug, crown, raised strap, chapter ring],
      ]
    watchView: [case band]
    watchTilt: 0
    watchLater: *case
    watchGoLater: [fourth wheel drive]
    watchFlash: [one-step wheel, fourth pinion]
  # the train slows the turn from once a minute to once an hour, in two
  # steps. Each fades in, and then flashes: the wheel, with its arbor, and
  # the pinion that it drives. The drive arrow moves to the new wheel: the
  # old one fades out first, and the new one fades in with its wheel
  2:
    watch:
      [
        *seconds,
        &third [fourth pinion, third wheel, third arbor],
        third wheel drive,
      ]
    watchView: *frame
    watchTilt: 20
    watchFlash: *third
  3:
    watch:
      [
        &train [
          &trainContext [*seconds, *third, third pinion],
          centre wheel,
          centre arbor,
        ],
        centre wheel drive,
      ]
    watchFlash: [third pinion, centre wheel, centre arbor]
  # the minute hand, on the centre wheel's arbor, and the case and the dial
  # (the chapter ring holds its marks); not the hour hand
  4:
    watch:
      [
        *train,
        centre wheel drive,
        centre pivot,
        &face [minute hand, chapter ring, case band, lug, crown, strap],
      ]
  # keep the centre wheel, its arbor, pivot and drive arrow bright; the hidden
  # source of the push is the next slide's spring
  5:
    watchDim: [*trainContext, *face]
clicks: 5
history: "Minute hand: c. 1656"
`,note:``,title:`Gear Train`,level:1,index:7,noteHTML:`<p>Minute hand turns once an hour.</p>
<p>How much slower than the second hand?</p>
<p>Could use same trick, this time 60:1.</p>
<p><span class="slidev-note-click-mark" data-clicks="1"></span> Limit to how small you make pinion.</p>
<p>That many teeth is expensive.</p>
<p>Turns the wrong way, counterclockwise.</p>
<p><span class="slidev-note-click-mark" data-clicks="5"></span> Next up, the mechanism that drives this wheel.</p>
`,images:[],raw:``,frontmatter:U,filepath:``,start:795,sourceIndex:8,id:7,no:8},__clicksContext:null,__preloaded:!1}),W=o({watch:[`mainspring`,`barrel arbor`],watchView:[`mainspring`,`barrel arbor`],watchTilt:20,watchMainspring:`free`,article:{1:{slider:`wind`},2:{button:`release`}},watchLinger:[{pieces:[`centre wheel`,`centre arbor`,`centre pivot`],seconds:1},{pieces:[`centre wheel drive`],seconds:1}],watchClicks:{1:{watch:[[`mainspring`,`barrel arbor`],`mainspring stud`,`mainspring rest`],watchFlash:[`mainspring stud`],watchMainspring:`wound`},2:{watch:[[`mainspring`,`barrel arbor`],`mainspring rest`],watchFlash:[`mainspring stud`],watchCut:[`mainspring stud`],watchMainspring:`released`},3:{watch:[[`mainspring`,`barrel arbor`],`barrel`,`escape wheel`,`escape pinion`,`escape arbor`,`fourth wheel`,`fourth pinion`,`fourth arbor`,`third wheel`,`third pinion`,`third arbor`,`centre wheel`,`centre pinion`,`centre arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`seconds hand`,`minute hand`,`centre pivot`,`chapter ring`,`case band`,`lug`,`crown`,`strap`],watchFlash:[`barrel`,`centre pinion`],watchMainspring:`barrel`,watchView:[`barrel`,`centre wheel`,`third wheel`,`fourth wheel`,`escape wheel`,`balance wheel`,`hairspring`,`stud`],watchBand:`slide`},4:{watchMainspring:`run down`}},clicks:4,class:`mainspring`,history:`c. 1430`,narration:[{clicks:0,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`The bare mainspring: a long ribbon of steel, coiled around its arbor,
at rest.`},{kind:`prose`,text:`<p>This is a spiral spring, like the hairspring.  But instead of swinging back and
forth, it does one slow unwind over a day or two. In the illustration above,
it’s at rest.</p>
<p>Below, the outer end is held in place.  Drag the slider to wind it up.  The
spring keeps its length, so its coils draw in toward the center.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`The mainspring on its arbor. A stud holds its outer end, and a key
turns the arbor.`},{kind:`prose`,text:`<p>When wound away from its rest shape, the dashed line, it pushes back, as the
hairspring does.  A tiny one-way ratchet locks the axle (<em>arbor</em>) so it can only
turn one way.  To unwind the mainspring, let go of the outer end by pressing the
button.</p>
`}]},{clicks:2,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`The wound mainspring, its outer end held by the stud.`},{kind:`prose`,text:`<p>The block is gone, and the outer end swings around until the spring lies on its
rest shape again. That fling is the energy that the winding put in.</p>
<p>A watch harnesses that force by attaching the spring’s outer end to a toothed
drum called the <em>barrel</em>, invented by Jean-Antoine Lépine around 1760.</p>
`}]},{clicks:3,noFigure:!1,blocks:[{kind:`figure`,from:3,to:4,play:!1,alt:`The mainspring in its barrel, driving the whole movement. Then six
hours pass in six seconds.`},{kind:`prose`,text:`<p>As the mainspring pushes the barrel, the barrel’s teeth drive the gear train we
just built.  This is the “hidden mechanism” we mentioned earlier.</p>
`}]},{clicks:4,noFigure:!1,blocks:[{kind:`prose`,text:`<p>Because the ratchet stops the arbor from turning backwards, the spring
has only one way to unwind: by its outer end turning the barrel. Step the figure
forward using the controls under it, and six hours pass in six seconds. The
barrel turns once, the minute hand six times, and the coils move back out to the
wall. When the spring is completely unwound, the watch stops.</p>
`}]}]}),Tt=s({get layout(){return W.layout},get transition(){return W.transition},get class(){return W.class},get clicks(){return W.clicks},get name(){return W.name},get preload(){return W.preload},slide:{content:``,revision:`-l1jf4n`,frontmatterRaw:`# the bare mainspring and its arbor, as large as the picture band; the
# camera stays at every click. The story (watchMainspring) turns the key,
# winds and lets down the spring, and says when the watch runs
# (docs/watch.md, "The Mainspring slide")
watch: &spring [mainspring, barrel arbor]
watchView: *spring
watchTilt: 20
watchMainspring: free
# In the article, the figure at click 1 has a slider that winds the spring,
# and the figure at click 2 a button that lets it go (docs/article.md)
article:
  1:
    slider: wind
  2:
    button: release
# The centre wheel, arbor, pivot and drive arrow remain for one second.
# Then the mechanism fades, leaving the arrow alone for one more second.
# The arrow fades before the camera changes to the spring's view.
watchLinger:
  - pieces: [centre wheel, centre arbor, centre pivot]
    seconds: 1
  - pieces: [centre wheel drive]
    seconds: 1
watchClicks:
  # the stud and the dashed rest shape fade in, and the stud flashes; then
  # the key winds it
  1:
    watch: [*spring, mainspring stud, mainspring rest]
    watchFlash: [mainspring stud]
    watchMainspring: wound
  # the stud flashes and is gone at once; the spring uncoils to its rest
  # shape as soon as nothing holds its end
  2:
    watch: [*spring, mainspring rest]
    watchFlash: [mainspring stud]
    watchCut: [mainspring stud]
    watchMainspring: released
  # the rest shape fades out, the camera zooms out to the whole movement,
  # from the barrel to the balance, and the barrel and the watch (all but
  # the hour hand) fade in, still; the barrel and the centre pinion, which
  # it drives, flash; then the key winds it, and the watch starts. The view
  # fits the movement in the slide band: it runs behind the title. The
  # pallet fork is not in the list: it is inside the others, and its extent
  # is the whole circle about its pivot
  3:
    watch:
      [
        *spring,
        barrel,
        escape wheel,
        escape pinion,
        escape arbor,
        fourth wheel,
        fourth pinion,
        fourth arbor,
        third wheel,
        third pinion,
        third arbor,
        centre wheel,
        centre pinion,
        centre arbor,
        balance wheel,
        balance staff,
        hairspring,
        collet,
        stud,
        roller,
        impulse jewel,
        pallet fork,
        seconds hand,
        minute hand,
        centre pivot,
        chapter ring,
        case band,
        lug,
        crown,
        strap,
      ]
    watchFlash: [barrel, centre pinion]
    watchMainspring: barrel
    watchView:
      &movement [
        barrel,
        centre wheel,
        third wheel,
        fourth wheel,
        escape wheel,
        balance wheel,
        hairspring,
        stud,
      ]
    watchBand: slide
  # a time-lapse, until the barrel has turned once: then the watch stops
  4:
    watchMainspring: run down
clicks: 4
class: mainspring
history: "c. 1430"
`,note:``,title:`Mainspring`,level:1,index:8,noteHTML:`<ul>
<li>Like the Hairspring</li>
</ul>
<p><span class="slidev-note-click-mark" data-clicks="1"></span> Hold the outside end.</p>
<p>Keeps its length.</p>
<p>Axle only turns one way.</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span> Only way to unwind: outside end.</p>
<p><span class="slidev-note-click-mark" data-clicks="3"></span> Attach to inside of barrel.</p>
<p>Barrel's teeth drive the gear train.</p>
<p>Currently too slow to see</p>
<p><span class="slidev-note-click-mark" data-clicks="4"></span> Time lapse.</p>
<p>Barrel turns once, the minute hand six times, and the mainspring moves out to the wall.</p>
`,images:[],raw:``,frontmatter:W,filepath:``,start:1037,sourceIndex:9,id:8,no:9},__clicksContext:null,__preloaded:!1}),G=o({watch:[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],watchView:[`barrel`,`centre wheel`,`third wheel`,`fourth wheel`,`escape wheel`,`balance wheel`,`hairspring`,`stud`],watchBand:`slide`,watchTilt:20,class:`hour-hand`,watchClicks:{1:{watch:[[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],[`cannon pinion`,`one-step hour wheel`]],watchFlash:[`cannon pinion`,`one-step hour wheel`]},2:{watch:[[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],[`cannon pinion`,`one-step hour wheel`],`one-step hour hand`]},3:{watch:[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],watchView:[`centre wheel`],watchBand:`picture`,watchDim:`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`)},4:{watch:[[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],[`cannon pinion`,`minute wheel`,`minute arbor`]],watchFlash:[`cannon pinion`,`minute wheel`]},5:{watch:[[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],[`cannon pinion`,`minute wheel`,`minute arbor`],[`minute pinion`,`hour wheel`]],watchFlash:[`minute pinion`,`hour wheel`]},6:{watch:[[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],[`cannon pinion`,`minute wheel`,`minute arbor`],[`minute pinion`,`hour wheel`],`hour hand`],watchView:[`barrel`,`centre wheel`,`third wheel`,`fourth wheel`,`escape wheel`,`balance wheel`,`hairspring`,`stud`],watchBand:`slide`,watchDim:!1}},clicks:6,history:`Hour hand: c. 1350`,narration:[{clicks:0,noFigure:!0,blocks:[{kind:`prose`,text:`<p>The hour hand must turn twice a day.  That’s once every twelve hours. Unlike the
60:1, a 12:1 gear is doable.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`prose`,text:`<p>But the hour hand on that wheel’s axle (<em>arbor</em>) is off center!  And it
would run backward (counterclockwise): a pair of meshing gears turn opposite
directions.</p>
`},{kind:`figure`,from:2,to:2,play:!1,alt:`The movement, with a 12:1 gear beside the center wheel. The hour
hand is on that gear's axle, far from the center of the dial.`}]},{clicks:4,noFigure:!1,blocks:[{kind:`prose`,text:`<p>So we use the same two-step trick we used for the minute hand.  This
time, 3:1 going out and 4:1 coming back.  3:1 × 4:1 = 12:1.</p>
`},{kind:`figure`,from:5,to:5,play:!1,alt:`The motion works, close up: the cannon pinion, the minute wheel
and its pinion, and the hour wheel. The rest of the watch is dimmed.`}]},{clicks:5,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The hour hand goes on the hour wheel, in the middle, under the minute
hand, attached to a hollow tube (pipe) that slips <em>over</em> the minute hand’s axle.
It turns clockwise, twice a day.</p>
`},{kind:`figure`,from:6,to:6,play:!1,alt:`The finished movement. The hour hand and the minute hand share the
center of the dial; the hour hand is the shorter one. The barrel is at the
bottom.`}]}]}),Et=s({get layout(){return G.layout},get transition(){return G.transition},get class(){return G.class},get clicks(){return G.clicks},get name(){return G.name},get preload(){return G.preload},slide:{content:``,revision:`-s6wnwp`,frontmatterRaw:`# the whole watch as the Mainspring slide leaves it, but the hour hand, in
# its view (the movement in the slide band), so the step from it does not
# move the camera; tilt 20 at every click. While the camera is in on the
# motion works, all but the centre wheel and the minute hand is dimmed
# (docs/watch.md, "The Hour Hand slide")
watch:
  &watch [
    &faint [
      barrel arbor,
      mainspring,
      barrel,
      centre pinion,
      escape wheel,
      escape pinion,
      escape arbor,
      fourth wheel,
      fourth pinion,
      fourth arbor,
      third wheel,
      third pinion,
      third arbor,
      balance wheel,
      balance staff,
      hairspring,
      collet,
      stud,
      roller,
      impulse jewel,
      pallet fork,
      seconds hand,
      chapter ring,
      case band,
      lug,
      crown,
      strap,
    ],
    &lit [centre wheel, centre arbor, minute hand, centre pivot],
  ]
watchView:
  &movement [
    barrel,
    centre wheel,
    third wheel,
    fourth wheel,
    escape wheel,
    balance wheel,
    hairspring,
    stud,
  ]
watchBand: slide
watchTilt: 20
class: hour-hand
watchClicks:
  # one wheel, 12 times slower: a pinion on the centre arbor (the cannon
  # pinion) and a wheel with 12 times its leaves. They fade in and flash
  1:
    watch: [*watch, &oneStep [cannon pinion, one-step hour wheel]]
    watchFlash: *oneStep
  # the hour hand on that wheel's arbor: off centre
  2:
    watch: [*watch, *oneStep, one-step hour hand]
  # the one-step wheel, its hand and its pinion go; the camera zooms in on
  # the centre wheel, in the picture band, and then all but the centre wheel
  # and the minute hand dims
  3:
    watch: *watch
    watchView: [centre wheel]
    watchBand: picture
    watchDim: *faint
  # the cannon pinion and the minute wheel fade in, and flash: out, 3:1
  4:
    watch: [*watch, &out [cannon pinion, minute wheel, minute arbor]]
    watchFlash: [cannon pinion, minute wheel]
  # the minute pinion and the hour wheel fade in, and flash: back, 4:1
  5:
    watch: [*watch, *out, &back [minute pinion, hour wheel]]
    watchFlash: *back
  # the camera zooms back out, the dim ends, and the hour hand fades in, on
  # the hour wheel, in the middle
  6:
    watch: [*watch, *out, *back, hour hand]
    watchView: *movement
    watchBand: slide
    watchDim: false
clicks: 6
history: "Hour hand: c. 1350"
`,note:``,title:`Hour Hand`,level:1,index:9,noteHTML:`<p><span class="slidev-note-click-mark" data-clicks="1"></span> 12:1 doable.</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span> Also runs backwards</p>
<p><span class="slidev-note-click-mark" data-clicks="6"></span> Runs clockwise.</p>
`,images:[],raw:``,frontmatter:G,filepath:``,start:1251,sourceIndex:10,id:9,no:10},__clicksContext:null,__preloaded:!1}),K=o({title:`Recap`,class:`recap after-watch`,watch:[`all`,`cannon pinion`,`minute wheel`,`minute pinion`,`minute arbor`,`hour wheel`],watchView:`recap motion works`,watchFlash:[`hour wheel`,`minute wheel`,`minute pinion`],watchFlashAfterMove:!0,watchUnwind:!0,watchWind:!0,watchTilt:30,watchMove:`together`,watchLapse:1440,watchTimeScale:!0,watchClicks:{1:{watchView:`recap barrel`,watchFlash:[`barrel`,`mainspring`,`barrel arbor`],watchLapse:720,watchWind:!0},2:{watchView:`recap barrel touch`,watchFlash:[`barrel`,`centre pinion`],watchTurn:80,watchTilt:80},3:{watchView:`recap centre touch`,watchFlash:[`centre wheel`,`third pinion`],watchTurn:-10,watchTilt:45,watchLapse:120,watchHide:[`hour hand`],watchGoLater:[`hour hand`]},4:{watchView:`recap third touch`,watchFlash:[`third wheel`,`fourth pinion`],watchTurn:15,watchLapse:15,watchHide:[`hour hand`,`minute hand`],watchGoLater:[`minute hand`]},5:{watchView:`recap fourth touch`,watchFlash:[`fourth wheel`,`escape pinion`],watchTurn:75,watchLapse:2},6:{watchView:`recap pallet`,watchFlash:[`escape wheel`,`pallet fork`],watchTurn:90,watchLapse:1},7:{watchView:`recap jewel`,watchFlash:[`impulse jewel`,`pallet fork`]},8:{watchView:`hairspring`,watchFlash:[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`],watchTurn:0,watchTilt:20,watchTimeScale:!1}},clicks:8,narration:[{clicks:0,noFigure:!1,blocks:[{kind:`prose`,text:`<p>And that’s how a mechanical watch works!</p>
<p>Here’s a recap, retracing our steps in reverse, from the hour hand to the
hairspring. The tour plays by itself, like a short film. The time scale in the
corner says how much faster than real time each segment runs.</p>
`},{kind:`figure`,from:0,to:8,play:!0,alt:`A tour of the watch's train, from the motion works to the
balance wheel, one touch at a time.`},{kind:`prose`,text:`<p>The hour hand is driven by a pair of gears totaling 12:1.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The wound mainspring drives the barrel.</p>
`}]},{clicks:2,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The barrel drives the <em>center wheel</em> holding the minute hand.</p>
`}]},{clicks:3,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The center wheel drives the <em>third wheel</em>.</p>
`}]},{clicks:4,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The third wheel drives the <em>fourth wheel</em>, which holds the second hand.</p>
`}]},{clicks:5,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The fourth wheel drives the <em>escape wheel</em>.</p>
`}]},{clicks:6,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The escape wheel wants to turn, but the <em>pallet</em> stops it.  Once a second, a tooth escapes, and the next one lands on the pallet, creating the ticking sound.</p>
`}]},{clicks:7,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The pallet moves when the <em>impulse jewel</em> hits it.</p>
`}]},{clicks:8,noFigure:!1,blocks:[{kind:`prose`,text:`<p>The balance wheel and the hairspring swing back and forth, setting the rate of the whole watch.</p>
`}]}]}),Dt=s({get layout(){return K.layout},get transition(){return K.transition},get class(){return K.class},get clicks(){return K.clicks},get name(){return K.name},get preload(){return K.preload},slide:{content:``,revision:`y0ex2e`,frontmatterRaw:`# A tour of the train with no text, from the motion works to the balance:
# the watch fills the slide. Each click is a stop. The camera moves, zooms,
# tilts and turns at the same time (watchMove: together), and the mechanism
# runs at the stop's speed-up: the slower of the two parts that touch turns
# once in 30 s (watchLapse). The views put each touch at the middle of the
# slide (watch/recap.ts; docs/watch.md, "The Recap slide")
title: Recap
class: recap after-watch
watch:
  [all, cannon pinion, minute wheel, minute pinion, minute arbor, hour wheel]
watchView: recap motion works
watchFlash: [hour wheel, minute wheel, minute pinion]
watchFlashAfterMove: true
watchUnwind: true
watchWind: true
watchTilt: 30
watchMove: together
watchLapse: 1440
watchTimeScale: true
watchClicks:
  # Wind before moving here, even after a long pause at the first stop.
  # The barrel turns once in 6 hours.
  1:
    watchView: recap barrel
    watchFlash: [barrel, mainspring, barrel arbor]
    watchLapse: 720
    watchWind: true
  # the barrel's teeth on the centre pinion, low, from about 3:40
  2:
    watchView: recap barrel touch
    watchFlash: [barrel, centre pinion]
    watchTurn: 80
    watchTilt: 80
  # back up over the movement: the centre wheel on the third pinion, with
  # the next touch behind it, as at each stop from here. From here the hour
  # hand moves too slowly to pass over a touch during a stop, so it goes
  # when the camera arrives; the minute hand, the centre wheel's own, stays
  # one stop more
  3:
    watchView: recap centre touch
    watchFlash: [centre wheel, third pinion]
    watchTurn: -10
    watchTilt: 45
    watchLapse: 120
    watchHide: [hour hand]
    watchGoLater: [hour hand]
  4:
    watchView: recap third touch
    watchFlash: [third wheel, fourth pinion]
    watchTurn: 15
    watchLapse: 15
    watchHide: [hour hand, minute hand]
    watchGoLater: [minute hand]
  # the fourth wheel turns once in 30 s, the escape wheel once in 15 s
  5:
    watchView: recap fourth touch
    watchFlash: [fourth wheel, escape pinion]
    watchTurn: 75
    watchLapse: 2
  # from here, the mechanism at its own speed
  6:
    watchView: recap pallet
    watchFlash: [escape wheel, pallet fork]
    watchTurn: 90
    watchLapse: 1
  7:
    watchView: recap jewel
    watchFlash: [impulse jewel, pallet fork]
  # where the Hairspring slide shows it, on the left
  8:
    watchView: hairspring
    watchFlash:
      [
        balance wheel,
        balance staff,
        hairspring,
        collet,
        stud,
        roller,
        impulse jewel,
      ]
    watchTurn: 0
    watchTilt: 20
    watchTimeScale: false
clicks: 8
`,note:``,title:`Recap`,index:10,noteHTML:`<p>That's how a mechanical watch works!</p>
<p>Two gears run the hour hand.</p>
<p><span class="slidev-note-click-mark" data-clicks="1"></span> Mainspring drives barrel.</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span> Barrel drives center wheel &amp; minute hand.</p>
<p><span class="slidev-note-click-mark" data-clicks="3"></span> Center wheel drives third wheel.</p>
<p><span class="slidev-note-click-mark" data-clicks="4"></span> Third wheel drives fourth wheel &amp; second hand.</p>
<p><span class="slidev-note-click-mark" data-clicks="5"></span> Fourth wheel drives escape wheel.</p>
<p><span class="slidev-note-click-mark" data-clicks="6"></span> Escape wheel wants to turn, pallet stops it.  Once/sec, a tooth escapes, next lands: tick.</p>
<p><span class="slidev-note-click-mark" data-clicks="7"></span> Impulse jewel hits pallet, rocks it.</p>
<p><span class="slidev-note-click-mark" data-clicks="8"></span> Set rate</p>
`,images:[],raw:``,frontmatter:K,filepath:``,start:1445,sourceIndex:11,id:10,no:11},__clicksContext:null,__preloaded:!1}),q=o({layout:`section`,side:`left`,eyebrow:`PART 2`,watch:`all`,watchView:`cover`,watchMoveAlso:[`hour hand`,`minute hand`]}),Ot=s({get layout(){return q.layout},get transition(){return q.transition},get class(){return q.class},get clicks(){return q.clicks},get name(){return q.name},get preload(){return q.preload},slide:{content:``,revision:`-6i9937`,frontmatterRaw:`# the cover's picture, as on Mechanical Marvels. The step from the Recap
# slide's last click moves in order (the default watchMove), the reverse of
# the step from Mechanical Marvels to the Hairspring slide: the motion works
# fade out, the hands that the Recap slide hid fade in, the camera tilts to
# 0, and then it zooms out
layout: section
side: left
eyebrow: PART 2
watch: all
watchView: cover
watchMoveAlso: [hour hand, minute hand]
`,note:``,title:`Changed The World`,level:1,index:11,noteHTML:`<p>And the whole watch.</p>
`,images:[],raw:``,frontmatter:q,filepath:``,start:1634,sourceIndex:12,id:11,no:12},__clicksContext:null,__preloaded:!1}),J=Array(12),Y=(e,t)=>a({loader:t,delay:300,loadingComponent:gt,errorComponent:F,onError:t=>console.error(`Failed to load slide `+(e+1),t)}),kt=async()=>{try{return J[0]??=await k(()=>import(`../md-Df-iu5Pw.js`),__vite__mapDeps([0,1,2,3,4,5,6]))}catch(e){return console.error(`slide failed to load`,e),F}},At=async()=>{try{return J[1]??=await k(()=>import(`../md-Ch-Zz2cI.js`),__vite__mapDeps([7,1,2,3,4,5,8,6]))}catch(e){return console.error(`slide failed to load`,e),F}},jt=async()=>{try{return J[2]??=await k(()=>import(`../md-B0_30umj.js`),__vite__mapDeps([9,1,2,3,4,5,10,11]))}catch(e){return console.error(`slide failed to load`,e),F}},Mt=async()=>{try{return J[3]??=await k(()=>import(`../md-DpvcvhvT.js`),__vite__mapDeps([12,1,2,3,11,4,5,10,13]))}catch(e){return console.error(`slide failed to load`,e),F}},Nt=async()=>{try{return J[4]??=await k(()=>import(`../md-B1dZSry8.js`),__vite__mapDeps([14,1,2,3,11,4,5,15,16,17,10,18,19,20]))}catch(e){return console.error(`slide failed to load`,e),F}},Pt=async()=>{try{return J[5]??=await k(()=>import(`../md-CixruCZF.js`),__vite__mapDeps([21,1,2,3,11,4,5,10,22]))}catch(e){return console.error(`slide failed to load`,e),F}},Ft=async()=>{try{return J[6]??=await k(()=>import(`../md-DnEgu2tJ.js`),__vite__mapDeps([23,1,2,3,11,4,5,15,16,17,10,18,19,24]))}catch(e){return console.error(`slide failed to load`,e),F}},It=async()=>{try{return J[7]??=await k(()=>import(`../md-xxtucC5A.js`),__vite__mapDeps([25,1,2,3,11,4,5,15,16,17,10,18,19,26]))}catch(e){return console.error(`slide failed to load`,e),F}},Lt=async()=>{try{return J[8]??=await k(()=>import(`../md-DVLNaA7A.js`),__vite__mapDeps([27,1,2,3,11,4,5,10,28]))}catch(e){return console.error(`slide failed to load`,e),F}},Rt=async()=>{try{return J[9]??=await k(()=>import(`../md-gPBCRMte.js`),__vite__mapDeps([29,1,2,3,11,4,5,10,30]))}catch(e){return console.error(`slide failed to load`,e),F}},zt=async()=>{try{return J[10]??=await k(()=>import(`../md-BBMCKE03.js`),__vite__mapDeps([31,1,2,3,11,4,5,10,32]))}catch(e){return console.error(`slide failed to load`,e),F}},Bt=async()=>{try{return J[11]??=await k(()=>import(`../md-78c6MNUj.js`),__vite__mapDeps([33,1,2,3,4,5,8,6]))}catch(e){return console.error(`slide failed to load`,e),F}},Vt=[{no:1,meta:_t,load:kt,component:Y(0,kt)},{no:2,meta:vt,load:At,component:Y(1,At)},{no:3,meta:yt,load:jt,component:Y(2,jt)},{no:4,meta:bt,load:Mt,component:Y(3,Mt)},{no:5,meta:xt,load:Nt,component:Y(4,Nt)},{no:6,meta:St,load:Pt,component:Y(5,Pt)},{no:7,meta:Ct,load:Ft,component:Y(6,Ft)},{no:8,meta:wt,load:It,component:Y(7,It)},{no:9,meta:Tt,load:Lt,component:Y(8,Lt)},{no:10,meta:Et,load:Rt,component:Y(9,Rt)},{no:11,meta:Dt,load:zt,component:Y(10,zt)},{no:12,meta:Ot,load:Bt,component:Y(11,Bt)}],X=v(Vt);function Ht(e,t,{mode:n=`replace`}={}){let r=S();return u({get(){let n=r.currentRoute.value.query[e];return n==null?t??null:Array.isArray(n)?n.filter(Boolean):n},set(i){f(()=>{(r.currentRoute.value.query[e]??t?.toString())!==i.toString()&&r[d(n)]({query:{...r.currentRoute.value.query,[e]:`${i}`===t?void 0:i}})})}})}function Ut(e,t,n=!1){let r=e.meta.slide?.frontmatter.routeAlias??e.no;return n?`/export/${r}`:t?`/presenter/${r}`:`/${r}`}function Z(e){return X.value.find(t=>t.no===+e||t.meta.slide?.frontmatter.routeAlias===e)}function Q(e,t,n=!1){return(typeof e==`number`||typeof e==`string`)&&(e=Z(e)),Ut(e,t,n)}var Wt={"slide-left":`slide-left | slide-right`,"slide-right":`slide-right | slide-left`,"slide-up":`slide-up | slide-down`,"slide-down":`slide-down | slide-up`};function Gt(e,t=!1){if(!e||(typeof e==`string`&&(e={name:e}),!e.name))return;let n=e.name.includes(`|`)?e.name:Wt[e.name]||e.name;if(n.includes(`|`)){let[e,r]=n.split(`|`).map(e=>e.trim());n=t?r:e}if(n)return{...e,name:n}}function Kt(e,t,n){let r=e>0?n?.meta?.transition:t?.meta?.transition;return r||=O.transition||void 0,Gt(r,e<0)}function qt(e){if(e===!1||e===`false`)return null;if(e==null||e===!0||e===`true`)return`+1`;if(typeof e==`string`&&`+-`.includes(e[0]))return e;let t=+e;return Number.isNaN(t)?(console.error(`Invalid "at" prop value: ${e}`),null):t<=0?(console.warn(`[Slidev] "at" prop value must be greater than 0, but got ${e}, has been set to 1`),1):t}function Jt(e){return Array.isArray(e)?[qt(e[0]),qt(e[1])]:null}function $(e,t=0,i){let a=g(!1),o=new Map,c=new Map,l={get current(){return D(+e.value,t,l.total)},set current(n){e.value=a.value?D(n,t,l.total):n},clicksStart:t,get relativeSizeMap(){return o},get maxMap(){return c},get isMounted(){return a.value},setup(){n(()=>{a.value=!0,c=s(c),_(e)||(l.current=e.value)}),r(()=>{a.value=!1,o=new Map,c=new Map})},calculateSince(e,t=1){let n=qt(e);if(n==null)return null;let r,i,a;if(typeof n==`string`){let e=l.currentOffset,o=+n;r=e+o,i=e+o+t-1,a=o+t-1}else r=n,i=n+t-1,a=0;return{start:r,end:1/0,max:i,delta:a,currentOffset:u(()=>l.current-r),isCurrent:u(()=>l.current===r),isActive:u(()=>l.current>=r)}},calculateRange(e){let t=Jt(e);if(t==null)return null;let[n,r]=t,i,a,o;return typeof n==`string`?(i=l.currentOffset+ +n,o=+n):(i=n,o=0),typeof r==`string`?(a=i+ +r,o+=+r):a=r,{start:i,end:a,max:a,delta:o,currentOffset:u(()=>l.current-i),isCurrent:u(()=>l.current===i),isActive:u(()=>i<=l.current&&l.current<a)}},calculate(e){return Array.isArray(e)?l.calculateRange(e):l.calculateSince(e)},register(e,t){if(!t)return;let{delta:n,max:r}=t;o.set(e,n),c.set(e,r)},unregister(e){o.delete(e),c.delete(e)},get currentOffset(){return de(...o.values())},get total(){return i??(a.value?Math.max(0,...c.values()):0)}};return l}function Yt(e,t=0){let n=e?.meta.slide?.frontmatter.clicksStart??0,r=g(Math.max(p(t),n));return h(()=>p(t),e=>{r.value=Math.max(e,n)}),$(r,n,e?.meta?.clicks)}function Xt(e,t,n=1){let r=t.meta.slide.level??n;r&&r>n&&e.length>0?Xt(e[e.length-1].children,t,n+1):e.push({no:t.no,children:[],level:n,titleLevel:r,path:Q(t.meta.slide?.frontmatter?.routeAlias??t.no,!1),hideInToc:!!t.meta?.slide?.frontmatter?.hideInToc,title:t.meta?.slide?.title})}function Zt(e,t,n=!1,r,i){return e.map(e=>{let a={...e,active:e.no===i?.value,hasActiveParent:n};return a.children.length>0&&(a.children=Zt(a.children,t,a.active||a.hasActiveParent,a,i)),r&&(a.active||a.activeParent)&&(r.activeParent=!0),a})}function Qt(e,t=1){return e.filter(e=>!e.hideInToc).map(e=>({...e,children:Qt(e.children,t+1)}))}function $t(e,t,n){let r=u(()=>e.value.filter(e=>e.meta?.slide?.title).reduce((e,t)=>(Xt(e,t),e),[])),i=u(()=>Zt(r.value,n.value,void 0,void 0,t));return u(()=>Qt(i.value))}function en(e,t,n=g(0),r,i,a){let o=u(()=>X.value.length),s=g(0),c=g(0),l=u(()=>Q(e.value,r.value)),d=u(()=>e.value.no),f=u(()=>e.value.meta?.layout||(d.value===1?`cover`:`default`)),p=u(()=>e.value.meta.slide.frontmatter),m=u(()=>t.value.current),_=u(()=>t.value.clicksStart),v=u(()=>t.value.total),y=u(()=>X.value[Math.min(X.value.length,d.value+1)-1]),b=u(()=>X.value[Math.max(1,d.value-1)-1]),ee=u(()=>d.value<X.value.length||m.value<v.value),te=u(()=>d.value>1||m.value>0),x=u(()=>i.value?void 0:Kt(s.value,e.value,b.value));h(e,(e,t)=>{s.value=e.no-t.no});async function S(e){return!1}let ne=$t(X,d,e);async function re(){c.value=1,v.value<=n.value?await C():n.value+=1}async function ie(){c.value=-1,n.value<=_.value?await ae(!0):--n.value}async function C(e=!1){c.value=1,d.value<X.value.length&&await T(d.value+1,e&&!i.value?E:void 0)}async function ae(e=!1){c.value=-1,d.value>1&&await T(d.value-1,e&&!i.value?E:void 0)}function oe(){return T(1)}function w(){return T(o.value)}async function T(e,t=0,i=!1){A.value=!1;let o=d.value!==e,s=t!==n.value,c=Z(e)?.meta,l=c?.slide?.frontmatter.clicksStart??0;t=D(t,l,c?.__clicksContext?.total??999999),(i||o||s)&&await a?.push({path:Q(e,r.value,a.currentRoute.value.name===`export`),query:{...a.currentRoute.value.query,clicks:t===0?void 0:t.toString(),embedded:location.search.includes(`embedded`)?`true`:void 0}})}function se(){a?.push({path:Q(d.value,!0),query:{...a.currentRoute.value.query}})}function ce(){a?.push({path:Q(d.value,!1),query:{...a.currentRoute.value.query}})}return{slides:X,total:o,currentPath:l,currentSlideNo:d,currentPage:d,currentSlideRoute:e,currentLayout:f,currentFrontmatter:p,currentTransition:x,clicksDirection:c,nextRoute:y,prevRoute:b,clicksContext:t,clicks:m,clicksStart:_,clicksTotal:v,hasNext:ee,hasPrev:te,tocTree:ne,navDirection:s,openInEditor:S,next:re,prev:ie,go:T,goLast:w,goFirst:oe,nextSlide:C,prevSlide:ae,enterPresenter:se,exitPresenter:ce}}function tn(e,t){let n=async()=>{};return{...en(u(()=>e),u(()=>t),g(E),g(!1),g(!1)),next:n,prev:n,nextSlide:n,prevSlide:n,goFirst:n,goLast:n,go:n}}var nn=ne(()=>{let e=S(),t=le(),n=u(()=>(e?.currentRoute?.value?.query,new URLSearchParams(location.search))),r=u(()=>n.value.has(`print`)||t.name===`export`),i=g(n.value.get(`print`)===`clicks`),a=u(()=>n.value.has(`embedded`)),o=u(()=>t.name===`play`),s=u(()=>t.name===`presenter`),c=u(()=>t.name===`notes`),l=u(()=>!s.value&&(!O.remote||n.value.get(`password`)===O.remote)),d=u(()=>!!t.params.no),f=u(()=>d.value?Z(t.params.no)?.no??1:1),p=u(()=>X.value[f.value-1]),m=g(dt(X.value.length,t?.query?.range)),h=Ht(`clicks`,`0`),_=u(()=>y(p.value)),v=u({get(){let e=+(h.value||0);return Number.isNaN(e)&&(e=0),e},set(e){A.value=!1,h.value=e.toString()}});function y(e){if(e?.meta?.__clicksContext)return e.meta.__clicksContext;let t=e.no,n=$(u({get(){return f.value===t?Math.max(+(h.value??0),n.clicksStart):f.value>t?E:n.clicksStart},set(e){f.value===t&&(h.value=e.toString())}}),e?.meta.slide?.frontmatter.clicksStart??0,e?.meta.clicks);return e?.meta&&(e.meta.__clicksContext=n),n}return{router:e,currentRoute:u(()=>t),isPrintMode:r,isPrintWithClicks:i,isEmbedded:a,isPlaying:o,isPresenter:s,isNotesViewer:c,isPresenterAvailable:l,hasPrimarySlide:d,currentSlideNo:f,currentSlideRoute:p,clicksContext:_,queryClicksRaw:h,queryClicks:v,printRange:m,getPrimaryClicks:y}}),rn=ne(()=>{let e=nn(),t=S(),n=en(e.currentSlideRoute,e.clicksContext,e.queryClicks,e.isPresenter,e.isPrintMode,t);return h([n.total,e.currentRoute],async()=>{let t=e.currentRoute.value.params.no;e.hasPrimarySlide.value&&!Z(t)&&(t&&t!==`index.html`?await n.go(n.total.value,0,!0):await n.go(1,0,!0))},{flush:`pre`,immediate:!0}),{...n,...e}});function an(){let e=rn(),n=t()?T(ue,void 0):void 0;if(!n)return e;let r=c(n).nav;return{...e,...r}}export{Se as $,Le as A,Xe as B,We as C,N as D,Be as E,j as F,ze as G,nt as H,Ae as I,we as J,k as K,Ke as L,Me as M,je as N,M as O,Ne as P,Ce as Q,ct as R,Qe as S,Ve as T,P as U,it as V,qe as W,xe as X,ye as Y,be as Z,He as _,Z as a,A as b,ut as c,Re as d,O as et,Ye as f,$e as g,et as h,Yt as i,Ze as j,Fe as k,tt as l,Pe as m,an as n,he as nt,Q as o,ot as p,ve as q,$ as r,X as s,tn as t,D as tt,Ue as u,rt as v,Ge as w,at as x,Je as y,st as z};