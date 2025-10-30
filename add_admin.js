/**
 * Script to add an admin account to localStorage
 * Run this in the browser console on any page of the application
 *
 * Usage:
 * 1. Open http://localhost:3000
 * 2. Open DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste the code below
 * 5. Press Enter
 */

function addAdmin(email, password, name = "Admin", role = "admin") {
  try {
    // Get existing admins
    const existingAdminsJson = localStorage.getItem("taskmaster_admins");
    const admins = existingAdminsJson ? JSON.parse(existingAdminsJson) : [];

    // Check if admin already exists
    const existingAdmin = admins.find(a => a.email === email);

    if (existingAdmin) {
      console.log("❌ Admin account already exists!");
      console.log("Existing admin:", existingAdmin);
      return;
    }

    // Create new admin
    const newAdmin = {
      id: "admin_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      email,
      password,
      name,
      role,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Add to admins array
    admins.push(newAdmin);
    localStorage.setItem("taskmaster_admins", JSON.stringify(admins));

    console.log("✅ Admin account created successfully!");
    console.log("Email:", newAdmin.email);
    console.log("Password:", newAdmin.password);
    console.log("Role:", newAdmin.role);
    console.log("\nYou can now login at /admin");
  } catch (error) {
    console.error("❌ Error adding admin:", error);
  }
}

// Add the admin account
addAdmin("charles.wee74@icloud.com", "#7430287CWasd", "Charles Wee", "admin");
