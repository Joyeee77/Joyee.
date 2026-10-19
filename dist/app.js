'use strict';
const $=s=>document.querySelector(s),canvas=$('#world'),ctx=canvas.getContext('2d');
let W,H,D,time=0,last=0,stage=0,phase='intro',cam={x:-17,y:15,z:-24,yaw:.42,pitch:.27},keys={},drag=null,polygons=[],labels=[],shake=0,transition=false,end=false,dialogue=null,repeatLines=[],caravan=6,demoTime=0,notice=0,aligned=[false,false,false],fold=[0,0,0],fill=[0,0,0],npcT=0,formation=0,joinHold=0,audio=null,muted=true;
const depthRender=typeof createDepthRenderer==='function'?createDepthRenderer():null;
let caravanMotion=0;
const observations=[[-6,3.65,12],[9,3.65,12],[-8,3.65,21]];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t;

function nightColor(c){if(!c.startsWith('#'))return c;return ({'#d8c5a0':'#67716c','#cfba94':'#515e61','#bcae95':'#414d53','#596f5b':'#152b35','#6d7d65':'#1b303b','#9b9d7b':'#34454c','#e7dbc0':'#89928e','#c7aa71':'#baa069','#c7a66c':'#baa069','#e7d7aa':'#c8b784','#adbe9b':'#677d81','#c3c9a2':'#879491','#d4c9a7':'#a69e83'})[c]||c}
function arch(x,y,z,w,h){const r=w/2,base=y+h-r,n=18;face([[x-r,y,z],[x+r,y,z],[x+r,base,z],...Array.from({length:n+1},(_,i)=>{let q=i/n*Math.PI;return [x+Math.cos(q)*r,base+Math.sin(q)*r,z]})],'#eee0b0');box(x-r-.3,y,z-.1,.6,h-r,1.1,'#556a73');box(x+r+.3,y,z-.1,.6,h-r,1.1,'#556a73');for(let i=0;i<n;i++){let q=i/n*Math.PI,t=(i+1)/n*Math.PI;face([[x+Math.cos(q)*r,base+Math.sin(q)*r,z-.65],[x+Math.cos(t)*r,base+Math.sin(t)*r,z-.65],[x+Math.cos(t)*(r+.6),base+Math.sin(t)*(r+.6),z-.65],[x+Math.cos(q)*(r+.6),base+Math.sin(q)*(r+.6),z-.65]],'#82918d')}}
function room(){box(-29,-7,42,2,36,120,'#324d5a');box(29,-7,42,2,36,120,'#2b444f');box(0,-7,100,60,36,2,'#334c58');arch(-13,3,98,3,7);arch(15,12,98,2.3,5)}

function resize(){D=Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;canvas.width=W*D;canvas.height=H*D;ctx.setTransform(D,0,0,D,0,0)}
addEventListener('resize',resize);resize();
function shade(hex,v){hex=nightColor(hex);let n=parseInt(hex.slice(1),16);return 'rgb('+Math.min(255,(n>>16)*v)+','+Math.min(255,((n>>8)&255)*v)+','+Math.min(255,(n&255)*v)+')'}
function view(p){let x=p[0]-cam.x,y=p[1]-cam.y,z=p[2]-cam.z,c=Math.cos(cam.yaw),s=Math.sin(cam.yaw),xx=c*x-s*z,zz=s*x+c*z,cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);return [xx,cp*y+sp*zz,cp*zz-sp*y]}
function screen(p){let v=view(p),f=Math.min(W,H)*.86;if(v[2]<.25)return null;return [W/2+v[0]/v[2]*f,H*.52-v[1]/v[2]*f,v[2]]}
function face(points,color){color=nightColor(color);let a=points.map(view),out=[];for(let i=0;i<a.length;i++){let p=a[i],q=a[(i+1)%a.length],pin=p[2]>.35,qin=q[2]>.35;if(pin)out.push(p);if(pin!==qin){let t=(.35-p[2])/(q[2]-p[2]);out.push(p.map((v,j)=>lerp(v,q[j],t)))}}if(out.length<3)return;let f=Math.min(W,H)*.86,depth=out.reduce((s,p)=>s+p[2],0)/out.length;polygons.push({v:out,p:out.map(p=>[W/2+p[0]/p[2]*f,H*.52-p[1]/p[2]*f]),depth,color})}
function box(x,y,z,w,h,d,c){let a=x-w/2,b=x+w/2,l=z-d/2,r=z+d/2,t=y+h;face([[a,y,l],[b,y,l],[b,t,l],[a,t,l]],shade(c,.83));face([[b,y,l],[b,y,r],[b,t,r],[b,t,l]],shade(c,.72));face([[b,y,r],[a,y,r],[a,t,r],[b,t,r]],shade(c,.89));face([[a,y,r],[a,y,l],[a,t,l],[a,t,r]],shade(c,.94));face([[a,t,l],[b,t,l],[b,t,r],[a,t,r]],c)}
function plane(x,z,w,d,c,y=.02){face([[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2]],c)}
function cylinder(x,y,z,r,h,c,n=16){let top=[];for(let i=0;i<n;i++){let a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,p=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],q=[x+Math.cos(b)*r,y,z+Math.sin(b)*r];face([p,q,[q[0],y+h,q[2]],[p[0],y+h,p[2]]],shade(c,.78+.2*Math.cos(a)));top.push([p[0],y+h,p[2]])}face(top,c)}
function cone(x,y,z,r,h,c,n=8){for(let i=0;i<n;i++){let a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;face([[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x,y+h,z],[x+Math.cos(b)*r,y,z+Math.sin(b)*r]],shade(c,.8+.2*Math.sin(a)))}}
function beam(a,b,w,d,c){let dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz)||1,ox=dz/len*w/2,oz=-dx/len*w/2;let pts=[[a[0]-ox,a[1],a[2]-oz],[a[0]+ox,a[1],a[2]+oz],[b[0]+ox,b[1],b[2]+oz],[b[0]-ox,b[1],b[2]-oz]];face(pts,c);for(let i=0;i<4;i++){let q=pts[i],r=pts[(i+1)%4];face([q,r,[r[0],r[1]-d,r[2]],[q[0],q[1]-d,q[2]]],shade(c,.70+i*.045))}}
function person(x,z,id=0,y=0,moving=false,carrying=false){let bob=moving?Math.sin(time*7+id)*.045:Math.sin(time*1.5+id)*.012,c=id%2?'#172229':'#111d24';box(x,y+.41+bob,z,.34,.54,.25,c);cylinder(x,y+.97+bob,z,.20,.27,c,12);for(let j of [-1,1]){box(x+j*.11,y,z+(moving?Math.sin(time*7+id)*j*.12:0),.09,.45,.1,c);box(x+j*.24,y+(carrying?.73:.44)+bob,z,.075,carrying?.27:.46,.09,c);box(x+j*.07,y+1.1+bob,z-.19,.045,.045,.035,'#ebd293')}if(id===0)box(x-.24,y+.52,z-.11,.13,.12,.11,'#d0ab57')}
function book(x,y,z,w,h,d,c){box(x,y,z,w+.22,.15,d+.18,c);box(x,y+.15,z,w,h-.3,d,'#e7dbc0');box(x,y+h-.15,z,w+.22,.15,d+.18,c);box(x-w/2,y,z,.22,h,d,c);for(let i=1;i<Math.min(7,h*5);i++)box(x,y+.15+i*(h-.3)/7,z-d/2-.015,w,.022,.025,'#b9ad91')}
function mug(x,y,z,r=2.5,h=6){cylinder(x,y,z,r,h,'#748d93',20);cylinder(x,y+h+.01,z,r*.83,.04,'#152e3a',20);cylinder(x,y+h+.055,z,r*.65,.01,'#294650',20);box(x+r+.7,y+h*.3,z,.45,h*.48,.7,'#657f86');box(x+r+.2,y+h*.25,z,1.4,.4,.7,'#899d9d');box(x+r+.2,y+h*.73,z,1.4,.4,.7,'#899d9d');cylinder(x,y-.08,z,r+1,.12,'#607980',20)}
function spool(x,y,z,r=1.4,h=3){cylinder(x,y,z,r+.3,.25,'#687777');cylinder(x,y+.25,z,r,h-.5,'#4c626c');for(let i=0;i<8;i++)cylinder(x,y+.3+i*(h-.5)/8,z,r+.025,.025,'#82918c',12);cylinder(x,y+h-.25,z,r+.3,.25,'#98a59b');cylinder(x,y+h+.01,z,.23,.02,'#7d7155')}
function ruler(x,y,z,w=6,d=2){box(x,y,z,w,.13,d,'#cfab72');for(let i=0;i<12;i++)box(x-w/2+.2+i*w/12,y+.14,z-d/2+.15,.035,.01,i%2?.3:.55,'#6f765b')}
function comb(x,y,z){box(x,y,z,9,.4,1,'#34464c');for(let i=0;i<12;i++)box(x-4.1+i*.74,y,z+1.8,.26,.35,3,'#576668')}
function button(x,y,z,r=.65){cylinder(x,y,z,r,.16,'#cbbd8d',12);for(let a of [-1,1])for(let b of [-1,1])cylinder(x+a*.18,y+.17,z+b*.18,.07,.02,'#676f55',6)}
function label(p,text,type=''){labels.push({p,text,type})}
function gridFloor(y,c){for(let x=-48;x<49;x+=12)for(let z=-20;z<106;z+=12)plane(x,z,12,12,c,y);for(let i=-8;i<9;i++)plane(i*6,40,.035,120,'#bca780',y+.01)}
function lightShadow(points,c='#6d7d65'){face(points.map(p=>[p[0],.035,p[1]]),c)}
function desktop(){gridFloor(-1,'#cfba94');book(6,0,10,12,1.7,17,'#3c5d68');book(4,1.7,11,10,1.3,14,'#6f6b62');mug(13,0,26,4,10);spool(-6,0,21,2,5);comb(-3,0,11);ruler(6,.2,-1,17,2);for(let i=0;i<5;i++)button(-2+i*2.2,0,4+i%2);box(2,.05,5,7,.1,.4,'#415f4f');for(let i=0;i<5;i++)person(1+i*.4,4.9,i,0);label([2,1.8,5],'桌缝里，有人在搬运借来的东西。','bubble')}
function projectShade(p){return [p[0]+p[1]*1.2,.045,p[2]]}
function hull2(points){let a=points.map(p=>[p[0],p[2]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(let p of a){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p)}for(let p of a.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p)}return lo.slice(0,-1).concat(hi.slice(0,-1)).map(p=>[p[0],.04,p[1]])}
function warped(p,i){let o=observations[i],k=1+(1-fold[i])*(i===1?.42:.32);return p.map((v,j)=>o[j]+(v-o[j])*k)}
const roadNodes=[[0,2,23],[8,4,35],[-7,6,47],[3,8,59]];
function pathX(z){if(z<=23)return 0;if(z>=59)return 3;let i=clamp(Math.floor((z-23)/12),0,2);return lerp(roadNodes[i][0],roadNodes[i+1][0],(z-roadNodes[i][2])/12)}
function bridgeKnot(i){return roadNodes[i].map((v,j)=>lerp(v,roadNodes[i+1][j],.5))}
function bridge(i){let a=roadNodes[i],m=bridgeKnot(i),b=roadNodes[i+1],wm=warped(m,i),wb=warped(b,i);let c=['#a69b7c','#73908d','#9d9684'][i];beam(a,m,3.2,.45,c);beam(wm,wb,3.2,.45,c);for(let j=0;j<6;j++){let t=j/6,p=a.map((v,k)=>lerp(v,m[k],t));box(p[0]-1.25,p[1]+.025,p[2],j%2?.25:.4,.03,.05,'#6c7560');let q=wm.map((v,k)=>lerp(v,wb[k],t));box(q[0]+1.25,q[1]+.025,q[2],.3,.03,.05,'#6c7560')}if(aligned[i])for(let j=0;j<3;j++){let t=(j+1)/4,p=a.map((v,k)=>lerp(v,b[k],t));cylinder(p[0],p[1]+.02,p[2],.09,.03,'#f6d68c',8)}}
function terrace(){// A book landscape: only the bound pages and rulers are walkable.
gridFloor(-7,'#bcae95');
book(0,-2,10,24,4,26,'#4e6975');
book(-16,-5,23,7,13,13,'#435766');book(-18,8,23,8,1,12,'#8c958b');
book(16,-5,33,6,17,11,'#566f7b');book(16,12,33,7,1,12,'#697d88');
book(-12,-5,45,8,15,12,'#536b75');book(13,-5,58,6,19,12,'#4b6570');
book(3,-3,65,10,11,12,'#455f69');
for(let i=1;i<4;i++){let [x,y,z]=roadNodes[i];spool(x,-7,z,1.4,y+7);book(x,y-.5,z,4.2,.5,4.2,'#536a70');button(x+.8,y+.02,z-.4,.3)}
// Side balconies, a paper stair and occupied matchbox homes make a city around the route.
for(let i=0;i<7;i++){book(-6-i*.6,2+i*.55,7+i*.8,3,.6,2,'#526b76');}
for(let q of [[-16,9,23],[16,13,33],[-12,10,45],[13,14,58]]){for(let i=0;i<3;i++){let x=q[0]+(i-1)*1.6;box(x,q[1],q[2],1.3,1.8,2,'#374c58');box(x,q[1]+.6,q[2]-1.02,.55,.65,.03,'#b8ac79')}beam([q[0]-3,q[1],q[2]-2],[q[0]+3,q[1],q[2]-2],1,.3,'#86908b')}
spool(-9,2,20,1.6,3);mug(18,-7,12,4.5,13);comb(-17,10,45);ruler(15,13.1,33,11,2);
for(let j=0;j<5;j++)book(-17+j*.55,-4+j*1.1,35+j*1.1,4,1.2,2.5,'#657777');
for(let i=0;i<3;i++){bridge(i);if(!aligned[i]&&(i===0||i===2)){let o=observations[i];cylinder(o[0],2.025,o[2],.85,.025,'#c7a66c',24);cylinder(o[0],2.055,o[2],.62,.025,'#e7d7aa',20);button(o[0]-.9,2,o[2],.22)}}
let crowd=phase==='first'||phase==='firstFold'?1:0;let nX=lerp(lerp(-4,-5.8,crowd),9,npcT),nZ=12;person(-5.2,12,0,2);person(nX,nZ,1,2,npcT>0&&npcT<1);person(9,12,5,2);box(9,3.3,12,.35,.16,.3,'#c5ad7c');person(lerp(-3,8,npcT),13,2,2,npcT>0&&npcT<1);
if(phase==='firstFold')label([-5.2,3.7,12],'阿苇：我们还站在一起，怎么只接上了这一段？','bubble');
if(phase==='first'){label([-5.2,3.7,12],'阿苇：像刚才那样，我们一起走。先到我身边看看。','bubble');label([-6,2.7,12],'','target')}
if(phase==='demo2')label([9,4,12],'本地微民：我们分开站，各自看见的路，才能接成大家的路。','bubble');
if(phase==='final'){label([-5.2,3.8,12],'阿苇：不用再跟着我。线轴那边，还没有人站。','bubble');label([-8,3,21],'','target')}
if(stage===4){for(let i=0;i<5;i++){let z=Math.min(66,cam.z+3+i*1.6);person(pathX(z)+Math.sin(i)*.6,z,i,pathHeight(z),Math.abs(caravanMotion)>.01)}}
arch(3,8,65.7,4.5,6.2);face([[.8,8.025,65],[5.2,8.025,65],[7.8,8.025,60],[-1.8,8.025,60]],'#c7bb8f');box(.5,8,65,.8,6,.9,'#adbe9b');box(5.5,8,65,.8,6,.9,'#adbe9b');box(.5,8,65,1.2,.4,1.4,'#d4c9a7');box(5.5,8,65,1.2,.4,1.4,'#d4c9a7');label([3,15.2,65],'门里飘来一阵陌生的铃声');
beam([3,8,68],[-4,8,85],4,.5,'#aaaec0');
for(let i=0;i<8;i++){spool((i%2?-1:1)*(5+i%3),8,76+i*4,1.3,3+i%3);book((i%2?-1:1)*9,0,77+i*4,4,12+i%3,5,'#465a70');person(Math.sin(i)*1.3,77+i*2,i,8,true)}
for(let i=0;i<4;i++){person(15+(i%2),32+i,3,13,true);person(-13,43+i,2,10,true)}
}
function drawLabels(){let html='';for(let l of labels){let p=screen(l.p);if(l.text&&p&&p[0]>50&&p[0]<W-50&&p[1]>85&&p[1]<H-130&&p[2]<75)html+='<div class="label '+l.type+'" style="left:'+p[0]+'px;top:'+p[1]+'px">'+l.text+'</div>'}$('#worldlabels').innerHTML=html}
function ring(p,c,r){let s=screen(p);if(!s)return;ctx.beginPath();ctx.arc(s[0],s[1],r,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(s[0],s[1],2,0,7);ctx.fillStyle=c;ctx.fill()}
function render(){
let sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,stage>=3?'#152833':'#1b303a');sky.addColorStop(1,stage>=3?'#4c6269':'#667476');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);polygons=[];labels=[];
room();if(stage===0)desktop();else if(stage===1)shadowWorld();else if(stage===2)clothWorld();else terrace();
polygons.sort((a,b)=>b.depth-a.depth);ctx.save();if(shake>0)ctx.translate(Math.sin(time*61)*shake*9,Math.cos(time*57)*shake*6);if(depthRender)depthRender(polygons,ctx,W,H,D);else for(let f of polygons){ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=.5;ctx.stroke()}ctx.restore();
if(stage===3&&!dialogue){let i=phase==='first'?0:phase==='final'?2:-1;if(i>=0&&Math.hypot(cam.x-observations[i][0],cam.z-observations[i][2])<2.5){ring(bridgeKnot(i),'#fff3c8',10);ring(warped(bridgeKnot(i),i),'#b7803f',14);if(false){let p=screen(bridgeKnot(i));if(p){ctx.beginPath();ctx.arc(p[0],p[1],20,-Math.PI/2,-Math.PI/2+fill[i]*Math.PI*2);ctx.strokeStyle='#e2b95f';ctx.lineWidth=4;ctx.stroke()}}}}
drawHumanAttention();drawLabels();for(let i=0;i<17;i++){let x=(i*191.7+Math.sin(time*.2+i)*10)%W,y=((i*131-time*4)%H+H)%H;ctx.fillStyle='#e6bb5c99';ctx.beginPath();ctx.ellipse(x,y,i%3===0?3:1.5,1.1,Math.sin(time*.4+i),0,7);ctx.fill()}
}
function goal(title,task){$('#chapterTitle').textContent=title;$('#task').textContent=task}
function ui(){$('#chapterNo').textContent=stage<3?'同行之城':'歧路之城';$('#place').textContent=['桌上的另一种生活','借一片阴凉','微民的跨城队伍','尺子的另一面','风从门那边来'][stage];$('#progress').innerHTML=stage>=3?aligned.map((v,i)=>'<span class="'+(v?'done':'')+'">'+['Ⅰ','Ⅱ','Ⅲ'][i]+' '+(v?'已接通':'断开')+'</span>').join(''):''}
function say(t){$('#caption').textContent=t}
function talk(lines,done){dialogue={lines,index:0,done};repeatLines=lines;keys={};$('#conversation').hidden=false;$('#action').hidden=true;$('#hint').hidden=true;$('#repeat').hidden=false;showLine()}
function showLine(){let l=dialogue.lines[dialogue.index];$('#speaker').textContent=l[0];$('#speech').textContent=l[1];$('#next').textContent=dialogue.index===dialogue.lines.length-1?'听见了 · E':'继续听 · E'}
function next(){if(!dialogue)return;dialogue.index++;if(dialogue.index<dialogue.lines.length)showLine();else{let f=dialogue.done;dialogue=null;$('#conversation').hidden=true;keys={};if(f)f()}}
function pathHeight(z){return z<=23?2:z>=59?8:2+(z-23)/6}
function compass(){let p=pointTarget();$('#compass').hidden=!p||!!dialogue;if(!p)return;let a=Math.atan2(p[0]-cam.x,p[2]-cam.z)-cam.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));$('#compass b').style.transform='rotate('+a+'rad)';$('#compass small').textContent=Math.hypot(p[0]-cam.x,p[2]-cam.z)<1.5?'就在身旁':Math.round(Math.hypot(p[0]-cam.x,p[2]-cam.z))+' 步';$('#compass span').textContent=stage===4?'铃声':stage===1?'同伴':'目光'}
function updateCity(dt){
if(transition||end||$('#guide').open)return;shake=Math.max(0,shake-dt*1.3);notice=Math.max(0,notice-dt);compass();if(stage===0){cam.yaw=.42+Math.sin(time*.1)*.025;return}if(dialogue)return;
$('#action').hidden=true;$('#hint').hidden=true;
let vx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),vz=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),norm=Math.hypot(vx,vz)||1,speed=4;let nx=cam.x+(vx*Math.cos(cam.yaw)+vz*Math.sin(cam.yaw))/norm*dt*speed,nz=cam.z+(vz*Math.cos(cam.yaw)-vx*Math.sin(cam.yaw))/norm*dt*speed;
{
nx=clamp(nx,-10.8,10.8);nz=Math.max(1,nz);
if(nz>23&&nz<59){let seg=clamp(Math.floor((nz-23)/12),0,2);if(!aligned[seg]||fold[seg]<.99||Math.abs(nx-pathX(nz))>1.5){nx=cam.x;nz=cam.z;$('#hint').hidden=false;$('#hint').textContent='脚下的书页到这里就结束了。'}}
if(nz>=59){nx=clamp(nx,-1,7)}
if(stage===3){
let idx=phase==='first'?0:phase==='final'?2:-1;
if(idx>=0){let o=observations[idx],dist=Math.hypot(cam.x-o[0],cam.z-o[2]);if(dist<2.5){let p=screen(bridgeKnot(idx)),q=screen(warped(bridgeKnot(idx),idx));let error=p&&q?Math.hypot(p[0]-q[0],p[1]-q[1]):999,focus=p?Math.hypot(p[0]-W/2,p[1]-H*.52):999;let ok=dist<1.05&&error<13&&focus<100;fill[idx]=clamp(fill[idx]+dt*(ok?.43:-.25),0,1);$('#hint').hidden=false;$('#hint').textContent=ok?'好像，接得上……':dist>1.05?'再挪一点呢？':'顺着尺子的边缘，看看另一头。';if(fill[idx]>=1){aligned[idx]=true;ui();if(idx===0){phase='firstFold';demoTime=0;say('尺子轻轻折了一下。')}else{phase='lastFold';demoTime=0;say('那边有人试着迈出了一步。')}}}}
if(phase==='firstFold'){demoTime+=dt;goal('靠拢，为什么不再够用？','站在相近位置，只能接通一小段路；其他断路仍然错开。');if(demoTime>5){phase='demo2';demoTime=0;localExplained=false;goal('不同的观察，共同形成空间','远处有人独自站着，断开的尺沿却正在他们眼前接合。');say('小禾：他们没有靠在一起，路怎么也接上了？')}}
if(phase==='demo2'){demoTime+=dt;if(demoTime>5&&!localExplained){localExplained=true;talk([['本地微民','这里要分开站。每个人看见的世界不一样，各自接起一段，才有大家都能走的路。']]);return}npcT=clamp((demoTime-7)/4,0,1);if(demoTime>2&&!aligned[1]){aligned[1]=true;ui();say('远处的本地微民转过头，错开的尺沿缓缓合拢。')}if(demoTime>12){phase='final';goal('换一个位置，会看见什么？','你需要离开朋友，从另一处位置观察，接上尚未连接的路段。');talk([['阿苇','原来这里不必跟着我。最后那一段，你去找自己的位置吧。我留在这里。']])}}
if(phase==='lastFold'){demoTime+=dt;if(demoTime>3){stage=4;phase='journey';ui();goal('不同的位置，同一条路','你们没有站在同一个位置，却共同形成了一条所有人都能走的路。');say('阿苇：路连好了，一起走吧。')}}
}
for(let i=0;i<3;i++)if(aligned[i])fold[i]=Math.min(1,fold[i]+dt*.4);
cam.y=lerp(cam.y,pathHeight(nz)+1.65,Math.min(1,dt*8));
if(stage===4&&nz>63.5&&Math.abs(nx-3)<2){returnToReality();return}
}
caravanMotion=lerp(caravanMotion,(nz-cam.z)/Math.max(dt,.001),Math.min(1,dt*8));cam.x=nx;cam.z=nz;
}
$('#begin').onclick=()=>start();$('#action').onclick=()=>act();$('#next').onclick=next;
$('#repeat').onclick=()=>{if(!dialogue&&repeatLines.length)talk(repeatLines)};
$('#help').onclick=()=>{keys={};$('#guide').showModal()};$('#close').onclick=$('#resume').onclick=()=>$('#guide').close();$('#restart').onclick=()=>location.reload();
addEventListener('keydown',e=>{if($('#guide').open)return;if(e.key.toLowerCase()==='e'&&!e.repeat){e.preventDefault();act();return}if(dialogue)return;keys[e.key.toLowerCase()]=true;if(e.key.startsWith('Arrow')||e.key===' ')e.preventDefault()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{keys={};drag=null});
canvas.addEventListener('pointerdown',e=>{if(dialogue)return;drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(drag&&!end&&phase!=='intro'&&!transition){cam.yaw+=(e.clientX-drag[0])*.004;cam.pitch=clamp(cam.pitch+(e.clientY-drag[1])*.003,-.8,.8);drag=[e.clientX,e.clientY]}});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
for(let b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.key]=false}
$('#sound').onclick=()=>{muted=!muted;$('#sound').textContent='声音 '+(muted?'关':'开');try{if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();let g=audio.createGain();g.gain.value=.018;g.connect(audio.destination);[130.81,196,261.63].forEach((f,i)=>{let o=audio.createOscillator();o.frequency.value=f+i*.17;o.connect(g);o.start()})}muted?audio.suspend():audio.resume()}catch{muted=true;$('#sound').textContent='声音不可用'}};
function frame(t){let dt=Math.min(.04,(t-last)/1000||.016);last=t;time+=dt;update(dt);render();requestAnimationFrame(frame)}
// Start the animation only after final.js has initialized the experience.
