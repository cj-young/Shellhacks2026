import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type React from 'react'
import { createHostGame } from '#/lib/host-game'
import { DOT, Food, INK, LEAF, PAGE_BG, PINK, ROYAL, SKY, SUN, Sparkle, TOMATO, lilita, nunito } from '#/components/chop-chop/design'

export const Route = createFileRoute('/')({ component: MainMenu })

const menuButton: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 84,
  borderRadius: 42,
  border: `4px solid ${INK}`,
  boxSizing: 'border-box',
  boxShadow: 'inset 0 -8px 0 rgba(43,42,107,.16),0 0 0 6px #fff,0 10px 0 6px rgba(43,42,107,.16)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  font: lilita(40),
  color: INK,
  textDecoration: 'none',
  cursor: 'pointer',
}

const caption: React.CSSProperties = { font: nunito(800, 17), textAlign: 'center' }

function Streak() {
  return (
    <span
      style={{
        position: 'absolute',
        left: 32,
        top: 12,
        width: 44,
        height: 11,
        borderRadius: 6,
        background: '#fff',
        opacity: 0.7,
      }}
    />
  )
}

function MainMenu() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const hostGame = async () => {
    setCreating(true)
    setError('')
    try {
      await createHostGame()
      await navigate({ to: '/host' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create a game')
      setCreating(false)
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        overflow: 'hidden',
        backgroundColor: PAGE_BG,
        backgroundImage: `radial-gradient(${DOT} 2.5px, transparent 3px)`,
        backgroundSize: '40px 40px',
        color: INK,
        fontFamily: 'Nunito, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(28px, 5vh, 56px)',
        padding: '48px 24px',
        boxSizing: 'border-box',
      }}
    >
      <Food kind="dumpling" size={110} rotate={-14} style={{ position: 'absolute', left: '4%', top: '5%' }} />
      <Food kind="tomato" size={96} rotate={12} style={{ position: 'absolute', right: '5%', top: '7%' }} />
      <Sparkle kind="star" color={SUN} size={48} rotate={10} style={{ position: 'absolute', right: '14%', top: '26%' }} />
      <Sparkle kind="plus" color={PINK} size={30} style={{ position: 'absolute', left: '9%', top: '38%' }} />
      <Sparkle kind="dot" color={SKY} size={20} style={{ position: 'absolute', left: '32%', top: '6%' }} />
      <Sparkle kind="star" color={LEAF} size={36} style={{ position: 'absolute', left: '12%', bottom: '14%' }} />
      <Sparkle kind="plus" color={SUN} size={28} style={{ position: 'absolute', right: '8%', bottom: '20%' }} />
      <Sparkle kind="dot" color={PINK} size={18} style={{ position: 'absolute', right: '30%', bottom: '6%' }} />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          fontSize: 'clamp(64px, 11vw, 170px)',
        }}
      >
        <div
          style={{
            transform: 'rotate(-4deg)',
            background: '#fff',
            border: `5px solid ${INK}`,
            borderRadius: '0.41em',
            padding: '0.16em 0.38em 0.26em',
            boxShadow: '0 0 0 12px #fff,0 16px 0 12px rgba(43,42,107,.14)',
          }}
        >
          <div
            style={{
              fontFamily: "'Lilita One'",
              lineHeight: 1,
              color: SUN,
              WebkitTextStroke: `0.094em ${INK}`,
              paintOrder: 'stroke fill',
              textShadow: `0 0.07em 0 ${INK}`,
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
            marginTop: '-0.12em',
            marginRight: '-0.2em',
            transform: 'rotate(4deg)',
            background: ROYAL,
            border: `5px solid ${INK}`,
            borderRadius: 40,
            padding: '0.23em 0.77em',
            boxShadow: `0 0 0 8px ${SUN}`,
            fontFamily: "'Lilita One'",
            fontSize: 'clamp(22px, 2.6vw, 44px)',
            color: '#fff',
            letterSpacing: '.06em',
            whiteSpace: 'nowrap',
          }}
        >
          KITCHEN RELAY
        </div>
      </div>

      <div style={{ font: nunito(900, 38), fontSize: 'clamp(22px, 3vw, 38px)', textAlign: 'center' }}>
        Cook together. Pass it on.
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '28px 40px',
          width: '100%',
          maxWidth: 780,
        }}
      >
        <div style={{ flex: '1 1 300px', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button
            type="button"
            onClick={() => void hostGame()}
            disabled={creating}
            style={{ ...menuButton, background: LEAF, opacity: creating ? 0.7 : 1, cursor: creating ? 'wait' : 'pointer' }}
          >
            <Streak />
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: SUN,
                border: `4px solid ${INK}`,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path d="M7 4 L20 12 L7 20 Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              </svg>
            </span>
            {creating ? 'Setting up…' : 'Host game'}
          </button>
          <span style={caption}>Put the kitchen on the big screen</span>
        </div>

        <div style={{ flex: '1 1 300px', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Link to="/join" style={{ ...menuButton, background: SUN }}>
            <Streak />
            Join game
          </Link>
          <span style={caption}>Grab your phone and a room code</span>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#FFE1DA',
            border: `4px solid ${TOMATO}`,
            borderRadius: 20,
            padding: '10px 18px',
            font: nunito(800, 16),
          }}
        >
          Couldn't open a kitchen: {error}
        </div>
      )}
    </div>
  )
}
