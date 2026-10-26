# Agaaw Homepage

A responsive landing page for Agaaw, built with semantic HTML, CSS, vanilla JavaScript, and GSAP.

## Features

- Animated hero: an SVG plane flies across the heading and reveals the letters.
- GSAP ScrollTrigger effects for the story section, mentor cards, scholarship cards, country track, statistics, blog cards, and footer.
- Responsive layouts using CSS Grid, Flexbox, `clamp()`, and media queries.
- Custom cursor and magnetic buttons on pointer-based devices.
- Scroll progress indicator and an animated scholarship marquee.
- Reduced-motion support for visitors who prefer fewer animations.
- **No preloader or initial loading screen.** The hero animation starts when the page's JavaScript initializes.

## Files

```text
agaaw-homepage/
├── index.html
├── style.css
├── home.js
└── assets/
    ├── agaaw_logo_noBG.png
    ├── fuad.JPG
    ├── joy.JPG
    ├── mentor_1.png
    ├── image01.jpg
    ├── image02.jpg
    ├── harvard-university.jpg
    ├── countries/
    └── blogs/
```

Keep the existing `assets/` directory beside these files. The page references images in that directory.

## Run locally

1. Put `index.html`, `style.css`, `home.js`, and the existing `assets/` folder in the same project directory.
2. Open `index.html` in a browser. For a more reliable local development setup, use VS Code's Live Server extension.
3. GSAP 3.12.5 and ScrollTrigger are loaded from cdnjs in `index.html`, so an internet connection is needed for the animations.

or Live Project link: https://agaaw-homepage.vercel.app

## How the animation works

1. `playHero()` wraps each character in an accessible span and measures its position.
2. GSAP moves the plane across the hero. During the flight, `onUpdate` creates smoke puffs and reveals letters as the plane passes them.
3. `ScrollTrigger` connects scroll position to animations and pinned sections.
4. The page checks `prefers-reduced-motion`. When reduced motion is requested, the page keeps its content available without running the main animation sequence.

## Notes before production

- Replace placeholder `href="#"` links with real routes or destinations.
- Replace the third mentor's placeholder name and verify all public-facing claims and statistics.
- Test keyboard navigation, touch devices, slow connections, and reduced-motion mode.
- Confirm that every image path matches the actual filename and capitalization.
- The marquee and custom cursor are decorative enhancements; core content should remain usable without them.
