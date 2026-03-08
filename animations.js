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

/* ==========================================
   SIN CONVOLUTION WITH IMPULSE TRAIN
========================================== */

const convCanvas = document.getElementById("convCanvas");

if(convCanvas){

const ctx = convCanvas.getContext("2d");

convCanvas.width = 900;
convCanvas.height = 420;

let shift = 0;
const T = 120;

function draw(){

ctx.clearRect(0,0,convCanvas.width,convCanvas.height);

/* vertical positions */
let ySin = 90;
let yImpulse = 210;
let yResult = 340;

/* ---------- SIN SIGNAL ---------- */

ctx.beginPath();

for(let x=0;x<convCanvas.width;x++){

let y = ySin - Math.sin((x+shift)/40)*25;
ctx.lineTo(x,y);

}

ctx.strokeStyle="#38bdf8";
ctx.lineWidth=2;
ctx.stroke();



/* ---------- IMPULSE TRAIN ---------- */

for(let n=0;n<convCanvas.width;n+=T){

ctx.beginPath();
ctx.moveTo(n,yImpulse);
ctx.lineTo(n,yImpulse-60);
ctx.strokeStyle="yellow";
ctx.lineWidth=2;
ctx.stroke();

}



/* ---------- CONVOLUTION RESULT ---------- */

ctx.beginPath();

for(let x=0;x<convCanvas.width;x++){

let sum = 0;

for(let n=-5;n<5;n++){

let t = (x - n*T - shift)/40;
sum += Math.sin(t);

}

let y = yResult - sum*20;

ctx.lineTo(x,y);

}

ctx.strokeStyle="#38bdf8";
ctx.lineWidth=3;
ctx.stroke();



/* ---------- SYMBOLS ---------- */

ctx.font="38px Poppins";
ctx.fillStyle="white";

ctx.fillText("*",convCanvas.width/2-10,150);
ctx.fillText("=",convCanvas.width/2-10,285);



shift += 1;

requestAnimationFrame(draw);

}

draw();

}
