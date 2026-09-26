import { useLayoutEffect, useRef, useState } from 'react'
import type React from 'react'
import { ChefPlaceholder, DOT, Food, INK, LEAF, NamePill, PAGE_BG, PINK, ROYAL, SKY, SUN, Sparkle, lilita, nunito } from '../design'

export type LobbyPlayer = { id: string; name: string; color: string }

/** Player colors in join order, from the design's cast. */
export const LOBBY_COLORS = [ROYAL, '#F2553D', '#159A6B', PINK, SUN]

const SLOT_ROTATIONS = [-4, 3, -2, 5]
const MAX_SLOTS = 5
const DEFAULT_JOIN_TEXT = 'CHOPCHOP.GAME'
/** Below this width:height ratio the lobby stacks into a single column. */
const PORTRAIT_RATIO = 1.15

const MOCK_PLAYERS: LobbyPlayer[] = [
  { id: 'mina', name: 'Mina', color: LOBBY_COLORS[0] },
  { id: 'jun', name: 'Jun', color: LOBBY_COLORS[1] },
  { id: 'ari', name: 'Ari', color: LOBBY_COLORS[2] },
  { id: 'leo', name: 'Leo', color: LOBBY_COLORS[3] },
]

interface HostLobbyProps {
  roomCode?: string
  /** In join order; the last one gets the "Hi!" sticker. */
  players?: LobbyPlayer[]
  /** Shown on the badge's lower arc as "OR VISIT …". */
  joinText?: string
  onStart?: () => void
  canStart?: boolean
  notice?: string
}

/**
 * Fills its parent. Blocks are authored at the design's 1920×1080 pixel values and
 * zoomed by `scale`; the grid around them reflows for wide vs. tall screens.
 */
export function HostLobbyNew(props: HostLobbyProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const update = () => setSize({ w: root.clientWidth, h: root.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  const portrait = size ? size.w / size.h < PORTRAIT_RATIO : false
  const scale = size ? (portrait ? Math.min(size.w / 1080, size.h / 1920) : Math.min(size.w / 1920, size.h / 1080)) : 1

  return (
    <div
      ref={rootRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: PAGE_BG,
        backgroundImage: `radial-gradient(${DOT} ${2.5 * scale}px, transparent ${3 * scale}px)`,
        backgroundSize: `${40 * scale}px ${40 * scale}px`,
        fontFamily: 'Nunito, sans-serif',
        color: INK,
      }}
    >
      {size && <LobbyLayout {...props} portrait={portrait} scale={scale} />}
    </div>
  )
}

function Decorations({ scale }: { scale: number }) {
  const at = (left: number, top: number): React.CSSProperties => ({
    position: 'absolute',
    left: `${(left / 1920) * 100}%`,
    top: `${(top / 1080) * 100}%`,
  })
  const s = (n: number) => Math.round(n * scale)
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <Food kind="dumpling" size={s(140)} rotate={-14} style={at(70, 60)} />
      <Food kind="tomato" size={s(120)} rotate={12} style={at(990, 70)} />
      <Sparkle kind="star" color={SUN} size={s(56)} rotate={10} style={at(1130, 220)} />
      <Sparkle kind="plus" color={PINK} size={s(34)} style={at(120, 400)} />
      <Sparkle kind="dot" color={SKY} size={s(22)} style={at(640, 60)} />
      <Sparkle kind="star" color={LEAF} size={s(40)} style={at(1210, 470)} />
      <Sparkle kind="plus" color={SUN} size={s(30)} style={at(1860, 560)} />
      <Sparkle kind="dot" color={PINK} size={s(20)} style={at(1240, 980)} />
    </div>
  )
}

function LobbyLayout({
  roomCode = 'YUMI',
  players = MOCK_PLAYERS,
  joinText = DEFAULT_JOIN_TEXT,
  onStart,
  canStart = true,
  notice,
  portrait,
  scale,
}: HostLobbyProps & { portrait: boolean; scale: number }) {
  const zoom = (area: string, extra?: React.CSSProperties): React.CSSProperties => ({
    gridArea: area,
    zoom: scale,
    minWidth: 0,
    ...extra,
  })

  return (
    <>
      <Decorations scale={scale} />
      <div
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: `${40 * scale}px ${100 * scale}px ${30 * scale}px`,
          display: 'grid',
          ...(portrait
            ? {
                gridTemplateColumns: 'minmax(0,1fr)',
                gridTemplateRows: 'auto auto 1fr auto',
                gridTemplateAreas: '"brand" "side" "players" "start"',
                rowGap: 24 * scale,
                justifyItems: 'center',
              }
            : {
                gridTemplateColumns: `minmax(0,1fr) ${640 * scale}px`,
                gridTemplateRows: 'auto 1fr auto',
                gridTemplateAreas: '"brand side" "players side" "players start"',
                columnGap: 40 * scale,
                rowGap: 30 * scale,
              }),
        }}
      >
        <div style={zoom('brand', { justifySelf: portrait ? 'center' : 'start' })}>
          <Brand centered={portrait} />
        </div>
        <div style={zoom('side', { justifySelf: 'center', alignSelf: 'start' })}>
          <JoinBadge roomCode={roomCode} joinText={joinText} />
        </div>
        <div style={zoom('players', { alignSelf: 'center', justifySelf: portrait ? 'center' : 'start' })}>
          <PlayerRow players={players} centered={portrait} />
        </div>
        <div style={zoom('start', { alignSelf: 'end', justifySelf: portrait ? 'center' : 'end' })}>
          <StartRow count={players.length} onStart={onStart} canStart={canStart} notice={notice} />
        </div>
      </div>
    </>
  )
}

function Brand({ centered }: { centered: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: centered ? 'center' : 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '24px 40px 0 0' }}>
        <div
          style={{
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
              whiteSpace: 'nowrap',
            }}
          >
            Chop Chop!
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: -24,
            marginRight: -40,
            transform: 'rotate(4deg)',
            background: ROYAL,
            border: `5px solid ${INK}`,
            borderRadius: 40,
            padding: '10px 34px',
            boxShadow: `0 0 0 8px ${SUN}`,
            font: lilita(44),
            color: '#fff',
            letterSpacing: '.06em',
            whiteSpace: 'nowrap',
          }}
        >
          KITCHEN RELAY
        </div>
      </div>
      <div style={{ marginTop: 40, paddingLeft: centered ? 0 : 30, font: nunito(900, 38) }}>
        Cook together. Pass it on.
      </div>
    </div>
  )
}

function JoinBadge({ roomCode, joinText }: { roomCode: string; joinText: string }) {
  const arcText = `OR VISIT ${joinText.toUpperCase()}`
  const arcFontSize = Math.min(36, Math.floor((780 / arcText.length - 3) / 0.55))
  const codeFontSize = roomCode.length <= 4 ? 130 : 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 0' }}>
      <div
        style={{
          position: 'relative',
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
          <text fontFamily="Lilita One" fontSize={arcFontSize} fill={INK} letterSpacing="3">
            <textPath href="#lobbyBot" startOffset="50%" textAnchor="middle">
              {arcText}
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
          position: 'relative',
          zIndex: 1,
          marginTop: -30,
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
        <span style={{ font: lilita(codeFontSize, 1), letterSpacing: '.14em', whiteSpace: 'nowrap' }}>{roomCode}</span>
      </div>
    </div>
  )
}

function PlayerRow({ players, centered }: { players: LobbyPlayer[]; centered: boolean }) {
  const overflow = players.length > MAX_SLOTS
  const visible = overflow ? players.slice(0, MAX_SLOTS - 1) : players
  const showSlot = players.length !== MAX_SLOTS
  const newestId = players.at(-1)?.id
  const slotCaption = overflow
    ? `+${players.length - visible.length} more chefs`
    : `Room for ${MAX_SLOTS - players.length} more`

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: centered ? 'center' : 'flex-start',
        gap: 30,
        alignItems: 'flex-end',
        padding: '40px 20px 20px 0',
      }}
    >
      {visible.map((p, i) => {
        const isNewest = p.id === newestId
        return (
          <div
            key={p.id}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              transform: `rotate(${SLOT_ROTATIONS[i % SLOT_ROTATIONS.length]}deg)${isNewest ? ' scale(1.06)' : ''}`,
            }}
          >
            {isNewest && (
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
            <NamePill name={p.name} color={p.color} maxWidth={200} />
          </div>
        )
      })}

      {showSlot && (
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
          <div style={{ font: nunito(800, 26), padding: '10px 0' }}>{slotCaption}</div>
        </div>
      )}
    </div>
  )
}

function StartRow({
  count,
  onStart,
  canStart,
  notice,
}: {
  count: number
  onStart?: () => void
  canStart: boolean
  notice?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 30,
        padding: '0 16px 16px',
      }}
    >
      {notice && (
        <span
          style={{
            background: '#FFE1DA',
            border: `4px solid #F2553D`,
            borderRadius: 22,
            padding: '6px 18px',
            font: nunito(800, 22),
          }}
        >
          {notice}
        </span>
      )}
      <span style={{ font: nunito(900, 28) }}>
        {count} {count === 1 ? 'chef' : 'chefs'} in
      </span>
      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
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
          color: INK,
          cursor: canStart ? 'pointer' : 'not-allowed',
          opacity: canStart ? 1 : 0.5,
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
      </button>
    </div>
  )
}
