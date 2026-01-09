// ==========================
// ALARM FUNCTIONALITY
// ==========================
let alarms = [];
let audioContext = null;
let currentOscillators = [];
let isRinging = false;
let editIndex = -1;

const alarmTimeInput = document.getElementById('alarm-time');
const alarmDateInput = document.getElementById('alarm-date');
const setAlarmBtn = document.getElementById('set-alarm');
const alarmList = document.getElementById('alarm-list');

// New UI Elements
const dayBtns = document.querySelectorAll('.day-btn');
const btnEveryday = document.getElementById('btn-everyday');
const btnWeekend = document.getElementById('btn-weekend');
const btnWeekdays = document.getElementById('btn-weekdays');
const soundSelect = document.getElementById('alarm-sound');
const previewBtn = document.getElementById('preview-sound');

// Modal Elements
const alarmModal = document.getElementById('alarm-modal');
const alarmDisplayTime = document.getElementById('alarm-display-time');
const snoozeBtn = document.getElementById('snooze-btn');
const stopBtn = document.getElementById('stop-btn');

// State
let selectedDays = []; // 0=Sun, 6=Sat

// Load Alarms on Start
loadAlarms();

function loadAlarms() {
  const stored = localStorage.getItem('alarms');
  if (stored) {
    alarms = JSON.parse(stored);
    renderAlarms();
  }
}

function saveAlarms() {
  localStorage.setItem('alarms', JSON.stringify(alarms));
  renderAlarms();
}

// ==========================
// SOUND ENGINE
// ==========================
function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Auto-start audio context on any user interaction (Browser Policy)
document.addEventListener('click', function enableAudio() {
  initAudio();
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}, { once: false });

// Sound Generators
const alarmSounds = {
  classic: (ctx, dest, time) => {
    // Classic Mechanical Alarm "Brrrrring"
    // Metallic noise modulated by a rapid sine wave
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Carrier: Metallic Clang (High freq square/sawtooth mix)
    // Actually simpler: Square wave heavily modulated
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, time);

    // AM Modulation (The "Ringing" capability)
    const am = ctx.createOscillator();
    am.type = 'triangle';
    am.frequency.value = 20; // 20Hz rattle
    const amGain = ctx.createGain();
    amGain.gain.value = 1000; // Depth

    am.connect(amGain);
    amGain.connect(osc.frequency); // FM actually here, gives a gritty sound

    gain.gain.setValueAtTime(0.3, time);

    // Envelope for a "Ring... Ring..." pattern handled by loop 1.5s is too slow? 
    // Mechanical alarms ring continuous. Let's make it continuous for 1s.

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    am.start(time);
    osc.stop(time + 1.2);
    am.stop(time + 1.2);
    return [osc, am];
  },

  digital: (ctx, dest, time) => {
    // Standard Casio-style Beep-Beep-Beep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000, time); // High pitch

    // Pattern: Beep (0.1) - Silence (0.1) - Beep (0.1) - Silence (0.1)...
    const t = time;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.setValueAtTime(0, t + 0.1);
    gain.gain.setValueAtTime(0.1, t + 0.2);
    gain.gain.setValueAtTime(0, t + 0.3);
    gain.gain.setValueAtTime(0.1, t + 0.4);
    gain.gain.setValueAtTime(0, t + 0.5);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.6);
    return [osc];
  },

  phone: (ctx, dest, time) => {
    // Old Landline Phone "Ring Ring"
    // Sum of 2 sine waves: 440Hz + 480Hz modulated by 20Hz
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();

    osc1.frequency.value = 440;
    osc2.frequency.value = 480;

    // Amplitude Modulation (Tremolo)
    mod.frequency.value = 20;
    modGain.gain.value = 0.5;

    // Ring pattern: 2s ON, 4s OFF. (We simulate 1 burst here)

    mod.connect(modGain);
    // This is tricky to set up simple AM with nodes in one block without deeper structure
    // Simplified: Just mix the two frequencies and pulse volume

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.1);
    gain.gain.setValueAtTime(0.3, time + 1.0);
    gain.gain.linearRampToValueAtTime(0, time + 1.1);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 1.2);
    osc2.stop(time + 1.2);
    return [osc1, osc2];
  },

  ship: (ctx, dest, time) => {
    // Ship Bell / Service Bell "Ding-Ding"
    // Single dense FM bell tone played twice
    function bellHit(t) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 1200; // High metallic
      gain.gain.setValueAtTime(0, t);
      gain.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 1.0);
    }
    bellHit(time);
    bellHit(time + 0.3); // Double ding
    return []; // We can't track these easily in this array structure, but they self-stop
  },

  piano: (ctx, dest, time) => {
    // Piano Major Chord Arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle'; // Closer to piano than sine
      osc.frequency.value = freq;

      const t = time + i * 0.15;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 1.5);
    });
    return [];
  },

  harp: (ctx, dest, time) => {
    // Fast Harp Glissando
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
    scale.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = time + i * 0.05; // Very fast
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 2.0);
    });
    return [];
  },

  rooster: (ctx, dest, time) => {
    // Hard to synth realistically. Attempting "Crow" pattern
    // Sawtooth wave sweeping pitch up then down
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    // Err-errr-errrrr-errrrrr
    // Pitch envelope: 
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.linearRampToValueAtTime(800, time + 0.2); // First crow
    osc.frequency.linearRampToValueAtTime(600, time + 0.3);

    osc.frequency.linearRampToValueAtTime(900, time + 0.5); // Second
    osc.frequency.linearRampToValueAtTime(600, time + 1.5); // Long Decay

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.1);
    gain.gain.linearRampToValueAtTime(0.2, time + 1.0);
    gain.gain.linearRampToValueAtTime(0, time + 1.5);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 1.5);
    return [osc];
  },

  // Themes handled via MP3 now
};


let currentAudioObj = null; // Track HTML5 Audio


// ==========================
// AUDIO ENGINE UTILS
// ==========================

// Helper: Stop any active audio sources without touching UI
function stopAudioSource() {
  // Stop HTML5 Audio
  if (currentAudioObj) {
    currentAudioObj.pause();
    currentAudioObj.currentTime = 0;
    currentAudioObj = null;
  }

  // Stop Web Audio Loop
  if (window.alarmLoop) clearInterval(window.alarmLoop);

  // Force stop oscillators if we can track them
  // We can't strictly stop "fire and forget" oscillators easily without tracking them all.
  // But suspending the context works as a global mute/stop.
  // However, we need to be careful not to break future plays.
  // A simple suspend/resume might cut off tails, which is fine for "Stop".
  // But for "Play new sound", we need context running.
  // Let's just rely on the fact that most non-looping synths are short.
}

function playSound(soundName, loop = false) {
  // Stop previous audio only (don't reset UI)
  stopAudioSource();

  // Custom Themes (MP3)
  const themes = ['pirates', 'got', 'johnwick'];
  if (themes.includes(soundName)) {
    currentAudioObj = new Audio(`audio/${soundName}.mp3`);
    currentAudioObj.loop = loop;

    currentAudioObj.onerror = () => {
      console.warn(`Audio file for ${soundName} not found. Playing fallback.`);
      currentAudioObj = null;
      playSynthSound('digital', loop);
    };

    currentAudioObj.play().catch(e => console.error("Audio Play Error:", e));
    return;
  }

  // Synthesized Sounds (Web Audio)
  playSynthSound(soundName, loop);
}

function playSynthSound(soundName, loop) {
  initAudio();
  if (audioContext.state === 'suspended') audioContext.resume();

  const generator = alarmSounds[soundName] || alarmSounds['digital'];
  const now = audioContext.currentTime;

  // We don't track oscillator nodes for stop() individually here, 
  // relying on natural decay or context suspend for "Stop".
  // Generator returns array of nodes, we could store them if we wanted precise stop.
  currentOscillators = generator(audioContext, audioContext.destination, now);

  if (loop) {
    window.alarmLoop = setInterval(() => {
      if (!isRinging && !isPreviewing) { clearInterval(window.alarmLoop); return; }
      generator(audioContext, audioContext.destination, audioContext.currentTime);
    }, 1500);
  }
}

// Full Stop (Audio + UI)
function stopAlarmSound() {
  stopAudioSource();

  // Reset Preview UI
  if (isPreviewing) {
    isPreviewing = false;
    previewBtn.textContent = '▶';
    previewBtn.classList.remove('playing');
  }

  // Suspend context to kill long tails of synth sounds
  if (audioContext && audioContext.state === 'running') {
    audioContext.suspend();
  }
}

// Preview Sound Logic
let isPreviewing = false;

previewBtn.addEventListener('click', () => {
  if (isPreviewing) {
    // User clicked STOP (■)
    stopAlarmSound();
  } else {
    // User clicked PLAY (▶)
    const sound = soundSelect.value;

    // Update UI State first
    isPreviewing = true;
    previewBtn.textContent = '■';
    previewBtn.classList.add('playing');

    // Ensure AudioContext is ready
    initAudio(); // Initialize if null
    if (audioContext.state === 'suspended') audioContext.resume();

    // Play the sound (this now calls stopAudioSource internally, but NOT stopAlarmSound, so UI stays 'Playing')
    playSound(sound, false);

    // Auto-Reset UI when done
    if (currentAudioObj) {
      // For MP3s
      currentAudioObj.onended = () => {
        // Only reset if we are still strictly in that preview state (simplification)
        stopAlarmSound();
      };
    } else {
      // For Synths (timer based)
      setTimeout(() => {
        if (isPreviewing && !currentAudioObj) stopAlarmSound();
      }, 2000);
    }
  }
});

// ==========================
// UI LOGIC
// ==========================

// Handle Day Toggles
dayBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const day = parseInt(btn.dataset.day);
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter(d => d !== day);
      btn.classList.remove('active');
    } else {
      selectedDays.push(day);
      btn.classList.add('active');
    }
    // Clear Date Input if days are selected
    if (selectedDays.length > 0) {
      alarmDateInput.value = '';
    }
  });
});

// Handle Quick Select
btnEveryday.addEventListener('click', () => {
  selectedDays = [0, 1, 2, 3, 4, 5, 6];
  updateDayUI();
  alarmDateInput.value = '';
});

btnWeekend.addEventListener('click', () => {
  selectedDays = [0, 6];
  updateDayUI();
  alarmDateInput.value = '';
});

btnWeekdays.addEventListener('click', () => {
  selectedDays = [1, 2, 3, 4, 5]; // Mon-Fri
  updateDayUI();
  alarmDateInput.value = '';
});

function updateDayUI() {
  dayBtns.forEach(btn => {
    const day = parseInt(btn.dataset.day);
    if (selectedDays.includes(day)) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

// Clear Days if Date is picked
alarmDateInput.addEventListener('change', () => {
  if (alarmDateInput.value) {
    selectedDays = [];
    updateDayUI();
  }
});

// Set or Update Alarm
setAlarmBtn.addEventListener('click', () => {
  const time = alarmTimeInput.value;
  const date = alarmDateInput.value;
  const sound = soundSelect.value;

  // Validation
  if (!time) {
    alert('Please select a time.');
    return;
  }

  if (!date && selectedDays.length === 0) {
    alert('Please select a date OR repeat days.');
    return;
  }

  const alarmData = {
    time,
    sound,
    type: date ? 'one-time' : 'recurring',
    date: date || null,
    days: date ? [] : [...selectedDays]
  };

  if (editIndex > -1) {
    alarms[editIndex] = alarmData;
    editIndex = -1;
    setAlarmBtn.textContent = 'Set Alarm';
  } else {
    alarms.push(alarmData);
  }

  saveAlarms();

  // Reset UI
  alarmTimeInput.value = '';
  alarmDateInput.value = '';
  selectedDays = [];
  updateDayUI();
  soundSelect.value = 'digital';
});

// ==========================
// RENDER & LIST
// ==========================

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function renderAlarms() {
  alarmList.innerHTML = '';
  alarms.forEach((alarm, index) => {
    const div = document.createElement('div');
    div.classList.add('alarm-item');

    // Format Display
    let info = '';
    if (alarm.type === 'one-time') {
      info = `<span class="alarm-date">${alarm.date}</span>`;
    } else {
      // Recurring
      if (alarm.days.length === 7) info = 'Everyday';
      else if (alarm.days.length === 2 && alarm.days.includes(0) && alarm.days.includes(6)) info = 'Weekend';
      else if (alarm.days.length === 5 && !alarm.days.includes(0) && !alarm.days.includes(6)) info = 'Weekdays';
      else {
        info = alarm.days.map(d => dayNames[d]).join(', ');
      }
      info = `<span class="alarm-days">${info}</span>`;
    }

    const soundName = alarm.sound ? alarm.sound.charAt(0).toUpperCase() + alarm.sound.slice(1) : 'Beep';

    div.innerHTML = `
      <div class="alarm-info">
        <span class="alarm-time">${alarm.time}</span>
        ${info}
        <span class="alarm-sound-badge">🎵 ${soundName}</span>
      </div>
      <div class="actions">
        <button class="edit-btn" onclick="editAlarm(${index})">Edit</button>
        <button class="delete-btn" onclick="removeAlarm(${index})">Delete</button>
      </div>
    `;
    alarmList.appendChild(div);
  });
}

// Remove Alarm
window.removeAlarm = function (index) {
  alarms.splice(index, 1);
  saveAlarms();
  if (editIndex === index) resetEdit();
};

function resetEdit() {
  editIndex = -1;
  setAlarmBtn.textContent = 'Set Alarm';
  alarmTimeInput.value = '';
  alarmDateInput.value = '';
  selectedDays = [];
  updateDayUI();
}

// Edit Alarm
window.editAlarm = function (index) {
  const alarm = alarms[index];
  alarmTimeInput.value = alarm.time;

  if (alarm.type === 'one-time') {
    alarmDateInput.value = alarm.date;
    selectedDays = [];
  } else {
    alarmDateInput.value = '';
    selectedDays = [...alarm.days];
  }
  updateDayUI();

  if (alarm.sound) soundSelect.value = alarm.sound;

  editIndex = index;
  setAlarmBtn.textContent = 'Update Alarm';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ==========================
// ALARM CHECK LOOP
// ==========================
setInterval(() => {
  if (isRinging) return;

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5);
  const currentDate = now.toISOString().split('T')[0];
  const currentDay = now.getDay();

  alarms.forEach((alarm, i) => {
    if (alarm.time === currentTime) {
      // Check logic
      let shouldRing = false;

      if (alarm.type === 'one-time') {
        if (alarm.date === currentDate) shouldRing = true;
      } else {
        // Recurring
        if (alarm.days.includes(currentDay)) {
          // Prevent re-ringing in the same minute? 
          // We need a helper to verify we haven't rung this minute.
          // But array splicing for one-time removes it. 
          // Recurring alarms should use a "last trigger" timestamp to avoid loops?
          // Simple hack: check seconds 0? Or just store lastTriggerDate?

          // For now, let's assume recurring alarms should trigger. 
          // BUT we can't delete them.
          // We need to set a "ringing" state or just allow it and modal blocks duplicates.
          // Let's rely on seconds? The interval runs every 1000ms. 
          // It will trigger repeatedly for 60s if we don't stop it.
          // Fix: Store `lastTriggered` on alarm object.
          const todayStr = currentDate;
          if (alarm.lastTriggered !== todayStr) {
            shouldRing = true;
          }
        }
      }

      if (shouldRing) {
        triggerAlarm(alarm, i);
      }
    }
  });
}, 1000);

function triggerAlarm(alarm, index) {
  isRinging = true;

  // Logic: 
  // If one-time, remove it.
  // If recurring, mark it as triggered for today.

  if (alarm.type === 'one-time') {
    alarms.splice(index, 1);
  } else {
    // Recurring
    alarm.lastTriggered = new Date().toISOString().split('T')[0];
  }
  saveAlarms();

  // Show Modal
  alarmDisplayTime.textContent = alarm.time;
  alarmModal.classList.remove('hidden');

  // Play Sound
  playSound(alarm.sound || 'digital', true);
}


// Stop Alarm
stopBtn.addEventListener('click', () => {
  isRinging = false;
  stopAlarmSound();
  alarmModal.classList.add('hidden');
});

// Snooze Logic
snoozeBtn.addEventListener('click', () => {
  isRinging = false;
  stopAlarmSound();
  alarmModal.classList.add('hidden');

  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  const snoozeTime = now.toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5);
  const snoozeDate = now.toISOString().split('T')[0];

  // Snooze is always a one-time alarm
  alarms.push({
    time: snoozeTime,
    date: snoozeDate,
    type: 'one-time',
    sound: 'digital', // Default snooze sound? Or keep original? Let's use beep for snooze urgency.
    days: []
  });
  saveAlarms();
});


// Navbar Logic
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
if (hamburger) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("open");
  });
}
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    if (hamburger) hamburger.classList.remove("active");
    if (navLinks) navLinks.classList.remove("open");
  });
});
