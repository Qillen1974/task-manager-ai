# Admin Features Guide

## Upgrading User Subscriptions to Unlimited

The application now includes an admin panel for managing user subscriptions.

### Using the Admin UI

1. **Access the Admin Panel**
   - Log in to your account
   - Click the **⚙️ Admin** link in the top navigation

2. **Upgrade a User Account**
   - Enter the user's email address in the "User Email" field
   - Click "Upgrade to Unlimited"
   - You'll see a success message confirming the upgrade

### Using the API Directly

You can also upgrade subscriptions via the API endpoint:

```bash
# Upgrade a user to unlimited plan
curl -X POST http://localhost:3001/api/admin/upgrade-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"email": "user@example.com"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User user@example.com upgraded to unlimited plan",
    "subscription": {
      "id": "subscription_id",
      "userId": "user_id",
      "plan": "ENTERPRISE",
      "projectLimit": 999999,
      "taskLimit": 999999
    }
  }
}
```

## Unlimited Plan Benefits

Once upgraded, a user account will have:
- **Unlimited Projects**: No limit on the number of projects that can be created
- **Unlimited Tasks**: No limit on the number of tasks that can be created
- **Full Feature Access**: Access to all features of the application

## Admin Requirements

The admin upgrade feature currently allows any authenticated user to upgrade other users' subscriptions. In a production environment, you should:

1. Add an `isAdmin` field to the User model
2. Implement proper role-based access control
3. Add audit logging for subscription changes
4. Require additional authentication for admin operations

## Example Workflow

1. **Register a new user account**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email": "myaccount@example.com", "password": "SecurePass123!", "name": "My Account"}'
   ```

2. **Log in to your admin account**
   - Navigate to your app and log in

3. **Upgrade the new account to unlimited**
   - Click ⚙️ Admin in the navigation
   - Enter `myaccount@example.com`
   - Click "Upgrade to Unlimited"

4. **Log in to the upgraded account**
   - Log out from your admin account
   - Log in with `myaccount@example.com`
   - You now have unlimited projects and tasks!
