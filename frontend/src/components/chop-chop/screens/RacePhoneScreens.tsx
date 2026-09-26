import type React from 'react'
import { CARD_BG, DOT, INK, PAGE_BG, PINK, PhoneFrame, ROYAL, SUN, Sparkle, TOMATO, lilita } from '../design'
import { INGREDIENT_NAMES, Ingredient } from '../Ingredient'
import type { IngredientKind } from '../Ingredient'
import { Basket, COUNTER_BG, GreenPill, PhoneTopBar, StoreButton, TrashButton } from '../race'

const MOCK = {
  store: {
    score: 1800,
    progress: 20,
    aisle: 'DAIRY',
    aisleIndex: 1,
    aisleCount: 6,
    shelves: [
      [{ kind: 'cheese', size: 84, rot: -4 }, null],
      [
        { kind: 'milk', size: 84, rot: 3 },
        { kind: 'cream', size: 80, rot: -3 },
      ],
      [
        { kind: 'yogurt', size: 80, rot: -3 },
        { kind: 'egg', size: 78, rot: 6 },
      ],
    ] as ({ kind: IngredientKind; size: number; rot: number } | null)[][],
    dragging: 'butter' as IngredientKind,
    basket: ['tomato', 'garlic', 'bread'] as IngredientKind[],
  },
  chop: {
    score: 1800,
    progress: 45,
    basket: ['steak', 'garlic', 'chicken', 'bread'] as IngredientKind[],
    queue: ['tomato', 'tomato', 'carrot', 'onion'] as IngredientKind[],
    currentIndex: 2,
  },
  stove: {
    score: 2150,
    progress: 70,
    basket: ['chicken', 'bread', 'lemon'] as IngredientKind[],
  },
  plating: {
    score: 2400,
    progress: 94,
    basket: ['garlic'] as IngredientKind[],
  },
  robbed: {
    score: 2150,
    progress: 60,
    basket: ['chicken', 'tomato', 'bread'] as IngredientKind[],
    stolenIndex: 1,
    thief: { name: 'Jun', color: TOMATO },
  },
}

const plank: React.CSSProperties = {
  height: 16,
  borderRadius: 8,
  background: '#E9A866',
  border: `4px solid ${INK}`,
  boxShadow: '0 6px 0 rgba(43,42,107,.14)',
}

const arrowButton: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: '#fff',
  border: `4px solid ${INK}`,
  boxShadow: '0 5px 0 rgba(43,42,107,.16)',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  font: lilita(36, 1),
  paddingBottom: 4,
}

export function RacePhoneStore() {
  const m = MOCK.store
  return (
    <PhoneFrame background={COUNTER_BG}>
      <PhoneTopBar mood="happy" progress={m.progress} score={m.score} />

      <div
        style={{
          position: 'absolute',
          top: 138,
          left: 18,
          right: 18,
          height: 404,
          background: CARD_BG,
          border: `5px solid ${INK}`,
          borderRadius: 34,
          boxShadow: `0 0 0 6px ${ROYAL},0 14px 0 6px rgba(43,42,107,.16)`,
          boxSizing: 'border-box',
          padding: '10px 14px 12px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
          <div style={arrowButton}>‹</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ font: lilita(40, 1), letterSpacing: '.04em' }}>{m.aisle}</span>
            <span style={{ display: 'flex', gap: 5 }}>
              {Array.from({ length: m.aisleCount }, (_, i) =>
                i === m.aisleIndex ? (
                  <span key={i} style={{ width: 18, height: 8, borderRadius: 4, background: INK }} />
                ) : (
                  <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: DOT }} />
                ),
              )}
            </span>
          </div>
          <div style={arrowButton}>›</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          {m.shelves.map((row, r) => (
            <div key={r} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-end', height: 88 }}>
                {row.map((item, i) =>
                  item ? (
                    <Ingredient key={i} kind={item.kind} size={item.size} rotate={item.rot} />
                  ) : (
                    <div
                      key={i}
                      style={{
                        width: 78,
                        height: 78,
                        borderRadius: '50%',
                        border: `4px dashed ${INK}`,
                        opacity: 0.3,
                        boxSizing: 'border-box',
                      }}
                    />
                  ),
                )}
              </div>
              <div style={plank} />
            </div>
          ))}
        </div>
      </div>

      <svg width="160" height="300" viewBox="0 0 160 300" style={{ position: 'absolute', left: 150, top: 250 }}>
        <path
          d="M110 20 Q140 140 60 270"
          fill="none"
          stroke={INK}
          strokeWidth="4"
          strokeDasharray="4 12"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 168,
          top: 510,
          zIndex: 4,
          filter: 'drop-shadow(0 16px 10px rgba(43,42,107,.28))',
        }}
      >
        <Ingredient kind={m.dragging} size={100} rotate={-10} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 198,
          top: 572,
          zIndex: 5,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.45)',
          border: '4px solid #fff',
          boxShadow: `0 0 0 3px ${INK}`,
        }}
      />

      <div style={{ position: 'absolute', top: 566, left: 84 }}>
        <Basket items={m.basket} width={296} height={148} token={62} />
      </div>
      <TrashButton position={{ left: 18, top: 650 }} />

      <GreenPill
        streak={{ left: 32, width: 44 }}
        style={{ left: 22, right: 22, bottom: 30, height: 78, borderRadius: 39, font: lilita(40) }}
      >
        Leave store ›
      </GreenPill>
    </PhoneFrame>
  )
}

function QueueToken({ kind, current }: { kind: IngredientKind; current: boolean }) {
  return (
    <div
      style={{
        width: current ? 64 : 50,
        height: current ? 64 : 50,
        borderRadius: '50%',
        background: current ? SUN : '#fff',
        border: `${current ? 5 : 4}px solid ${INK}`,
        boxShadow: current ? '0 0 0 5px #fff,0 6px 0 5px rgba(43,42,107,.16)' : undefined,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ingredient kind={kind} size={current ? 46 : 36} sticker={false} />
    </div>
  )
}

function CarrotSlice({ left, top, size, inset }: { left: number; top: number; size: number; inset: number }) {
  return (
    <span
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#FF9A3C',
        border: `4px solid ${INK}`,
        boxSizing: 'border-box',
        boxShadow: `inset 0 0 0 ${inset}px #FFB870`,
      }}
    />
  )
}

export function RacePhoneChop() {
  const m = MOCK.chop
  return (
    <PhoneFrame background={COUNTER_BG}>
      <PhoneTopBar mood="focused" progress={m.progress} score={m.score} />
      <div style={{ position: 'absolute', top: 138, left: 18 }}>
        <Basket items={m.basket} width={354} height={126} token={58} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 282,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {m.queue.map((kind, i) => (
          <QueueToken key={i} kind={kind} current={i === m.currentIndex} />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 366,
          left: 26,
          right: 26,
          height: 366,
          borderRadius: 46,
          backgroundColor: '#E9A866',
          backgroundImage: 'repeating-linear-gradient(8deg,transparent 0 30px,rgba(201,128,63,.5) 30px 34px)',
          border: `5px solid ${INK}`,
          boxShadow: `inset 0 -12px 0 rgba(43,42,107,.12),0 0 0 6px ${ROYAL},0 14px 0 6px rgba(43,42,107,.16)`,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            position: 'absolute',
            right: 26,
            top: 22,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: PAGE_BG,
            border: `5px solid ${INK}`,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ position: 'absolute', left: 66, top: 84 }}>
          <Ingredient kind={m.queue[m.currentIndex]} size={200} rotate={-72} />
        </div>
        <CarrotSlice left={40} top={250} size={40} inset={6} />
        <CarrotSlice left={78} top={270} size={34} inset={5} />
        <svg width="170" height="200" viewBox="0 0 170 200" style={{ position: 'absolute', right: 10, top: 10 }}>
          <g transform="rotate(28 85 100)">
            <rect x="72" y="4" width="26" height="70" rx="10" fill={ROYAL} stroke={INK} strokeWidth="5" />
            <circle cx="85" cy="24" r="3.5" fill="#fff" />
            <circle cx="85" cy="50" r="3.5" fill="#fff" />
            <path
              d="M66 74 L104 74 L104 170 Q104 190 86 196 L66 196Z"
              fill="#fff"
              stroke={INK}
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path d="M76 90 L76 176" stroke="#CFE6FB" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>
        <svg width="90" height="200" viewBox="0 0 90 200" style={{ position: 'absolute', left: 236, top: 150 }}>
          <path d="M45 12 L45 170" stroke="#fff" strokeWidth="22" strokeLinecap="round" />
          <path
            d="M45 12 L45 170 M20 146 L45 176 L70 146"
            fill="none"
            stroke={INK}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <StoreButton />
      <TrashButton position={{ right: 22, bottom: 30 }} />
    </PhoneFrame>
  )
}

function Burner({
  top,
  left,
  outer,
  pan,
  inner,
  dashInset,
  handle,
}: {
  top: number
  left: number
  outer: number
  pan: { top: number; left: number; size: number }
  inner: { top: number; left: number; size: number }
  dashInset: number
  handle: { left: number; top: number; width: number; height: number; knob: boolean }
}) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top,
          left,
          width: outer,
          height: outer,
          borderRadius: '50%',
          background: '#3E4380',
          border: `6px solid ${INK}`,
          boxShadow: `0 0 0 6px ${ROYAL},0 14px 0 6px rgba(43,42,107,.18)`,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: dashInset,
            borderRadius: '50%',
            border: `8px dashed ${TOMATO}`,
            opacity: 0.9,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: pan.top,
          left: pan.left,
          width: pan.size,
          height: pan.size,
          borderRadius: '50%',
          background: '#5E64A8',
          border: `6px solid ${INK}`,
          boxShadow: 'inset 0 0 0 16px #6E75BE',
          boxSizing: 'border-box',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: handle.left,
          top: handle.top,
          width: handle.width,
          height: handle.height,
          borderRadius: handle.height / 2,
          background: TOMATO,
          border: `5px solid ${INK}`,
          boxSizing: 'border-box',
          transform: 'rotate(42deg)',
          transformOrigin: '0 50%',
        }}
      >
        {handle.knob && (
          <span
            style={{
              position: 'absolute',
              right: 12,
              top: 10,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: PAGE_BG,
              border: `3px solid ${INK}`,
            }}
          />
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          top: inner.top,
          left: inner.left,
          width: inner.size,
          height: inner.size,
          borderRadius: '50%',
          background: '#4A4F8C',
          border: `4px solid ${INK}`,
          boxSizing: 'border-box',
        }}
      />
    </>
  )
}

function HintArrow({
  width,
  height,
  style,
  arc,
  head,
}: {
  width: number
  height: number
  style: React.CSSProperties
  arc: string
  head: string
}) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', ...style }}>
      <path d={arc} fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" />
      <path d={arc} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <path d={head} fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      <path d={head} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HeatDash({ left, top, rot }: { left: number; top: number; rot: number }) {
  return (
    <span
      style={{
        position: 'absolute',
        left,
        top,
        width: 22,
        height: 8,
        borderRadius: 4,
        background: SUN,
        border: `3px solid ${INK}`,
        transform: `rotate(${rot}deg)`,
      }}
    />
  )
}

export function RacePhoneStove() {
  const m = MOCK.stove
  return (
    <PhoneFrame background={COUNTER_BG}>
      <PhoneTopBar mood="worried" progress={m.progress} score={m.score} />
      <div style={{ position: 'absolute', top: 138, left: 18 }}>
        <Basket items={m.basket} width={354} height={126} token={58} />
      </div>

      <Burner
        top={304}
        left={20}
        outer={350}
        dashInset={22}
        pan={{ top: 338, left: 54, size: 282 }}
        handle={{ left: 278, top: 584, width: 120, height: 40, knob: true }}
        inner={{ top: 378, left: 94, size: 202 }}
      />
      <div style={{ position: 'absolute', left: 118, top: 398 }}>
        <Ingredient kind="steak" size={130} rotate={-10} sticker={false} />
      </div>
      <div style={{ position: 'absolute', left: 108, top: 488 }}>
        <Ingredient kind="garlic" size={66} rotate={10} sticker={false} />
      </div>
      <div style={{ position: 'absolute', left: 210, top: 490 }}>
        <Ingredient kind="tomato" size={66} rotate={-8} sticker={false} />
      </div>
      <HintArrow
        width={282}
        height={282}
        style={{ top: 338, left: 54 }}
        arc="M58 90 A104 104 0 1 0 108 42"
        head="M90 26 L114 40 L94 62"
      />
      <HeatDash left={40} top={318} rot={-40} />
      <HeatDash left={330} top={350} rot={40} />

      <StoreButton />
      <TrashButton position={{ right: 22, bottom: 30 }} />
    </PhoneFrame>
  )
}

export function RacePhonePlating() {
  const m = MOCK.plating
  return (
    <PhoneFrame background={COUNTER_BG}>
      <PhoneTopBar mood="delighted" progress={m.progress} score={m.score} />
      <div style={{ position: 'absolute', top: 138, left: 18 }}>
        <Basket items={m.basket} width={354} height={126} token={58} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 300,
          left: 25,
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: '#fff',
          border: `6px solid ${INK}`,
          boxShadow: `inset 0 0 0 26px #F2F4FF,inset 0 0 0 30px ${DOT},0 0 0 7px ${ROYAL},0 14px 0 7px rgba(43,42,107,.16)`,
          boxSizing: 'border-box',
        }}
      />
      <svg
        width="250"
        height="250"
        viewBox="0 0 240 240"
        style={{ position: 'absolute', top: 345, left: 70 }}
        fill="none"
        strokeLinecap="round"
      >
        {[
          { stroke: INK, width: 14 },
          { stroke: '#F2BE63', width: 7 },
        ].map((layer) => (
          <g key={layer.stroke} stroke={layer.stroke} strokeWidth={layer.width}>
            <ellipse cx="120" cy="124" rx="88" ry="74" />
            <ellipse cx="116" cy="120" rx="62" ry="80" transform="rotate(30 116 120)" />
            <path d="M40 128 Q70 54 140 66 Q206 84 192 150 Q170 204 108 196 Q52 186 62 136" />
            <ellipse cx="124" cy="118" rx="50" ry="40" />
          </g>
        ))}
        <path
          d="M86 96 Q100 72 128 80 Q160 84 162 112 Q164 146 130 152 Q96 158 84 132 Q78 112 86 96Z"
          fill={TOMATO}
          stroke={INK}
          strokeWidth="5"
        />
        <circle cx="104" cy="104" r="15" fill="#C9803F" stroke={INK} strokeWidth="5" />
        <circle cx="140" cy="100" r="14" fill="#C9803F" stroke={INK} strokeWidth="5" />
        <circle cx="124" cy="134" r="15" fill="#C9803F" stroke={INK} strokeWidth="5" />
        <circle cx="99" cy="99" r="4" fill="#fff" />
        <circle cx="119" cy="129" r="4" fill="#fff" />
        <ellipse cx="150" cy="130" rx="10" ry="6" transform="rotate(-30 150 130)" fill="#3CB54A" stroke={INK} strokeWidth="4" />
        <ellipse cx="96" cy="136" rx="9" ry="5.5" transform="rotate(25 96 136)" fill="#3CB54A" stroke={INK} strokeWidth="4" />
      </svg>
      <Sparkle kind="star" color={SUN} size={40} style={{ position: 'absolute', left: 36, top: 300 }} />
      <Sparkle kind="plus" color={PINK} size={26} style={{ position: 'absolute', right: 36, top: 620 }} />

      <StoreButton bottom={40} />
      <TrashButton dashed position={{ right: 22, bottom: 40 }} />
      <GreenPill
        streak={{ left: 28, width: 40 }}
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 30,
          width: 176,
          height: 84,
          borderRadius: 42,
          font: lilita(46),
        }}
      >
        Serve!
      </GreenPill>
    </PhoneFrame>
  )
}

export function RacePhoneRobbed() {
  const m = MOCK.robbed
  const stolen = m.basket[m.stolenIndex]
  return (
    <PhoneFrame background={COUNTER_BG}>
      <PhoneTopBar mood="panicked" progress={m.progress} score={m.score} />
      <div style={{ position: 'absolute', top: 138, left: 18 }}>
        <Basket items={m.basket} gone={m.stolenIndex} width={354} height={126} token={58} />
      </div>

      <Burner
        top={366}
        left={30}
        outer={330}
        dashInset={20}
        pan={{ top: 398, left: 62, size: 266 }}
        handle={{ left: 276, top: 632, width: 110, height: 38, knob: false }}
        inner={{ top: 436, left: 100, size: 190 }}
      />
      <div style={{ position: 'absolute', left: 130, top: 460 }}>
        <Ingredient kind="steak" size={130} rotate={14} sticker={false} />
      </div>
      <HintArrow
        width={200}
        height={120}
        style={{ left: 96, top: 400 }}
        arc="M40 100 Q60 16 150 30"
        head="M130 12 L154 30 L132 50"
      />

      <div
        style={{
          position: 'absolute',
          top: 282,
          left: 26,
          right: 26,
          zIndex: 7,
          transform: 'rotate(-3deg)',
          background: SUN,
          border: `5px solid ${INK}`,
          borderRadius: 28,
          boxShadow: '0 0 0 6px #fff,0 12px 0 6px rgba(43,42,107,.18)',
          padding: '8px 14px 10px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: '50%',
            background: m.thief.color,
            border: `4px solid ${INK}`,
            boxSizing: 'border-box',
          }}
        />
        <span style={{ flex: 1, font: lilita(29, 1.05) }}>
          {m.thief.name} stole your {INGREDIENT_NAMES[stolen].toLowerCase()}!
        </span>
      </div>

      <svg width="70" height="150" viewBox="0 0 70 150" style={{ position: 'absolute', left: 92, top: 0, zIndex: 6 }}>
        <path d="M50 10 L30 40 M60 50 L34 70 M56 96 L30 110" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      </svg>
      <svg width="70" height="150" viewBox="0 0 70 150" style={{ position: 'absolute', left: 288, top: 0, zIndex: 6 }}>
        <path d="M20 10 L40 40 M10 50 L36 70 M14 96 L40 110" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      </svg>
      <svg
        width="180"
        height="230"
        viewBox="0 0 180 230"
        style={{ position: 'absolute', left: 125, top: -14, zIndex: 6 }}
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M52 0 L128 0 L122 100 L58 100Z" fill={m.thief.color} />
        <path d="M55 30 L125 30 M57 62 L123 62" stroke="#fff" strokeWidth="9" />
        <rect x="48" y="94" width="84" height="22" rx="10" fill="#fff" />
        <path d="M50 116 Q46 160 72 176 L110 176 Q136 160 130 116Z" fill="#FFD9B8" />
      </svg>
      <div style={{ position: 'absolute', left: 162, top: 128, zIndex: 6 }}>
        <Ingredient kind={stolen} size={100} rotate={-14} />
      </div>
      <svg
        width="180"
        height="230"
        viewBox="0 0 180 230"
        style={{ position: 'absolute', left: 125, top: -14, zIndex: 6 }}
        stroke={INK}
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect x="58" y="152" width="17" height="48" rx="8.5" fill="#FFD9B8" />
        <rect x="77" y="156" width="17" height="54" rx="8.5" fill="#FFD9B8" />
        <rect x="96" y="156" width="17" height="52" rx="8.5" fill="#FFD9B8" />
        <rect x="115" y="150" width="16" height="42" rx="8" fill="#FFD9B8" />
        <path d="M50 130 Q30 156 46 186" strokeWidth="18" fill="none" />
        <path d="M50 130 Q30 156 46 186" stroke="#FFD9B8" strokeWidth="9" fill="none" />
      </svg>
      <div
        style={{
          position: 'absolute',
          right: 14,
          top: 150,
          zIndex: 8,
          transform: 'rotate(12deg)',
          width: 96,
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="96" height="96" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
          <polygon
            points="50,2 60,24 84,12 76,38 98,50 76,62 84,88 60,76 50,98 40,76 16,88 24,62 2,50 24,38 16,12 40,24"
            fill="#fff"
            stroke={INK}
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            position: 'relative',
            font: lilita(22, 1),
            color: TOMATO,
            WebkitTextStroke: `5px ${INK}`,
            paintOrder: 'stroke fill',
          }}
        >
          Yoink!
        </span>
      </div>

      <StoreButton />
      <TrashButton position={{ right: 22, bottom: 30 }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 52,
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 0 8px rgba(242,85,61,.85)',
        }}
      />
    </PhoneFrame>
  )
}
