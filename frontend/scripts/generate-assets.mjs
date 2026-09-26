// Generates placeholder ingredient + dish SVGs into public/assets from src/data/menu.json.
// Final art can overwrite any file in public/assets without code changes; re-running this
// script regenerates (and overwrites) every placeholder.
//   node scripts/generate-assets.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const menu = JSON.parse(readFileSync(join(root, "src/data/menu.json"), "utf8"));
const outDir = join(root, "public/assets");
mkdirSync(outDir, { recursive: true });

const INK = "#2B2A6B";
const FONT = "Nunito, 'Arial Rounded MT Bold', Arial, sans-serif";

// Palette from the Claude Design handoff (Ingredient.dc.html).
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
  brown: "#C9803F",
  hi: "#FFFFFF",
  soy: "#4A4F8C",
};

function paletteFor(silhouette) {
  if (!silhouette) return { c: PALETTE, line: INK };
  const c = Object.fromEntries(Object.keys(PALETTE).map((k) => [k, INK]));
  c.hi = "none";
  return { c, line: INK };
}

// Shapes drawn in a 0–100 box. Design-art kinds are transcribed from Ingredient.dc.html.
const DESIGN_ART = {
  tomato: (c, l) => `
    <circle cx="50" cy="58" r="34" fill="${c.red}"/>
    <path d="M34 28 Q42 32 50 24 Q58 32 66 28 Q62 38 50 37 Q38 38 34 28Z" fill="${c.green}"/>
    <path d="M50 24 L51 13"/>
    <ellipse cx="32" cy="48" rx="7" ry="4.5" transform="rotate(-35 32 48)" fill="${c.hi}" stroke="none"/>`,
  "red-bell-pepper": (c, l) => `
    <path d="M50 34 Q64 26 76 34 Q88 46 82 66 Q78 86 64 88 Q56 89 50 84 Q44 89 36 88 Q22 86 18 66 Q12 46 24 34 Q36 26 50 34Z" fill="${c.red}"/>
    <path d="M38 46 Q34 64 38 82 M62 46 Q66 64 62 82" stroke-width="3" stroke="${l}"/>
    <path d="M50 30 Q50 18 60 10" stroke-width="11"/>
    <path d="M50 30 Q50 18 60 10" stroke="${c.green}" stroke-width="4"/>
    <path d="M38 33 Q50 24 62 33 Q57 39 50 39 Q43 39 38 33Z" fill="${c.green}"/>
    <ellipse cx="27" cy="54" rx="5" ry="9" transform="rotate(15 27 54)" fill="${c.hi}" stroke="none"/>`,
  "green-onion": (c, l) => `
    <path d="M45 60 L33 12 Q38 8 42 13 L51 58Z" fill="${c.green}"/>
    <path d="M47 60 L50 6 Q56 6 56 11 L54 60Z" fill="${c.green}"/>
    <path d="M52 60 L64 14 Q70 14 69 19 L58 62Z" fill="${c.green}"/>
    <path d="M43 58 L57 58 L58 82 Q58 90 50 90 Q42 90 42 82Z" fill="${c.white}"/>
    <path d="M46 92 L44 97 M50 92 L50 98 M54 92 L56 97" stroke-width="3" stroke="${l}"/>`,
  leek: (c) => `
    <path d="M40 52 Q22 32 14 10 Q32 16 48 44Z" fill="${c.dkgreen}"/>
    <path d="M54 48 Q72 26 88 16 Q82 38 60 54Z" fill="${c.dkgreen}"/>
    <path d="M43 50 Q42 26 51 6 Q59 26 57 50Z" fill="${c.dkgreen}"/>
    <path d="M37 48 L63 48 L63 84 Q63 94 50 94 Q37 94 37 84Z" fill="${c.white}"/>
    <path d="M37 48 L63 48 L63 62 L37 62Z" fill="${c.ltgreen}"/>`,
  lemon: (c) => `
    <path d="M10 54 Q12 49 17 48 Q25 26 50 25 Q75 26 83 48 Q88 49 90 54 Q88 59 83 60 Q75 81 50 82 Q25 81 17 60 Q12 59 10 54Z" fill="${c.lemon}"/>
    <path d="M52 25 Q62 10 78 12 Q70 27 52 25Z" fill="${c.green}"/>
    <ellipse cx="32" cy="42" rx="8" ry="4.5" transform="rotate(-25 32 42)" fill="${c.hi}" stroke="none"/>`,
  lime: (c) => `
    <ellipse cx="50" cy="57" rx="34" ry="30" fill="${c.lime}"/>
    <path d="M84 55 Q89 57 85 61"/>
    <path d="M50 27 Q58 12 74 13 Q67 28 50 27Z" fill="${c.dkgreen}"/>
    <ellipse cx="32" cy="45" rx="8" ry="4.5" transform="rotate(-30 32 45)" fill="${c.hi}" stroke="none"/>`,
  butter: (c) => `
    <path d="M12 46 L54 32 L88 42 L46 58Z" fill="${c.butterTop}"/>
    <path d="M12 46 L46 58 L46 80 L12 68Z" fill="${c.butter}"/>
    <path d="M46 58 L88 42 L88 64 L46 80Z" fill="${c.white}"/>
    <path d="M46 68 L88 52" stroke="${c.blue}" stroke-width="5"/>
    <path d="M18 50 L26 53" stroke="${c.hi}" stroke-width="4"/>`,
  cheese: (c, l) => `
    <path d="M12 50 L58 24 L88 50Z" fill="${c.cheeseTop}"/>
    <path d="M12 50 L88 50 L88 76 L12 76Z" fill="${c.cheese}"/>
    <circle cx="28" cy="63" r="5" fill="${c.cheeseDk}" stroke-width="3" stroke="${l}"/>
    <circle cx="68" cy="65" r="6.5" fill="${c.cheeseDk}" stroke-width="3" stroke="${l}"/>
    <ellipse cx="56" cy="40" rx="6" ry="3.5" fill="${c.cheeseDk}" stroke-width="3" stroke="${l}"/>
    <ellipse cx="72" cy="46" rx="4" ry="2.3" fill="${c.cheeseDk}" stroke-width="2.5" stroke="${l}"/>`,
  flour: (c) => `
    <path d="M26 26 Q24 19 31 18 L69 18 Q76 19 74 26 L80 82 Q80 90 72 90 L28 90 Q20 90 20 82Z" fill="${c.white}"/>
    <path d="M29 18 Q34 9 40 17 Q45 9 50 17 Q55 9 60 17 Q66 9 71 18"/>
    <path d="M22 50 L78 50 L79 70 L21 70Z" fill="${c.blue}"/>
    <path d="M50 54 L50 67 M50 58 L45 55 M50 58 L55 55 M50 63 L45 60 M50 63 L55 60" stroke="${c.white}" stroke-width="2.8"/>`,
  sugar: (c, l) => `
    <path d="M26 26 Q24 19 31 18 L69 18 Q76 19 74 26 L80 82 Q80 90 72 90 L28 90 Q20 90 20 82Z" fill="${c.white}"/>
    <path d="M29 18 Q34 9 40 17 Q45 9 50 17 Q55 9 60 17 Q66 9 71 18"/>
    <path d="M22 50 L78 50 L79 70 L21 70Z" fill="${c.pink}"/>
    <rect x="44" y="54" width="12" height="12" rx="2" fill="${c.white}" stroke-width="2.8" stroke="${l}"/>`,
  carrot: (c, l) => `
    <ellipse cx="42" cy="18" rx="6" ry="12" transform="rotate(-25 42 18)" fill="${c.green}"/>
    <ellipse cx="58" cy="18" rx="6" ry="12" transform="rotate(25 58 18)" fill="${c.green}"/>
    <path d="M50 92 Q28 62 28 44 Q28 28 50 28 Q72 28 72 44 Q72 62 50 92Z" fill="${c.orange}"/>
    <path d="M36 60 L42 60 M56 70 L62 70" stroke-width="3.5" stroke="${l}"/>`,
  onion: (c, l) => `
    <path d="M50 18 Q54 26 64 32 Q84 44 82 64 Q78 88 50 88 Q22 88 18 64 Q16 44 36 32 Q46 26 50 18Z" fill="${c.gold}"/>
    <path d="M50 18 L52 8"/>
    <path d="M40 40 Q32 62 40 84 M60 40 Q68 62 60 84" stroke-width="3" stroke="${l}"/>
    <path d="M44 90 L42 96 M50 90 L50 97 M56 90 L58 96" stroke-width="3" stroke="${l}"/>`,
  garlic: (c, l) => `
    <path d="M50 16 Q52 26 60 32 Q84 44 80 66 Q76 86 50 86 Q24 86 20 66 Q16 44 40 32 Q48 26 50 16Z" fill="${c.white}"/>
    <path d="M50 36 Q42 60 50 84 M36 42 Q28 62 36 82 M64 42 Q72 62 64 82" stroke-width="3" stroke="${l}"/>
    <path d="M44 88 L42 94 M50 88 L50 95 M56 88 L58 94" stroke-width="3" stroke="${l}"/>`,
  egg: (c) => `
    <path d="M50 12 Q76 14 80 56 Q80 88 50 88 Q20 88 20 56 Q24 14 50 12Z" fill="${c.cream}"/>
    <ellipse cx="36" cy="38" rx="5" ry="9" transform="rotate(20 36 38)" fill="${c.hi}" stroke="none"/>`,
  milk: (c, l) => `
    <path d="M22 40 L56 40 L56 90 L22 90Z" fill="${c.white}"/>
    <path d="M56 40 L78 32 L78 82 L56 90Z" fill="${c.skyLt}"/>
    <path d="M22 40 L39 18 L56 40Z" fill="${c.sky}"/>
    <path d="M39 18 L61 10 L78 32 L56 40Z" fill="${c.sky}"/>
    <path d="M22 58 L56 58 L56 74 L22 74Z" fill="${c.sky}" stroke-width="3.5" stroke="${l}"/>`,
  chicken: (c) => `
    <path d="M52 54 L26 80" stroke-width="17"/>
    <path d="M52 54 L26 80" stroke="${c.white}" stroke-width="8"/>
    <circle cx="20" cy="76" r="7" fill="${c.white}"/>
    <circle cx="30" cy="86" r="7" fill="${c.white}"/>
    <path d="M46 60 Q32 42 46 24 Q62 8 80 18 Q96 32 86 52 Q76 68 58 66 Q50 66 46 60Z" fill="${c.tan}"/>
    <ellipse cx="62" cy="26" rx="8" ry="4.5" transform="rotate(-20 62 26)" fill="${c.hi}" stroke="none"/>`,
  rice: (c, l) => `
    <path d="M20 48 Q22 22 50 22 Q78 22 80 48Z" fill="${c.white}"/>
    <path d="M38 32 L42 30 M54 28 L58 30 M46 40 L50 38 M62 38 L66 40" stroke-width="3" stroke="${l}"/>
    <path d="M10 48 H90 Q88 86 50 88 Q12 86 10 48Z" fill="${c.blue}"/>
    <circle cx="30" cy="64" r="3" fill="${c.hi}" stroke="none"/><circle cx="50" cy="70" r="3" fill="${c.hi}" stroke="none"/><circle cx="70" cy="64" r="3" fill="${c.hi}" stroke="none"/>`,
  "burger-bun": (c, l) => `
    <path d="M12 68 H88 Q88 84 76 84 H24 Q12 84 12 68Z" fill="${c.gold}"/>
    <path d="M10 62 Q12 24 50 24 Q88 24 90 62Z" fill="${c.gold}"/>
    ${[
      [36, 40],
      [52, 34],
      [66, 44],
      [46, 48],
    ]
      .map(
        ([x, y]) =>
          `<ellipse cx="${x}" cy="${y}" rx="3" ry="2" fill="${c.hi}" stroke-width="2" stroke="${l}"/>`,
      )
      .join("")}`,
  steak: (c, l) => `
    <path d="M16 50 Q16 22 46 22 Q72 18 86 38 Q96 60 80 76 Q62 90 38 84 Q14 78 16 50Z" fill="${c.cream}"/>
    <path d="M24 50 Q24 30 47 30 Q68 27 79 42 Q87 59 74 70 Q59 81 40 76 Q22 71 24 50Z" fill="${c.steak}" stroke-width="3.5" stroke="${l}"/>
    <circle cx="62" cy="52" r="9" fill="${c.cream}" stroke-width="3.5" stroke="${l}"/>
    <path d="M34 44 Q40 40 44 46 M40 62 Q46 58 50 64" stroke="${c.hi}" stroke-width="3"/>`,
};

// New ingredients: simple placeholders (shape area y≈6–72, label pill below).
const PLACEHOLDER_ART = {
  lettuce: (c, l) => `
    <path d="M50 8 Q70 6 78 22 Q92 28 86 44 Q90 60 72 66 Q60 74 50 68 Q40 74 28 66 Q10 60 14 44 Q8 28 22 22 Q30 6 50 8Z" fill="${c.green}"/>
    <path d="M50 20 L50 58 M50 36 L36 26 M50 44 L64 32" stroke="${l}" stroke-width="3"/>
    <ellipse cx="30" cy="30" rx="6" ry="3.5" transform="rotate(-35 30 30)" fill="${c.hi}" stroke="none"/>`,
  broccoli: (c) => `
    <path d="M42 46 L39 70 Q50 75 61 70 L58 46Z" fill="${c.lime}"/>
    <circle cx="33" cy="36" r="15" fill="${c.dkgreen}"/>
    <circle cx="67" cy="36" r="15" fill="${c.dkgreen}"/>
    <circle cx="50" cy="24" r="17" fill="${c.dkgreen}"/>
    <circle cx="50" cy="42" r="13" fill="${c.dkgreen}"/>
    <circle cx="43" cy="18" r="3.5" fill="${c.hi}" stroke="none"/>`,
  celery: (c) => `
    <circle cx="36" cy="14" r="7" fill="${c.green}"/><circle cx="50" cy="9" r="7" fill="${c.green}"/><circle cx="64" cy="15" r="7" fill="${c.green}"/>
    <rect x="30" y="18" width="12" height="54" rx="6" fill="${c.lime}"/>
    <rect x="44" y="14" width="12" height="58" rx="6" fill="${c.lime}"/>
    <rect x="58" y="20" width="12" height="52" rx="6" fill="${c.lime}"/>`,
  potato: (c, l) => `
    <path d="M16 42 Q14 16 44 14 Q78 10 86 34 Q92 60 64 68 Q36 74 22 62 Q16 54 16 42Z" fill="${c.tan}"/>
    <circle cx="36" cy="34" r="2.6" fill="${l}" stroke="none"/><circle cx="60" cy="28" r="2.6" fill="${l}" stroke="none"/><circle cx="66" cy="52" r="2.6" fill="${l}" stroke="none"/>
    <ellipse cx="30" cy="24" rx="7" ry="4" transform="rotate(-20 30 24)" fill="${c.hi}" stroke="none"/>`,
  avocado: (c) => `
    <path d="M50 6 Q66 6 70 28 Q84 54 66 68 Q50 78 34 68 Q16 54 30 28 Q34 6 50 6Z" fill="${c.dkgreen}"/>
    <path d="M50 16 Q60 16 62 32 Q74 52 60 62 Q50 68 40 62 Q26 52 38 32 Q40 16 50 16Z" fill="${c.lime}" stroke-width="3"/>
    <circle cx="50" cy="48" r="10" fill="${c.brown}"/>
    <circle cx="46" cy="45" r="3" fill="${c.hi}" stroke="none"/>`,
  "ground-beef": (c) => `
    <rect x="10" y="40" width="80" height="30" rx="10" fill="${c.skyLt}"/>
    <path d="M20 50 Q22 18 50 18 Q78 18 80 50Z" fill="${c.bacon}"/>
    <circle cx="36" cy="36" r="2.5" fill="${c.hi}" stroke="none"/><circle cx="52" cy="28" r="2.5" fill="${c.hi}" stroke="none"/><circle cx="64" cy="40" r="2.5" fill="${c.hi}" stroke="none"/><circle cx="46" cy="42" r="2.5" fill="${c.hi}" stroke="none"/>`,
  tortilla: (c, l) => `
    <circle cx="50" cy="38" r="32" fill="${c.cream}"/>
    <circle cx="36" cy="28" r="4" fill="${c.gold}" stroke-width="2.5" stroke="${l}"/><circle cx="62" cy="24" r="3" fill="${c.gold}" stroke-width="2.5" stroke="${l}"/>
    <circle cx="58" cy="50" r="4" fill="${c.gold}" stroke-width="2.5" stroke="${l}"/><circle cx="38" cy="50" r="3" fill="${c.gold}" stroke-width="2.5" stroke="${l}"/>`,
  pasta: (c, l) => `
    <rect x="30" y="8" width="40" height="64" rx="8" fill="${c.blue}"/>
    <rect x="37" y="18" width="26" height="38" rx="5" fill="${c.cheeseTop}"/>
    <path d="M42 20 L42 54 M47 20 L47 54 M52 20 L52 54 M57 20 L57 54" stroke="${l}" stroke-width="2.5"/>`,
  "soy-sauce": (c) => `
    <rect x="42" y="4" width="16" height="16" rx="4" fill="${c.red}"/>
    <path d="M40 20 L60 20 L68 34 L68 68 Q68 72 64 72 L36 72 Q32 72 32 68 L32 34Z" fill="${c.soy}"/>
    <rect x="37" y="40" width="26" height="18" rx="3" fill="${c.white}"/>
    <path d="M42 49 L58 49" stroke="${c.red}" stroke-width="4"/>`,
};

const svg = (viewBox, body, ink) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="${ink}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${body}\n</svg>\n`;

function labelPill(text) {
  return `
    <rect x="8" y="78" width="84" height="20" rx="10" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/>
    <text x="50" y="93" font-family="${FONT}" font-weight="900" font-size="12.5" letter-spacing="0.5" fill="${INK}" stroke="none" text-anchor="middle">${text}</text>`;
}

let written = 0;
const write = (name, content) => {
  writeFileSync(join(outDir, name), content);
  written++;
};

for (const ing of menu.ingredients) {
  const design = DESIGN_ART[ing.id];
  const placeholder = PLACEHOLDER_ART[ing.id];
  if (!design && !placeholder)
    throw new Error(`No art for ingredient "${ing.id}"`);

  for (const silhouette of [false, true]) {
    const { c, line } = paletteFor(silhouette);
    let body;
    if (design) {
      body = design(c, line);
    } else if (silhouette) {
      // No label on silhouettes (it would give Blackout away); recentre the shape instead.
      body = `<g transform="translate(0 12)">${placeholder(c, line)}</g>`;
    } else {
      body = placeholder(c, line) + labelPill(ing.label);
    }
    write(
      `ingredient-${ing.id}${silhouette ? "-silhouette" : ""}.svg`,
      svg("-6 -6 112 112", body, INK),
    );
  }
}

// ---- Dishes: top-down on a plate or bowl, 0–120 box. ----
const P = PALETTE;
const plate = `
  <circle cx="60" cy="60" r="54" fill="#FFFFFF"/>
  <circle cx="60" cy="60" r="43" fill="#F2F4FF" stroke="#D5E0F2" stroke-width="3"/>`;
const bowl = (fill) => `
  <circle cx="60" cy="60" r="54" fill="${P.blue}"/>
  <circle cx="60" cy="60" r="42" fill="${fill}"/>
  <circle cx="24" cy="42" r="3" fill="#FFFFFF" stroke="none"/><circle cx="20" cy="60" r="3" fill="#FFFFFF" stroke="none"/><circle cx="24" cy="78" r="3" fill="#FFFFFF" stroke="none"/>`;
const bits = (list) =>
  list
    .map(
      ([x, y, r, fill]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke-width="3"/>`,
    )
    .join("");

const DISHES = {
  spaghetti: `${plate}
    <g stroke-width="9"><ellipse cx="60" cy="62" rx="36" ry="30"/><ellipse cx="58" cy="60" rx="24" ry="33" transform="rotate(30 58 60)"/><ellipse cx="62" cy="58" rx="21" ry="17"/></g>
    <g stroke="${P.gold}" stroke-width="4.5"><ellipse cx="60" cy="62" rx="36" ry="30"/><ellipse cx="58" cy="60" rx="24" ry="33" transform="rotate(30 58 60)"/><ellipse cx="62" cy="58" rx="21" ry="17"/></g>
    <path d="M44 50 Q50 38 64 42 Q78 44 79 56 Q80 72 64 75 Q48 78 43 66 Q40 57 44 50Z" fill="${P.red}" stroke-width="3.5"/>
    ${bits([
      [52, 52, 7.5, P.brown],
      [70, 50, 7, P.brown],
      [61, 67, 7.5, P.brown],
    ])}`,
  cheeseburger: `${plate}
    <path d="M26 72 H94 Q94 84 84 84 H36 Q26 84 26 72Z" fill="${P.gold}"/>
    <path d="M24 66 Q34 60 42 66 Q50 60 58 66 Q66 60 74 66 Q82 60 96 66 L96 72 H24Z" fill="${P.green}" stroke-width="3.5"/>
    <rect x="24" y="56" width="72" height="12" rx="6" fill="${P.brown}" stroke-width="3.5"/>
    <path d="M26 56 L94 56 L84 64 L72 58 L58 66 L44 58 L32 63Z" fill="${P.cheese}" stroke-width="3.5"/>
    <path d="M24 54 Q26 26 60 26 Q94 26 96 54Z" fill="${P.gold}"/>
    ${[
      [46, 38],
      [60, 33],
      [74, 40],
      [56, 45],
    ]
      .map(
        ([x, y]) =>
          `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.8" fill="#FFFFFF" stroke-width="1.8"/>`,
      )
      .join("")}`,
  pancakes: `${plate}
    <ellipse cx="60" cy="74" rx="36" ry="13" fill="${P.tan}"/>
    <ellipse cx="60" cy="64" rx="36" ry="13" fill="${P.tan}"/>
    <ellipse cx="60" cy="54" rx="36" ry="13" fill="${P.gold}"/>
    <path d="M28 54 Q34 64 44 58 Q52 66 62 58 Q72 66 80 58 Q88 62 92 54" fill="none" stroke="${P.brown}" stroke-width="4"/>
    <path d="M50 44 L66 40 L74 48 L58 52Z" fill="${P.butter}" stroke-width="3.5"/>`,
  tacos: `${plate}
    <path d="M18 70 Q18 38 50 38 Q66 38 72 50" fill="${P.cream}"/>
    <path d="M22 62 Q28 46 44 44" fill="none" stroke="${P.green}" stroke-width="6"/>
    ${bits([
      [34, 54, 4, P.red],
      [46, 50, 4, P.red],
    ])}
    <path d="M48 82 Q48 50 80 50 Q102 50 102 72" fill="${P.cream}"/>
    <path d="M54 74 Q60 58 76 56" fill="none" stroke="${P.green}" stroke-width="6"/>
    ${bits([
      [66, 64, 4, P.red],
      [80, 60, 4, P.bacon],
      [72, 70, 4, P.bacon],
    ])}
    <path d="M18 70 H72 M48 82 H102"/>`,
  "stir-fry": `${bowl("#FFFFFF")}
    ${bits([
      [46, 48, 9, P.dkgreen],
      [72, 56, 9, P.dkgreen],
      [56, 74, 8, P.dkgreen],
    ])}
    ${bits([
      [64, 42, 6, P.orange],
      [42, 70, 6, P.orange],
      [76, 74, 5, P.orange],
    ])}
    <path d="M52 58 L64 62 M44 60 L50 66 M70 66 L78 64" stroke="${P.red}" stroke-width="5"/>`,
  omelette: `${plate}
    <path d="M22 70 Q22 30 60 30 Q98 30 98 70Z" fill="${P.cheeseTop}"/>
    ${bits([
      [46, 52, 4, P.red],
      [64, 46, 4, P.red],
      [76, 58, 4, P.red],
      [56, 60, 3.5, P.gold],
      [38, 62, 3.5, P.gold],
    ])}
    <path d="M30 70 Q60 62 90 70" fill="none" stroke="${P.cheese}" stroke-width="4"/>`,
  "fried-rice": `${bowl("#FFFFFF")}
    ${[
      [44, 44],
      [60, 40],
      [74, 50],
      [50, 60],
      [66, 64],
      [44, 74],
      [76, 72],
      [58, 78],
    ]
      .map(
        ([x, y]) =>
          `<path d="M${x - 3} ${y} L${x + 3} ${y - 1}" stroke-width="3"/>`,
      )
      .join("")}
    ${bits([
      [52, 50, 4.5, P.orange],
      [70, 60, 4.5, P.orange],
      [46, 66, 4, P.green],
      [62, 72, 4, P.green],
      [66, 46, 5, P.cheese],
      [40, 56, 4.5, P.cheese],
    ])}`,
  "chicken-soup": `${bowl(P.cheeseTop)}
    ${bits([
      [48, 48, 6, P.orange],
      [72, 64, 6, P.orange],
      [52, 74, 5.5, P.orange],
    ])}
    <rect x="60" y="40" width="12" height="11" rx="3" fill="${P.tan}" stroke-width="3"/><rect x="40" y="60" width="12" height="11" rx="3" fill="${P.tan}" stroke-width="3"/>
    ${bits([
      [62, 56, 3.5, P.lime],
      [72, 48, 3.5, P.lime],
      [46, 58, 3.5, P.lime],
    ])}`,
  "steak-potatoes": `${plate}
    <path d="M22 58 Q22 34 50 34 Q72 32 80 50 Q86 68 70 78 Q52 88 36 80 Q20 72 22 58Z" fill="${P.cream}"/>
    <path d="M28 58 Q28 40 50 40 Q68 38 74 52 Q78 66 66 72 Q52 80 40 74 Q28 68 28 58Z" fill="${P.steak}" stroke-width="3.5"/>
    <path d="M40 52 L60 64 M46 46 L66 58" stroke="${P.brown}" stroke-width="3.5"/>
    <path d="M78 76 Q90 62 100 72 Q96 88 84 88Z" fill="${P.tan}" stroke-width="3.5"/>
    <path d="M70 90 Q78 80 90 88 Q84 100 74 98Z" fill="${P.tan}" stroke-width="3.5"/>
    <path d="M62 30 L74 27 L78 35 L66 38Z" fill="${P.butter}" stroke-width="3"/>`,
  guacamole: `
    <circle cx="60" cy="60" r="54" fill="${P.gold}"/>
    <circle cx="60" cy="60" r="42" fill="${P.lime}"/>
    <path d="M36 52 Q48 44 58 52 Q70 42 82 54 M40 70 Q52 62 64 70 Q74 64 84 70" fill="none" stroke="${P.dkgreen}" stroke-width="3.5"/>
    ${bits([
      [50, 60, 4, P.red],
      [68, 58, 4, P.red],
      [58, 76, 4, P.red],
      [44, 44, 3.5, "#FFFFFF"],
      [74, 72, 3.5, "#FFFFFF"],
    ])}
    <path d="M86 26 A18 18 0 0 1 104 44 L86 44Z" fill="${P.lime}" stroke-width="3.5"/>`,
};

for (const recipe of menu.recipes) {
  const body = DISHES[recipe.id];
  if (!body) throw new Error(`No dish art for recipe "${recipe.id}"`);
  write(`dish-${recipe.id}.svg`, svg("-4 -4 128 128", body, INK));
}

console.log(`Wrote ${written} files to ${outDir}`);
