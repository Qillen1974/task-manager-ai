import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";

/**
 * GET /api/teams/[id]/workspace/documents/[documentId]/content
 * Download/serve a document file content
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

    // Check if file content exists
    if (!document.fileContent) {
      return NextResponse.json(
        { error: "Document content not available" },
        { status: 404 }
      );
    }

    console.log("[Document Content] Serving document:", {
      id: document.id,
      originalName: document.originalName,
      fileType: document.fileType,
      size: document.fileContent.length,
    });

    // Return file content with appropriate headers
    const response = new NextResponse(document.fileContent);
    response.headers.set("Content-Type", document.fileType || "application/octet-stream");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${document.originalName}"`
    );
    response.headers.set("Content-Length", document.fileContent.length.toString());

    return response;
  } catch (error) {
    console.error("[Document Content]", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}
