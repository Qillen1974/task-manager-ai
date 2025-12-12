import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JsonLd, createWebPageSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Features - TaskQuadrant Task Management Tool',
  description: 'Discover TaskQuadrant\'s powerful features: Eisenhower Matrix, project management, recurring tasks, analytics, exports, and more for productivity.',
};

const webPageSchema = createWebPageSchema({
  url: 'https://taskquadrant.io/features',
  name: 'TaskQuadrant Features - Task Management Tools',
  description: 'Discover TaskQuadrant\'s powerful features: Eisenhower Matrix, project management, recurring tasks, analytics, exports, and more for productivity.',
});

interface FeaturesLayoutProps {
  children: ReactNode;
}

export default function FeaturesLayout({ children }: FeaturesLayoutProps): ReactNode {
  return (
    <>
      <JsonLd data={webPageSchema} />
      {children}
    </>
  );
}
