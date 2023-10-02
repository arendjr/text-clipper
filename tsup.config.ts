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
    async onSuccess() {
        const file = path.join(__dirname, './dist/index.js');
        let code = await fsp.readFile(file, "utf8");
        code = code.replace("exports.default =", "module.exports =");
        code += "exports.default = module.exports;";
        fsp.writeFile(file, code);
    },
});
