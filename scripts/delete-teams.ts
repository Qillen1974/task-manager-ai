import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteTeams() {
  try {
    console.log("Fetching all teams...");
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    console.log("\nAvailable teams:");
    teams.forEach((team, index) => {
      console.log(`${index + 1}. ID: ${team.id}`);
      console.log(`   Name: ${team.name}`);
      console.log(`   Slug: ${team.slug}`);
      console.log(`   Created: ${team.createdAt.toISOString()}`);
      console.log("");
    });

    // Example: Delete teams by ID
    // Replace these IDs with the actual team IDs you want to delete
    const teamIdsToDelete = process.argv.slice(2);

    if (teamIdsToDelete.length === 0) {
      console.log("No team IDs provided. Usage: npm run delete-teams <teamId1> <teamId2>");
      console.log(
        "\nExample: npm run delete-teams cly123456789 cly987654321"
      );
      process.exit(0);
    }

    for (const teamId of teamIdsToDelete) {
      console.log(`\nDeleting team with ID: ${teamId}`);

      // First delete all team members
      const deletedMembers = await prisma.teamMember.deleteMany({
        where: { teamId },
      });
      console.log(`Deleted ${deletedMembers.count} team members`);

      // Delete all team invitations
      const deletedInvitations = await prisma.teamInvitation.deleteMany({
        where: { teamId },
      });
      console.log(`Deleted ${deletedInvitations.count} team invitations`);

      // Finally delete the team
      const deletedTeam = await prisma.team.delete({
        where: { id: teamId },
      });
      console.log(`Successfully deleted team: ${deletedTeam.name}`);
    }

    console.log("\nDeletion complete!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTeams();
