import HomeClient from './home-client'

export const metadata = {
  title: 'Kinoument - Comparateur de Programmes Politiques',
  description: 'Comparez les promesses électorales des partis politiques français avec leurs votes réels au Parlement. Outil d\'analyse objective et transparente basé sur les données de l\'Assemblée Nationale.',
  keywords: ['comparateur politique', 'programmes électoraux', 'votes parlementaires', 'France', 'Assemblée Nationale'],
  openGraph: {
    title: 'Kinoument',
    description: 'Comparez les promesses des partis avec leurs votes réels',
    url: 'https://kinoument.fr',
    siteName: 'Kinoument',
    images: [
      {
        url: 'https://kinoument.fr/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kinoument - Comparateur de Programmes',
    description: 'Transparence politique: promesses vs votes réels',
    image: 'https://kinoument.fr/og-image.png',
  },
}

export default function Page() {
  return <HomeClient />
}
