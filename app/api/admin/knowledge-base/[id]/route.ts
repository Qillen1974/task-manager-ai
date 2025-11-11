import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/admin/knowledge-base/[id] - Get a specific article
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user || !user.isAdmin) {
      return { error: "Only admins can access knowledge base", status: 403 };
    }

    const article = await db.knowledgeBase.findUnique({
      where: { id: params.id },
    });

    if (!article) {
      return { error: "Article not found", status: 404 };
    }

    return success({ article });
  });
}

/**
 * PATCH /api/admin/knowledge-base/[id] - Update an article
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user || !user.isAdmin) {
      return { error: "Only admins can update articles", status: 403 };
    }

    const article = await db.knowledgeBase.findUnique({
      where: { id: params.id },
    });

    if (!article) {
      return { error: "Article not found", status: 404 };
    }

    const body = await request.json();
    const { category, title, content, keywords, priority, isActive } = body;

    const updated = await db.knowledgeBase.update({
      where: { id: params.id },
      data: {
        ...(category && { category }),
        ...(title && { title: title.trim() }),
        ...(content && { content }),
        ...(keywords !== undefined && { keywords: keywords ? keywords.trim() : null }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return success({
      article: updated,
      message: "Article updated successfully",
    });
  });
}

/**
 * DELETE /api/admin/knowledge-base/[id] - Delete an article
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user || !user.isAdmin) {
      return { error: "Only admins can delete articles", status: 403 };
    }

    const article = await db.knowledgeBase.findUnique({
      where: { id: params.id },
    });

    if (!article) {
      return { error: "Article not found", status: 404 };
    }

    await db.knowledgeBase.delete({
      where: { id: params.id },
    });

    return success({
      message: "Article deleted successfully",
    });
  });
}
