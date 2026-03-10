const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');

function resize(){
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const STAR_COUNT = 2500;
const stars = [];

function createStar(){
const typeRoll = Math.random();

let speed,size,trail;

if(typeRoll<0.55){
speed=Math.random()*0.3+0.1;
size=Math.random()*1.2+0.3;
trail=false;
}else if(typeRoll<0.8){
speed=Math.random()*0.8+0.4;
size=Math.random()*1.8+0.8;
trail=false;
}else if(typeRoll<0.95){
speed=Math.random()*0.4+0.2;
size=Math.random()*2.5+2;
trail=false;
}else{
speed=Math.random()*4+3;
size=Math.random()*1.5+1;
trail=true;
}

return{
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
speed,
size,
trail,
alpha:Math.random()*0.8+0.2
};
}

for(let i=0;i<STAR_COUNT;i++){
stars.push(createStar());
}

function animateStars(){

ctx.clearRect(0,0,canvas.width,canvas.height);

stars.forEach(star=>{

ctx.globalAlpha=star.alpha;
ctx.fillStyle='#f59e0b';

if(star.trail){
ctx.strokeStyle='rgba(245,158,11,0.5)';
ctx.lineWidth=star.size;

ctx.beginPath();
ctx.moveTo(star.x,star.y);
ctx.lineTo(star.x-star.speed*6,star.y);
ctx.stroke();
}

ctx.beginPath();
ctx.arc(star.x,star.y,star.size,0,Math.PI*2);
ctx.fill();

star.x+=star.speed;

if(star.x>canvas.width+50){
Object.assign(star,createStar(),{x:-50});
}

});

requestAnimationFrame(animateStars);
}

animateStars();



function openGame(url){

    const win = window.open("about:blank","_blank");
    
    const title = "about:blank";
    
    win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
    <title>${title}</title>
    <style>
    
    html,body{
    margin:0;
    padding:0;
    height:100%;
    background:black;
    overflow:hidden;
    }
    
    iframe{
    border:none;
    width:100%;
    height:100%;
    }
    
    </style>
    </head>
    
    <body>
    
    <iframe src="${url}" allowfullscreen></iframe>
    
    </body>
    </html>
    `);
    
    win.document.close();
    
    }

const searchInput = document.getElementById("searchInput");
const cards = document.querySelectorAll(".game-card");


function levenshtein(a,b){

const matrix=[];

for(let i=0;i<=b.length;i++){
matrix[i]=[i];
}

for(let j=0;j<=a.length;j++){
matrix[0][j]=j;
}

for(let i=1;i<=b.length;i++){
for(let j=1;j<=a.length;j++){

if(b.charAt(i-1)==a.charAt(j-1)){
matrix[i][j]=matrix[i-1][j-1];
}else{
matrix[i][j]=Math.min(
matrix[i-1][j-1]+1,
matrix[i][j-1]+1,
matrix[i-1][j]+1
);
}

}
}

return matrix[b.length][a.length];
}



searchInput.addEventListener("input",()=>{

const query = searchInput.value.toLowerCase().trim();

cards.forEach(card=>{

const name = card.dataset.name;

if(!query){
card.style.display="block";
return;
}

if(name.includes(query)){
card.style.display="block";
return;
}

const distance = levenshtein(query,name.slice(0,query.length));

if(distance<=2){
card.style.display="block";
}else{
card.style.display="none";
}

});

});