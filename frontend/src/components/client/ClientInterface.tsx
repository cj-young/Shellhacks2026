import type { GameConnection } from '#/lib/use-game-connection'

interface ClientInterfaceProps {
  connection: GameConnection
}

export function ClientInterface({ connection }: ClientInterfaceProps) {
  const { recipeOrder } = connection.state

  return (
    <div>
      <h2>Client interface</h2>
      <p>
        {recipeOrder.length === 0
          ? 'Waiting for game state…'
          : `${recipeOrder.length} recipes received`}
      </p>
    </div>
  )
}
