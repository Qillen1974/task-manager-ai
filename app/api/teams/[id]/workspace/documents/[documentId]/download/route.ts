import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";

/**
 * GET /api/teams/[id]/workspace/documents/[documentId]/download
 * Download a document file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, documentId } = await params;

    // Check if user is a team member
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: auth.userId,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Not a team member" },
        { status: 403 }
      );
    }

    // Get the document
    const document = await db.workspaceDocument.findFirst({
      where: {
        id: documentId,
        workspace: {
          teamId,
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // For now, return a message that file serving is not yet implemented
    // In production, you would:
    // 1. Fetch the file from S3/blob storage
    // 2. Return it with proper headers
    // 3. Or redirect to the storage URL

    return NextResponse.json({
      message: "File download feature coming soon",
      document: {
        id: document.id,
        name: document.originalName,
        type: document.fileType,
        size: document.fileSize,
      },
      info: "File storage integration needed. For now, documents are registered but not physically stored.",
    });
  } catch (error) {
    console.error("[Document Download]", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}
