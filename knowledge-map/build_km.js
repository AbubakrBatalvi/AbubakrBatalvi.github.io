/* Build the knowledge map data: merge topic files with the hand-written core, validate links,
   compute levels, lay the graph out with a force-directed optimisation, and label field clusters.
   Usage: node build_km.js > km_built.js */
const fs=require('fs'),path=require('path');
const DIR=__dirname;
const core=fs.readFileSync(path.join(DIR,'km_data.js'),'utf8');
const ctx={};new Function('ctx',core.replace(/const (KM_\w+)=/g,'ctx.$1=')+';')(ctx);
const DOMAINS=['Foundations','Analysis','Series & asymptotics','Number theory','Approximation & numerics','Probability & statistics','Geometry, topology & mechanics','Logic & set theory','Algebra & linear algebra','Combinatorics & discrete math'];
/* new links into the original topics, so they rest on the new foundations */
const EXTRA_PRE={functions:'ls-function fd-reals',limits:'fd-limit-seq',polynomials:'fd-algebra-expr',logexp:'fd-real-exponents',trig:'fd-cartesian-plane',
  'complex-numbers':'fd-quadratic fd-cartesian-plane','sequences-series':'fd-sigma fd-limit-seq',factorial:'fd-product-notation',vectors:'fd-cartesian-plane',
  probability:'pr-axioms pr-equally-likely',primes:'nt-divisibility',iteration:'ls-recursion-thm','big-o':'fd-limits-infinity','riemann-sums':'fd-sigma',
  'geometric-series':'fd-sigma','distance-metrics':'fd-distance-formula','continued-fractions':'fd-rationals','finite-differences':'fd-sequences',
  'prime-counting':'fd-floor-ceil',divisors:'nt-divisibility',mobius:'nt-prime-factor',zeta:'an-p-series',pnt:'nt-chebyshev-bounds',holomorphic:'fd-complex-arith',
  'asymptotic-series':'sa-asymp-notation','newton-series':'co-falling-factorial','floater-hormann':'ap-berrut',lagrange:'ap-interp-problem',sampling:'ap-dft',
  'least-squares':'la-least-squares-la',variance:'pr-expectation','diff-geometry':'ge-curvature','manifold-interp':'ge-submanifolds ge-projection-manifold',
  'remote-sensing':'ge-raster-grids','gamma-function':'an-improper-rig','euler-maclaurin':'co-bernoulli-numbers','alternating-series':'an-series-conv',
  'triangular-limits':'sa-diagonal-limits',borel:'sa-gevrey',rh:'nt-critical-strip','zeta-zeros':'nt-critical-strip',kde:'pr-pdf',gaussian:'an-gaussian-int',
  'riemann-r':'nt-gram-series','li-function':'an-improper-rig','incomplete-gamma':'an-improper-rig','alt-gap-sum':'nt-gap-parity','random-primes':'pr-cramer-model',
  'kernel-regression':'pr-kernel-smoothers','gaussian-smoothing':'pr-smoothed-counts','centre-line':'ge-smooth-paths','ik':'ge-kinematic-chains',
  'voronoi':'ge-metrics','catenary':'ge-statics','rolling':'ge-rolling-contact','arc-length':'ge-curves-param','polar':'fd-polar-coords',
  'enclosures':'ap-interval-arith','diagnostics':'ap-high-precision-tests','richardson':'ap-conv-order','runge':'ap-chebyshev-nodes','sinc':'ap-whittaker',
  'cardinal-series':'ap-cardinal-residual','euler-boole':'sa-euler-polys','optimal-truncation':'sa-superasymptotic','lateral-borel':'sa-borel-laplace',
  'summation-methods':'sa-regularity','multiscale':'sa-remainder-sign','double-scaling':'sa-crossover','newton-method':'ap-root-finding','solving-systems':'ap-multivar-newton',
  'residual-fitting':'ap-residual-analysis','rational-approx':'ap-rational-interp','constants':'ap-integer-relation','iterated-log':'sa-log-asymp',
  'stable-recurrences':'ap-recurrence-stability','neg-binomial':'pr-neg-binom-dist','poisson':'pr-poisson-limit','clt':'pr-de-moivre-laplace','likelihood-ratio':'pr-mle',
  'log-scaling':'pr-skewed-data','risk-overlay':'pr-risk-scoring','random-walk':'pr-random-walk-1d','smooth-max':'ge-collision','exp-integral':'an-power-series',
  'cotangent':'an-mittag-leffler','barnes':'an-mellin','laplace-integrals':'an-laplace-transform','infinite-products':'an-absolute-conv','principal-value':'an-real-integrals-res',
  'analytic-continuation':'an-identity-thm','radius-convergence':'an-power-series','fourier-cosine':'an-trig-rigorous','stirling':'sa-sum-integral','digamma':'an-digamma-series',
  'lambert-series':'sa-q-series','even-zeta':'an-basel-fourier','ramanujan-zeta':'nt-eisenstein-series','explicit-formula':'nt-explicit-psi','riemann-von-mangoldt':'an-argument-principle',
  'prime-gaps':'nt-infinitude','exp-sums':'nt-gauss-sums','hardy-littlewood':'nt-singular-series','collatz':'nt-congruences','pi-bounds':'nt-chebyshev-bounds',
  'piecewise-linear':'ap-interp-problem','smoothstep':'ap-hermite-interp','barycentric':'ap-newton-divided','gaussian':'pr-normal'};
/* a few EXTRA_PRE entries above point the other way round to what the new files already say; those are dropped automatically when they would close a cycle */
const nodes=[],byId=new Map();
function add(n){if(byId.has(n.id))throw new Error('duplicate id '+n.id);byId.set(n.id,n);nodes.push(n);}
for(const [id,name,dom,pre,sum,g] of ctx.KM_TOPICS)add({id,name,dom,pre:pre.split(' ').filter(Boolean),sum,g:g||'',core:1});
const files=fs.readdirSync(path.join(DIR,'topics')).filter(f=>f.endsWith('.txt')).sort();
for(const f of files){let dom=null;for(const line of fs.readFileSync(path.join(DIR,'topics',f),'utf8').split('\n')){
  if(!line.trim())continue;if(line.startsWith('D ')){dom=+line.slice(2);continue;}
  const p=line.split('|');if(p.length<4){console.error('bad line in',f,':',line);process.exitCode=1;continue;}
  add({id:p[0].trim(),name:p[1].trim(),dom,pre:p[2].split(' ').filter(Boolean),sum:p.slice(3).join('|').trim(),g:''});}}
const docs=ctx.KM_DOCS.map(([id,name,dom,pre,sum,url,kind])=>({id,name,dom,pre:pre.split(' ').filter(Boolean),sum,url,kind,doc:1}));
for(const d of docs)add(d);
let bad=0;for(const n of nodes){n.pre=n.pre.filter(t=>{if(!byId.has(t)){console.error('unknown prerequisite',t,'of',n.id);bad++;return false;}return true;});}
/* cycle check helper: does b reach a through prerequisites? */
const reaches=(from,target)=>{const seen=new Set(),st=[from];while(st.length){const c=st.pop();if(c===target)return true;if(seen.has(c))continue;seen.add(c);for(const p of byId.get(c).pre)st.push(p);}return false;};
let dropped=[];
for(const [id,extra] of Object.entries(EXTRA_PRE)){const n=byId.get(id);if(!n){console.error('EXTRA_PRE for unknown',id);continue;}
  for(const t of extra.split(' ')){if(!byId.has(t)){console.error('EXTRA_PRE unknown',t);bad++;continue;}if(n.pre.includes(t))continue;
    if(reaches(t,id)){dropped.push(id+'<-'+t);continue;}n.pre.push(t);}}
/* full cycle detection */
const state=new Map();const cyc=[];
function dfs(n,stack){state.set(n.id,1);stack.push(n.id);for(const t of n.pre){const s=state.get(t);if(s===1){cyc.push(stack.slice(stack.indexOf(t)).concat(t).join(' -> '));continue;}if(!s)dfs(byId.get(t),stack);}stack.pop();state.set(n.id,2);}
for(const n of nodes)if(!state.get(n.id))dfs(n,[]);
if(cyc.length){console.error('CYCLES:\n'+cyc.slice(0,20).join('\n'));process.exit(1);}
const lv=n=>n.level!=null?n.level:(n.level=n.pre.length?1+Math.max(...n.pre.map(t=>lv(byId.get(t)))):0);nodes.forEach(lv);
const MAXL=Math.max(...nodes.map(n=>n.level));
for(const n of nodes){n.dep=[];}for(const n of nodes)for(const t of n.pre)byId.get(t).dep.push(n);
const roots=nodes.filter(n=>!n.pre.length).map(n=>n.id);
console.error(`nodes ${nodes.length}  edges ${nodes.reduce((s,n)=>s+n.pre.length,0)}  levels 0..${MAXL}  roots ${roots.length}: ${roots.join(', ')}  unknown links ${bad}  EXTRA_PRE dropped (would cycle) ${dropped.length}`);
const isolated=nodes.filter(n=>!n.pre.length&&!n.dep.length);if(isolated.length)console.error('isolated:',isolated.map(n=>n.id).join(' '));
const perDom=DOMAINS.map((d,i)=>nodes.filter(n=>n.dom===i).length);console.error('per field:',DOMAINS.map((d,i)=>d+' '+perDom[i]).join(', '));

/* ---------- layout: force-directed with height tied to level ----------
   forces: springs along prerequisite links, cohesion toward the node's field centroid, short-range repulsion
   (stronger between different fields, so fields separate into groups and weakly linked ones drift into islands),
   and a spring holding each node near its level's height. Fixed seed, so the layout is the same on every build. */
let seed=20261109;const rnd=()=>(seed=(seed*48271)%2147483647)/2147483647;
const RH=38,RMIN=44,N=nodes.length,D=DOMAINS.length;
const ord=[7,0,8,9,1,2,3,4,5,6];const anchor={};ord.forEach((d,i)=>anchor[d]=(i-(D-1)/2)*420);
for(const n of nodes){n.x=anchor[n.dom]+(rnd()-.5)*300;n.y=-n.level*RH+(rnd()-.5)*RH*.5;n.vx=0;n.vy=0;}
const edges=[];for(const n of nodes)for(const t of n.pre)edges.push([byId.get(t),n]);
const ITER=900,CELL=RMIN*3.4,COH=+(process.env.COH||.028),XLINK=+(process.env.XLINK||.0025),XREP=+(process.env.XREP||3.2);
for(let it=0;it<ITER;it++){const T=1-it/ITER,step=.6*T+.05;
  for(const n of nodes){n.fx=0;n.fy=0;}
  /* field centroids */
  const cx=new Float64Array(D),cy=new Float64Array(D),cn=new Float64Array(D);for(const n of nodes){cx[n.dom]+=n.x;cy[n.dom]+=n.y;cn[n.dom]++;}
  for(let d=0;d<D;d++){cx[d]/=cn[d]||1;cy[d]/=cn[d]||1;}
  for(const n of nodes){n.fx+=(cx[n.dom]-n.x)*COH;n.fy+=(cy[n.dom]-n.y)*COH*.15;}
  /* links: horizontal pull is strong (keeps related topics near), vertical is left to the level spring */
  for(const [a,b] of edges){const dx=b.x-a.x,w=a.dom===b.dom?.02:XLINK;a.fx+=dx*w;b.fx-=dx*w;const dy=(b.y-a.y)+RH;a.fy+=dy*.002;b.fy-=dy*.002;}
  /* repulsion within a grid */
  const grid=new Map();for(const n of nodes){const k=Math.floor(n.x/CELL)+','+Math.floor(n.y/CELL);let c=grid.get(k);if(!c)grid.set(k,c=[]);c.push(n);}
  for(const n of nodes){const gx=Math.floor(n.x/CELL),gy=Math.floor(n.y/CELL);
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const c=grid.get((gx+i)+','+(gy+j));if(!c)continue;
      for(const m of c){if(m===n)continue;let dx=n.x-m.x,dy=n.y-m.y,d2=dx*dx+dy*dy;if(d2>CELL*CELL)continue;if(d2<1e-3){dx=rnd()-.5;dy=rnd()-.5;d2=.5;}
        const d=Math.sqrt(d2),s=(n.dom===m.dom?1:XREP)*(CELL-d)/CELL*(d<RMIN?3:1)*2.2;n.fx+=dx/d*s;n.fy+=dy/d*s*.35;}}}
  /* level spring with a dead band */
  for(const n of nodes){const ty=-n.level*RH,dy=ty-n.y,band=RH*.32;if(Math.abs(dy)>band)n.fy+=(dy-Math.sign(dy)*band)*.08;}
  for(const n of nodes){n.vx=(n.vx+n.fx)*.6;n.vy=(n.vy+n.fy)*.6;const v=Math.hypot(n.vx,n.vy),cap=40*T+4;if(v>cap){n.vx*=cap/v;n.vy*=cap/v;}n.x+=n.vx*step;n.y+=n.vy*step;}}
/* final pass: enforce the minimum spacing (blue-noise spacing like a Poisson-disk sample) */
for(let pass=0;pass<40;pass++){const grid=new Map();for(const n of nodes){const k=Math.floor(n.x/RMIN)+','+Math.floor(n.y/RMIN);let c=grid.get(k);if(!c)grid.set(k,c=[]);c.push(n);}
  let moved=0;for(const n of nodes){const gx=Math.floor(n.x/RMIN),gy=Math.floor(n.y/RMIN);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const c=grid.get((gx+i)+','+(gy+j));if(!c)continue;
    for(const m of c){if(m===n)continue;const dx=n.x-m.x,dy=n.y-m.y,d=Math.hypot(dx,dy)||.01;if(d<RMIN*.92){const p=(RMIN*.92-d)/2;n.x+=dx/d*p;m.x-=dx/d*p;n.y+=dy/d*p*.5;m.y-=dy/d*p*.5;moved++;}}}}
  if(!moved)break;}
/* field labels: connected groups of same-field nodes (within 2.4·RMIN); each sizeable group gets its field name */
const labels=[];
for(let d=0;d<D;d++){const ns=nodes.filter(n=>n.dom===d),seen=new Set();
  for(const s of ns){if(seen.has(s))continue;const comp=[],st=[s];seen.add(s);
    while(st.length){const c=st.pop();comp.push(c);for(const m of ns)if(!seen.has(m)&&Math.hypot(m.x-c.x,m.y-c.y)<RMIN*2.4){seen.add(m);st.push(m);}}
    if(comp.length>=Math.max(14,ns.length*.12)){const mx=comp.reduce((a,c)=>a+c.x,0)/comp.length,my=comp.reduce((a,c)=>a+c.y,0)/comp.length;labels.push([d,Math.round(mx),Math.round(my),comp.length]);}}}
/* ---------- output ---------- */
const esc=s=>JSON.stringify(s);
const topics=nodes.filter(n=>!n.doc),dd=nodes.filter(n=>n.doc),order=topics.concat(dd);
let out='/* knowledge map data: generated by build_km.js from the topic files; do not edit by hand */\n';
out+='const KM_DOMAINS='+esc(DOMAINS)+';\n';
out+='const KM_TOPICS=['+topics.map(n=>'['+[esc(n.id),esc(n.name),n.dom,esc(n.pre.join(' ')),esc(n.sum),esc(n.g)].join(',')+']').join(',\n')+'];\n';
out+='const KM_DOCS=['+dd.map(n=>'['+[esc(n.id),esc(n.name),n.dom,esc(n.pre.join(' ')),esc(n.sum),esc(n.url),esc(n.kind)].join(',')+']').join(',\n')+'];\n';
out+='const KM_POS=['+order.map(n=>Math.round(n.x)+','+Math.round(n.y)).join(',')+'];\n';
out+='const KM_LABELS='+esc(labels.map(l=>l.slice(0,3)))+';\n';
out+='const KM_RH='+RH+';\n';
process.stdout.write(out);
console.error('labels',labels.length,'bounds x',Math.round(Math.min(...nodes.map(n=>n.x))),Math.round(Math.max(...nodes.map(n=>n.x))),'y',Math.round(Math.min(...nodes.map(n=>n.y))),Math.round(Math.max(...nodes.map(n=>n.y))));
