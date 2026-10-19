// Every Loot Lab game lives here. Adding an entry creates its page at
// /games/<slug>/ and makes it available to the homepage.
import ttLogo from '../assets/toon-tactics/logo.webp';
import ttCover from '../assets/toon-tactics/cover.webp';
import ttSplash from '../assets/toon-tactics/splash.webp';
import ttPipeline from '../assets/toon-tactics/pipeline.webp';

export const games = [
  {
    slug: 'toon-tactics',
    name: 'Toon Tactics',
    featured: true,
    logo: ttLogo,
    summary: 'Tactical auto-battler for mobile with collectible toon heroes.',
    description:
      'A stylized mobile strategy game inspired by auto-battlers and tactics classics. Recruit a squad of toon heroes, position them on the board, and watch your plan play out against legendary foes.',
    genre: 'Auto-battler strategy',
    platforms: ['Mobile'],
    status: 'In development',
    release: 'To be announced',
    features: [
      { title: 'Auto chess', detail: 'Strategy meets luck' },
      { title: 'Collect', detail: 'Unlock unique heroes' },
      { title: 'Upgrade', detail: 'Power up your team' },
      { title: 'Battle', detail: 'Rise to the top' },
    ],
    trailer: {
      src: '/media/tt-trailer.mp4',
      loop: '/media/tt-trailer-loop.mp4',
      poster: '/media/tt-trailer-poster.webp',
    },
    cover: {
      src: ttCover,
      alt: 'Toon Tactics cover art: a knight, archer, rogue, witch, skeleton mage and stone golem charge across a blocky castle battlefield',
    },
    gallery: [
      // A gallery item can be a looping video instead of an image.
      { video: { src: '/media/tt-gameplay.mp4', poster: '/media/tt-gameplay-poster.webp' }, alt: 'Gameplay: a squad of heroes battles the Ember Wyrm dragon boss on the board', label: 'gameplay video', depth: -0.06 },
      { src: ttSplash, alt: 'Splash art: a bear-hooded brawler, an orc with a stone hammer and a broom-riding witch charge across a castle battlefield', label: 'splash art', depth: 0.05 },
      { src: ttPipeline, alt: 'Character pipeline: a horned rogue modelled, UV-unwrapped and textured in Blender, then set up in Unity', label: 'character pipeline', depth: -0.03 },
    ],
  },
];

export const featuredGame = games.find((g) => g.featured) ?? games[0];
