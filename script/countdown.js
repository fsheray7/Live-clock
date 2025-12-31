let countdown;
let totalSeconds = 0;
let remainingSeconds = 0;
let isRunning = false;

const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");

function updateTimerDisplay() {
  const hrs = Math.floor(remainingSeconds / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);
  const secs = remainingSeconds % 60;
  timerDisplay.textContent = 
    `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

function startCountdown() {
  if (isRunning) return;
  
  const h = parseInt(document.getElementById("hours").value) || 0;
  const m = parseInt(document.getElementById("minutes").value) || 0;
  const s = parseInt(document.getElementById("seconds").value) || 0;

  totalSeconds = h * 3600 + m * 60 + s;
  remainingSeconds = totalSeconds;

  if (remainingSeconds <= 0) return;

  isRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;

  updateTimerDisplay();

  countdown = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      clearInterval(countdown);
      isRunning = false;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      resetBtn.disabled = true;
      alert("Time's up!");
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
  remainingSeconds = totalSeconds;
  updateTimerDisplay();
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
}

startBtn.addEventListener("click", startCountdown);
pauseBtn.addEventListener("click", pauseCountdown);
resetBtn.addEventListener("click", resetCountdown);




 

  // Toggle menu on small screens
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });


