/* =================================================
   STAR BACKGROUND
================================================= */

const starCanvas = document.getElementById("starfield");

if(starCanvas){

const ctx = starCanvas.getContext("2d");

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

ctx.clearRect(0,0,starCanvas.width,starCanvas.height);

stars.forEach(star=>{

star.y += 0.3;

if(star.y > starCanvas.height) star.y = 0;

ctx.fillStyle="white";
ctx.fillRect(star.x,star.y,star.size,star.size);

});

requestAnimationFrame(animateStars);

}

animateStars();

}


/* =================================================
   SIN WAVE
================================================= */

const sineCanvas = document.getElementById("sineWave");

if(sineCanvas){

const ctx = sineCanvas.getContext("2d");

sineCanvas.width = 600;
sineCanvas.height = 200;

let t = 0;

function drawSine(){

ctx.clearRect(0,0,sineCanvas.width,sineCanvas.height);

ctx.beginPath();

for(let x=0;x<sineCanvas.width;x++){

let y = 100 + 40*Math.sin(x*0.02 + t);

ctx.lineTo(x,y);

}

ctx.strokeStyle="#38bdf8";
ctx.lineWidth=3;
ctx.stroke();

t += 0.05;

requestAnimationFrame(drawSine);

}

drawSine();

}


/* =================================================
   SINC FUNCTION
================================================= */

const sincCanvas = document.getElementById("sincWave");

if(sincCanvas){

const ctx = sincCanvas.getContext("2d");

sincCanvas.width = 900;
sincCanvas.height = 300;

let shift = 0;

function drawSinc(){

ctx.clearRect(0,0,sincCanvas.width,sincCanvas.height);

let cx = sincCanvas.width/2;
let cy = sincCanvas.height/2;

ctx.beginPath();

for(let x=-cx;x<cx;x++){

let t = x/40 + shift;

let y = (t===0)?1:Math.sin(t)/t;

let px = cx + x;
let py = cy - y*120;

ctx.lineTo(px,py);

}

ctx.strokeStyle="#38bdf8";
ctx.lineWidth=3;
ctx.stroke();

shift += 0.02;

requestAnimationFrame(drawSinc);

}

drawSinc();

}


/* =================================================
   THREE PHASE SIGNAL (RYB)
================================================= */

const phaseCanvas = document.getElementById("threePhaseWave");

if(phaseCanvas){

const ctx = phaseCanvas.getContext("2d");

phaseCanvas.width = 700;
phaseCanvas.height = 250;

let phase = 0;

function drawThreePhase(){

ctx.clearRect(0,0,phaseCanvas.width,phaseCanvas.height);

let center = phaseCanvas.height/2;

function drawWave(offset,color){

ctx.beginPath();

for(let x=0;x<phaseCanvas.width;x++){

let y = center + 60*Math.sin(x*0.02 + phase + offset);

ctx.lineTo(x,y);

}

ctx.strokeStyle=color;
ctx.lineWidth=2;
ctx.stroke();

}

drawWave(0,"red");
drawWave(2*Math.PI/3,"yellow");
drawWave(4*Math.PI/3,"#38bdf8");

phase += 0.05;

requestAnimationFrame(drawThreePhase);

}

drawThreePhase();

}

/* =====================================
   SIN CONVOLVED WITH IMPULSE TRAIN
===================================== */

const convCanvas = document.getElementById("convCanvas");

if(convCanvas){

const ctx = convCanvas.getContext("2d");

convCanvas.width = 900;
convCanvas.height = 260;

let shift = 0;

/* impulse train spacing */

const T = 120;

function drawConv(){

ctx.clearRect(0,0,convCanvas.width,convCanvas.height);

let center = convCanvas.height/2;

/* AXIS */

ctx.beginPath();
ctx.moveTo(0,center);
ctx.lineTo(convCanvas.width,center);
ctx.strokeStyle="#444";
ctx.stroke();

/* RESULT SIGNAL */

ctx.beginPath();

for(let x=0;x<convCanvas.width;x++){

let sum = 0;

/* impulse train convolution */

for(let n=-5;n<5;n++){

let t = (x - shift - n*T)/40;

sum += Math.sin(t);

}

let y = center - sum*25;

ctx.lineTo(x,y);

}

ctx.strokeStyle="#38bdf8";
ctx.lineWidth=3;
ctx.stroke();

/* animate */

shift += 0.5;

requestAnimationFrame(drawConv);

}

drawConv();

}
