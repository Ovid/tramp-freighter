# Narrative Event Art

Art brief for every narrative event that has no named speaker, i.e. every
entry in `NARRATIVE_EVENTS` (`src/game/data/narrative-events.js`) with
`speaker: null`. The named NPCs are covered in [`npcs.md`](npcs.md).

There are two kinds of image:

- **Portraits** of the unnamed people who talk to the player: dockworkers,
  passengers, a newsreader. They follow `npcs.md` exactly.
- **Scenes** for events with nobody in them: a debris field, a fuel gauge, a
  patched hull. They use the same look, but show places and objects instead
  of a face.

---

## Event → Image

| Event id | Image | Kind |
|---|---|---|
| `dock_sol_first` | `scene_dock_sol_first.png` | scene |
| `dock_barnards_first` | `chen_barnards.png` (from `npcs.md`) | portrait |
| `dock_generic_rumor` | `dockworker_m.png` | portrait |
| `dock_beyond_the_lanes_rumor` | `dockworker_f.png` | portrait |
| `dock_barnards_engineer_rumor` | `dockworker_m.png` | portrait |
| `dock_cheap_fuel` | `mechanic_fuel.png` | portrait |
| `dock_barnards_pre_tanaka` | `dock_tech_barnards.png` | portrait |
| `dock_barnards_pre_tanaka_followup` | `dock_tech_barnards.png` | portrait |
| `jump_salvage` | `scene_jump_salvage.png` | scene |
| `jump_salvage_result` | `scene_jump_salvage_result.png` | scene |
| `jump_quiet_moment` | `scene_jump_quiet_moment.png` | scene |
| `jump_strange_signal` | `scene_jump_strange_signal.png` | scene |
| `time_news_broadcast` | `news_anchor.png` | portrait |
| `cond_low_fuel` | `scene_cond_low_fuel.png` | scene |
| `cond_hull_damage` | `scene_cond_hull_damage.png` | scene |
| `cond_debt_free` | `scene_cond_debt_free.png` | scene |
| `passenger_complaint_comfort` | `passenger_{type}.png` for the passenger on board | portrait |
| `passenger_wealthy_tip` | `passenger_wealthy.png` | portrait |
| `passenger_family_children` | `passenger_family.png` | portrait |

The passenger `{type}` is one of the keys of `PASSENGER_CONFIG.TYPES` in
`src/game/constants.js`: `refugee`, `business`, `wealthy`, `scientist`,
`family`.

### Not covered

- **Events with a named speaker** (`time_debt_warning`,
  `cole_first_payment_hint`, `tanaka_intro`) already use the `npcs.md`
  portraits.

---

## Style Guide

### Portraits

Follow the **Style Guide** in `npcs.md` exactly: the same framing, rendering
style, treatment, readability rules, **base prompt** and **negative prompt**.
Every entry below gives the tint to substitute for `{TINT}`.

One exception: **`passenger_family.png` may show more than one person** (see
its entry). For that image only, drop `multiple people` from the negative
prompt and `a single subject` from the base prompt.

These characters are minor and appear briefly, so make them a little less
individual than the named cast. They should still be readable at
64–128 px and have one signature detail. None of them should be mistaken for a
named NPC, particularly the station workers, who must not look like Wei Chen
or Rusty Rodriguez.

### Scenes

The concept is the same: the player sees this on their ship's CRT display.
This time it's an external camera, a cockpit view or a close-up of a console,
not someone on a call.

- **Same look as the portraits:** painted 1990s adventure-game art, visible
  brush strokes, confident dark outlines, a posterised palette of about 16
  colours, scanlines, phosphor bloom, a vignette and slight screen curvature.
- **No people.** The player is implied (an empty seat, a mug), never shown.
- **One clear focal object**, which is the signature detail. Scenes are shown
  at the same small size as portraits, so they need the same simple, strong
  shapes.
- **No readable text** on screens, gauges or labels. Use shapes, lamps and
  waveforms instead. The single exception is the "0" in
  `scene_cond_debt_free.png`.

#### Scene tints

| Scenes | Tint | Hex | Why |
|---|---|---|---|
| Warnings (low fuel, hull damage) | Amber | `#ffaa00` | The UI's warning colour |
| Everything else | Phosphor green | `#00ff88` | The game's primary UI colour |

#### Scene base prompt

MANDATORY: use this before every scene's **Prompt** line, replacing `{TINT}`
with the tint named in that entry:

> RETRO SCI-FI VIDEO-GAME SCENE ILLUSTRATION, NO PEOPLE, hand-painted digital
> illustration in the style of 1990s adventure-game cutscene stills, visible
> brush strokes, simplified shapes, confident dark outlines, posterised limited
> palette of about 16 colours. Shown on an old CRT screen aboard a small
> freighter. Muted colours with a subtle {TINT} phosphor tint in the shadows
> and glow. Faint horizontal scanlines, slight phosphor bloom, soft vignette
> with slight screen curvature. Gritty, lived-in, blue-collar space-trucker
> aesthetic. Square format, one clear focal object, strong readable shapes.

#### Scene negative prompt

The `npcs.md` negative prompt, minus `full body` and `multiple people`, plus:

> person, people, face, human figure, hands, readable text, numbers, letters

(For `scene_cond_debt_free.png`, drop `numbers` so the "0" can be drawn.)

### Output

- **Aspect ratio:** 1:1 square.
- **Resolution:** 1024 px or larger.
- **No text, logos, UI frames, borders or watermarks**, apart from the "0"
  noted above.
- **File names:** as given in each entry. Portraits use a role name; scenes
  use `scene_` plus the event id. Source art goes in `images/narrative/`;
  `scripts/build-portraits.sh` builds `public/portraits/narrative/*.webp`.

---

## Portraits

### Dockworker (female)

- **File:** `dockworker_f.png`
- **Tint:** green
- **Pronouns:** she/her
- **Used by:** `dock_beyond_the_lanes_rumor`, and optionally
  `dock_generic_rumor`
- **Canon:** "A dockworker sidles up while you wait for clearance." She passes
  on spacer talk about "routes that don't show on any starmap", then shrugs:
  "Probably just spacer talk. But who knows?"
- **Look:** South Asian heritage, mid-40s. A cargo loader with a round, open
  face and a gossip's half-smile. Thick black hair in a single plait over one
  shoulder. A sleeveless padded work vest over a faded thermal shirt. Must not
  look like Wei Chen: no knit cap, no pin, no coveralls.
  **Signature detail:** chunky ear defenders hanging around her neck.
- **Expression:** a conspiratorial half-smile and raised eyebrows. She's
  enjoying telling you this.
- **Prompt:** A friendly South Asian woman in her mid-40s, a space station
  cargo loader, with a round open face, a thick black plait over one shoulder,
  a padded work vest over a faded thermal shirt, and chunky ear defenders
  around her neck. A conspiratorial half-smile with raised eyebrows, as if
  sharing a rumour. Dim dock lighting and the shape of a cargo crane behind
  her.

### Dockworker (male)

- **File:** `dockworker_m.png`
- **Tint:** green
- **Pronouns:** he/him
- **Used by:** `dock_barnards_engineer_rumor`, and optionally
  `dock_generic_rumor`
- **Canon:** "A dockworker sidles up while you wait for clearance." He tips the
  player off about Yuki Tanaka, then "lowers his voice. 'Picky about who she
  works with, though.'"
- **Look:** Irish heritage, early 50s. A ruddy, broken-veined face, thinning
  ginger-grey hair and a few days' stubble. A grubby quilted work jacket with
  the collar turned up. He's leaning in close to the camera, as if to whisper.
  **Signature detail:** a stub of pencil tucked behind one ear.
- **Expression:** sly and confiding, mid-whisper.
- **Prompt:** A ruddy Irish man in his early 50s, a space station dock worker,
  with thinning ginger-grey hair, a few days' stubble and a stub of pencil
  tucked behind one ear. He wears a grubby quilted work jacket with the collar
  turned up and leans in close to the camera as if whispering a secret. A sly,
  confiding expression. Dim dock lighting behind him.

### Fuel Mechanic

- **File:** `mechanic_fuel.png`
- **Tint:** green
- **Pronouns:** they/them
- **Used by:** `dock_cheap_fuel`
- **Canon:** "A mechanic notices your fuel gauge as you dock. 'Running on
  fumes, huh? I got some fuel canisters that fell off a transport. Half
  price.'"
- **Look:** Brazilian heritage, early 30s, any gender. Curly dark hair under a
  backwards cap and a thin moustache or a gold tooth. An oil-stained jacket
  with the sleeves pushed up. Deliberately shadier than Rusty Rodriguez: younger,
  slicker, less honest.
  **Signature detail:** a dented fuel canister held up into frame like a
  product on display.
- **Expression:** a salesman's wink and grin. Definitely stolen.
- **Prompt:** A shady Brazilian mechanic in their early 30s with curly dark
  hair under a backwards cap and a gold tooth, wearing an oil-stained jacket
  with the sleeves pushed up, holding a dented fuel canister up beside their
  face like a product on display. A salesman's wink and a crooked grin. A
  dim, cluttered corner of a refuelling dock behind them.

### Dock Tech, Barnard's Star

- **File:** `dock_tech_barnards.png`
- **Tint:** green
- **Pronouns:** she/her
- **Used by:** `dock_barnards_pre_tanaka`,
  `dock_barnards_pre_tanaka_followup`
- **Canon:** "A dock tech looks you over. 'Tanaka? Yeah, she's here. But she
  doesn't talk to green pilots.'" Later: "'More than you've got.' The dock
  tech counts on her fingers."
- **Look:** Ukrainian heritage, late 20s. A narrow face, pale blond hair
  scraped back into a short ponytail. A fitted technician's jumpsuit with
  diagnostic cables clipped to the chest. Same station as Wei Chen, so keep
  her clearly different: younger, sharper, no cap.
  **Signature detail:** a scratched diagnostic visor flipped up on her
  forehead.
- **Expression:** blunt and unimpressed, looking the player up and down.
- **Prompt:** A blunt Ukrainian woman in her late 20s, a space station dock
  technician, with a narrow face, pale blond hair scraped back into a short
  ponytail and a scratched diagnostic visor flipped up on her forehead. She
  wears a fitted technician's jumpsuit with cables clipped to the chest. An
  unimpressed, appraising look. A retrofitted mining-platform dock in dim
  light behind her.

### News Anchor

- **File:** `news_anchor.png`
- **Tint:** green
- **Pronouns:** he/him
- **Used by:** `time_news_broadcast`
- **Canon:** "The newsfeed crackles to life. '...trade disputes continue
  between the inner and outer colonies. Commodity prices remain
  volatile...'" The player's reaction: "Same old story."
- **Look:** West African (Ghanaian) heritage, late 40s. Close-cut hair, a
  neat beard and a presenter's suit and tie, the most "professional" frame in
  the set. He's tired underneath it, reading the same headline for the
  hundredth time. Plain studio backdrop painted as a flat colour block.
  **Signature detail:** a band of static or signal tearing across part of the
  image. This is a broadcast received from far away.
- **Expression:** a practised, neutral newsreader's face with tired eyes.
- **Prompt:** A Ghanaian male news anchor in his late 40s with close-cut hair
  and a neat beard, wearing a presenter's suit and tie, speaking to camera
  with a practised, neutral expression and tired eyes. A plain flat studio
  backdrop. A band of signal static tears across part of the image, as if
  received from a distant relay.

### Passenger: Refugee

- **File:** `passenger_refugee.png`
- **Tint:** green
- **Pronouns:** she/her
- **Used by:** `passenger_complaint_comfort` (when the passenger is a refugee)
- **Canon:** "Please, I need to get away from here." "Thank you for helping
  me." (`PASSENGER_CONFIG.TYPES.refugee` in `constants.js`)
- **Look:** Middle Eastern heritage, early 20s. A hollow-eyed young woman,
  hair tangled under a loose headscarf, clutching a bundle of belongings
  against her chest.
  **Signature detail:** a crinkled foil shock blanket around her shoulders.
- **Expression:** exhausted, wary and grateful at the same time.
- **Prompt:** A hollow-eyed Middle Eastern woman in her early 20s, a refugee,
  with tangled hair under a loose headscarf and a crinkled foil shock blanket
  around her shoulders, clutching a bundle of belongings to her chest. An
  exhausted, wary, grateful expression. The dim, cramped passenger bunk of a
  freighter behind her.

### Passenger: Business Traveller

- **File:** `passenger_business.png`
- **Tint:** green
- **Pronouns:** he/him
- **Used by:** `passenger_complaint_comfort` (when the passenger is
  `business`)
- **Canon:** "Time is money." "I expect professional service."
- **Look:** Scandinavian heritage, late 30s. A neat side parting and a crisp
  but cheap suit that's seen too many economy berths. A tie loosened at the
  collar.
  **Signature detail:** checking a chunky wrist chrono, held up into frame.
- **Expression:** impatient and put-upon, glancing from the chrono to you.
- **Prompt:** An impatient Scandinavian businessman in his late 30s with a
  neat side parting, wearing a crisp but cheap suit with a loosened tie, holding
  up his wrist to check a chunky chronometer. An impatient, put-upon
  expression. The cramped passenger bunk of a freighter behind him.

### Passenger: Wealthy

- **File:** `passenger_wealthy.png`
- **Tint:** green
- **Pronouns:** she/her
- **Used by:** `passenger_wealthy_tip`, and `passenger_complaint_comfort`
  (when the passenger is `wealthy`)
- **Canon:** "I trust the accommodations are adequate?" "Money is no object."
  `passenger_wealthy_tip`: "Your wealthy passenger is impressed with your
  service. They offer a generous tip."
- **Look:** French heritage, early 70s. Silver hair in an elaborate updo,
  pearls, and a high-collared silk wrap. Rich like Marcus Cole, but warm and
  slightly amused rather than cold. Visibly out of place in a freighter.
  **Signature detail:** a jewelled lorgnette held up to one eye.
- **Expression:** gracious, faintly amused condescension.
- **Prompt:** An elegant French woman in her early 70s with silver hair in an
  elaborate updo, wearing pearls and a high-collared silk wrap, peering
  through a jewelled lorgnette held up to one eye. A gracious, faintly amused,
  slightly condescending smile. Visibly out of place in the cramped, scuffed
  passenger bunk of a freighter.

### Passenger: Scientist

- **File:** `passenger_scientist.png`
- **Tint:** green
- **Pronouns:** he/him
- **Used by:** `passenger_complaint_comfort` (when the passenger is
  `scientist`)
- **Canon:** "Fascinating ship you have." "I'm studying stellar phenomena."
- **Look:** Filipino heritage, mid-60s. Wild white hair, round spectacles and a
  rumpled cardigan with pens in the pocket.
  **Signature detail:** a datapad glowing with a star chart, held up toward
  the camera.
- **Expression:** delighted, eager curiosity, as if about to ask you
  something about your drive.
- **Prompt:** A delighted Filipino scientist in his mid-60s with wild white
  hair and round spectacles, wearing a rumpled cardigan with pens in the
  pocket, holding up a datapad glowing with a star chart. An eager, curious,
  delighted expression. The cramped passenger bunk of a freighter behind him.

### Passenger: Family

- **File:** `passenger_family.png`
- **Tint:** green
- **Pronouns:** they/them (the parent)
- **Used by:** `passenger_family_children`, and `passenger_complaint_comfort`
  (when the passenger is `family`)
- **Canon:** "Are we there yet?" "The children are excited."
  `passenger_family_children`: "The children are getting restless. The parents
  look apologetic."
- **Look:** **Exception to the one-subject rule.** A tired parent of Māori
  heritage in their mid-30s, head and shoulders, in a comfortable travel
  hoodie. A child of about six peeks over one shoulder. Keep the child's face
  simple: big eyes, a cheeky grin. The parent stays the clear main subject.
  **Signature detail:** the child's head peeking over the parent's shoulder.
- **Expression:** the parent smiles apologetically; the child is mischievous.
- **Prompt:** A tired Māori parent in their mid-30s in a comfortable travel
  hoodie, smiling apologetically at the camera, while a cheeky six-year-old
  child with big eyes peeks over their shoulder. The parent is the main
  subject. The cramped passenger bunk of a freighter behind them, with a toy
  floating loose in zero-g.

---

## Scenes

### Arrival at Sol Station

- **File:** `scene_dock_sol_first.png`
- **Tint:** green
- **Event:** `dock_sol_first`
- **Canon:** "Sol Station. The heart of human civilization. Massive.
  Gleaming. Expensive. You feel very small, and very poor."
- **Composition:** a wide external view on approach. Sol Station fills most
  of the frame: towering, layered and lit by thousands of windows, with
  traffic lanes of other ships streaming past. This is the one scene where
  things *are* shiny and new, which is the point.
  **Signature detail:** the player's battered little freighter, a small dark
  silhouette in the lower corner, dwarfed by the station.
- **Prompt:** Wide external view of a vast, gleaming space station filling
  most of the frame, towering and layered, lit by thousands of windows, with
  streams of ship traffic flowing past. In the lower corner, a small,
  battered, boxy freighter approaches in silhouette, dwarfed by the station.
  Awe-struck, intimidating mood.

### Salvage: Debris Field

- **File:** `scene_jump_salvage.png`
- **Tint:** green
- **Event:** `jump_salvage`
- **Canon:** "Your sensors ping. Debris field ahead. Looks like a cargo
  container. Intact, maybe."
- **Composition:** the view through the cockpit canopy, its frame edging the
  image. A slowly tumbling field of hull fragments against black space.
  **Signature detail:** one intact cargo container, caught in the ship's
  floodlight.
- **Prompt:** View through a freighter's cockpit canopy, the canopy frame at
  the edges, looking out at a field of tumbling hull fragments in black space.
  At the centre, a single intact cargo container is caught in the ship's
  floodlight beam.

### Salvage: The Container Opened

- **File:** `scene_jump_salvage_result.png`
- **Tint:** green
- **Event:** `jump_salvage_result`
- **Canon:** "You crack the seal. Inside: a crate of spare parts. Salvage
  rights. Finders keepers."
- **Composition:** looking into the open container from the hatch. Frost on
  the door seal, and stacked crates of machine parts lit by a helmet lamp.
  **Signature detail:** a small status lamp on the hatch glowing green, the
  seal broken. No readable label.
- **Prompt:** Looking into an open cargo container in space from its hatch,
  frost along the broken door seal, stacked crates of spare machine parts
  inside lit by the beam of a helmet lamp. A small green status lamp glows on
  the hatch frame.

### A Quiet Moment

- **File:** `scene_jump_quiet_moment.png`
- **Tint:** green
- **Event:** `jump_quiet_moment`
- **Canon:** "The wormhole transit is smooth. Unusually smooth. For a moment,
  the stars outside look almost peaceful."
- **Composition:** from behind and to one side of an empty, worn pilot's seat,
  facing the canopy. Beyond it, the soft swirl of a wormhole mouth fading into
  a calm starfield.
  **Signature detail:** a steaming mug on the console beside the seat.
- **Prompt:** Inside a worn freighter cockpit, seen from behind an empty,
  patched pilot's seat facing the canopy. Beyond the canopy, the soft swirl of
  a wormhole exit opens onto a calm, peaceful starfield. A steaming mug sits
  on the console. Quiet, contemplative mood.

### A Strange Signal

- **File:** `scene_jump_strange_signal.png`
- **Tint:** green
- **Event:** `jump_strange_signal`
- **Canon:** "Your comms array picks up a signal. Old. Looping. It sounds like
  a distress beacon, but the encryption is centuries out of date. Whatever sent
  it is long gone."
- **Composition:** a close-up of the comms console. The screen shows a
  looping waveform drawn in a different, antique display style from the
  console around it.
  **Signature detail:** the antique waveform, a ghost from another era.
- **Prompt:** Close-up of a freighter's comms console in a dark cockpit. Its
  screen shows a repeating waveform drawn in an old-fashioned, antique display
  style, unlike the rest of the console. Eerie, lonely mood.

### Low Fuel

- **File:** `scene_cond_low_fuel.png`
- **Tint:** amber
- **Event:** `cond_low_fuel`
- **Canon:** "The fuel warning light blinks insistently. You tap it. It keeps
  blinking. You're running on fumes."
- **Composition:** a close-up of an analogue fuel gauge on a scuffed console,
  its needle resting on empty.
  **Signature detail:** a warning lamp beside it, painted with heavy bloom.
- **Prompt:** Close-up of a scuffed analogue fuel gauge on a freighter
  console, its needle resting on empty, with a warning lamp beside it glowing
  with heavy amber bloom. Tense mood.

### Hull Damage

- **File:** `scene_cond_hull_damage.png`
- **Tint:** amber
- **Event:** `cond_hull_damage`
- **Canon:** "A deep groan reverberates through the hull. The patch job from
  last time is holding, but barely. One more hard knock and you'll be
  breathing vacuum."
- **Composition:** an interior bulkhead with a crudely welded patch plate,
  slightly buckled, frost creeping from the seam.
  **Signature detail:** a thin line of vapour escaping from the seam.
- **Prompt:** Interior bulkhead of a freighter with a crudely welded patch
  plate, slightly buckled, frost creeping from its seam and a thin wisp of
  vapour escaping. Dim amber emergency lighting. Tense, fragile mood.

### Debt Free

- **File:** `scene_cond_debt_free.png`
- **Tint:** green, the warmest image in the set
- **Event:** `cond_debt_free`
- **Canon:** "You stare at the balance sheet. Read it again. Zero. You owe
  nothing. The weight lifts. For the first time since you bought this ship,
  you can breathe."
- **Composition:** a cockpit console screen showing a ledger. Warm,
  daylight-coloured light falls across the console from out of frame, the only
  warm light among the scenes.
  **Signature detail:** a single glowing "0" on the screen. This is the one
  piece of text allowed in this brief.
- **Prompt:** A freighter cockpit console screen showing a simple ledger with
  a single large glowing zero. Warm, golden, daylight-coloured light falls
  across the console from out of frame. Relieved, hopeful mood.

---

## Inconsistencies Found

These came up while writing this brief. They are not fixed here.

1. **The rumour dockworker changes gender.** All three rumour events open with
   "A dockworker sidles up while you wait for clearance", but
   `dock_beyond_the_lanes_rumor` says "She shrugs" and
   `dock_barnards_engineer_rumor` says "He lowers his voice". This brief uses
   two portraits to match the text, but the identical opening line still
   reads as one recurring person.
2. **`dock_barnards_first` has no speaker.** The event introduces Wei Chen
   ("Her jumpsuit says 'CHEN'") but sets `speaker: null`. It now shows her
   portrait through `art`, but the panel still doesn't show her name.

## Wiring

Each event names its image in `content.art` as a `'category/key'` path
(for example `'narrative/news_anchor'`), and `NarrativeEventPanel` shows it.
Events with an NPC speaker don't need one. `passenger_complaint_comfort`
sets `art` in `generateContent()` from the passenger on board.
`tests/unit/portrait-assets.test.js` fails if an event has no art or names a
file that doesn't exist.
