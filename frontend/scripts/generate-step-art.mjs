// Builds placeholder art for recipe stages: a station (board, bowl, pan, pot,
// plate) with the ingredients that stage uses, drawn where the gestures are.
// Reads the team's recipes (backend/src/data/recipes.json) and our step table
// (src/data/recipe-steps.json). Run: node scripts/generate-step-art.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const recipes = readJson(join(root, "../backend/src/data/recipes.json"));
const teamIngredients = readJson(join(root, "src/data/ingredients.json"));
const menu = readJson(join(root, "src/data/menu.json"));
const steps = readJson(join(root, "src/data/recipe-steps.json"));
const assets = join(root, "public/assets");
const outDir = join(assets, "steps");

// GestureRecipe fills its container (the 210px gesture area on the phone) and
// draws the background across it; gestures use 0–200px, centred on (100, 100).
const BOX = 210;
const CX = 100;
const CY = 100;

// Same matching as src/data/menu.ts and recipe-steps.ts.
const nameKey = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/(es|s)$/, "");
const menuIdByName = new Map(
  menu.ingredients.map((i) => [nameKey(i.name), i.id]),
);
const recipeKey = (name) => name.toLowerCase().replace(/[^a-z]/g, "");

function stationFor(recipeName, index, stage) {
  const table = steps[recipeKey(recipeName)];
  if (table?.[index]) return table[index].station;
  if (stage.type === "spin") return "bowl";
  const [line] = stage.lines ?? [];
  const upward =
    stage.lines?.length === 1 &&
    line.start.y > line.end.y &&
    Math.abs(line.end.x - line.start.x) < Math.abs(line.end.y - line.start.y);
  return upward ? "pan" : "board";
}

function consumedArt(stage) {
  return Object.entries(stage.ingredientsConsumed ?? {})
    .filter(([, count]) => count > 0)
    .map(([id]) => teamIngredients.find((i) => i.id === Number(id)))
    .map((ing) => (ing ? menuIdByName.get(nameKey(ing.name)) : undefined))
    .filter(Boolean)
    .slice(0, 2);
}

const STATIONS = {
  board: [
    `<rect x="10" y="24" width="180" height="152" rx="26" fill="#7A4E1E" opacity=".16" transform="translate(4 7)"/>`,
    `<rect x="10" y="24" width="180" height="152" rx="26" fill="#EDB978"/>`,
    `<path d="M30 62 H170 M26 100 H174 M30 138 H170" stroke="#B27440" stroke-opacity=".28" stroke-width="5" stroke-linecap="round"/>`,
    `<circle cx="168" cy="44" r="8" fill="#FCEBC7"/>`,
  ],
  bowl: [
    `<circle cx="${CX + 4}" cy="${CY + 7}" r="94" fill="#7A4E1E" opacity=".16"/>`,
    `<circle cx="${CX}" cy="${CY}" r="94" fill="#127C78"/>`,
    `<circle cx="${CX}" cy="${CY}" r="80" fill="#FFF6E3"/>`,
    `<path d="M${CX - 58} ${CY - 30} A70 70 0 0 1 ${CX - 10} ${CY - 70}" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none" opacity=".8"/>`,
  ],
  pan: [
    `<rect x="176" y="${CY - 10}" width="60" height="20" rx="10" fill="#6E4E33"/>`,
    `<circle cx="${CX + 4}" cy="${CY + 7}" r="92" fill="#7A4E1E" opacity=".16"/>`,
    `<circle cx="${CX}" cy="${CY}" r="92" fill="#8A6445"/>`,
    `<circle cx="${CX}" cy="${CY}" r="78" fill="#C9B29A"/>`,
  ],
  pot: [
    `<rect x="-8" y="${CY - 12}" width="30" height="24" rx="12" fill="#B8321E"/>`,
    `<rect x="178" y="${CY - 12}" width="30" height="24" rx="12" fill="#B8321E"/>`,
    `<circle cx="${CX + 4}" cy="${CY + 7}" r="92" fill="#7A4E1E" opacity=".16"/>`,
    `<circle cx="${CX}" cy="${CY}" r="92" fill="#EF4128"/>`,
    `<circle cx="${CX}" cy="${CY}" r="78" fill="#F6DDB0"/>`,
  ],
  plate: [
    `<circle cx="${CX + 4}" cy="${CY + 7}" r="94" fill="#7A4E1E" opacity=".16"/>`,
    `<circle cx="${CX}" cy="${CY}" r="94" fill="#FFF6E3"/>`,
    `<circle cx="${CX}" cy="${CY}" r="68" fill="#F8E6C4"/>`,
  ],
};

/** An ingredient's own SVG, nested at (x, y) and size. */
function nestedIngredient(id, x, y, size) {
  const src = readFileSync(join(assets, `ingredient-${id}.svg`), "utf8");
  const open = src.match(/<svg\b([^>]*)>/);
  const close = src.lastIndexOf("</svg>");
  if (!open || close < 0) throw new Error(`Unreadable ingredient art: ${id}`);
  const attrs = open[1]
    .replace(/\s(xmlns|width|height|x|y)="[^"]*"/g, "")
    .trim();
  const inner = src.slice(open.index + open[0].length, close);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" ${attrs}>${inner}</svg>`;
}

function scene(station, art) {
  const parts = [...STATIONS[station]];
  if (art.length === 1)
    parts.push(nestedIngredient(art[0], CX - 50, CY - 50, 100));
  if (art.length === 2) {
    parts.push(nestedIngredient(art[0], CX - 86, CY - 42, 84));
    parts.push(nestedIngredient(art[1], CX + 2, CY - 42, 84));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX} ${BOX}" width="${BOX}" height="${BOX}">${parts.join("")}</svg>\n`;
}

// Shown when a stage is finished and there's no next picture. GestureRecipe
// draws stage pictures over the 0–200px gesture space, so the burst is centred there.
function done() {
  const size = 200;
  const c = { x: CX, y: CY };
  const star = (x, y, r, fill) => {
    const k = r * 0.42;
    return `<path d="M${x} ${y - r} Q${x + k * 0.35} ${y - k * 0.35} ${x + r} ${y} Q${x + k * 0.35} ${y + k * 0.35} ${x} ${y + r} Q${x - k * 0.35} ${y + k * 0.35} ${x - r} ${y} Q${x - k * 0.35} ${y - k * 0.35} ${x} ${y - r}Z" fill="${fill}"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${[
    star(c.x - 58, c.y - 44, 20, "#FFC20E"),
    star(c.x + 60, c.y - 50, 16, "#F07F22"),
    star(c.x + 54, c.y + 52, 22, "#FFC20E"),
    star(c.x - 52, c.y + 50, 14, "#2FA84F"),
  ].join("")}</svg>\n`;
}

mkdirSync(outDir, { recursive: true });
const written = new Set();
const write = (name, svg) => {
  writeFileSync(join(outDir, name), svg);
  written.add(name);
};

for (const recipe of recipes) {
  recipe.stages.forEach((stage, i) => {
    const station = stationFor(recipe.name, i, stage);
    const art = consumedArt(stage).filter((id) =>
      existsSync(join(assets, `ingredient-${id}.svg`)),
    );
    const name = `${[station, ...art].join("-")}.svg`;
    if (!written.has(name)) write(name, scene(station, art));
  });
}
for (const station of Object.keys(STATIONS)) {
  const name = `${station}.svg`;
  if (!written.has(name)) write(name, scene(station, []));
}
write("done.svg", done());

console.log(`Wrote ${written.size} files to public/assets/steps:`);
console.log([...written].sort().join("\n"));
