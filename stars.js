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
