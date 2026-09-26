import ingredients from "../../data/ingredients.json" 

export function Store() {
    return (
        <div>
            {ingredients.map((ing) => (
                <div>
                    <img className="w-12 h-12" src={ing.image}/>
                    <p>{ing.category}</p>
                </div>
            ))}
        </div>
    )
}
