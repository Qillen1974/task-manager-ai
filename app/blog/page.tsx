import Link from "next/link";
import { db } from "@/lib/db";
import { Metadata } from "next";
import { JsonLd, createWebPageSchema } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog - TaskQuadrant",
  description:
    "Tips, strategies, and insights on task management, productivity, and the Eisenhower Matrix to help you work smarter.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog - TaskQuadrant",
    description:
      "Tips, strategies, and insights on task management, productivity, and the Eisenhower Matrix.",
    url: "https://taskquadrant.io/blog",
    siteName: "TaskQuadrant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - TaskQuadrant",
    description:
      "Tips, strategies, and insights on task management, productivity, and the Eisenhower Matrix.",
  },
};

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

export default async function BlogPage() {
  const posts = await db.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImageUrl: true,
      authorName: true,
      category: true,
      publishedAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <JsonLd
        data={createWebPageSchema({
          url: "https://taskquadrant.io/blog",
          name: "Blog - TaskQuadrant",
          description:
            "Tips, strategies, and insights on task management, productivity, and the Eisenhower Matrix.",
        })}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-blue-100">
            Tips, strategies, and insights on task management and productivity
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              No posts yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-400"
              >
                {post.coverImageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  {post.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      {post.category}
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm text-gray-500">
                    <span>
                      {post.publishedAt && formatDate(post.publishedAt)}
                    </span>
                    <span>{estimateReadTime(post.content)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 border border-purple-200 text-center">
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
