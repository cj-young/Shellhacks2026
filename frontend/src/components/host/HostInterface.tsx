import type { GameConnection } from "#/lib/use-game-connection";
import { useEffect, useState } from "react";
import recipes from "../../data/recipes.json";
import ingredients from "../../data/ingredients.json";

interface HostInterfaceProps {
  connection: GameConnection;
}

export function HostInterface({ connection }: HostInterfaceProps) {
  return (
    <div className="flex flex-col">
      <h1>Host Interface</h1>
      <h2>Players</h2>
      <ul>
        {connection.state.players.map((v) => (
          !v.isHost && <li>{v.name}</li>
        ))}
      </ul>
      <h2>Recipe Order</h2>
      <div className="flex flex-row gap-2">
      {connection.state.recipeOrder.map((v,i) => (
        <>
        <div>
          {v.ingredients.map((ing) => (
            <>
              <img src={ingredients[ing.id].image} className="h-12 w-12"/>
              <span>x{ing.count}</span>
            </>
          ))}
          <img/>
          <hr/>
          {v.name}
        </div>
        {i+1 < connection.state.recipeOrder.length && <span> → </span>}
        </>
      ))}
      </div>
    </div>
  );
}
