import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/**
 * One entry point: the sidebar panel, served by the integration from
 * custom_components/s3_files/www/ and registered with panel_custom.
 *
 * The output path is committed — the integration serves the built file, and CI
 * checks that the committed bundle matches a fresh build.
 */
export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/s3-files-panel.ts", import.meta.url)),
      formats: ["es"],
      fileName: () => "s3-files-panel.js",
    },
    outDir: fileURLToPath(
      new URL("../custom_components/s3_files/www", import.meta.url),
    ),
    emptyOutDir: true,
    target: "es2020",
    minify: true,
    sourcemap: false,
  },
});
