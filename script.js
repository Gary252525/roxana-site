// ---------- Tiny retro click sound (no files) ----------
let audioCtx;
function blip() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "square";
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
    o.stop(audioCtx.currentTime + 0.09);
  } catch {}
}

// ---------- Optional background music ----------
const musicBtn = document.getElementById("musicBtn");
let music;
let musicEnabled = false;
async function initMusic() {
  if (music) return;
  music = new Audio("assets/glaive.mp3"); // put your mp3 here
  music.loop = true;
  music.volume = 0.05;
  musicBtn.classList.remove("hidden");
}
async function toggleMusic() {
  blip();
  try {
    await initMusic();
    if (!musicEnabled) {
      await music.play(); // may require user gesture (we call this on click)
      musicEnabled = true;
      musicBtn.textContent = "♫ on";
    } else {
      music.pause();
      musicEnabled = false;
      musicBtn.textContent = "♫";
    }
  } catch {
    // If file missing or autoplay blocked, just hide the button
    musicBtn.classList.add("hidden");
  }
}
musicBtn.addEventListener("click", toggleMusic);

// ---------- Hearts background (10 total) ----------
const heartsLayer = document.getElementById("hearts-layer");
const heartChars = ["💗", "💖", "💞", "💕", "💘", "💓"];

function spawnHearts(count = 10) {
  heartsLayer.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    h.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];
    const left = Math.random() * 100;
    const dur = 7 + Math.random() * 7;
    const delay = Math.random() * 4;
    const size = 18 + Math.random() * 18;
    h.style.left = `${left}vw`;
    h.style.animationDuration = `${dur}s`;
    h.style.animationDelay = `${delay}s`;
    h.style.fontSize = `${size}px`;
    heartsLayer.appendChild(h);
  }
}
spawnHearts(10);

// ---------- Confetti (simple canvas) ----------
const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");
let W, H;
function resize() {
  W = confettiCanvas.width = window.innerWidth * devicePixelRatio;
  H = confettiCanvas.height = window.innerHeight * devicePixelRatio;
}
window.addEventListener("resize", resize);
resize();

let confetti = [];
function confettiBurst(amount = 90) {
  const cx = W * 0.5;
  const cy = H * 0.35;
  for (let i = 0; i < amount; i++) {
    confetti.push({
      x: cx + (Math.random() - 0.5) * 60,
      y: cy + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 18,
      vy: -Math.random() * 14 - 6,
      g: 0.6 + Math.random() * 0.4,
      r: 6 + Math.random() * 10,
      a: 1,
      spin: (Math.random() - 0.5) * 0.25,
      rot: Math.random() * Math.PI * 2
    });
  }
}
function tickConfetti() {
  ctx.clearRect(0, 0, W, H);
  confetti = confetti.filter(p => p.a > 0.02);
  for (const p of confetti) {
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.spin;
    p.a *= 0.985;

    // random bright-ish colors without hardcoding a palette
    const hue = (Math.random() * 360) | 0;
    ctx.save();
    ctx.globalAlpha = p.a;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = `hsl(${hue} 85% 65%)`;
    ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
    ctx.restore();
  }
  requestAnimationFrame(tickConfetti);
}
tickConfetti();

// ---------- Game state ----------
const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
const buttonsEl = document.getElementById("buttons");
const livesEl = document.getElementById("lives");
const inputRow = document.getElementById("inputRow");
const textAnswer = document.getElementById("textAnswer");
const submitText = document.getElementById("submitText");

let lives = 3;
let questionIndex = -1;

function setLives(n) {
  lives = n;
  livesEl.textContent = "❤️".repeat(lives);
}
function loseLife() {
  lives -= 1;
  setLives(lives);
  document.querySelector(".card").classList.add("shake");
  setTimeout(() => document.querySelector(".card").classList.remove("shake"), 380);

  if (lives <= 0) {
    // full reset
    setTimeout(() => location.reload(), 450);
  }
}

function clearUI() {
  buttonsEl.innerHTML = "";
  inputRow.classList.add("hidden");
  textAnswer.value = "";
}

function addButton(label, onClick, opts = {}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn ${opts.primary ? "primary" : ""}`.trim();
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    blip();
    onClick(e, btn);
  });
  buttonsEl.appendChild(btn);
  return btn;
}

// Make a "No" button that runs away
function makeRunaway(btn) {
  btn.style.position = "relative";
  const move = () => {
    const card = document.querySelector(".card");
    const rect = card.getBoundingClientRect();

    // Keep it inside the card-ish area
    const maxX = rect.width - 160;
    const maxY = rect.height - 160;

    const x = 20 + Math.random() * Math.max(40, maxX);
    const y = 40 + Math.random() * Math.max(60, maxY);

    btn.style.position = "fixed";
    btn.style.left = `${rect.left + x}px`;
    btn.style.top = `${rect.top + y}px`;
    btn.style.zIndex = 10;
  };

  // Move when you try to hover it or touch it
  btn.addEventListener("mouseenter", move);
  btn.addEventListener("mouseover", move);
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    move();
  }, { passive: false });
}

const questions = [
  {
    title: "Question 1:",
    text: "Fries with?",
    type: "choices",
    choices: ["ketchup", "mayonaise", "yummy barbecue sauce", "garlic sauce"],
    correct: "ketchup"
  },
  {
    title: "Question 2:",
    text: "What was the exact date we got together:",
    type: "choices",
    choices: ["28th of october", "28th of november", "14th of november", "18th of november"],
    correct: "28th of november"
  },
  {
    title: "Question 3:",
    text: "whos your favourite person",
    type: "choices",
    choices: ["MIKE", "ray", "xi jinping", "MEEE"],
    correct: "MEEE"
  },
  {
    title: "Question 4:",
    text: "what 2 numbers represent us",
    type: "text",
    correctText: "25"
  },
  {
    title: "Question 5:",
    text: "What song is playing right now?",
    type: "choices",
    choices: [
      "Blinding lights",
      "I love you and it sounds stupid",
      "little bit",
      "hello juliet"
    ],
    correct: "I love you and it sounds stupid"
  }
];

function renderIntro() {
  setLives(3);
  questionIndex = -1;
  titleEl.textContent = "Hiiiiiii Roxana!!!!!!!!!!!!";
  subtitleEl.textContent = "";
  clearUI();

  addButton("HIII?", () => {
    renderGameInvite();
  }, { primary: true });

  // Try to show music toggle if mp3 exists (won't break if missing)
  // We only reveal once a user interacts
  document.addEventListener("click", () => initMusic().catch(() => {}), { once: true });
}

function renderGameInvite() {
  clearUI();
  titleEl.textContent = "Hiiiiiii Roxana!!!!!!!!!!!!";
  subtitleEl.textContent = "i made a game and UR GONNA PLAY IT WITH ME okay?";

  const yesBtn = addButton("YESSSS", () => {
    subtitleEl.textContent = "YESSSS YES OKAY GET READY";
    confettiBurst(60);
    setTimeout(() => startQuestions(), 650);
  }, { primary: true });

  const noBtn = addButton("no", () => {
    // should never happen because it runs away, but just in case:
    blip();
  });

  makeRunaway(noBtn);

  // small extra: make "no" instantly run away on render
  //setTimeout(() => {
    //const ev = new Event("mouseenter");
    //noBtn.dispatchEvent(ev);
 // }, 250);
}

function startQuestions() {
  questionIndex = 0;
  renderQuestion();
}

function renderQuestion() {
  clearUI();
  const q = questions[questionIndex];

  titleEl.textContent = q.title;
  subtitleEl.textContent = q.text;

  if (q.type === "choices") {
    // shuffle choices lightly but keep order as given (you can change if you want)
    q.choices.forEach(choice => {
      addButton(choice, () => {
        if (choice === q.correct) {
          confettiBurst(40);
          questionIndex += 1;
          if (questionIndex >= questions.length) {
            renderValentine();
          } else {
            renderQuestion();
          }
        } else {
          loseLife();
        }
      }, { primary: false });
    });
  } else {
    inputRow.classList.remove("hidden");
    textAnswer.focus();

    const check = () => {
      const val = (textAnswer.value || "").trim();
      if (val === q.correctText) {
        confettiBurst(50);
        questionIndex += 1;
        
            if (questionIndex >= questions.length) {
             renderValentine();
        } else {
            renderQuestion();
    }
      } else {
        loseLife();
        textAnswer.value = "";
        textAnswer.focus();
      }
    };

    submitText.onclick = check;
    textAnswer.onkeydown = (e) => {
      if (e.key === "Enter") check();
    };

    // Put a single button under the input row too (for symmetry)
    buttonsEl.innerHTML = "";
  }
}

function renderValentine() {
  clearUI();
  titleEl.textContent = "Will you be my Valentine? 💘";
  subtitleEl.textContent = "";

  const yesBtn = addButton("YESSSS", () => {
    confettiBurst(160);
    titleEl.textContent = "YAAYYYY I KNEW YOU'D SAY YES!! 💗💗💗";
    subtitleEl.textContent = "I love you so so much you genuinely mean the world to me. Now open the gifts!!!";
    clearUI();
  }, { primary: true });

  const noBtn = addButton("no", () => {});
  makeRunaway(noBtn);
}

// Start

renderIntro();



