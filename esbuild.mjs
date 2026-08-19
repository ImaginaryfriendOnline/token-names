import { context } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

const watch = process.argv.includes("--watch");
const outdir = "dist";

async function copyStaticAssets() {
    await mkdir(outdir, { recursive: true });
    await Promise.all([
        cp("module.json", `${outdir}/module.json`),
        cp("lang", `${outdir}/lang`, { recursive: true }),
        cp("styles", `${outdir}/styles`, { recursive: true }),
        cp("LICENSE", `${outdir}/LICENSE`),
        cp("README.md", `${outdir}/README.md`)
    ]);
}

async function build() {
    await rm(outdir, { recursive: true, force: true });

    const ctx = await context({
        entryPoints: { "scripts/main": "src/main.ts" },
        bundle: true,
        format: "esm",
        platform: "browser",
        target: "es2022",
        sourcemap: true,
        outdir,
        logLevel: "info"
    });

    await copyStaticAssets();

    if (watch) {
        await ctx.watch();
        console.log("[token-names] watching for changes...");
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

build().catch((error) => {
    console.error(error);
    process.exit(1);
});
