import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'TaskQuadrant Landing - Eisenhower Matrix Task Management',
  description:
    'Discover TaskQuadrant - The ultimate task management tool using the Eisenhower Matrix. Prioritize your tasks by urgency and importance. Start organizing your work today.',
  keywords:
    'task management, Eisenhower Matrix, productivity, prioritization, project management, work organization',
  openGraph: {
    title: 'TaskQuadrant - Master Task Management with Eisenhower Matrix',
    description:
      'The ultimate task management tool using the Eisenhower Matrix. Prioritize by urgency and importance.',
    type: 'website',
    url: 'https://taskquadrant.io/landing',
    images: [
      {
        url: 'https://taskquadrant.io/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaskQuadrant Landing Page',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskQuadrant - Master Task Management',
    description: 'The ultimate task management tool using the Eisenhower Matrix.',
  },
};

interface LandingLayoutProps {
  children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps): ReactNode {
  return <>{children}</>;
}
