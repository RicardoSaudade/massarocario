// Resolve um caminho de asset publico considerando o base path do deploy (ex: subpasta do GitHub Pages).
export function publicAsset(path: string) {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  return `${base}${path.replace(/^\//, '')}`
}
