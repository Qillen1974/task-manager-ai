import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Dashboard - TaskQuadrant Task Management',
  description: 'Manage your tasks efficiently with TaskQuadrant dashboard. Track projects, prioritize tasks using the Eisenhower Matrix, and collaborate with your team.',
  robots: {
    index: false, // Don't index dashboard pages
    follow: false,
  },
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps): ReactNode {
  return <>{children}</>;
}
