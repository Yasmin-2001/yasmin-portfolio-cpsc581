(() => {
const canvas=document.getElementById('cat-canvas');if(!canvas)return;
const ctx=canvas.getContext('2d'),room=canvas.closest('.cat-room'),msg=document.getElementById('cat-message'),pause=document.getElementById('cat-pause');
const W=720,H=590;let t=0,last=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cats=[{name:'Mochi',fur:'#cd9261',light:'#f4d2a2',x:0,y:0},{name:'Pepper',fur:'#626675',light:'#c6cad0',x:0,y:0},{name:'Luna',fur:'#e9ddc9',light:'#fff5e2',x:0,y:0},{name:'Olive',fur:'#9b9181',light:'#d8cbb6',x:0,y:0},{name:'Bean',fur:'#aa6c47',light:'#eac79b',x:0,y:0},{name:'Pip',fur:'#b9a69c',light:'#f3e6d8',x:0,y:0}];
const feeding={food:0,capacity:36,next:Infinity,lastCat:-1};
const foodSlots=[{x:44,y:545,dir:1,mouthX:65,mouthY:544},{x:118,y:545,dir:-1,mouthX:94,mouthY:544},{x:60,y:537,dir:1,mouthX:78,mouthY:539}];
function refill(){feeding.food=feeding.capacity;feeding.next=t+1+Math.random()*2;msg.textContent='Dinner is served! The cats will come when they are ready.';updateFoodLabel();render();}
function drawFoodRim(){
  path(p=>{p.ellipse(78,543,35,12,0,0,Math.PI)},'#dce5db',4);
}
function updateFoodLabel(){const b=document.getElementById('food-refill');if(b)b.textContent=feeding.food>0?`Refill food · ${Math.ceil(feeding.food/feeding.capacity*100)}% left`:'Fill the food bowl';}
function updateFeeding(dt){
  if(feeding.food>0&&t>=feeding.next){
    const occupied=new Set(cats.filter(c=>c.visit).map(c=>c.visit.slot));
    const candidates=cats.filter(c=>!c.visit&&!(c.petUntil>t)).sort(()=>Math.random()-.5);
    let count=Math.min(3-occupied.size,1+Math.floor(Math.random()*3),candidates.length);
    for(let j=0;j<count;j++){
      const c=candidates[j],slot=foodSlots.findIndex((_,i)=>!occupied.has(i));if(slot<0)break;occupied.add(slot);
      c.visit={slot,start:t+Math.random()*1.8+j*.8,fromX:c.x,fromY:c.y,duration:3+Math.random()*2,eatFor:4+Math.random()*5};
    }
    feeding.next=t+5+Math.random()*7;
  }
  cats.forEach(c=>{const v=c.visit;if(!v)return;const age=t-v.start;
    if(age>=v.duration&&!v.leave){
      if(feeding.food>0){feeding.food=Math.max(0,feeding.food-dt*.85);}
      if(feeding.food<=0||age>v.duration+v.eatFor){v.leave=t;v.leaveX=c.x;v.leaveY=c.y;}
    }
    if(v.leave&&t-v.leave>3.2)c.visit=null;
  });
  if(feeding.food===0&&feeding.wasFull){msg.textContent='All gone! Click the bowl to serve another helping.';feeding.wasFull=false;}
  if(feeding.food>0)feeding.wasFull=true;updateFoodLabel();
}
function drawFood(){
 ellipse(78,565,65,14,'#8a927b44');box(13,550,130,20,10,'#b3bea2');
 ctx.fillStyle='#9caa9a';ctx.beginPath();ctx.moveTo(42,542);ctx.lineTo(49,566);ctx.quadraticCurveTo(78,578,107,566);ctx.lineTo(114,542);ctx.closePath();ctx.fill();
 ellipse(78,543,37,13,'#dce5db');ellipse(78,543,30,9,'#677c6d');
 const n=Math.round(feeding.food/feeding.capacity*36);
 for(let i=0;i<n;i++){const a=i*2.399,r=Math.sqrt((i+.5)/36)*25;ellipse(78+Math.cos(a)*r,543+Math.sin(a)*r*.28,3.3,2.2,i%3?'#a9784d':'#c89c64');}
 ctx.fillStyle='#4e695c';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText(feeding.food>0?'CLICK TO TOP UP':'CLICK TO FILL',78,588);ctx.textAlign='left';
}
// Independent positions and targets: neither animal is attached to the other.
const mouse={x:540,y:538,tx:540,ty:538,next:0,dir:1};
const hunter={x:370,y:554,dir:1,mode:'watch',next:3,pose:'idle'};
const mouseStops=[{x:155,y:429},{x:435,y:418},{x:620,y:466},{x:594,y:559},{x:213,y:554},{x:381,y:482},{x:455,y:553}];
function advanceAnimal(a,tx,ty,speed,dt){const dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);if(d>1){const step=Math.min(d,speed*dt);a.x+=dx/d*step;a.y+=dy/d*step;if(Math.abs(dx)>2)a.dir=dx>0?1:-1;}return d;}
function updateChase(dt){
  const interrupted=cats[4].visit||cats[4].petUntil>t;
  if(interrupted&&(hunter.mode==='pounce'||hunter.mode==='hold')){hunter.mode='rest';hunter.next=t+3;mouse.next=0;}
  if(hunter.mode==='pounce'){
    const q=Math.min(1,(t-hunter.pounceAt)/.55);
    hunter.x=hunter.fromX+(hunter.aimX-hunter.fromX)*q;
    hunter.y=hunter.fromY+(hunter.aimY-hunter.fromY)*q;
    hunter.pose='pounce';hunter.lift=Math.sin(q*Math.PI)*38;
    if(q===1){hunter.lift=0;const gap=Math.hypot(mouse.x-(hunter.x+hunter.dir*27),mouse.y-hunter.y);
      if(gap<40){hunter.mode='hold';hunter.pose='crouch';hunter.next=t+1.6;msg.textContent='Bean caught the toy mouse! …and there it goes again.';}
      else{hunter.mode='rest';hunter.pose='crouch';hunter.next=t+2;}}
  }
  if(hunter.mode==='hold'){
    mouse.x=hunter.x+hunter.dir*27;mouse.y=hunter.y-2;
    if(t<hunter.next)return;
    hunter.mode='watch';hunter.next=t+2.8;hunter.pose='idle';mouse.next=0;mouse.sprintUntil=t+3;
  }
  const distance=Math.hypot(mouse.x-hunter.x,mouse.y-hunter.y);
  if(t>=mouse.next||Math.hypot(mouse.tx-mouse.x,mouse.ty-mouse.y)<5){
    let options=mouseStops.filter(p=>Math.hypot(p.x-mouse.x,p.y-mouse.y)>130);
    if(!options.length)options=mouseStops;
    const target=options[Math.floor(Math.random()*options.length)];mouse.tx=target.x;mouse.ty=target.y;mouse.next=t+3+Math.random()*3;
  }
  advanceAnimal(mouse,mouse.tx,mouse.ty,mouse.sprintUntil>t?170:distance<120?114:68,dt);
  if(interrupted){hunter.pose='idle';hunter.next=t+1;return;}
  if(hunter.mode==='pounce')return;
  if(t>=hunter.next){
    const choices=hunter.mode==='watch'?['stalk','chase','chase']:hunter.mode==='stalk'?['chase','watch']:['rest','watch'];
    hunter.mode=choices[Math.floor(Math.random()*choices.length)];hunter.next=t+(hunter.mode==='chase'?3+Math.random()*2:2+Math.random()*3);
  }
  hunter.pose=hunter.mode==='stalk'?'crouch':hunter.mode==='chase'?'gallop':'idle';
  hunter.lift=0;
  if(hunter.mode==='chase'){
    if(distance<92&&distance>24&&Math.random()<dt*2.5){
      hunter.mode='pounce';hunter.pounceAt=t;hunter.fromX=hunter.x;hunter.fromY=hunter.y;
      hunter.dir=mouse.x>hunter.x?1:-1;hunter.aimX=mouse.x-hunter.dir*27;hunter.aimY=mouse.y;hunter.pose='pounce';
    }else advanceAnimal(hunter,mouse.x-(mouse.dir*38),mouse.y+3,175,dt);
  }else if(hunter.mode==='stalk'&&distance>110)advanceAnimal(hunter,mouse.x,mouse.y+8,29,dt);
  else if(Math.abs(mouse.x-hunter.x)>10)hunter.dir=mouse.x>hunter.x?1:-1;
}
const ball={x:425,y:513,vx:0,vy:0,spin:0};
const ballCat={x:365,y:517,dir:1,mode:'approach',until:0,hit:false};
function updateBall(dt){
  ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.spin+=ball.vx*dt*.055;
  const friction=Math.exp(-1.15*dt);ball.vx*=friction;ball.vy*=friction;
  if(ball.x<265||ball.x>610){ball.x=Math.max(265,Math.min(610,ball.x));ball.vx*=-.65;}
  if(ball.y<478||ball.y>550){ball.y=Math.max(478,Math.min(550,ball.y));ball.vy*=-.65;}
  if(cats[5].visit||cats[5].petUntil>t){ballCat.mode='watch';ballCat.until=t+1;return;}
  if(ballCat.mode==='bat'){
    const age=t-ballCat.started;
    if(age>.43&&!ballCat.hit){ballCat.hit=true;ball.vx=ballCat.dir*(110+Math.random()*55);ball.vy=(Math.random()-.5)*52;}
    if(age>1){ballCat.mode='watch';ballCat.until=t+1.5+Math.random()*2;}
    return;
  }
  if(ballCat.mode==='watch'&&t<ballCat.until)return;
  if(Math.hypot(ball.vx,ball.vy)>35){ballCat.mode='watch';ballCat.until=t+.4;return;}
  ballCat.mode='approach';
  // Walk toward a contact position; the ball is never positioned relative to the cat.
  if(ball.x>550)ballCat.dir=-1;else if(ball.x<325)ballCat.dir=1;else ballCat.dir=ball.x>ballCat.x?1:-1;
  const tx=ball.x-ballCat.dir*42,ty=ball.y+4;
  const d=advanceAnimal(ballCat,tx,ty,48,dt);
  ballCat.dir=ball.x>ballCat.x?1:-1;
  if(d<3){ballCat.mode='bat';ballCat.started=t;ballCat.hit=false;}
}
function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(canvas.clientWidth*d);canvas.height=Math.round(canvas.clientHeight*d);render();}new ResizeObserver(resize).observe(canvas);
const ellipse=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
function path(points,c,width=2){ctx.strokeStyle=c;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points(ctx);ctx.stroke();}
function box(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function poly(p,c){ctx.fillStyle=c;ctx.beginPath();p.forEach((a,i)=>i?ctx.lineTo(...a):ctx.moveTo(...a));ctx.closePath();ctx.fill();}
function flowerpot(x,y,s=1,type='daisy'){
ctx.save();ctx.translate(x,y);ctx.scale(s,s);
if(type==='leaves'){
  const leaves=[[-25,-55,-.65],[-15,-86,-.32],[2,-99,.08],[23,-75,.48],[30,-45,.85],[-28,-31,-.95],[7,-57,.2]];
  for(let j=0;j<leaves.length;j++){
    const [lx,ly,angle]=leaves[j];
    path(p=>{p.moveTo(0,0);p.quadraticCurveTo(lx*.3,ly*.45,lx,ly+13)},'#557550',2.5);
    ctx.save();ctx.translate(lx,ly);ctx.rotate(angle);
    ctx.fillStyle=j%2?'#769269':'#567b58';ctx.beginPath();ctx.moveTo(0,-25);ctx.bezierCurveTo(20,-12,19,13,0,22);ctx.bezierCurveTo(-17,11,-17,-12,0,-25);ctx.fill();
    path(p=>{p.moveTo(0,18);p.quadraticCurveTo(-2,0,0,-21)},'#a4b88c',1);
    ctx.restore();
  }
  box(-26,-3,52,36,7,'#c9ae86');box(-29,-5,58,9,3,'#d9c09b');
}else if(type==='lavender'){
  for(let j=0;j<7;j++){
    const xx=(j-3)*7,yy=-52-(j%3)*12;
    path(p=>{p.moveTo(0,0);p.quadraticCurveTo(xx*.7,-25,xx,yy)},'#6e8560',2);
    for(let k=0;k<5;k++){ellipse(xx-3,yy+k*4,4,3,j%2?'#a08ab7':'#8d78a5');ellipse(xx+3,yy+k*4+2,4,3,'#b49ac5');}
    path(p=>{p.moveTo(xx*.5,-23);p.lineTo(xx*.5-9,-33);p.moveTo(xx*.5,-28);p.lineTo(xx*.5+9,-38)},'#80966b',2);
  }
  poly([[-25,0],[25,0],[19,33],[-19,33]],'#b7c6bd');box(-27,-4,54,8,3,'#c7d4cc');
}else if(type==='tulip'){
  for(let j=0;j<3;j++){
    const xx=(j-1)*21,yy=-62-(j%2)*24;
    path(p=>{p.moveTo(xx*.4,0);p.quadraticCurveTo(xx+4,-32,xx,yy)},'#688b67',3);
    ctx.fillStyle='#7f9d70';ctx.beginPath();ctx.moveTo(xx*.4,-4);ctx.quadraticCurveTo(xx-29,-20,xx-19,-49);ctx.quadraticCurveTo(xx+2,-26,xx*.4,-4);ctx.fill();
    ctx.fillStyle=j===1?'#d7a068':'#bd7482';ctx.beginPath();ctx.moveTo(xx-12,yy-11);ctx.lineTo(xx-5,yy-5);ctx.lineTo(xx,yy-15);ctx.lineTo(xx+5,yy-5);ctx.lineTo(xx+12,yy-11);ctx.bezierCurveTo(xx+15,yy+17,xx-15,yy+17,xx-12,yy-11);ctx.fill();
    path(p=>{p.moveTo(xx,yy-8);p.quadraticCurveTo(xx-4,yy+4,xx,yy+10)},'#ffffff33',1);
  }
  box(-26,-3,52,36,7,'#c9ae86');box(-29,-5,58,9,3,'#d9c09b');
}else{
  for(let j=0;j<4;j++){
    const xx=(j-1.5)*16,yy=-60-(j%2)*24;
    path(p=>{p.moveTo(0,0);p.quadraticCurveTo(xx,-34,xx,yy)},'#648466',2.5);
    ellipse(xx-9,-28-(j%2)*9,12,4,'#829b70');ellipse(xx+7,-40,10,4,'#6e8b62');
    for(let k=0;k<9;k++){ctx.save();ctx.translate(xx,yy);ctx.rotate(k*Math.PI*2/9);ellipse(0,-9,4,9,'#fff9e9');ctx.restore();}ellipse(xx,yy,6,6,'#d8b25c');
  }
  poly([[-23,0],[23,0],[17,39],[-17,39]],'#b77d60');box(-26,-4,52,9,3,'#c38d6e');
}ctx.restore();
}
function bird(x,y,s){path(p=>{p.moveTo(x-10*s,y);p.quadraticCurveTo(x-4*s,y-8*s,x,y);p.quadraticCurveTo(x+4*s,y-8*s,x+10*s,y)},'#708d8c',2);}
function background(){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#f4eee2');g.addColorStop(1,'#e6dccb');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#d6c5ab';ctx.fillRect(0,340,W,250);ctx.fillStyle='#ebdfcb';ctx.fillRect(0,336,W,9);for(let y=390;y<590;y+=66)path(p=>{p.moveTo(0,y);p.lineTo(W,y)},'#cbb799',1);for(let i=0;i<5;i++)path(p=>{p.moveTo(i*180+(i%2)*30,344);p.lineTo(i*180-100,H)},'#cbb799',1);
// Deep window recess and birds entirely behind the glass.
box(54,28,242,215,14,'#cbbca5');box(64,38,222,195,8,'#d6e8e4');ctx.save();ctx.beginPath();ctx.rect(68,42,214,187);ctx.clip();ellipse(238,74,25,25,'#f8e6ad');ellipse(100,225,150,49,'#b6c7ad');ellipse(250,235,140,45,'#93ad9a');for(let i=0;i<4;i++){let x=55+((t*15+i*69)%260);bird(x,91+i*21+Math.sin(t*2+i)*5,.7);}ctx.restore();ctx.fillStyle='#faf4e8';ctx.fillRect(169,38,8,195);ctx.fillRect(64,135,222,8);box(43,233,265,13,3,'#e1d3bc');ctx.fillStyle='#fff8df55';poly([[80,43],[133,43],[254,230],[203,230]],'#ffffff22');
// Wall art, reading lamp, and corner pots.
box(488,40,101,120,3,'#c8a47d');box(494,46,89,108,1,'#f3ead9');ellipse(538,93,22,27,'#bc9a77');poly([[509,141],[539,96],[575,141]],'#829381');path(p=>{p.moveTo(646,184);p.lineTo(646,350)},'#927c63',5);poly([[621,151],[670,151],[686,197],[603,197]],'#e2b879');ellipse(646,352,26,5,'#a68e70');flowerpot(49,332,1.1);flowerpot(668,430,1.15,'leaves');
// Sofa background; cats on the cushion remain in front of it.
box(84,270,294,112,25,'#6f8c82');box(97,281,127,73,18,'#88a297');box(231,281,132,73,18,'#7d9a8e');box(101,344,261,34,12,'#9fb3a3');box(80,327,31,70,13,'#78958a');box(354,327,31,70,13,'#78958a');box(110,389,13,31,3,'#866b52');box(343,389,13,31,3,'#866b52');box(116,300,57,38,10,'#d9b98f');
ellipse(368,504,233,67,'#b7bba2');ellipse(368,504,219,56,'#cbd0b4');path(p=>{p.ellipse(368,504,202,47,0,0,Math.PI*2)},'#a8b193',2);
}
function cat(c,x,y,dir,pose,phase,scale=1){
const v=c.visit;
if(v&&t>=v.start){const slot=foodSlots[v.slot],age=t-v.start;
 if(v.leave){const q=Math.min(1,(t-v.leave)/3.2);x=v.leaveX+(x-v.leaveX)*q;y=v.leaveY+(y-v.leaveY)*q;dir=x>=v.leaveX?1:-1;pose='run';phase=t;}
 else if(age<v.duration){const q=age/v.duration;x=v.fromX+(slot.x-v.fromX)*q;y=v.fromY+(slot.y-v.fromY)*q;dir=slot.x>=v.fromX?1:-1;pose='run';phase=t;}
 else{x=slot.x;y=slot.y;dir=slot.dir;pose='eat';phase=t;}
 scale=.73;
}
c.x=x;c.y=y;c.scale=scale;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ellipse(0,6,37,7,'#574a3620');ctx.scale(dir,1);let belly=pose==='belly',sleep=pose==='sleep',run=pose==='run',jump=pose==='jump';if(belly){ctx.translate(0,-18);ctx.rotate(-Math.PI/2);}const gallop=pose==='gallop',pouncing=pose==='pounce';const beat=Math.sin(phase*18);let bounce=gallop?-Math.abs(beat)*11:run?Math.sin(phase*13)*2:0;ctx.translate(0,bounce);if(gallop)ctx.scale(1.08+beat*.13,.91-beat*.05);if(pouncing)ctx.scale(1.25,.8);if(pose==='crawl')ctx.scale(1,.38);const crouch=pose==='crouch';if(crouch){ctx.translate(0,-2);ctx.scale(1,.8);}
// Curving tail, elongated torso, four articulated paws.
path(p=>{p.moveTo(-26,-25);p.bezierCurveTo(-62,-20,-48,-67,-64,-60+Math.sin(t*2)*5)},c.fur,9);
const stride=run?Math.sin(phase*13)*12:0;
for(let i=0;i<4;i++){let xx=i<2?-20:17,off=gallop?(i<2?-1:1)*beat*21:pouncing?(i<2?-18:24):i%2?stride:-stride;const reach=(pose==='paw'||pose==='bat')&&i===3?Math.sin(Math.max(0,Math.min(1,phase))*Math.PI):0;const ex=xx+off+(jump?8:0)+reach*(pose==='bat'?40:26),ey=reach?-reach*(pose==='bat'?5:20):(gallop?-5-Math.max(0,-beat)*10:pouncing?-8:sleep?-6:0);path(p=>{p.moveTo(xx,-23);p.quadraticCurveTo(xx+off+reach*15,-12-reach*15,ex,ey)},i%2?c.fur:c.light,8);ellipse(ex,ey,6,3,c.fur);}
ellipse(-5,-28,sleep?33:32,sleep?15:19,c.fur);ellipse(1,-22,21,12,c.light);if(belly)ellipse(-4,-26,23,13,c.light);
let hx=sleep?18:25,hy=sleep?-29:-48;if(pose==='eat'&&v){const slot=foodSlots[v.slot];hx=(slot.mouthX-x)/(scale*dir)-4;hy=(slot.mouthY-y)/scale-13+Math.sin(t*5)*1.1;}ctx.save();ctx.translate(hx,hy);if(pose==='paw')ctx.rotate(-.06);
poly([[-18,-6],[-19,-27],[-3,-16]],c.fur);poly([[4,-17],[20,-26],[18,-4]],c.fur);poly([[-15,-11],[-16,-21],[-7,-15]],'#d9a1a0');poly([[9,-15],[17,-21],[16,-10]],'#d9a1a0');ellipse(0,0,22,19,c.fur);ellipse(5,8,14,9,c.light);
if(sleep||belly||pose==='eat'){path(p=>{p.moveTo(-12,0);p.quadraticCurveTo(-8,-3,-4,0);p.moveTo(6,0);p.quadraticCurveTo(10,-3,14,0)},'#34423b',1.8);}else{ellipse(-8,-1,4,5,'#c9cf9a');ellipse(11,-1,4,5,'#c9cf9a');ellipse(-7,-1,1.6,4,'#293b32');ellipse(12,-1,1.6,4,'#293b32');}
poly([[1,6],[7,6],[4,10]],'#bd8587');path(p=>{p.moveTo(4,10);p.lineTo(4,13);p.moveTo(4,13);p.quadraticCurveTo(0,16,-3,13);p.moveTo(4,13);p.quadraticCurveTo(8,16,11,13)},'#66564c',1);
for(let j=0;j<3;j++)path(p=>{p.moveTo(-10,8+j*3);p.lineTo(-28,5+j*6);p.moveTo(16,8+j*3);p.lineTo(33,5+j*6)},'#6a6256',.75);
for(let j=0;j<3;j++)path(p=>{p.moveTo(-9+j*8,-15);p.lineTo(-7+j*6,-9)},'#614b3944',2.8);ctx.restore();for(let j=0;j<3;j++)path(p=>{p.moveTo(-22+j*10,-42);p.lineTo(-18+j*10,-33)},'#614b3933',3);
ctx.restore();if(sleep){ctx.fillStyle='#7f8d80';ctx.font='13px Georgia';ctx.fillText('z',x+25,y-53-Math.sin(t)*3);ctx.font='17px Georgia';ctx.fillText('z',x+38,y-65-Math.sin(t)*3);}if(belly){ctx.fillStyle='#b97a87';ctx.font='23px Georgia';ctx.fillText('♥',x+10,y-65-Math.sin(t*3)*5);}}
function tableFront(){box(462,335,13,123,3,'#a38360');box(609,335,13,123,3,'#a38360');box(444,320,195,20,8,'#bf9b73');box(448,318,187,9,6,'#d9b68b');flowerpot(600,293,.55,'lavender');}
function pet(i){const c=cats[i];if(c.petUntil>t||c.visit)return;c.petUntil=t+4;msg.textContent=i===1?`${c.name} slips under the table. Shh…`:`${c.name}: a belly rub? Yes, please!`;render();}
function render(){if(!canvas.width)return;ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);background();drawFood();const phase=t%28;
// A cat jumps up, naps on the sofa, then jumps down and hides below it.
let x=0,y=0,pose='walk',sofaDir=-1;
if(phase<3){x=390-phase*35;y=438;pose='run';}
else if(phase<4.2){let q=(phase-3)/1.2;x=285-q*40;y=438-q*76-Math.sin(q*Math.PI)*100;pose='jump';}
else if(phase<12){x=245;y=357;pose='sleep';}
else if(phase<13.2){let q=(phase-12)/1.2;x=245+q*170;y=357+q*81-Math.sin(q*Math.PI)*70;pose='jump';sofaDir=1;}
else if(phase<14.5){let q=(phase-13.2)/1.3;x=415-q*25;y=438-q*22;pose='crawl';}
else if(phase<17){let q=(phase-14.5)/2.5;x=390-q*150;y=416;pose='crawl';}
else if(phase<23){x=240;y=416;pose='hidden';}
else if(phase<26){let q=(phase-23)/3;x=240+q*170;y=416;pose='crawl';sofaDir=1;}
else{let q=(phase-26)/2;x=410-q*20;y=416+q*22;pose='crawl';}
const underSofa=phase>=14.5&&phase<26&&!cats[2].visit;
if(underSofa){
  // The sofa is an opaque foreground object. Nothing may render through its upholstery.
  ctx.save();ctx.beginPath();ctx.rect(0,398,720,192);ctx.rect(385,0,335,590);ctx.clip();
  if(pose!=='hidden')cat(cats[2],x,y,sofaDir,'crawl',t,.87);
  else{cats[2].x=x;cats[2].y=y;}
  ctx.restore();
  // A pair of blinking eyes is the only visible detail during the hiding pause.
  if(pose==='hidden'&&(t%4)<3.7){ellipse(235,408,2.5,1.8,'#d4dbaf');ellipse(245,408,2.5,1.8,'#d4dbaf');}
}else cat(cats[2],x,y,sofaDir,cats[2].petUntil>t?'belly':pose,t,.87);
// Shy table cat: hops onto the top, then ducks into its shadow.
let q=t%19;let px=535,py=439,pp='sleep';if(q<6){py=317;pp='sleep';}else if(q<7.2){let z=(q-6)/1.2;px=535+z*110;py=317+z*128-Math.sin(z*Math.PI)*70;pp='jump';}else if(q<15){px=540;py=441;pp='sleep';}else if(q<16.2){let z=(q-15)/1.2;px=645-z*110;py=445-z*128-Math.sin(z*Math.PI)*85;pp='jump';}else{py=317;pp='sleep';}if(cats[1].petUntil>t){px=536;py=440;pp='sleep';}cat(cats[1],px,py,-1,pp,t,.8);tableFront();
// A quiet, asymmetric play invitation: crouch, one paw tap, retreat, pause, swap.
const cycle=t%14;let ax=186,bxFriend=291,ap='idle',bp='idle',tap=0;
if(cycle<2){ap='crouch';}
else if(cycle<3.2){ap='paw';tap=(cycle-2)/1.2;bxFriend+=Math.sin(tap*Math.PI/2)*14;}
else if(cycle<5){bxFriend+=14;bp='crouch';}
else if(cycle<7){bxFriend+=14*(1-(cycle-5)/2);}
else if(cycle<9){bp='crouch';}
else if(cycle<10.2){bp='paw';tap=(cycle-9)/1.2;ax-=Math.sin(tap*Math.PI/2)*14;}
else if(cycle<12){ax-=14;ap='crouch';}
else{ax-=14*(1-(cycle-12)/2);}
cat(cats[0],ax,488,1,cats[0].petUntil>t?'belly':ap,tap,.9);
cat(cats[3],bxFriend,490,-1,cats[3].petUntil>t?'belly':bp,tap,.87);
// A freely rolling ball receives an impulse only when Pip's paw reaches it.
ellipse(ball.x,ball.y+9,12,4,'#574a3620');ellipse(ball.x,ball.y,12,12,'#bd8a95');
path(p=>{p.arc(ball.x,ball.y,8,ball.spin,ball.spin+Math.PI*1.6)},'#edc4cb',2);
const ballPose=cats[5].petUntil>t?'belly':ballCat.mode==='bat'?'bat':ballCat.mode==='approach'?'run':'idle';
cat(cats[5],ballCat.x,ballCat.y,ballCat.dir,ballPose,ballCat.mode==='bat'?Math.min(1,(t-ballCat.started)):t,.75);
// Mouse keeps its own route while Bean independently chooses when to follow.
ctx.save();ctx.translate(mouse.x,mouse.y);ctx.scale(mouse.dir,1);
path(p=>{p.moveTo(-10,0);p.bezierCurveTo(-27,-8+Math.sin(t*9)*3,-24,12,-35,5)},'#bba092',1.6);
ellipse(0,0,11,6,'#9b9690');ellipse(5,-6,4,4,'#c9b0aa');ellipse(10,0,1.3,1.3,'#3c403b');ctx.restore();
cat(cats[4],hunter.x,hunter.y-(hunter.lift||0),hunter.dir,cats[4].petUntil>t?'belly':hunter.pose,t,.8);

drawFoodRim();
}
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;canvas.style.cursor=(Math.hypot((x-78)/1.6,y-550)<42)||cats.some(c=>Math.abs(c.x-x)<44&&Math.abs(c.y-30-y)<38)?'pointer':'default';if(e.pointerType==='mouse'){const i=cats.findIndex(c=>Math.abs(c.x-x)<38&&Math.abs(c.y-30-y)<32);if(i>=0&&(!cats[i].petUntil||t>cats[i].petUntil+2))pet(i);}});
canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;if(x>12&&x<145&&y>525){refill();return;}const i=cats.findIndex(c=>Math.abs(c.x-x)<48&&Math.abs(c.y-30-y)<45);if(i>=0)pet(i);});document.querySelectorAll('[data-pet]').forEach(b=>b.addEventListener('click',()=>pet(+b.dataset.pet)));
function pauseUI(){pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-pressed',String(paused));}pause.addEventListener('click',()=>{paused=!paused;pauseUI();});document.getElementById('food-refill').addEventListener('click',refill);pauseUI();function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;if(!paused){t+=dt;updateFeeding(dt);updateChase(dt);updateBall(dt);}last=now;render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
