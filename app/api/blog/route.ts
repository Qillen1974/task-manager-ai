import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error, handleApiError } from "@/lib/apiResponse";
import { verifyBlogApiKey } from "@/lib/blogAuth";
import { slugify } from "@/lib/slugify";

/**
 * GET /api/blog - List published blog posts (public)
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const url = new URL(request.url);
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10), 1), 100);
    const category = url.searchParams.get("category");

    const where: any = { published: true };
    if (category) {
      where.category = category;
    }

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          authorName: true,
          category: true,
          tags: true,
          publishedAt: true,
        },
      }),
      db.blogPost.count({ where }),
    ]);

    return success({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}

/**
 * POST /api/blog - Create a new blog post (requires BLOG_API_KEY)
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = verifyBlogApiKey(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { title, content, slug: providedSlug, excerpt, metaDescription, keywords, coverImageUrl, authorName, category, tags, published } = body;

    if (!title || !content) {
      return error("title and content are required", 400, "MISSING_REQUIRED_FIELDS");
    }

    const slug = providedSlug ? slugify(providedSlug) : slugify(title);

    // Check slug uniqueness
    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return error(`A post with slug "${slug}" already exists`, 409, "SLUG_EXISTS");
    }

    const isPublished = published !== false;

    const post = await db.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        metaDescription: metaDescription || null,
        keywords: keywords || null,
        coverImageUrl: coverImageUrl || null,
        authorName: authorName || "TaskQuadrant Team",
        category: category || null,
        tags: tags || null,
        published: isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    return success(post, 201);
  });
}
