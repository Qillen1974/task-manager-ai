import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error, handleApiError } from "@/lib/apiResponse";
import { verifyBlogApiKey } from "@/lib/blogAuth";

/**
 * GET /api/blog/[slug] - Get a single published blog post (public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleApiError(async () => {
    const { slug } = await params;

    const post = await db.blogPost.findUnique({
      where: { slug },
    });

    if (!post || !post.published) {
      return error("Post not found", 404, "NOT_FOUND");
    }

    return success(post);
  });
}

/**
 * PATCH /api/blog/[slug] - Update a blog post (requires BLOG_API_KEY)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleApiError(async () => {
    const auth = verifyBlogApiKey(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { slug } = await params;
    const body = await request.json();

    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (!existing) {
      return error("Post not found", 404, "NOT_FOUND");
    }

    const data: any = {};
    const allowedFields = ["title", "content", "excerpt", "metaDescription", "keywords", "coverImageUrl", "authorName", "category", "tags", "published"];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // If publishing for the first time, set publishedAt
    if (data.published === true && !existing.publishedAt) {
      data.publishedAt = new Date();
    }

    const post = await db.blogPost.update({
      where: { slug },
      data,
    });

    return success(post);
  });
}

/**
 * DELETE /api/blog/[slug] - Delete a blog post (requires BLOG_API_KEY)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleApiError(async () => {
    const auth = verifyBlogApiKey(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { slug } = await params;

    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (!existing) {
      return error("Post not found", 404, "NOT_FOUND");
    }

    await db.blogPost.delete({ where: { slug } });

    return success({ message: "Post deleted" });
  });
}
