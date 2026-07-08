(function(){
  "use strict";

  const GRID = 18;
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');

  const scoreVal = document.getElementById('scoreVal');
  const hiVal = document.getElementById('hiVal');
  const startOverlay = document.getElementById('startOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const overOverlay = document.getElementById('overOverlay');
  const finalScore = document.getElementById('finalScore');
  const newBestMsg = document.getElementById('newBestMsg');
  const speedSelect = document.getElementById('speedSelect');

  // Session-only best score (no browser storage used in this environment).
  let hiscore = 0;

  let cellSize = 1;
  function resizeCanvas(){
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height));
    canvas.width = size;
    canvas.height = size;
    cellSize = size / GRID;
    draw();
  }
  window.addEventListener('resize', resizeCanvas);

  // ---------- Sound (real audio files) ----------
  const foodSound = new Audio('music/food.mp3');
  const gameOverSound = new Audio('music/gameover.mp3');
  const moveSound = new Audio('music/move.mp3');
  const musicSound = new Audio('music/music.mp3');
  musicSound.loop = true;
  musicSound.volume = 0.35;
  foodSound.volume = 0.7;
  gameOverSound.volume = 0.7;
  moveSound.volume = 0.45;

  // Cloning lets a sound overlap itself (e.g. eating twice in quick succession)
  // instead of cutting off the previous play.
  function playSound(audio){
    const node = audio.cloneNode();
    node.volume = audio.volume;
    node.play().catch(function(){ /* playback can be blocked before a user gesture */ });
  }

  function ensureAudio(){
    // Browsers block audio until a user gesture; this is called from the
    // Start button click, which counts as one.
    musicSound.currentTime = 0;
    musicSound.play().catch(function(){});
  }
  function sfxEat(){ playSound(foodSound); }
  function sfxOver(){ musicSound.pause(); playSound(gameOverSound); }
  function sfxTurn(){ playSound(moveSound); }

  // ---------- Game state ----------
  let snake, dir, nextDir, food, score, running, paused, acc, lastTime, frameMs;

  function randCell(){
    return { x: 1 + Math.floor(Math.random() * (GRID - 2)), y: 1 + Math.floor(Math.random() * (GRID - 2)) };
  }

  function placeFood(){
    let f;
    do {
      f = randCell();
    } while (snake.some(function(s){ return s.x === f.x && s.y === f.y; }));
    food = f;
  }

  function reset(){
    snake = [ {x:9,y:9}, {x:8,y:9}, {x:7,y:9} ];
    dir = {x:1, y:0};
    nextDir = {x:1, y:0};
    score = 0;
    scoreVal.textContent = '0';
    placeFood();
    frameMs = 1000 / Number(speedSelect.value);
    acc = 0;
    lastTime = 0;
    paused = false;
    running = true;
  }

  function collides(head){
    if(head.x <= 0 || head.x >= GRID - 1 || head.y <= 0 || head.y >= GRID - 1) return true;
    for(let i = 0; i < snake.length; i++){
      if(snake[i].x === head.x && snake[i].y === head.y) return true;
    }
    return false;
  }

  function step(){
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if(collides(head)){
      gameOver();
      return;
    }

    snake.unshift(head);

    if(head.x === food.x && head.y === food.y){
      sfxEat();
      score += 1;
      scoreVal.textContent = String(score);
      if(score > hiscore){
        hiscore = score;
        hiVal.textContent = String(hiscore);
      }
      placeFood();
    } else {
      snake.pop();
    }
  }

  function gameOver(){
    running = false;
    sfxOver();
    finalScore.textContent = 'Score: ' + score;
    newBestMsg.textContent = (score > 0 && score === hiscore) ? 'New best on this run!' : ('Best this session: ' + hiscore);
    overOverlay.classList.remove('hidden');
  }

  // ---------- Draw ----------
  function drawGrid(){
    ctx.strokeStyle = 'rgba(77,238,234,0.045)';
    ctx.lineWidth = 1;
    for(let i = 1; i < GRID; i++){
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, GRID * cellSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(GRID * cellSize, i * cellSize);
      ctx.stroke();
    }
    // outer wall
    ctx.strokeStyle = 'rgba(247,37,133,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cellSize, cellSize, (GRID-2)*cellSize, (GRID-2)*cellSize);
  }

  function drawFood(t){
    const pulse = 0.6 + 0.4 * Math.sin(t / 180);
    const cx = (food.x + 0.5) * cellSize;
    const cy = (food.y + 0.5) * cellSize;
    const r = cellSize * 0.36 * pulse + cellSize * 0.2;
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
    grad.addColorStop(0, '#ffd166');
    grad.addColorStop(1, 'rgba(255,209,102,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(cx, cy, cellSize * 0.22, 0, Math.PI*2);
    ctx.fill();
  }

  function drawSnake(){
    const n = snake.length;
    for(let i = n - 1; i >= 0; i--){
      const seg = snake[i];
      const t = 1 - i / n; // 1 at head, fading toward tail
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;
      const pad = cellSize * (0.12 - 0.05 * t);
      const w = cellSize - pad * 2;

      if(i === 0){
        ctx.shadowColor = 'rgba(77,238,234,0.9)';
        ctx.shadowBlur = cellSize * 0.9;
        ctx.fillStyle = '#eafffb';
      } else {
        ctx.shadowColor = 'rgba(77,238,234,' + (0.15 + 0.35*t) + ')';
        ctx.shadowBlur = cellSize * 0.5 * t;
        const g = Math.floor(180 + 60 * t);
        ctx.fillStyle = 'rgba(' + (30+40*t) + ',' + g + ',' + (200 - 20*t) + ',' + (0.55 + 0.45*t) + ')';
      }

      const r = Math.min(cellSize * 0.28, w/2);
      roundRect(x + pad, y + pad, w, w, r);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function roundRect(x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw(t){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    if(snake){
      drawFood(t || 0);
      drawSnake();
    }
  }

  // ---------- Loop ----------
  function loop(t){
    requestAnimationFrame(loop);
    if(!running || paused){ draw(t); return; }
    if(!lastTime) lastTime = t;
    acc += t - lastTime;
    lastTime = t;
    if(acc >= frameMs){
      acc = 0;
      step();
    }
    draw(t);
  }

  // ---------- Input ----------
  function setDir(x, y){
    // prevent reversing directly into self
    if(dir.x === -x && dir.y === -y) return;
    if(nextDir.x === -x && nextDir.y === -y) return;
    nextDir = {x:x, y:y};
    sfxTurn();
  }

  window.addEventListener('keydown', function(e){
    if(e.key === ' '){
      e.preventDefault();
      togglePause();
      return;
    }
    if(!running || paused) return;
    switch(e.key){
      case 'ArrowUp': case 'w': case 'W': setDir(0,-1); break;
      case 'ArrowDown': case 's': case 'S': setDir(0,1); break;
      case 'ArrowLeft': case 'a': case 'A': setDir(-1,0); break;
      case 'ArrowRight': case 'd': case 'D': setDir(1,0); break;
    }
  });

  document.querySelector('.tp-up').addEventListener('click', function(){ if(running && !paused) setDir(0,-1); });
  document.querySelector('.tp-down').addEventListener('click', function(){ if(running && !paused) setDir(0,1); });
  document.querySelector('.tp-left').addEventListener('click', function(){ if(running && !paused) setDir(-1,0); });
  document.querySelector('.tp-right').addEventListener('click', function(){ if(running && !paused) setDir(1,0); });

  // swipe support
  let touchStart = null;
  canvas.addEventListener('touchstart', function(e){
    const tch = e.changedTouches[0];
    touchStart = {x: tch.clientX, y: tch.clientY};
  }, {passive:true});
  canvas.addEventListener('touchend', function(e){
    if(!touchStart || !running || paused) return;
    const tch = e.changedTouches[0];
    const dx = tch.clientX - touchStart.x;
    const dy = tch.clientY - touchStart.y;
    if(Math.abs(dx) > Math.abs(dy)){
      setDir(dx > 0 ? 1 : -1, 0);
    } else {
      setDir(0, dy > 0 ? 1 : -1);
    }
    touchStart = null;
  }, {passive:true});

  function togglePause(){
    if(!running) return;
    paused = !paused;
    pauseOverlay.classList.toggle('hidden', !paused);
    if(paused){
      musicSound.pause();
    } else {
      lastTime = 0;
      musicSound.play().catch(function(){});
    }
  }

  speedSelect.addEventListener('change', function(){
    frameMs = 1000 / Number(speedSelect.value);
  });

  document.getElementById('startBtn').addEventListener('click', function(){
    ensureAudio();
    startOverlay.classList.add('hidden');
    reset();
  });
  document.getElementById('resumeBtn').addEventListener('click', togglePause);
  document.getElementById('retryBtn').addEventListener('click', function(){
    overOverlay.classList.add('hidden');
    reset();
    musicSound.currentTime = 0;
    musicSound.play().catch(function(){});
  });

  resizeCanvas();
  requestAnimationFrame(loop);
})();
