import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, handleApiError } from "@/lib/apiResponse";

/**
 * GET /api/admin/knowledge-base - List knowledge base articles (ADMIN only, with pagination)
 * Query: page=1, limit=10, category, search
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user || !user.isAdmin) {
      return { error: "Only admins can access knowledge base", status: 403 };
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "10"));
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { keywords: { contains: search, mode: "insensitive" } },
      ];
    }

    const [articles, total] = await Promise.all([
      db.knowledgeBase.findMany({
        where,
        orderBy: { priority: "desc" },
        skip,
        take: limit,
      }),
      db.knowledgeBase.count({ where }),
    ]);

    return success({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });
}

/**
 * POST /api/admin/knowledge-base - Create a new knowledge base article (ADMIN only)
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user || !user.isAdmin) {
      return { error: "Only admins can create articles", status: 403 };
    }

    const body = await request.json();
    const { category, title, content, keywords, priority, isActive } = body;

    if (!category || !title || !content) {
      return {
        error: "Category, title, and content are required",
        status: 400,
      };
    }

    const article = await db.knowledgeBase.create({
      data: {
        category,
        title: title.trim(),
        content,
        keywords: keywords ? keywords.trim() : null,
        priority: priority || 0,
        isActive: isActive !== false,
      },
    });

    return success({
      article,
      message: "Article created successfully",
    });
  });
}
