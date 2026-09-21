# Claude × Codex

A 60-second arcade game in ChetasLua’s playable Overview. Claude and Codex compete for the same help requests. Chetas, the stone philosopher with a laptop, can jailbreak nearby bots into cooperating and help people directly.

## Play

- **A / D** or **← / →**: walk. **Shift**: run.
- **Space / ↑ / W**: jump.
- **J**: release a jailbreak pulse. Reach: 235 world pixels; cooldown: 2.8 seconds.
- Stand near a person to open the laptop and help automatically.
- **Escape** or **pause**: pause the round. The game also pauses when the page loses focus or becomes hidden.
- On a phone, hold the direction, jump, and J buttons. Tap a spot on the stage to move there.

A jailbreak clears a bot’s temporary lock and gives it eight seconds of faster, cooperative work. Every completed request earns 100 points; requests with multiple contributors earn 150. Each bot reached by a jailbreak earns 25. There is no network model call: this is a small local game simulation. The best score stays in browser storage. Sound starts off and uses synthesized audio when enabled.

## How the Overview works

The GitHub profile README displays an animated game preview. Clicking it navigates in the same tab to GitHub Pages, where the surrounding Overview layout and profile content match and the game starts inside the README panel. GitHub sanitizes executable scripts out of Markdown, so the README itself cannot host interactive JavaScript. This uses the same presentation approach as [Jayant Chopra’s reference](https://github.com/JayantChopra/JayantChopra), without a separate game landing screen, pop-up, or full-screen takeover.

The site is an independently hosted profile view. Profile links, repository links, and navigation point to real GitHub pages. It does not imitate sign-in or collect credentials. Profile counts are a snapshot, not live API counters.

## Art

Chetas has four image-generated sheets: **8 idle frames, 8 walk frames, 8 run frames, and 16 action frames**. The actions include jump, jailbreak cast, laptop typing, and celebration. Movement advances frames by distance traveled; the renderer anchors frames consistently and mirrors them for left-facing movement. The generated sheets deliberately use a magenta chroma key, removed on load. Details and generation prompts: [SPRITES.md](assets/SPRITES.md).

Clawd and Codex are drawn entirely in JavaScript. Clawd uses the orange block body, square eyes, and little legs from the Claude mascot. Codex uses the blue scalloped head, dark terminal face, and small blue body from the Codex desktop pet. No mascot raster sheet is shipped. People and the stage are also code-drawn. This project is a personal fan-made game and is not affiliated with Anthropic or OpenAI.

## Run and verify

```sh
python3 -m http.server 8767 --bind 127.0.0.1
# Open http://127.0.0.1:8767/
node --test game/engine.test.mjs
python3 scripts/build_offline.py
```

`claude-vs-codex.html` is the generated standalone version, including all four sheets and the avatar. It opens directly without a server. To edit the game, change the modules rather than the generated HTML.

- `game/engine.mjs`: deterministic simulation, movement, requests, bot rivalry, jailbreaks, scoring, pause, and round end.
- `game/renderer.mjs`: Canvas rendering, sprite frame extraction, animations, and procedural mascots.
- `game/main.mjs`: keyboard/pointer controls, accessible status, UI, storage, and browser lifecycle.
- `game/audio.mjs`: opt-in procedural sound effects.

No frameworks, package installation, external game services, analytics, or third-party script dependencies are required.
