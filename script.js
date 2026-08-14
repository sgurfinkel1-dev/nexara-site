const progressBar = document.querySelector('.scroll-progress span');
const heroVisual = document.querySelector('.hero-visual');
const scene = document.querySelector('[data-scene]');
const stackLayers = [...document.querySelectorAll('[data-layer]')];
const steps = [...document.querySelectorAll('.ecosystem-step')];
const ecosystemScroll = document.querySelector('.ecosystem-scroll');
const peelCard = document.querySelector('[data-peel-card]');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function updateScrollState() {
  const scrollTop = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${scrollable ? (scrollTop / scrollable) * 100 : 0}%`;

  if (heroVisual) {
    const heroProgress = clamp(scrollTop / Math.max(window.innerHeight, 1), 0, 1);
    heroVisual.style.setProperty('--parallax', `${heroProgress * 70}px`);
  }

  if (scene && ecosystemScroll) {
    const ecosystemRect = ecosystemScroll.getBoundingClientRect();
    const mobileLayout = window.innerWidth <= 900;
    const travel = Math.max(1, ecosystemScroll.offsetHeight - window.innerHeight);
    const progress = mobileLayout ? 1 : clamp(-ecosystemRect.top / travel, 0, 1);
    const index = Math.min(steps.length - 1, Math.floor(progress * steps.length));
    scene.style.setProperty('--build-progress', progress.toFixed(3));
    stackLayers.forEach((layer, layerIndex) => {
      const localProgress = mobileLayout ? 1 : clamp((progress + .28 - layerIndex * .18) / .32, 0, 1);
      const spacing = mobileLayout ? 76 : 104;
      const finalY = (layerIndex - 1.5) * spacing;
      const entryX = (1 - localProgress) * (layerIndex % 2 ? 210 : -210);
      const entryY = (1 - localProgress) * 70;
      layer.style.opacity = String(.08 + localProgress * .92);
      layer.style.transform = `translate3d(calc(-50% + ${entryX}px), calc(-50% + ${finalY + entryY}px), ${layerIndex * 24}px) rotateX(58deg) rotateZ(-12deg)`;
      layer.classList.toggle('is-built', localProgress > .86);
      layer.classList.toggle('is-current', layerIndex === index);
    });
    steps.forEach((step, stepIndex) => step.classList.toggle('is-active', stepIndex === index));
  }
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => { updateScrollState(); ticking = false; });
    ticking = true;
  }
}, { passive: true });
window.addEventListener('resize', updateScrollState);
updateScrollState();

if (peelCard) {
  const peelFront = peelCard.querySelector('[data-peel-front]');
  const peelFold = peelCard.querySelector('.peel-fold');
  let peelProgress = 0;
  let peelOpen = false;
  const setPeel = (next) => {
    peelProgress = Math.max(0, Math.min(1, next));
    peelCard.style.setProperty('--peel-progress', peelProgress.toFixed(3));
    const reveal = 100 * peelProgress;
    peelCard.style.setProperty('--peel-edge', `${reveal}%`);
    if (peelFront) {
      peelFront.style.clipPath = `polygon(${reveal}% 0, 100% 0, 100% 100%, ${reveal}% 100%)`;
    }
    if (peelFold) {
      peelFold.style.opacity = String(Math.min(1, peelProgress * 2.6));
      peelFold.style.transform = `translateX(-50%) perspective(300px) rotateY(${24 + peelProgress * 42}deg) scaleX(${.35 + peelProgress * .65})`;
    }
    peelCard.classList.toggle('is-peeled', peelProgress > .08);
    peelCard.setAttribute('aria-pressed', String(peelProgress > .5));
  };
  const togglePeel = () => {
    peelOpen = !peelOpen;
    setPeel(peelOpen ? 1 : 0);
  };
  peelCard.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const rect = peelCard.getBoundingClientRect();
    if (!peelOpen) setPeel(1 - (event.clientX - rect.left) / rect.width);
  }, { passive: true });
  peelCard.addEventListener('pointerleave', () => {
    if (!peelOpen) setPeel(0);
  }, { passive: true });
  peelCard.addEventListener('click', togglePeel);
  peelCard.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    togglePeel();
  });
  setPeel(0);
}

if (heroVisual && window.matchMedia('(pointer:fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth - .5) * 12;
    const y = (event.clientY / window.innerHeight - .5) * 12;
    heroVisual.style.setProperty('--tilt-x', `${y * -1}deg`);
    heroVisual.style.setProperty('--tilt-y', `${x}deg`);
    heroVisual.querySelectorAll('.orbit-node, .visual-caption').forEach((item, index) => {
      item.style.translate = `${x * (index % 2 ? .35 : -.25)}px ${y * (index % 2 ? -.3 : .2)}px`;
    });
  }, { passive: true });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.add('is-navigating');
    window.setTimeout(() => document.body.classList.remove('is-navigating'), 500);
  });
});
