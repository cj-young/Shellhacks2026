import type { Ingredient } from "#/lib/types"
import { useState } from "react"
import ingredients from "../../data/ingredients.json" 

export function Store({uploadInventory}:{uploadInventory: (inv: Ingredient[]) => void}) {
    const [inventory, setInventory] = useState<Ingredient[]>([])

    function checkout() {
        uploadInventory(inventory)
        setInventory([])
    }

    return (
        <>
        <div>
            {ingredients.map((ing) => (
                <button type="button" onClick={()=>setInventory([...inventory, ing])}>
                    <img className="w-12 h-12" src={ing.image}/>
                    <p>{ing.name} ({ing.category})</p>
                </button>
            ))}
        </div>
        <button type="button" className="border" onClick={()=>checkout()}>Checkout</button>
        <div className="flex flex-row gap-1">
            {inventory.map((v) => (
                <img className="w-12 h-12" src={v.image}/>
            ))}
        </div>
        </>
    )
}
