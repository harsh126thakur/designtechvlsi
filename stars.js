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
