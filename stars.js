const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];

for(let i=0;i<200;i++){

stars.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
size:Math.random()*2,
speed:Math.random()*0.4
});

}

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height);

stars.forEach(star=>{

star.y += star.speed;

if(star.y>canvas.height){

star.y=0;

}

ctx.fillStyle="white";

ctx.fillRect(star.x,star.y,star.size,star.size);

});

requestAnimationFrame(animate);

}

animate();
const waveCanvas = document.getElementById("sineWave");
const waveCtx = waveCanvas.getContext("2d");

let t = 0;

function drawWave(){

waveCtx.clearRect(0,0,waveCanvas.width,waveCanvas.height);

waveCtx.beginPath();

for(let x=0; x<waveCanvas.width; x++){

let y = 100 + 40 * Math.sin((x * 0.02) + t);

waveCtx.lineTo(x,y);

}

waveCtx.strokeStyle = "#38bdf8";
waveCtx.lineWidth = 3;
waveCtx.stroke();

t += 0.05;

requestAnimationFrame(drawWave);

}

drawWave();
const canvasWave = document.getElementById("threePhaseWave");
const ctxWave = canvasWave.getContext("2d");

canvasWave.width = 600;
canvasWave.height = 220;

let phase = 0;

function drawThreePhase(){

ctxWave.clearRect(0,0,canvasWave.width,canvasWave.height);

let amplitude = 50;
let frequency = 0.02;
let center = canvasWave.height/2;

/* R phase (Red) */

ctxWave.beginPath();
for(let x=0; x<canvasWave.width; x++){

let y = center + amplitude * Math.sin((x*frequency)+phase);
ctxWave.lineTo(x,y);

}
ctxWave.strokeStyle="red";
ctxWave.lineWidth=3;
ctxWave.stroke();


/* Y phase (Yellow) */

ctxWave.beginPath();
for(let x=0; x<canvasWave.width; x++){

let y = center + amplitude * Math.sin((x*frequency)+phase + (2*Math.PI/3));
ctxWave.lineTo(x,y);

}
ctxWave.strokeStyle="yellow";
ctxWave.lineWidth=3;
ctxWave.stroke();


/* B phase (Blue) */

ctxWave.beginPath();
for(let x=0; x<canvasWave.width; x++){

let y = center + amplitude * Math.sin((x*frequency)+phase + (4*Math.PI/3));
ctxWave.lineTo(x,y);

}
ctxWave.strokeStyle="#38bdf8";
ctxWave.lineWidth=3;
ctxWave.stroke();

phase += 0.05;

requestAnimationFrame(drawThreePhase);

}

drawThreePhase();

const convCanvas = document.getElementById("convCanvas");

if(convCanvas){

const ctx = convCanvas.getContext("2d");

convCanvas.width = 900;
convCanvas.height = 350;

let shift = -200;

function rect(x){
return (Math.abs(x) < 40) ? 1 : 0;
}

function draw(){

ctx.clearRect(0,0,convCanvas.width,convCanvas.height);

let centerY = convCanvas.height/2;

/* AXIS */

ctx.beginPath();
ctx.moveTo(0,centerY);
ctx.lineTo(convCanvas.width,centerY);
ctx.strokeStyle="#888";
ctx.stroke();

/* SIGNAL f(t) */

ctx.beginPath();
for(let x=0;x<convCanvas.width;x++){

let t = x-200;
let y = rect(t)*60;

ctx.lineTo(x,centerY-y);
}

ctx.strokeStyle="red";
ctx.lineWidth=2;
ctx.stroke();


/* SIGNAL g(t-τ) */

ctx.beginPath();
for(let x=0;x<convCanvas.width;x++){

let t = x-shift;
let y = rect(t)*60;

ctx.lineTo(x,centerY+120-y);
}

ctx.strokeStyle="yellow";
ctx.lineWidth=2;
ctx.stroke();


/* CONVOLUTION RESULT */

ctx.beginPath();

for(let x=0;x<convCanvas.width;x++){

let sum = 0;

for(let k=-50;k<50;k++){
sum += rect(k)*rect(x-k-shift);
}

ctx.lineTo(x, centerY+200 - sum*1.5);

}

ctx.strokeStyle="#38bdf8";
ctx.lineWidth=3;
ctx.stroke();

shift += 1;

if(shift > 400) shift = -200;

requestAnimationFrame(draw);

}

draw();

}

