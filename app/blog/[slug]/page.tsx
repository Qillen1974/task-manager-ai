import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Metadata } from "next";
import { JsonLd, createArticleSchema, createBreadcrumbSchema } from "@/components/JsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug },
    select: { title: true, metaDescription: true, excerpt: true, keywords: true, coverImageUrl: true },
  });

  if (!post) {
    return { title: "Post Not Found - TaskQuadrant" };
  }

  const description = post.metaDescription || post.excerpt || `${post.title} - TaskQuadrant Blog`;

  return {
    title: `${post.title} - TaskQuadrant Blog`,
    description,
    keywords: post.keywords || undefined,
    openGraph: {
      title: post.title,
      description,
      url: `https://taskquadrant.io/blog/${slug}`,
      siteName: "TaskQuadrant",
      type: "article",
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const post = await db.blogPost.findUnique({
    where: { slug },
  });

  if (!post || !post.published) {
    notFound();
  }

  const baseUrl = "https://taskquadrant.io";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <JsonLd
        data={createArticleSchema({
          url: `${baseUrl}/blog/${post.slug}`,
          title: post.title,
          description: post.metaDescription || post.excerpt || post.title,
          datePublished: (post.publishedAt || post.createdAt).toISOString(),
          dateModified: post.updatedAt.toISOString(),
          authorName: post.authorName,
          imageUrl: post.coverImageUrl || undefined,
        })}
      />
      <JsonLd
        data={createBreadcrumbSchema([
          { name: "Home", url: baseUrl },
          { name: "Blog", url: `${baseUrl}/blog` },
          { name: post.title, url: `${baseUrl}/blog/${post.slug}` },
        ])}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="text-blue-100 hover:text-white transition-colors mb-4 inline-block"
          >
            &larr; Back to Blog
          </Link>
          {post.category && (
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 ml-4">
              {post.category}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-blue-100 text-sm">
            <span>By {post.authorName}</span>
            <span>|</span>
            <span>
              {post.publishedAt && formatDate(post.publishedAt)}
            </span>
            <span>|</span>
            <span>{estimateReadTime(post.content)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {post.coverImageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        <article
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-blockquote:border-blue-500 prose-blockquote:text-gray-600"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share + Tags */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          {post.tags && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.split(",").map((tag) => (
                <span
                  key={tag.trim()}
                  className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            <span className="text-gray-600 font-semibold">Share:</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`${baseUrl}/blog/${post.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 transition-colors"
            >
              Twitter
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${baseUrl}/blog/${post.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:text-blue-900 transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 border border-purple-200 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Master Your Tasks?
          </h2>
          <p className="text-gray-700 mb-6">
            Put these strategies into practice with TaskQuadrant&apos;s
            Eisenhower Matrix-powered task management.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
