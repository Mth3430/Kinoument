export default function sitemap() {
  const parties = [
    'europe-ecologie-les-verts',
    'la-france-insoumise',
    'les-republicains',
    'parti-communiste-francais',
    'rassemblement-national',
    'reconquete',
    'renaissance',
    'parti-socialiste',
  ]

  const baseUrl = 'https://kinoument.fr'

  const pages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/a-propos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...parties.map((slug) => ({
      url: `${baseUrl}/parti/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
  ]

  return pages
}
