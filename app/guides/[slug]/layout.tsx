import type { Metadata } from 'next';
import type { ReactNode } from 'react';

interface GuideLayoutProps {
  children: ReactNode;
  params: Promise<{
    slug: string;
  }>;
}

// Guide metadata mapping
const guideMetadata: Record<
  string,
  {
    title: string;
    description: string;
    keywords: string;
    image?: string;
  }
> = {
  'task-management-guide': {
    title: 'The Ultimate Guide to Task Management: Strategies, Tools & Best Practices',
    description:
      'Comprehensive guide covering task management strategies, the Eisenhower Matrix framework, prioritization techniques, and actionable best practices for individuals and teams.',
    keywords:
      'task management, productivity, Eisenhower Matrix, prioritization, project management, team collaboration, time management',
    image: 'https://taskquadrant.io/og-guides-task-management.png',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideMetadata[slug] || guideMetadata['task-management-guide'];

  return {
    title: `${guide.title} - TaskQuadrant Guides`,
    description: guide.description,
    keywords: guide.keywords,
    authors: [{ name: 'TaskQuadrant Team' }],
    openGraph: {
      title: `${guide.title} - TaskQuadrant`,
      description: guide.description,
      type: 'article',
      url: `https://taskquadrant.io/guides/${slug}`,
      images: guide.image
        ? [
            {
              url: guide.image,
              width: 1200,
              height: 630,
              alt: guide.title,
            },
          ]
        : undefined,
      authors: ['TaskQuadrant Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${guide.title} - TaskQuadrant`,
      description: guide.description,
      images: guide.image ? [guide.image] : undefined,
    },
  };
}

export default function GuideLayout({ children }: GuideLayoutProps): ReactNode {
  return <>{children}</>;
}
