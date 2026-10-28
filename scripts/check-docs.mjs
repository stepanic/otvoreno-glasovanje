// Provjera dokumentacije bez ovisnosti:
// 1. svaka relativna poveznica u .md vodi na postojeću datoteku;
// 2. TODO.md ima točno jednu fazu u tijeku (▶) i svaka faza ima handoff kad je počela.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const skip = new Set(["node_modules", ".git", "artifacts", "cache", "coverage", "dist"]);
const errors = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".md")) checkLinks(p);
  }
}

function checkLinks(file) {
  const text = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = resolve(dirname(file), decodeURI(target.split("#")[0]));
    if (!existsSync(path)) errors.push(`${file.slice(root.length + 1)}: ne postoji ${target}`);
  }
}

function checkTodo() {
  const todo = readFileSync(join(root, "TODO.md"), "utf8");
  const phases = [...todo.matchAll(/^## (✅|▶|⬜) F(\d+)/gm)];
  const active = phases.filter((p) => p[1] === "▶");
  if (active.length !== 1) errors.push(`TODO.md: u tijeku mora biti točno jedna faza, a ima ${active.length}`);
  for (const [, mark, n] of phases) {
    if (mark === "⬜") continue;
    const id = `F${n.padStart(2, "0")}`;
    const has = readdirSync(join(root, "docs/handoff")).some((f) => f.startsWith(id));
    if (!has) errors.push(`TODO.md: ${id} je počela, a nema docs/handoff/${id}-*.md`);
  }
}

walk(root);
checkTodo();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("docs: u redu");
