const packet = document.getElementById('packet');
const layerLabel = document.getElementById('layerLabel');
const packetNote = document.getElementById('packetNote');
const packetPanel = document.querySelector('.packet-panel');
const miniPacket = document.getElementById('miniPacket');
const routerOne = document.querySelector('.router-one');
const routerTwo = document.querySelector('.router-two');
const sections = [...document.querySelectorAll('[data-layer]')];
const physicalSection = document.querySelector('[data-layer="physical"]');
const arrivalSection = document.querySelector('[data-layer="arrival"]');

const layerContent = {
  application: ['Application Layer Data', 'A tiny piece of the CS 453 syllabus begins as application data.'],
  transport: ['TCP Segment', 'A transport header adds reliability and ordering.'],
  network: ['IP Packet', 'A network header gives the data an address and route.'],
  link: ['Ethernet Frame', 'A link-layer header and trailer prepare local delivery.'],
  physical: ['Frame in Transit', 'Scroll down to move the frame toward its destination. Scroll up to send it back.'],
  arrival: ['Tiny Piece Received', 'The destination receives this piece and rejoins it with the remaining syllabus data.']
};

let currentLayer = '';

function setLayer(layer) {
  if (layer === currentLayer) return;
  currentLayer = layer;

  packet.className = 'packet';
  packetPanel.classList.remove('transmitting', 'arrived');

  if (['transport', 'network', 'link', 'physical'].includes(layer)) {
    packet.classList.add(layer);
  }

  if (layer === 'physical') {
    packet.classList.add('link');
    packetPanel.classList.add('transmitting');
  }

  if (layer === 'arrival') {
    packet.classList.add('link');
    packetPanel.classList.add('arrived');
  }

  const [label, note] = layerContent[layer] || layerContent.application;
  layerLabel.textContent = label;
  packetNote.textContent = note;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/*
 * Use one fixed reading line in the viewport rather than intersection ratios.
 * This prevents a very tall section, such as the semester schedule, from being
 * skipped and makes each layer transition occur in document order.
 */
function updateActiveLayer() {
  const readingLine = window.innerHeight * 0.38;
  let active = sections[0];

  for (const section of sections) {
    if (section.getBoundingClientRect().top <= readingLine) {
      active = section;
    } else {
      break;
    }
  }

  if (active) setLayer(active.dataset.layer);
}

function updateTransmissionProgress() {
  if (!physicalSection || !arrivalSection) return;

  const viewportAnchor = window.scrollY + window.innerHeight * 0.5;
  const start = physicalSection.offsetTop;
  const end = arrivalSection.offsetTop + arrivalSection.offsetHeight * 0.18;
  const overallProgress = clamp((viewportAnchor - start) / Math.max(end - start, 1), 0, 1);

  // Reserve the opening part of the physical-layer scroll for launch.
  // The large frame first shrinks into the miniature frame, then travel begins.
  const launchFraction = 0.16;
  const shrinkProgress = clamp(overallProgress / launchFraction, 0, 1);
  const travelProgress = clamp((overallProgress - launchFraction) / (1 - launchFraction), 0, 1);
  const miniVisible = clamp((shrinkProgress - 0.72) / 0.28, 0, 1);

  const arc = Math.sin(travelProgress * Math.PI);
  miniPacket.style.left = `calc((100% - 41px) * ${travelProgress.toFixed(4)})`;
  miniPacket.style.transform = `translateY(${-10 * arc}px) rotate(${(-2 + 4 * travelProgress).toFixed(2)}deg) scale(${(0.93 + 0.09 * arc).toFixed(4)})`;
  miniPacket.style.filter = `drop-shadow(0 ${4 + 8 * arc}px ${7 + 7 * arc}px rgba(16,32,47,${(0.18 + 0.16 * arc).toFixed(3)}))`;
  packetPanel.style.setProperty('--shrink', shrinkProgress.toFixed(4));
  packetPanel.style.setProperty('--mini-visible', miniVisible.toFixed(4));
  packetPanel.style.setProperty('--travel', travelProgress.toFixed(4));

  // Routers are visual waypoints only. Their glow peaks as the frame passes.
  const waypointGlow = (position) => clamp(1 - Math.abs(travelProgress - position) / 0.12, 0, 1);
  if (routerOne) routerOne.style.setProperty('--router-glow', waypointGlow(1 / 3).toFixed(4));
  if (routerTwo) routerTwo.style.setProperty('--router-glow', waypointGlow(2 / 3).toFixed(4));
}

function initializeCurrentWeek() {
  const cards = [...document.querySelectorAll('.week-card')];
  cards.forEach(card => { card.open = false; });

  const now = new Date();
  now.setHours(12, 0, 0, 0);

  cards.forEach(card => {
    const firstDatedItem = card.querySelector('time[datetime]');
    if (!firstDatedItem) return;

    const classDate = new Date(`${firstDatedItem.dateTime}T12:00:00`);
    const day = classDate.getDay();
    const daysFromMonday = (day + 6) % 7;
    const weekStart = new Date(classDate);
    weekStart.setDate(classDate.getDate() - daysFromMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    if (now >= weekStart && now <= weekEnd) card.open = true;
  });
}

let ticking = false;
function requestScrollUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateActiveLayer();
    updateTransmissionProgress();
    ticking = false;
  });
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate);
initializeCurrentWeek();
updateActiveLayer();
updateTransmissionProgress();

// Expand all collapsible content for printing, then restore the reader's state.
const printButton = document.getElementById('printButton');
let printOpenState = null;

function expandDetailsForPrint() {
  if (printOpenState) return;
  const allDetails = [...document.querySelectorAll('details')];
  printOpenState = allDetails.map(detail => detail.open);
  allDetails.forEach(detail => { detail.open = true; });
}

function restoreDetailsAfterPrint() {
  if (!printOpenState) return;
  const allDetails = [...document.querySelectorAll('details')];
  allDetails.forEach((detail, index) => {
    detail.open = Boolean(printOpenState[index]);
  });
  printOpenState = null;
}

window.addEventListener('beforeprint', expandDetailsForPrint);
window.addEventListener('afterprint', restoreDetailsAfterPrint);

if (printButton) {
  printButton.addEventListener('click', () => {
    expandDetailsForPrint();
    // Allow the browser one frame to lay out the newly opened sections.
    requestAnimationFrame(() => window.print());
  });
}

// Replay the restrained celebration whenever the destination re-enters view.
const arrival = document.querySelector('.arrival');
const celebration = document.getElementById('celebration');
let celebrationReady = true;

if (arrival && celebration) {
  const colors = ['#f07049', '#0a7b83', '#f9c74f', '#90be6d', '#4d9de0'];
  for (let i = 0; i < 28; i += 1) {
    const piece = document.createElement('i');
    piece.className = 'confetti-piece';
    const angle = (Math.PI * 2 * i) / 28 + (Math.random() - .5) * .3;
    const distance = 115 + Math.random() * 190;
    piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    piece.style.setProperty('--dy', `${Math.sin(angle) * distance + 70}px`);
    piece.style.setProperty('--rot', `${Math.round((Math.random() - .5) * 900)}deg`);
    piece.style.setProperty('--delay', `${Math.random() * .16}s`);
    piece.style.setProperty('--confetti-color', colors[i % colors.length]);
    celebration.appendChild(piece);
  }

  const replayCelebration = () => {
    // Restart the animation when the destination is revisited, but keep the
    // completed state afterward so the full bar and assembled message remain.
    arrival.classList.remove('celebrate');
    void arrival.offsetWidth;
    arrival.classList.add('celebrate');
  };

  const arrivalObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > .42 && celebrationReady) {
        celebrationReady = false;
        replayCelebration();
      } else if (!entry.isIntersecting || entry.intersectionRatio < .12) {
        celebrationReady = true;
      }
    });
  }, { threshold: [0, .12, .42, .7] });

  arrivalObserver.observe(arrival);
}

// Scroll-reactive hero: title recedes while the syllabus payload assembles.
const hero = document.querySelector('.hero');
function updateHeroProgress() {
  if (!hero) return;
  const heroHeight = Math.max(hero.offsetHeight - window.innerHeight * 0.18, 1);
  const progress = clamp(window.scrollY / heroHeight, 0, 1);
  hero.style.setProperty('--hero-progress', progress.toFixed(4));
}
window.addEventListener('scroll', updateHeroProgress, { passive: true });
window.addEventListener('resize', updateHeroProgress);
updateHeroProgress();

// Play a small randomized reaction without restarting the one-time entrance.
const heroSpider = document.querySelector('.hero-spider');
let spiderReactionTimer;

if (heroSpider) {
  heroSpider.addEventListener('click', () => {
    window.clearTimeout(spiderReactionTimer);

    const angle = 5 + Math.random() * 7;
    const bounce = Math.random() < 0.45 ? 2 + Math.random() * 5 : 0;
    const duration = 620 + Math.random() * 420;

    heroSpider.style.setProperty('--spider-angle', `${angle.toFixed(2)}deg`);
    heroSpider.style.setProperty('--spider-bounce', `${bounce.toFixed(2)}px`);
    heroSpider.style.setProperty('--spider-reaction-duration', `${Math.round(duration)}ms`);

    heroSpider.classList.remove('is-reacting');
    void heroSpider.offsetWidth;
    heroSpider.classList.add('is-reacting');

    spiderReactionTimer = window.setTimeout(() => {
      heroSpider.classList.remove('is-reacting');
    }, duration + 80);
  });
}
