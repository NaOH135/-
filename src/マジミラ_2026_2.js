const { Player } = TextAliveApp;

/* =========================================
   Player
========================================= */
const player = new Player({
  app: {token: "7PsjmkSz3KBX9m8f" },
  mediaElement: document.querySelector("#media"),
  mediaBannerPosition: "bottom right"
});

/* =========================================
   DOM
========================================= */
const overlay = document.getElementById("overlay");
const bar = document.querySelector("#bar");
const seekbar = document.getElementById("seekbar");
const paintedSeekbar = document.getElementById("seek");
const textContainer = document.getElementById("lyricsContainer");
const bg = document.getElementById("background");
const mikuRin = document.getElementById("mikuRin");
const camera = document.getElementById("camera");
const flash = document.getElementById("flash");
const heart = document.getElementById("heart");
const counter = document.getElementById("counter");
const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");

/* =========================================
   Canvas
========================================= */
const canvas = document.getElementById("trailCanvas");
const ctx = canvas.getContext("2d");
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize",resizeCanvas);

/* =========================================
   State
========================================= */
let lyrics = [];
let currentTarget = null;
let cameraX = window.innerWidth / 2;
let cameraY = window.innerHeight / 2;
let songDuration = 0;
let beatCache = null;
let ended = false;

/* =========================================
   TextAlive
========================================= */
player.addListener({
  onAppReady(app) {
    if (!app.songUrl) {
      player.createFromSongUrl(
        "https://piapro.jp/t/PNpQ/20251209170719",
        {video: {
            beatId: 4827295,
            chordId: 2963756,
            repetitiveSegmentId: 3086263,
            melodyId: 12435,
            lyricId: 126542,
            lyricDiffId: 29844
          }
        }
      );
    }
  },

  onAppMediaChange() {
    resetLyrics();
  },

  onVideoReady(video) {
    songArtist.textContent = player.data.song.artist.name;
    songTitle.textContent = player.data.song.name;
    songDuration = video.duration;
    createLyrics(video);
  },

  onTimerReady() {
    overlay.classList.add("disabled");
    document.querySelector("#play").classList.remove("disabled");
    document.querySelector("#play").textContent = "▶️";
    document.querySelector("#stop").classList.remove("disabled" );
    document.querySelector("#stop").textContent = "⏹️";
  },

  onTimeUpdate(position) {
    paintedSeekbar.style.width = `${position / player.video.duration *100}%`;
    const beat = player.findBeat(position);
    if (beat && beat !== beatCache) {
      beatCache = beat;
      requestAnimationFrame(() => {
        bar.className = "active";
        requestAnimationFrame(() => {
          bar.className ="active beat";
        });
      });
    }
    updateLyrics(position);
    updateTarget(position);
    updateMikuRin(position);
    updateBackground(position);
  },

  onPlay() {
    console.log("onPlay");
    document.querySelector("#play").textContent = "⏸️";
  },

  onPause() {
    console.log("onPause");
    document.querySelector("#play").textContent = "▶️";
  }
});

seekbar.addEventListener("click",
  e => {
    e.preventDefault();
    if (!player.video) {
      return;
    }
    const position = player.video.duration * e.offsetX / seekbar.clientWidth;
    console.log("seek to", position );
    player.requestMediaSeek(position);
    player.requestMediaSeek(position);
    updateLyrics(position);
    updateTarget(position);
    refreshLyrics(position);    
  }
);


/* =========================================
   Controls
========================================= */
document.querySelector("#play").addEventListener("click",
    e => {
      e.preventDefault();
      if (player.isPlaying) {
        player.requestPause();
      } else {
        player.requestPlay();
      }
    }
  );

document.querySelector("#stop").addEventListener("click",
    e => {
      console.log("stop");
      e.preventDefault();
      player.requestStop();
      resetGame();
    }
  );

/* =========================================
   Lyrics
========================================= */
function resetLyrics() {
  lyrics = [];
  currentTarget = null;
  textContainer.innerHTML = "";
}

function createLyrics(video) {
  let current = video.firstWord;
  lyrics = [];
  textContainer.innerHTML = "";
  while (current) {
    const span = document.createElement("span");
    span.className = "lyric";
    span.textContent = current.text;
    if(isNoun(current)==true){
      const noun = current.text 
            if (noun) {
      span.classList.add("noun" );
      }
      const y = 80 + Math.random()*(window.innerHeight - 180);
      span.style.left = window.innerWidth + "px";
      span.style.top = y + "px";
      span.style.display = "none";
      textContainer.appendChild(span);
      lyrics.push({
        word: current,
        element: span,
        isNoun: noun,
        y,
        phase: Math.random() * Math.PI * 2,
        hit: false
      });
    }
    else
      {const noun = null }

    current = current.next;
  }
}

function updateLyrics(position) {
  lyrics.forEach(obj => {
    if (position < obj.word.startTime) {
      obj.element.style.display = "none";
      return;
    }
    obj.element.style.display = "block";
    const x = window.innerWidth - (position - obj.word.startTime) * 0.15;
    const y = obj.y + Math.sin(performance.now() * 0.005 + obj.phase) * 10;
    obj.element.style.left = x + "px";
    obj.element.style.top = y + "px";
    obj.currentX = x;
    obj.currentY = y;
  });
}

function updateTarget(position) {
  if (currentTarget && currentTarget.element.style.display !== "none" && currentTarget.currentX > -200 ) {
    return;
  }
  const nextNoun = lyrics.find(
    lyric =>
      lyric.isNoun && lyric.word.startTime > position
  );
  currentTarget = nextNoun || null;
}

/* =========================================
   Camera
========================================= */
camera.style.left = cameraX + "px";
camera.style.top = cameraY + "px";
document.addEventListener("mousemove",
  e => {
    cameraX = e.clientX;
    cameraY = e.clientY;
    updateCamera();
  }
);

document.addEventListener("keydown",
  e => {
    const speed = 20;
    switch (e.key) {
      case "ArrowUp": cameraY -= speed;
        break;
      case "ArrowDown": cameraY += speed;
        break;
      case "ArrowLeft": cameraX -= speed;
        break;
      case "ArrowRight": cameraX += speed;
        break;
    }
    cameraX = Math.max(0, Math.min(window.innerWidth, cameraX));
    cameraY = Math.max(0,Math.min(window.innerHeight, cameraY));
    updateCamera();
  }
);

/* =========================================
   スマホ対応
========================================= */
function moveCamera(x, y) {
  cameraX = x;
  cameraY = y;
  updateCamera();
}

document.addEventListener("pointermove", e => {
  moveCamera(e.clientX, e.clientY);
});
document.addEventListener("pointerdown", e => {
  moveCamera(e.clientX, e.clientY);
});

document.addEventListener("touchmove",
  e => {
    e.preventDefault();
  },
  {passive: false}
);


/* =========================================
   Trail
========================================= */
let trail = [];
let hitPoints = [];
let shotCount = 0;
function updateCamera() {
  camera.style.left = cameraX + "px";
  camera.style.top = cameraY + "px";
  trail.push({
    x: cameraX,
    y: cameraY,
    time: performance.now()
  });
  if (trail.length > 6000) {
    trail.shift();
  }
}

function drawTrail() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (trail.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = "#ffee33";
    ctx.lineWidth = 4;
    ctx.moveTo(trail[0].x, trail[0].y);
    for (
      let i = 1;
      i < trail.length;
      i++
    ) {
      ctx.lineTo(
        trail[i].x,
        trail[i].y
      );
    }
    ctx.stroke();
  }

  hitPoints.forEach(p => {
    ctx.beginPath();
     ctx.fillStyle = p.color;
     ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
  ctx.fill();
  });
}

function deleteTrail() {
  const now = performance.now();
  while (trail.length > 0 && now - trail[0].time >4000) {
    trail.shift();
  }
}

/* =========================================
   Collision
========================================= */
function detectCollision() {

  lyrics.forEach(obj => {

    if (obj.element.style.display === "none" ) {
      return;
    }
    const rect = obj.element.getBoundingClientRect();
    const cameraRect = camera.getBoundingClientRect();
    const cameraRight = cameraRect.right;
    const hit =
      cameraRight >= rect.left - 10 &&
      cameraRight <= rect.left + 10 &&
      cameraRect.top <= rect.bottom &&
      cameraRect.bottom >= rect.top;
    if (hit && !obj.hit) {
      obj.hit = true;
      onShot(obj);
    }
    if (!hit && obj.hit) {
      obj.hit = false;
    }
  });
}

/* =========================================
   Shot
========================================= */
function onShot(obj) {
  shotCount++;
  counter.textContent = shotCount + "枚";
  hitPoints.push({
    x: cameraX,
    y: cameraY,
    color: (currentTarget &&  obj === currentTarget)
      ? "#ff6600"
      : "#ffee33"
  });
  showFlash();
  if (currentTarget && obj === currentTarget) {
    showHeart();
  }
}

function showFlash() {
  flash.style.display = "block";
  flash.style.left = (cameraX + 40) + "px";
  flash.style.top = cameraY + "px";
  setTimeout(() => {
    flash.style.display = "none";
  }, 150);
}

function showHeart() {
  heart.style.display = "block";
  heart.style.left = cameraX + "px";
  heart.style.top = (cameraY - 50) + "px";
  setTimeout(() => {
    heart.style.display = "none";
  }, 1000);
}

/* =========================================
   Chorus
========================================= */
function isChorus(position) {
  const groups = player.data.songMap?.segments;
  if (!groups) {
    return false;
  }
  for (const group of groups) {
    if (!group.chorus) {
      continue;
    }
    for (const seg of group.segments) {
      if (position >= seg.startTime && position <= seg.endTime) {
        return true;
      }
    }
  }
  return false;
}

/* =========================================
   Background
========================================= */
let backgroundState = "";
function updateBackground(position) {
  const nextState = isChorus(position)
      ? "chorus": "normal";
  if (nextState === backgroundState) {
    return;
  }
  backgroundState = nextState;
  if (nextState ==="chorus" ) {
    bg.style.backgroundImage = 'url("../images/背景_2.png")';
  } else {
    bg.style.backgroundImage = 'url("../images/背景_1.png")';
  }
}

/* =========================================
   End
========================================= */
function endPerformance() {
  if(shotCount >= 150){
    trail = [];
    hitPoints = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    mikuRin.style.display = "none";
    bg.style.backgroundImage = 'url("../images/ミク・リン.png")';
    bg.style.backgroundSize = "contain";    
  }
  else bg.style.backgroundImage = 'url("../images/背景_3.png")';
  const resultCount = document.getElementById("resultCount");
  resultCount.textContent = shotCount + "枚";
  document.getElementById("endScreen").style.display = "flex"; 
}

/* =========================================
   Replay
========================================= */
document.getElementById("reloadButton").addEventListener("click",
    () => {
      location.reload();
    }
  );

/* =========================================
   Game Loop
========================================= */
function gameLoop() {

  if (
    !ended &&
    player.video &&
    player.timer &&
    player.timer.position >= songDuration
  ) {
    console.log("song ended");
    ended = true;
    endPerformance();
  }

  drawTrail();
  deleteTrail();
  detectCollision();
  requestAnimationFrame(gameLoop);
}

gameLoop();

/* =========================================
   Noun
========================================= */
function isNoun(current) {
  const wordClasses = [];
  if (!current) {
    return false;
  }  
  else if (
    current.pos === "N" ||
    current.pos === "PN" ||
    current.pos === "X"){
    wordClasses.push("noun");
    return true;
  }  
}

function resetGame() {
  resetLyrics();
  if (player.video) {
    createLyrics(player.video);
  }
  currentTarget = null;
  trail = [];
  hitPoints = [];
  shotCount = 0;
  counter.textContent = "0枚";
  ended = false;
  flash.style.display = "none";
  heart.style.display = "none";
  mikuRin.style.display = "none";
  backgroundState = "";
  bg.style.backgroundImage = 'url("../images/背景_1.png")';
  document.getElementById("endScreen").style.display = "none";
  cameraX = window.innerWidth / 30;
  cameraY = window.innerHeight / 30;
  updateCamera();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function refreshLyrics(position){
  lyrics.forEach(obj => {obj.hit = false;
    if(position >= obj.word.startTime){
      obj.visible = true;
      obj.element.style.display = "block";
    }else{
      obj.visible = false;
      obj.element.style.display = "none";
    }
  });
}

function updateMikuRin(position) {
  if (!currentTarget) {
    mikuRin.style.display = "none";
    return;
  }
  if(currentTarget.word.startTime > position){
    mikuRin.style.display = "none";
    return;
  }
  mikuRin.style.display = "block";
  const x = currentTarget.currentX + currentTarget.element.offsetWidth + 10;
  const y = currentTarget.currentY - 10;
  mikuRin.style.left = x + "px";
  mikuRin.style.top = y + "px";
}