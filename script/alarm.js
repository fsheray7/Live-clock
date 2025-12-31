
// ==========================
// ALARM FUNCTIONALITY
// ==========================
let alarms = [];

const alarmTimeInput = document.getElementById('alarm-time');
const alarmDateInput = document.getElementById('alarm-date');
const setAlarmBtn = document.getElementById('set-alarm');
const alarmList = document.getElementById('alarm-list');

// Set Alarm
setAlarmBtn.addEventListener('click', () => {
  const time = alarmTimeInput.value;
  const date = alarmDateInput.value;

  if (!time || !date) {
    alert('Please select both date and time');
    return;
  }

  const alarm = { time, date };
  alarms.push(alarm);
  renderAlarms();

  alarmTimeInput.value = '';
  alarmDateInput.value = '';
});

// Render Alarms
function renderAlarms() {
  alarmList.innerHTML = '';
  alarms.forEach((alarm, index) => {
    const div = document.createElement('div');
    div.classList.add('alarm-item');
    div.innerHTML = `<span>${alarm.date} ${alarm.time}</span>
                     <button onclick="removeAlarm(${index})">Delete</button>`;
    alarmList.appendChild(div);
  });
}

// Remove Alarm
function removeAlarm(index) {
  alarms.splice(index, 1);
  renderAlarms();
}

// Check Alarms every second
setInterval(() => {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-GB', { hour12: false });
  const currentDate = now.toISOString().split('T')[0];

  alarms.forEach((alarm, i) => {
    if (alarm.time === currentTime && alarm.date === currentDate) {
      alert(`Alarm! ${alarm.date} ${alarm.time}`);
      alarms.splice(i, 1);
      renderAlarms();
    }
  });
}, 1000);


  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("open");
  });

  // Close menu when clicking a link (mobile UX)
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navLinks.classList.remove("open");
    });
  });

