# Claude × Codex

A 60-second arcade game in ChetasLua’s playable Overview. Claude and Codex compete for the same help requests. Chetas, the stone philosopher with a laptop, can jailbreak nearby bots into cooperating and help people directly.

## Play

- **A / D** or **← / →**: walk. **Shift**: run.
- **Space / ↑ / W**: jump.
- **J**: release a jailbreak pulse. Reach: 235 world pixels; cooldown: 2.8 seconds.
- Click a request card or choose a person below the stage, then **Send Claude** or **Send Codex**. Each bot walks over and works on that request.
- **E**: talk to the nearest person and inspect their request.
- Stand near a person to open the laptop and help automatically.
- **Escape** or **pause**: pause the round. The game also pauses when the page loses focus or becomes hidden.
- On a phone, hold the direction, jump, and J buttons. Tap a spot on the stage to move there.

A jailbreak clears a bot’s temporary lock and gives it eight seconds of faster, cooperative work. Every completed request earns 100 points; requests with multiple contributors earn 150. Each bot reached by a jailbreak earns 25. The bots solve curated local cases: converting strings before summing, isolating a variable and substituting the answer, and drafting an email with the requested time and tone. The terminal shows the original problem, the working, and checked results. Code and algebra answers are calculated; the email is assembled and checked against its requirements. A failed check earns no points. There is no network model call. The best score stays in browser storage. Sound starts off and uses synthesized audio when enabled.

## How the Overview works

The GitHub profile README displays an animated game preview. Clicking it navigates in the same tab to GitHub Pages, where the surrounding Overview layout and profile content match and the game starts inside the README panel. GitHub sanitizes executable scripts out of Markdown, so the README itself cannot host interactive JavaScript. This uses the same presentation approach as [Jayant Chopra’s reference](https://github.com/JayantChopra/JayantChopra), without a separate game landing screen, pop-up, or full-screen takeover.

The site is an independently hosted profile view. Profile links, repository links, and navigation point to real GitHub pages. It does not imitate sign-in or collect credentials. Profile counts are a snapshot, not live API counters.

## Art

Chetas has four image-generated sheets: **8 idle frames, 8 walk frames, 8 run frames, and 16 action frames**. The actions include jump, jailbreak cast, laptop typing, and celebration. Movement advances frames by distance traveled; the renderer anchors frames consistently and mirrors them for left-facing movement. The generated sheets deliberately use a magenta chroma key, removed on load. Details and generation prompts: [SPRITES.md](assets/SPRITES.md).

Clawd and Codex are drawn entirely in JavaScript. Clawd uses the orange block body, square eyes, and little legs from the Claude mascot. Codex uses the blue scalloped head, dark terminal face, and small blue body from the Codex desktop pet. No mascot raster sheet is shipped. People reuse the shaped heads from Chetas’s **Head Cases** project: skull projection, noses, jaws, eyes, brows, hair, glasses, and ink strokes all come from its Canvas drawing system. Nine people have distinct features, outfits, and skin tones. Their eyes follow the conversation; they blink, talk, nod, and change expression as a job progresses. Articulated bodies point, scratch their heads, give a thumbs-up, clap, walk in, and leave. The selected person also appears in a larger live portrait. The simple stage stays code-drawn. This project is a personal fan-made game and is not affiliated with Anthropic or OpenAI.

## Run and verify

```sh
python3 -m http.server 8767 --bind 127.0.0.1
# Open http://127.0.0.1:8767/
node --test game/engine.test.mjs
python3 scripts/build_offline.py
```

`claude-vs-codex.html` is the generated standalone version, including all four sheets and the avatar. It opens directly without a server. The build also produces `game/offline.js`, which lets the local `index.html` open directly. Both generated files are kept out of Git; rebuild them after editing. Hosted pages use the small source modules. To edit the game, change the modules rather than generated output.

- `game/engine.mjs`: deterministic simulation, movement, requests, bot rivalry, jailbreaks, scoring, pause, and round end.
- `game/jobs.mjs`: the cast, example requests, solution calculations, and checks.
- `game/portraits.mjs`: the adapted Head Cases geometry and expressions.
- `game/renderer.mjs`: Canvas rendering, sprite frame extraction, articulated bodies, gestures, live portraits, and procedural mascots.
- `game/main.mjs`: keyboard/pointer controls, accessible status, UI, storage, and browser lifecycle.
- `game/audio.mjs`: opt-in procedural sound effects.

No frameworks, package installation, external game services, analytics, or third-party script dependencies are required.
