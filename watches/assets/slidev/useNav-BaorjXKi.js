const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/md-BC4X8K8-.js","assets/modules/shiki-DBvDcmFy.js","assets/rolldown-runtime-hePW80VL.js","assets/modules/shiki-V4-KMA-J.css","assets/slidev/context-TGnoAGXg.js","assets/modules/vue-C6E7mdT1.js","assets/side-DUO1L8F5.js","assets/md-DAA5ExEy.js","assets/section-BuOMTY_n.js","assets/md-C-9k6Kal.js","assets/slidev/default-CJxDfDxO.js","assets/_plugin-vue_export-helper-BDNMzG2s.js","assets/md-Blbcwb7Q.js","assets/md-CH19j1cX.css","assets/md-BNVU8_TF.js","assets/index-DUsAR40g.js","assets/syncState-CsnrAae0.js","assets/index-B_SceTKd.css","assets/WatchCallout-mQtUAlJv.js","assets/WatchCallout-C0HS2701.css","assets/md-DdOLHjlX.css","assets/md-Dj8Pgjii.js","assets/md-CpR_OJKB.css","assets/md-RhIs2KF5.js","assets/md-CFUtmNG7.css","assets/md-C-OlF1GT.js","assets/md-_6fRJrC6.css","assets/md-Dr59CAiI.js","assets/md-S63komdj.css","assets/md-BoCpmkrt.js","assets/md-Ca1SN-PB.css","assets/md-oIK1xmIP.js","assets/md-D-MdjRsI.js"])))=>i.map(i=>d[i]);
import{C as e,D as t,F as n,I as r,L as i,S as a,at as o,ct as s,dt as c,g as l,h as u,ht as d,j as f,mt as p,p as m,q as h,st as g,tt as _,ut as v,v as y,y as b,yt as ee}from"../modules/shiki-DBvDcmFy.js";import{t as te}from"../_plugin-vue_export-helper-BDNMzG2s.js";import{A as x,B as S,E as ne,I as re,T as ie,a as C,c as ae,g as oe,h as w,k as T,l as se,m as ce,z as le}from"../modules/vue-C6E7mdT1.js";import{l as E,y as ue}from"./context-TGnoAGXg.js";function D(e,t,n){return Math.min(n,Math.max(t,e))}function de(...e){return pe(e).reduce((e,t)=>e+t,0)}function fe(e){return e??=[],Array.isArray(e)?e:[e]}function pe(e){return fe(e).flat(1)}function me(e){return Array.from(new Set(e))}function he(...e){let t,n,r;e.length===1?(t=0,r=1,[n]=e):[t,n,r=1]=e;let i=[],a=t;for(;a<n;)i.push(a),a+=r||1;return i}function ge(e){return e!=null}function _e(e,t){return Object.fromEntries(Object.entries(e).map(([e,n])=>t(e,n)).filter(ge))}var O={theme:`house`,title:`What Every Nerd Should Know About Watches`,titleTemplate:`%s - Slidev`,addons:[`palette-ledger`,`@/addons/narration`],remoteAssets:!1,monaco:!0,monacoTypesSource:`local`,monacoTypesAdditionalPackages:[],monacoTypesIgnorePackages:[],monacoRunAdditionalDeps:[],monacoRunUseStrict:!0,download:!1,export:{},info:!1,highlighter:`shiki`,twoslash:!0,lineNumbers:!1,colorSchema:`light`,routerMode:`history`,aspectRatio:1.7777777777777777,canvasWidth:980,exportFilename:``,selectable:!1,themeConfig:{},fonts:{sans:[`"IBM Plex Sans"`,`ui-sans-serif`,`system-ui`,`-apple-system`,`BlinkMacSystemFont`,`"Segoe UI"`,`Roboto`,`"Helvetica Neue"`,`Arial`,`"Noto Sans"`,`sans-serif`,`"Apple Color Emoji"`,`"Segoe UI Emoji"`,`"Segoe UI Symbol"`,`"Noto Color Emoji"`],serif:[`"Fraunces"`,`ui-serif`,`Georgia`,`Cambria`,`"Times New Roman"`,`Times`,`serif`],mono:[`"IBM Plex Mono"`,`ui-monospace`,`SFMono-Regular`,`Menlo`,`Monaco`,`Consolas`,`"Liberation Mono"`,`"Courier New"`,`monospace`],webfonts:[`IBM Plex Sans`,`Fraunces`,`IBM Plex Mono`],provider:`none`,local:[],italic:!1,weights:[`200`,`400`,`600`]},favicon:!1,drawings:{enabled:!0,persist:!1,presenterOnly:!1,syncAll:!0},plantUmlServer:`https://www.plantuml.com/plantuml`,codeCopy:!0,magicMoveCopy:!0,author:`Martin C. Martin`,record:`dev`,css:`unocss`,presenter:!0,browserExporter:`dev`,htmlAttrs:{},transition:`text-fade`,editor:!0,mcp:!0,contextMenu:null,wakeLock:!0,pwa:!1,mdc:!1,comark:!1,seoMeta:{},notesAutoRuby:{},duration:`30min`,timer:`stopwatch`,magicMoveDuration:800,shiki:{},preloadImages:!0,clickAnimation:``,hide:!0,slidesTitle:`What Every Nerd Should Know About Watches - Slidev`},ve=`build`,ye=u(()=>O.aspectRatio),be=u(()=>O.canvasWidth),xe=u(()=>Math.ceil(be.value/ye.value)),Se=u(()=>_e(O.themeConfig||{},(e,t)=>[`--slidev-theme-${e}`,t])),Ce=O.slidesTitle,we=`/slidev-stem/watches/`,Te=`modulepreload`,Ee=function(e){return`/slidev-stem/watches/`+e},De={},Oe=function(e){return e.pathname.endsWith(`.css`)},ke=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},k=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=Ee(t,n);let r=s(t),i=Oe(r);return ke(De,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:Te,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{t.addEventListener(`load`,e),t.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${r}`)))})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Ae=g(!1),je=g(!1),Me=g(!1),Ne=g(!1),A=g(!1),Pe=g(!1),Fe=g(!0),Ie=o(new Set),Le=u(()=>Ie.size>0),Re=se({xs:460,...C}),ze=ie(),Be=oe(),Ve=u(()=>ze.height.value-ze.width.value/ye.value>120),He=ce(x?document.body:null),Ue=ae(),We=u(()=>[`INPUT`,`TEXTAREA`].includes(Ue.value?.tagName||``)),Ge=u(()=>[`BUTTON`,`A`].includes(Ue.value?.tagName||``));w(`slidev-camera`,`default`,{listenToStorageChanges:!1}),w(`slidev-mic`,`default`,{listenToStorageChanges:!1});var Ke=w(`slidev-scale`,0),qe=w(`slidev-wake-lock`,!0),Je=w(`slidev-hide-cursor-idle`,!0);w(`slidev-skip-export-pdf-tip`,!1),w(`slidev-export-capture-delay`,400,{listenToStorageChanges:!1});var j=w(`slidev-presenter-cursor`,!0,{listenToStorageChanges:!1}),Ye=w(`slidev-cursor-style`,`cursor`,{listenToStorageChanges:!1});function Xe(){j.value=!j.value}var Ze=w(`slidev-show-editor`,!1,{listenToStorageChanges:!1}),Qe=w(`slidev-editor-vertical`,!1,{listenToStorageChanges:!1}),$e=w(`slidev-editor-width`,x?window.innerWidth*.4:318,{listenToStorageChanges:!1}),et=w(`slidev-editor-height`,x?window.innerHeight*.4:300,{listenToStorageChanges:!1}),tt=v(null),M=w(`slidev-presenter-font-size`,1,{listenToStorageChanges:!1}),N=w(`slidev-presenter-layout`,1,{listenToStorageChanges:!1}),P={invert:!1,contrast:1,brightness:1,hueRotate:0,saturate:1,sepia:0},nt=w(`slidev-viewer-css-filter`,P,{listenToStorageChanges:!1,mergeDefaults:!0,deep:!0}),rt=u(()=>Object.keys(P).some(e=>nt.value[e]!==P[e]));function it(){N.value+=1,N.value>3&&(N.value=1)}function at(){M.value=Math.min(2,M.value+.1)}function ot(){M.value=Math.max(.5,M.value-.1)}var st=re(Ne),ct=w(`slidev-sync-directions`,{viewerSend:!0,viewerReceive:!0,presenterSend:!0,presenterReceive:!0},{listenToStorageChanges:!1,mergeDefaults:!0}),lt=/[a-z]/i;function ut(e){if(typeof e==`number`)return{seconds:e,relative:!1};let t=e.startsWith(`+`);t&&(e=e.slice(1));let n=0;if(e.includes(`:`)){let t=e.split(`:`).map(Number),r=0,i=0,a=0;if(t.length===3)r=t[0],i=t[1],a=t[2];else if(t.length===2)i=t[0],a=t[1];else if(t.length===1)a=t[0];else throw TypeError(`Invalid timestamp format`);if(Number.isNaN(r)||Number.isNaN(i)||Number.isNaN(a))throw TypeError(`Invalid timestamp format`);n=(r||0)*3600+(i||0)*60+(a||0)}else if(lt.test(e)){let t={s:1,sec:1,secs:1,m:60,min:60,mins:60,h:3600,hr:3600,hrs:3600,hour:3600,hours:3600,day:86400,days:86400,week:604800,weeks:604800,month:2629746,months:2629746,year:31556952,years:31556952},r=/([\d.]+)([a-z]+)/gi,i=e.matchAll(r);if(i)for(let e of i){let r=Number(e[1]);if(Number.isNaN(r))throw TypeError(`Invalid timestamp value: ${e[1]}`);let i=e[2].toLowerCase();if(!(i in t))throw TypeError(`Invalid timestamp unit: ${i}`);n+=r*t[i]}let a=e.replace(r,``).trim();if(a)throw TypeError(`Unknown timestamp remaining: ${a}`)}else if(n=Number(e),Number.isNaN(n))throw TypeError(`Invalid timestamp format`);return{seconds:n,relative:t}}function dt(e,t){if(!t||t===`all`||t===`*`)return he(1,e+1);if(t===`none`)return[];let n=[];for(let r of t.split(/[,;]/g))if(!r.includes(`-`))n.push(+r);else{let[t,i]=r.split(`-`,2);n.push(...he(+t,i?+i+1:e+1))}return me(n).filter(t=>t<=e).sort((e,t)=>e-t)}var ft={},pt={class:`px-4 py-10 text-center text-red-700 dark:text-red-500 font-bold font-mono`};function mt(e,t){return i(),b(`div`,pt,ee(`Failed to fetch this slide. Please check your network connection.`))}var F=te(ft,[[`render`,mt]]),ht={class:`h-full w-full flex items-center justify-center gap-2 slidev-slide-loading`},gt=e({__name:`SlideLoading`,setup(e){let t=g(!1);return n(()=>{setTimeout(()=>{t.value=!0},200)}),(e,n)=>(i(),b(`div`,ht,[t.value?(i(),b(m,{key:0},[n[0]||=l(`div`,{class:`i-svg-spinners-90-ring-with-bg text-xl`},null,-1),n[1]||=l(`div`,null,`Loading slide...`,-1)],64)):y(`v-if`,!0)]))}}),I=o({layout:`cover`,side:`left`,watch:`all`,watchView:`cover`,article:{0:{view:`centred cover`}},narration:[{clicks:0,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Mechanical watches have kept time for 500 years.  This page explains how a
modern one works.  I personally think it’s fascinating that a purely mechanical
device can keep time with 99.99% accuracy for $100.  They also changed the world
and look good on your wrist.</p>
<p>This presentation was partially inspired by Bartosz Ciechanowski’s <a href="https://ciechanow.ski/mechanical-watch/">Mechanical
Watch</a> page.  You can think of this
talk as a simpler introduction or background.  When you’re finished with this,
that page gives more depth.</p>
`},{kind:`figure`,from:null,to:null,play:!1,alt:`The whole watch, running: its wheels, its balance wheel and its
hands, inside the case.`}]}]}),_t=s({get layout(){return I.layout},get transition(){return I.transition},get class(){return I.class},get clicks(){return I.clicks},get name(){return I.name},get preload(){return I.preload},slide:{content:``,revision:`p0o9w`,frontmatterRaw:`# The live watch stays in the same view on the cover and section.
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
`,note:``,title:`Mechanical Marvels`,level:1,index:1,noteHTML:``,images:[],raw:``,frontmatter:L,filepath:``,start:63,sourceIndex:2,id:1,no:2},__clicksContext:null,__preloaded:!1}),R=o({watch:[`hairspring`,`collet`,`stud`],watchView:`hairspring`,watchFlash:[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`],watchMoveWith:`all`,watchTilt:20,watchClicks:{2:{watchAtRest:!0},3:{watchAtRest:!1}},board:1,boardCurl:2,clicks:3,article:{2:{slider:`curl`},3:{slider:`twist`}},history:`c. 1675`,narration:[{clicks:0,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Start with the part that keeps time.  In 1675 Christiaan Huygens, a Dutch
scientist, invented the <em>hairspring</em>. It is a flat spiral of steel ribbon, finer
than a hair. Its outer end is held still, and its inner end is free to
turn. Twist the inner end and let go, and the spiral winds and unwinds, back and
forth, at a steady rate. In this drawing it swings once every two seconds, and
the rest of the watch follows that beat.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Why does a spring swing? Think of a diving board. Bend it down, and
it pushes back: an <em>elastic restoring force</em>. Let go, and it does not stop at
straight. It overshoots, bends the other way, and comes back again: it
<em>oscillates</em>. With no friction, it would oscillate for ever.</p>
`}]},{clicks:2,noFigure:!1,blocks:[{kind:`prose`,html:`<p>A hairspring is a diving board rolled up. The board’s rest shape is a
straight line; the hairspring’s is a spiral. Take hold of the slider under
the next picture, and drag it to the right.</p>
`},{kind:`figure`,from:2,to:2,play:!1,alt:`The diving board curls up into the hairspring, at rest. A slider
curls it.`}]},{clicks:3,noFigure:!1,blocks:[{kind:`prose`,html:`<p>“Bend” becomes “wind”, and “straight” becomes “rest”. Now give the
hairspring a twist: drag the slider to wind the spiral away from its rest
shape, and let go.</p>
`},{kind:`figure`,from:3,to:3,play:!1,alt:`The hairspring at rest. A slider winds it; let go, and it swings
back and forth.`},{kind:`prose`,html:`<p>It pushes back. It overshoots and swings, just as the board did. This one
move is the whole idea of the hairspring.</p>
`}]}]}),yt=s({get layout(){return R.layout},get transition(){return R.transition},get class(){return R.class},get clicks(){return R.clicks},get name(){return R.name},get preload(){return R.preload},slide:{content:``,revision:`o05gty`,frontmatterRaw:`watch: [hairspring, collet, stud]
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
`,images:[],raw:``,frontmatter:R,filepath:``,start:74,sourceIndex:3,id:2,no:3},__clicksContext:null,__preloaded:!1}),z=o({watch:[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`],watchView:`hairspring`,watchTilt:20,watchFlash:[`balance wheel`,`balance staff`],class:`balance-wheel`,clicks:3,history:`c. 1364`,narration:[{clicks:0,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The hairspring is only half of the timekeeper. The other half is the <em>balance
wheel</em>.  While most of its mass is around the outside, it is actually fixed to
the spring’s inner end. The spring provides the <em>restoring force</em>. The wheel
provides the <em>mass</em> and <em>inertia</em>.</p>
`},{kind:`figure`,from:3,to:3,play:!1,alt:`The balance wheel on the hairspring, swinging. The wheel is
marked.`},{kind:`prose`,html:`<p>A hairspring alone would oscillate far too fast to count.  The wheel slows it to a
pace that the gears can count.</p>
`},{kind:`aside`,title:`Why a wheel, and not a disc?`,html:`<p>Mass at the rim counts most, like a figure skater who spins slower with her
arms out. Old balance wheels had screws round the rim, and watchmakers moved
them in or out to make the watch run slower or faster. The swing also takes
about the same time whether it swings through a big angle or small angle
(<em>isochronism</em>). That comes from the spring and the mass together, and it is
why a watch keeps time even while the watch winds down.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Mass also makes the swing steady. Push an empty playground swing, and it
jerks about. Put a child on it and it swings much more gracefully. A heavy wheel
carries its own momentum, so a knock to your wrist, or turning it upside down,
barely changes its rhythm.</p>
`}]},{clicks:2,noFigure:!1,blocks:[{kind:`prose`,html:`<p>How good is it? A well-calibrated mechanical watch, even an everyday
Seiko or Citizen, is about 99.99% accurate.  A day has 86,400 seconds, so a good
watch gains or loses about nine seconds a day.</p>
<p>I’m not particularly handy with mechanical things, if I tried to build a table
it would wobble because things would be off by a few percent.  So it kind of
blows my mind that, for $100, I can get a simple, everyday, purely mechanical
system and tweak it to be 99.99% accurate!</p>
`}]}]}),bt=s({get layout(){return z.layout},get transition(){return z.transition},get class(){return z.class},get clicks(){return z.clicks},get name(){return z.name},get preload(){return z.preload},slide:{content:``,revision:`-ok9kz0`,frontmatterRaw:`watch: [balance wheel, balance staff, hairspring, collet, stud]
watchView: hairspring
watchTilt: 20
watchFlash: [balance wheel, balance staff]
class: balance-wheel
clicks: 3
history: "c. 1364"
`,note:``,title:`Balance Wheel`,level:1,index:3,noteHTML:`<p><span class="slidev-note-click-mark" data-clicks="1"></span> - wrist bump or upside down</p>
`,images:[],raw:``,frontmatter:z,filepath:``,start:156,sourceIndex:4,id:3,no:4},__clicksContext:null,__preloaded:!1}),B=o({watch:[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`escape arbor`],watchView:[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`escape arbor`],watchTilt:20,watchClicks:{1:{watch:[`escape wheel`,`escape arbor`,`escape wheel drive`],watchSpin:135},2:{watch:[[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`escape arbor`],`escape wheel drive`],watchSpin:!1},3:{watchAtRest:!0},4:{watchAtRest:!1,watchTickTock:!0}},clicks:4,history:`c. 1275`,narration:[{clicks:0,noFigure:!0,blocks:[{kind:`prose`,html:`<p>A second hand that just moves back and forth isn’t very useful, we need it to
turn one way only.  The <em>escapement</em> turns the swing into steps.</p>
<p>The <em>escape wheel</em> is being turned by a mechanism we’ll explain soon, so it’s
hidden on this slide.  Without something to stop it, it would just turn and
turn.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`The escape wheel alone, spinning freely. A curved arrow shows the
push on it.`}]},{clicks:2,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The <em>pallet fork</em> stops it.</p>
`},{kind:`figure`,from:null,to:null,play:!1,alt:null},{kind:`prose`,html:`<p>Its two prongs (called <em>stones</em>) stick in the wheel’s teeth: a tooth lands on a
stone, and the wheel stops. Each time the fork rocks, one stone lets a tooth go,
and the other stone catches the next tooth.  The tooth <em>escapes</em>, and that is
where the name comes from.</p>
`}]},{clicks:3,noFigure:!1,blocks:[{kind:`prose`,html:`<p>What rocks the fork? The balance does. On its staff is a small <em>impulse
jewel</em>, which sits in the notch at the end of the fork.  It’s actually a
synthetic ruby or sapphire, so it really is a jewel, a precious stone.</p>
`},{kind:`figure`,from:null,to:null,play:!1,alt:`The escapement at rest, labelled: the escape wheel, the pallet
fork, and the impulse jewel in the fork's notch.`},{kind:`prose`,html:`<p>As the balance swings through the middle, the jewel strikes the fork and
flips it one way. On the swing back, it flips it the other way.</p>
`}]},{clicks:4,noFigure:!1,blocks:[{kind:`prose`,html:`<p>So, at each swing, the balance lets the wheel take one small step.  The
jewel hits the fork hard enough to make a sound: this is the tick and the tock
of a watch. The push goes both ways, too. At each strike, a little energy flows
from the wheel, through the fork, into the balance, and keeps it swinging.</p>
`}]}]}),xt=s({get layout(){return B.layout},get transition(){return B.transition},get class(){return B.class},get clicks(){return B.clicks},get name(){return B.name},get preload(){return B.preload},slide:{content:``,revision:`-q8cpdt`,frontmatterRaw:`watch:
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
  # it swings again, and the leader fades out; "tick" and "tock" show at
  # each strike of the jewel (docs/watch.md)
  4:
    watchAtRest: false
    watchTickTock: true
clicks: 4
history: "c. 1275"
`,note:``,title:`Escapement`,level:1,index:4,noteHTML:`<ul>
<li>second hand: turn one direction</li>
</ul>
<p><span class="slidev-note-click-mark" data-clicks="1"></span>  turning force, explained soon</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span>  Stick in teeth.</p>
<ul>
<li>Each rock lets a tooth <em>escape</em>.</li>
</ul>
<p><span class="slidev-note-click-mark" data-clicks="3"></span> Synthetic ruby or sapphire.  Really is a jewel!</p>
<p><span class="slidev-note-click-mark" data-clicks="4"></span></p>
`,images:[],raw:``,frontmatter:B,filepath:``,start:283,sourceIndex:5,id:4,no:5},__clicksContext:null,__preloaded:!1}),V=o({watch:[`seconds hand`,`fourth arbor`],watchView:[`seconds hand`],watchRight:438,watchTilt:20,class:`ticks-and-turns`,clicks:3,narration:[{clicks:0,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Before we go on, a quick puzzle that trips people up. How long does the
second hand take to go once round the dial?</p>
`},{kind:`figure`,from:3,to:3,play:!1,alt:`The second hand alone, pinned on its arbor, ticking once a
second.`},{kind:`prose`,html:`<p>Each step of the escapement moves the second hand one step: one tick, one
second. Sixty ticks bring it all the way round, and sixty seconds is a
minute. So the second hand makes a complete circle once a minute. A hand is
named for what it counts, not for how long it takes make a full 360° turn.</p>
<p>The other hands follow the same rule:</p>
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
<p>The minute hand counts sixty minutes, so it turns once an hour. The hour hand
counts the twelve hours on the dial, so it turns once in twelve hours: twice
a day.</p>
`},{kind:`aside`,title:`Why is this second hand not in the middle?`,html:`<p>On most watches the second hand is in the middle, with the minute and hour
hands.  But putting three hands all on the same shaft makes the diagram
confusing, and many older watches had their second hand off centre.
Watchmakers call it <em>small seconds</em>.</p>
`}]}]}),St=s({get layout(){return V.layout},get transition(){return V.transition},get class(){return V.class},get clicks(){return V.clicks},get name(){return V.name},get preload(){return V.preload},slide:{content:``,revision:`azgqpn`,frontmatterRaw:`# the seconds hand alone, so that the eye has only its ticks to count, one
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
`,note:``,title:`Ticks and Turns`,level:1,index:5,noteHTML:`<p>How long does second hand take to turn all the way aroumnd a full circle?</p>
<p><span class="slidev-note-click-mark" data-clicks="1"></span></p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span> Named for what it counts.</p>
<p><span class="slidev-note-click-mark" data-clicks="3"></span></p>
`,images:[],raw:``,frontmatter:V,filepath:``,start:432,sourceIndex:6,id:5,no:6},__clicksContext:null,__preloaded:!1}),H=o({watchView:[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`],watch:[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`],`fourth wheel span plain`,`escape pinion span plain`],watchRight:489,watchTilt:20,watchMoveWith:`none`,watchSpin:90,class:`gears`,watchClicks:{1:{watch:[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`],`fourth wheel span`,`escape pinion span`],watchFlash:[`fourth wheel span plain`,`escape pinion span plain`],watchCut:[`fourth wheel span plain`,`escape pinion span plain`,`fourth wheel span`,`escape pinion span`]},5:{watchSpin:!1,watch:[`fourth wheel drive`,[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`],`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`]},6:{watch:[[`fourth wheel drive`,[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`],`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`],`seconds hand`]}},clicks:6,history:`Second hand: c. 1670`,narration:[{clicks:0,noFigure:!0,blocks:[{kind:`prose`,html:`<p>The escapement gets the escape wheel turning at a precise rate.  But the second
hand must turn once a minute, and the escape wheel turns faster than that. To
convert a faster rotation into a slower one, a watch uses gears: a small gear
that drives a big one.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`figure`,from:4,to:4,play:!1,alt:`Two gears, turning: a small gear with eight teeth drives a big
gear with sixteen. Four teeth on each gear are coloured.`},{kind:`prose`,html:`<p>Here the small gear (in a watch, it is a <em>pinion</em>) has eight teeth, and the
big one has sixteen. Four teeth on each gear are coloured. Those four teeth
are half of the small gear, but only a quarter of the big one.</p>
`}]},{clicks:3,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The teeth must be the same size, or they would not mesh. Each tooth
fits in a gap of the other gear, so the teeth go past each other one for one,
and both rims move at the same speed. So the small gear turns twice for each
turn of the big one: twice the circumference, half the speed. And exactly so,
for ever: unlike a belt, teeth cannot slip.</p>
`},{kind:`aside`,title:`Must the teeth really be the same size?`,html:`<p>Strictly, the <em>pitch</em> must match: a tooth and its gap on one wheel must be as
long as a tooth and its gap on the other. One wheel can have wider teeth
and narrower gaps.</p>
`}]},{clicks:5,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Now put the escapement back. The gears do not spin freely any
more: they move on one tick at a time, with the escape wheel. The escapement
controls the whole train of gears.</p>
`}]},{clicks:6,noFigure:!1,blocks:[{kind:`prose`,html:`<p>In this watch, the big gear turns exactly once a minute: just what
the second hand needs. So the second hand goes on the big gear’s arbor. It is
the first part of the watch that we can read.</p>
`},{kind:`aside`,title:`Why does this second hand jump, when mine sweeps?`,html:`<p>This watch ticks once a second. Most real mechanical watches tick five to
eight times a second, so their second hands seem to sweep.</p>
`}]}]}),Ct=s({get layout(){return H.layout},get transition(){return H.transition},get class(){return H.class},get clicks(){return H.clicks},get name(){return H.name},get preload(){return H.preload},slide:{content:``,revision:`-xbwth`,frontmatterRaw:`# the camera stays when a click adds pieces
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
`,note:``,title:`Gears`,level:1,index:6,noteHTML:`<p>The second hand fades out. The fourth wheel and the escape wheel's pinion fade in, and turn: the pinion twice for each turn of the wheel.</p>
<p><span class="slidev-note-click-mark" data-clicks="1"></span> Four teeth on each gear are coloured: the same length of rim. They go through the mesh together, tooth for tooth, once each turn of the wheel. Four teeth are half the pinion, but a quarter of the wheel. Between, the pinion's coloured half comes round again on its own. The four teeth on each gear flash, and stay coloured. (Wait for one pass before the next click.)</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span> Half of the small gear: count them, four of its eight teeth. (The callout's leader points at the small gear.)</p>
<p><span class="slidev-note-click-mark" data-clicks="3"></span> A quarter of the big gear: the same four teeth, but four of its sixteen. (The leader points at the big gear.) The same length of rim, because the teeth must be the same size, or they do not mesh. Each tooth fits in one gap of the other gear, so the teeth go by one for one: both rims move at the same speed.</p>
<p><span class="slidev-note-click-mark" data-clicks="4"></span> Twice the size, half the speed. Exactly: teeth cannot slip, as a belt can. So the big gear turns once for every two turns of the small one, for ever.</p>
<p><span class="slidev-note-click-mark" data-clicks="5"></span> The rest of the escapement comes back, and the gears now advance one tick at a time: the escapement controls the whole train. (The text stays. The arrow is on the big gear now: something we can't see yet still pushes it.)</p>
<p><span class="slidev-note-click-mark" data-clicks="6"></span> The big gear turns once a minute: just what the second hand needs. So put the hand from two slides back on the gear's arbor: the first part of the watch that we read. (The hand fades in first, then the text, under the rule: &quot;Turns once a minute. The second hand!&quot;)</p>
<p>IF ASKED: This watch ticks once a second. Most real mechanical watches tick 5 to 8 times a second, so their second hands seem to sweep.</p>
<p>IF ASKED: Strictly, the pitch must match: a tooth plus its gap on one wheel equals a tooth plus its gap on the other. One wheel can have wider teeth and narrower gaps.</p>
`,images:[],raw:``,frontmatter:H,filepath:``,start:569,sourceIndex:7,id:6,no:7},__clicksContext:null,__preloaded:!1}),U=o({watch:[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],`fourth wheel drive`],watchView:[`escape wheel`,`fourth wheel`,`third wheel`,`centre wheel`],watchRight:489,watchTilt:20,class:`gear-train`,watchClicks:{1:{watch:[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],`fourth pinion`,`one-step wheel`,[`case band`,`lug`,`crown`,`raised strap`,`chapter ring`]],watchView:[`case band`],watchTilt:0,watchLater:[`case band`,`lug`,`crown`,`raised strap`,`chapter ring`],watchGoLater:[`fourth wheel drive`],watchFlash:[`one-step wheel`,`fourth pinion`]},2:{watch:[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],[`fourth pinion`,`third wheel`,`third arbor`],`third wheel drive`],watchView:[`escape wheel`,`fourth wheel`,`third wheel`,`centre wheel`],watchTilt:20,watchFlash:[`fourth pinion`,`third wheel`,`third arbor`]},3:{watch:[[[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],[`fourth pinion`,`third wheel`,`third arbor`],`third pinion`],`centre wheel`,`centre arbor`],`centre wheel drive`],watchFlash:[`third pinion`,`centre wheel`,`centre arbor`]},4:{watch:[[[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],[`fourth pinion`,`third wheel`,`third arbor`],`third pinion`],`centre wheel`,`centre arbor`],`centre wheel drive`,`centre pivot`,[`minute hand`,`chapter ring`,`case band`,`lug`,`crown`,`strap`]]},5:{watchDim:[[[`fourth wheel`,`fourth arbor`,`escape pinion`,`escape arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`escape wheel`,`seconds hand`],[`fourth pinion`,`third wheel`,`third arbor`],`third pinion`],[`minute hand`,`chapter ring`,`case band`,`lug`,`crown`,`strap`]]}},clicks:5,history:`Minute hand: c. 1656`,narration:[{clicks:0,noFigure:!0,blocks:[{kind:`prose`,html:`<p>The second hand turns once a minute. The minute hand must turn once an hour:
sixty times slower. How do you slow a turn down sixty times?</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`prose`,html:`<p>One gear could do it, with sixty times the teeth of the small gear:
240 teeth. Here it is, with the watch’s case for size. It is far bigger than
the watch.</p>
`}]},{clicks:2,noFigure:!1,blocks:[{kind:`figure`,from:2,to:3,play:!1,alt:`Two more pairs of gears, between the second hand's wheel and
the centre wheel. Step through them.`},{kind:`prose`,html:`<p>So the watch slows the turn in two stages. The <em>third wheel</em> has 30 teeth,
and it drives a pinion of 4 on the second hand’s arbor: seven and a half
times slower.</p>
`}]},{clicks:3,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The <em>centre wheel</em> has 32 teeth, and it drives a pinion of 4 on the
third wheel’s arbor: eight times slower. Seven and a half times eight is
sixty, so the centre wheel turns once an hour.</p>
`}]},{clicks:4,noFigure:!1,blocks:[{kind:`figure`,from:null,to:null,play:!1,alt:`The minute hand on the centre wheel's arbor, in the middle of the
case.`},{kind:`prose`,html:`<p>The minute hand goes on the centre wheel’s arbor, in the middle of the dial.
It makes a full turn once an hour.</p>
`}]},{clicks:5,noFigure:!0,blocks:[{kind:`prose`,html:`<p>But what pushes the centre wheel round? The push comes from further
back: from the part that powers the whole watch.</p>
`}]}]}),wt=s({get layout(){return U.layout},get transition(){return U.transition},get class(){return U.class},get clicks(){return U.clicks},get name(){return U.name},get preload(){return U.preload},slide:{content:``,revision:`8pi9q0`,frontmatterRaw:`# the Gears slide's last picture, in a view that frames the train from the
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
`,note:``,title:`Gear Train`,level:1,index:7,noteHTML:`<p>The camera zooms out, to make room for the wheels that drive the fourth wheel. The third wheel and the centre wheel do not show yet.</p>
<p>The second hand turns once a minute. The minute hand must turn once an hour, as the table said: sixty times slower.</p>
<p><span class="slidev-note-click-mark" data-clicks="1"></span> The text comes first: minute to hour is 60 to 1. One gear could do it: sixty times the teeth of the small gear, 240 teeth. The camera pulls back, and the arrow goes. The gear and the small gear that it drives fade in, then the watch around them, and the two gears flash: the big one is bigger than the watch.</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span> So it takes two more pairs of gears. The third wheel, and the small gear on the fourth wheel that it drives, fade in and flash. The arrow is on the third wheel now: the push comes from further back. 30 teeth drive 4: seven and a half times slower. Then the text: two stages, 7.5 to 1.</p>
<p><span class="slidev-note-click-mark" data-clicks="3"></span> The centre wheel, and the small gear on the third wheel that it drives, fade in and flash, and the arrow moves to it. 32 teeth drive 4: eight times slower: the text adds 8 to 1. Seven and a half times eight is sixty. The centre wheel turns once an hour.</p>
<p><span class="slidev-note-click-mark" data-clicks="4"></span> Put the minute hand on the centre wheel's arbor. The case and the dial fade in with it: this is the middle of the watch. Then the text: it makes a full turn once an hour. The minute hand!</p>
<p><span class="slidev-note-click-mark" data-clicks="5"></span> But what drives this wheel? The text fades out, and the rest of the watch dims. The centre wheel, its arbor, pivot and curved arrow stay bright: wheel driven by hidden mechanism.</p>
`,images:[],raw:``,frontmatter:U,filepath:``,start:775,sourceIndex:8,id:7,no:8},__clicksContext:null,__preloaded:!1}),W=o({watch:[`mainspring`,`barrel arbor`],watchView:[`mainspring`,`barrel arbor`],watchTilt:20,watchMainspring:`free`,article:{2:{slider:`wind`}},watchLinger:[{pieces:[`centre wheel`,`centre arbor`,`centre pivot`],seconds:1},{pieces:[`centre wheel drive`],seconds:1}],watchClicks:{1:{watch:[[`mainspring`,`barrel arbor`],`mainspring stud`,`mainspring rest`],watchFlash:[`mainspring stud`],watchMainspring:`wound`},2:{watch:[[`mainspring`,`barrel arbor`],`mainspring rest`],watchFlash:[`mainspring stud`],watchCut:[`mainspring stud`],watchMainspring:`released`},3:{watch:[[`mainspring`,`barrel arbor`],`barrel`,`escape wheel`,`escape pinion`,`escape arbor`,`fourth wheel`,`fourth pinion`,`fourth arbor`,`third wheel`,`third pinion`,`third arbor`,`centre wheel`,`centre pinion`,`centre arbor`,`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`,`pallet fork`,`seconds hand`,`minute hand`,`centre pivot`,`chapter ring`,`case band`,`lug`,`crown`,`strap`],watchFlash:[`barrel`,`centre pinion`],watchMainspring:`barrel`,watchView:[`barrel`,`centre wheel`,`third wheel`,`fourth wheel`,`escape wheel`,`balance wheel`,`hairspring`,`stud`],watchBand:`slide`},4:{watchMainspring:`run down`}},clicks:4,class:`mainspring`,history:`c. 1430`,narration:[{clicks:0,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The power comes from a spring too: the <em>mainspring</em>, a long ribbon of steel
coiled round an arbor. It is not like the hairspring. It does not swing back
and forth. It unwinds once, slowly, over a day or two.</p>
`}]},{clicks:1,noFigure:!0,blocks:[{kind:`figure`,from:2,to:2,play:!1,alt:`The bare mainspring on its arbor. A stud holds its outer end, and
a key turns the arbor. A slider winds it and then lets it go.`},{kind:`prose`,html:`<p>Hold the outer end still (the small block is a stud), and turn the arbor with
a key. The spring keeps its length, so its coils draw in toward the arbor.
Wind the spring away from its rest shape, the dashed line, and it pushes
back, as the hairspring does.</p>
<p>Drag the slider slowly to the right: the key winds the spring, three turns.
Keep going, and the stud lets go. The outer end swings round until the spring
lies on its rest shape again. That fling is the energy that the key put in.</p>
`}]},{clicks:3,noFigure:!1,blocks:[{kind:`figure`,from:3,to:4,play:!1,alt:`The mainspring in its barrel, driving the whole movement. The
next step runs six hours in six seconds.`},{kind:`prose`,html:`<p>In a watch, the mainspring lives in a drum, the <em>barrel</em>. Its outer end hooks
to the barrel’s wall, and its inner end to the arbor. The barrel has teeth,
and they drive the train that we built. Wind the arbor, and the watch starts:
the balance and the escapement let the train turn one tick at a time.</p>
`}]},{clicks:4,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Now the arbor is held, so the spring can let down only by turning the
barrel. Step the figure forward, and six hours pass in six seconds. The
barrel turns once, the minute hand six times, and the coils move back out to
the wall. When the spring is let down, the watch stops.</p>
`}]}]}),Tt=s({get layout(){return W.layout},get transition(){return W.transition},get class(){return W.class},get clicks(){return W.clicks},get name(){return W.name},get preload(){return W.preload},slide:{content:``,revision:`-up8k1w`,frontmatterRaw:`# the bare mainspring and its arbor, as large as the picture band; the
# camera stays at every click. The story (watchMainspring) turns the key,
# winds and lets down the spring, and says when the watch runs
# (docs/watch.md, "The Mainspring slide")
watch: &spring [mainspring, barrel arbor]
watchView: *spring
watchTilt: 20
watchMainspring: free
# In the article, the figure at click 2 has a slider that winds the spring
# and lets it go (docs/article.md)
article:
  2:
    slider: wind
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
`,note:``,title:`Mainspring`,level:1,index:8,noteHTML:`<p>The power comes from a spring too: the mainspring. A long ribbon of steel, coiled round an arbor. It is not the hairspring: it does not swing back and forth. It unwinds once, slowly, over days.</p>
<p><span class="slidev-note-click-mark" data-clicks="1"></span> A stud holds the outer end: it fades in and flashes. The dashed line is the spring's rest shape. A key fades in on the arbor, and turns it, a third of a turn at a time, three times. The spring winds up: it keeps its length, so its coils draw in toward the arbor. Winding causes tension: wind it away from rest, and it pushes back, as the hairspring does.</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span> Let go of the outer end: the stud flashes, and is gone. At once the outer end swings round, while the arbor still holds the inner end, until the spring is back on its rest shape.</p>
<p><span class="slidev-note-click-mark" data-clicks="3"></span> Put it in the barrel: the outer end hooks to the barrel's wall. The camera zooms out to the whole movement, as tall as the slide, and the barrel and the rest of the watch fade in. The barrel and the centre pinion flash: the barrel's teeth drive the train that we built. It is still: the spring is let down. The key winds it, and the watch starts as soon as the key starts to turn. The balance and the escapement let the train turn one tick at a time. Unwinding drives the barrel.</p>
<p><span class="slidev-note-click-mark" data-clicks="4"></span> The arbor is held now, so the spring can only let down by turning the barrel. Six hours in six seconds: the barrel turns once, the minute hand six times, and the coils move back out to the wall. When the spring is let down, the watch stops.</p>
`,images:[],raw:``,frontmatter:W,filepath:``,start:1004,sourceIndex:9,id:8,no:9},__clicksContext:null,__preloaded:!1}),G=o({watch:[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],watchView:[`barrel`,`centre wheel`,`third wheel`,`fourth wheel`,`escape wheel`,`balance wheel`,`hairspring`,`stud`],watchBand:`slide`,watchTilt:20,class:`hour-hand`,watchClicks:{1:{watch:[[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],[`cannon pinion`,`one-step hour wheel`]],watchFlash:[`cannon pinion`,`one-step hour wheel`]},2:{watch:[[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],[`cannon pinion`,`one-step hour wheel`],`one-step hour hand`]},3:{watch:[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],watchView:[`centre wheel`],watchBand:`picture`,watchDim:`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`)},4:{watch:[[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],[`cannon pinion`,`minute wheel`,`minute arbor`]],watchFlash:[`cannon pinion`,`minute wheel`]},5:{watch:[[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],[`cannon pinion`,`minute wheel`,`minute arbor`],[`minute pinion`,`hour wheel`]],watchFlash:[`minute pinion`,`hour wheel`]},6:{watch:[[`barrel arbor.mainspring.barrel.centre pinion.escape wheel.escape pinion.escape arbor.fourth wheel.fourth pinion.fourth arbor.third wheel.third pinion.third arbor.balance wheel.balance staff.hairspring.collet.stud.roller.impulse jewel.pallet fork.seconds hand.chapter ring.case band.lug.crown.strap`.split(`.`),[`centre wheel`,`centre arbor`,`minute hand`,`centre pivot`]],[`cannon pinion`,`minute wheel`,`minute arbor`],[`minute pinion`,`hour wheel`],`hour hand`],watchView:[`barrel`,`centre wheel`,`third wheel`,`fourth wheel`,`escape wheel`,`balance wheel`,`hairspring`,`stud`],watchBand:`slide`,watchDim:!1}},clicks:6,history:`Hour hand: c. 1350`,narration:[{clicks:0,noFigure:!0,blocks:[{kind:`prose`,html:`<p>The minute hand turns once an hour. The hour hand must turn twice a day: once
in twelve hours, twelve times slower.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Twelve to one is not much more than the eight to one of the last
stage. One pinion on the centre arbor, and a wheel with twelve times its
teeth, would do it.</p>
`}]},{clicks:2,noFigure:!1,blocks:[{kind:`prose`,html:`<p>But put the hour hand on that wheel’s arbor, and it is off centre!
An hour hand must be in the middle, under the minute hand. And it would run
backward: a gear turns the other way from the gear that drives it.</p>
`}]},{clicks:3,noFigure:!1,blocks:[{kind:`prose`,html:`<p>So the watch takes two steps instead, close to the middle of the
watch.</p>
`}]},{clicks:4,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The <em>cannon pinion</em>, on the centre arbor, drives the <em>minute wheel</em>:
three to one, out from the centre.</p>
`}]},{clicks:5,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The minute wheel’s own pinion drives the <em>hour wheel</em>, which turns on
the centre arbor: four to one, back to the middle. Three times four is
twelve, and the second step turns the hour wheel the right way round again.</p>
`},{kind:`figure`,from:5,to:5,play:!1,alt:`The motion works, close up: the cannon pinion, the minute wheel
and its pinion, and the hour wheel. The rest of the watch is dimmed.`}]},{clicks:6,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The hour hand goes on the hour wheel, in the middle, under the minute
hand. It turns twice a day.</p>
`}]}]}),Et=s({get layout(){return G.layout},get transition(){return G.transition},get class(){return G.class},get clicks(){return G.clicks},get name(){return G.name},get preload(){return G.preload},slide:{content:``,revision:`-f1f4a9`,frontmatterRaw:`# the whole watch as the Mainspring slide leaves it, but the hour hand, in
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
`,note:``,title:`Hour Hand`,level:1,index:9,noteHTML:`<p>The minute hand turns once an hour. The hour hand must turn twice a day, as the table said: once in twelve hours, twelve times slower.</p>
<p><span class="slidev-note-click-mark" data-clicks="1"></span> Twelve to one is not much more than the eight to one of the last stage. One pinion on the centre arbor, and a wheel with twelve times its teeth: forty-eight. They fade in and flash. Only one and a half times the centre wheel's size.</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span> Put the hour hand on its arbor. It is off centre! Wherever the wheel goes, its arbor is off centre. A seconds hand can live off centre; an hour hand cannot. (And it would run backwards: a gear turns the other way from the gear that drives it.)</p>
<p><span class="slidev-note-click-mark" data-clicks="3"></span> So, two steps. The big wheel and its pinion go, and the camera zooms in on the centre wheel. The rest of the watch dims, the big pinion that the barrel drives too, so that only the centre wheel and the minute hand are in full colour.</p>
<p><span class="slidev-note-click-mark" data-clicks="4"></span> The same small pinion comes back, and drives a small wheel, the minute wheel: three to one, out from the centre. They flash.</p>
<p><span class="slidev-note-click-mark" data-clicks="5"></span> The minute wheel's own pinion drives the hour wheel, which turns on the centre arbor: four to one, back to the centre. Three times four is twelve. And two steps turn it the right way again.</p>
<p><span class="slidev-note-click-mark" data-clicks="6"></span> Zoom back out, and the whole watch is in full colour again. The hour hand goes on the hour wheel. It turns twice a day, in the middle, under the minute hand. The hour hand!</p>
`,images:[],raw:``,frontmatter:G,filepath:``,start:1193,sourceIndex:10,id:9,no:10},__clicksContext:null,__preloaded:!1}),K=o({title:`Recap`,watch:[`all`,`cannon pinion`,`minute wheel`,`minute pinion`,`minute arbor`,`hour wheel`],watchView:`recap motion works`,watchFlash:[`hour wheel`,`minute wheel`,`minute pinion`],watchFlashAfterMove:!0,watchUnwind:!0,watchWind:!0,watchTilt:30,watchMove:`together`,watchLapse:1440,watchTimeScale:!0,watchClicks:{1:{watchView:`recap barrel`,watchFlash:[`barrel`,`mainspring`,`barrel arbor`],watchLapse:720,watchWind:!0},2:{watchView:`recap barrel touch`,watchFlash:[`barrel`,`centre pinion`],watchTurn:80,watchTilt:80},3:{watchView:`recap centre touch`,watchFlash:[`centre wheel`,`third pinion`],watchTurn:-10,watchTilt:45,watchLapse:120,watchHide:[`hour hand`],watchGoLater:[`hour hand`]},4:{watchView:`recap third touch`,watchFlash:[`third wheel`,`fourth pinion`],watchTurn:15,watchLapse:15,watchHide:[`hour hand`,`minute hand`],watchGoLater:[`minute hand`]},5:{watchView:`recap fourth touch`,watchFlash:[`fourth wheel`,`escape pinion`],watchTurn:75,watchLapse:2},6:{watchView:`recap pallet`,watchFlash:[`escape wheel`,`pallet fork`],watchTurn:90,watchLapse:1},7:{watchView:`recap jewel`,watchFlash:[`impulse jewel`,`pallet fork`]},8:{watchView:`hairspring`,watchFlash:[`balance wheel`,`balance staff`,`hairspring`,`collet`,`stud`,`roller`,`impulse jewel`],watchTurn:0,watchTilt:20,watchTimeScale:!1}},clicks:8,narration:[{clicks:0,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Here is the whole train at once, one touch at a time, from the hands back to
the balance. The tour plays by itself, like a short film. The time scale in
the corner says how much faster than real time each stop runs.</p>
`},{kind:`figure`,from:0,to:8,play:!0,alt:`A tour of the watch's train, from the motion works to the
balance wheel, one touch at a time.`},{kind:`prose`,html:`<p>The motion works, a day a minute: the minute pinion drives the hour wheel,
which turns once in thirty seconds.</p>
`}]},{clicks:1,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The barrel, with the mainspring inside. It turns once in six hours.</p>
`}]},{clicks:2,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Down low, from the side: the barrel’s teeth drive the centre pinion.</p>
`}]},{clicks:3,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The centre wheel drives the third pinion. The next touch is behind
it.</p>
`}]},{clicks:4,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The third wheel drives the fourth pinion.</p>
`}]},{clicks:5,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The fourth wheel, the second hand’s own, drives the escape pinion, at
twice its speed: once in fifteen seconds.</p>
`}]},{clicks:6,noFigure:!1,blocks:[{kind:`prose`,html:`<p>Real time now. The escape wheel’s teeth on the pallet’s stones.</p>
`}]},{clicks:7,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The impulse jewel in the fork.</p>
`}]},{clicks:8,noFigure:!1,blocks:[{kind:`prose`,html:`<p>The balance wheel and its hairspring, where we started.</p>
`}]}]}),Dt=s({get layout(){return K.layout},get transition(){return K.transition},get class(){return K.class},get clicks(){return K.clicks},get name(){return K.name},get preload(){return K.preload},slide:{content:``,revision:`-nlwivp`,frontmatterRaw:`# A tour of the train with no text, from the motion works to the balance:
# the watch fills the slide. Each click is a stop. The camera moves, zooms,
# tilts and turns at the same time (watchMove: together), and the mechanism
# runs at the stop's speed-up: the slower of the two parts that touch turns
# once in 30 s (watchLapse). The views put each touch at the middle of the
# slide (watch/recap.ts; docs/watch.md, "The Recap slide")
title: Recap
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
`,note:``,title:`Recap`,index:10,noteHTML:`<p>The whole train, one touch at a time. The motion works, a day a minute: the hour wheel turns once in 30 seconds, on the minute pinion.</p>
<p><span class="slidev-note-click-mark" data-clicks="1"></span> The barrel, and the spring inside it. Six hours a turn.</p>
<p><span class="slidev-note-click-mark" data-clicks="2"></span> Down low, from the side: the barrel's teeth on the centre pinion.</p>
<p><span class="slidev-note-click-mark" data-clicks="3"></span> Back up: the centre wheel on the third pinion. The next touch is behind it.</p>
<p><span class="slidev-note-click-mark" data-clicks="4"></span> The third wheel on the fourth pinion.</p>
<p><span class="slidev-note-click-mark" data-clicks="5"></span> The fourth wheel, the seconds hand's, on the escape pinion: twice its speed, once in 15 seconds.</p>
<p><span class="slidev-note-click-mark" data-clicks="6"></span> Real time now. The escape wheel on the pallet's stones.</p>
<p><span class="slidev-note-click-mark" data-clicks="7"></span> The impulse jewel in the fork.</p>
<p><span class="slidev-note-click-mark" data-clicks="8"></span> The balance wheel and its hairspring, where we started.</p>
`,images:[],raw:``,frontmatter:K,filepath:``,start:1392,sourceIndex:11,id:10,no:11},__clicksContext:null,__preloaded:!1}),q=o({layout:`section`,side:`left`,eyebrow:`PART 2`,watch:`all`,watchView:`cover`,watchMoveAlso:[`hour hand`,`minute hand`]}),Ot=s({get layout(){return q.layout},get transition(){return q.transition},get class(){return q.class},get clicks(){return q.clicks},get name(){return q.name},get preload(){return q.preload},slide:{content:``,revision:`-6i9937`,frontmatterRaw:`# the cover's picture, as on Mechanical Marvels. The step from the Recap
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
`,images:[],raw:``,frontmatter:q,filepath:``,start:1529,sourceIndex:12,id:11,no:12},__clicksContext:null,__preloaded:!1}),J=Array(12),Y=(e,t)=>a({loader:t,delay:300,loadingComponent:gt,errorComponent:F,onError:t=>console.error(`Failed to load slide `+(e+1),t)}),kt=async()=>{try{return J[0]??=await k(()=>import(`../md-BC4X8K8-.js`),__vite__mapDeps([0,1,2,3,4,5,6]))}catch(e){return console.error(`slide failed to load`,e),F}},At=async()=>{try{return J[1]??=await k(()=>import(`../md-DAA5ExEy.js`),__vite__mapDeps([7,1,2,3,4,5,8,6]))}catch(e){return console.error(`slide failed to load`,e),F}},jt=async()=>{try{return J[2]??=await k(()=>import(`../md-C-9k6Kal.js`),__vite__mapDeps([9,1,2,3,4,5,10,11]))}catch(e){return console.error(`slide failed to load`,e),F}},Mt=async()=>{try{return J[3]??=await k(()=>import(`../md-Blbcwb7Q.js`),__vite__mapDeps([12,1,2,3,11,4,5,10,13]))}catch(e){return console.error(`slide failed to load`,e),F}},Nt=async()=>{try{return J[4]??=await k(()=>import(`../md-BNVU8_TF.js`),__vite__mapDeps([14,1,2,3,11,4,5,15,16,17,10,18,19,20]))}catch(e){return console.error(`slide failed to load`,e),F}},Pt=async()=>{try{return J[5]??=await k(()=>import(`../md-Dj8Pgjii.js`),__vite__mapDeps([21,1,2,3,11,4,5,10,22]))}catch(e){return console.error(`slide failed to load`,e),F}},Ft=async()=>{try{return J[6]??=await k(()=>import(`../md-RhIs2KF5.js`),__vite__mapDeps([23,1,2,3,11,4,5,15,16,17,10,18,19,24]))}catch(e){return console.error(`slide failed to load`,e),F}},It=async()=>{try{return J[7]??=await k(()=>import(`../md-C-OlF1GT.js`),__vite__mapDeps([25,1,2,3,11,4,5,15,16,17,10,18,19,26]))}catch(e){return console.error(`slide failed to load`,e),F}},Lt=async()=>{try{return J[8]??=await k(()=>import(`../md-Dr59CAiI.js`),__vite__mapDeps([27,1,2,3,11,4,5,10,28]))}catch(e){return console.error(`slide failed to load`,e),F}},Rt=async()=>{try{return J[9]??=await k(()=>import(`../md-BoCpmkrt.js`),__vite__mapDeps([29,1,2,3,11,4,5,10,30]))}catch(e){return console.error(`slide failed to load`,e),F}},zt=async()=>{try{return J[10]??=await k(()=>import(`../md-oIK1xmIP.js`),__vite__mapDeps([31,1,2,3,4,5,10,11]))}catch(e){return console.error(`slide failed to load`,e),F}},Bt=async()=>{try{return J[11]??=await k(()=>import(`../md-D-MdjRsI.js`),__vite__mapDeps([32,1,2,3,4,5,8,6]))}catch(e){return console.error(`slide failed to load`,e),F}},Vt=[{no:1,meta:_t,load:kt,component:Y(0,kt)},{no:2,meta:vt,load:At,component:Y(1,At)},{no:3,meta:yt,load:jt,component:Y(2,jt)},{no:4,meta:bt,load:Mt,component:Y(3,Mt)},{no:5,meta:xt,load:Nt,component:Y(4,Nt)},{no:6,meta:St,load:Pt,component:Y(5,Pt)},{no:7,meta:Ct,load:Ft,component:Y(6,Ft)},{no:8,meta:wt,load:It,component:Y(7,It)},{no:9,meta:Tt,load:Lt,component:Y(8,Lt)},{no:10,meta:Et,load:Rt,component:Y(9,Rt)},{no:11,meta:Dt,load:zt,component:Y(10,zt)},{no:12,meta:Ot,load:Bt,component:Y(11,Bt)}],X=v(Vt);function Ht(e,t,{mode:n=`replace`}={}){let r=S();return u({get(){let n=r.currentRoute.value.query[e];return n==null?t??null:Array.isArray(n)?n.filter(Boolean):n},set(i){f(()=>{(r.currentRoute.value.query[e]??t?.toString())!==i.toString()&&r[d(n)]({query:{...r.currentRoute.value.query,[e]:`${i}`===t?void 0:i}})})}})}function Ut(e,t,n=!1){let r=e.meta.slide?.frontmatter.routeAlias??e.no;return n?`/export/${r}`:t?`/presenter/${r}`:`/${r}`}function Z(e){return X.value.find(t=>t.no===+e||t.meta.slide?.frontmatter.routeAlias===e)}function Q(e,t,n=!1){return(typeof e==`number`||typeof e==`string`)&&(e=Z(e)),Ut(e,t,n)}var Wt={"slide-left":`slide-left | slide-right`,"slide-right":`slide-right | slide-left`,"slide-up":`slide-up | slide-down`,"slide-down":`slide-down | slide-up`};function Gt(e,t=!1){if(!e||(typeof e==`string`&&(e={name:e}),!e.name))return;let n=e.name.includes(`|`)?e.name:Wt[e.name]||e.name;if(n.includes(`|`)){let[e,r]=n.split(`|`).map(e=>e.trim());n=t?r:e}if(n)return{...e,name:n}}function Kt(e,t,n){let r=e>0?n?.meta?.transition:t?.meta?.transition;return r||=O.transition||void 0,Gt(r,e<0)}function qt(e){if(e===!1||e===`false`)return null;if(e==null||e===!0||e===`true`)return`+1`;if(typeof e==`string`&&`+-`.includes(e[0]))return e;let t=+e;return Number.isNaN(t)?(console.error(`Invalid "at" prop value: ${e}`),null):t<=0?(console.warn(`[Slidev] "at" prop value must be greater than 0, but got ${e}, has been set to 1`),1):t}function Jt(e){return Array.isArray(e)?[qt(e[0]),qt(e[1])]:null}function $(e,t=0,i){let a=g(!1),o=new Map,c=new Map,l={get current(){return D(+e.value,t,l.total)},set current(n){e.value=a.value?D(n,t,l.total):n},clicksStart:t,get relativeSizeMap(){return o},get maxMap(){return c},get isMounted(){return a.value},setup(){n(()=>{a.value=!0,c=s(c),_(e)||(l.current=e.value)}),r(()=>{a.value=!1,o=new Map,c=new Map})},calculateSince(e,t=1){let n=qt(e);if(n==null)return null;let r,i,a;if(typeof n==`string`){let e=l.currentOffset,o=+n;r=e+o,i=e+o+t-1,a=o+t-1}else r=n,i=n+t-1,a=0;return{start:r,end:1/0,max:i,delta:a,currentOffset:u(()=>l.current-r),isCurrent:u(()=>l.current===r),isActive:u(()=>l.current>=r)}},calculateRange(e){let t=Jt(e);if(t==null)return null;let[n,r]=t,i,a,o;return typeof n==`string`?(i=l.currentOffset+ +n,o=+n):(i=n,o=0),typeof r==`string`?(a=i+ +r,o+=+r):a=r,{start:i,end:a,max:a,delta:o,currentOffset:u(()=>l.current-i),isCurrent:u(()=>l.current===i),isActive:u(()=>i<=l.current&&l.current<a)}},calculate(e){return Array.isArray(e)?l.calculateRange(e):l.calculateSince(e)},register(e,t){if(!t)return;let{delta:n,max:r}=t;o.set(e,n),c.set(e,r)},unregister(e){o.delete(e),c.delete(e)},get currentOffset(){return de(...o.values())},get total(){return i??(a.value?Math.max(0,...c.values()):0)}};return l}function Yt(e,t=0){let n=e?.meta.slide?.frontmatter.clicksStart??0,r=g(Math.max(p(t),n));return h(()=>p(t),e=>{r.value=Math.max(e,n)}),$(r,n,e?.meta?.clicks)}function Xt(e,t,n=1){let r=t.meta.slide.level??n;r&&r>n&&e.length>0?Xt(e[e.length-1].children,t,n+1):e.push({no:t.no,children:[],level:n,titleLevel:r,path:Q(t.meta.slide?.frontmatter?.routeAlias??t.no,!1),hideInToc:!!t.meta?.slide?.frontmatter?.hideInToc,title:t.meta?.slide?.title})}function Zt(e,t,n=!1,r,i){return e.map(e=>{let a={...e,active:e.no===i?.value,hasActiveParent:n};return a.children.length>0&&(a.children=Zt(a.children,t,a.active||a.hasActiveParent,a,i)),r&&(a.active||a.activeParent)&&(r.activeParent=!0),a})}function Qt(e,t=1){return e.filter(e=>!e.hideInToc).map(e=>({...e,children:Qt(e.children,t+1)}))}function $t(e,t,n){let r=u(()=>e.value.filter(e=>e.meta?.slide?.title).reduce((e,t)=>(Xt(e,t),e),[])),i=u(()=>Zt(r.value,n.value,void 0,void 0,t));return u(()=>Qt(i.value))}function en(e,t,n=g(0),r,i,a){let o=u(()=>X.value.length),s=g(0),c=g(0),l=u(()=>Q(e.value,r.value)),d=u(()=>e.value.no),f=u(()=>e.value.meta?.layout||(d.value===1?`cover`:`default`)),p=u(()=>e.value.meta.slide.frontmatter),m=u(()=>t.value.current),_=u(()=>t.value.clicksStart),v=u(()=>t.value.total),y=u(()=>X.value[Math.min(X.value.length,d.value+1)-1]),b=u(()=>X.value[Math.max(1,d.value-1)-1]),ee=u(()=>d.value<X.value.length||m.value<v.value),te=u(()=>d.value>1||m.value>0),x=u(()=>i.value?void 0:Kt(s.value,e.value,b.value));h(e,(e,t)=>{s.value=e.no-t.no});async function S(e){return!1}let ne=$t(X,d,e);async function re(){c.value=1,v.value<=n.value?await C():n.value+=1}async function ie(){c.value=-1,n.value<=_.value?await ae(!0):--n.value}async function C(e=!1){c.value=1,d.value<X.value.length&&await T(d.value+1,e&&!i.value?E:void 0)}async function ae(e=!1){c.value=-1,d.value>1&&await T(d.value-1,e&&!i.value?E:void 0)}function oe(){return T(1)}function w(){return T(o.value)}async function T(e,t=0,i=!1){A.value=!1;let o=d.value!==e,s=t!==n.value,c=Z(e)?.meta,l=c?.slide?.frontmatter.clicksStart??0;t=D(t,l,c?.__clicksContext?.total??999999),(i||o||s)&&await a?.push({path:Q(e,r.value,a.currentRoute.value.name===`export`),query:{...a.currentRoute.value.query,clicks:t===0?void 0:t.toString(),embedded:location.search.includes(`embedded`)?`true`:void 0}})}function se(){a?.push({path:Q(d.value,!0),query:{...a.currentRoute.value.query}})}function ce(){a?.push({path:Q(d.value,!1),query:{...a.currentRoute.value.query}})}return{slides:X,total:o,currentPath:l,currentSlideNo:d,currentPage:d,currentSlideRoute:e,currentLayout:f,currentFrontmatter:p,currentTransition:x,clicksDirection:c,nextRoute:y,prevRoute:b,clicksContext:t,clicks:m,clicksStart:_,clicksTotal:v,hasNext:ee,hasPrev:te,tocTree:ne,navDirection:s,openInEditor:S,next:re,prev:ie,go:T,goLast:w,goFirst:oe,nextSlide:C,prevSlide:ae,enterPresenter:se,exitPresenter:ce}}function tn(e,t){let n=async()=>{};return{...en(u(()=>e),u(()=>t),g(E),g(!1),g(!1)),next:n,prev:n,nextSlide:n,prevSlide:n,goFirst:n,goLast:n,go:n}}var nn=ne(()=>{let e=S(),t=le(),n=u(()=>(e?.currentRoute?.value?.query,new URLSearchParams(location.search))),r=u(()=>n.value.has(`print`)||t.name===`export`),i=g(n.value.get(`print`)===`clicks`),a=u(()=>n.value.has(`embedded`)),o=u(()=>t.name===`play`),s=u(()=>t.name===`presenter`),c=u(()=>t.name===`notes`),l=u(()=>!s.value&&(!O.remote||n.value.get(`password`)===O.remote)),d=u(()=>!!t.params.no),f=u(()=>d.value?Z(t.params.no)?.no??1:1),p=u(()=>X.value[f.value-1]),m=g(dt(X.value.length,t?.query?.range)),h=Ht(`clicks`,`0`),_=u(()=>y(p.value)),v=u({get(){let e=+(h.value||0);return Number.isNaN(e)&&(e=0),e},set(e){A.value=!1,h.value=e.toString()}});function y(e){if(e?.meta?.__clicksContext)return e.meta.__clicksContext;let t=e.no,n=$(u({get(){return f.value===t?Math.max(+(h.value??0),n.clicksStart):f.value>t?E:n.clicksStart},set(e){f.value===t&&(h.value=e.toString())}}),e?.meta.slide?.frontmatter.clicksStart??0,e?.meta.clicks);return e?.meta&&(e.meta.__clicksContext=n),n}return{router:e,currentRoute:u(()=>t),isPrintMode:r,isPrintWithClicks:i,isEmbedded:a,isPlaying:o,isPresenter:s,isNotesViewer:c,isPresenterAvailable:l,hasPrimarySlide:d,currentSlideNo:f,currentSlideRoute:p,clicksContext:_,queryClicksRaw:h,queryClicks:v,printRange:m,getPrimaryClicks:y}}),rn=ne(()=>{let e=nn(),t=S(),n=en(e.currentSlideRoute,e.clicksContext,e.queryClicks,e.isPresenter,e.isPrintMode,t);return h([n.total,e.currentRoute],async()=>{let t=e.currentRoute.value.params.no;e.hasPrimarySlide.value&&!Z(t)&&(t&&t!==`index.html`?await n.go(n.total.value,0,!0):await n.go(1,0,!0))},{flush:`pre`,immediate:!0}),{...n,...e}});function an(){let e=rn(),n=t()?T(ue,void 0):void 0;if(!n)return e;let r=c(n).nav;return{...e,...r}}export{Se as $,Le as A,Xe as B,We as C,N as D,Be as E,j as F,ze as G,nt as H,Ae as I,we as J,k as K,Ke as L,Me as M,je as N,M as O,Ne as P,Ce as Q,ct as R,Qe as S,Ve as T,P as U,it as V,qe as W,xe as X,ye as Y,be as Z,He as _,Z as a,A as b,ut as c,Re as d,O as et,Ye as f,$e as g,et as h,Yt as i,Ze as j,Fe as k,tt as l,Pe as m,an as n,he as nt,Q as o,ot as p,ve as q,$ as r,X as s,tn as t,D as tt,Ue as u,rt as v,Ge as w,at as x,Je as y,st as z};