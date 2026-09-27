# Sabotage frontend

Players earn one saved choice credit for each server-confirmed completed recipe
(`players[].recipeIndex`). They can spend it on Steal, Trash, Freeze, or Blackout
from any phone screen, including after finishing their last recipe, until the round
ends. Freeze temporarily prevents actions, including sabotage use.

- `data/sabotages.json` mirrors `backend/src/data/sabotages.json`.
- `lib/sabotages.ts` mirrors the AsyncAPI payloads and handles targeting and timing.
- `lib/use-sabotages.ts` emits `use_sabotage` and listens for `sabotage_applied`.
  Only a confirmed application spends a credit. Duplicate application IDs are ignored.
  Confirmed uses are saved by room/player in sessionStorage so a reload does not
  replenish credits. Timed effects use `expiresAt - serverNow`, expire locally, and
  overlap until the latest expiry. Inventories are never changed optimistically.
- `SabotageUI.tsx` and `sabotage.css` contain replaceable emoji badges, ingredient
  notifications, host announcements, a freeze overlay, and the choice/target dialog.
- Blackout masks shelf items, dragged items, and the shopping cart; host ingredients
  remain visible. Freeze pauses the gesture engine and disables phone interaction.

The backend sabotage handlers are intentionally not implemented here. The existing
AsyncAPI describes definition-specific unused instances, but the requested frontend
rule is one **choice credit** per completed recipe. Backend integration must honor
that choice and validate credits. Outgoing event names and payload shapes are unchanged.
Steal/trash inventory changes must arrive through `update_state`.

The contract has no active-effect snapshot or credit ledger on rejoin. Credits are
preserved in this tab, but missed broadcasts during disconnect/reload cannot be
reconstructed; authoritative reconnect support needs a future backend snapshot.

## Preview without backend support

Open `/chop-chop-dev#sabotage-preview`. Complete mock recipes to earn credits, open
the sabotage menu, and choose a target. Buttons can also inject each incoming effect,
replay a duplicate, reject a request, or switch to host announcements. This fixture
uses the real frontend event listener with a local, disconnected Socket.IO object;
production never fabricates confirmations. The fixture does not simulate inventory
mutations. The normal app will time out an unimplemented command without spending
its credit.

Run `docker compose exec frontend npm test` for credit, targeting, and timer tests.
