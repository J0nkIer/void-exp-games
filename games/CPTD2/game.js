const towerTypes = {
    "Gunner": { name: "Gunner", cost: 30, range: 120, damage: 10, fireRate: 40, color: "rgb(98, 192, 156)", description:"Short Range" },
    "Sniper": { name: "Sniper", cost: 60, range: 300, damage: 40, fireRate: 100, color: "rgb(17, 78, 32)", description:"Long Range" },
    "Mini-Gun": { name: "Mini-Gun", cost: 50, range: 150, damage: 5, fireRate: 5, color: "rgb(121, 36, 36)", description:"Medium Range, Very Fast Fire" },
    "Medic": { name: "Medic", cost: 45, range: 120, damage: 0, fireRate: 0, color: "rgb(255, 253, 134)", description:"Boosts nearby towers by 25%" },
    "Scout": { name: "Scout", cost: 100, range: 200, damage: 15, fireRate: 30, color: "rgb(126, 98, 192)", description:"Follows enemies for 1 second" },
    "King": { name: "King", cost: 75, range: 130, damage: 5, fireRate: 50, color: "rgb(255, 166, 0)", description:"Slows enemies in range" },
    "Wizard": { name: "Wizard", cost: 110, range: 180, damage: 25, fireRate: 60, color: "rgb(130, 194, 255)", description:"Casts fire/freeze spells" },
    "Bomber": { name: "Bomber", cost: 135, range: 160, damage: 50, fireRate: 120, color: "rgb(196, 72, 0)", description:"AOE damage, slow fire rate" },
    "Musket": { name: "Musket", cost: 35, range: 200, damage: 30, fireRate: 80, color: "rgb(102, 73, 30)", description:"High-medium damage, long fire rate" },
    "Farmer": { name: "Farmer", cost: 190, range: 0, damage: 0, fireRate: 0, color: "rgb(238, 255, 0)", description:"Gains 15 extra gold per wave" },
    "Executioner": { name: "Executioner", cost: 200, range: 100, damage: 85, fireRate: 150, color: "rgb(78, 2, 2)", description:"Highest damage, 0.5% execute chance, short range" },
    "Bandit": { name: "Bandit", cost: 95, range: 140, damage: 20, fireRate: 60, color: "rgb(75, 66, 92)", description:"Gains +5 gold per kill" },
    "Artificer": { name: "Artificer", cost: 250, range: 170, damage: 30, fireRate: 50, color: "rgb(172, 197, 138)", description:"Future: Artifacts with random effects" }
  };
  
  // ================= EVOLUTIONS =================
  const evolutions = {
    "Gunner": "Warbringer",
    "Medic": "Angel",
    "Sniper": "Railgunner",
    "King": "Tyrant",
    "Bomber": "Warhead",
    "Musket": "Founding Father",
    "Wizard": "Black Hole Summoner",
    "Mini-Gun": "Devastator",
    "Scout": "Phantom",
    "Farmer": "Tycoon",
    "Executioner": "Reaper",
    "Bandit": "Kingpin"
  };
  
  function checkEvolution(t){
    const total = t.upgrades.dmg + t.upgrades.range + t.upgrades.rate;
  
    if(total >= 10 && !t.evolved){
      t.evolved = true;
      t.evolutionName = evolutions[t.type] || t.type;
  
      t.abilityTimer = 0;
      t.secondaryTimer = 0;
      t.heat = 0;
      t.permaDamage = 0;
    }
  }
  
  // ================= SPRITES =================
  const sprites = {};
  
  const spriteFiles = [
    // Enemies
    {key:"Normal", file:"sprites/Normal.png"},
    {key:"Fast", file:"sprites/Fast.png"},
    {key:"Tank", file:"sprites/Tank.png"},
    {key:"Fire", file:"sprites/Fire.png"},
    {key:"Ice", file:"sprites/Icecube.png"},
    {key:"BlackHole", file:"sprites/BlackHole.png"},
  
    // Towers
    {key:"Sniper", file:"sprites/Sniper.png"},
    {key:"Bomber", file:"sprites/bomber.png"},
    {key:"Executioner", file:"sprites/executioner.png"},
    {key:"Farmer", file:"sprites/farmer.png"},
    {key:"Medic", file:"sprites/medic.png"},
    {key:"King", file:"sprites/king.png"},
    {key:"Wizard", file:"sprites/wizard.png"},
  
    // Trees
    {key:"tree1", file:"sprites/Christmastree.png"},
    {key:"tree2", file:"sprites/Grass.png"},
    {key:"tree3", file:"sprites/Pinetree.png"},
    {key:"tree4", file:"sprites/Shrub.png"},
    {key:"tree5", file:"sprites/tree.png"}
  ];
  
  spriteFiles.forEach(s=>{
    const img = new Image();
    img.src = s.file;
    sprites[s.key] = img;
  });
  
  let globalDifficulty = 1;
  let bossesKilled = 0;
  let decorations = [];
  
  
  const enemyTypes = {
    "Normal": { hp: 45, speed: 1, color: "white" },
  
    "Fast": { hp: 35, speed: 2, color: "yellow" },
  
    "Tank": { hp: 100, speed: 0.5, color: "grey" },
  
    "Fire": { 
      hp: 80, 
      speed: 1.0, 
      color: "red",
      onDeath: () => {
        // Slow all towers fire rate
        towers.forEach(t => t.fireRate += 15);
      }
    },
  
    "Ice": { 
      hp: 65, 
      speed: 1.0, 
      color: "cyan",
      onDeath: () => {
        // Stop all towers briefly
        towers.forEach(t => t.cooldown = 120);
      }
    },
  
    "BlackHole": {
      hp: 90,
      speed: 0.7,
      color: "black",
      onDeath: () => {
        // Swap random tower positions
        if(towers.length >= 2){
          const a = Math.floor(Math.random()*towers.length);
          let b = Math.floor(Math.random()*towers.length);
          if(a !== b){
            [towers[a].x, towers[b].x] = [towers[b].x, towers[a].x];
            [towers[a].y, towers[b].y] = [towers[b].y, towers[a].y];
          }
        }
      }
    },
  
    "Boss": {
      hp: 800,
      speed: 0.3,
      color: "purple",
      onDeath: () => {
        bossesKilled++;
        globalDifficulty *= 1.5; // exponential scaling
      }
    }
  };
  
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  
  let money = 150, lives = 20, wave = 0;
  let towers = [];
  let placingType = null;
  let sellMode = false;
  let selectedTower = null;
  let enemies = [];
  let projectiles = [];
  
  const moneyEl = document.getElementById('money');
  const livesEl = document.getElementById('lives');
  const waveEl = document.getElementById('wave');
  const towerListEl = document.getElementById('towerList');
  const infoEl = document.getElementById('info');
  const selectedTitle = document.getElementById('selectedTitle');
  const selectedStats = document.getElementById('selectedStats');
  
  const towerRadius = 12;
  const pathWidth = 80;
  const pathPoints = [
    {x:0,y:120},{x:160,y:120},{x:220,y:300},{x:380,y:300},{x:440,y:120},{x:620,y:120},{x:900,y:120}
  ];
  
  function generateDecorations(){
    const treeKeys = ["tree1","tree2","tree3","tree4","tree5"];
  
    for(let i=0;i<40;i++){
      let x = Math.random()*canvas.width;
      let y = Math.random()*canvas.height;
  
      if(!pointOnPath(x,y)){
        const type = treeKeys[Math.floor(Math.random()*treeKeys.length)];
        decorations.push({x,y,type});
      }
    }
  }
  
  let lastMouse = null;
  
  function updateUI(){
    moneyEl.textContent = 'Gold: ' + money;
    livesEl.textContent = 'Lives: ' + lives;
    waveEl.textContent = 'Wave: ' + wave;
    document.getElementById('sellMode').textContent = sellMode ? 'Sell Mode: ON' : 'Toggle Sell Mode';
    infoEl.textContent = placingType ? 'Placing: '+placingType+' (cost '+towerTypes[placingType].cost+')' : '';
    if(selectedTower==null){
      selectedTitle.textContent = 'No tower selected';
      selectedStats.textContent = '';
    } else {
      const t = towers[selectedTower];
      selectedTitle.textContent = t.evolved ? t.evolutionName : t.type;
      selectedStats.innerHTML = `Damage:${t.damage} Range:${t.range} Rate:${t.fireRate} Level:D${t.upgrades.dmg} R${t.upgrades.range} T${t.upgrades.rate}`;
    }
  }

  // GOLD glow
const goldCard = document.getElementById("goldCard");
goldCard.classList.remove("glow");

// LIVES warning
const livesCard = document.getElementById("livesCard");
if(lives <= 5){
  livesCard.classList.add("low");
} else {
  livesCard.classList.remove("low");
}

// Wave glow when active
const waveCard = document.getElementById("waveCard");
if(enemies.length > 0){
  waveCard.classList.add("active");
} else {
  waveCard.classList.remove("active");
}

// Disable start button if enemies alive
const startBtn = document.getElementById("startWave");
if(enemies.length > 0){
  startBtn.disabled = true;
  startBtn.style.opacity = 0.5;
} else {
  startBtn.disabled = false;
  startBtn.style.opacity = 1;
  startBtn.classList.add("pulse");
}
  
  function populateTowerList(){
    towerListEl.innerHTML = '';
    for(const key in towerTypes){
      const tt = towerTypes[key];
      const row = document.createElement('div');
      row.className='tower-btn row';
      row.innerHTML=`<div class="row"><div class="color-box" style="background:${tt.color}"></div><div>${tt.name}</div></div><div class="small">${tt.cost}g</div>`;
      row.onclick=()=>{ placingType=key; selectedTower=null; sellMode=false; updateUI(); };
      towerListEl.appendChild(row);
    }
  }
  
  // path detection
  function distToSegment(px,py, ax,ay,bx,by){
    const vx=bx-ax, vy=by-ay, wx=px-ax, wy=py-ay;
    const c1=vx*wx+vy*wy;
    if(c1<=0) return Math.hypot(px-ax, py-ay);
    const c2=vx*vx+vy*vy;
    if(c2<=c1) return Math.hypot(px-bx, py-by);
    const t=c1/c2;
    const projx=ax+t*vx, projy=ay+t*vy;
    return Math.hypot(px-projx, py-projy);
  }
  
  function pointOnPath(px,py){
    const threshold = pathWidth/2;
    for(let i=0;i<pathPoints.length-1;i++){
      if(distToSegment(px,py, pathPoints[i].x,pathPoints[i].y,pathPoints[i+1].x,pathPoints[i+1].y)<=threshold) return true;
    }
    return false;
  }
  
  // spawn enemies
  function spawnWave(){
    const types = Object.keys(enemyTypes);
  
    let swarmSize = Math.floor(10 * globalDifficulty);
  
    for(let i=0;i<swarmSize;i++){
  
      let type;
  
      if(wave % 15 === 0 && i === 0){
        type = "Boss";
      } else {
        type = types[Math.floor(Math.random()*(types.length-1))];
      }
  
      const base = enemyTypes[type];
  
      let hpScaled = base.hp * globalDifficulty;
      let speedScaled = base.speed * (1 + (globalDifficulty-1)*0.2);
  
      enemies.push({
        x:pathPoints[0].x,
        y:pathPoints[0].y,
        hp: enemyTypes[type].hp,
        maxHp: enemyTypes[type].hp,
        baseSpeed: enemyTypes[type].speed,
        speed: enemyTypes[type].speed,
        type:type,
        color:base.color,
        frozen:0,
        waypoint:1
      });
    }
  }
  
  // move enemies along path
  function updateEnemies(){
    for(let i=enemies.length-1;i>=0;i--){
      let e=enemies[i];
  
      // Reset speed every frame
      e.speed = e.baseSpeed;
  
      // King slow check
      for(const t of towers){
        if(t.type === "King"){
          const dx = e.x - t.x;
          const dy = e.y - t.y;
          if(Math.hypot(dx,dy) <= t.range){
            e.speed = e.baseSpeed * 0.5;
          }
        }
      }
  
      if(e.frozen>0){ e.frozen--; continue; }
  
      const target=pathPoints[e.waypoint];
      const dx=target.x-e.x, dy=target.y-e.y;
      const dist=Math.hypot(dx,dy);
  
      if(dist<e.speed){
        e.x=target.x; 
        e.y=target.y; 
        e.waypoint++; 
        if(e.waypoint>=pathPoints.length){
          enemies.splice(i,1); 
          lives--; 
          continue;
        }
      } else {
        e.x+=dx/dist*e.speed; 
        e.y+=dy/dist*e.speed;
      }
    }
  }
  
  
  // TOWER EFFECTS
  function applyTowerEffects() {
    // Reset effective stats first
    towers.forEach(t => {
      t.effectiveDamage = t.damage;
      t.effectiveFireRate = t.fireRate;
    });
  
    // Medic buffs nearby towers by 25%
    towers.forEach(m => {
      if (m.type === "Medic") {
        towers.forEach(t => {
          if (t === m) return;
          const dx = t.x - m.x, dy = t.y - m.y;
          if (Math.hypot(dx, dy) <= m.range) {
            t.effectiveDamage = Math.floor(t.effectiveDamage * 1.25);
            t.effectiveFireRate = Math.max(1, Math.floor(t.effectiveFireRate * 0.75));
          }
        });
      }
    });
  }
  
  // King slows enemies in range
  function applyKingSlow() {
    towers.forEach(k => {
      if (k.type === "King") {
        enemies.forEach(e => {
          const dx = e.x - k.x, dy = e.y - k.y;
          if (Math.hypot(dx, dy) <= k.range) {
            e.speed = Math.max(0.2, enemyTypes[e.type].speed * 0.5);
          }
        });
      }
    });
  }
  
  // Updated tower attack function
  function updateTowers() {
    applyTowerEffects();
  
    for(const t of towers){
  
      // ===== EVOLVED ABILITIES =====
      if(t.evolved){
        t.abilityTimer++;
  
        switch(t.evolutionName){
  
          case "Warbringer":
            if(t.abilityTimer >= 180){
              t.overdrive = 60;
              t.abilityTimer = 0;
            }
            if(t.overdrive > 0){
              t.overdrive--;
              t.effectiveFireRate = Math.max(1, t.effectiveFireRate * 0.8);
            }
          break;
  
          case "Angel":
            towers.forEach(other=>{
              if(other!==t){
                const d=Math.hypot(other.x-t.x,other.y-t.y);
                if(d<=t.range){
                  other.effectiveDamage*=1.5;
                  if(other.cooldown>60) other.cooldown=60;
                }
              }
            });
          break;
  
          case "Tyrant":
            if(t.abilityTimer>=1200){
              enemies.forEach(e=> e.frozen=90);
              t.abilityTimer=0;
            }
          break;
  
          case "Devastator":
            if(!t.cooldown || t.cooldown<=0){
              t.heat+=0.3;
              t.effectiveDamage+=t.heat;
              t.effectiveFireRate=Math.max(1,t.effectiveFireRate-0.3);
            } else {
              t.heat=0;
            }
          break;
  
          case "Phantom":
            t.executeThreshold=0.05;
          break;
  
          case "Reaper":
            t.bossExecute=0.10;
          break;
  
          case "Kingpin":
            t.goldBoost=0.10;
          break;
        }
      }
  
      // ===== NORMAL ATTACK LOGIC =====
      if(!t.cooldown) t.cooldown=0;
      t.cooldown--;
  
      if(t.cooldown>0) continue;
  
      let nearest=null, minDist=t.range;
      for(const e of enemies){
        const d=Math.hypot(e.x-t.x, e.y-t.y);
        if(d<minDist){ nearest=e; minDist=d; }
      }
  
      if(nearest){
        projectiles.push({
          x:t.x,
          y:t.y,
          target:nearest,
          damage:t.effectiveDamage + (t.permaDamage||0),
          speed:6,
          type:t.type,
          source:t
        });
  
        t.cooldown=t.effectiveFireRate;
      }
    }
  }
  
  // Updated projectiles for tower effects
  function updateProjectiles() {
    for(let i=projectiles.length-1;i>=0;i--){
      const p=projectiles[i];
      if(!enemies.includes(p.target)){ projectiles.splice(i,1); continue; }
      const dx=p.target.x-p.x, dy=p.target.y-p.y;
      const dist=Math.hypot(dx,dy);
      if(dist<p.speed){
        // HIT
        let target=p.target;
        target.hp -= p.damage;
  
        // Phantom execute
      if(p.source.executeThreshold){
      if(target.hp/target.maxHp <= p.source.executeThreshold){
      target.hp = 0;
       }
      }
  
      // Reaper boss execute
      if(p.source.bossExecute && target.type==="Boss"){
       if(target.hp/target.maxHp <= p.source.bossExecute){
      target.hp = 0;
       }
      }
  
        // Executioner execute chance
        if(p.type==="Executioner" && Math.random()<0.005) target.hp=0;
  
        // Wizard fire/ice effects
        if(p.type==="Wizard"){
          if(Math.random()<0.5) target.dot = 60;   // Fire DOT
          else target.frozen = 60;                // Ice freeze
        }
  
        // Enemy death
        if(target.hp <=0){
          const idx = enemies.indexOf(target);
          enemies.splice(idx,1);
          let goldGain = 10;
  
          towers.forEach(t=>{
              if(t.evolved && t.evolutionName==="Kingpin") goldGain *= 1.10;
          });
  
          money += Math.floor(goldGain);
  
          // Bandit bonus
          towers.forEach(t => { if(t.type==="Bandit") money+=5; });
  
          if(p.source.type==="Reaper"){
           p.source.permaDamage += 2;
          }
  
          // Fire/Ice/Boss death effects
          const deathFunc = enemyTypes[target.type].onDeath;
          if(deathFunc) deathFunc(towers, enemies, {money,lives});
        }
  
        projectiles.splice(i,1);
      } else {
        p.x += dx/dist*p.speed;
        p.y += dy/dist*p.speed;
      }
    }
  }
  
  // Farmer passive gold per wave
  function applyFarmerBonus(){
    towers.forEach(t=>{
      if(t.type==="Farmer") money+=15;
  
      if(t.type==="Tycoon"){
        money+=50;
        money+=Math.floor(money*0.05); // interest
      }
    });
  }
  
  // draw
  function drawPath(){
    ctx.lineWidth=pathWidth; ctx.lineJoin='round'; ctx.lineCap='round';
    ctx.strokeStyle='#9b7a4d'; ctx.beginPath(); ctx.moveTo(pathPoints[0].x,pathPoints[0].y);
    for(let i=1;i<pathPoints.length;i++) ctx.lineTo(pathPoints[i].x,pathPoints[i].y);
    ctx.stroke();
          // decorations (trees)
          for(const d of decorations){
          const sprite = sprites[d.type];
          if(sprite && sprite.complete){
          ctx.drawImage(sprite, d.x-20, d.y-20, 40, 40);
          }
          }
    ctx.lineWidth=4; ctx.strokeStyle='#3d2714'; ctx.beginPath(); ctx.moveTo(pathPoints[0].x,pathPoints[0].y);
    for(let i=1;i<pathPoints.length;i++) ctx.lineTo(pathPoints[i].x,pathPoints[i].y);
    ctx.stroke();
  }
  
  
  
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
  
    // grid
    ctx.strokeStyle='rgba(255,255,255,0.03)';
    for(let x=0;x<canvas.width;x+=30){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for(let y=0;y<canvas.height;y+=30){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
  
    drawPath();
  
    // towers
  for(let i=0;i<towers.length;i++){
    const t=towers[i];
    const sprite = sprites[t.type];
  
  // 🔥 Glow for evolved towers
  if(t.evolved){
    ctx.beginPath();
    ctx.arc(t.x, t.y, 26, 0, Math.PI*2);
    ctx.fillStyle = "rgba(255, 215, 0, 0.35)";
    ctx.fill();
  }
  
  if(sprite && sprite.complete){
    ctx.drawImage(sprite, t.x-20, t.y-20, 40, 40);
  } else {
    ctx.fillStyle=towerTypes[t.type].color;
    ctx.beginPath();
    ctx.arc(t.x,t.y,12,0,Math.PI*2);
    ctx.fill();
  }
   ctx.strokeStyle='#000'; ctx.stroke();
      if(i===selectedTower){ ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(t.x,t.y,t.range,0,Math.PI*2); ctx.stroke(); }
    }
  
    // enemies
  for(const e of enemies){
    const sprite = sprites[e.type];
    if(sprite && sprite.complete){
      ctx.drawImage(sprite, e.x-16, e.y-16, 32, 32);
    } else {
      ctx.fillStyle=e.color;
      ctx.beginPath(); ctx.arc(e.x,e.y,12,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#000'; ctx.stroke();
    }
// ===== HP TEXT DISPLAY =====
const maxHp = e.maxHp || enemyTypes[e.type].hp;
const hpPercent = Math.max(0, e.hp / maxHp);

// Color interpolation (black -> deep red)
const r = Math.floor(120 * (1 - hpPercent)); // red increases as hp drops
const g = 0;
const b = 0;

ctx.font = "12px Audiowide";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.lineWidth = 3;

// Outline for readability
ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
ctx.strokeText(`${Math.ceil(e.hp)}/${maxHp}`, e.x, e.y - 22);

// Fill color transitions to red
ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
ctx.fillText(`${Math.ceil(e.hp)}/${maxHp}`, e.x, e.y - 22);
  
    }
  
    // projectiles
    for(const p of projectiles){
      ctx.fillStyle='white'; ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill();
    }
  
    // Always show mouse circle
  if(lastMouse){
    ctx.beginPath();
    ctx.arc(lastMouse.x,lastMouse.y,6,0,Math.PI*2);
    ctx.fillStyle="rgba(255,255,255,0.6)";
    ctx.fill();
  }
  
  // Placement preview
  if(placingType && lastMouse){
    const x=lastMouse.x, y=lastMouse.y;
    const onPath=pointOnPath(x,y);
  
    // Range preview
    ctx.beginPath();
    ctx.arc(x,y,towerTypes[placingType].range,0,Math.PI*2);
    ctx.strokeStyle="rgba(255,255,255,0.2)";
    ctx.stroke();
  
    const sprite = sprites[placingType];
  
    ctx.globalAlpha=0.8;
  
    if(sprite && sprite.complete){
      ctx.drawImage(sprite,x-20,y-20,40,40);
    } else {
      ctx.fillStyle=towerTypes[placingType].color;
      ctx.beginPath();
      ctx.arc(x,y,12,0,Math.PI*2);
      ctx.fill();
    }
  
    ctx.globalAlpha=1;
  
    if(onPath){
      ctx.fillStyle="rgba(255,0,0,0.6)";
      ctx.fillRect(x-20,y-30,40,6);
    }
  }
  
    requestAnimationFrame(draw);
  }
  
  // game loop
  function gameLoop(){
    if(lives<=0){ alert('Game Over!'); return; }
    updateEnemies();
    updateTowers();
    updateProjectiles();
    updateUI();
    setTimeout(gameLoop,16);
  }
  
  // events
  canvas.addEventListener('click', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX-rect.left, y = e.clientY-rect.top;
    for(let i=0;i<towers.length;i++){
      const t=towers[i];
      if(Math.hypot(x-t.x,y-t.y)<=18){
        if(sellMode){
          const refund=Math.floor(towerTypes[t.type].cost*0.5*(1+t.upgrades.dmg+t.upgrades.range+t.upgrades.rate));
          money+=refund; towers.splice(i,1); selectedTower=null; updateUI(); return;
        } else { selectedTower=i; placingType=null; updateUI(); return; }
      }
    }
    if(placingType){
      if(pointOnPath(x,y)){
        infoEl.textContent='Cannot place on path'; setTimeout(updateUI,900); return;
      }
      const cost = towerTypes[placingType].cost;
      if(money>=cost){
        money-=cost;
        towers.push({x,y,type:placingType,upgrades:{dmg:0,range:0,rate:0},damage:towerTypes[placingType].damage,range:towerTypes[placingType].range,fireRate:towerTypes[placingType].fireRate});
        placingType=null;
        updateUI();
      } else { infoEl.textContent='Not enough gold'; setTimeout(updateUI,800); }
    } else { selectedTower=null; updateUI(); }
  });
  
  document.getElementById('startWave').onclick = () => {
    wave++;
    applyFarmerBonus();  // Farmer gains gold
    spawnWave();
    updateUI();
  };
  document.getElementById('sellMode').onclick=()=>{ sellMode=!sellMode; if(sellMode) placingType=null; updateUI(); };
  canvas.addEventListener('mousemove', e=>{ const rect=canvas.getBoundingClientRect(); lastMouse={x:e.clientX-rect.left, y:e.clientY-rect.top}; });
  
  // tower upgrades
 document.getElementById("upgradeAll").onclick = () => {
  if(selectedTower==null) return;
  const t = towers[selectedTower];

  const total = t.upgrades.dmg + t.upgrades.range + t.upgrades.rate;
  if(total >= 10) {
    document.getElementById("upgradeAll").classList.add("maxed");
    return;
  }

  const cost = 50;
  if(money < cost) return;

  money -= cost;

  t.upgrades.dmg++;
  t.upgrades.range++;
  t.upgrades.rate++;

  t.damage *= 1.2;
  t.range += 15;
  t.fireRate *= 0.9;

  checkEvolution(t);
  updateUI();
};

  document.getElementById('sellBtn').onclick=()=>{
    if(selectedTower==null) return;
    const t=towers[selectedTower];
    const refund=Math.floor((towerTypes[t.type].cost*(1+0.5*(t.upgrades.dmg+t.upgrades.range+t.upgrades.rate)))*0.5);
    money+=refund; towers.splice(selectedTower,1); selectedTower=null; updateUI();
  };
  
  // start
  populateTowerList();
  updateUI();
  generateDecorations();
  draw();
  gameLoop();