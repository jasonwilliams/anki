const production = process.argv[2] === "--production";
const watch = process.argv[2] === "--watch";
const { copy } = require("esbuild-plugin-copy");
const { sassPlugin } = require("esbuild-sass-plugin");

require("esbuild")
  .build({
    entryPoints: ["./src/extension.ts"],
    bundle: true,
    outdir: "out",
    external: ["vscode"],
    format: "cjs",
    sourcemap: !production,
    minify: production,
    platform: "node",
    plugins: [
      copy({
        resolveFrom: "cwd",
        assets: {
          from: ["./src/resources/icons/**/*.svg"],
          to: ["./out/resources/icons/"],
        },
        keepStructure: true,
        verbose: false,
      }),
      sassPlugin(),
    ],
    watch: watch && {
      onRebuild(error) {
        if (error) console.error("watch build failed:", error);
        else console.log("watch build succeeded");
      },
    },
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
