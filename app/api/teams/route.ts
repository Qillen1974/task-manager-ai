import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import { success, ApiErrors, handleApiError } from "@/lib/apiResponse";
import { z } from "zod";

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional().default(false),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

/**
 * GET /api/teams - List all teams the user is member of or owns
 */
export async function GET(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    // Get teams where user is a member
    const teamMemberships = await db.teamMember.findMany({
      where: {
        userId: auth.userId,
        acceptedAt: { not: null }, // Only accepted memberships
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                // This would need User relation, for now just userId
              },
            },
          },
        },
      },
      orderBy: { team: { createdAt: "desc" } },
    });

    const teams = teamMemberships.map((membership) => ({
      ...membership.team,
      userRole: membership.role,
      memberCount: membership.team.members.length,
    }));

    return success(teams);
  });
}

/**
 * POST /api/teams - Create a new team
 */
export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const data = createTeamSchema.parse(body);

    // Generate a unique slug from the team name
    let slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Ensure uniqueness
    let uniqueSlug = slug;
    let counter = 1;
    while (true) {
      const existing = await db.team.findUnique({
        where: { slug: uniqueSlug },
      });
      if (!existing) break;
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create the team
    const team = await db.team.create({
      data: {
        name: data.name,
        slug: uniqueSlug,
        description: data.description,
        isPublic: data.isPublic,
        ownerId: auth.userId,
      },
    });

    // Add creator as ADMIN member
    await db.teamMember.create({
      data: {
        teamId: team.id,
        userId: auth.userId,
        role: "ADMIN",
        acceptedAt: new Date(), // Auto-accept for creator
        invitedBy: auth.userId,
      },
    });

    // Get the team with members
    const teamWithMembers = await db.team.findUnique({
      where: { id: team.id },
      include: {
        members: true,
      },
    });

    return success(teamWithMembers, "Team created successfully");
  });
}
