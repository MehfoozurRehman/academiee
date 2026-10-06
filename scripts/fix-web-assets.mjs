// Vercel never uploads folders named node_modules (or dot-folders like
// .pnpm), but Expo's web export puts fonts and icon files under
// dist/assets/node_modules/.pnpm/…/node_modules/… — so they 404 once
// deployed. Flatten every such asset into dist/assets/f/ (file names already
// carry a content hash) and rewrite the references in the bundle.
import fs from "fs";
import path from "path";

const dist = path.resolve(process.argv[2] ?? "dist");
const nested = path.join(dist, "assets", "node_modules");
const flat = path.join(dist, "assets", "f");

const moves = new Map(); // "/assets/node_modules/…/x.ttf" -> "/assets/f/x.ttf"
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(p);
    else {
      const rel = "/" + path.relative(dist, p).split(path.sep).join("/");
      moves.set(rel, `/assets/f/${entry.name}`);
    }
  }
}

if (fs.existsSync(nested)) {
  collect(nested);
  fs.mkdirSync(flat, { recursive: true });
  for (const [from, to] of moves) fs.renameSync(path.join(dist, from), path.join(dist, to));
  fs.rmSync(nested, { recursive: true, force: true });
}

// References may be URL-encoded (e.g. "@" as %40, "+" as %2B) in some places.
const variants = [...moves].flatMap(([from, to]) => [
  [from, to],
  [encodeURI(from), to],
]);

let patched = 0;
function rewrite(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) rewrite(p);
    else if (/\.(js|html|css|json)$/.test(entry.name)) {
      let text = fs.readFileSync(p, "utf8");
      const before = text;
      for (const [from, to] of variants) text = text.replaceAll(from, to);
      if (text !== before) {
        fs.writeFileSync(p, text);
        patched++;
      }
    }
  }
}
rewrite(dist);

const leftover = fs.readdirSync(path.join(dist, "_expo"), { recursive: true })
  .filter((f) => /\.js$/.test(f))
  .some((f) => fs.readFileSync(path.join(dist, "_expo", f), "utf8").includes("/assets/node_modules/"));

fs.copyFileSync(path.resolve("vercel.json"), path.join(dist, "vercel.json"));
console.log(`fix-web-assets: moved ${moves.size} assets, patched ${patched} files${leftover ? " — WARNING: references remain" : ""}`);
