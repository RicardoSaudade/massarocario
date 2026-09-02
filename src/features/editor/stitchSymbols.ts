export type StitchSymbol = {
  key: string
  abbreviationPtBr: string
  abbreviationEn: string
  name: string
  description: string
  icon: string
}

// Mesmo catalogo de pontos do servidor MCP (massarocario-mcp/knowledge/symbols.json), duplicado aqui para uso no app.
export const stitchSymbols: StitchSymbol[] = [
  { key: 'chainStitch', abbreviationPtBr: 'corr', abbreviationEn: 'ch', name: 'Corrente', description: 'Ponto base usado para iniciar a maioria dos trabalhos de croche.', icon: '/assets/symbols/chain.svg' },
  { key: 'slipStitch', abbreviationPtBr: 'pd', abbreviationEn: 'sl st', name: 'Ponto deslizado', description: 'Usado para unir carreiras ou fechar circulos. Nao adiciona altura.', icon: '/assets/symbols/slip-stitch.svg' },
  { key: 'singleCrochet', abbreviationPtBr: 'pb', abbreviationEn: 'sc', name: 'Ponto baixo', description: 'Ponto curto e denso, base dos graficos filet e pixel.', icon: '/assets/symbols/single-crochet.svg' },
  { key: 'halfDoubleCrochet', abbreviationPtBr: 'mpa', abbreviationEn: 'hdc', name: 'Meio ponto alto', description: 'Altura intermediaria entre ponto baixo e ponto alto.', icon: '/assets/symbols/half-double-crochet.svg' },
  { key: 'doubleCrochet', abbreviationPtBr: 'pa', abbreviationEn: 'dc', name: 'Ponto alto', description: 'Ponto mais alto e vazado, usado em blocos e espacos do filet.', icon: '/assets/symbols/double-crochet.svg' },
  { key: 'trebleCrochet', abbreviationPtBr: 'pad', abbreviationEn: 'tr', name: 'Ponto alto duplo', description: 'Ainda mais alto, usado em texturas com relevo forte.', icon: '/assets/symbols/treble-crochet.svg' },
  { key: 'increase', abbreviationPtBr: 'aum', abbreviationEn: 'inc', name: 'Aumento', description: 'Dois ou mais pontos no mesmo lugar da carreira anterior.', icon: '/assets/symbols/increase.svg' },
  { key: 'decrease', abbreviationPtBr: 'dim', abbreviationEn: 'dec', name: 'Diminuicao', description: 'Dois ou mais pontos unidos em um so.', icon: '/assets/symbols/decrease.svg' },
  { key: 'frontPostDoubleCrochet', abbreviationPtBr: 'prf', abbreviationEn: 'FPdc', name: 'Ponto relevo frente', description: 'Ponto alto ao redor da haste, pela frente do trabalho.', icon: '/assets/symbols/front-post-dc.svg' },
  { key: 'backPostDoubleCrochet', abbreviationPtBr: 'pra', abbreviationEn: 'BPdc', name: 'Ponto relevo atras', description: 'Ponto alto ao redor da haste, por tras do trabalho.', icon: '/assets/symbols/back-post-dc.svg' },
  { key: 'bobbleStitch', abbreviationPtBr: 'bola', abbreviationEn: 'bobble', name: 'Ponto bola / popcorn', description: 'Grupo de pontos altos fechados juntos, formando relevo.', icon: '/assets/symbols/bobble.svg' },
  { key: 'picot', abbreviationPtBr: 'picot', abbreviationEn: 'picot', name: 'Picot', description: 'Pequena correntinha fechada, usada como acabamento decorativo.', icon: '/assets/symbols/picot.svg' },
  { key: 'magicRing', abbreviationPtBr: 'anel magico', abbreviationEn: 'magic ring', name: 'Anel magico', description: 'Inicio ajustavel para trabalhos em espiral, sem buraco no centro.', icon: '/assets/symbols/magic-ring.svg' },
  { key: 'tunisianSimpleStitch', abbreviationPtBr: 'pst', abbreviationEn: 'Tss', name: 'Ponto simples tunisiano', description: 'Ponto basico do croche tunisiano.', icon: '/assets/symbols/tunisian-simple.svg' },
  { key: 'tunisianKnitStitch', abbreviationPtBr: 'pkt', abbreviationEn: 'Tks', name: 'Ponto knit tunisiano', description: 'Imita a textura da trico, entrando entre as fitas verticais.', icon: '/assets/symbols/tunisian-knit.svg' },
  { key: 'tunisianPurlStitch', abbreviationPtBr: 'ppt', abbreviationEn: 'Tps', name: 'Ponto purl tunisiano', description: 'Cria textura tipo trico purl.', icon: '/assets/symbols/tunisian-purl.svg' },
]
