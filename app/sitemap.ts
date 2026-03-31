import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://tripillarstudio.com';
  const now = new Date();

  const pages = [
    { url: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { url: '/program', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/program/adult', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/program/youth', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/our-approach', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/facilitators', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/trainers', priority: 0.8, changeFrequency: 'monthly' as const },
    // SEO pages
    { url: '/grief-education', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/grief-support-groups', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/dual-process-model', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/grief-facilitator-certification', priority: 0.8, changeFrequency: 'monthly' as const },
    // Other public pages
    { url: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/free-guide', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/start', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/memorial', priority: 0.6, changeFrequency: 'weekly' as const },
    { url: '/institutions', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/blog', priority: 0.7, changeFrequency: 'weekly' as const },
  ];

  return pages.map(({ url, priority, changeFrequency }) => ({
    url: `${base}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
