import { ChefPlaceholder, DOT, Food, INK, LEAF, NamePill, PAGE_BG, PINK, ROYAL, SKY, SUN, Sparkle, lilita, nunito } from '../design'

const ROOM_CODE = 'YUMI'
const PLAYERS = [
  { name: 'Mina', color: ROYAL, rot: -4, isNewest: false },
  { name: 'Jun', color: '#F2553D', rot: 3, isNewest: false },
  { name: 'Ari', color: '#159A6B', rot: -2, isNewest: false },
  { name: 'Leo', color: PINK, rot: 5, isNewest: true },
]

export function HostLobbyNew() {
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: PAGE_BG,
        backgroundImage: `radial-gradient(${DOT} 2.5px, transparent 3px)`,
        backgroundSize: '40px 40px',
        border: `5px solid ${INK}`,
        borderRadius: 32,
        boxSizing: 'border-box',
        fontFamily: 'Nunito, sans-serif',
        color: INK,
      }}
    >
      <Food kind="dumpling" size={140} rotate={-14} style={{ position: 'absolute', left: 70, top: 60 }} />

      <div
        style={{
          position: 'absolute',
          left: 170,
          top: 100,
          transform: 'rotate(-4deg)',
          background: '#fff',
          border: `5px solid ${INK}`,
          borderRadius: 70,
          padding: '28px 64px 44px',
          boxShadow: '0 0 0 12px #fff,0 16px 0 12px rgba(43,42,107,.14)',
        }}
      >
        <div
          style={{
            font: lilita(170, 1),
            color: SUN,
            WebkitTextStroke: `16px ${INK}`,
            paintOrder: 'stroke fill',
            textShadow: `0 12px 0 ${INK}`,
            letterSpacing: '-.01em',
          }}
        >
          Chop Chop!
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 720,
          top: 318,
          transform: 'rotate(4deg)',
          background: ROYAL,
          border: `5px solid ${INK}`,
          borderRadius: 40,
          padding: '10px 34px',
          boxShadow: `0 0 0 8px ${SUN}`,
          font: lilita(44),
          color: '#fff',
          letterSpacing: '.06em',
        }}
      >
        KITCHEN RELAY
      </div>

      <Food kind="tomato" size={120} rotate={12} style={{ position: 'absolute', left: 990, top: 70 }} />
      <Sparkle kind="star" color={SUN} size={56} rotate={10} style={{ position: 'absolute', left: 1130, top: 220 }} />
      <Sparkle kind="plus" color={PINK} size={34} style={{ position: 'absolute', left: 120, top: 400 }} />
      <Sparkle kind="dot" color={SKY} size={22} style={{ position: 'absolute', left: 640, top: 60 }} />
      <Sparkle kind="star" color={LEAF} size={40} style={{ position: 'absolute', left: 1210, top: 470 }} />
      <Sparkle kind="plus" color={SUN} size={30} style={{ position: 'absolute', left: 1860, top: 560 }} />
      <Sparkle kind="dot" color={PINK} size={20} style={{ position: 'absolute', left: 1240, top: 980 }} />

      <div style={{ position: 'absolute', left: 130, top: 452, font: nunito(900, 38) }}>
        Cook together. Pass it on.
      </div>

      <div
        style={{
          position: 'absolute',
          left: 100,
          top: 560,
          display: 'flex',
          gap: 30,
          alignItems: 'flex-end',
        }}
      >
        {PLAYERS.map((p) => (
          <div
            key={p.name}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              transform: `rotate(${p.rot}deg)${p.isNewest ? ' scale(1.06)' : ''}`,
            }}
          >
            {p.isNewest && (
              <div
                style={{
                  position: 'absolute',
                  top: -24,
                  right: -36,
                  zIndex: 2,
                  transform: 'rotate(14deg)',
                  width: 92,
                  height: 92,
                  borderRadius: '50%',
                  background: SUN,
                  border: `4px solid ${INK}`,
                  boxShadow: '0 0 0 6px #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: lilita(30),
                }}
              >
                Hi!
              </div>
            )}
            <ChefPlaceholder color={p.color} size={180} />
            <NamePill name={p.name} color={p.color} />
          </div>
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 190, height: 214, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: 170,
                height: 170,
                borderRadius: '50%',
                border: `5px dashed ${INK}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                font: lilita(90),
                opacity: 0.55,
              }}
            >
              +
            </div>
          </div>
          <div style={{ font: nunito(800, 26), padding: '10px 0' }}>Room for 1 more</div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 110,
          top: 70,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: SKY,
          border: `6px solid ${INK}`,
          boxShadow: '0 0 0 16px #fff,0 22px 0 16px rgba(43,42,107,.15)',
          boxSizing: 'border-box',
          transform: 'rotate(3deg)',
        }}
      >
        <svg viewBox="0 0 588 588" width="588" height="588" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <path id="lobbyTop" d="M69 294 A225 225 0 0 1 519 294" />
            <path id="lobbyBot" d="M32 294 A262 262 0 0 0 556 294" />
          </defs>
          <text fontFamily="Lilita One" fontSize="44" fill={INK} letterSpacing="4">
            <textPath href="#lobbyTop" startOffset="50%" textAnchor="middle">
              SCAN TO JOIN ✦ SCAN TO JOIN
            </textPath>
          </text>
          <text fontFamily="Lilita One" fontSize="36" fill={INK} letterSpacing="3">
            <textPath href="#lobbyBot" startOffset="50%" textAnchor="middle">
              OR VISIT CHOPCHOP.GAME
            </textPath>
          </text>
        </svg>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 270,
            height: 270,
            background: '#fff',
            border: `5px solid ${INK}`,
            borderRadius: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 16,
              background: `repeating-linear-gradient(45deg,${DOT} 0 10px,#fff 10px 20px)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: '700 18px ui-monospace,monospace',
            }}
          >
            QR code
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 170,
          top: 640,
          transform: 'rotate(-3deg)',
          background: SUN,
          border: `5px solid ${INK}`,
          borderRadius: 36,
          padding: '14px 48px 18px',
          boxShadow: '0 0 0 10px #fff,0 14px 0 10px rgba(43,42,107,.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <span style={{ font: nunito(900, 26), letterSpacing: '.14em' }}>ROOM CODE</span>
        <span style={{ font: lilita(130, 1), letterSpacing: '.14em' }}>{ROOM_CODE}</span>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 110,
          bottom: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 30,
        }}
      >
        <span style={{ font: nunito(900, 28) }}>{PLAYERS.length} chefs in</span>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            height: 150,
            padding: '0 60px 0 30px',
            borderRadius: 75,
            background: LEAF,
            border: `5px solid ${INK}`,
            boxShadow: 'inset 0 -12px 0 rgba(43,42,107,.18),0 0 0 10px #fff,0 16px 0 10px rgba(43,42,107,.15)',
            boxSizing: 'border-box',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 70,
              top: 18,
              width: 90,
              height: 16,
              borderRadius: 8,
              background: '#fff',
              opacity: 0.6,
            }}
          />
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: '50%',
              background: SUN,
              border: `5px solid ${INK}`,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24">
              <path d="M7 4 L20 12 L7 20 Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ font: lilita(100, 1) }}>Start!</span>
        </div>
      </div>
    </div>
  )
}
