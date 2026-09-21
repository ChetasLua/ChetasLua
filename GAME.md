# Claude × Codex

A small, continuously running showcase in ChetasLua’s playable Overview. Claude and Codex build visual versions of real projects, check their work, and send the finished artifact toward GitHub. Chetas can walk in, jailbreak a stuck bot, and join the build.

## What appears

Six public repositories rotate through a shuffled deck. Every project appears once per deck, and the boundary never repeats the previous project. People, Sudoku boards, controller input sequences, and editing timelines also vary.

| Repository | Visual scene |
| --- | --- |
| [sudoku-graph-coloring](https://github.com/ChetasLua/sudoku-graph-coloring) | A colored 9 × 9 puzzle and its constraint graph |
| [xbox360-svg-controller](https://github.com/ChetasLua/xbox360-svg-controller) | A controller taking shape, with buttons lighting up |
| [jevmeter](https://github.com/ChetasLua/jevmeter) | A waveform, scored moments, and selected cuts |
| [scrubwatch](https://github.com/ChetasLua/scrubwatch) | Before/after documents revealing removed and added lines |
| [negative-controls](https://github.com/ChetasLua/negative-controls) | Known signals and empty samples passing through a test instrument |
| [little-neighbourhood](https://github.com/ChetasLua/little-neighbourhood) | A miniature isometric world assembling itself |

These are procedural demonstrations of existing projects. The code validates local fixtures before awarding a completed build. The shipping animation does not create commits or call AI services. The source link opens the actual featured repository. Public repository descriptions and links were checked on September 21, 2026.

## Interaction

- The scene starts automatically and keeps showing new projects.
- Click the project to try it and contribute to the build.
- Click Claude or Codex to let that bot lead. Click a person to hear their request or reaction.
- **Shuffle** shows another project immediately.
- **Join in** takes control of Chetas. **A/D** or arrows walk, **Shift** runs, **Space** jumps, and **J** jailbreaks nearby bots. **E** talks to a person.
- **Watch** gives movement back to the scene. **Escape** or **Pause** pauses everything.
- Phones have movement, jump, and jailbreak buttons. Sound starts off.

People hold a controller or phone when it suits the project, point, watch the work, talk, nod, give a thumbs-up, and clap. Their shaped heads come from Chetas’s Head Cases drawing system. The updated bodies add jointed limbs, shirt and coat layers, cuffs, seams, buttons, hands, shoelaces, and face shading. Claude and Codex remain code-drawn mascots.

## Loading and rendering

The original four ImageGen sheets are retained as source artwork. Forty animation frames are pre-trimmed, keyed, resized, and packed into one transparent WebP atlas: **449,000 bytes**, down from **7,570,816 bytes**. The browser no longer scans source pixels or waits for sprite preparation. Code-drawn characters and the project appear before the avatar image finishes decoding.

A single browser bundle reduces script requests. The scene supports high-density displays, uses a separate phone composition, limits mobile painting to 30 fps, updates DOM status at 10 Hz, and suspends work when the scene or tab is out of view. No fonts, frameworks, analytics, model APIs, or GitHub API calls load at runtime.

The native GitHub README shows a compact animated preview. Clicking it opens the matching playable Overview in the same tab. GitHub removes executable scripts from README Markdown, so JavaScript gameplay runs on GitHub Pages.

## Run and build

Open `index.html` directly, or serve this directory:

```sh
python3 -m http.server 8767 --bind 127.0.0.1
node --test game/engine.test.mjs
python3 scripts/build_offline.py
```

The build refreshes `game/app.js` and the self-contained `claude-vs-codex.html`. Edit the source modules, then rebuild. The standalone HTML is ignored by Git. To rebuild the atlas from the original sheets, install Pillow and run `python3 scripts/build_sprites.py` before bundling.

- `game/projects.mjs`: repository catalog, randomized fixtures, and checks.
- `game/engine.mjs`: project rotation, cooperation, controls, scoring, and lifecycle.
- `game/project-art.mjs`: the six visual project demonstrations.
- `game/portraits.mjs` and `game/people.mjs`: heads and character designs.
- `game/renderer.mjs`: bodies, mascots, sprite animation, and responsive compositions.
- `game/main.mjs`: controls, accessibility, visibility, and UI.
- `game/atlas.mjs`: generated frame coordinates.

Art provenance and original generation prompts are in [SPRITES.md](assets/SPRITES.md). This is a personal fan-made game, independently hosted and unaffiliated with Anthropic or OpenAI.
