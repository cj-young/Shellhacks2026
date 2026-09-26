import type { GameConnection } from "#/lib/use-game-connection";

interface HostInterfaceProps {
    connection: GameConnection
}

export function HostInterface({connection}:HostInterfaceProps) {
    

    return (<div>
        Host Interface
        <button type="button" onClick={(e)=>connection.socketRef.current?.emit("test")}>Emit some bullshit</button>
    </div>)
}
