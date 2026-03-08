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
