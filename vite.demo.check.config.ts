import { defineConfig } from "vite"
import hyperapp from "vite-plugin-hyperapp"

export default defineConfig({
  root: "demo",
  server: { port: 5200, strictPort: true },
  plugins: [hyperapp()],
})
