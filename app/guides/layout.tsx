import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JsonLd, createWebPageSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Guides & Resources - TaskQuadrant',
  description:
    'Comprehensive guides on task management, productivity strategies, and team collaboration. In-depth analysis, actionable tips, and data-driven insights.',
  keywords:
    'task management, productivity, Eisenhower Matrix, prioritization, team collaboration, guides',
  openGraph: {
    title: 'Guides & Resources - TaskQuadrant',
    description:
      'Comprehensive guides on task management, productivity strategies, and team collaboration.',
    type: 'website',
    url: 'https://taskquadrant.io/guides',
    images: [
      {
        url: 'https://taskquadrant.io/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaskQuadrant Guides',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guides & Resources - TaskQuadrant',
    description:
      'Comprehensive guides on task management, productivity strategies, and team collaboration.',
  },
};

const webPageSchema = createWebPageSchema({
  url: 'https://taskquadrant.io/guides',
  name: 'Guides & Resources - TaskQuadrant',
  description: 'Comprehensive guides on task management, productivity strategies, and team collaboration. In-depth analysis, actionable tips, and data-driven insights.',
});

interface GuidesLayoutProps {
  children: ReactNode;
}

export default function GuidesLayout({ children }: GuidesLayoutProps): ReactNode {
  return (
    <>
      <JsonLd data={webPageSchema} />
      {children}
    </>
  );
}
