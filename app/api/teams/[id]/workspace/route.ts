import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { ApiErrors } from "@/lib/apiResponse";

/**
 * GET /api/teams/[id]/workspace
 * Get workspace for a team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const userId = auth.userId;

    const { id: teamId } = await params;

    // Check if user is a team member
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!teamMember) {
      return ApiErrors.FORBIDDEN("Not a team member");
    }

    // Get or create workspace
    console.log("[Workspace GET] Fetching workspace with documents for teamId:", teamId);
    let workspace = await db.workspace.findFirst({
      where: { teamId },
      include: {
        documents: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileType: true,
            fileUrl: true,
            fileSize: true,
            uploadedBy: true,
            folder: true,
            tags: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            uploadedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        stickyNotes: {
          where: {
            OR: [{ toUserId: userId }, { fromUserId: userId }],
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
          take: 50,
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    console.log("[Workspace GET] Workspace fetched:", {
      id: workspace?.id,
      documentsCount: workspace?.documents?.length || 0,
    });

    // Create workspace if it doesn't exist
    if (!workspace) {
      console.log("[Workspace GET] Creating new workspace");
      workspace = await db.workspace.create({
        data: {
          teamId,
          name: `Team Workspace`,
          description: "Team collaboration space",
        },
        include: {
          documents: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              fileType: true,
              fileUrl: true,
              fileSize: true,
              uploadedBy: true,
              folder: true,
              tags: true,
              description: true,
              createdAt: true,
              updatedAt: true,
              uploadedByUser: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          stickyNotes: {
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
          },
          activities: true,
        },
      });
      console.log("[Workspace GET] New workspace created with id:", workspace.id);
    }

    console.log("[Workspace GET] Returning workspace with documents:", workspace.documents?.length || 0);
    return NextResponse.json(workspace);
  } catch (error) {
    console.error("[Workspace GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teams/[id]/workspace
 * Update workspace metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { id: teamId } = await params;
    const body = await request.json();

    // Check if user is admin
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: auth.userId,
        role: "ADMIN",
      },
    });

    if (!teamMember) {
      return ApiErrors.FORBIDDEN("Only admins can update workspace");
    }

    const workspace = await db.workspace.update({
      where: { teamId },
      data: {
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("[Workspace PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}
