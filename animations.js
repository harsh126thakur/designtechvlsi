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
   signal flow
===================================== */

const canvas = document.getElementById("signalFlow");

if(canvas){

const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 260;

let shift = 0;

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height);

let center = canvas.height/2;

/* axis */

ctx.beginPath();
ctx.moveTo(0,center);
ctx.lineTo(canvas.width,center);
ctx.strokeStyle="#555";
ctx.stroke();


/* SIN SIGNAL */

ctx.beginPath();

for(let x=0;x<200;x++){

let y = center - Math.sin((x+shift)/25)*30;

ctx.lineTo(x+50,y);

}

ctx.strokeStyle="#38bdf8";
ctx.lineWidth=2;
ctx.stroke();


/* ARROW */

ctx.font="30px Arial";
ctx.fillStyle="white";
ctx.fillText("→",270,center+10);


/* SAMPLED SIGNAL */

for(let x=0;x<200;x+=20){

let y = center - Math.sin((x+shift)/25)*30;

ctx.beginPath();
ctx.arc(x+320,y,4,0,2*Math.PI);
ctx.fillStyle="yellow";
ctx.fill();

}


/* ARROW */

ctx.fillText("→",540,center+10);


/* RECONSTRUCTED SIGNAL */

ctx.beginPath();

for(let x=0;x<200;x++){

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
