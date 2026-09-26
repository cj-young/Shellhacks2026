import type { GameConnection } from '#/lib/use-game-connection'
import { useState } from 'react'
import { Store } from './Store'

interface ClientInterfaceProps {
  connection: GameConnection
}

type ClientInterfaceState = "store" | "recipe"

export function ClientInterface({ connection }: ClientInterfaceProps) {
  const { recipeOrder } = connection.state
  const [interfaceState, setInterfaceState] = useState<ClientInterfaceState>("store")

  return (
    <div>
        <h2>Client interface</h2>
        <p>
            {recipeOrder.length === 0
            ? 'Waiting for game state…'
            : `${recipeOrder.length} recipes received`}
        </p>
        {
            interfaceState == "store" ? (
                <Store></Store>
            )
            : (
                <p>In recipe</p>
            )
        }
    </div>
  )
}
