import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/games/crash-thief",
  server: {
    port: 3000,
    open: true,
  },
  plugins: [tailwindcss()],
});
