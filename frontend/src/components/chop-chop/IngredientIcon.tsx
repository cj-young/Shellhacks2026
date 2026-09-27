import type React from "react";
import { ingredientAsset, ingredientName, isMenuIngredient } from "#/data/menu";
import { Ingredient } from "./Ingredient";
import type { IngredientKind } from "./Ingredient";

const stickerFilter = (size: number) => {
  const d = Math.max(2, Math.round(size / 26));
  return `drop-shadow(${d}px 0 0 #fff) drop-shadow(-${d}px 0 0 #fff) drop-shadow(0 ${d}px 0 #fff) drop-shadow(0 -${d}px 0 #fff) drop-shadow(0 ${d + 2}px 0 rgba(122,78,30,.16))`;
};

/**
 * Resolves a design kind / ingredient id to an image URL. An id that already
 * looks like a path is used as-is; otherwise it is a menu ingredient.
 */
export function ingredientIconSrc(id: string, silhouette = false): string {
  const isImageUrl = id.startsWith("/") || id.startsWith("http");
  return isImageUrl ? id : ingredientAsset(id, silhouette);
}

/**
 * `id` can be a menu ingredient (renders its public/assets file), an image URL starting
 * with "/" or "http", or a design-handoff kind (inline art, used by the dev mockups).
 */
export function IngredientIcon({
  id,
  size = 80,
  rotate = 0,
  sticker = true,
  silhouette = false,
  style,
}: {
  id: string;
  size?: number;
  rotate?: number;
  sticker?: boolean;
  silhouette?: boolean;
  style?: React.CSSProperties;
}) {
  const isImageUrl = id.startsWith("/") || id.startsWith("http");
  if (!isImageUrl && !isMenuIngredient(id)) {
    return (
      <Ingredient
        kind={id as IngredientKind}
        size={size}
        rotate={rotate}
        sticker={sticker}
        silhouette={silhouette}
        style={style}
      />
    );
  }
  return (
    <img
      src={ingredientIconSrc(id, silhouette)}
      alt={
        silhouette ? "Mystery ingredient" : isImageUrl ? "" : ingredientName(id)
      }
      width={size}
      height={size}
      draggable={false}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        objectFit: "contain",
        filter:
          silhouette && isImageUrl
            ? "brightness(0)"
            : sticker
              ? stickerFilter(size)
              : undefined,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
