# NPC Portraits

Art brief for generating a headshot for every character the player can interact
with. Each portrait is shown next to the character's name in the game.

- **Named NPCs** come from `src/game/data/npc-data.js` (`ALL_NPCS`).
- **Encounter archetypes** are the unnamed characters in danger encounters
  (`src/features/danger/`).

---

## Style Guide

### Concept: the comms screen

Every portrait is what the player sees on their ship's comms display when the
character is talking to them. That is why the faces look the way they do: a
slightly degraded video feed on an old CRT. It matches the game's UI, which is
black panels, phosphor-green text and amber warnings in a monospace terminal
font.

### Framing

- Head only, facing the camera or angled slightly. The subject is
  talking *to you*.
- A plain, dark background that fades to black at the edges. A hint of the
  character's surroundings is fine (a bulkhead, a dock light, a console glow)
  but paint it as a few flat, simple shapes in low contrast. Don't blur it like
  a camera would.
- One subject only.

### Rendering style: painted game art, not a photo

The portraits are **illustrations from a game**, not frames of video. Aim for
the hand-painted character portraits of 1990s CD-ROM adventure and strategy
games. That's more refined than 1980s pixel art, but clearly drawn and
painted, never photographed.

- **Painted, not photographed:** visible brush strokes, simplified planes of
  light and shadow, and a slightly graphic-novel feel with confident dark
  outlines on the main shapes.
- **Stylised faces:** keep the features expressive and slightly simplified.
  No skin pores, no fine wrinkle texture, no individual hairs. Treat hair as a
  few painted clumps.
- **No camera effects:** no depth-of-field blur, no bokeh, no lens flare, no
  film grain and no cinematic colour grading. The CRT effects (scanlines,
  bloom, curvature) are the only "screen" effects.
- **Limited palette:** about 12–16 colours per image, with some posterised
  banding in gradients.

If a result still comes out photographic, increase the weight on
`painted illustration` / `digital painting` in the generator, or add
`posterized` to the prompt.

### Treatment

- **Full-colour faces in a limited palette.** Skin tones and clothing keep
  their real colours, but muted and slightly desaturated.
- **An affiliation tint** (see below) washes the shadows and the background
  glow. It shouldn't turn the whole image into a single colour.
- **Faint horizontal scanlines** across the whole image.
- **A slight phosphor bloom** on highlights, with gentle chromatic fringing at
  high-contrast edges.
- **A soft vignette** with a hint of screen curvature at the corners.
- Lighting is low-key and practical: console glow, dock floodlights, a desk
  lamp. No glossy studio lighting.
- Grounded, lived-in, blue-collar science fiction. Clothes are worn, gear is
  scuffed and people look tired. Nothing is shiny or new except Marcus Cole.

### Readability

Portraits will often be shown at **64–128 px**. To stay recognisable at that
size:

- Strong silhouette (hair shape, collar, hat or hood).
- **One signature detail per character**, listed in each entry. It should still
  read at thumbnail size.
- A clear expression. Avoid fine detail that turns to mush when scaled down.

### Affiliation tints

These come from the game's CSS variables, so the portraits match the UI.

| Group | Tint | Hex | Why |
|---|---|---|---|
| Station NPCs (default) | Phosphor green | `#00ff88` | The game's primary UI colour |
| Marcus Cole | Amber | `#ffaa00` | Money, warning, the creditor |
| Customs | Cyan | `#00ffff` | Authority, cold officialdom |
| Pirates | Danger red | `#ff6b6b` | Threat |
| Distress callers | Amber | `#ffaa00` | Emergency, warning |

### Output

- **Aspect ratio:** 1:1 square.
- **Resolution:** generate at 1024 px or larger. The game will scale it down.
- **No text, logos, UI frames, borders or watermarks** in the image. The game
  adds its own frame.
- **File name:** the NPC's `id` from `npc-data.js` plus `.png` (for example
  `chen_barnards.png`). Archetypes use the names given in their entries.

### Base prompt

MANDATORY: use this before every character's **Prompt** line, replacing `{TINT}` with
the tint colour named in that entry:

> RETRO SCI-FI VIDEO-GAME CHARACTER PORTRAIT, HEAD ONLY, hand-painted digital
> illustration in the style of 1990s adventure-game character portraits,
> visible brush strokes, simplified stylised features, confident dark outlines,
> posterised limited palette of about 16 colours. The subject is looking at the
> viewer as if on a video call, shown on an old CRT comms screen. Muted colours
> with a subtle {TINT} phosphor tint in the shadows and background glow. Faint
> horizontal scanlines, slight phosphor bloom, soft vignette with slight screen
> curvature. Simple dark painted background fading to black at the edges.
> Gritty, lived-in, blue-collar space-trucker aesthetic. Square format, a
> single subject, strong readable silhouette.

### Negative prompt

> photorealistic, photograph, photo, realistic skin texture, skin pores,
> detailed wrinkles, film still, cinematic, movie still, depth of field, bokeh,
> lens blur, film grain, hyperrealistic, 3D render, octane, unreal engine, text,
> letters, words, logo, watermark, signature, UI, border, frame, multiple
> people, anime, chibi, Pixar style, glossy, clean studio lighting, bright
> background, full body, hands covering face, extra fingers, distorted face

### How to read each entry

- **Canon** is what the game's text actually establishes, with sources. Don't
  contradict it.
- **Look** is invented for this brief. The game says almost nothing about
  physical appearance, so everything here can be changed freely.
- **Expression** is the default mood. Portraits are static, so choose a mood
  that fits the character across their whole relationship arc.

---

## Named NPCs

### Wei Chen: Dock Worker, Bore Station 7 (Barnard's Star)

- **File:** `chen_barnards.png`
- **Tint:** green
- **Pronouns:** she/her
- **Canon:** "A weathered dock worker with calloused hands and knowing eyes.
  Former ship captain." She lost her ship in a bad deal ("Lost everything") and
  has worked the docks for years. She is wary of trust but deeply loyal once it
  is earned. She speaks plainly and drops articles ("Ship needs fuel").
- **Look:** Chinese heritage, late 40s. A lean, wiry build. Her face is
  weathered by work, not age, with fine lines at the eyes. Black hair with
  early grey, cut short and practical and tucked under a knit cap. She wears
  heavy, scuffed dock coveralls with a hi-vis shoulder strip.
  **Signature detail:** a tarnished captain's-wings pin on her collar that she
  never took off.
- **Expression:** guarded and appraising. Her mouth is flat, but her eyes are
  sizing you up and not unkind.
- **Prompt:** A weathered Chinese woman in her late 40s, a dock worker and
  former starship captain, with a lean wiry build, short black hair with early
  grey under a knit cap, and fine lines at her eyes. She wears scuffed heavy
  work coveralls with a hi-vis shoulder strip and a tarnished captain's-wings
  pin on her collar. Guarded, appraising expression with knowing eyes. Dim
  industrial dock lighting behind her.

### Marcus Cole: Loan Shark, Sol Central (Sol)

- **File:** `cole_sol.png`
- **Tint:** amber
- **Pronouns:** he/him
- **Canon:** "Impeccably dressed financier with cold eyes and a calculating
  smile. Your creditor." He is the player's starting creditor and the main
  antagonist. He speaks in short, clipped sentences ("Payment. Due. Now.") and
  sees debt as "a tool".
- **Look:** mid-50s, groomed to perfection. Silver at the temples, swept back.
  Clean-shaven with a sharp jaw. He wears a dark, high-collared tailored suit,
  the only immaculate clothing in the whole cast. His office is a dim,
  expensive room lit only from below by a desk display. Somewhat menacing.
  **Signature detail:** a thin smile that never reaches his eyes. A single
  gold signet ring may be visible at the edge of the frame.
- **Expression:** a calculating half-smile. Polite and utterly cold.
- **Prompt:** An impeccably groomed man in his mid-50s, a wealthy financier and
  loan shark, with silver at the temples, hair swept back, clean-shaven and a
  sharp jaw. He wears a dark high-collared tailored suit, immaculate and
  expensive. Cold eyes and a thin calculating smile that doesn't reach them.
  He is lit from below by the glow of a desk display in a dim luxurious
  office.

### Father Okonkwo: Chaplain, Ross 154 Medical (Ross 154)

- **File:** `okonkwo_ross154.png`
- **Tint:** green
- **Pronouns:** he/him
- **Canon:** "Gentle chaplain with kind eyes and a warm smile. Offers comfort
  to weary travelers." He works at a medical station, speaks in religious
  metaphors, and calls people "child". He is the game's moral anchor and is
  welcoming from the start.
- **Look:** Nigerian (Igbo) heritage, early 60s. A broad, gentle face with
  laugh lines. Close-cropped white hair and a short white beard. He wears a
  clerical collar under a practical medical-station cardigan or scrub jacket,
  half priest and half orderly. Soft, warm light behind him, like a candle or
  a chapel lamp.
  **Signature detail:** a white clerical collar, with a stethoscope or medical
  lanyard hanging beside it.
- **Expression:** a warm, unhurried smile. He looks like he has all the time
  in the world for you.
- **Prompt:** A gentle Nigerian man in his early 60s, a chaplain at a space
  station medical bay, with a broad kind face, laugh lines, close-cropped white
  hair and a short white beard. He wears a white clerical collar under a worn
  medical-station cardigan, with a stethoscope around his neck. Warm, kind
  eyes and a gentle welcoming smile, softly lit by a warm lamp.

### Whisper: Information Broker, Sirius Exchange (Sirius)

- **File:** `whisper_sirius.png`
- **Tint:** green
- **Pronouns:** she/her
- **Canon:** "Mysterious info broker. Knows everyone's secrets. Including
  yours." She speaks in cryptic, measured tones, is profit-driven and has
  flexible ethics.
- **Look:** age and heritage deliberately hard to read; she could be 30 or 50.
  Half her face is in shadow from a deep hood or high collar. The visible half
  is sharp, composed and pale in the screen glow. Dark lipstick.
  **Signature detail:** a single augmented eye or monocle data-lens glowing
  faintly green, the only bright point in the image.
- **Expression:** a faint knowing smile. She already knows what you're going
  to ask.
- **Prompt:** A mysterious woman of indeterminate age, an information broker,
  with half her face hidden in the shadow of a deep hood and high collar. The
  visible half of her face is sharp, composed and pale in the screen glow,
  with dark lipstick. One eye has a faintly glowing green data-lens monocle.
  A faint knowing smile. Very dark, with heavy shadow and a single cold light
  source.

### Captain Vasquez: Retired Trader, Eridani Hub (Epsilon Eridani)

- **File:** `vasquez_epsilon.png`
- **Tint:** green
- **Pronouns:** they/them (see *Inconsistencies found* below)
- **Canon:** "Retired freighter captain. Mentor figure. Knows the old routes."
  They ran freight for thirty years and retired because "reflexes slow down".
  They miss "the freedom of the void", tell trading stories and have seen the
  old charts to Pavonis. They served with Yumi Tanaka years ago and are the
  player's "first friend".
- **Look:** Latin American heritage, mid-to-late 60s, androgynous
  presentation. A deeply sun- and starlight-weathered face with crow's feet
  from squinting at nav screens. Short, swept-back silver hair. They wear a
  battered, faded leather flight jacket with old freight-line patches, some
  half torn off.
  **Signature detail:** an old flight jacket covered in faded route patches.
- **Expression:** a warm, crinkle-eyed grin, as if about to start a story.
- **Prompt:** An androgynous Latin American person in their mid-to-late 60s, a
  retired freighter captain, with a deeply weathered face, crow's feet and
  short swept-back silver hair. They wear a battered faded leather flight
  jacket covered in old freight-line patches. A warm crinkle-eyed grin, a
  mentor about to tell a story. Cosy dim lighting, like a hub cantina.

### Dr. Sarah Kim: Station Administrator, Tau Ceti Station (Tau Ceti)

- **File:** `kim_tau_ceti.png`
- **Tint:** green
- **Pronouns:** she/her
- **Canon:** "Efficient station administrator. By-the-book. Respects
  professionalism." She uses technical vocabulary, cites regulations and runs
  strict customs.
- **Look:** Korean heritage, early 40s. Black hair in a neat, tight bun with
  not a strand out of place. Thin rectangular glasses. She wears a crisp
  administrator's uniform jacket with a high collar and a small station ID
  badge, in a tidy, bright office. Of the whole cast, her lighting is the
  closest to clean.
  **Signature detail:** thin rectangular glasses and a slim datapad held at
  chest height.
- **Expression:** neutral and evaluating, with one eyebrow very slightly
  raised. She is waiting to see whether you are competent.
- **Prompt:** A Korean woman in her early 40s, a strict space station
  administrator, with black hair in a neat tight bun and thin rectangular
  glasses. She wears a crisp high-collared administrator's uniform jacket with
  a small ID badge and holds a slim datapad at chest height. A neutral,
  evaluating expression with one eyebrow slightly raised. Cool, orderly office
  lighting.

### "Rusty" Rodriguez: Mechanic, Procyon Depot (Procyon)

- **File:** `rodriguez_procyon.png`
- **Tint:** green
- **Pronouns:** he/him
- **Canon:** "Gruff but skilled mechanic. Loves ships more than people." He has
  worked on ships for twenty years, wipes his hands on his coveralls, talks
  about ships as if they were people, and calls himself "old Rusty".
- **Look:** Mexican heritage, mid-50s. Big shoulders and a broad face. A bushy
  moustache and rust-red hair gone mostly grey, which may be where the
  nickname came from. Grease smudges on his cheek and forehead. He wears
  stained work coveralls with the sleeves rolled up, in a workshop lit by a
  hanging work lamp.
  **Signature detail:** welding goggles pushed up on his forehead and a rag
  over one shoulder.
- **Expression:** gruff and squinting, with the corner of a reluctant smile
  under the moustache.
- **Prompt:** A burly Mexican man in his mid-50s, a starship mechanic, with
  broad shoulders, a bushy moustache and rust-red hair gone mostly grey, and
  grease smudges on his face. He wears stained work coveralls with the sleeves
  rolled up, a grease rag over one shoulder and welding goggles pushed up on
  his forehead. A gruff squint with the hint of a reluctant smile, lit by a
  hanging work lamp in a cluttered repair bay.

### Zara Osman: Trader, Luyten's Outpost (Luyten's Star)

- **File:** `osman_luyten.png`
- **Tint:** green
- **Pronouns:** she/her
- **Canon:** "Sharp trader with connections across the sector. Competitive but
  fair." She talks in slang and trading jargon, leans back in her chair, keeps
  a ledger, and has "been where you are".
- **Look:** Somali heritage, early-to-mid 30s. Sharp cheekbones and confident
  posture. Close-cropped natural hair, or a patterned headwrap. She wears a
  fitted trader's jacket covered in commodity-exchange and outpost patches,
  with a comm earpiece in one ear and several small gold hoops in the other.
  **Signature detail:** an earpiece in one ear, as if she's in the middle of
  another deal.
- **Expression:** a confident, sly half-smile. She's already worked out your
  margin.
- **Prompt:** A confident Somali woman in her early 30s, a sharp independent
  space trader, with high cheekbones and close-cropped natural hair. She wears
  a fitted trader's jacket covered in commodity-exchange patches, has a comm
  earpiece in one ear and small gold hoops in the other. A sly, confident
  half-smile, as if she's in the middle of a deal. Busy outpost market
  lighting behind her, painted as simple shapes.

### Station Master Kowalski: Station Master, Centauri Station (Alpha Centauri)

- **File:** `kowalski_alpha_centauri.png`
- **Tint:** green
- **Pronouns:** he/him
- **Canon:** "Veteran station master. Seen everything. Respects competence."
  He has run stations for twenty years, is gruff and direct, narrows his eyes,
  and judges people only on competence: "young or old, human or otherwise".
- **Look:** Polish heritage, early 60s. A heavy brow, a broad flattened nose
  (perhaps broken once) and grey buzz-cut hair. Built like a bulkhead. He
  wears a station master's uniform with rank tabs, the collar open, and a
  headset around his neck. The station control room glows behind him.
  **Signature detail:** a comms headset around his neck and a permanently
  narrowed squint.
- **Expression:** narrowed eyes and an unimpressed set mouth. You haven't
  proved yourself yet.
- **Prompt:** A stocky Polish man in his early 60s, a veteran space station
  master, with a heavy brow, a broad once-broken nose and a grey buzz cut. He
  wears a worn station master's uniform with rank tabs and an open collar, and
  a comms headset around his neck. Narrowed, skeptical eyes and an unimpressed
  set mouth. The glow of a busy station control room behind him.

### "Lucky" Liu: Gambler, Wolf 359 Station (Wolf 359)

- **File:** `liu_wolf359.png`
- **Tint:** green
- **Pronouns:** he/him
- **Canon:** "Professional gambler and risk-taker. Loves long odds. Respects
  bold moves." He talks in slang and gambling metaphors ("scared money don't
  make money"), calls people "sport" and "baby", leans back in his chair and
  grins.
- **Look:** Chinese heritage, late 30s. Slicked-back hair with one loose
  strand. A loud, patterned silk shirt under an unbuttoned flashy jacket, with
  a thin gold chain. Smoky gambling-den lighting with coloured lamp glows behind
  him.
  **Signature detail:** a lucky coin held up between two fingers.
- **Expression:** a big, easy, dangerous grin, like someone about to go all
  in.
- **Prompt:** A charismatic Chinese man in his late 30s, a professional
  gambler, with slicked-back hair and one loose strand. He wears a loud
  patterned silk shirt under an unbuttoned flashy jacket and a thin gold
  chain, and holds a lucky coin up between two fingers. A big, easy, reckless
  grin, in a smoky gambling den with simple coloured lamp glows behind him.

### Yuki Tanaka: Engineer, Bore Station 7 (Barnard's Star)

- **File:** `tanaka_barnards.png`
- **Tint:** green
- **Pronouns:** she/her
- **Canon:** "Brilliant engineer working on experimental drive technology. Has
  her own reasons for wanting to reach Delta Pavonis." Her father created the
  original Tanaka Drive. She speaks precisely and never wastes words, is
  guarded, and shows emotion almost never ("Her eyes light up — the only sign
  of emotion you've seen from her"). Her older sister Yumi left on the
  Meridian ten years ago.
- **Look:** Japanese heritage, early 30s. **She must share facial features
  with Yumi:** the same eye shape, brow and jawline. Her black hair is cut in a
  short, blunt, practical bob, and she wears thin wire-frame safety glasses.
  Her engineer's jacket is singed at the cuffs, with a tool harness strap
  across her shoulder. The cold blue-green glow of a drive test bench lights
  her face.
  **Signature detail:** safety glasses and a faint burn scar or solder marks
  on her jacket.
- **Expression:** composed and intense, almost blank. The only hint of
  feeling is in her eyes.
- **Prompt:** A focused Japanese woman in her early 30s, a brilliant starship
  drive engineer, with a short blunt black bob and thin wire-frame safety
  glasses. She wears a utilitarian engineer's jacket singed at the cuffs, with
  a tool harness strap across one shoulder. A composed, intense, guarded
  expression that is almost blank, with emotion only in her eyes. Lit by the
  cold glow of an experimental engine test bench.

### Yumi Tanaka: Colony Director, Delta Pavonis Colony (post-credits)

- **File:** `yumi_delta_pavonis.png`
- **Tint:** green
- **Pronouns:** she/her
- **Canon:** "Colony Director at Delta Pavonis. Tanaka's sister. Seems to know
  more than she should." She is three years older than Yuki, a biologist, and
  joined the Meridian colony mission ten years ago. She appears only after the
  credits and breaks the fourth wall ("The credits already rolled").
- **Look:** Japanese heritage, mid 30s. **She is clearly Yuki's sister:** the
  same eye shape, brow and jawline, but relaxed where Yuki is tense. Her face
  is tanned by a real sun after ten years on a colony world. Longer hair,
  loosely tied back with strands escaping. Practical colony field clothes,
  with a collar of a plant or a leaf in her hair. Warm, natural daylight
  behind her, the only outdoor light in the whole cast.
  **Signature detail:** looking **straight down the lens** with a knowing
  smirk, as if she knows she's in a video game.
- **Expression:** amused and conspiratorial, as if she's in on the joke.
- **Prompt:** A relaxed Japanese woman in her mid 30s, a colony director and
  biologist on an alien frontier world. She has a sun-tanned face, longer
  black hair loosely tied back with strands escaping, and a small leaf caught
  in her hair, and wears practical colony field clothes. She looks straight
  into the camera with an amused, knowing, conspiratorial smirk. Warm natural
  daylight behind her. Her facial features match her younger sister Yuki: the
  same eye shape, brow and jawline.

---

## Encounter Archetypes

These characters have no names. Each portrait is reused every time its
encounter variant appears.

### Pirates

The threat level comes from `determineThreatLevel()` in
`src/game/utils/calculators.js` (`weak`, `moderate`, `strong` or `dangerous`).
The portraits should **escalate visibly** so the player can read the danger
before reading the label. The gender and heritage of each tier are chosen to
vary the cast, and can be changed.

#### Weak pirate

- **File:** `pirate_weak.png`
- **Tint:** danger red
- **Look:** a desperate, underfed scavenger in their early 20s. A patched,
  mismatched vac suit with duct-taped seams and a cracked helmet visor pushed
  up. Hollow cheeks and grime.
  **Signature detail:** a crude hand-painted skull on the chest plate.
- **Expression:** shaky bravado. They're trying to look tough and are clearly
  scared.
- **Prompt:** A desperate, underfed young pirate in their early 20s, a
  scavenger, wearing a patched mismatched vac suit with duct-taped seams, a
  crude hand-painted skull on the chest plate and a cracked helmet visor
  pushed up. Hollow cheeks and grime. Shaky bravado, trying to look tough but
  clearly scared. The cramped cockpit of a junk ship.

#### Moderate pirate

- **File:** `pirate_moderate.png`
- **Tint:** danger red
- **Look:** a seasoned raider, a woman in her late 30s. Mismatched salvaged
  armour plates over a leather jacket and a shaved undercut. A cigarette
  hanging from her lip, and a gun-metal stubble of grey along her jaw scar.
  **Signature detail:** a cigarette and a jaw scar.
- **Expression:** a bored, businesslike smirk. She's done this a hundred
  times.
- **Prompt:** A seasoned female space pirate in her late 30s with a shaved
  undercut and a scar along her jaw, wearing mismatched salvaged armour plates
  over a worn leather jacket, with a cigarette hanging from her lip. A bored,
  businesslike smirk. A grimy pirate ship bridge with red warning lights.

#### Strong pirate

- **File:** `pirate_strong.png`
- **Tint:** danger red
- **Look:** a crew boss, a man in his 40s. A heavy, matching set of dark
  armour with crew insignia, so the gang is organised. One cybernetic eye
  glows red. A thick neck and a shaved head with tattoos crawling up from the
  collar.
  **Signature detail:** a glowing red cybernetic eye.
- **Expression:** cold and patient. He knows he has the bigger guns.
- **Prompt:** A menacing male pirate crew boss in his 40s with a shaved head,
  a thick neck, and tattoos crawling up from the collar of heavy matched dark
  armour with crew insignia. One glowing red cybernetic eye. A cold, patient,
  confident stare. The bridge of a well-armed raider ship in red light.

#### Dangerous pirate

- **File:** `pirate_dangerous.png`
- **Tint:** danger red
- **Look:** a legendary raid leader, age and gender hard to read: a gaunt,
  heavily scarred face, part of the jaw replaced with a dull metal prosthetic.
  A long, dark armoured coat hung with trophies (ship nameplates, captain's
  pins taken from victims). Very still.
  **Signature detail:** a collar hung with captured captain's pins, a dark
  echo of Wei Chen's.
- **Expression:** utter calm. No smile. This person doesn't negotiate.
- **Prompt:** A legendary, terrifying pirate warlord of indeterminate age and
  gender with a gaunt, heavily scarred face, part of the jaw replaced by a dull
  metal prosthetic, and a long dark armoured coat hung with trophies:
  captured captains' pins and scraps of ship nameplates. Utterly calm, cold,
  emotionless stare, no smile. Deep shadow and harsh red light.

### Customs Inspector

- **File:** `customs_inspector.png`
- **Tint:** cyan
- **Canon:** "Customs officials are conducting a standard cargo inspection.
  Cooperation is expected." (`InspectionPanel.jsx`). Belongs to the
  *authorities* faction.
- **Look:** an inspector of any gender, in their 40s. A crisp, slate-grey
  authority uniform with a cyan-trimmed collar and a faction badge, and an
  officer's cap or a helmet with the visor up. A handheld cargo scanner raised
  into frame.
  **Signature detail:** the handheld scanner's glow lighting their chin.
- **Expression:** impassive, bureaucratic and slightly bored. It's nothing
  personal.
- **Prompt:** A stern customs inspector in their 40s wearing a crisp
  slate-grey authority uniform with a cyan-trimmed collar, a faction badge and
  an officer's cap, holding a handheld cargo scanner whose glow lights their
  chin. An impassive, bureaucratic, slightly bored expression. Clinical
  patrol-ship interior lighting.

### Distress Caller

- **File:** `distress_civilian.png`
- **Tint:** amber
- **Canon:** "A civilian vessel is broadcasting a distress signal. Their
  engines have failed and they need assistance."
  (`src/game/state/managers/distress.js`). The panel's fallback text says:
  "Mayday, mayday! This is civilian transport vessel requesting immediate
  assistance."
- **Look:** a civilian transport pilot in their 30s, not a fighter. Sweat and
  a smear of soot on their face, an oxygen mask hanging loose around their
  neck and a cheap civilian flight suit. Flashing emergency lighting, with
  sparks or smoke in the background.
  **Signature detail:** the loose oxygen mask and the strobing emergency
  light.
- **Expression:** frightened and pleading, leaning toward the camera.
- **Prompt:** A frightened civilian transport pilot in their 30s, sweating,
  with a smear of soot on their face, wearing a cheap civilian flight suit
  with an oxygen mask hanging loose around their neck. Pleading, desperate
  expression, leaning toward the camera. A damaged cockpit with flashing
  emergency lighting and drifting smoke behind them.

---

## Inconsistencies Found

These came up while writing this brief. They are not fixed here because a UAT
run is in progress.

1. **Captain Vasquez's pronouns disagree.** Their dialogue mostly uses
   *they/them* (`tanaka-dialogue.js:46`, `:108`, `:479`;
   `captain-vasquez.js:491`), but `captain-vasquez.js:511` says *"He leans
   in"*, and the doc comment in `npc-data.js` uses *her/she*. This brief
   follows the majority (they/them).
2. **Distress calls always show "Unknown Emergency".** `distress.js` creates
   calls with `type: 'civilian_distress'`, but `formatCallType()` in
   `DistressCallPanel.jsx` only recognises `mechanical`, `medical`, `pirate`,
   `navigation` and `general`. So the "Type" field always falls through to
   `'Unknown Emergency'`. Those five types are never generated, which is why
   this brief has a single distress portrait.
