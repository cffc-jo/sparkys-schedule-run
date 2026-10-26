# Sparky's Schedule Run

An 8-bit browser game for the **Chicago Fire FC 2027-28 schedule release**. Sparky runs the season: every box he clears (or crashes into) reveals the next opponent, and finishing the run reveals the whole schedule.

- **Live:** https://cffc-jo.github.io/sparkys-schedule-run/
- **Stack:** plain HTML, CSS and JavaScript (ES modules) on a `<canvas>`. No framework, no build step, no runtime dependencies, no backend.
- **Size:** about 550 KB in total, with everything preloaded behind an 8-bit loading bar. It works offline once loaded.
- **Targets:** mobile-first portrait, iOS Safari, Android Chrome, in-app webviews (iOS WKWebView, Android WebView) and desktop.

> **Before launch: brand/legal review.** The opponent logos in `assets/logos/` are **stylised 8-bit renderings of other clubs' marks**, and `config/schedule.json` currently holds a **fictional demo 2027-28 schedule** (`"isDemo": true`, which shows a "DEMO SCHEDULE" tag on the title and end screens). Get the logo usage approved and swap in the real 2027-28 schedule with `"isDemo": false` (see [Swapping in the 2027-28 schedule](#swapping-in-the-2027-28-schedule-and-logos)). The presenting partner, **Carvana**, appears on the start screen, the end screen and a skyline billboard, using their official logo (`assets/sponsors/carvana.svg`, unaltered, on white, logo only); confirm those placements with the partner too.

---

## Contents

1. [Running locally](#running-locally)
2. [Deploying to GitHub Pages](#deploying-to-github-pages)
3. [Swapping in the 2027-28 schedule and logos](#swapping-in-the-2027-28-schedule-and-logos)
4. [Re-running the logo pixelation](#re-running-the-logo-pixelation)
5. [Replacing the Sparky sprite sheet](#replacing-the-sparky-sprite-sheet)
6. [Other generated art (favicon, share image)](#other-generated-art)
7. [Leaderboard (future)](#leaderboard-future)
8. [Analytics (future)](#analytics-future)
9. [Debug mode and tests](#debug-mode-and-tests)
10. [Tunable config values](#tunable-config-values)
11. [Project structure](#project-structure)
12. [Manual QA checklist](#manual-qa-checklist)
13. [Notes, decisions and credits](#notes-decisions-and-credits)

---

## Running locally

ES modules need a web server; opening `index.html` straight from disk won't work.

**Windows, no installs needed:**

```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Then open http://localhost:8541/. Add `?debug=1` for the [developer tools](#debug-mode-and-tests).

Any other static server works too (e.g. `npx serve .`, `python -m http.server`). Only `tools/serve.ps1` supports the **Save** buttons in the dev tools, which write generated images straight into the project.

## Deploying to GitHub Pages

The repo root **is** the site. All paths are relative, so it works under `https://<org>.github.io/<repo>/`.

1. Push to `main`.
2. One-time setup: in the GitHub repo, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch** and set **Branch: `main` / `(root)`**.
3. Wait a minute or two for the deploy (**Actions** tab), then hard-refresh the site.

If the game moves to a different address (another repo or a custom domain), update the **absolute** share-preview URLs in `index.html` (`og:url`, `og:image`, `twitter:image`). Social networks can't read relative paths. Everything else is relative and moves as-is.

The app's link can be a plain `<a href>` to the Pages URL. External links in the game (**View schedule**) use `target="_blank"`, which in-app webviews hand off to the browser.

## Swapping in the 2027-28 schedule and logos

`config/schedule.json` is the only file that needs editing for the release.

1. **Edit `config/schedule.json`.** Keep one entry per regular-season match, in date order, and set `"isDemo": false`:

   ```json
   {
     "season": "2027-28",
     "isDemo": false,
     "note": "Official 2027-28 schedule",
     "midwinterBreakAfterMatch": 18,
     "matches": [
       { "matchNumber": 12, "opponent": "New England Revolution", "code": "NE", "homeAway": "HOME", "date": "2027-10-16", "dayOfWeek": "Sat", "kickoff": "7:30 PM CT", "conference": "East", "half": 1 }
     ]
   }
   ```

   | Field | Notes |
   |---|---|
   | `season` | Shown on the title screen and the end screen ("YOUR 2027-28 SCHEDULE"). |
   | `isDemo` | `true` shows a small "DEMO SCHEDULE" tag on the title and end screens. **Set it to `false` for the real release.** |
   | `note` | Free text for people editing the file. The game ignores it. |
   | `midwinterBreakAfterMatch` | Optional. The match number the midwinter break follows. Adds a stretch of open pitch after that box with a "MIDWINTER BREAK" banner, and a divider in the end-screen list. Leave it out for no break. |
   | `matchNumber` | Shown on the reveal banner and in the opponents list. |
   | `opponent` | Official club name. Accents are fine (they're removed for display: "CF MONTREAL"). |
   | `code` | Club code. The logo is loaded from `assets/logos/<code>.png`, and the code is the fallback label if a logo is missing. **Case matters on GitHub Pages:** `MIA.png` ≠ `mia.png`. (An optional `logo` path overrides this.) |
   | `homeAway` | `HOME` or `AWAY`. Home boxes have a solid red frame; away boxes a dashed sky-blue frame. |
   | `date` | `YYYY-MM-DD` (shown as "SAT, OCT 16"), or any text such as `"TBD"` (shown as typed). The date also sets the **season** of the scenery after that box (see below). |
   | `dayOfWeek` | Optional, e.g. `"Sat"`. Worked out from the date if left out. If it doesn't match the date, the browser console warns. |
   | `kickoff` | Optional, e.g. `"7:30 PM CT"`. Kept with the match for future use (not shown in the game). |
   | `conference` | Optional, `"East"` or `"West"`. Kept with the match for future use. |
   | `half` | Optional, `1` or `2`: which half of the summer-to-spring season. Kept with the match for future use. |

   - The number of boxes comes from `matches.length`, so any number of matches works.
   - Opponents the Fire play more than once simply appear more than once.
   - `js/schedule.js` reads the file and fills in the defaults above. Problems such as a wrong weekday show as console warnings; the game still runs.

2. **Logos for new clubs:**
   1. Add the high-res file as `assets/logos-source/<CODE>@3x.png`.
   2. Generate the pixel version (see the next section).
   3. Commit `assets/logos/<CODE>.png`.

   If a logo is missing, the box shows the club code instead, so nothing breaks.

3. **Check the course.** A new schedule produces a new, but always identical, course layout. Open `tests/run.html` (all tests should pass) and play a run with `?debug=1` to confirm it feels right. Reaction gaps are enforced by the tests. A clean run should land around 45–60 s (currently about 0:51.7 for 35 matches, including the midwinter break and the power-up speed boosts).

4. **Commit and push.** Pages redeploys automatically.

## Re-running the logo pixelation

High-res originals live in `assets/logos-source/` as `<CODE>@3x.png`. They are **kept out of git** on purpose (`.gitignore`): GitHub Pages would publish them. Only the small pixel versions in `assets/logos/` ship.

The conversion (same code for both options, in `tools/pixelate-core.js`):

1. Trim transparent padding and centre the logo on a square.
2. Downscale to 48×48. The game draws logos at double detail in a 24 px slot. The CHI crest is 88×88.
3. Reduce to the logo's own most-used colours (up to 16), so each club stays recognisable.
4. Snap alpha to fully on or off for crisp edges, and add a 1 px dark outline.

**Option A: the contact sheet (no Node needed).**
1. Run `tools/serve.ps1` and open http://localhost:8541/tools/logo-preview.html.
2. Review every original next to its pixel version at 1×/2×/4×, plus how it looks in a HOME box and an AWAY box. Tweak the size, colours, outline or resampling if needed.
3. Click **Save to assets/logos/**. Without `serve.ps1`, use **Download all PNGs** and move the files in by hand.

**Option B: Node script.** Requires Node 18+.

```bash
npm install
```
```bash
npm run logos
```

Options: `node tools/pixelate-logos.js --size 48 --colors 16 --no-outline --resample nearest|detail`.

**Per-club tweaks** go in `OVERRIDES` in `tools/pixelate-core.js` and are applied by both the script and the contact sheet. Inter Miami (`MIA`) uses `resample: 'detail'`: every pixel snaps to the logo's own colours first, then thin accent lines win over the badge's main fill, so fine pink line work on black survives at 48 px. Try `detail` on any logo whose inside looks muddy.

## Replacing the Sparky sprite sheet

Sparky is drawn from `assets/sprites/sparky.png` using the frame map in `config/sprites.js`. A designer's sheet drops in with **no code changes**:

1. Save the new sheet as `assets/sprites/sparky.png`.
2. Update the rectangles in `config/sprites.js` → `frames` to match where each frame sits on the new sheet. Frame sizes can change, and each frame can override its anchor with `anchorX` / `anchorY`.

   | Frames | Used for |
   |---|---|
   | `idle0`, `idle1` | Title screen idle and blink |
   | `run0`–`run3` | Run cycle |
   | `jump` | Jumping |
   | `spin` | Double jump (the game turns it in 90° steps) |
   | `duck` | Crouching |
   | `hit` | Stumble after a hit |
   | `victory0`, `victory1` | Finish celebration |

3. If the new art is a different size, check `hitbox` in the same file. Collision uses these numbers, not the art. `tests/run.html` checks that the duck height fits under floating boxes and the standing height doesn't.

If the PNG is ever missing, the game rebuilds an identical sheet from the built-in pixel art in `js/art/sparkyArt.js`. To re-export it after editing that art, use `tools/export-art.html`.

The costume reference photos belong in `reference/sparky/`. That folder is in `.gitignore` and must never be published (some are watermarked stock photos).

## Other generated art

`tools/export-art.html` regenerates these from the built-in pixel art. Click **Save all** with `serve.ps1` running.

| File | Use |
|---|---|
| `assets/sprites/sparky.png` | Sparky sprite sheet (12 frames, 24×32 each) |
| `assets/favicon.png` | 32×32 browser tab icon |
| `assets/apple-touch-icon.png` | 180×180 home-screen icon |
| `assets/og-image.png` | 1200×630 link preview for Facebook, X, iMessage and Slack |

## Leaderboard (future)

The leaderboard is **on hold**. Nothing is built server-side, but the code is ready for it:

- **`js/leaderboard.js`** has the full interface as safe no-ops: `isEnabled()` (returns `false`), `submitScore({ initials, finalTimeMs, rawTimeMs, penalties })`, `getTop(n)` and `getRank(finalTimeMs)`.
- **`GAME.flags.LEADERBOARD_ENABLED`** in `config/game.js` is `false`. The flow only detours when **both** the flag is on and `isEnabled()` returns true. Until then it goes Finish → End screen.
- **The run result** is a single object, `app.lastResult = { finalTimeMs, rawTimeMs, penalties, penaltyMs }`, ready to submit as-is.
- **The insertion point** is `afterFinish()` in `js/main.js` (marked). The initials screen goes there.
- **The end screen** has a hidden, clearly marked `[data-leaderboard]` slot for the top 10 and "You'd currently be in Nth place".

Planned design, for context:
- GitHub Pages is static, so a small hosted backend is needed (e.g. Supabase or Firebase).
- Players pick a 3-letter A–Z arcade name, checked against a blocklist (profanity, slurs, hate-group and politically charged acronyms) both in the game and on the server.
- Scores are submitted through a server-side function that sanity-checks times (for example, nothing faster than a perfect run) and rate-limits.
- The game must stay fully playable if the leaderboard is down or slow.

## Analytics (future)

`js/analytics.js` has a `track(eventName, data)` that does nothing yet. With `?debug=1` it logs to the console. To wire up GA4 or similar, implement `track()` there and nothing else changes. Events already fired:

| Event | When | Data |
|---|---|---|
| `game_start` | A run starts | `{ matches }` |
| `game_complete` | Sparky crosses the finish | `{ finalTimeMs, rawTimeMs, penalties }` |
| `schedule_click` | **View schedule** tapped | `{ source: 'title' \| 'end' }` |
| `share_click` | **Share** tapped | `{ finalTimeMs }` |
| `play_again` | **Play again** on the end screen | — |
| `tutorial_complete` | **Let's go!** on the last tutorial card | `{ step }` |
| `tutorial_skip` | **Skip** or Esc during the tutorial | `{ step }` (the card they left on) |

Outbound schedule link and UTM tags: `config/links.js`. Share text, with a slot for a future hashtag: `config/links.js` → `SHARE`.

## Debug mode and tests

**`?debug=1`** (e.g. http://localhost:8541/?debug=1):
- Hitboxes for Sparky, boxes, cables and balls.
- FPS counter, bottom-right.
- A panel with **God mode** (no penalties), **Skip to finish** and a **Speed** slider (0.25×–2× game time).
- Analytics events logged to the console.
- `window.__app` exposed for poking at state.

**Unit tests** (dependency-free):
- **Browser:** open http://localhost:8541/tests/run.html. All tests should pass.
- **Node:** run `npm test`.

They cover:
- the speed formula and its cap
- timer and penalty math (final = raw + 10 s × hits, exactly)
- the gesture classifier
- obstacle spacing at the fastest speed possible at each point
- course rules: one box per match, the type mix, easy start, no early hard back-to-back, deterministic layout, any schedule length
- jump physics against obstacle heights
- ball placement
- season boundaries

## Tunable config values

Everything gameplay-related lives in **`config/game.js`** (commented line by line). Units are logical pixels on the 240×428 canvas and seconds.

| Group | Key | Default | What it does |
|---|---|---|---|
| view | `width`, `height` | 240, 428 | Logical canvas size. Smaller = more zoomed in |
| view | `renderScale` | 2 | Backing-canvas multiplier. Logos use the extra detail |
| view | `integerScaleMinFill` | 0.88 | Use crisp whole-number scaling only if it fills ≥ 88% of the screen |
| loop | `fixedStep` | 1/120 | Physics step (frame-rate independent) |
| loop | `maxFrameTime` | 0.25 | Clamp for long frames |
| world | `groundY` | 350 | Running line |
| world | `pitchDepth` | 64 | Pitch visible behind Sparky (≈ 1/3 of the screen is pitch) |
| world | `sparkyX` | 40 | Sparky's fixed x (further left = more look-ahead) |
| world | `crestSize` | 44 | Crest size on the title |
| world | `titleBoardSpeed` | 24 | LED board scroll on the title |
| physics | `gravity` | 2200 | Gravity (snappy arcade jumps) |
| physics | `jumpVelocity` | 545 | First jump (apex ≈ 67 px, airtime ≈ 0.5 s) |
| physics | `doubleJumpVelocity` | 545 | Second jump |
| physics | `maxDoubleJumps` | 1 | Double jumps per airtime |
| physics | `fastFallVelocity` | 900 | Swipe-down slam speed |
| physics | `duckDuration` | 0.45 | Duck length (no hold) |
| physics | `jumpBufferTime` | 0.10 | Early jump press remembered |
| physics | `hitStumbleTime` | 0.35 | Stumble frame after a hit |
| speed | `baseSpeed` | 190 | Starting world speed (px/s) |
| speed | `boostPerClear` | 0.01 | +1% per cleared box (≈ +34% by the end of a clean run) |
| speed | `maxSpeedMultiplier` | 1.35 | Speed cap |
| course | `leadIn` | 300 | Open ground before box 1 |
| course | `reactionGap` | 0.8 | Seconds of open ground between boxes at the **fastest speed possible at that point** (clean run, capped) |
| course | `extraSpacingMax` | 0.12 | Extra room early in the season |
| course | `seed` | `''` | Layout seed (blank = derived from the schedule) |
| course | `easyStartCount` | 6 | First boxes are always ground boxes |
| course | `typeMix` | 60/25/15 | Ground / floating / tall |
| course | `noBackToBackHardUntil` | 0.6 | No two hard boxes in a row for this fraction of the run |
| course | `finishRunout` | 220 | Ground from the last box to the goal |
| course | `midwinterBreakSeconds`, `midwinterBannerDelay` | 1.6, 1.0 | Extra open pitch at the midwinter break; when its banner appears |
| obstacles | `boxSize`, `logoSize`, `logoPadding` | 30, 24, 1 | Box, logo slot, and the white margin around the logo inside it |
| obstacles | `floatingBottom` | 20 | Gap under floating boxes (must be between duck and stand heights) |
| obstacles | `tallCrateHeight` | 44 | Crate under tall boxes (forces a double jump) |
| obstacles | `hitboxInset` | 3 | Forgiving collision |
| obstacles | `bobAmplitude`, `bobSpeed` | 2.5, 2.4 | Idle bob |
| penalties | `penaltySeconds` | 10 | Seconds added per hit |
| penalties | `graceSeconds` | 1 | Flicker after a hit (no double penalties) |
| penalties | `shakeSeconds`, `shakeMagnitude` | 0.25, 3 | Screen shake |
| balls | `count` | 5 | Soccer balls on the course |
| balls | `invincibilitySeconds` | 5 | Power-up length (resets, doesn't stack) |
| balls | `speedBoost`, `boostRampSeconds` | 1.25, 0.3 | Run speed while powered up; ramps in, eases out over `warningSeconds` |
| balls | `endGraceSeconds` | 0.25 | Boxes touched just after the power-up ends still smash (no penalty) |
| balls | `warningSeconds` | 1 | End-of-power-up warning |
| balls | `size`, `radius` | 20, 13 | Ball size and (generous) pickup range |
| balls | `arcHeight`, `lowHeight`, `lowLead` | 80, 12, 42 | Ball placement |
| balls | `bobAmplitude`, `spinFps` | 2, 8 | Ball animation |
| input | `swipeMinDistance` | 30 | CSS px for a swipe |
| input | `swipeMaxTime` | 250 | ms for a swipe |
| ui | `bannerSeconds` | 1.8 | Reveal banner time |
| ui | `bannerMinSeconds` | 1.2 | Minimum time a banner stays up; a newer reveal waits its turn |
| ui | `celebrateSeconds` | 1.8 | Finish celebration before the breakdown |
| ui | `countdownStepSeconds` | 0.75 | 3-2-1 beat length |
| ui | `buttonCooldownMs` | 350 | Ignore double-taps on buttons |
| audio | `sfxVolume`, `musicVolume` | 0.7, 0.3 | Volumes |
| flags | `LEADERBOARD_ENABLED` | false | See [Leaderboard](#leaderboard-future) |
| — | `storageKeyPrefix` | `sparky-run:` | localStorage namespace (mute, personal best, `tutorialSeen`) |

Other config files:

| File | Contents |
|---|---|
| `config/schedule.json` | Season and matches |
| `config/palette.js` | Official club colours (`PALETTE`) and approved background-only scenery colours per season (`SEASONS`: winter, spring, summer, fall, including weather) |
| `config/sprites.js` | Sparky frame map and hitboxes |
| `config/links.js` | Schedule URL, UTM tags, game URL, share text |

## Project structure

```
index.html              page, meta/OG tags, DOM screens (buttons, modal, pause, finish, end)
css/style.css           layout, letterboxing, safe areas, pixel UI
config/                 everything tunable (see above)
js/main.js              boot, preload, screen flow, actions, lifecycle
js/loop.js              fixed-timestep requestAnimationFrame loop
js/renderer.js          logical canvas + crisp scaling/letterboxing
js/scenes/              title.js, tutorial.js (first-time walkthrough), play.js (the run), end.js
js/game/                sparky.js (physics), boxArt.js, banner.js, particles.js
js/world/background.js  sky, clouds, skyline parallax, LED boards, pitch
js/art/                 built-in pixel art (Sparky, ball, icons) + helpers
js/audio/               synth.js (sound effects), music.js (chiptune + sequencer), audio.js
js/input/               input.js (touch/mouse/keyboard), gesture.js (classifier)
js/course.js            deterministic course builder
js/timer.js, speed.js   timer/penalty math, speed formula
js/best.js, share.js    personal best, Web Share / copy fallback
js/schedule.js, format.js  schedule.json schema (defaults, logo from code, warnings), date formatting
js/leaderboard.js       stub (future)
js/analytics.js         stub (future)
js/debug.js             ?debug=1 tools
tools/                  serve.ps1, logo pixelation (core + Node script + contact sheet), export-art.html
tests/                  tests.js + run.html (browser) + run.js (Node)
assets/                 font (+ OFL licence), logos, sponsors (Carvana), sprites, icons, share image
```

## Manual QA checklist

Run through this on **iOS Safari**, **Android Chrome**, the **Chicago Fire app's in-app webview** (iOS and Android), and **desktop** Chrome, Edge, Safari or Firefox.

**Loading and layout**
- [ ] Loading bar fills, then the title appears. There are no errors in the console with `?debug=1`.
- [ ] Portrait phone: the game fills the width. Nothing sits under the notch or home bar, and buttons are easy to tap (≥ 44 px).
- [ ] Desktop: a centred portrait frame on the red branded background.
- [ ] Rotate a phone to landscape: the "Rotate your phone" prompt appears and a run in progress pauses.
- [ ] Pinch-zoom, double-tap zoom, pull-to-refresh, page scroll, text selection and the long-press menu all do nothing during play.

**Title screen**
- [ ] Sparky idles and blinks, and the LED boards scroll. The title loop plays after the first tap.
- [ ] **View schedule** opens chicagofirefc.com/schedule with the `utm_*` tags, in a new tab or the system browser (including from the in-app webview).
- [ ] **?** opens How to Play: it scrolls, Esc closes it, Tab stays inside it, and focus returns to **?**.
- [ ] Mute toggles music and sound effects. It's remembered after a reload and shows on every screen.

**First-time tutorial**
- [ ] On a device that has never played (or after clearing site data), **Play** opens the 5-card tutorial: Goal (including the +10 s penalty), Jump, Duck, Power-ups, The schedule. Each card has a live demo of Sparky doing it.
- [ ] Wording matches the device: phones say TAP / SWIPE; desktop shows SPACE / W / ↑ and S / ↓.
- [ ] **Next** (or Enter / →) advances and ← goes back. The last button is **Let's go!**, which starts the countdown.
- [ ] **Skip** (or Esc) jumps straight into the run.
- [ ] After finishing or skipping once, **Play** goes straight to the run, including after a reload.
- [ ] **How to Play → Tutorial** replays it from the title or end screen. The button is hidden mid-run.

**Gameplay**
- [ ] 3-2-1-GO with beeps. The timer starts on GO and the theme starts on GO.
- [ ] Tap or swipe up jumps instantly. Tapping again in the air double-jumps with a spin. A third tap does nothing.
- [ ] Swipe down ducks for about 0.6 s. Swiping down mid-air slams down, then ducks.
- [ ] Keyboard: Space / W / ↑ jump, S / ↓ duck, P / Esc pause. Mouse click jumps.
- [ ] Ground boxes need a jump, floating boxes need a duck, and tall boxes need a double jump.
- [ ] Hitting a box adds **exactly +10.0 s**, with a "+10" pop, shake, stumble, buzz on Android, and about 1 s of flicker with no second penalty.
- [ ] Every box, cleared or hit, shows the reveal banner with logo, match number, HOME/AWAY, opponent and date. Long names wrap.
- [ ] Clearing boxes gradually speeds the run up.
- [ ] The scenery changes season as boxes pass, following each match date: winter (snowy pitch, heavy snowfall, snowmen) → spring (tulips and daisy bushes, petals) → summer → fall (olive-gold grass, falling leaves, leaf piles, plus jack-o'-lanterns after October matches). Sky and pitch colours crossfade over about 2 s. Props (snowmen, flowers, leaf piles, jack-o'-lanterns) never fade: they stay fully opaque, and after a change new ones simply stop or start arriving as the timeline moves on. With reduced motion there's no weather and changes are instant.
- [ ] Soccer balls: collecting one gives a glow, a draining meter, faster music and 5 s of invincibility. Boxes shatter with no penalty and still reveal. Collecting another resets the meter to 5 s. The meter blinks in the last second.
- [ ] All 5 balls can be collected in a clean run without hitting anything.
- [ ] A clean run finishes in about 45–60 s. The current course is about 0:54.

**Pause and lifecycle**
- [ ] Pause button, P or Esc: the pause menu appears (Resume / Restart / How to play / Sound / Main menu). The timer and music stop.
- [ ] Opening **?** mid-run pauses the game, and closing it returns to the pause menu.
- [ ] **App backgrounding:** switch apps, lock the phone or pull down a notification mid-run. On return the game is paused, the timer didn't advance, and audio is silent until you resume.
- [ ] Space or Enter presses the focused pause-menu button and doesn't jump.

**Finish and end screen**
- [ ] Sparky runs into the side-on goal, "SEASON COMPLETE!" shows with confetti and a fanfare, then the breakdown appears with run time, penalties × count, and final time = run time + 10 s × hits.
- [ ] **Continue** opens the end screen with the final time, breakdown and personal best.
- [ ] Beating your best flashes **NEW BEST!**. A slower run keeps the old best.
- [ ] The "Your 2027-28 schedule" list scrolls and shows all matches in order with logo, HOME/AWAY and date.
- [ ] **Share**: the phone's share sheet opens with "I ran Sparky's Schedule Run in M:SS.t — can you beat me?" and the link. On desktop or webviews without sharing, "LINK COPIED!" appears and the clipboard holds the text and link.
- [ ] **Play again** starts a fresh run with the same course layout.

**Edge cases**
- [ ] **Rapid tapping** during play: no crashes. Jumps are capped at jump + one double jump.
- [ ] **Double-tapping buttons** (Play, Play again, Continue, Share): each acts once.
- [ ] **Replay several times in a row** (5+ runs): no slowdown, no duplicate music, the timer resets each time, and the personal best updates correctly.
- [ ] Private browsing or storage blocked: the game still works, but mute and best aren't remembered.
- [ ] **Reduced motion** (OS setting): no screen shake, minimal bobbing, no confetti or banner slide, and a steady invincibility glow.
- [ ] iPhone with the silent switch on: web audio is muted by iOS, which is expected.
- [ ] **Offline after load:** turn on airplane mode after the title loads, and a full run still works.

## Notes, decisions and credits

- **Font:** "Press Start 2P" by CodeMan38, SIL Open Font License, self-hosted (`assets/fonts/OFL.txt`).
- **Audio:** every sound and both music loops are generated in code with the Web Audio API. There are no audio files to license.
- **Skyline landmarks** (`js/world/background.js`): Willis Tower, the John Hancock Center, the Wrigley Building (white terra-cotta clock tower with the north building and skybridge) and McDonald's Park, the Fire's planned stadium at The 78 (its symmetrical main face: tall glass entrance under the sign band, framed dark-glass windows mirrored on each side, Fire-red banner piers at both corners, flat overhanging dark roof). They're simplified pixel renderings, without signage or logos.
- **Colours:** characters, UI, text and boxes use only the official palette (`PALETTE`). The daytime sky, skyline and grass use an approved background-only `SCENERY` palette.
- **Scaling:** whole-number device-pixel scaling is used when it fills ≥ 88% of the screen. Otherwise the game fills the screen with pixelated scaling, since strict whole numbers left the game at about 75% size on many phones.
- **Logo downscaling** averages pixels rather than using pure nearest-neighbour, because nearest-neighbour drops thin lettering. Colours are then snapped to each logo's palette, so the result is still hard-edged pixel art. Use `--resample nearest` to switch back.
- **Spacing:** each gap is sized for the fastest speed the player could possibly have reached at that point (a clean run so far, capped). Speed only rises with clears, so anyone who has been hit is slower and gets *more* time. This keeps a perfect run in the 45–60 s target while every gap still guarantees `reactionGap` seconds.
- **Seasons:** as Sparky passes each box, the sky, clouds, sun and pitch take on the season of that match's date (`js/season.js`): winter until Mar 19, spring Mar 20–Jun 20, summer Jun 21–Sep 21, fall Sep 22–Nov 20, then winter again (equinox and solstice dates split the overlapping months). The title and the start of a run use the first dated match's season. Undated (`TBD`) matches keep the current season. Colours, weather (`WEATHER.rate` = particles per second) and pitch-side props (`DECOR`, `DECOR_OCTOBER`: sprite + chance per slot) for each season are in `SEASONS` in `config/palette.js`. Prop art is in `js/art/decorArt.js`.
- **Floating boxes hang from a cable** so they can only be ducked, never jumped over.
- **Swipe down on the ground** briefly starts a hop, because jump fires instantly on touch. It then slams back down and ducks within about 20 ms.
- **Placeholder schedule:** the 2026 Chicago Fire regular season, from the MLS stats API, matching the club's schedule release except Vancouver (moved). Two matches were changed after release: **Vancouver (match 27)** moved to Oct 6 because of wildfire smoke, and **Columbus (match 34)** moved venue to SeatGeek Stadium. Replace the whole file at release.
