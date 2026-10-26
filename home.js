gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });              // stops jumps when a phone's address bar hides

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;   // user wants less motion
const isMouse = window.matchMedia('(pointer: fine)').matches;                         // false on touch screens


/* ============ helpers ============ */
// Fast follow-the-mouse setters for two properties: const [setX, setY] = quick(el, ['x', 'y'], { duration: .5 })
function quick(target, [propA, propB], options) {
    return [gsap.quickTo(target, propA, options), gsap.quickTo(target, propB, options)];
}

// Wrap each letter in <span class="ch"> so every letter can animate alone
function splitChars(el) {
    if (!el) return [];

    const text = el.textContent.trim();
    const fragment = document.createDocumentFragment();

    el.setAttribute('aria-label', text);

    for (const character of text) {
        const span = document.createElement('span');
        span.className = 'ch';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = character;
        fragment.appendChild(span);
    }

    el.replaceChildren(fragment);
    return Array.from(el.querySelectorAll('.ch'));
}

/* The hero starts as soon as the script runs. The hero starts directly, without a loading screen. */

/* ============ page-wide: nav, progress bar, cursor, magnetic buttons, link transitions ============ */
function navAndProgress() {
    const nav = document.querySelector('.nav');
    const bar = document.querySelector('.progress');
    ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: self => {
            nav.classList.toggle('hide', self.direction === 1 && self.scroll() > 400);   // hide going down, show going up
            gsap.set(bar, { scaleX: self.progress });
        }
    });
}

function cursor() {
    const ring = document.querySelector('.cur-ring');
    const [dotX, dotY] = quick('.cur-dot', ['x', 'y'], { duration: .1 });
    const [ringX, ringY] = quick(ring, ['x', 'y'], { duration: .45, ease: 'power3' });
    window.addEventListener('mousemove', e => { dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY); });
    // CSS does the grow effect; JS only flips a class. (Never use overwrite:true on an element that has quickTo:
    // it kills the quickTo tween and the element freezes.)
    document.addEventListener('mouseover', e => ring.classList.toggle('is-link', !!e.target.closest('a, button')));
}

function magneticButtons() {
    document.querySelectorAll('.mag').forEach(btn => {
        const [moveX, moveY] = quick(btn, ['x', 'y'], { duration: .5, ease: 'power3' });
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            moveX((e.clientX - r.left - r.width / 2) * .35);
            moveY((e.clientY - r.top - r.height / 2) * .5);
        });
        btn.addEventListener('mouseleave', () => { moveX(0); moveY(0); });
    });
}

// Same-page links scroll smoothly; links to other pages use normal browser navigation.
function pageTransitions() {
    document.querySelectorAll('a[data-t]').forEach(link => {
        link.addEventListener('click', event => {
            const targetUrl = new URL(link.href, window.location.href);
            const samePage = targetUrl.origin === location.origin &&
                targetUrl.pathname.replace(/index\\.html$/, '') === location.pathname.replace(/index\\.html$/, '');

            // Let the browser handle other pages and modified clicks normally.
            if (!samePage || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const target = targetUrl.hash ? document.querySelector(targetUrl.hash) : null;
            if (!target && !targetUrl.hash) {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
                return;
            }
            if (target) {
                event.preventDefault();
                target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
                history.replaceState(null, '', targetUrl.hash);
            }
        });
    });
}

/* ============ 1. hero: plane, smoke, letters ============ */
function makePuff(parent, x, y) {
    const puff = document.createElement('i');
    puff.className = 'puff';
    parent.appendChild(puff);
    const size = gsap.utils.random(40, 70);
    gsap.set(puff, { x: x - size / 2, y: y - size / 2, width: size, height: size, scale: .4, opacity: .9 });
    gsap.to(puff, {
        scale: gsap.utils.random(3.5, 5.5),             // grows big: this is the "spread"
        x: '-=' + gsap.utils.random(20, 60),            // drifts back, behind the plane
        y: '+=' + gsap.utils.random(-70, 70),           // drifts up or down: the smoke widens like a cone
        opacity: 0,
        duration: gsap.utils.random(1.6, 2.4),          // longer life = longer trail
        ease: 'power2.out',
        onComplete: () => puff.remove()
    });
}

function playHero() {
    const hero = document.querySelector('#hero');
    if (!hero || reduceMotion) return;

    const title = hero.querySelector('.mega');
    const plane = hero.querySelector('.plane');
    if (!title || !plane) return;

    const rest = gsap.utils.toArray('.hero .tagline, .hero .lead, .hero .cta');
    const chars = splitChars(title);
 
    // 1) measure: where is every letter? (chars are already in left-to-right order)
    const heroBox = hero.getBoundingClientRect();
    const titleBox = title.getBoundingClientRect();
    const planeBox = plane.getBoundingClientRect();
    const planeW = planeBox.width;
    const planeH = planeBox.height;
    const planeY = titleBox.top - heroBox.top + titleBox.height / 2 - planeH / 2;
    const waiting = chars.map(el => {
        const r = el.getBoundingClientRect();
        return { el, x: r.left - heroBox.left + r.width / 2 };
    });
 
    // 2) hide every letter, show the (empty) title, park the plane off-screen left
    gsap.set(chars, { opacity: 0, y: 30, scale: .5, filter: 'blur(16px)' });
    gsap.set(title, { opacity: 1 });
    gsap.set(rest, { y: 24, opacity: 0 });
    gsap.set(plane, { x: -planeW - 40, y: planeY });
 
    const popLetter = el => gsap.to(el, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: .8, ease: 'back.out(1.7)' });
    let restShown = false;
    const showRest = () => {
        if (restShown) return;
        restShown = true;
        gsap.to(rest, { opacity: 1, y: 0, duration: .8, stagger: .12, delay: .3, ease: 'power3.out' });
    };
 
    // 3) fly. Each frame: leave smoke at the tail, then pop every letter the tail has reached
    let lastPuff = 0;
    const fly = gsap.to(plane, {
        x: heroBox.width + 40, duration: 2.2, ease: 'none',              // lower duration = faster plane
        onUpdate: () => {
            const tailX = gsap.getProperty(plane, 'x') + planeW * .1;   // the tail is at the left end
            const t = fly.time();
            if (t - lastPuff > .03) { lastPuff = t; makePuff(hero, tailX, planeY + planeH / 2); }
            while (waiting.length && tailX >= waiting[0].x) popLetter(waiting.shift().el);
            if (!waiting.length) showRest();
        },
        onComplete: () => { waiting.splice(0).forEach(l => popLetter(l.el)); showRest(); }   // safety net
    });
}

function heroClouds() {
    gsap.to('.cloud', { x: '+=50', duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: { each: 1, from: 'random' } });
    gsap.to('.cloud', { y: i => -(100 + i * 70), ease: 'none',
                        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ============ 2. marquee: endless loop that reacts to scroll speed ============ */
function marquee() {
    const track = document.querySelector('.track');
    // clone every item once (aria-hidden) so the loop has no gap
    track.append(...[...track.children].map(item => { const copy = item.cloneNode(true); copy.setAttribute('aria-hidden', 'true'); return copy; }));
    const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
        onUpdate: self => {
            gsap.to(loop, { timeScale: self.direction * (1 + Math.abs(self.getVelocity()) / 250), duration: .2, overwrite: true });
            gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: .25 });
        }
    });
}

/* ============ 3. story: pinned, photos cross-fade as you scroll ============ */
function story() {
    const chaps = gsap.utils.toArray('.chap');
    const texts = chaps.map(chap => chap.querySelector('.chap-text'));
    gsap.set(chaps.slice(1), { autoAlpha: 0 });
    gsap.set(texts.slice(1), { y: 60 });

    gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.story', start: 'top top', end: '+=2400', pin: true, scrub: 1 }
    })
        .to('.story-prog', { scaleX: 1, duration: 3 }, 0)
        .to(chaps[0], { autoAlpha: 0 }, 1).to(chaps[1], { autoAlpha: 1 }, 1).to(texts[1], { y: 0 }, 1)
        .to(chaps[1], { autoAlpha: 0 }, 2).to(chaps[2], { autoAlpha: 1 }, 2).to(texts[2], { y: 0 }, 2);
}

/* ============ 4. mentor cards: UNO deck pops up and spreads ============ */
function mentorCards() {
    const cards = gsap.utils.toArray('.mcard');
    const tilt = [-6, 3, -2];                                    // final tilt (CSS decides the final position)
    const fan = [-14, 0, 14];                                    // start tilt, like cards in a hand
    const gather = [82, 0, -76];                                 // start xPercent: slide toward the middle
    gsap.set(cards, { rotation: i => tilt[i] });

    const tl = gsap.timeline({ scrollTrigger: { trigger: '.mentor-card', start: 'top top', end: '+=1800', pin: true, scrub: 1 } });
    cards.forEach((card, i) => {
        tl.from(card, { xPercent: gather[i], yPercent: 150, rotation: fan[i], scale: .9, duration: 1, ease: 'power3.out' }, i);
    });
    tl.to({}, { duration: .5 });
}

/* ============ 5. roles: hovered panel grows ============ */
function roles() {
    const panels = gsap.utils.toArray('.role');
    const grow = active => panels.forEach(p => gsap.to(p, { flexGrow: p === active ? 1.7 : 1, duration: .7, ease: 'power3.out' }));
    panels.forEach(p => {
        p.addEventListener('mouseenter', () => grow(p));
        p.addEventListener('mouseleave', () => grow(null));
    });
    gsap.from(panels, { y: 80, opacity: 0, duration: 1, stagger: .15, ease: 'power3.out',
                        scrollTrigger: { trigger: '.roles', start: 'top 75%' } });
}

/* ============ 6. scholarships: cards rise in, tilt toward the mouse ============ */
function scholarships() {
    const cards = gsap.utils.toArray('.card');
    gsap.set(cards, { opacity: 0, y: 60 });
    ScrollTrigger.batch(cards, {
        start: 'top 88%', once: true,
        onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: .9, stagger: .12, ease: 'power3.out' })
    });
    if (!isMouse) return;
    cards.forEach(card => {
        const [rotX, rotY] = quick(card, ['rotationX', 'rotationY'], { duration: .5 });
        gsap.set(card, { transformPerspective: 800 });
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            rotY(((e.clientX - r.left) / r.width - .5) * 14);
            rotX(-((e.clientY - r.top) / r.height - .5) * 14);
        });
        card.addEventListener('mouseleave', () => { rotX(0); rotY(0); });
    });
}

/* ============ 7. countries: pinned sideways scroll, route line draws ============ */
function countries() {
    const track = document.querySelector('.hs-track');
    const distance = () => track.scrollWidth - window.innerWidth;       // how far the track must slide
    gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.hs', start: 'top top', end: () => '+=' + (distance() + 200), pin: true, scrub: 1, invalidateOnRefresh: true }
    })
        .to(track, { x: () => -distance() }, 0)
        .to('.route-fg', { strokeDashoffset: 0 }, 0);
}

/* ============ 8. stats: numbers count up once ============ */
function stats() {
    gsap.utils.toArray('[data-count]').forEach(el => {
        const counter = { value: 0 };
        const end = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        ScrollTrigger.create({
            trigger: el, start: 'top 85%', once: true,
            onEnter: () => gsap.to(counter, { value: end, duration: 2.2, ease: 'power2.out',
                onUpdate: () => el.textContent = Math.round(counter.value).toLocaleString() + suffix })
        });
    });
}

/* ============ 9. blog: image wipes open, text follows ============ */
function blog() {
    gsap.utils.toArray('.post').forEach((post, i) => {
        const trigger = { trigger: post, start: 'top 85%' };
        gsap.from(post.querySelector('i'), { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power4.out', delay: i * .1, scrollTrigger: trigger });
        gsap.from(post.querySelectorAll('h3, p'), { y: 24, opacity: 0, stagger: .1, duration: .8, delay: .2 + i * .1, scrollTrigger: trigger });
    });
}

/* ============ 10. footer: giant wordmark rises letter by letter ============ */
function footer() {
    const letters = splitChars(document.querySelector('.foot-mega'));
    gsap.from(letters, { yPercent: 110, opacity: 0, duration: 1.1, stagger: .08, ease: 'power4.out',
                         scrollTrigger: { trigger: '.foot', start: 'top 70%' } });
}

/* Initialise in document order so pinned ScrollTriggers calculate correctly. */
function initHomePage() {
    pageTransitions();

    if (reduceMotion) return;

    playHero();
    navAndProgress();
    magneticButtons();
    if (isMouse) cursor();

    heroClouds();
    marquee();
    story();
    mentorCards();
    roles();
    scholarships();
    countries();
    stats();
    blog();
    footer();

    window.addEventListener('load', () => ScrollTrigger.refresh());
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage, { once: true });
} else {
    initHomePage();
}
