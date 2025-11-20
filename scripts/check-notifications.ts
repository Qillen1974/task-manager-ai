/**
 * Diagnostic script to check notification status
 * Run with: npx ts-node scripts/check-notifications.ts
 */

import { db } from "../lib/db";

async function main() {
  try {
    console.log("=== Notification Diagnostic ===\n");

    // Get all users
    const users = await db.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true },
      take: 5,
    });

    console.log("Users in system:");
    users.forEach((u) => {
      console.log(`  - ${u.firstName} ${u.lastName} (${u.email})`);
    });

    if (users.length < 2) {
      console.log("\n⚠️  Need at least 2 users to test notifications");
      return;
    }

    const user1 = users[0];
    const user2 = users[1];

    console.log(`\n--- Checking Sticky Notes ---`);

    // Get all sticky notes between these users
    const notes = await db.stickyNote.findMany({
      where: {
        OR: [
          { fromUserId: user1.id, toUserId: user2.id },
          { fromUserId: user2.id, toUserId: user1.id },
        ],
      },
      include: {
        fromUser: { select: { firstName: true, lastName: true } },
        toUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (notes.length === 0) {
      console.log("❌ No sticky notes found between users");
    } else {
      console.log(`✅ Found ${notes.length} sticky notes:`);
      notes.forEach((note) => {
        console.log(
          `  - From: ${note.fromUser.firstName} to ${note.toUser.firstName}`
        );
        console.log(`    Content: "${note.content.substring(0, 50)}..."`);
        console.log(`    Created: ${note.createdAt.toISOString()}`);
      });
    }

    console.log(`\n--- Checking Notifications for ${user2.firstName} ---`);

    // Get notifications for user2
    const notifications = await db.notification.findMany({
      where: { userId: user2.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (notifications.length === 0) {
      console.log("❌ NO NOTIFICATIONS FOUND");
    } else {
      console.log(`✅ Found ${notifications.length} notifications:`);
      notifications.forEach((notif) => {
        console.log(`  - Type: ${notif.type}`);
        console.log(`    Title: ${notif.title}`);
        console.log(`    Read: ${notif.isRead}`);
        console.log(`    Email Sent: ${notif.sentViaEmail}`);
        console.log(`    Created: ${notif.createdAt.toISOString()}`);
        console.log("");
      });
    }

    console.log(`--- Checking Preferences for ${user2.firstName} ---`);

    const prefs = await db.notificationPreference.findUnique({
      where: { userId: user2.id },
    });

    if (!prefs) {
      console.log("❌ NO PREFERENCES FOUND - CREATING DEFAULT");
      const newPrefs = await db.notificationPreference.create({
        data: { userId: user2.id },
      });
      console.log("✅ Created default preferences:");
      console.log(`   inAppStickyNotes: ${newPrefs.inAppStickyNotes}`);
      console.log(`   emailStickyNotes: ${newPrefs.emailStickyNotes}`);
    } else {
      console.log("✅ Preferences found:");
      console.log(`   inAppStickyNotes: ${prefs.inAppStickyNotes}`);
      console.log(`   emailStickyNotes: ${prefs.emailStickyNotes}`);
      console.log(`   notificationsMuted: ${prefs.notificationsMuted}`);
    }

    console.log("\n--- Checking Sticky Note Notifications ---");

    const stickyNoteNotifs = await db.notification.findMany({
      where: {
        userId: user2.id,
        type: "sticky_note_received",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (stickyNoteNotifs.length === 0) {
      console.log(
        "❌ NO STICKY NOTE NOTIFICATIONS - This is the issue!"
      );
      console.log("   Check application logs for errors in sendStickyNoteNotification");
    } else {
      console.log(`✅ Found ${stickyNoteNotifs.length} sticky note notifications`);
      stickyNoteNotifs.forEach((notif) => {
        console.log(`   - ${notif.title} (${notif.createdAt.toISOString()})`);
      });
    }

    console.log("\n=== End Diagnostic ===");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

main();
