import type { GameConnection } from '#/lib/use-game-connection'
import { useState } from 'react'
import { Store } from './Store'
import type { Ingredient } from '#/lib/types'
import { MasterRecipe } from '../MasterRecipe'
import { CursorPathTracker  } from '../CursorPathTracker'
import type {CursorPoint} from '../CursorPathTracker';

interface ClientInterfaceProps {
  connection: GameConnection
}

type ClientInterfaceState = "store" | "recipe"

export function ClientInterface({ connection }: ClientInterfaceProps) {
  const { recipeOrder } = connection.state
  const [interfaceState, setInterfaceState] = useState<ClientInterfaceState>("store")
  const [inventory, setInventory] = useState<Ingredient[]>([])
  const [recipeState, setRecipeState] = useState<number>(0)

  const [currentPoints, setCurrentPoints] = useState<CursorPoint[]>([])

  function checkoutFromStore(inv: Ingredient[]) {
    setInventory(inv)
    setInterfaceState("recipe")
  }

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
                <Store uploadInventory={checkoutFromStore}></Store>
            )
            : (
                <>
                <p>Inventory</p>
                <div className="flex flex-row gap-1">
                    {inventory.map((v) => (
                        <img className="w-12 h-12" src={v.image}/>
                    ))}
                </div>
                <p>In recipe</p>
                <div>
                    <CursorPathTracker onPointsChange={setCurrentPoints} />
                    <MasterRecipe recipe={recipeOrder[recipeState]} points={currentPoints} 
                    onCompleteChange={(complete)=>{if(complete) {
                        console.log(recipeState)
                        if(recipeState+1 < recipeOrder.length)
                            setRecipeState(recipeState+1)
                    }}} />
                </div>
                </>
            )
        }
    </div>
  )
}
