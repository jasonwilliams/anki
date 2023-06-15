const production = process.argv[2] === "--production";
import esbuild from "esbuild";
import { copy } from "esbuild-plugin-copy";
import { sassPlugin } from "esbuild-sass-plugin";

const watch = process.argv[2] === "--watch";
const context = await esbuild
  .context({
    entryPoints: ["./src/extension.ts"],
    bundle: true,
    outdir: "out",
    external: ["vscode"],
    format: "cjs",
    sourcemap: !production,
    minify: production,
    platform: "node",
    target: "ES2021",
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
      {
        name: "watch",
        setup(build) {
          build.onEnd(() => {
            console.log("build finished");
          });
          build.onStart(() => {
            console.log("building");
          });
        },
      },
    ],
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

if (watch) {
  await context.watch();
} else {
  context.rebuild();
  context.dispose();
}
