# Audio assets

Drop your sound files here. Each sound is registered by path in
`frontend/src/data/sounds.ts` — add a file here and one line there.

- **Music** (host only, looping): the `music.game` key.
- **Ambience** (phone, looping with fades): `ambient.<board|bowl|pan|pot|plate>`
  (falls back to `ambient.default`). Example: `ambient.pan` → a sizzle loop.
- **Effects**: gesture success (`gesture.success.<chop|stir|flip|pour|scoop|plate>`),
  `gesture.fail`, knife cuts (`knife.chop` / `knife.slice`, falling back to `knife`),
  store/UI (`ui.take`, `ui.remove`, `ui.aisle`, `ui.checkout`, `ui.trash`),
  recipes (`recipe.complete`, `recipe.new`), round (`round.go`, `round.timesup`,
  `round.leaderboard`), sabotage (`sabotage.steal`, `sabotage.freeze`, `sabotage.blackout`,
  `sabotage.applied`).

Notes:

- `.mp3` or `.ogg` are safest across browsers.
- Nothing here is required: a registered `src` whose file is missing is skipped silently,
  so it is fine to wire a key before the file exists.
- A stage-specific override wins over the gesture default: `stage:<recipe name>:<index>`.
  Example: `"stage:Spaghetti & Meatballs:2": { src: "/assets/audio/roll.mp3" }`.
