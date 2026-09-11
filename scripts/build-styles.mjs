import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { compile } from "sass";

mkdirSync("dist", { recursive: true });
writeFileSync("dist/afterglow.css", compile("src/styles/afterglow.scss").css);
cpSync("src/styles/assets", "dist/assets", { recursive: true });
