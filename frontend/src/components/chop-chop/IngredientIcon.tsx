import type React from 'react'
import { ingredientAsset, ingredientName, isMenuIngredient } from '#/data/menu'
import { Ingredient } from './Ingredient'
import type { IngredientKind } from './Ingredient'

const stickerFilter = (size: number) => {
  const d = Math.max(2, Math.round(size / 26))
  return `drop-shadow(${d}px 0 0 #fff) drop-shadow(-${d}px 0 0 #fff) drop-shadow(0 ${d}px 0 #fff) drop-shadow(0 -${d}px 0 #fff) drop-shadow(0 ${d + 2}px 0 rgba(43,42,107,.16))`
}

/**
 * Menu ingredients (src/data/menu.json) render from their asset files, so final art can be
 * dropped into public/assets. Anything else falls back to the design handoff's inline art,
 * which the design mockups in the dev switcher still use.
 */
export function IngredientIcon({
  id,
  size = 80,
  rotate = 0,
  sticker = true,
  silhouette = false,
  style,
}: {
  id: string
  size?: number
  rotate?: number
  sticker?: boolean
  silhouette?: boolean
  style?: React.CSSProperties
}) {
  if (!isMenuIngredient(id)) {
    return (
      <Ingredient kind={id as IngredientKind} size={size} rotate={rotate} sticker={sticker} silhouette={silhouette} style={style} />
    )
  }
  return (
    <img
      src={ingredientAsset(id, silhouette)}
      alt={silhouette ? 'Mystery ingredient' : ingredientName(id)}
      width={size}
      height={size}
      draggable={false}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        filter: sticker ? stickerFilter(size) : undefined,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}
