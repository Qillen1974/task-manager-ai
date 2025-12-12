import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JsonLd, createWebPageSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Manpower Calculator - Estimate Project Resources & Hours',
  description:
    'Free manpower calculator tool to estimate hours and resources needed for tasks. Calculate team requirements by task type, complexity, and duration. Perfect for project management and resource planning.',
  keywords:
    'manpower calculator, resource estimation, project planning, task estimation, man hours, resource allocation, project management tool',
  openGraph: {
    title: 'Manpower Calculator - Project Resource Estimation Tool',
    description:
      'Estimate hours and resources needed for tasks with our free manpower calculator. Perfect for project planning and resource allocation.',
    type: 'website',
    url: 'https://taskquadrant.io/tools/manpower-calculator',
    images: [
      {
        url: 'https://taskquadrant.io/og-tools-manpower.png',
        width: 1200,
        height: 630,
        alt: 'Manpower Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manpower Calculator - Resource Estimation',
    description: 'Estimate project resources and hours with our free manpower calculator tool.',
  },
};

const webPageSchema = createWebPageSchema({
  url: 'https://taskquadrant.io/tools/manpower-calculator',
  name: 'Manpower Calculator - Project Resource Estimation Tool',
  description: 'Free manpower calculator tool to estimate hours and resources needed for tasks. Calculate team requirements by task type, complexity, and duration.',
});

interface CalculatorLayoutProps {
  children: ReactNode;
}

export default function CalculatorLayout({ children }: CalculatorLayoutProps): ReactNode {
  return (
    <>
      <JsonLd data={webPageSchema} />
      {children}
    </>
  );
}
