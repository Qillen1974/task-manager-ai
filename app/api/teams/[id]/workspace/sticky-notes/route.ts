import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";

const STICKY_NOTE_COLORS = ["yellow", "pink", "blue", "green", "purple", "orange"];

/**
 * GET /api/teams/[id]/workspace/sticky-notes
 * Get sticky notes for workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId } = await params;

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

    // Get sticky notes (received by user or sent by user)
    const notes = await db.stickyNote.findMany({
      where: {
        workspaceId: workspace.id,
        isArchived: false,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("[StickyNotes GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch sticky notes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[id]/workspace/sticky-notes
 * Create a sticky note
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId } = await params;
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

    const { toUserId, content, color = "yellow", expiresAt } = body;

    if (!toUserId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required fields (toUserId, content)" },
        { status: 400 }
      );
    }

    // Verify recipient is in team
    const recipientMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: toUserId,
      },
    });

    if (!recipientMember) {
      return NextResponse.json(
        { error: "Recipient is not a team member" },
        { status: 400 }
      );
    }

    // Validate color
    if (!STICKY_NOTE_COLORS.includes(color)) {
      return NextResponse.json(
        { error: "Invalid color" },
        { status: 400 }
      );
    }

    // Create sticky note
    const note = await db.stickyNote.create({
      data: {
        workspaceId: workspace.id,
        fromUserId: auth.userId,
        toUserId,
        content,
        color,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
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

    // Log activity
    await db.workspaceActivity.create({
      data: {
        workspaceId: workspace.id,
        actorId: auth.userId,
        type: "sticky_note_added",
        description: `Sent sticky note to ${note.toUser.firstName} ${note.toUser.lastName}`,
        metadata: {
          noteId: note.id,
          toUserId,
        },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("[StickyNotes POST]", error);
    return NextResponse.json(
      { error: "Failed to create sticky note" },
      { status: 500 }
    );
  }
}
