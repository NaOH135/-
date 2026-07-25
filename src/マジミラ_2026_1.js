const { Player, stringToDataUrl } = TextAliveApp;

//Player settings
const player = new Player({
  app: { token: "7PsjmkSz3KBX9m8f"},
  mediaElement: document.querySelector("#media"),
  mediaBannerPosition: "bottom right"
});


//DOM Elements
const overlay = document.getElementById("overlay");
const bar = document.querySelector("#bar");
const textContainer = document.querySelector("#text");
const seekbar = document.querySelector("#seekbar");
const paintedSeekbar = seekbar.querySelector("div");

const bg = document.getElementById("background");
const mikuRin = document.getElementById("mikuRin");
const camera = document.getElementById("camera");
const flash = document.getElementById("flash");
const heart = document.getElementById("heart");
const counter = document.getElementById("counter");
const playButton = document.getElementById("play");
const stopButton = document.getElementById("stop");
const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");
let b, c;


//Canvas
const canvas = document.getElementById("trailCanvas");
const ctx = canvas.getContext("2d");
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener(
  "resize",
  resizeCanvas
  );
  //chack the size of canvas
  console.log("Canvas resized to", canvas.width, "x", canvas.height);



//state
let lyrics = [];
let currentTarget = null;
let targetLost = false;
let cameraX = window.innerWidth / 2;
let cameraY = window.innerHeight / 2;
let songDuration = 0;
let isPlaying = false;


//chack the initial camera position
console.log("Initial camera position:", cameraX, cameraY);


//TextAlive
player.addListener({
  onAppReady(app) {
    if (!app.managed) {
      document.querySelector("#control").className = "disabled";
      }
    if (!app.songUrl) {
      document.querySelector("#media").className = "disabled";
       player.createFromSongUrl("https://piapro.jp/t/PNpQ/20251209170719", {video: {
          // 音楽地図訂正履歴
          beatId: 4827295,
          chordId: 2963756,
          repetitiveSegmentId: 3086263,
          melodyId: 12435,

          
          lyricId: 126542,
          lyricDiffId: 29844 }});
    }
  },

  onAppMediaChange() {
    overlay.className = "";
    bar.className = "";
    resetChars();
  },

  onVideoReady(video) {
    document.querySelector("#songArtist").textContent = player.data.song.artist.name;
    document.querySelector("#songTitle").textContent = player.data.song.name;
    songDuration = video.duration;
    console.log(player.data.songMap);
    console.log(player.data.songMap.segments[0]);
    console.log(player.data.songMap.segments[0].segments[0]);
    // 最後に表示した文字の情報をリセット
    c = null;  
  },

  onTimerReady() {
    console.log("Timer is ready. Duration:", player.video.duration);
    overlay.className = "disabled",
    document.querySelector("#control").className = "far";
    document.querySelector("#control > a#play").className = "";
    document.querySelector("#control > a#stop").className = "";
    //コントロールボタン変更
    const a = document.querySelector("#control > a#play");
    while (a.firstChild) a.removeChild(a.firstChild);
    a.appendChild(document.createTextNode("▶️"));

    const b = document.querySelector("#control > a#stop");
    while (b.firstChild) b.removeChild(b.firstChild);
    b.appendChild(document.createTextNode("⏹️"));
  },


  onTimeUpdate(position) {
    // renew the seekbar
    paintedSeekbar.style.width = `${
      parseInt((position * 1000) / player.video.duration) / 10
    }%`
    

    let beat = player.findBeat(position);
    if (b !== beat) {
      if (beat) {
        requestAnimationFrame(() => {
          bar.className = "active";
          requestAnimationFrame(() => {
            bar.className = "active beat";
          });
        });
      }
      b = beat;
    }

    

    // 歌詞情報がなければこれで処理を終わる
    if (!player.video.firstChar) {
      return;
    }

    // 巻き戻っていたら歌詞表示をリセットする
    if (c && c.startTime > position + 1000) {
      resetChars();
    }

    // 500ms先に発声される文字を取得
    let current = c || player.video.firstChar;
    while (current && current.startTime < position + 500) {
      // 新しい文字が発声されようとしている
      if (c !== current) {
        newChar(current);
        c = current;
        createLyrics(player.video);
        updateTarget();
      }
      current = current.next;
    }  
  },

  
  // 楽曲の再生が始まったら呼ばれる
  onPlay() {
    const a = document.querySelector("#control > a#play");
    while (a.firstChild) a.removeChild(a.firstChild);
    a.appendChild(document.createTextNode("⏸️"));
  },

  // 楽曲の再生が止まったら呼ばれる
  onPause() {
    const a = document.querySelector("#control > a#play");
    while (a.firstChild) a.removeChild(a.firstChild);
    a.appendChild(document.createTextNode("▶️"));
  }
});


//Controls
//再生・一時停止ボタン
document.querySelector("#control > a#play").addEventListener("click", (e) => {e.preventDefault();
  if (player) {
    if (player.isPlaying) {
      player.requestPause();
    } else {
      player.requestPlay();
    }
  }
  return false;
});


//停止ボタン
document.querySelector("#control > a#stop").addEventListener("click", (e) => {
  e.preventDefault();
  if (player) {
    player.requestStop();

    // 再生を停止したら画面表示をリセットする
    bar.className = "";
    resetChars();
  }
  return false;
});

//シークバー 
seekbar.addEventListener("click", (e) => {
  e.preventDefault();
  if (player) {
    player.requestMediaSeek(
      (player.video.duration * e.offsetX) / seekbar.clientWidth
    );
  }
  return false;
});


//新しい文字の発声時に呼ばれる
function newChar(current) {
  // 品詞 (part-of-speech)
  const classes = [];
  if (
    current.parent.pos === "N" ||
    current.parent.pos === "PN" ||
    current.parent.pos === "X"
  ) {
    classes.push("noun");
  }

  // フレーズの最後の文字か否か
  if (current.parent.parent.lastChar === current) {
    classes.push("lastChar");
  }

  // 英単語の最初か最後の文字か否か
  if (current.parent.language === "en") {
    if (current.parent.lastChar === current) {
      classes.push("lastCharInEnglishWord");
    } else if (current.parent.firstChar === current) {
      classes.push("firstCharInEnglishWord");
    }
  }

  // noun, lastChar クラスを必要に応じて追加
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(current.text));

  // 文字を画面上に追加
  const container = document.createElement("div");
  container.className = classes.join(" ");
  container.appendChild(div);
  container.addEventListener("click", () => {
    player.requestMediaSeek(current.startTime);
  });
  textContainer.appendChild(container);
}

//歌詞表示をリセットする
function resetChars() {
  c = null;
  while (textContainer.firstChild)
    textContainer.removeChild(textContainer.firstChild);
}








//歌詞オブジェクトの作成

function createLyrics(video) {

  // 二重生成防止
  lyrics = [];
  // 既存歌詞DOM削除
  textContainer.innerHTML = "";
  let current = video.firstWord;

  while (current) {
    const span = document.createElement("span");
    span.className = "lyric";
    span.textContent = current.text;
    const noun = isNoun(current);
    if (noun) {
      span.classList.add("noun");
    }
    const y = 80 + Math.random() * (window.innerHeight - 180);
    span.style.top = y + "px";
    span.style.left = window.innerWidth + "px";
    span.style.display = "none";
    textContainer.appendChild(span);
    lyrics.push({
      word: current,
      element: span,
      isNoun: noun,
      x:window.innerWidth + Math.random() * 800,
      y, speed: 2.5 + Math.random() * 1.5,
      phase:Math.random() *Math.PI * 2,
      visible: false,
      hit: false
    });
    current = current.next;
  }
  console.log("Lyrics data:", nouns);
}

// 歌詞更新

function updateLyrics(position) {
  lyrics.forEach(obj => {
    if (!obj.visible) return;
      if (position < obj.word.startTime ) {
       obj.element.style.display = "none";
        return;
      }
      obj.visible = true;
      obj.element.style.display = "block";
      obj.x -= obj.speed;
      const offset = Math.sin( performance.now() * 0.005 + obj.phase ) * 10;
      obj.element.style.top = (obj.y + offset) + "px";
      obj.element.style.left = obj.x + "px";
      obj.element.style.top = obj.y + "px";
      if (obj.x < -300  ) {
        obj.element.style.display =  "none";
      }
  });
}

//ミクリン追従

function updateTarget() {
  if (currentTarget &&currentTarget.x > -250) {
    return;
  }
  currentTarget = null;
  const nextNoun = lyrics.find( lyric =>
        lyric.isNoun &&
        lyric.visible &&
        lyric.x >
        window.innerWidth * 0.7
    );
  if (nextNoun) { currentTarget = nextNoun;
  }
}

//ミクリン
function updateMikuRin() {
  if (!currentTarget) {
    mikuRin.style.display ="none";
    return;
  }
  mikuRin.style.display = "block";
  const x = currentTarget.x + currentTarget.element.offsetWidth + 10;
  const y = currentTarget.y - 10;
  mikuRin.style.left = x + "px";
  mikuRin.style.top = y + "px";
}

//カメラ
camera.style.left = cameraX + "px";
camera.style.top = cameraY + "px";
document.addEventListener("mousemove", e => {
    cameraX = e.clientX;
    cameraY = e.clientY;
    updateCamera();
  }
);

document.addEventListener("keydown", e => { 
  const speed = 20;
    switch (e.key) {
      case "ArrowUp":
        cameraY -= speed;
        break;
      case "ArrowDown":
        cameraY += speed;
        break;
      case "ArrowLeft":
        cameraX -= speed;
        break;
      case "ArrowRight":
        cameraX += speed;
        break;
    }
    cameraX = Math.max(0, Math.min(window.innerWidth, cameraX));
    cameraY = Math.max(0, Math.min(window.innerHeight, cameraY));
    updateCamera();
  }
);


//Trail Data
let trail = [];
let hitPoints = [];
let shotCount = 0;
let ended = false;

//Camera Trail
function updateCamera() {
  camera.style.left = cameraX + "px";
  camera.style.top =  cameraY + "px";
  trail.push({x: cameraX,y: cameraY
  });
  if (trail.length > 6000) {trail.shift();
  }
}

//Draw Trail

function drawTrail() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (trail.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = "#ffee33";
    ctx.lineWidth = 4;
    ctx.moveTo(trail[0].x, trail[0].y
    );

    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x,trail[i].y);
    }
    ctx.stroke();
  }

  hitPoints.forEach(p => {
    ctx.beginPath();
    ctx.fillStyle = "#ff8800";
    ctx.arc(p.x,p.y, 8,0,Math.PI * 2
    );
    ctx.fill();
  });
}

//衝突判定

function detectCollision() {
  lyrics.forEach(obj => {
    if (  obj.element.style.display === "none") {
      return;
    }

    const rect = obj.element.getBoundingClientRect();
    const cameraRect = camera .getBoundingClientRect();
    const cameraRight = cameraRect.right;
    const hit =
      cameraRight >= rect.left &&
      cameraRight <= rect.left + 20 &&
      cameraRect.top <= rect.bottom &&
      cameraRect.bottom >= rect.top;

    if (hit &&!obj.hit ) {
      obj.hit = true;
      onShot(obj);
    }

    if (!hit && obj.hit
    ) { obj.hit = false;
    }

  });

}

//Shot

function onShot(obj) {
  shotCount++;
  counter.textContent =shotCount + "枚";
  hitPoints.push({x: cameraX, y: cameraY});
  showFlash();
  if (currentTarget &&
    obj === currentTarget
  ) {
    showHeart();
  }

}

//Flash

function showFlash() {
  flash.style.display = "block";
  flash.style.left = (cameraX + 40) + "px";
  flash.style.top = cameraY + "px";
  setTimeout(() => {
    flash.style.display = "none";
  }, 1000);

}

//Heart

function showHeart() {
  heart.style.display = "block";
  heart.style.left = cameraX + "px";
  heart.style.top =  (cameraY - 50) + "px";
  setTimeout(() => {
    heart.style.display = "none"; 
  }, 1000);

}

//Background

function updateBackground(position) {
  let inChorus = false;
  try {
    if ( player.video && player.video.findChorus ) {
      inChorus = !!player.video.findChorus(position);
    }

  } catch(e) {}

  if (inChorus) { bg.style.backgroundImage =  'url("../images/背景_2.png")';

  } else {bg.style.backgroundImage = 'url("../images/背景_1.png")';

  }

}

//Song End Check

function checkSongEnd(position) {
  if (ended)
    return;
  if (songDuration > 0 &&  position >= songDuration - 500
  ) {ended = true;
    endPerformance();
  }
}

//End Performance

function endPerformance() {
  bg.style.backgroundImage =
    'url("../images/背景_3.png")';
  document
    .getElementById( "endScreen")
    .style.display = "flex";
  drawResultView();
}

//Result 
function drawResultView() {
  ctx.clearRect(0,0, canvas.width, canvas.height);
  const scale = 0.45;
  ctx.save();
  ctx.scale(
    scale,
    scale
  );

  ctx.beginPath();
  ctx.strokeStyle = "#ffee33";
  ctx.lineWidth = 6;
  if (trail.length > 1) {
    ctx.moveTo(
      trail[0].x,
      trail[0].y
    );

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

  hitPoints.forEach(p => {ctx.beginPath();
     ctx.fillStyle = "#ff6600";
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

//Replay

document
  .getElementById("reloadButton")
  .addEventListener("click",() => {location.reload();} );

//Main Animation
function gameLoop() {
  drawTrail();
  detectCollision();
  requestAnimationFrame(gameLoop);
}
gameLoop();




//名詞判定
function isNoun(wordObj) {
  if (!wordObj || !wordObj.parent) {
    return false;
  }
  const pos = wordObj.parent.pos;
  return (
    pos === "N" ||
    pos === "PN" ||
    pos === "X"
  );
}

