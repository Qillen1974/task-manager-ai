/**
 * Mind Map Permission Utilities
 * Handles access control for personal and team mind maps
 */

import { db } from "@/lib/db";

interface MindMapPermission {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user can view a mind map
 * - Owner of personal mind map: YES
 * - Team member of team mind map: YES (all roles: ADMIN, EDITOR, VIEWER)
 */
export async function canViewMindMap(
  userId: string,
  mindMapId: string
): Promise<MindMapPermission> {
  try {
    const mindMap = await db.mindMap.findUnique({
      where: { id: mindMapId },
      include: { team: { include: { members: true } } },
    });

    if (!mindMap) {
      return { allowed: false, reason: "Mind map not found" };
    }

    console.log(`[canViewMindMap] Checking view permission for user ${userId} on mindmap ${mindMapId}`, {
      mindMapUserId: mindMap.userId,
      mindMapTeamId: mindMap.teamId,
      teamMembers: mindMap.team?.members?.map(m => ({ userId: m.userId, role: m.role, acceptedAt: m.acceptedAt })),
    });

    // Personal mind map - owner only
    if (mindMap.userId && !mindMap.teamId) {
      if (mindMap.userId === userId) {
        console.log(`[canViewMindMap] Personal mind map - user is owner, allowing view`);
        return { allowed: true };
      }
      return { allowed: false, reason: "You do not have access to this mind map" };
    }

    // Team mind map - check team membership (all roles can view)
    if (mindMap.teamId) {
      const teamMember = mindMap.team?.members.find(
        (m) => m.userId === userId && m.acceptedAt !== null
      );

      console.log(`[canViewMindMap] Team mind map check: teamMember found:`, teamMember);

      if (teamMember) {
        console.log(`[canViewMindMap] Team mind map - user is member with role ${teamMember.role}, allowing view`);
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "You are not a member of the team that owns this mind map",
      };
    }

    return { allowed: false, reason: "Invalid mind map ownership" };
  } catch (error) {
    console.error("[mindMapPermissions] Error checking view permission:", error);
    return { allowed: false, reason: "Failed to verify permissions" };
  }
}

/**
 * Check if user can edit/modify a mind map
 * - Owner of personal mind map: YES
 * - Team ADMIN or EDITOR: YES
 * - Team VIEWER: NO
 * - Non-team member: NO
 *
 * Requires subscription check at API level
 */
export async function canEditMindMap(
  userId: string,
  mindMapId: string
): Promise<MindMapPermission> {
  try {
    const mindMap = await db.mindMap.findUnique({
      where: { id: mindMapId },
      include: { team: { include: { members: true } } },
    });

    if (!mindMap) {
      return { allowed: false, reason: "Mind map not found" };
    }

    console.log(`[canEditMindMap] Checking edit permission for user ${userId} on mindmap ${mindMapId}`, {
      mindMapUserId: mindMap.userId,
      mindMapTeamId: mindMap.teamId,
      teamMembers: mindMap.team?.members?.map(m => ({ userId: m.userId, role: m.role })),
    });

    // Personal mind map - owner only
    if (mindMap.userId && !mindMap.teamId) {
      if (mindMap.userId === userId) {
        return { allowed: true };
      }
      return { allowed: false, reason: "You can only edit your own mind maps" };
    }

    // Team mind map - check team role
    if (mindMap.teamId) {
      const teamMember = mindMap.team?.members.find(
        (m) => m.userId === userId && m.acceptedAt !== null
      );

      console.log(`[canEditMindMap] Team mind map check: teamMember found:`, teamMember);

      if (!teamMember) {
        return { allowed: false, reason: "You are not a member of this team" };
      }

      const editableRoles = ["ADMIN", "EDITOR"];
      if (editableRoles.includes(teamMember.role)) {
        console.log(`[canEditMindMap] User has editable role: ${teamMember.role}`);
        return { allowed: true };
      }

      console.log(`[canEditMindMap] User role ${teamMember.role} is not in editable roles`);
      return {
        allowed: false,
        reason: "You must be a team admin or editor to modify mind maps",
      };
    }

    return { allowed: false, reason: "Invalid mind map ownership" };
  } catch (error) {
    console.error("[mindMapPermissions] Error checking edit permission:", error);
    return { allowed: false, reason: "Failed to verify permissions" };
  }
}

/**
 * Check if user can delete a mind map
 * - Owner of personal mind map: YES
 * - Team ADMIN only: YES
 * - Team EDITOR: NO (can modify but not delete)
 */
export async function canDeleteMindMap(
  userId: string,
  mindMapId: string
): Promise<MindMapPermission> {
  try {
    const mindMap = await db.mindMap.findUnique({
      where: { id: mindMapId },
      include: { team: { include: { members: true } } },
    });

    if (!mindMap) {
      return { allowed: false, reason: "Mind map not found" };
    }

    // Personal mind map - owner only
    if (mindMap.userId && !mindMap.teamId) {
      if (mindMap.userId === userId) {
        return { allowed: true };
      }
      return { allowed: false, reason: "You can only delete your own mind maps" };
    }

    // Team mind map - admin only
    if (mindMap.teamId) {
      const teamMember = mindMap.team?.members.find(
        (m) => m.userId === userId && m.acceptedAt !== null
      );

      if (!teamMember) {
        return { allowed: false, reason: "You are not a member of this team" };
      }

      if (teamMember.role === "ADMIN") {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: "Only team admins can delete mind maps",
      };
    }

    return { allowed: false, reason: "Invalid mind map ownership" };
  } catch (error) {
    console.error("[mindMapPermissions] Error checking delete permission:", error);
    return { allowed: false, reason: "Failed to verify permissions" };
  }
}

/**
 * Check if user can convert a mind map to projects
 * - Owner of personal mind map: YES
 * - Team ADMIN or EDITOR: YES
 * - Team VIEWER: NO
 * - Non-team member: NO
 *
 * Requires subscription check at API level
 */
export async function canConvertMindMap(
  userId: string,
  mindMapId: string
): Promise<MindMapPermission> {
  try {
    const mindMap = await db.mindMap.findUnique({
      where: { id: mindMapId },
      include: { team: { include: { members: true } } },
    });

    if (!mindMap) {
      return { allowed: false, reason: "Mind map not found" };
    }

    // Personal mind map - owner only
    if (mindMap.userId && !mindMap.teamId) {
      if (mindMap.userId === userId) {
        return { allowed: true };
      }
      return { allowed: false, reason: "You can only convert your own mind maps" };
    }

    // Team mind map - check team role
    if (mindMap.teamId) {
      const teamMember = mindMap.team?.members.find(
        (m) => m.userId === userId && m.acceptedAt !== null
      );

      if (!teamMember) {
        return { allowed: false, reason: "You are not a member of this team" };
      }

      const convertableRoles = ["ADMIN", "EDITOR"];
      if (convertableRoles.includes(teamMember.role)) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: "You must be a team admin or editor to convert mind maps",
      };
    }

    return { allowed: false, reason: "Invalid mind map ownership" };
  } catch (error) {
    console.error("[mindMapPermissions] Error checking convert permission:", error);
    return { allowed: false, reason: "Failed to verify permissions" };
  }
}

/**
 * Check if user can create a team mind map
 * Requires:
 * 1. User is ADMIN or EDITOR in the team
 * 2. User has ENTERPRISE subscription (checked at API level)
 * 3. Team is ENTERPRISE-capable (all teams are by definition)
 */
export async function canCreateTeamMindMap(
  userId: string,
  teamId: string
): Promise<MindMapPermission> {
  try {
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return { allowed: false, reason: "Team not found" };
    }

    const teamMember = team.members.find(
      (m) => m.userId === userId && m.acceptedAt !== null
    );

    if (!teamMember) {
      return { allowed: false, reason: "You are not a member of this team" };
    }

    const creatableRoles = ["ADMIN", "EDITOR"];
    if (!creatableRoles.includes(teamMember.role)) {
      return {
        allowed: false,
        reason: "You must be a team admin or editor to create mind maps",
      };
    }

    // Subscription check should happen at API level, not here
    return { allowed: true };
  } catch (error) {
    console.error("[mindMapPermissions] Error checking create permission:", error);
    return { allowed: false, reason: "Failed to verify permissions" };
  }
}

/**
 * Get user's team memberships for filtering mind maps
 * Returns list of team IDs where user is an accepted member
 */
export async function getUserTeamIds(userId: string): Promise<string[]> {
  try {
    const teamMemberships = await db.teamMember.findMany({
      where: {
        userId,
        acceptedAt: { not: null },
      },
      select: { teamId: true },
    });

    return teamMemberships.map((tm) => tm.teamId);
  } catch (error) {
    console.error("[mindMapPermissions] Error getting user team IDs:", error);
    return [];
  }
}
