import type React from "react";
import { INK } from "./design";

export const INGREDIENT_KINDS = [
  "tomato",
  "redpepper",
  "greenonion",
  "leek",
  "lemon",
  "lime",
  "butter",
  "cheese",
  "flour",
  "sugar",
  "carrot",
  "mushroom",
  "onion",
  "garlic",
  "chili",
  "salt",
  "egg",
  "milk",
  "chicken",
  "fish",
  "bacon",
  "rice",
  "bread",
  "bun",
  "steak",
  "yogurt",
  "cream",
] as const;

export type IngredientKind = (typeof INGREDIENT_KINDS)[number];

export const INGREDIENT_NAMES: Record<IngredientKind, string> = {
  tomato: "Tomato",
  redpepper: "Red pepper",
  greenonion: "Green onion",
  leek: "Leek",
  lemon: "Lemon",
  lime: "Lime",
  butter: "Butter",
  cheese: "Cheese",
  flour: "Flour",
  sugar: "Sugar",
  carrot: "Carrot",
  mushroom: "Mushroom",
  onion: "Onion",
  garlic: "Garlic",
  chili: "Chili",
  salt: "Salt",
  egg: "Egg",
  milk: "Milk",
  chicken: "Chicken",
  fish: "Fish",
  bacon: "Bacon",
  rice: "Rice",
  bread: "Bread",
  bun: "Bun",
  steak: "Steak",
  yogurt: "Yogurt",
  cream: "Cream",
};

// Look-alike pairs, as grouped on the design's asset sheet.
export const INGREDIENT_LOOKALIKE_PAIRS: [IngredientKind, IngredientKind][] = [
  ["tomato", "redpepper"],
  ["greenonion", "leek"],
  ["lemon", "lime"],
  ["butter", "cheese"],
  ["flour", "sugar"],
];

const PALETTE = {
  red: "#F2553D",
  green: "#3CB54A",
  dkgreen: "#1E8A4A",
  ltgreen: "#BFEBD9",
  white: "#FFFFFF",
  cream: "#FFF1D2",
  lemon: "#FFD83A",
  lime: "#8FD14F",
  butter: "#FFE58A",
  butterTop: "#FFF3C2",
  cheese: "#FFC928",
  cheeseTop: "#FFDD6B",
  cheeseDk: "#E8A51C",
  blue: "#1F4FD8",
  sky: "#4FB3F0",
  skyLt: "#CFE6FB",
  pink: "#F48FB7",
  bacon: "#FF8A7A",
  tan: "#E9A866",
  gold: "#F2BE63",
  orange: "#FF9A3C",
  steak: "#D9474A",
  hi: "#FFFFFF",
};
type Palette = Record<keyof typeof PALETTE, string>;

const FACE_Y: Partial<Record<IngredientKind, number>> = {
  tomato: 62,
  redpepper: 62,
  lemon: 56,
  lime: 60,
  egg: 58,
  cheese: 64,
  bread: 64,
  bun: 46,
  onion: 64,
  garlic: 64,
  mushroom: 70,
  carrot: 48,
  fish: 52,
  butter: 66,
  chicken: 42,
};
const FACE_X: Partial<Record<IngredientKind, number>> = {
  fish: 40,
  butter: 30,
  chicken: 64,
};

function shape(kind: IngredientKind, c: Palette, line: string) {
  switch (kind) {
    case "tomato":
      return (
        <g>
          <circle cx="50" cy="58" r="34" fill={c.red} />
          <path
            d="M34 28 Q42 32 50 24 Q58 32 66 28 Q62 38 50 37 Q38 38 34 28Z"
            fill={c.green}
          />
          <path d="M50 24 L51 13" />
          <ellipse
            cx="32"
            cy="48"
            rx="7"
            ry="4.5"
            transform="rotate(-35 32 48)"
            fill={c.hi}
            stroke="none"
          />
        </g>
      );
    case "redpepper":
      return (
        <g>
          <path
            d="M50 34 Q64 26 76 34 Q88 46 82 66 Q78 86 64 88 Q56 89 50 84 Q44 89 36 88 Q22 86 18 66 Q12 46 24 34 Q36 26 50 34Z"
            fill={c.red}
          />
          <path
            d="M38 46 Q34 64 38 82 M62 46 Q66 64 62 82"
            strokeWidth="3"
            stroke={line}
          />
          <path d="M50 30 Q50 18 60 10" strokeWidth="11" />
          <path d="M50 30 Q50 18 60 10" stroke={c.green} strokeWidth="4" />
          <path
            d="M38 33 Q50 24 62 33 Q57 39 50 39 Q43 39 38 33Z"
            fill={c.green}
          />
          <ellipse
            cx="27"
            cy="54"
            rx="5"
            ry="9"
            transform="rotate(15 27 54)"
            fill={c.hi}
            stroke="none"
          />
        </g>
      );
    case "greenonion":
      return (
        <g>
          <path d="M45 60 L33 12 Q38 8 42 13 L51 58Z" fill={c.green} />
          <path d="M47 60 L50 6 Q56 6 56 11 L54 60Z" fill={c.green} />
          <path d="M52 60 L64 14 Q70 14 69 19 L58 62Z" fill={c.green} />
          <path
            d="M43 58 L57 58 L58 82 Q58 90 50 90 Q42 90 42 82Z"
            fill={c.white}
          />
          <path
            d="M46 92 L44 97 M50 92 L50 98 M54 92 L56 97"
            strokeWidth="3"
            stroke={line}
          />
        </g>
      );
    case "leek":
      return (
        <g>
          <path d="M40 52 Q22 32 14 10 Q32 16 48 44Z" fill={c.dkgreen} />
          <path d="M54 48 Q72 26 88 16 Q82 38 60 54Z" fill={c.dkgreen} />
          <path d="M43 50 Q42 26 51 6 Q59 26 57 50Z" fill={c.dkgreen} />
          <path
            d="M37 48 L63 48 L63 84 Q63 94 50 94 Q37 94 37 84Z"
            fill={c.white}
          />
          <path d="M37 48 L63 48 L63 62 L37 62Z" fill={c.ltgreen} />
        </g>
      );
    case "lemon":
      return (
        <g>
          <path
            d="M10 54 Q12 49 17 48 Q25 26 50 25 Q75 26 83 48 Q88 49 90 54 Q88 59 83 60 Q75 81 50 82 Q25 81 17 60 Q12 59 10 54Z"
            fill={c.lemon}
          />
          <path d="M52 25 Q62 10 78 12 Q70 27 52 25Z" fill={c.green} />
          <ellipse
            cx="32"
            cy="42"
            rx="8"
            ry="4.5"
            transform="rotate(-25 32 42)"
            fill={c.hi}
            stroke="none"
          />
        </g>
      );
    case "lime":
      return (
        <g>
          <ellipse cx="50" cy="57" rx="34" ry="30" fill={c.lime} />
          <path d="M84 55 Q89 57 85 61" />
          <path d="M50 27 Q58 12 74 13 Q67 28 50 27Z" fill={c.dkgreen} />
          <ellipse
            cx="32"
            cy="45"
            rx="8"
            ry="4.5"
            transform="rotate(-30 32 45)"
            fill={c.hi}
            stroke="none"
          />
        </g>
      );
    case "butter":
      return (
        <g>
          <path d="M12 46 L54 32 L88 42 L46 58Z" fill={c.butterTop} />
          <path d="M12 46 L46 58 L46 80 L12 68Z" fill={c.butter} />
          <path d="M46 58 L88 42 L88 64 L46 80Z" fill={c.white} />
          <path d="M46 68 L88 52" stroke={c.blue} strokeWidth="5" />
          <path d="M18 50 L26 53" stroke={c.hi} strokeWidth="4" />
        </g>
      );
    case "cheese":
      return (
        <g>
          <path d="M12 50 L58 24 L88 50Z" fill={c.cheeseTop} />
          <path d="M12 50 L88 50 L88 76 L12 76Z" fill={c.cheese} />
          <circle
            cx="28"
            cy="63"
            r="5"
            fill={c.cheeseDk}
            strokeWidth="3"
            stroke={line}
          />
          <circle
            cx="68"
            cy="65"
            r="6.5"
            fill={c.cheeseDk}
            strokeWidth="3"
            stroke={line}
          />
          <ellipse
            cx="56"
            cy="40"
            rx="6"
            ry="3.5"
            fill={c.cheeseDk}
            strokeWidth="3"
            stroke={line}
          />
          <ellipse
            cx="72"
            cy="46"
            rx="4"
            ry="2.3"
            fill={c.cheeseDk}
            strokeWidth="2.5"
            stroke={line}
          />
        </g>
      );
    case "flour":
      return (
        <g>
          <path
            d="M26 26 Q24 19 31 18 L69 18 Q76 19 74 26 L80 82 Q80 90 72 90 L28 90 Q20 90 20 82Z"
            fill={c.white}
          />
          <path d="M29 18 Q34 9 40 17 Q45 9 50 17 Q55 9 60 17 Q66 9 71 18" />
          <path d="M22 50 L78 50 L79 70 L21 70Z" fill={c.blue} />
          <path
            d="M50 54 L50 67 M50 58 L45 55 M50 58 L55 55 M50 63 L45 60 M50 63 L55 60"
            stroke={c.white}
            strokeWidth="2.8"
          />
        </g>
      );
    case "sugar":
      return (
        <g>
          <path
            d="M26 26 Q24 19 31 18 L69 18 Q76 19 74 26 L80 82 Q80 90 72 90 L28 90 Q20 90 20 82Z"
            fill={c.white}
          />
          <path d="M29 18 Q34 9 40 17 Q45 9 50 17 Q55 9 60 17 Q66 9 71 18" />
          <path d="M22 50 L78 50 L79 70 L21 70Z" fill={c.pink} />
          <rect
            x="44"
            y="54"
            width="12"
            height="12"
            rx="2"
            fill={c.white}
            strokeWidth="2.8"
            stroke={line}
          />
        </g>
      );
    case "carrot":
      return (
        <g>
          <ellipse
            cx="42"
            cy="18"
            rx="6"
            ry="12"
            transform="rotate(-25 42 18)"
            fill={c.green}
          />
          <ellipse
            cx="58"
            cy="18"
            rx="6"
            ry="12"
            transform="rotate(25 58 18)"
            fill={c.green}
          />
          <path
            d="M50 92 Q28 62 28 44 Q28 28 50 28 Q72 28 72 44 Q72 62 50 92Z"
            fill={c.orange}
          />
          <path
            d="M36 60 L42 60 M56 70 L62 70"
            strokeWidth="3.5"
            stroke={line}
          />
        </g>
      );
    case "mushroom":
      return (
        <g>
          <path d="M36 56 L34 84 Q50 92 66 84 L64 56 Z" fill={c.cream} />
          <path d="M10 58 Q12 16 50 16 Q88 16 90 58 Z" fill={c.tan} />
          <circle cx="33" cy="36" r="6" fill={c.hi} stroke="none" />
          <circle cx="57" cy="28" r="5" fill={c.hi} stroke="none" />
          <circle cx="72" cy="45" r="5" fill={c.hi} stroke="none" />
        </g>
      );
    case "onion":
      return (
        <g>
          <path
            d="M50 18 Q54 26 64 32 Q84 44 82 64 Q78 88 50 88 Q22 88 18 64 Q16 44 36 32 Q46 26 50 18Z"
            fill={c.gold}
          />
          <path d="M50 18 L52 8" />
          <path
            d="M40 40 Q32 62 40 84 M60 40 Q68 62 60 84"
            strokeWidth="3"
            stroke={line}
          />
          <path
            d="M44 90 L42 96 M50 90 L50 97 M56 90 L58 96"
            strokeWidth="3"
            stroke={line}
          />
        </g>
      );
    case "garlic":
      return (
        <g>
          <path
            d="M50 16 Q52 26 60 32 Q84 44 80 66 Q76 86 50 86 Q24 86 20 66 Q16 44 40 32 Q48 26 50 16Z"
            fill={c.white}
          />
          <path
            d="M50 36 Q42 60 50 84 M36 42 Q28 62 36 82 M64 42 Q72 62 64 82"
            strokeWidth="3"
            stroke={line}
          />
          <path
            d="M44 88 L42 94 M50 88 L50 95 M56 88 L58 94"
            strokeWidth="3"
            stroke={line}
          />
        </g>
      );
    case "chili":
      return (
        <g>
          <path
            d="M30 28 Q52 32 64 52 Q74 70 90 88 Q62 90 44 74 Q26 58 22 38 Q22 28 30 28Z"
            fill={c.red}
          />
          <path d="M27 30 Q20 20 27 10" strokeWidth="10" />
          <path d="M27 30 Q20 20 27 10" stroke={c.green} strokeWidth="3.5" />
          <ellipse
            cx="31"
            cy="32"
            rx="10"
            ry="6"
            transform="rotate(20 31 32)"
            fill={c.green}
          />
          <path d="M36 46 Q44 58 54 64" stroke={c.hi} strokeWidth="4" />
        </g>
      );
    case "salt":
      return (
        <g>
          <path
            d="M30 42 L70 42 L74 86 Q74 91 69 91 L31 91 Q26 91 26 86Z"
            fill={c.white}
          />
          <path d="M32 42 Q32 22 50 22 Q68 22 68 42Z" fill={c.sky} />
          <circle cx="42" cy="32" r="2.2" fill={INK} stroke="none" />
          <circle cx="50" cy="29" r="2.2" fill={INK} stroke="none" />
          <circle cx="58" cy="32" r="2.2" fill={INK} stroke="none" />
          <path
            d="M29 60 L71 60 L72 74 L28 74Z"
            fill={c.sky}
            strokeWidth="3.5"
            stroke={line}
          />
        </g>
      );
    case "egg":
      return (
        <g>
          <path
            d="M50 12 Q76 14 80 56 Q80 88 50 88 Q20 88 20 56 Q24 14 50 12Z"
            fill={c.cream}
          />
          <ellipse
            cx="36"
            cy="38"
            rx="5"
            ry="9"
            transform="rotate(20 36 38)"
            fill={c.hi}
            stroke="none"
          />
        </g>
      );
    case "milk":
      return (
        <g>
          <path d="M22 40 L56 40 L56 90 L22 90Z" fill={c.white} />
          <path d="M56 40 L78 32 L78 82 L56 90Z" fill={c.skyLt} />
          <path d="M22 40 L39 18 L56 40Z" fill={c.sky} />
          <path d="M39 18 L61 10 L78 32 L56 40Z" fill={c.sky} />
          <path
            d="M22 58 L56 58 L56 74 L22 74Z"
            fill={c.sky}
            strokeWidth="3.5"
            stroke={line}
          />
        </g>
      );
    case "chicken":
      return (
        <g>
          <path d="M52 54 L26 80" strokeWidth="17" />
          <path d="M52 54 L26 80" stroke={c.white} strokeWidth="8" />
          <circle cx="20" cy="76" r="7" fill={c.white} />
          <circle cx="30" cy="86" r="7" fill={c.white} />
          <path
            d="M46 60 Q32 42 46 24 Q62 8 80 18 Q96 32 86 52 Q76 68 58 66 Q50 66 46 60Z"
            fill={c.tan}
          />
          <ellipse
            cx="62"
            cy="26"
            rx="8"
            ry="4.5"
            transform="rotate(-20 62 26)"
            fill={c.hi}
            stroke="none"
          />
        </g>
      );
    case "fish":
      return (
        <g>
          <path d="M82 50 L96 32 L96 68Z" fill={c.sky} />
          <path
            d="M8 52 Q30 26 58 30 Q76 32 86 50 Q76 70 58 72 Q30 76 8 52Z"
            fill={c.sky}
          />
          <path d="M36 38 Q44 52 36 66" strokeWidth="3.5" stroke={line} />
          <circle cx="22" cy="48" r="3.8" fill={INK} stroke="none" />
          <path d="M50 40 Q60 38 68 42" stroke={c.hi} strokeWidth="4" />
        </g>
      );
    case "bacon":
      return (
        <g>
          <path
            d="M8 38 Q20 26 32 38 Q44 50 56 38 Q68 26 80 38 L92 60 Q80 48 68 60 Q56 72 44 60 Q32 48 20 60Z"
            fill={c.bacon}
          />
          <path
            d="M15 48 Q26 37 38 49 Q50 61 62 49 Q74 37 86 49"
            stroke={c.white}
            strokeWidth="5"
          />
        </g>
      );
    case "rice":
      return (
        <g>
          <path d="M20 48 Q22 22 50 22 Q78 22 80 48Z" fill={c.white} />
          <path
            d="M38 32 L42 30 M54 28 L58 30 M46 40 L50 38 M62 38 L66 40"
            strokeWidth="3"
            stroke={line}
          />
          <path d="M10 48 H90 Q88 86 50 88 Q12 86 10 48Z" fill={c.blue} />
          <circle cx="30" cy="64" r="3" fill={c.hi} stroke="none" />
          <circle cx="50" cy="70" r="3" fill={c.hi} stroke="none" />
          <circle cx="70" cy="64" r="3" fill={c.hi} stroke="none" />
        </g>
      );
    case "bread":
      return (
        <g>
          <path
            d="M10 60 Q10 28 50 28 Q90 28 90 60 L90 78 Q90 86 82 86 L18 86 Q10 86 10 78Z"
            fill={c.tan}
          />
          <path
            d="M28 46 L38 36 M45 46 L55 36 M62 46 L72 36"
            strokeWidth="3.5"
            stroke={line}
          />
          <path d="M20 52 Q22 42 30 38" stroke={c.hi} strokeWidth="4" />
        </g>
      );
    case "bun":
      return (
        <g>
          <path d="M12 68 H88 Q88 84 76 84 H24 Q12 84 12 68Z" fill={c.gold} />
          <path d="M10 62 Q12 24 50 24 Q88 24 90 62Z" fill={c.gold} />
          {[
            [36, 40],
            [52, 34],
            [66, 44],
            [46, 48],
          ].map(([cx, cy]) => (
            <ellipse
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              rx="3"
              ry="2"
              fill={c.hi}
              strokeWidth="2"
              stroke={line}
            />
          ))}
        </g>
      );
    case "steak":
      return (
        <g>
          <path
            d="M16 50 Q16 22 46 22 Q72 18 86 38 Q96 60 80 76 Q62 90 38 84 Q14 78 16 50Z"
            fill={c.cream}
          />
          <path
            d="M24 50 Q24 30 47 30 Q68 27 79 42 Q87 59 74 70 Q59 81 40 76 Q22 71 24 50Z"
            fill={c.steak}
            strokeWidth="3.5"
            stroke={line}
          />
          <circle
            cx="62"
            cy="52"
            r="9"
            fill={c.cream}
            strokeWidth="3.5"
            stroke={line}
          />
          <path
            d="M34 44 Q40 40 44 46 M40 62 Q46 58 50 64"
            stroke={c.hi}
            strokeWidth="3"
          />
        </g>
      );
    case "yogurt":
      return (
        <g>
          <path
            d="M22 36 L78 36 L70 88 Q69 92 64 92 L36 92 Q31 92 30 88Z"
            fill={c.white}
          />
          <path
            d="M26 58 L74 58 L71 76 L29 76Z"
            fill={c.pink}
            strokeWidth="3.5"
            stroke={line}
          />
          <ellipse cx="50" cy="34" rx="32" ry="12" fill={c.skyLt} />
          <path d="M76 30 Q90 22 88 12" strokeWidth="4" />
        </g>
      );
    case "cream":
      return (
        <g>
          <path
            d="M38 30 L62 30 L62 40 Q76 48 76 62 L76 86 Q76 92 70 92 L30 92 Q24 92 24 86 L24 62 Q24 48 38 40Z"
            fill={c.white}
          />
          <rect x="36" y="12" width="28" height="18" rx="5" fill={c.sky} />
          <path
            d="M24 62 L76 62 L76 80 L24 80Z"
            fill={c.sky}
            strokeWidth="3.5"
            stroke={line}
          />
          <path d="M32 48 Q34 44 38 42" stroke={c.hi} strokeWidth="3" />
        </g>
      );
  }
}

export interface IngredientProps {
  kind: IngredientKind;
  size?: number;
  /** Navy outline strokes; off gives the soft "lineless" look. */
  outline?: boolean;
  /** Solid navy "Blackout" silhouette. */
  silhouette?: boolean;
  /** "worried" adds the spoiling face (ignored for silhouettes). */
  mood?: "none" | "worried";
  /** White die-cut border + drop shadow. */
  sticker?: boolean;
  rotate?: number;
  style?: React.CSSProperties;
}

export function Ingredient({
  kind,
  size = 80,
  outline = true,
  silhouette = false,
  mood = "none",
  sticker = true,
  rotate = 0,
  style,
}: IngredientProps) {
  const c = { ...PALETTE };
  for (const key of Object.keys(c) as (keyof Palette)[])
    if (silhouette) c[key] = INK;
  if (silhouette) c.hi = "none";
  if (!silhouette && !outline) {
    c.white = "#E3EAF6";
    c.cream = "#FBE3B8";
    c.skyLt = "#B9D9F7";
    c.butterTop = "#FFEFA6";
  }
  const ink = silhouette || outline ? INK : "none";
  const line = silhouette || outline ? INK : "rgba(43,42,107,.5)";

  const worried = mood === "worried" && !silhouette;
  const fy = FACE_Y[kind] ?? 58;
  const fx = FACE_X[kind] ?? 50;
  const d = Math.max(2, Math.round(size / 26));
  const filter = sticker
    ? `drop-shadow(${d}px 0 0 #fff) drop-shadow(-${d}px 0 0 #fff) drop-shadow(0 ${d}px 0 #fff) drop-shadow(0 -${d}px 0 #fff) drop-shadow(0 ${d + 2}px 0 rgba(43,42,107,.16))`
    : "none";

  return (
    <div
      style={{
        display: "inline-block",
        lineHeight: 0,
        width: size,
        height: size,
        filter,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        stroke={ink}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: "visible" }}
      >
        {shape(kind, c, line)}
        {worried && (
          <g>
            <circle cx={fx - 9} cy={fy} r="3.8" fill={INK} stroke="none" />
            <circle cx={fx + 9} cy={fy} r="3.8" fill={INK} stroke="none" />
            <path
              d={`M${fx - 15} ${fy - 7} L${fx - 6} ${fy - 11} M${fx + 15} ${fy - 7} L${fx + 6} ${fy - 11}`}
              strokeWidth="3"
              stroke={line}
            />
            <path
              d={`M${fx - 7} ${fy + 10} Q${fx - 3.5} ${fy + 6} ${fx} ${fy + 10} Q${fx + 3.5} ${fy + 14} ${fx + 7} ${fy + 10}`}
              strokeWidth="3"
              stroke={line}
            />
            <path
              d={`M${fx + 26} ${fy - 22} Q${fx + 32} ${fy - 13} ${fx + 29} ${fy - 9} Q${fx + 26} ${fy - 6} ${fx + 23} ${fy - 9} Q${fx + 20} ${fy - 13} ${fx + 26} ${fy - 22}Z`}
              fill="#4FB3F0"
              strokeWidth="3"
              stroke={line}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
