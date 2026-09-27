import type { GameConnection } from "#/lib/use-game-connection";
import { Fragment } from "react";
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
        {connection.state.players.map(
          (v) => !v.isHost && <li key={v.id}>{v.name}</li>,
        )}
      </ul>
      <h2>Recipe Order</h2>
      <div className="flex flex-row gap-2">
        {connection.state.recipeOrder.map((v, i) => (
          <Fragment key={i}>
            <div>
              {v.ingredients.map((ing) => {
                const ingredient = ingredients.find(
                  (entry) => entry.id === ing.id,
                );

                return (
                  <Fragment key={ing.id}>
                    {ingredient ? (
                      <img
                        src={ingredient.image}
                        alt={ingredient.name}
                        className="h-12 w-12"
                      />
                    ) : (
                      <span>Unknown ingredient (ID {ing.id})</span>
                    )}
                    <span>x{ing.count}</span>
                  </Fragment>
                );
              })}
              <hr />
              {v.name}
            </div>
            {i + 1 < connection.state.recipeOrder.length && <span> → </span>}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
