// GitHub Pages nao tem rota de servidor: copiar o index.html para 404.html permite que rotas do React Router funcionem em recarregamentos diretos.
import { copyFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')

copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'))
