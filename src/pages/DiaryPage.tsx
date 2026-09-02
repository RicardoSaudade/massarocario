import { useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'

type DiaryPost = {
  id: number
  title: string
  date: string
  text: string
  process: string
  image: string
  imageAlt: string
  access: 'Free' | 'Plus'
  downloadName: string
}

const posts: DiaryPost[] = [
  {
    id: 1,
    title: 'Manta jardim de domingo',
    date: '12 de agosto de 2026',
    text: 'Uma manta leve, feita para deixar o sofa mais macio nos dias de descanso. O desenho aparece aos poucos, como um jardim depois da chuva.',
    process: 'Comecei pela flor central e deixei os pontos vazados guiarem o restante. Foi uma peca que pediu calma, cafe e algumas mudancas de cor no meio do caminho.',
    image: '/assets/imagemPost.jpeg',
    imageAlt: 'Peca de croche branca aberta sobre um tapete',
    access: 'Free',
    downloadName: 'grafico-manta-jardim.jpeg',
  },
  {
    id: 2,
    title: 'Grafico da flor de inverno',
    date: '5 de agosto de 2026',
    text: 'Um estudo de flores miudas para quem gosta de detalhes que parecem simples, mas ficam muito bonitos quando vistos de perto.',
    process: 'Este grafico tem mais etapas e marcacoes. Eu o organizei para uma proxima colecao de pecas autorais e deixei uma previa no diario.',
    image: '/assets/imagemPost.jpeg',
    imageAlt: 'Peca de croche branca com padrao geometrico',
    access: 'Plus',
    downloadName: 'grafico-flor-de-inverno.jpeg',
  },
]

export function DiaryPage() {
  const { user } = useAuth()
  const [notice, setNotice] = useState('')

  return (
    <section className="diary" aria-labelledby="diary-title">
      <header className="diary__header">
        <img className="diary__profile" src="/assets/fotoAline.jfif" alt="Aline, autora do Massarocario" />
        <div>
          <p className="eyebrow">diario da aline</p>
          <h1 id="diary-title">Oi, {user?.name.split(' ')[0]}.</h1>
          <p>Tem ponto novo, processo vivido e um tantinho de caos bonito para dividir com voce.</p>
        </div>
      </header>
      <p className="diary__demo-note">Area demonstrativa: os posts e acessos serao lidos do banco quando o Supabase for conectado.</p>
      <div className="diary__feed">
        {posts.map((post) => (
          <article className="diary-post" key={post.id}>
            <img className="diary-post__image" src={post.image} alt={post.imageAlt} />
            <div className="diary-post__body">
              <p className="diary-post__date">{post.date}</p>
              <h2>{post.title}</h2>
              <p>{post.text}</p>
              <p className="diary-post__process"><strong>Como foi fazer:</strong> {post.process}</p>
              <div className="download-row">
                {post.access === 'Free' ? (
                  <a className="download-button" href="/assets/exemploGrafico1.jpeg" download={post.downloadName}>Baixar grafico</a>
                ) : (
                  <button className="download-button download-button--locked" type="button" onClick={() => setNotice('O grafico Plus sera liberado para assinantes quando a area de pagamentos estiver conectada.')}>Grafico para assinantes</button>
                )}
                <span className={post.access === 'Free' ? 'access-badge access-badge--free' : 'access-badge access-badge--plus'}>{post.access}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      {notice && <p className="diary__notice" role="status">{notice}</p>}
    </section>
  )
}
