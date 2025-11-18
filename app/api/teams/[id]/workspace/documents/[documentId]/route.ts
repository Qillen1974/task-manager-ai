import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";

/**
 * GET /api/teams/[id]/workspace/documents/[documentId]
 * Get a single document
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

    // Get workspace
    const workspace = await db.workspace.findUnique({
      where: { teamId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Get document
    const document = await db.workspaceDocument.findFirst({
      where: {
        id: documentId,
        workspaceId: workspace.id,
      },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("[Document GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[id]/workspace/documents/[documentId]
 * Delete a document (admin or uploader only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, documentId } = await params;

    // Check if user is a team member with edit permissions
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: auth.userId,
        role: { in: ["ADMIN", "EDITOR"] },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "You don't have permission to delete documents" },
        { status: 403 }
      );
    }

    // Get workspace
    const workspace = await db.workspace.findUnique({
      where: { teamId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Get document
    const document = await db.workspaceDocument.findFirst({
      where: {
        id: documentId,
        workspaceId: workspace.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or the uploader
    if (teamMember.role !== "ADMIN" && document.uploadedBy !== auth.userId) {
      return NextResponse.json(
        { error: "You can only delete your own documents" },
        { status: 403 }
      );
    }

    // Delete document
    await db.workspaceDocument.delete({
      where: { id: documentId },
    });

    // Log activity
    await db.workspaceActivity.create({
      data: {
        workspaceId: workspace.id,
        actorId: auth.userId,
        type: "document_deleted",
        description: `Deleted ${document.originalName}`,
        metadata: {
          documentId: document.id,
          fileName: document.originalName,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Document DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
