import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sign In & Sign Up - TaskQuadrant',
  description: 'Sign in or create your TaskQuadrant account to start managing tasks with the Eisenhower Matrix.',
  robots: {
    index: false, // Don't index auth pages
    follow: false,
  },
};

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps): ReactNode {
  return <>{children}</>;
}
