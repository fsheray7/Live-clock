// Helpers are updated in previous block, removing old definitions to avoid duplicates if any. 
// Actually, I need to make sure I don't leave the old function definitions at the top of the file 
// if I replaced them in the 'update' block? 
// Wait, my previous tool call replaced the 'update' function AND re-defined the helpers below it?
// Let me check my previous replacement content...
// Yes, I redefined updateDigitalClock and updateAnalogClock inside the replacement block for 'update'.
// BUT, the original file had them at lines 2-15 and 18-31.
// My previous REPLACE targeted lines 118-134 (the update loop).
// So now I have duplicate function definitions? 
// No, I need to remove the OLD definitions at the top of the file.


// ==========================
// TICKING SOUND
// ==========================

let audioContext = null;
let isMuted = false; // Default ON
const soundToggle = document.getElementById('sound-toggle');
const soundIcon = soundToggle.querySelector('.icon');
const soundText = soundToggle.querySelector('.text');

// Initialize Audio Context
function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Try to auto-start on load (Best effort for "High Engagement" users)
window.addEventListener('load', () => {
  initAudio();
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {
      // Expected failure in Chrome/Edge until user interacts
      console.log("Autoplay blocked by browser policy. Waiting for interaction.");
    });
  }
});

// Auto-start audio on first user interaction (Fallback)
document.addEventListener('click', function enableAudio() {
  initAudio();
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}, { once: false });

// Play Tick Sound
function playTick() {
  if (isMuted) return;

  // Try to init if missing
  if (!audioContext) initAudio();

  // If still suspended, try to resume (silently fail if blocked)
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => { });
    // Don't return, let it try to play (it might queue or fail, but we attempted)
  }

  if (!audioContext) return;

  if (isMuted || !audioContext) return;
  if (audioContext.state === 'suspended') {
    // Try resume, might fail without gesture
    audioContext.resume().catch(() => { });
    return;
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  // Create a short, sharp "tick"
  // Mechanical Ticking sound: Bandpass noise or simple oscillator pulse

  // Using a filtered noise burst or quick sine pulse
  osc.type = 'square';
  osc.frequency.setValueAtTime(1000, audioContext.currentTime); // High pitch click

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

// Sound Toggle Event
soundToggle.addEventListener('click', () => {
  initAudio();
  isMuted = !isMuted;

  if (isMuted) {
    soundToggle.classList.remove('active');
    soundIcon.textContent = '🔇';
    soundText.textContent = 'Sound Off';
  } else {
    soundToggle.classList.add('active');
    soundIcon.textContent = '🔊';
    soundText.textContent = 'Sound On';
    // Resume context if needed
    if (audioContext.state === 'suspended') audioContext.resume();
  }
});


// UPDATE CLOCKS VARIOUS
let lastSecond = -1;

function update() {
  const now = new Date(); // Single source of truth for this frame

  // Pass 'now' to functions so they render exact same time
  updateDigitalClock(now);
  updateAnalogClock(now);

  const currentSecond = now.getSeconds();

  if (currentSecond !== lastSecond) {
    lastSecond = currentSecond;
    playTick(); // Play sound exactly on the second change
  }

  requestAnimationFrame(update);
}

// Update helpers to accept date argument
function updateDigitalClock(now) {
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  document.getElementById('timer').textContent =
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date').textContent = now.toLocaleDateString(undefined, options);
}

function updateAnalogClock(now) {
  // Use milliseconds for smoother movement if desired, or stick to integers for ticking look
  // User wanted "perfect sync", keeping default per-second or per-frame logic is fine.
  // Actually, requestAnimationFrame runs 60fps.
  // To keep them strictly synced visually, using the same 'now' is key.

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  // Optional: smooth second hand? 
  // const ms = now.getMilliseconds();
  // const secondDeg = (seconds + ms/1000) * 6; 
  // Standard ticking look:
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  document.getElementById('second-hand').style.transform = `rotate(${secondDeg}deg)`;
  document.getElementById('minute-hand').style.transform = `rotate(${minuteDeg}deg)`;
  document.getElementById('hour-hand').style.transform = `rotate(${hourDeg}deg)`;
}

// Start loop
requestAnimationFrame(update);


// NAVBAR & UI
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
  });
}
