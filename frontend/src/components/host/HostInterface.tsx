import type { GameConnection } from '#/lib/use-game-connection'
import { useEffect, useState } from 'react'
import recipes from '../../data/recipes.json'

interface HostInterfaceProps {
  connection: GameConnection
}

export function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function HostInterface({ connection }: HostInterfaceProps) {
  function generateRecipeOrder(length: number) {
    const res: number[] = []
    let i = 0

    while (i < length) {
      const select = getRandomIntInclusive(0, recipes.length - 1)
      if (!res.includes(select)) {
        res.push(select)
        i++
      }
    }

    return res
  }

  const [recipeOrder, setRecipeOrder] = useState<number[]>([])

  useEffect(() => {
    setRecipeOrder(generateRecipeOrder(3))
  }, [])

  useEffect(() => {
    if (recipeOrder.length != 0)
      connection.socketRef.current?.emit('send_recipe_order', recipeOrder)
  }, [recipeOrder])

  return (
    <div>
      Host Interface
      <button
        type="button"
        onClick={() => connection.socketRef.current?.emit('test')}
      >
        Emit some bullshit
      </button>
    </div>
  )
}
