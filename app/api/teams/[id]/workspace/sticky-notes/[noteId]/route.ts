import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";

/**
 * GET /api/teams/[id]/workspace/sticky-notes/[noteId]
 * Get a single sticky note
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, noteId } = await params;

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

    // Get sticky note
    const note = await db.stickyNote.findFirst({
      where: {
        id: noteId,
        workspaceId: workspace.id,
        OR: [{ toUserId: auth.userId }, { fromUserId: auth.userId }],
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Sticky note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("[StickyNote GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch sticky note" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teams/[id]/workspace/sticky-notes/[noteId]
 * Update a sticky note (mark as read, archive, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, noteId } = await params;
    const body = await request.json();

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

    // Get sticky note
    const note = await db.stickyNote.findFirst({
      where: {
        id: noteId,
        workspaceId: workspace.id,
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Sticky note not found" },
        { status: 404 }
      );
    }

    // Only the recipient can mark as read, only the sender can delete
    if (body.isRead !== undefined && note.toUserId !== auth.userId) {
      return NextResponse.json(
        { error: "Only the recipient can mark this note as read" },
        { status: 403 }
      );
    }

    // Update sticky note
    const updatedNote = await db.stickyNote.update({
      where: { id: noteId },
      data: {
        ...(body.isRead !== undefined && {
          isRead: body.isRead,
          readAt: body.isRead ? new Date() : null,
        }),
        ...(body.isArchived !== undefined && {
          isArchived: body.isArchived,
        }),
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("[StickyNote PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update sticky note" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[id]/workspace/sticky-notes/[noteId]
 * Delete a sticky note (sender only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, noteId } = await params;

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

    // Get sticky note
    const note = await db.stickyNote.findFirst({
      where: {
        id: noteId,
        workspaceId: workspace.id,
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Sticky note not found" },
        { status: 404 }
      );
    }

    // Only the sender can delete
    if (note.fromUserId !== auth.userId) {
      return NextResponse.json(
        { error: "Only the sender can delete this note" },
        { status: 403 }
      );
    }

    // Delete sticky note
    await db.stickyNote.delete({
      where: { id: noteId },
    });

    // Log activity
    await db.workspaceActivity.create({
      data: {
        workspaceId: workspace.id,
        actorId: auth.userId,
        type: "sticky_note_deleted",
        description: `Deleted sticky note to ${note.toUserId}`,
        metadata: {
          noteId: note.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[StickyNote DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete sticky note" },
      { status: 500 }
    );
  }
}
