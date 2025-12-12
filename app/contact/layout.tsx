import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JsonLd, createWebPageSchema, createFAQSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Contact Us - TaskQuadrant Support',
  description: 'Have questions about TaskQuadrant? Contact our support team for help with task management, features, billing, or general inquiries.',
  keywords: 'contact, support, help, customer service, task management support',
  openGraph: {
    title: 'Contact TaskQuadrant Support',
    description: 'Get in touch with TaskQuadrant support team for help and questions.',
    type: 'website',
    url: 'https://taskquadrant.io/contact',
  },
  twitter: {
    card: 'summary',
    title: 'Contact TaskQuadrant Support',
    description: 'Get in touch with TaskQuadrant support team for help and questions.',
  },
};

const webPageSchema = createWebPageSchema({
  url: 'https://taskquadrant.io/contact',
  name: 'Contact TaskQuadrant Support',
  description: 'Have questions about TaskQuadrant? Contact our support team for help with task management, features, billing, or general inquiries.',
});

const faqSchema = createFAQSchema([
  {
    question: 'How do I reset my password?',
    answer: 'You can change your password anytime from your account settings in the dashboard. Click on your profile and select "Settings" to change your password.',
  },
  {
    question: 'Can I export my data?',
    answer: 'Yes! Pro and Enterprise plan users can export their tasks and projects as PNG images or PDF documents directly from the dashboard.',
  },
  {
    question: 'What happens if I downgrade my plan?',
    answer: "If you downgrade from Pro to Free, your data will be preserved. However, you'll be limited to the Free plan's project and task limits.",
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. All data is encrypted in transit using HTTPS/TLS. Passwords are hashed and salted. We host on Railway (AWS infrastructure) with automatic backups and security monitoring.',
  },
  {
    question: 'Can I delete my account?',
    answer: 'Yes. You can delete your account anytime from your account settings. This will permanently delete your account, all your tasks, and all your data.',
  },
]);

interface ContactLayoutProps {
  children: ReactNode;
}

export default function ContactLayout({ children }: ContactLayoutProps): ReactNode {
  return (
    <>
      <JsonLd data={webPageSchema} />
      <JsonLd data={faqSchema} />
      {children}
    </>
  );
}
