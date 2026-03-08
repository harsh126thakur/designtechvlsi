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
/* =====================================
   HORIZONTAL CONVOLUTION FLOW
===================================== */

const convCanvas = document.getElementById("convCanvas");

if(convCanvas){

const ctx = convCanvas.getContext("2d");

convCanvas.width = 1000;
convCanvas.height = 260;

let shift = 0;

function draw(){

ctx.clearRect(0,0,convCanvas.width,convCanvas.height);

let center = convCanvas.height/2;

/* AXIS */

ctx.beginPath();
ctx.moveTo(0,center);
ctx.lineTo(convCanvas.width,center);
ctx.strokeStyle="#555";
ctx.stroke();

/* ---------- SIN SIGNAL (LEFT) ---------- */

ctx.beginPath();

for(let x=0;x<250;x++){

let y = center - Math.sin((x+shift)/25)*30;

ctx.lineTo(x+50,y);

}

ctx.strokeStyle="#38bdf8";
ctx.lineWidth=2;
ctx.stroke();



/* ---------- CONVOLUTION SYMBOL ---------- */

ctx.font="40px Poppins";
ctx.fillStyle="white";
ctx.fillText("*",320,center+10);



/* ---------- IMPULSE TRAIN ---------- */

for(let n=360;n<520;n+=30){

ctx.beginPath();
ctx.moveTo(n,center);
ctx.lineTo(n,center-60);
ctx.strokeStyle="yellow";
ctx.lineWidth=2;
ctx.stroke();

}



/* ---------- EQUAL SYMBOL ---------- */

ctx.fillText("=",560,center+10);



/* ---------- RESULT SIGNAL ---------- */

ctx.beginPath();

for(let x=0;x<250;x++){

let y = center - Math.sin((x+shift)/25)*30;

ctx.lineTo(x+620,y);

}

ctx.strokeStyle="#38bdf8";
ctx.lineWidth=3;
ctx.stroke();



shift += 1;

requestAnimationFrame(draw);

}

draw();

}

}
