import { defineConfig } from "vite"
import hyperapp from "vite-plugin-hyperapp"

export default defineConfig({
  root: "demo",
  server: { open: true },
  plugins: [hyperapp()],
})
