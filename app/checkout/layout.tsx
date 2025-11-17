import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Checkout - TaskQuadrant',
  description: 'Complete your TaskQuadrant subscription purchase securely.',
  robots: {
    index: false, // Don't index checkout pages
    follow: false,
  },
};

interface CheckoutLayoutProps {
  children: ReactNode;
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps): ReactNode {
  return <>{children}</>;
}
