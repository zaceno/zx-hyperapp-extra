import { readdirSync } from "node:fs"
import { resolve, relative, sep } from "node:path"
import { defineConfig } from "vite"

const sourceRoot = resolve("src")

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.isFile() &&
      /\.ts$/.test(entry.name) &&
      !/\.(?:d|test|spec)\.ts$/.test(entry.name)
      ? [path]
      : []
  })
}

const entry = Object.fromEntries(
  sourceFiles(sourceRoot).map(file => [
    relative(sourceRoot, file).slice(0, -3).split(sep).join("/"),
    file,
  ]),
)

export default defineConfig({
  build: {
    lib: { entry, formats: ["es"] },
    minify: true,
    sourcemap: true,
    rollupOptions: {
      external: ["hyperapp"],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "_chunks/[name]-[hash].js",
      },
    },
  },
})
