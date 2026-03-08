/* =========================================================
   DesignTech VLSI Website Animations
   File: animations.js

   Contains:
   1. Starfield background animation
   2. Chip signal animation (hero section)
   3. Signal processing flow animation
   4. 3D sine wave animation
   5. Rotating silicon wafer animation

   Author: Harsh Raj Thakur
   Website: DesignTech VLSI
========================================================= */


/* =========================================================
   1. STAR BACKGROUND ANIMATION
========================================================= */

const starCanvas = document.getElementById("starfield");

if(starCanvas){

const ctxStar = starCanvas.getContext("2d");

function resizeStars(){
starCanvas.width = window.innerWidth;
starCanvas.height = window.innerHeight;
}

resizeStars();
window.addEventListener("resize", resizeStars);

let stars = [];

for(let i=0;i<200;i++){
stars.push({
x:Math.random()*starCanvas.width,
y:Math.random()*starCanvas.height,
size:Math.random()*2,
speed:Math.random()*0.5+0.2
});
}

function animateStars(){

ctxStar.clearRect(0,0,starCanvas.width,starCanvas.height);

stars.forEach(star=>{

star.y += star.speed;

if(star.y > starCanvas.height){
star.y = 0;
star.x = Math.random()*starCanvas.width;
}

ctxStar.fillStyle="white";
ctxStar.fillRect(star.x,star.y,star.size,star.size);

});

requestAnimationFrame(animateStars);

}

animateStars();

}



/* =========================================================
   2. CHIP SIGNAL ANIMATION (HERO)
========================================================= */

const chipCanvas = document.getElementById("chipAnimation");

if(chipCanvas){

const ctxChip = chipCanvas.getContext("2d");

chipCanvas.width = 260;
chipCanvas.height = 260;

let pulses = [];

for(let i=0;i<12;i++){

pulses.push({
x:Math.random()*200+30,
y:Math.random()*200+30,
dir:Math.random()*4
});

}

function drawChip(){

ctxChip.clearRect(0,0,chipCanvas.width,chipCanvas.height);

/* chip body */

ctxChip.fillStyle="#0f172a";
ctxChip.fillRect(30,30,200,200);

ctxChip.strokeStyle="#38bdf8";
ctxChip.lineWidth=3;
ctxChip.strokeRect(30,30,200,200);

/* grid */

ctxChip.strokeStyle="#334155";

for(let i=50;i<230;i+=30){

ctxChip.beginPath();
ctxChip.moveTo(i,30);
ctxChip.lineTo(i,230);
ctxChip.stroke();

ctxChip.beginPath();
ctxChip.moveTo(30,i);
ctxChip.lineTo(230,i);
ctxChip.stroke();

}

/* pulses */

pulses.forEach(p=>{

ctxChip.beginPath();
ctxChip.arc(p.x,p.y,4,0,Math.PI*2);
ctxChip.fillStyle="#22c55e";
ctxChip.fill();

if(p.dir<1) p.x+=1;
else if(p.dir<2) p.x-=1;
else if(p.dir<3) p.y+=1;
else p.y-=1;

if(p.x<35||p.x>225||p.y<35||p.y>225){
p.dir=Math.random()*4;
}

});

requestAnimationFrame(drawChip);

}

drawChip();

}



/* =========================================================
   3. SIGNAL FLOW ANIMATION (FOUNDER SECTION)
========================================================= */

const flowCanvas = document.getElementById("signalFlow");

if(flowCanvas){

const ctxFlow = flowCanvas.getContext("2d");

flowCanvas.width = 1000;
flowCanvas.height = 260;

let shift = 0;

function drawFlow(){

ctxFlow.clearRect(0,0,flowCanvas.width,flowCanvas.height);

let center = flowCanvas.height/2;

/* axis */

ctxFlow.beginPath();
ctxFlow.moveTo(0,center);
ctxFlow.lineTo(flowCanvas.width,center);
ctxFlow.strokeStyle="#555";
ctxFlow.stroke();

/* sine signal */

ctxFlow.beginPath();

for(let x=0;x<200;x++){

let y=center-Math.sin((x+shift)/25)*30;
ctxFlow.lineTo(x+50,y);

}

ctxFlow.strokeStyle="#38bdf8";
ctxFlow.lineWidth=2;
ctxFlow.stroke();

/* arrow */

ctxFlow.font="30px Arial";
ctxFlow.fillStyle="white";
ctxFlow.fillText("→",270,center+10);

/* sampled points */

for(let x=0;x<200;x+=20){

let y=center-Math.sin((x+shift)/25)*30;

ctxFlow.beginPath();
ctxFlow.arc(x+320,y,4,0,Math.PI*2);
ctxFlow.fillStyle="yellow";
ctxFlow.fill();

}

/* arrow */

ctxFlow.fillText("→",540,center+10);

/* reconstructed signal */

ctxFlow.beginPath();

for(let x=0;x<200;x++){

let y=center-Math.sin((x+shift)/25)*30;
ctxFlow.lineTo(x+620,y);

}

ctxFlow.strokeStyle="#38bdf8";
ctxFlow.lineWidth=3;
ctxFlow.stroke();

shift+=1;

requestAnimationFrame(drawFlow);

}

drawFlow();

}



/* =========================================================
   4. 3D SINE WAVE ANIMATION
========================================================= */

const waveCanvas = document.getElementById("wave3d");

if(waveCanvas){

const ctxWave = waveCanvas.getContext("2d");

waveCanvas.width = 200;
waveCanvas.height = 200;

let phase = 0;

function drawWave(){

ctxWave.clearRect(0,0,200,200);

ctxWave.beginPath();

for(let x=0;x<200;x++){

let y = 100 + 40*Math.sin((x*0.05)+phase);
ctxWave.lineTo(x,y);

}

ctxWave.strokeStyle="#38bdf8";
ctxWave.lineWidth=3;
ctxWave.stroke();

phase += 0.05;

requestAnimationFrame(drawWave);

}

drawWave();

}



/* =========================================================
   5. ROTATING SILICON WAFER
========================================================= */

const waferCanvas = document.getElementById("wafer3d");

if(waferCanvas){

const ctxWafer = waferCanvas.getContext("2d");

waferCanvas.width = 200;
waferCanvas.height = 200;

let angle = 0;

function drawWafer(){

ctxWafer.clearRect(0,0,200,200);

ctxWafer.save();

ctxWafer.translate(100,100);
ctxWafer.rotate(angle);

/* wafer */

ctxWafer.beginPath();
ctxWafer.arc(0,0,80,0,Math.PI*2);
ctxWafer.strokeStyle="#38bdf8";
ctxWafer.lineWidth=3;
ctxWafer.stroke();

/* dies */

for(let x=-60;x<=60;x+=30){
for(let y=-60;y<=60;y+=30){

ctxWafer.strokeRect(x,y,20,20);

}
}

ctxWafer.restore();

angle += 0.01;

requestAnimationFrame(drawWafer);

}

drawWafer();

}
