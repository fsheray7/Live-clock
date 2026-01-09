let countdown;
let totalSeconds = 0;
let remainingSeconds = 0;
let isRunning = false;

// Audio
let audioContext = null;
let isMuted = false;

const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");

// Initialize Audio Context
function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Play Ticking Sound
function playTick() {
  if (isMuted || !audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => { });

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  osc.type = 'square';
  osc.frequency.setValueAtTime(1000, audioContext.currentTime);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(500, audioContext.currentTime);

  gain.gain.setValueAtTime(0.05, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.05);
}

// Play Notification Sound (Digital Beep)
function playNotificationSound() {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  const now = audioContext.currentTime;

  // Digital Alarm Beep Sequence
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, now);

  // Pattern: Beep-Beep-Beep
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.setValueAtTime(0, now + 0.1);
  gain.gain.setValueAtTime(0.1, now + 0.2);
  gain.gain.setValueAtTime(0, now + 0.3);
  gain.gain.setValueAtTime(0.1, now + 0.4);
  gain.gain.setValueAtTime(0, now + 0.5);

  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 0.6);
}

function updateTimerDisplay() {
  const hrs = Math.floor(remainingSeconds / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);
  const secs = remainingSeconds % 60;
  timerDisplay.textContent =
    `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Auto-start audio context on user interaction
document.addEventListener('click', function enableAudio() {
  initAudio();
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}, { once: false });

function startCountdown() {
  if (isRunning) return;

  const h = parseInt(document.getElementById("hours").value) || 0;
  const m = parseInt(document.getElementById("minutes").value) || 0;
  const s = parseInt(document.getElementById("seconds").value) || 0;

  const inputTotal = h * 3600 + m * 60 + s;

  if (inputTotal === 0 && remainingSeconds === 0) return;

  const newTotal = inputTotal;

  if (remainingSeconds > 0 && remainingSeconds < totalSeconds && newTotal === totalSeconds) {
    // Resume
  } else {
    // Start Fresh
    totalSeconds = newTotal;
    remainingSeconds = totalSeconds;
  }

  if (remainingSeconds <= 0) return;

  initAudio(); // Ensure audio ready

  isRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;

  updateTimerDisplay();
  playTick();

  countdown = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();

    if (remainingSeconds > 0) {
      playTick();
    }

    if (remainingSeconds <= 0) {
      clearInterval(countdown);
      isRunning = false;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      resetBtn.disabled = true;

      playNotificationSound();
    }
  }, 1000);
}

function pauseCountdown() {
  clearInterval(countdown);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function resetCountdown() {
  clearInterval(countdown);
  remainingSeconds = 0;
  totalSeconds = 0;
  updateTimerDisplay();

  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
}

startBtn.addEventListener("click", startCountdown);
pauseBtn.addEventListener("click", pauseCountdown);
resetBtn.addEventListener("click", resetCountdown);


// Navbar Logic
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
  });
}
