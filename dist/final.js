'use strict';
// Final experience: discovery -> shared disguise -> cloth descent -> different viewpoints -> reality.
let localExplained=false,holdingPiece=false,joinTime=0,puzzleComplete=false,puzzleZ=6.8,puzzleSpread=1.8;
let attentionClock=0,humanAttention=0,humanAlarm=0,demoClock=0,descent=0,linkedHands=false,windClock=0,clothDemo=0,windWarning=0,windLost=false;
let shrinkClock=0,returnClock=0,returnStart=null,lastSafeCloth=0;
const cityUpdate=updateCity;
function forwardInput(){return (keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0)}
function moveInput(dt,speed){let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),z=forwardInput(),n=Math.hypot(x,z)||1;return [cam.x+(x*Math.cos(cam.yaw)+z*Math.sin(cam.yaw))*dt*speed/n,cam.z+(z*Math.cos(cam.yaw)-x*Math.sin(cam.yaw))*dt*speed/n]}
function interaction(text){$('#action').hidden=false;$('#action').textContent=text+' · E'}
function hint(text){$('#hint').hidden=false;$('#hint').textContent=text}
function cue(kind){if(muted)return;try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();let o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;o.type=kind==='wind'?'sawtooth':'sine';o.frequency.setValueAtTime(kind==='step'?60:kind==='wind'?100:480,now);o.frequency.exponentialRampToValueAtTime(kind==='step'?24:kind==='wind'?45:240,now+.65);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(kind==='step'?.2:.055,now+.06);g.gain.exponentialRampToValueAtTime(.0001,now+.8);o.connect(g);g.connect(audio.destination);o.start();o.stop(now+.85)}catch{}}
function start(){if(stage!==0||(phase!=='intro'&&phase!=='discover'))return;$('#intro').hidden=true;$('#chapter').hidden=false;$('#reticle').hidden=true;stage=0;phase='shrinking';shrinkClock=0;returnStart={...cam};keys={};drag=null;muted=false;$('#sound').textContent='声音 开';cue('soft');ui();$('#chapterNo').textContent='现实 · 桌前';goal('缝隙里，另一种生活','桌上的物件逐渐变大，微小的脚步声来到身边。');say('');}
function transitionTo(s){keys={};if(s===1){stage=1;phase='solo';cam={x:0,y:1.65,z:0,yaw:0,pitch:.15};transition=false;ui();goal('借来的遮蔽，共同的通路','在微民的尺度里，物体的阴影是街巷，人类的注视会让街巷静下来。');talk([['阿苇','我们要把借来的纽扣送到第三座城。先穿过这里，到对面书本的阴影下集合。']]);return}stage=3;phase='first';transition=false;cam={x:0,y:3.65,z:3,yaw:0,pitch:.1};ui();$('#chapterNo').textContent='歧路之城';goal('熟悉的办法，还成立吗？','刚才共同举起的遮蔽、相互牵住的手，带你们来到另一种空间里。');talk([['阿苇','送货要从那扇门过去。我们还像刚才那样，一起走。']]);}
function act(){if($('#guide').open||transition||end)return;if(dialogue){next();return}if(phase==='intro'){start();return}
if(stage===1&&phase==='assemble'&&Math.hypot(cam.x+2,cam.z-3)<3){holdingPiece=true;phase='join';keys={};say('阿苇：举着它过来，把边缘接到我们这块旁边。');cue('soft');return}
if(stage===2&&phase==='cloth'&&clothDemo>3&&cam.z>29){linkedHands=!linkedHands;if(linkedHands)windLost=false;keys={};say(linkedHands?'阿苇握住你的手。':'你松开了手。桌布另一侧，风扇仍在转动。');cue('soft')}
}
function pointTarget(){if(stage===0)return phase==='discover'?[2,0,5]:null;if(stage===1)return phase==='assemble'?[-2,0,3]:[0,0,25];if(stage===2)return [0,-descent,32];if(stage===3)return phase==='first'?observations[0]:phase==='final'?observations[2]:[9,3.65,12];if(stage===4)return [3,8,65];return null}
function update(dt){if($('#guide').open||end)return;if(stage>=3){cityUpdate(dt);return}if(dialogue)return;shake=Math.max(0,shake-dt*1.3);humanAlarm=Math.max(0,humanAlarm-dt);$('#action').hidden=true;$('#hint').hidden=true;compass();
if(stage===0){updateReality(dt);return}if(stage===2){updateCloth(dt);return}
attentionClock+=dt;let watching=phase==='carry'&&(attentionClock%11>6.5);humanAttention=lerp(humanAttention,watching||humanAlarm>0?1:0,Math.min(1,dt*3));
let [nx,nz]=moveInput(dt,phase==='carry'?1.7:3);nx=clamp(nx,-4,4);nz=clamp(nz,-2,26);
if(phase==='solo'&&nz>4.2){shake=1;humanAlarm=3;nz=2.8;keys={};phase='demo';demoClock=0;cue('step');say('阿苇：退回来！有人往桌上看了。')}
if(phase==='demo'){demoClock+=dt;puzzleSpread=lerp(1.8,0,clamp((demoClock-5)/8,0,1));nz=Math.min(nz,4);if(demoClock>14){phase='assemble';goal('借来的东西，新的用途','他们照着盒盖拼起图案，把自己藏在图案下面。');say('阿苇：上面看着只是一幅拼图。这儿还缺一块，你来接上。')}}
if(phase==='assemble'){nz=Math.min(nz,4);if(Math.hypot(nx+2,nz-3)<3)interaction('拿起盒旁的一块拼图')}
if(phase==='join'){hint('举着拼图，走到同伴旁边空出的这一角。');joinTime=Math.hypot(nx-1,nz-(puzzleZ+2.2))<.7?joinTime+dt:0;if(joinTime>.35){phase='carry';puzzleComplete=true;holdingPiece=false;puzzleZ=nz-2.2;attentionClock=0;keys={};cue('soft');goal('一起举起，一起停下','从上面看，只是一幅拼图；从下面看，是大家共同维持的通路。');say('阿苇：接稳了。眼睛移开时，我们一起挪。')}}
if(phase==='carry'){
if(nz>4&&Math.abs(nx-1)>.8){nz=Math.min(nz,cam.z);hint('阿苇伸手扶住拼图边缘，等你回到缺口下面。')}
let dz=nz-cam.z;if(watching&&Math.abs(dz)>.001&&cam.z>4){shake=Math.max(shake,.55);humanAlarm=.9;nz=Math.max(3,cam.z-dt*.8);puzzleZ=Math.max(6.8,puzzleZ-dt*.8);hint('阿苇：别动，眼睛还在看。');if(windWarning<=0){cue('step');windWarning=2}}
else if(!watching&&Math.abs(nx-1)<.85&&Math.abs(dz)>0){puzzleZ=Math.max(2,Math.min(26,puzzleZ+dz))}
if(watching)hint('上方的眼睛停住了。微民也停住了。');
if(nz>23.5){stage=2;phase='procession';cam.x=nx;cam.z=nz;keys={};ui();$('#chapterNo').textContent='同行 · 跨城送货';goal('一起走过的路，成为经验','送货队伍沿着桌边出发。下面的歧路之城，是去第三城的必经之处。');talk([['小禾','东西都到齐了。沿桌布下去，再穿过歧路之城，就到送货的地方了。']]);return}}
windWarning=Math.max(0,windWarning-dt);caravanMotion=(nz-cam.z)/Math.max(dt,.001);cam.x=nx;cam.z=nz;}
function updateReality(dt){if(phase==='discover'){let [x,z]=moveInput(dt,6);cam.x=clamp(x,-9,9);cam.z=clamp(z,-18,2);cam.y=lerp(12,5,clamp((cam.z+16)/18,0,1));if(cam.z>1&&Math.abs(cam.x-2)<4){phase='shrinking';shrinkClock=0;returnStart={...cam};keys={};say('桌缝里的脚步声，渐渐来到耳边。')}}else if(phase==='shrinking'){shrinkClock+=dt;let t=clamp(shrinkClock/3,0,1),e=t*t*(3-2*t);cam.x=lerp(returnStart.x,2,e);cam.y=lerp(returnStart.y,.3,e);cam.z=lerp(returnStart.z,4.6,e);cam.pitch=lerp(returnStart.pitch,.04,e);cam.yaw=lerp(returnStart.yaw,0,e);if(t===1){$('#reticle').hidden=false;transitionTo(1)}}else if(phase==='returning'){returnClock+=dt;let t=clamp(returnClock/4.5,0,1),e=t*t*(3-2*t);cam.x=lerp(2,-17,e);cam.y=lerp(.3,15,e);cam.z=lerp(4.6,-24,e);cam.yaw=lerp(0,.42,e);cam.pitch=lerp(.04,.27,e);if(t===1){phase='returned';$('#chapter').hidden=true;$('#reticle').hidden=true;say('');$('#action').hidden=false;$('#action').textContent='再看看桌上的缝隙';$('#action').onclick=()=>location.reload();$('#place').textContent='现实 · 同一张桌子';}}else if(phase==='returned'){cam.yaw=.42+Math.sin(time*.12)*.02;$('#action').hidden=false;$('#action').textContent='再看看桌上的缝隙';}}
function updateCloth(dt){windClock+=dt;let gust=windClock%10>5.5;let [nx,nz]=moveInput(dt,2.5);if(phase==='procession'){cam.x=clamp(nx,-3.2,3.2);cam.z=Math.min(nz,34.5);caravanMotion=forwardInput()*2.5;if(cam.z>33.5){phase='cloth';clothDemo=0;keys={};cam.yaw=Math.PI-.35;cam.pitch=.38;goal('牵住的手，共同的方向','桌布成了向下的路。风吹来时，相互牵住的人留在原处。');say('阿苇：看我，沿着布纹往下。风扇转过来时，牵紧我的手。')}return}
clothDemo+=dt;if(clothDemo<3){hint('小禾先攀住布纹，沿桌布滑下一小段。');return}
interaction(linkedHands?'松开同伴的手':'牵住阿苇的手');let down=forwardInput();let side=(keys.d?1:0)-(keys.a?1:0);
if((gust||windLost)&&!linkedHands){windLost=true;cam.x=clamp(cam.x+dt*2.1,-3.5,3.5);shake=Math.max(shake,.15);descent=Math.max(lastSafeCloth,descent-dt*1.8);hint('风把你推离布面。靠回同伴身边，牵住他的手。');if(windWarning<=0){cue('wind');windWarning=3}}else{cam.x=lerp(cam.x,linkedHands?clamp(cam.x+side*dt,-.6,.6):clamp(cam.x+side*dt,-2,2),dt*4);descent=clamp(descent+down*dt*(linkedHands?1.7:1.2),0,18);if(!gust)lastSafeCloth=Math.floor(descent/4)*4}
windWarning=Math.max(0,windWarning-dt);cam.z=35.8;cam.y=1.65-descent;caravanMotion=down;
if(descent>=18){linkedHands=false;transitionTo(3)}}
function returnToReality(){stage=0;phase='returning';returnClock=0;keys={};cam={x:2,y:.3,z:4.6,yaw:0,pitch:.04};$('#chapter').hidden=true;$('#compass').hidden=true;$('#worldlabels').innerHTML='';$('#repeat').hidden=true;say('门前的铃声渐远。桌上的物件，重新回到熟悉的大小。');}
// Human-scale face above the tabletop: attention is readable without a countdown or traffic light.
function drawHumanAttention(){if(stage!==1||humanAttention<.015)return;let alpha=humanAttention;ctx.save();ctx.globalAlpha=alpha*.9;let cx=W*.5,cy=-H*.07,rx=W*.42,ry=H*.44;ctx.fillStyle='#6e7a7c';ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();for(let d of [-1,1]){let ex=cx+d*rx*.36,ey=H*.13;ctx.fillStyle='#d3d0b4';ctx.beginPath();ctx.ellipse(ex,ey,rx*.22,H*.055,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#273c43';ctx.beginPath();ctx.ellipse(ex+clamp(cam.x,-3,3)*4,ey+H*.018,H*.036,H*.039,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#344d56';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(ex-rx*.2,ey-H*.08);ctx.lineTo(ex+rx*.2,ey-H*.08);ctx.stroke()}ctx.fillStyle='#566b73';ctx.beginPath();ctx.moveTo(cx,H*.12);ctx.lineTo(cx-rx*.055,H*.26);ctx.lineTo(cx+rx*.065,H*.26);ctx.fill();ctx.restore();}
// Rounded tabs and matching inward sockets form the actual extruded outline.
function jigsawOutline(){let out=[],corners=[[-1,-1.1],[1,-1.1],[1,1.1],[-1,1.1]];for(let i=0;i<4;i++){let a=corners[i],b=corners[(i+1)%4],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=dz/len,nz=-dx/len,sign=i<2?1:-1;let add=(u,v)=>out.push([a[0]+dx*u+nx*v*sign,a[1]+dz*u+nz*v*sign]);add(0,0);add(.38,0);add(.38,.12);for(let j=0;j<=16;j++){let q=(225-j*270/16)*Math.PI/180;add(.5+Math.cos(q)*.23/len,.29+Math.sin(q)*.23)}add(.62,.12);add(.62,0)}return out}
function meshTriangles(p){let ids=p.map((_,i)=>i),tri=[],cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);let guard=0;while(ids.length>3&&guard++<500){let found=false;for(let k=0;k<ids.length;k++){let a=ids[(k+ids.length-1)%ids.length],b=ids[k],c=ids[(k+1)%ids.length];if(cross(p[a],p[b],p[c])<=.000001)continue;let inside=ids.some(n=>n!==a&&n!==b&&n!==c&&cross(p[a],p[b],p[n])>=0&&cross(p[b],p[c],p[n])>=0&&cross(p[c],p[a],p[n])>=0);if(inside)continue;tri.push([a,b,c]);ids.splice(k,1);found=true;break}if(!found)break}if(ids.length===3)tri.push(ids);return tri}
const pieceOutline=jigsawOutline(),pieceTriangles=meshTriangles(pieceOutline);
function puzzlePiece(x,y,z,id,flat=false){let color=['#b7a17b','#899d91','#b5ae8b','#9aa592'][id],point=(i,h)=>[x+pieceOutline[i][0],h,z+pieceOutline[i][1]];for(let t of pieceTriangles){face(t.map(i=>point(i,y+.12)),color);face(t.map(i=>point(i,y)),'#8b836e');if(!flat)face(t.map(i=>point(i,.045)),'#142832')}for(let i=0;i<pieceOutline.length;i++){let j=(i+1)%pieceOutline.length;face([point(i,y),point(j,y),point(j,y+.12),point(i,y+.12)],'#6c756d')}beam([x-.65,y+.135,z-.7],[x+.6,y+.135,z+.7],.1,.02,'#435c5a');for(let k=0;k<3;k++)beam([x-.3+k*.25,y+.14,z-.3+k*.25],[x+.1+k*.2,y+.14,z-.6+k*.25],.12,.02,'#5f7868');}
function shadowWorld(){gridFloor(0,'#8b8e7c');plane(0,14,16,20,'#aaa486',.018);box(-6,0,0,5,23,8,'#455760');book(-6,0,26,5,9,9,'#536777');spool(9,0,17,2,4);mug(-12,0,13,3,9);comb(11,0,28);for(let z of [0,26])plane(0,z,11,8,'#1b303b',.03);for(let i=0;i<7;i++)plane(-5+Math.sin(i)*3,6+i*3,3,4,'#203742',.03);
// The open box and printed plan are recognisable borrowed household objects.
box(-3.5,0,3,3,.35,3.6,'#374e59');box(-3.5,.35,4.6,3,2,.15,'#7c8e8d');for(let i=0;i<4;i++)puzzlePiece(-4+(i%2),.4,2.3+Math.floor(i/2),i,true);label([-3.5,2.9,4.6],'拼图盒 · 盒盖上印着图纸');
let z=puzzleZ,sp=phase==='solo'?1.8:puzzleSpread;let p=[[-1.0-sp,z],[1+sp,z],[-1-sp,z+2.2]];
for(let i=0;i<3;i++){let [x,zz]=p[i];bearer(x,zz,i,phase==='carry'&&caravanMotion>.01&&humanAttention<.5);puzzlePiece(x,2.05,zz,i)}
if(holdingPiece){puzzlePiece(cam.x,2.05,cam.z,3);for(let d of [-1,1])beam([cam.x+d*.28,1.15,cam.z+.15],[cam.x+d*.65,2.05,cam.z+.55],.12,.10,'#b8ab8d')}
if(puzzleComplete){let x=1;puzzlePiece(x,2.05,z+2.2,3);plane(0,z+1.1,3.9,4.4,'#142832',.05)}
if(phase==='join')label([1,.5,z+2.2],'把你举着的这一块接到这里','target');
if(phase==='demo'&&demoClock>5)label([-.6,1.7,z-1],'阿苇：照盒盖上的图，把边缘接起来。','bubble');
if(phase==='carry'&&humanAttention>.5)label([0,1.8,z],'阿苇举起一只手，示意停下。','bubble');
for(let i=0;i<5;i++){box(-2+i,0,28,.8,1,1,'#334d57');box(-2+i,.4,27.48,.3,.3,.03,'#d0bb80');person(-2+i,27,i,0,true)}label([0,2,26],'书本下 · 送货队伍在这里集合');}
function clothWorld(){gridFloor(-20,'#465c68');box(0,-1,13,42,1,40,'#727d7b');book(-7,0,25,5,8,8,'#4a606d');plane(0,26,12,8,'#1b303b',.03);for(let i=0;i<3;i++){let y=phase==='cloth'?-Math.min(18,descent+.4+Math.min(clothDemo,3)*.2+i*.5):0;person(-1+i,phase==='cloth'?33:Math.min(30,cam.z+2+i),i,y,caravanMotion!==0);button(-1+i,y+.65,phase==='cloth'?33:Math.min(30,cam.z+2+i),.18)}
// Pleated textile hangs over the tabletop edge; the lower shelf reveals the next city.
for(let i=0;i<18;i++){let x=-4.5+i*.5,z=32+Math.sin(i*.8)*.17;face([[x,.04,24],[x+.5,.04,24],[x+.5,.04,z],[x,.04,z]],i%3?'#8e9b98':'#b0aca0');face([[x,0,z],[x+.5,0,z],[x+.5,-20,z],[x,-20,z]],i%3?'#748c91':'#9aa8a3');for(let j=0;j<10;j++)beam([x,-j*2,z-.025],[x+.5,-j*2,z-.025],.035,.025,'#526d79')}
box(0,-21,32,30,1,32,'#4b6270');book(-6,-20,40,5,6,8,'#4c6574');spool(7,-20,38,2,6);arch(0,-20,43,4,7);
let fanX=13,fanY=-7,fanZ=34;box(fanX,-20,fanZ,1.3,10,1.3,'#374e5b');let r=5;for(let i=0;i<40;i++){let a=i/40*Math.PI*2,b=(i+1)/40*Math.PI*2;beam([fanX+Math.cos(a)*r,fanY+Math.sin(a)*r,fanZ],[fanX+Math.cos(b)*r,fanY+Math.sin(b)*r,fanZ],.12,.1,'#a0aaa5')}for(let i=0;i<3;i++){let a=time*8+i*Math.PI*2/3;face([[fanX,fanY,fanZ],[fanX+Math.cos(a)*4.5,fanY+Math.sin(a)*4.5,fanZ],[fanX+Math.cos(a+.8)*3,fanY+Math.sin(a+.8)*3,fanZ]],'#839b9d')}
if(phase==='cloth'){let y=cam.y-.8;if(linkedHands){beam([cam.x-.3,y,cam.z-.45],[-1,-descent-.2,33],.14,.1,'#b6aa8b');beam([cam.x+.3,y,cam.z-.45],[1,-descent-1.2,33],.14,.1,'#b6aa8b');beam([-1,-descent-.2,33],[0,-descent-.7,33],.1,.08,'#1a2d37');beam([0,-descent-.7,33],[1,-descent-1.2,33],.1,.08,'#1a2d37')}else beam([cam.x-.3,y,cam.z-.45],[cam.x-.55,y-.2,cam.z-.9],.14,.1,'#b6aa8b');label([0,cam.y+1,32],linkedHands?'牵住的手，没有松开。':'阿苇向你伸出手。','bubble');if(windClock%10>5.5)for(let i=0;i<8;i++){let x=9-((time*8+i*2)%18);beam([x,-descent+i*.5-1,30],[x-1.7,-descent+i*.5-1,30],.04,.02,'#b3c3bc')}}}
$('#begin').onclick=start;$('#action').onclick=act;$('#touchAct').onclick=act;
ui();

function bearer(x,z,id,moving){let b=moving?Math.sin(time*7+id)*.035:0;let c='#162832';box(x,.55+b,z,.4,.82,.3,c);cylinder(x,1.4+b,z,.23,.33,c,12);for(let d of [-1,1]){box(x+d*.13,0,z,.11,.58,.14,c);beam([x+d*.23,1.2+b,z],[x+d*.35,2.04,z],.1,.09,c);box(x+d*.09,1.59+b,z-.23,.055,.055,.035,'#ead29b')}}

canvas.addEventListener('click',()=>{if(stage===0&&(phase==='intro'||phase==='discover'))start()});
// app.js is downloaded first. Scheduling there can run a frame before update exists.
render();
requestAnimationFrame(frame);
