import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Deploy no GitHub Pages fica em ricardosaudade.github.io/massarocario, entao o build precisa desse base path.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/massarocario/' : '/',
  plugins: [react(), tailwindcss()],
}))

