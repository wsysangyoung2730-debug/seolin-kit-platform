function slgScore(){
  if(document.getElementById('slg-score')) return;
  const S={get(k,d){try{const v=localStorage.getItem('slg-'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
           set(k,v){try{localStorage.setItem('slg-'+k,JSON.stringify(v));}catch(e){}}};
  const COLORS=['#ff5d6c','#4d94ff','#ffd43b','#3ddc97','#c084fc','#ff9f43','#22d3ee','#f472b6'];
  const st=document.createElement('style');
  // 게임마다 button·input 기본 스타일이 달라서 #아이디로 전부 덮어씀
  st.textContent=`
#slg-score{position:fixed;left:16px;bottom:16px;z-index:2147483000;width:244px;background:rgba(7,20,44,.9);color:#fff;border:1px solid rgba(255,255,255,.22);border-radius:18px;padding:10px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 14px 36px rgba(0,0,0,.42);font:14px/1.3 "Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;user-select:none;touch-action:none;box-sizing:border-box;text-align:left}
#slg-score *{box-sizing:border-box;font-family:inherit;letter-spacing:0}
#slg-score[hidden]{display:none}
#slg-score button{margin:0;box-shadow:none;transform:none;width:auto;font-family:"Apple SD Gothic Neo","Malgun Gothic",sans-serif;cursor:pointer;border:0}
#slg-score .slg-head{display:flex;gap:6px;align-items:center}
#slg-score .slg-drag{flex:1;padding:7px 8px;border-radius:10px;background:linear-gradient(135deg,#ffd43b,#ff9f43);color:#0c2a55;font-weight:900;font-size:13px;cursor:grab;text-align:center}
#slg-score .slg-head button{width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.15);color:#fff;font-weight:900;font-size:14px;padding:0}
#slg-score .slg-tools{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 4px}
#slg-score label{display:flex;flex-direction:column;justify-content:flex-start;gap:3px;margin:0;font-size:11px;color:#afc7e9;font-weight:800}
#slg-score input,#slg-score select{width:100%;min-width:0;height:auto;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:calc(5px*var(--s,1)) 7px;font-weight:800;font-size:calc(13px*var(--s,1));margin:0;text-align:left}
#slg-score select option{color:#0c2a55}
#slg-score{display:flex;flex-direction:column;min-width:170px;min-height:0}
#slg-score .slg-body{flex:1;min-height:0;display:flex;flex-direction:column}
#slg-score .slg-rows{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(var(--cols,1),minmax(0,1fr));column-gap:12px;align-content:space-evenly}
#slg-score.slg-compact .slg-tools,#slg-score.slg-compact .slg-reset{display:none}
#slg-score .slg-row{display:grid;grid-template-columns:calc(6px*var(--s,1)) minmax(0,1fr) auto;gap:calc(6px*var(--s,1)) 8px;align-items:center;padding:calc(7px*var(--s,1)) 0;border-top:1px solid rgba(255,255,255,.12)}
#slg-score .slg-row i{grid-row:span 2;align-self:stretch;border-radius:4px}
#slg-score .slg-row b{font-size:calc(25px*var(--s,1));font-weight:900;color:#ffd43b;min-width:54px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
#slg-score .slg-row b::after{content:"점";font-size:12px;margin-left:2px;color:#cfe0f7}
#slg-score .slg-row.top b::before{content:"👑";font-size:15px;margin-right:2px}
#slg-score .slg-btns{grid-column:2/-1;display:grid;grid-template-columns:1fr 1fr;gap:5px}
#slg-score .slg-btns button,#slg-score .slg-reset{border-radius:8px;padding:calc(6px*var(--s,1)) 0;background:rgba(255,255,255,.13);color:#fff;font-weight:900;font-size:calc(13px*var(--s,1))}
#slg-score .slg-btns button:last-child{background:rgba(61,220,151,.3)}
#slg-score .slg-reset{width:100%;margin-top:6px}
#slg-score.slg-min .slg-body{display:none}
#slg-score .slg-rz{position:absolute;z-index:2;touch-action:none}
#slg-score .slg-rz.n,#slg-score .slg-rz.s{left:18px;right:18px;height:10px;cursor:ns-resize}
#slg-score .slg-rz.e,#slg-score .slg-rz.w{top:18px;bottom:18px;width:10px;cursor:ew-resize}
#slg-score .slg-rz.n{top:-5px}#slg-score .slg-rz.s{bottom:-5px}#slg-score .slg-rz.e{right:-5px}#slg-score .slg-rz.w{left:-5px}
#slg-score .slg-rz.nw,#slg-score .slg-rz.ne,#slg-score .slg-rz.sw,#slg-score .slg-rz.se{width:22px;height:22px}
#slg-score .slg-rz.nw{left:-6px;top:-6px;cursor:nwse-resize}#slg-score .slg-rz.se{right:-6px;bottom:-6px;cursor:nwse-resize}
#slg-score .slg-rz.ne{right:-6px;top:-6px;cursor:nesw-resize}#slg-score .slg-rz.sw{left:-6px;bottom:-6px;cursor:nesw-resize}
#slg-score .slg-rz::after{content:"";position:absolute;opacity:.3;transition:opacity .15s;background:#ffd43b;border-radius:3px}
#slg-score .slg-rz.n::after,#slg-score .slg-rz.s::after{left:50%;top:3px;width:34px;height:4px;transform:translateX(-50%)}
#slg-score .slg-rz.e::after,#slg-score .slg-rz.w::after{top:50%;left:3px;width:4px;height:34px;transform:translateY(-50%)}
#slg-score .slg-rz.nw::after,#slg-score .slg-rz.ne::after,#slg-score .slg-rz.sw::after,#slg-score .slg-rz.se::after{inset:5px;background:none;border:3px solid #ffd43b}
#slg-score .slg-rz.nw::after{border-right:0;border-bottom:0;border-radius:6px 0 0 0}#slg-score .slg-rz.ne::after{border-left:0;border-bottom:0;border-radius:0 6px 0 0}
#slg-score .slg-rz.sw::after{border-right:0;border-top:0;border-radius:0 0 0 6px}#slg-score .slg-rz.se::after{border-left:0;border-top:0;border-radius:0 0 6px 0}
#slg-score:hover .slg-rz::after,#slg-score .slg-rz:active::after{opacity:1}
#slg-score.slg-min .slg-rz.n,#slg-score.slg-min .slg-rz.s{display:none}
#slg-board{position:fixed;inset:0;z-index:2147483002;display:grid;place-items:center;padding:24px;background:rgba(3,10,28,.86);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fff;font-family:"Apple SD Gothic Neo","Malgun Gothic",sans-serif;text-align:left}
#slg-board[hidden]{display:none}
#slg-board *{box-sizing:border-box}
#slg-board .slg-card{position:relative;width:min(920px,100%);max-height:100%;overflow:auto;background:linear-gradient(160deg,#0f3278,#071530);border:1px solid rgba(255,255,255,.22);border-radius:28px;padding:clamp(20px,3.5vw,44px);box-shadow:0 30px 80px rgba(0,0,0,.55)}
#slg-board h2{margin:0 0 clamp(14px,2.5vh,26px);font-family:"Black Han Sans","Malgun Gothic",sans-serif;font-weight:400;font-size:clamp(30px,4.4vw,58px);line-height:1.1}
#slg-board .slg-close{position:absolute;top:16px;right:16px;width:46px;height:46px;margin:0;padding:0;border:0;border-radius:14px;background:rgba(255,255,255,.15);color:#fff;font-size:22px;font-weight:900;cursor:pointer;box-shadow:none}
#slg-board .slg-rk{display:grid;grid-template-columns:clamp(46px,6vw,74px) minmax(0,1fr) auto;gap:6px 16px;align-items:center;padding:clamp(8px,1.4vh,14px) 0;border-top:1px solid rgba(255,255,255,.12)}
#slg-board .slg-no{grid-row:span 2;font-size:clamp(30px,4vw,52px);font-weight:900;text-align:center;line-height:1}
#slg-board .slg-nm{font-size:clamp(20px,2.6vw,32px);font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#slg-board .slg-pt{grid-row:span 2;font-size:clamp(38px,5.4vw,72px);font-weight:900;color:#ffd43b;font-variant-numeric:tabular-nums;line-height:1}
#slg-board .slg-pt small{font-size:.35em;color:#cfe0f7;margin-left:4px}
#slg-board .slg-bar{height:clamp(10px,1.4vh,16px);border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
#slg-board .slg-bar span{display:block;height:100%;border-radius:99px;transition:width .5s}
#slg-board .slg-rk.first .slg-nm{color:#ffd43b}
#slg-score.slg-dock{position:relative;left:auto;bottom:auto;width:auto;z-index:1;flex:none;font-size:15px}
#slg-score.slg-dock .slg-rz,#slg-score.slg-dock .slg-x{display:none}
#slg-score.slg-dock .slg-drag{cursor:default;flex:none;padding:9px 16px}
#slg-score.slg-dock{flex-direction:row;align-items:center;gap:10px 14px;flex-wrap:wrap;padding:10px 12px}
#slg-score.slg-dock .slg-body{flex:1 1 480px;flex-direction:row;flex-wrap:wrap;align-items:center;gap:8px 14px;min-width:0}
#slg-score.slg-dock .slg-rows{order:-1;flex:1 1 300px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));overflow:visible}
#slg-score.slg-dock .slg-row{border-top:0;padding:2px 0}
#slg-score.slg-dock .slg-tools{flex:0 1 210px;margin:0}
#slg-score.slg-dock .slg-reset{width:auto;margin:0;padding:8px 14px;flex:none}
:root{--tvz:1}
@media (min-width:1700px) and (min-height:900px){:root{--tvz:1.3}}
@media (min-width:2400px) and (min-height:1300px){:root{--tvz:1.8}}
@media (min-width:3200px) and (min-height:1700px){:root{--tvz:2.4}}
#slg-nav,#slg-back,#slg-board .slg-card{zoom:var(--tvz)}
#slg-nav{position:fixed;left:14px;bottom:14px;z-index:2147483001;display:flex;gap:8px}
#slg-back{position:fixed;left:14px;top:14px;z-index:2147483001;margin:0;border:2px solid rgba(255,255,255,.7);border-radius:14px;padding:10px 16px;background:rgba(7,17,31,.78);color:#fff;font:900 18px "Malgun Gothic",sans-serif;cursor:pointer}
#slg-back[hidden]{display:none}
#slg-nav button{width:auto;margin:0;border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:9px 15px;background:rgba(5,15,38,.8);color:#fff;font:700 14px "Malgun Gothic",sans-serif;cursor:pointer;box-shadow:none}`;
  document.head.appendChild(st);
  const pop=document.createElement('div'); pop.id='slg-score';
  pop.innerHTML=`<div class="slg-head"><div class="slg-drag" title="끌어서 이동">🏆 팀 점수판</div><button class="slg-fold" title="접기/펴기">－</button><button class="slg-x" title="점수판 숨기기">✕</button></div>
<div class="slg-body"><div class="slg-tools"><label>팀 수<select class="slg-n"></select></label><label>± 점수<input class="slg-step" type="number" min="1" max="99"></label></div><div class="slg-rows"></div><button class="slg-reset">점수 초기화</button></div>`;
  // 팀 점수 현황: 크게 보여주는 순위판
  const board=document.createElement('div'); board.id='slg-board'; board.hidden=true;
  board.innerHTML='<div class="slg-card" role="dialog" aria-label="팀 점수 현황"><button class="slg-close" title="닫기 (Esc)">✕</button><h2>🏆 팀 점수 현황</h2><div class="slg-list"></div></div>';
  document.body.append(pop,board);
  // 홈: 떠 있지 않고 제목 아래 자리에 붙어서 다른 화면을 가리지 않음 (게임 안에서는 떠 있는 판을 끌어서 옮김)
  const dock=window.parent===window&&document.querySelector('.hero'); if(dock){ (document.getElementById('ask')||dock).after(pop); pop.classList.add('slg-dock'); }
  const toggles=[]; // [점수판] 버튼들: 켜짐 표시용
  function drawBoard(){
    const max=Math.max(1,...teams.map(t=>t.score)), MEDAL=['🥇','🥈','🥉'];
    board.querySelector('.slg-list').innerHTML='';
    teams.map((t,i)=>({...t,c:COLORS[i]})).sort((a,b)=>b.score-a.score).forEach(t=>{
      const rank=1+teams.filter(x=>x.score>t.score).length; // 동점은 같은 등수
      const r=document.createElement('div'); r.className='slg-rk'+(rank===1&&t.score>0?' first':'');
      r.innerHTML=`<div class="slg-no">${t.score>0&&rank<=3?MEDAL[rank-1]:rank}</div><div class="slg-nm"></div><div class="slg-pt">${t.score}<small>점</small></div><div class="slg-bar"><span style="width:${t.score/max*100}%;background:${t.c}"></span></div>`;
      r.querySelector('.slg-nm').textContent=t.name;
      board.querySelector('.slg-list').append(r);
    });
  }
  const openBoard=()=>{drawBoard(); board.hidden=false; board.querySelector('.slg-close').focus();};
  const closeBoard=()=>{board.hidden=true; document.activeElement&&document.activeElement.blur();};
  window.slgBoard=openBoard;
  board.onclick=e=>{if(e.target===board) closeBoard();};
  board.querySelector('.slg-close').onclick=closeBoard;
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!board.hidden){e.preventDefault(); closeBoard();}},true);
  // 게임 안이면: 전체화면 버튼 옆에 [홈] [점수판] [점수 현황] 버튼 (없으면 왼쪽 아래에 띄움)
  if(window.parent!==window){
    const fs=document.getElementById('fsBtn')||document.getElementById('fullBtn');
    const mk=(t,f)=>{const b=document.createElement('button'); b.type='button'; b.textContent=t; b.onclick=()=>{b.blur(); f();}; if(fs) b.className=fs.className.replace('primary','').trim(); return b;};
    const home=mk('🏠 홈',()=>{parent.location.hash='';}), score=mk('📋 점수판',()=>toggleScore()), stat=mk('🏆 점수 현황',openBoard);
    toggles.push(score);
    if(fs) fs.after(home,score,stat);
    else{const nav=document.createElement('div'); nav.id='slg-nav'; nav.append(home,score,stat); document.body.append(nav);}
    // 전체화면일 때만 보이는 [← 뒤로]: 누르면 전체화면에서 빠져나옴 (OX는 자체 버튼이 있어서 뺌)
    if(!document.getElementById('backBtn')){
      const bk=document.createElement('button'); bk.id='slg-back'; bk.type='button'; bk.textContent='← 뒤로';
      const fsOf=d=>{ try{ return d.fullscreenElement||d.webkitFullscreenElement; }catch(e){ return null; } }; // 메뉴에서 켠 전체화면(parent)도 같이 봄
      const sync=()=>{ const f=fsOf(document); bk.hidden=!(f||fsOf(parent.document)); (f&&f!==document.documentElement?f:document.body).append(bk); };
      bk.onclick=()=>{ const d=fsOf(document)?document:parent.document; try{ const p=(d.exitFullscreen||d.webkitExitFullscreen).call(d); p&&p.catch&&p.catch(()=>{}); }catch(e){} bk.blur(); };
      ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>{ document.addEventListener(ev,sync); try{ parent.document.addEventListener(ev,()=>{ if(bk.isConnected) sync(); }); }catch(e){} });
      sync();
    }
    // 격파·무궁화 첫 화면: [카메라 켜기] 옆에도 [홈]
    const cam=document.getElementById('camBtn');
    if(cam){const h2=mk('🏠 홈',()=>{parent.location.hash='';}); h2.className='ghost'; h2.style.marginLeft='10px'; cam.after(h2);}
    // 게임이 끝났을 때: [다시 하기] 옆에 [홈] (격파·초성·메모리·OX·끝말잇기)
    const again=document.querySelector('#againBtn, #final #again, #finish #again, #oxAgain, #wcAgain');
    if(again){const h4=mk('🏠 홈',()=>{parent.location.hash='';}); h4.className=again.className.replace('primary','').trim();
      h4.style.cssText='background:rgba(255,255,255,.16);color:#fff;box-shadow:none;border:1px solid rgba(255,255,255,.4);margin-left:'+(again.id==='again'&&!again.closest('#finish')?'0':'8px'); again.after(h4);}
    // 초성·메모리 첫 화면: [시작] 아래에 [홈]
    const st=document.querySelector('#setup #start, #setup .start');
    if(st){const h3=mk('🏠 홈으로',()=>{parent.location.hash='';}); h3.className='btn'; h3.style.cssText='width:100%;margin-top:10px;padding:12px;background:rgba(255,255,255,.14);color:#fff;box-shadow:none;border:1px solid rgba(255,255,255,.3)'; st.after(h3);}
  }
  const q=s=>pop.querySelector(s), nSel=q('.slg-n'), stepIn=q('.slg-step'), rows=q('.slg-rows');
  for(let n=1;n<=8;n++) nSel.add(new Option(n+'팀',n));
  let teams=[], step=1;
  const save=()=>S.set('teams',teams);
  function render(){
    teams=S.get('teams',[{name:'1팀',score:0},{name:'2팀',score:0}]); step=S.get('step',1);
    nSel.value=teams.length; stepIn.value=step;
    const max=Math.max(...teams.map(t=>t.score));
    rows.innerHTML='';
    teams.forEach((t,i)=>{
      const r=document.createElement('div'); r.className='slg-row'+(max>0&&t.score===max?' top':'');
      const c=document.createElement('i'); c.style.background=COLORS[i];
      const name=document.createElement('input'); name.type='text'; name.value=t.name; name.setAttribute('aria-label',(i+1)+'팀 이름');
      name.oninput=()=>{t.name=name.value.trim()||`${i+1}팀`; save();};
      const sc=document.createElement('b'); sc.textContent=t.score;
      const btns=document.createElement('div'); btns.className='slg-btns';
      [-1,1].forEach(s=>{const b=document.createElement('button'); b.textContent=(s<0?'− ':'+ ')+step;
        b.onclick=()=>{t.score=Math.max(0,t.score+s*step); save(); render();}; btns.append(b);}); // 다시 그리면서 포커스가 빠지므로 Space가 게임으로 감
      r.append(c,name,sc,btns); rows.append(r);
    });
    const on=S.get('on',true), min=S.get('min',innerWidth<600); // 휴대폰은 처음엔 접어 둠
    pop.hidden=!on; toggles.forEach(b=>{b.setAttribute('aria-pressed',on); b.style.outline=on?'2px solid #ffd43b':'';}); pop.classList.toggle('slg-min',min); q('.slg-fold').textContent=min?'＋':'－';
    if(!board.hidden) drawBoard();
    layout();
  }
  nSel.onchange=()=>{const n=+nSel.value; while(teams.length<n) teams.push({name:`${teams.length+1}팀`,score:0}); teams=teams.slice(0,n); save(); render();};
  stepIn.onchange=()=>{S.set('step',Math.max(1,Math.min(99,Math.round(+stepIn.value)||1))); render();};
  q('.slg-reset').onclick=e=>{teams.forEach(t=>t.score=0); save(); render(); e.currentTarget.blur();};
  q('.slg-x').onclick=()=>{S.set('on',false); render();};
  const toggleScore=()=>{S.set('on',!S.get('on',true)); render();};
  window.slgToggle=toggleScore;
  window.slgAdd=i=>{ render(); if(!teams[i]) return ''; teams[i].score+=step; save(); render(); return teams[i].name+' +'+step+'점'; };
  q('.slg-fold').onclick=e=>{S.set('min',!S.get('min',innerWidth<600)); render(); e.currentTarget.blur();};
  // 끌어서 이동 (위치는 모든 게임 공통으로 기억)
  const h=q('.slg-drag'); let ox=0,oy=0,drag=false;
  const place=(x,y)=>{x=Math.max(0,Math.min(innerWidth-80,x)); y=Math.max(0,Math.min(innerHeight-50,y)); pop.style.left=x+'px'; pop.style.top=y+'px'; pop.style.bottom='auto'; return {x,y};};
  const restore=()=>{const p=!dock&&S.get('pos2',null); if(p) place(p.x,p.y);}; // 처음 위치: 왼쪽 아래 (위쪽 메뉴·뒤로 버튼을 가리지 않게)
  h.onpointerdown=e=>{if(dock) return; drag=true; const r=pop.getBoundingClientRect(); ox=e.clientX-r.left; oy=e.clientY-r.top; h.setPointerCapture(e.pointerId); e.preventDefault();};
  h.onpointermove=e=>{if(drag) place(e.clientX-ox,e.clientY-oy);};
  h.onpointerup=h.onpointercancel=()=>{if(!drag) return; drag=false; const r=pop.getBoundingClientRect(); S.set('pos2',place(r.left,r.top));};
  addEventListener('resize',restore);
  // 크기 맞춰 배치: 넓으면 여러 칸, 낮으면 설정 줄 숨김, 글씨·버튼은 칸 크기에 맞춰 자동
  function layout(){
    const sz=dock?null:S.get('size',null), min=pop.classList.contains('slg-min'); // 홈에 붙은 판은 크기 조절 없음
    pop.style.width=sz?sz.w+'px':''; pop.style.height=sz&&!min?sz.h+'px':'';
    pop.classList.toggle('slg-compact',!!sz&&(sz.h<250||sz.w<200));
    const n=Math.max(1,teams.length), w=pop.clientWidth-20;
    let cols=Math.max(1,Math.min(n,Math.floor(w/(dock?260:190)))), s;
    pop.style.setProperty('--cols',cols); pop.style.setProperty('--s',1);
    if(sz&&!min){ // 크기를 정했으면: 글씨가 가장 크게 나오는 칸 수를 고름
      const H=rows.clientHeight, rowH=(rows.firstElementChild?rows.firstElementChild.offsetHeight:78)+1; let best=0; // 실제 한 줄 높이를 재서 계산
      for(let c=1;c<=n;c++){ const v=Math.min(w/c/224,H/Math.ceil(n/c)/rowH)*.95; if(v>best){best=v; cols=c;} }
      s=best; pop.style.setProperty('--cols',cols);
    } else s=dock?1:w/cols/224;
    pop.style.setProperty('--s',Math.max(.7,Math.min(2.6,s)).toFixed(3));
  }
  // 가장자리·모서리 8곳을 끌어서 크기 조절 (반대쪽은 고정, 크기 기억)
  ['n','s','e','w','nw','ne','sw','se'].forEach(k=>{
    const g=document.createElement('i'); g.className='slg-rz '+k; g.title='끌어서 크기 조절'; pop.append(g);
    g.onpointerdown=e=>{
      e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId);
      const r=pop.getBoundingClientRect(), sx=e.clientX, sy=e.clientY;
      g.onpointermove=ev=>{
        const dx=ev.clientX-sx, dy=ev.clientY-sy;
        let L=r.left, T=r.top, W=r.width, H=r.height;
        if(k.includes('e')) W=r.width+dx;
        if(k.includes('w')) W=r.width-dx;
        if(k.includes('s')) H=r.height+dy;
        if(k.includes('n')) H=r.height-dy;
        W=Math.max(170,Math.min(innerWidth-8,W)); H=Math.max(120,Math.min(innerHeight-8,H));
        if(k.includes('w')) L=r.right-W;
        if(k.includes('n')) T=r.bottom-H;
        S.set('size',{w:Math.round(W),h:Math.round(H)}); layout(); place(L,T);
      };
      g.onpointerup=g.onpointercancel=()=>{ g.onpointermove=null; const rr=pop.getBoundingClientRect(); S.set('pos2',place(rr.left,rr.top)); };
    };
  });
  addEventListener('resize',layout);
  // 게임이 일부만 전체화면으로 띄워도 점수판이 보이도록 그 안으로 옮김
  document.addEventListener('fullscreenchange',()=>{const f=document.fullscreenElement; const to=!f||f===document.documentElement?document.body:f; if(!dock) to.append(pop); to.append(board); layout();});
  // 다른 화면(메뉴 ↔ 게임)에서 바꾼 점수 바로 반영
  addEventListener('storage',e=>{if(!e.key||e.key.startsWith('slg-')){render(); restore();}});
  render(); restore();
}
slgScore();
