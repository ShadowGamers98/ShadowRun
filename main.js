function callPlay() {

// ── Background Music ──────────────────────────────────────
let bgMusicPlaying = false;
let bgMusicTimer   = null; // FIX: timer track karo

function startBGMusic() {
  if (bgMusicPlaying) return;
  bgMusicPlaying = true;

  // FIX: suspend hoga to resume karo pehle
  getAC().resume();

  const ac = getAC();

  const melody = [
    [330, 0.2], [294, 0.2], [262, 0.2], [294, 0.2],
    [330, 0.2], [330, 0.2], [330, 0.4],
    [294, 0.2], [294, 0.2], [294, 0.4],
    [330, 0.2], [392, 0.2], [392, 0.4],
    [330, 0.2], [294, 0.2], [262, 0.2], [294, 0.2],
    [330, 0.2], [330, 0.2], [330, 0.2], [330, 0.2],
    [294, 0.2], [294, 0.2], [330, 0.2], [294, 0.2],
    [262, 0.8],
  ];

  function playMelody() {
    if (!bgMusicPlaying) return;

    let time = ac.currentTime;

    for (let [freq, dur] of melody) {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.60, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur - 0.02);
      osc.start(time);
      osc.stop(time + dur);
      time += dur;
    }

    const totalDur = melody.reduce((s, [,d]) => s + d, 0);
    bgMusicTimer = setTimeout(playMelody, totalDur * 1000); // FIX: timer save karo
  }

  playMelody();
}

function stopBGMusic() {
  bgMusicPlaying = false;
  clearTimeout(bgMusicTimer); // loop band karo
  bgMusicTimer = null;
  // audioCtx.close() NAHI — warna soundGameOver bhi nahi bajega!
  // clearTimeout hi kaafi hai loop rokne ke liye
  if (audioCtx) {
    audioCtx.close();  // ← sab kuch turant band
    audioCtx = null;   // ← naya banane ke liye reset
  }
}

    // ── Canvas Setup ──────────────────────────────────────────────
    const canvas = document.getElementById("screen");
const ctx    = canvas.getContext("2d");

// ✅ CSS touch mat karo, sirf internal size badho
    // sab kuch 2x scale karo

// Phir W aur H manually set karo
const W = canvas.width;
const H = canvas.height;
    // Canvas setup ke baad ye bhi lagao
   ctx.imageSmoothingEnabled  = true;
   ctx.imageSmoothingQuality  = "high";

    // ── Storage ───────────────────────────────────────────────────
    let highScore  = getHighScore(window.currentLevelNumber || 1); // FIX 2: current level ka score load karo
    let totalCoins = parseInt(localStorage.getItem("sr_coins") || "0");

// main.js mein yeh function add karo
function saveHighScore(levelNum, score) {
  const key  = "sr_high_Level" + levelNum;
  const prev = parseInt(localStorage.getItem(key) || "0");
  if (score > prev) {
    localStorage.setItem(key, score);
  }
}

function getHighScore(levelNum) {
  return parseInt(
    localStorage.getItem("sr_high_Level" + levelNum) || "0"
  );
}

    function saveStorage() {
      const finalScore = Math.floor(score / 10); // FIX 2: raw score nahi, divided score save karo
      saveHighScore(window.currentLevelNumber, finalScore);
      saveLevelStars(window.currentLevelNumber, finalScore); // FIX: stars bhi save karo
    }
    
    function saveCoins() {
      totalCoins += sessionCoins;
      localStorage.setItem("sr_coins", totalCoins);
    }

    // ══════════════════════════════════════════════════════════════
    // ── Sound Engine (Web Audio API — works offline!) ─────────────
    // ══════════════════════════════════════════════════════════════
    let audioCtx = null;

    // AudioContext lazily banao — browser policy ke liye
    function getAC() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return audioCtx;
    }

    // Base function — ek tone bajao
    function tone(freq, type, when, dur, vol, endFreq) {
      const ac   = getAC();
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, when);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, when + dur);
      gain.gain.setValueAtTime(vol || 0.18, when);
      gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
      osc.start(when);
      osc.stop(when + dur);
    }

    // ── Jump Sound — upar jaata sweep ────────────────────────────
    function soundJump() {
     jumpSound.currentTime = 0;
     jumpSound.volume      = 1;
     jumpSound.play();
    }

    // ── Coin Sound — cheerful 2-note ding ────────────────────────
    function soundCoin() {
      const t = getAC().currentTime;
      tone(880,  "sine", t,        0.7, 0.30); // FIX: 0.7 → 0.07
      tone(1320, "sine", t + 0.07, 0.10, 0.18);
    }
    
    function soundWin() {
      const t     = getAC().currentTime;
      const notes = [330, 320, 350, 380, 300, 350, 400, 300];
      notes.forEach((freq, i) => {
        tone(freq, "square", t + i * 0.20, 0.28, 0.50);
      });
    }

    // ── Stomp Sound — low thump ───────────────────────────────────
    function soundStomp() {
      const t = getAC().currentTime;
      tone(200, "square", t,        0.01, 0.80, 90);
      tone(3000,  "sine",   t + 0.03, 0.12, 0.42, 30);
    }

    // ── Game Over Sound — sad 4-note melody ───────────────────────
    function soundGameOver() {
      const t     = getAC().currentTime;
      const notes = [440, 370, 294, 220];
      notes.forEach((freq, i) => {
        tone(freq, "square", t + i * 0.20, 0.18, 0.14);
      });
    }

    // ── Start / Restart jingle ────────────────────────────────────
    function soundStart() {
      const t     = getAC().currentTime;
      const notes = [262, 330, 392, 523];
      notes.forEach((freq, i) => {
        tone(freq, "square", t + i * 0.10, 0.09, 0.12);
      });
    }
    
    function winGame() {
      page2();
      stopBGMusic();
    }
    
    // ══════════════════════════════════════════════════════════════

    // ── Game State ────────────────────────────────────────────────
    let gameState    = "loading";
    let loadProg     = 0;
    let score        = 0;
    let sessionCoins = 0;

    // ── World ─────────────────────────────────────────────────────
    const GROUND_Y = H - 100;

    let camX = 0;

    // ── Platforms ─────────────────────────────────────────────────
   function makeMon(x, y, left, right, spd) {
      return { x, y, w:30, h:30, patrolLeft:left, patrolRight:right, dir:1, speed:spd, alive:true };
    }
   function makeCoinAt(x, y)  { return { x, y, r: 7, collected: false }; }
   function makeWinAt(x, y)   { return { x, y, r: 7, collected: false }; }
   function makeSpikeAt(x, y) { return { x, y, w: 30, h:20 }; }
    
    let WORLD_W   = 0;
    let monsters  = [];
    let grass     = [];
    let dirt      = [];
    let coins     = [];
    let spikes    = [];
    let win       = [];

// Level load karne ka function
function loadLevelData() {
  const lvlMap = {
    1:  LEVEL_1,
    2:  LEVEL_2,
  };

  const lvl = lvlMap[window.currentLevelNumber] || LEVEL_1;

  WORLD_W   = lvl.worldW;
  monsters  = lvl.monsters(GROUND_Y, makeMon);
  grass     = lvl.grass(GROUND_Y);
  dirt      = lvl.dirt(GROUND_Y);
  coins     = lvl.coins(GROUND_Y, makeCoinAt);
  spikes    = lvl.spikes(GROUND_Y, makeSpikeAt);
  win       = lvl.win(GROUND_Y, makeWinAt);
}



    // ── Player ────────────────────────────────────────────────────
    const player = {
      x:80, y:GROUND_Y-50, w:28, h:48,
      vx:0, vy:0, onGround:false, dir:1, walkFrame:0, invincible:0,
    };

    // ── Input ─────────────────────────────────────────────────────
    const keys = { left:false, right:false, jumpPressed:false };

    // ── Collision ─────────────────────────────────────────────────
    function overlap(ax,ay,aw,ah,bx,by,bw,bh) {
      return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
    }

    // ── Reset ─────────────────────────────────────────────────────
    function resetLevel() {
      loadLevelData()
      player.x=80; player.y=GROUND_Y-50;
      player.vx=0; player.vy=0;
      player.onGround=false; player.dir=1; player.invincible=60;
      camX=0; score=0; sessionCoins=0;
    }

    // ── Update ────────────────────────────────────────────────────
    function update() {
      if (gameState === "loading") {
        loadProg += 1.5;
        if (loadProg >= 100) { loadProg=100; setTimeout(()=>{ gameState="start"; }, 400); }
        return;
      }
      if (gameState !== "playing") return;

      const SPEED=3, JUMP=-10.4, GRAV=0.55;

      if (keys.left)       { player.vx=-SPEED; player.dir=-1; }
      else if (keys.right) { player.vx= SPEED; player.dir= 1; }
      else                 { player.vx=0; }

      if (keys.jumpPressed && player.onGround) {
        player.vy = JUMP;
        player.onGround = false;
        soundJump(); // 🔊 JUMP SOUND
      }
      keys.jumpPressed = false;

      player.vy += GRAV;
      player.x  += player.vx;
      player.y  += player.vy;

      if (player.x < 0) player.x = 0;
      if (player.x + player.w > WORLD_W) player.x = WORLD_W - player.w;

      // Platform collision
      player.onGround = false;
      for (let g of grass) {
        if (!overlap(player.x,player.y,player.w,player.h,g.x,g.y,g.w,g.h)) continue;
        const prevBottom = player.y + player.h - player.vy;
        if (player.vy >= 0 && prevBottom <= g.y+4) {
          player.y=g.y-player.h; player.vy=0; player.onGround=true;
        } else if (player.vy < 0 && (player.y-player.vy) >= g.y+g.h-4) {
          player.y=g.y+g.h; player.vy=0;
        } else if (g.h < 30) {
          if (player.vx > 0) player.x=g.x-player.w;
          else                player.x=g.x+g.w;
          player.vx=0;
        }
      }
      
      for (let d of dirt) {
        if (!overlap(player.x,player.y,player.w,player.h,d.x,d.y,d.w,d.h)) continue;
        const prevBottom = player.y + player.h - player.vy;
        if (player.vy >= 0 && prevBottom <= d.y+4) {
          player.y=d.y-player.h; player.vy=0; player.onGround=true;
        } else if (player.vy < 0 && (player.y-player.vy) >= d.y+d.h-4) {
          player.y=d.y+d.h; player.vy=0;
        } else if (d.h < 30) {
          if (player.vx > 0) player.x=d.x-player.w;
          else               player.x=d.x+d.w;
          player.vx=0;
        }
      }
      
      for (let s of spikes) {
        if (overlap(player.x, player.y, player.w, player.h,
        s.x, s.y+35, 20, 30)) {
        playerDie();
      }
      }

      if (player.y > H+80) { playerDie(); return; }
      if (player.onGround && (keys.left||keys.right)) player.walkFrame++;
      if (player.invincible > 0) player.invincible--;

      // Coins
      for (let c of coins) {
        if (c.collected) continue;
        const dx=(player.x+player.w/2)-c.x;
        const dy=(player.y+player.h/2)-c.y;
        if (Math.sqrt(dx*dx+dy*dy) < c.r+14) {
          c.collected=true; sessionCoins++; score+=50;
          soundCoin(); // 🔊 COIN SOUND
        }
      }
      
      for (let wi of win) {
        if (wi.collected) continue;
        const wx=(player.x+player.w/2)-wi.x;
        const wy=(player.y+player.h/2)-wi.y;
        if (Math.sqrt(wx*wx+wy*wy) < wi.r+14) {
          wi.collected=true;
          winGame();
          soundWin();
          saveCoins();
        }
      }

      // Monsters
      for (let m of monsters) {
        if (!m.alive) continue;
        m.x += m.dir * m.speed;
        if (m.x <= m.patrolLeft)          { m.x=m.patrolLeft;       m.dir= 1; }
        if (m.x+m.w >= m.patrolRight)     { m.x=m.patrolRight-m.w; m.dir=-1; }
        if (player.invincible > 0) continue;
        if (!overlap(player.x,player.y,player.w,player.h,m.x,m.y,m.w,m.h)) continue;
        if (player.vy > 0 && (player.y+player.h-player.vy) <= m.y+6) {
          m.alive=false; player.vy=-7; score+=100;
          soundStomp(); // 🔊 STOMP SOUND
        } else {
          playerDie(); return;
        }
      }

      // Camera
      camX = player.x - W/2 + player.w/2;
      if (camX < 0)           camX=0;
      if (camX > WORLD_W-W)   camX=WORLD_W-W;

      const cur = Math.floor(score/10);
      if (cur > highScore) { highScore=cur; saveStorage(); }
    }

    function playerDie() {
  if (player.invincible > 0) return;
  stopBGMusic();  // ← yahan
  soundGameOver();
  gameState = "dead";
}

    // ── Draw ──────────────────────────────────────────────────────
    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (gameState==="loading") { drawLoading(); return; }
      if (gameState==="start")   { drawStart();   return; }

      const sky = ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,"#060c28"); sky.addColorStop(1,"#0a1a3f");
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

      ctx.fillStyle="#ffffff66";
      for (let i=0;i<40;i++) {
        const sx=((i*137+50)%WORLD_W-camX*0.2+WORLD_W)%W;
        const sy=(i*71)%(H*0.55);
        ctx.fillRect(sx,sy,i%3===0?2:1,i%3===0?2:1);
      }

      ctx.save();
      ctx.translate(-camX, 0);

     // ── Texture Loader ──────────────────────────────────────────

      // ✅ SAHI — Sirf ek loop
for (let g of grass) {
    if (g.x + g.w < camX || g.x > camX + W) continue;
    if (g.h >= 50) {
        ctx.fillStyle = "#5a2a08";
        ctx.fillRect(g.x, g.y, g.w, g.h + 20);
        const tileSize = 20;
        for (let tx = g.x; tx < g.x + g.w; tx += tileSize) {
            ctx.drawImage(grassTexture, tx, g.y, tileSize, tileSize);
        }
    } else {
        const tileSize = g.h;
        for (let tx = g.x; tx < g.x + g.w; tx += tileSize) {
            ctx.drawImage(grassTexture, tx, g.y, tileSize, g.h);
        }
    }
}
      
      for (let d of dirt) {
        if (d.x+d.w < camX || d.x > camX+W) continue;
        if (d.h >= 50) {
          ctx.fillStyle="#5a2a08"; ctx.fillRect(d.x,d.y,d.w,d.h+50);
        } else {
          ctx.fillStyle="#7a3a10"; ctx.fillRect(d.x,d.y,d.w,d.h);
          ctx.strokeStyle="#5a2a08"; ctx.lineWidth=1;
          for (let bx=d.x;bx<d.x+d.w;bx+=24) ctx.strokeRect(bx,d.y,24,d.h);
        }
      }
      
      for (let s of spikes) {
        if (s.x+20 < camX || s.x > camX+W) continue;
        ctx.drawImage(spikeTexture, s.x, s.y+30, 30, 20)
      }
      
      

            // ── Coins Drawing with Texture ──────────────────────────────
      const t = Date.now();
      for (let c of coins) {
        if (c.collected) continue;
        if (c.x < camX - 20 || c.x > camX + W + 20) continue;
        
        // Thoda sa floating/pulse effect rakhte hain taaki coin achha lage
        const pulse = Math.sin(t / 350 + c.x * 0.05) * 2;
        
        // Coin ke center ke hisab se image ko draw karna
        const size = c.r * 3.5; // Coin ka size thoda bada dikhane ke liye multiplier
        ctx.drawImage(
          coinTexture, 
          c.x - size / 5, 
          c.y - size / 5,
          size,
          size
        );
      }

      
      for (let wi of win) {
        if (wi.collected) continue;
        if (wi.x<camX-20||wi.x>camX+W+20) continue;
        drawFlag(wi);
      }
      
      function drawFlag(wi) {
        const x = wi.x;
        const y = wi.y;
  
  // Pole
  ctx.fillStyle = "#aaaaaa";
  ctx.fillRect(x - 2, y - 60, 5, 60); // tall pole
  
  // Flag (waving effect)
  const wave = Math.sin(Date.now() / 200) * 3;
  ctx.fillStyle  = "#000000"
  
  // ─── First layer
  ctx.fillRect(x-40,  y-40,5,  y-140);
  ctx.fillRect(x-30,  y-40,5,  y-140);
  ctx.fillRect(x-20,  y-40,5,  y-140);
  ctx.fillRect(x-10,  y-40,5,  y-140);
  // ─── Second layer
  ctx.fillRect(x-35,  y-35,5,  y-140);
  ctx.fillRect(x-25,  y-35,5,  y-140);
  ctx.fillRect(x-15,  y-35,5,  y-140);
  ctx.fillRect(x-5,   y-35,5,  y-140);
  
  ctx.fillStyle  = "#ffffff"
  // ─── First layer
  ctx.fillRect(x-35,  y-40,5,  y-140);
  ctx.fillRect(x-25,  y-40,5,  y-140);
  ctx.fillRect(x-15,  y-40,5,  y-140);
  ctx.fillRect(x-5,   y-40,5,  y-140);
  
  // ─── Second layer
  ctx.fillRect(x-40,  y-35,5,  y-140);
  ctx.fillRect(x-30,  y-35,5,  y-140);
  ctx.fillRect(x-20,  y-35,5,  y-140);
  ctx.fillRect(x-10,  y-35,5,  y-140);
  
  ctx.fillStyle  = "#00ff88";
  ctx.fill();
  
  // "WIN" text on flag
  ctx.fillStyle = "#04060f";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("WIN", x + 6, y - 47 + wave);
  
  // Glow
  ctx.shadowColor = "#00ff88";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI*2);
  ctx.fillStyle = "#00ff8844";
  ctx.fill();
  ctx.shadowBlur = 0;
}

      for (let m of monsters) {
        if (!m.alive) continue;
        if (m.x+m.w<camX||m.x>camX+W) continue;
        drawMonster(m);
      }

      if (!(player.invincible>0 && Math.floor(t/80)%2===0)) drawPlayer();

      ctx.restore();
      drawHUD();
      
      if (gameState==="dead") {
        const Screen = document.getElementById("inGameScreen");
        const SD     = Screen.getContext("2d");
        const SH     = Screen.height;
        const SW     = Screen.width;
        
        SD.fillStyle  = "#1f1f1f"; SD.fillRect(0,0,SW,SH)
        SD.fillStyle  = "#ff4444"; SD.font="bold 30px monospace"; SD.textAlign="center"; SD.fillText("GAME OVER",SW/2,SH/2-125);
        
        
        Screen.style.display = "block";
      }
    }

    // ── Draw Player ───────────────────────────────────────────────
    function drawPlayer() {
      const x=player.x, y=player.y, d=player.dir, wf=player.walkFrame;
      ctx.save();
      ctx.shadowColor="#00f5ff"; ctx.shadowBlur=10;
      const ls=player.onGround?Math.sin(wf*0.35)*7:0;
      ctx.fillStyle="#006688";
      ctx.fillRect(x+6, y+36,7,12+ls); ctx.fillRect(x+15,y+36,7,12-ls);
      ctx.fillStyle="#00c8dd"; ctx.fillRect(x+6,y+18,16,20);
      const as=player.onGround?Math.sin(wf*0.35)*5:0;
      ctx.fillStyle="#00b0cc";
      ctx.fillRect(x,    y+20+as,6,10); ctx.fillRect(x+22,y+20-as,6,10);
      ctx.beginPath(); ctx.arc(x+14,y+12,12,0,Math.PI*2);
      ctx.fillStyle="#00d8ee"; ctx.fill();
      ctx.fillStyle="#04060f";
      ctx.beginPath(); ctx.arc(x+14+d*5,y+10,3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ffffff";
      ctx.beginPath(); ctx.arc(x+14+d*6,y+8.5,1.2,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0; ctx.restore();
    }

    // ── Draw Monster ──────────────────────────────────────────────
    function drawMonster(m) {
      const x=m.x, y=m.y, d=m.dir;
      ctx.save();
      ctx.shadowColor="#ff4444"; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.ellipse(x+15,y+14,14,14,0,0,Math.PI*2);
      ctx.fillStyle="#cc2222"; ctx.fill();
      ctx.fillStyle="#991111";
      ctx.beginPath(); ctx.ellipse(x+8, y+26,6,5,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+22,y+26,6,5,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ffff00";
      ctx.beginPath(); ctx.arc(x+10+d,y+10,4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+20+d,y+10,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#000";
      ctx.beginPath(); ctx.arc(x+11+d*2,y+10,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+21+d*2,y+10,2,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#550000"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x+6,y+5);  ctx.lineTo(x+14,y+8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+16,y+8); ctx.lineTo(x+24,y+5); ctx.stroke();
      ctx.shadowBlur=0; ctx.restore();
    }

    // ── HUD ───────────────────────────────────────────────────────
    function drawHUD() {
      ctx.fillStyle="#ffffff"; ctx.font="bold 13px monospace"; ctx.textAlign="left";
      ctx.fillText("Score: "+Math.floor(score/10),8,20);
      ctx.beginPath(); ctx.arc(12,34,7,0,Math.PI*2);
      ctx.fillStyle="#FFD700"; ctx.fill();
      ctx.fillStyle="#fff"; ctx.font="12px monospace";
      ctx.fillText("x "+sessionCoins,24,39);
      ctx.fillStyle="#00f5ffaa"; ctx.font="12px monospace"; ctx.textAlign="right";
      const best = getHighScore(window.currentLevelNumber);
      ctx.fillText("Best: " + best, W - 8, 20);
      ctx.fillStyle="#FFD700aa";
      ctx.fillText("💰 "+totalCoins,W-8,38);
    }

    // ── Loading Screen ────────────────────────────────────────────
    function drawLoading() {
      ctx.fillStyle="#04060f"; ctx.fillRect(0,0,W,H);
      ctx.fillStyle="#00f5ff"; ctx.font="bold 30px monospace"; ctx.textAlign="center";
      ctx.shadowColor="#00f5ff"; ctx.shadowBlur=20;
      ctx.fillText("SHADOW RUN",W/2,H/2-45); ctx.shadowBlur=0;
      ctx.fillStyle="#1a1a2e"; ctx.fillRect(W/2-100,H/2-10,200,20);
      const g=ctx.createLinearGradient(W/2-100,0,W/2+100,0);
      g.addColorStop(0,"#0066aa"); g.addColorStop(1,"#00f5ff");
      ctx.fillStyle=g; ctx.fillRect(W/2-100,H/2-10,loadProg*2,20);
      ctx.strokeStyle="#00f5ff88"; ctx.lineWidth=2;
      ctx.strokeRect(W/2-100,H/2-10,200,20);
      ctx.fillStyle="#ffffff88"; ctx.font="12px monospace";
      ctx.fillText("Loading... "+Math.floor(loadProg)+"%",W/2,H/2+30);
    }

    // ── Start Screen ──────────────────────────────────────────────
    function drawStart() {
      const sky=ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,"#060c28"); sky.addColorStop(1,"#0a1a3f");
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
      ctx.fillStyle="#00f5ff"; ctx.font="bold 28px monospace"; ctx.textAlign="center";
      ctx.shadowColor="#00f5ff"; ctx.shadowBlur=16;
      ctx.fillText("SHADOW RUN",W/2,75); ctx.shadowBlur=0;
      ctx.fillStyle="#ffffff"; ctx.font="15px monospace";
      ctx.fillText("▲ Tap To Start",W/2,135);
      ctx.fillStyle="#ffffff88"; ctx.font="12px monospace";
      ctx.fillText("◀ ▶ Move   ▲ Jump",W/2,163);
      ctx.fillText("Jump ON monsters to stomp them!",W/2,185);
      ctx.fillText("Collect coins  🪙",W/2,205);
      if (highScore>0) {
        ctx.fillStyle="#FFD700"; ctx.font="13px monospace";
        ctx.fillText("Best: "+highScore+"   Coins: "+totalCoins,W/2,240);
      }
    }

    // ── Dead Screen ───────────────────────────────────────────────
    function drawDead() {
      ctx.fillStyle="#00000099"; ctx.fillRect(0,0,W,H);
      ctx.fillStyle="#ff4444"; ctx.font="bold 26px monospace"; ctx.textAlign="center";
      ctx.fillText("GAME OVER",W/2,H/2-32);
      ctx.fillStyle="#ffffff"; ctx.font="14px monospace";
      ctx.fillText("Score : "+Math.floor(score/10),W/2,H/2+2);
      ctx.fillText("Coins : "+sessionCoins,W/2,H/2+22);
      ctx.fillStyle="#FFD700"; ctx.font="13px monospace";
      ctx.fillText("Total Coins: "+totalCoins,W/2,H/2+44);
      ctx.fillStyle="#00f5ff";
      ctx.fillText("Tap ▲ To Restart",W/2,H/2+70);
    }

    // ── Game Loop ─────────────────────────────────────────────────
    function loop() { update(); draw(); requestAnimationFrame(loop); }
    loop();

    // ── Button Logic ──────────────────────────────────────────────
    function handleJump() {
  if (gameState === "start" || gameState === "dead") {
    soundStart();
    startBGMusic()
    resetLevel();
    gameState = "playing";
    return; // ← yeh bhi add karo
  }
  if (gameState === "playing") keys.jumpPressed = true; // ← yeh missing tha!
}
function pause() {
  if (gameState === "playing") {
  gameState = "pause";
  }
  else {
    gameState = "playing"
  }
      }
      
    const P = document.getElementById("pauseBtn");
    P.addEventListener("touchstart", ()=>pause());

    const BL=document.getElementById("btnLeft");
    const BR=document.getElementById("btnRight");
    const BJ=document.getElementById("btnJump");

    BL.addEventListener("touchstart",e=>{e.preventDefault();keys.left=true;});
    BL.addEventListener("touchend",  e=>{e.preventDefault();keys.left=false;});
    BL.addEventListener("mousedown", ()=>keys.left=true);
    BL.addEventListener("mouseup",   ()=>keys.left=false);

    BR.addEventListener("touchstart",e=>{e.preventDefault();keys.right=true;});
    BR.addEventListener("touchend",  e=>{e.preventDefault();keys.right=false;});
    BR.addEventListener("mousedown", ()=>keys.right=true);
    BR.addEventListener("mouseup",   ()=>keys.right=false);

    BJ.addEventListener("touchstart",e=>{e.preventDefault();handleJump();});
    BJ.addEventListener("mousedown", ()=>handleJump());

    document.addEventListener("keydown",e=>{
      if (e.code==="ArrowLeft"||e.code==="KeyA")        keys.left=true;
      if (e.code==="ArrowRight"||e.code==="KeyD")       keys.right=true;
      if (e.code==="ArrowUp"||e.code==="Space"||e.code==="KeyW") { e.preventDefault(); handleJump(); }
    });
    document.addEventListener("keyup",e=>{
      if (e.code==="ArrowLeft"||e.code==="KeyA")        keys.left=false;
      if (e.code==="ArrowRight"||e.code==="KeyD")       keys.right=false;
    });
}