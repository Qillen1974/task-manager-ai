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
    if (!document.fileContent || document.fileContent.length === 0) {
      console.log("[Document Content] No file content found for document:", {
        id: document.id,
        originalName: document.originalName,
        fileSize: document.fileSize,
        hasContent: !!document.fileContent,
      });

      return NextResponse.json(
        {
          error: "Document content not available",
          message: "This document was uploaded before file storage was enabled. Please delete and re-upload the document to enable downloads.",
          documentId: document.id,
          originalName: document.originalName,
        },
        { status: 410 } // 410 Gone - permanent unavailability
      );
    }

    console.log("[Document Content] Serving document:", {
      id: document.id,
      originalName: document.originalName,
      fileType: document.fileType,
      size: Buffer.isBuffer(document.fileContent) ? document.fileContent.length : document.fileContent.byteLength,
    });

    // Ensure fileContent is a Buffer/Uint8Array
    let fileBuffer: Buffer | Uint8Array;
    if (Buffer.isBuffer(document.fileContent)) {
      fileBuffer = document.fileContent;
    } else if (document.fileContent instanceof Uint8Array) {
      fileBuffer = document.fileContent;
    } else {
      fileBuffer = Buffer.from(document.fileContent);
    }

    // Return file content with appropriate headers
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": document.fileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.originalName)}"`,
        "Content-Length": String(fileBuffer.byteLength || fileBuffer.length),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

    return response;
  } catch (error) {
    console.error("[Document Content]", error);
    return NextResponse.json(
      { error: "Failed to download document", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
