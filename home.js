gsap.registerPlugin(ScrollTrigger);

// Wrap every letter in <span class="ch"> so each letter can animate alone
function splitChars(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map(c => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
    return gsap.utils.toArray('.ch', el);
}

/* ============ Preloader ============ */
function preloader() {
    const box = document.querySelector('.preloader');
    const num = document.querySelector('.pl-num');
    const counter = { value: 0 };
    gsap.to(counter, {
        value: 100, duration: 1.4, ease: 'power2.inOut',
        onUpdate: () => num.textContent = Math.round(counter.value),
        onComplete: () => gsap.to(box, { yPercent: -100, duration: .9, ease: 'expo.inOut', onStart: heroIntro })
    });
}

// Hero: plane + smoke + letters
function makePuff(parent, x, y) {
    const puff = document.createElement('i');
    puff.className = 'puff';
    parent.appendChild(puff);
    const size = gsap.utils.random(26, 52);
    gsap.set(puff, { x, y: y - size / 2, width: size, height: size });
    gsap.to(puff, {
        scale: gsap.utils.random(2.5, 4), opacity: 0, y: '-=' + gsap.utils.random(10, 50),
        duration: 2, ease: 'power1.out', onComplete: () => puff.remove()
  });
}

function heroIntro() {
    const hero = document.querySelector('#hero');
    const title = document.querySelector('.mega');
    const plane = document.querySelector('.plane');
    const chars = splitChars(title);

    // 1) MEASURE first (before we hide the letters)
    const heroBox = hero.getBoundingClientRect();
    const titleBox = title.getBoundingClientRect();
    const planeH = plane.getBoundingClientRect().height;
    const planeY = titleBox.top - heroBox.top + titleBox.height / 2 - planeH / 2;
    const startX = -260, endX = heroBox.width + 60, duration = 3.2;
    const speed = (endX - startX) / duration;

    // 2) Hide the letters, park the plane off-screen left
    gsap.set(chars, { opacity: 0, y: 30, scale: .5, filter: 'blur(16px)' });
    gsap.set(plane, { x: startX, y: planeY });

    // 3) Fly. "ease:'none'" = constant speed, so we can predict where the plane is at any time
    let lastPuff = 0;
    const fly = gsap.to(plane, {
        x: endX, duration, ease: 'none',
        onUpdate: () => {
        const t = fly.time();
        if (t - lastPuff > 0.045) {                     // a puff roughly every 45ms
            lastPuff = t;
            makePuff(hero, gsap.getProperty(plane, 'x') + 20, planeY + planeH / 2);
        }
        }
    });

    // 4) Each letter waits until the smoke reaches it: delay = distance / speed
    chars.forEach(ch => {
        const r = ch.getBoundingClientRect();
        const letterX = r.left - heroBox.left + r.width / 2;
        gsap.to(ch, {
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
        duration: .9, ease: 'back.out(1.7)', delay: (letterX - startX) / speed
        });
    });

    gsap.from('.tagline', { opacity: 0, y: 20, duration: .8, delay: duration * .85 });
}

// Marquee: endless loop, reacts to scroll speed 
function marquee() {
  const track = document.querySelector('.track');
  track.innerHTML += track.innerHTML; 
  const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
        onUpdate: self => {
            gsap.to(loop, { timeScale: self.direction * (1 + Math.abs(self.getVelocity()) / 250), duration: .2, overwrite: true });
            gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: .25 });
        }
    });
}

// Story: pinned, photos cross-fade while you scroll
function story() {
  const chaps = gsap.utils.toArray('.chap');
  gsap.set(chaps.slice(1), { autoAlpha: 0 });         // hide chapters 2 and 3 at first

  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.story', start: 'top top', end: '+=2400', pin: true, scrub: 1 }
  })
    .to('.story-prog', { scaleX: 1, duration: 3 }, 0)  // progress bar fills over the whole scroll
    .to(chaps[0], { autoAlpha: 0 }, 1).to(chaps[1], { autoAlpha: 1 }, 1)   // photo 1 → 2
    .to(chaps[1], { autoAlpha: 0 }, 2).to(chaps[2], { autoAlpha: 1 }, 2);  // photo 2 → 3
}



function mentorCards() {
  const cards = gsap.utils.toArray('.mcard');
  const tilt = [-6, 3, -2];                            // final tilt of each card (degrees)
  const fan = [-14, 0, 14];            // start tilt: a fan, like UNO cards in a hand
  const gather = [82, 0, -76];         // start xPercent: slide each card toward the middle of the deck
  gsap.set(cards, { rotation: i => tilt[i] });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: '.mentor-card', start: 'top top', end: '+=1800', pin: true, scrub: 1 }
  });

  cards.forEach((card, i) => {
    // .from() = "start here, finish at the CSS layout". Percentages are of the card's own size,
    // so nothing needs measuring and it can't go wrong when images load late.
    tl.from(card, { xPercent: gather[i], yPercent: 150, rotation: fan[i], scale: .9, duration: 1, ease: 'power3.out' }, i);
  });
  tl.to({}, { duration: .5 });                         // small pause at the end
}

// Roles: hovered panel grows
function roles() {
    const panels = gsap.utils.toArray('.role');
    panels.forEach(p => {
        p.addEventListener('mouseenter', () => panels.forEach(o => gsap.to(o, { flexGrow: o === p ? 1.7 : 1, duration: .7, ease: 'power3.out' })));
        p.addEventListener('mouseleave', () => panels.forEach(o => gsap.to(o, { flexGrow: 1, duration: .7, ease: 'power3.out' })));
    });
    gsap.from(panels, { y: 80, opacity: 0, duration: 1, stagger: .15, ease: 'power3.out', scrollTrigger: { trigger: '.roles', start: 'top 75%' } });
}

marquee();
story();
mentorCards();
roles();
preloader();
window.addEventListener('load', () => ScrollTrigger.refresh());  // re-measure after images load