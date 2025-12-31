// DIGITAL CLOCK
function updateDigitalClock() {
  const now = new Date();
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  document.getElementById('timer').textContent =
    `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')} ${ampm}`;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date').textContent = now.toLocaleDateString(undefined, options);
}

// ANALOG CLOCK
function updateAnalogClock() {
  const now = new Date();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds*0.1;
  const hourDeg = hours * 30 + minutes*0.5;

  document.getElementById('second-hand').style.transform = `rotate(${secondDeg}deg)`;
  document.getElementById('minute-hand').style.transform = `rotate(${minuteDeg}deg)`;
  document.getElementById('hour-hand').style.transform = `rotate(${hourDeg}deg)`;
}

// UPDATE CLOCKS EVERY SECOND
setInterval(() => {
  updateDigitalClock();
  updateAnalogClock();
}, 1000);

updateDigitalClock();
updateAnalogClock();


  // Toggle menu on small screens
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
  });
