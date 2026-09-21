// The classic bundle embeds the sprite sheets so a locally opened index also works.
if (location.protocol === 'file:') {
  const script = document.createElement('script');
  script.src = 'game/offline.js';
  document.body.append(script);
} else {
  import('./main.mjs');
}
