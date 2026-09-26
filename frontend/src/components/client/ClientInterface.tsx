import type { GameConnection } from '#/lib/use-game-connection'
import { PracticeGame } from '#/components/chop-chop/player/PracticeGame'

interface ClientInterfaceProps {
  connection: GameConnection
}

// The server's recipes don't list ingredients yet, so phones play the local practice recipes for now.
export function ClientInterface(_props: ClientInterfaceProps) {
  return <PracticeGame />
}
