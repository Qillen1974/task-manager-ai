import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JsonLd, createWebPageSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Upgrade to Pro or Enterprise - TaskQuadrant',
  description: 'Upgrade your TaskQuadrant subscription to unlock advanced features: recurring tasks, unlimited projects, exports, analytics, and more.',
  keywords: 'upgrade, subscription, pro plan, enterprise plan, premium features, pricing',
  openGraph: {
    title: 'Upgrade to TaskQuadrant Pro or Enterprise',
    description: 'Unlock advanced task management features with TaskQuadrant Pro or Enterprise plans.',
    type: 'website',
    url: 'https://taskquadrant.io/upgrade',
  },
  twitter: {
    card: 'summary',
    title: 'Upgrade to TaskQuadrant Pro or Enterprise',
    description: 'Unlock advanced task management features with Pro or Enterprise plans.',
  },
};

const webPageSchema = createWebPageSchema({
  url: 'https://taskquadrant.io/upgrade',
  name: 'Upgrade to TaskQuadrant Pro or Enterprise',
  description: 'Upgrade your TaskQuadrant subscription to unlock advanced features: recurring tasks, unlimited projects, exports, analytics, and more.',
});

interface UpgradeLayoutProps {
  children: ReactNode;
}

export default function UpgradeLayout({ children }: UpgradeLayoutProps): ReactNode {
  return (
    <>
      <JsonLd data={webPageSchema} />
      {children}
    </>
  );
}
