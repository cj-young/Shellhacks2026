import type { GameConnection } from "#/lib/use-game-connection";
import { useEffect, useState } from "react";
import recipes from "../../data/recipes.json"

interface ClientInterfaceProps {
    connection: GameConnection
}

export function ClientInterface({connection}:ClientInterfaceProps) {
    // connection.
}
