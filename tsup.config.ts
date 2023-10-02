import fsp from "node:fs/promises";
import path from "node:path";

import { defineConfig } from "tsup";

export default defineConfig({
    format: ["cjs", "esm"], // generate cjs and esm files
    entry: ["src/index.ts"],
    clean: true, // rimraf dis
    dts: true, // generate dts file for main module
    skipNodeModulesBundle: true,
    splitting: true,
    target: "es2017",
    cjsInterop: true,
});
