/* =================================================
   STAR BACKGROUND
================================================= */

const starCanvas = document.getElementById("starfield");

if(starCanvas){

const ctxStar = starCanvas.getContext("2d");

starCanvas.width = window.innerWidth;
starCanvas.height = window.innerHeight;

let stars = [];

for(let i=0;i<200;i++){
stars.push({
x:Math.random()*starCanvas.width,
y:Math.random()*starCanvas.height,
size:Math.random()*2
});
}

function animateStars(){

ctxStar.clearRect(0,0,starCanvas.width,starCanvas.height);

stars.forEach(star=>{

star.y += 0.3;

if(star.y > starCanvas.height) star.y = 0;

ctxStar.fillStyle="white";
ctxStar.fillRect(star.x,star.y,star.size,star.size);

});

requestAnimationFrame(animateStars);

}

animateStars();

}


/* ==========================================
   CHIP SIGNAL ANIMATION
========================================== */

const chipCanvas = document.getElementById("chipAnimation");

if(chipCanvas){

const ctxChip = chipCanvas.getContext("2d");

chipCanvas.width = 260;
chipCanvas.height = 260;

let pulses = [];

for(let i=0;i<10;i++){

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

/* grid inside chip */

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

/* move pulse */

if(p.dir<1) p.x+=1;
else if(p.dir<2) p.x-=1;
else if(p.dir<3) p.y+=1;
else p.y-=1;

/* bounce */

if(p.x<35||p.x>225||p.y<35||p.y>225){
p.dir=Math.random()*4;
}

});

requestAnimationFrame(drawChip);

}

drawChip();

}


/* =====================================
   SIGNAL FLOW ANIMATION
===================================== */

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


/* SIN SIGNAL */

ctxFlow.beginPath();

for(let x=0;x<200;x++){

let y = center - Math.sin((x+shift)/25)*30;

ctxFlow.lineTo(x+50,y);

}

ctxFlow.strokeStyle="#38bdf8";
ctxFlow.lineWidth=2;
ctxFlow.stroke();


/* ARROW */

ctxFlow.font="30px Arial";
ctxFlow.fillStyle="white";
ctxFlow.fillText("→",270,center+10);


/* SAMPLED SIGNAL */

for(let x=0;x<200;x+=20){

let y = center - Math.sin((x+shift)/25)*30;

ctxFlow.beginPath();
ctxFlow.arc(x+320,y,4,0,2*Math.PI);
ctxFlow.fillStyle="yellow";
ctxFlow.fill();

}


/* ARROW */

ctxFlow.fillText("→",540,center+10);


/* RECONSTRUCTED SIGNAL */

ctxFlow.beginPath();

for(let x=0;x<200;x++){

let y = center - Math.sin((x+shift)/25)*30;

ctxFlow.lineTo(x+620,y);

}

ctxFlow.strokeStyle="#38bdf8";
ctxFlow.lineWidth=3;
ctxFlow.stroke();


shift += 1;

requestAnimationFrame(drawFlow);

}

drawFlow();

}
