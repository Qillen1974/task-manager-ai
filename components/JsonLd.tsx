import Script from 'next/script';

interface JsonLdProps {
  data: object;
}

/**
 * Component to add JSON-LD structured data to pages
 * Used for SEO and rich snippets in search results
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id={`json-ld-${JSON.stringify(data).substring(0, 20)}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="afterInteractive"
    />
  );
}

// Organization schema for the company/website
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TaskQuadrant',
  url: 'https://taskquadrant.io',
  logo: 'https://taskquadrant.io/logo.png',
  description:
    'TaskQuadrant is a task management platform using the Eisenhower Matrix to help professionals prioritize work by urgency and importance.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@taskquadrant.io',
    contactType: 'Customer Support',
  },
  sameAs: [
    // Add social media profiles when available
  ],
};

// WebPage schema generator
export function createWebPageSchema(options: {
  url: string;
  name: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: options.url,
    name: options.name,
    description: options.description,
    publisher: {
      '@type': 'Organization',
      name: 'TaskQuadrant',
      url: 'https://taskquadrant.io',
    },
  };
}

// FAQPage schema generator
export function createFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// BreadcrumbList schema generator
export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// SoftwareApplication schema for the app
export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TaskQuadrant',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
};
