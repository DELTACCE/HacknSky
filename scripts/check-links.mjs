// Checks that every local href/src in the built pages points at a file that exists.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
const root = resolve(dirname(new URL(import.meta.url).pathname), "..", "public"); let bad = 0;
const walk = (d) => readdirSync(d).flatMap((f) => (["node_modules", "vendor", ".git"].includes(f) ? [] : statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
for (const f of walk(root).filter((f) => f.endsWith(".html"))) {
  for (const m of readFileSync(f, "utf8").matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)) {
    const u = m[1]; if (/^(https?:|mailto:|data:|tel:|\/\/)/.test(u)) continue;
    let p = u.startsWith("/") ? join(root, u) : join(dirname(f), u); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
    if (!existsSync(p)) { bad++; console.log("broken:", f.replace(root, ""), "→", u); }
  }
}
console.log(bad ? `${bad} broken link(s)` : "links ok"); process.exit(bad ? 1 : 0);
