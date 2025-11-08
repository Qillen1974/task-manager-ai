# Mind Mapping Feature Documentation

## Overview

The Mind Mapping feature allows PRO and ENTERPRISE users to create visual mind maps and automatically convert them into projects and tasks. This feature helps users plan complex projects visually before implementation.

## Features

### 1. Mind Map Creation
- Create unlimited mind maps (PRO: 5 maps, ENTERPRISE: unlimited)
- Add nodes with custom labels, descriptions, and colors
- Create connections between nodes to show relationships
- Drag nodes around the canvas for organization
- 8 color options for visual categorization

### 2. Mind Map Management
- Save and edit mind maps
- Delete mind maps
- View all saved mind maps
- Track node count and creation date

### 3. Conversion to Projects & Tasks
- Convert mind maps to projects and tasks with a single click
- Root node becomes the root project
- Branch nodes become subprojects
- Leaf nodes become tasks
- Node connections become task dependencies

### 4. Subscription Tier Limits

| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|-----------|
| Mind Maps | ❌ Disabled | 5 mind maps | Unlimited |
| Nodes per Map | N/A | 50 nodes max | Unlimited |
| Access | N/A | PRO+ only | Full access |

## User Interface

### Mind Maps List Page
- **Route**: `/dashboard/mindmaps`
- View all mind maps
- Create new mind map
- Edit existing mind maps
- Delete mind maps
- See conversion status

### Mind Map Editor
- **Route**: `/dashboard/mindmaps/new` (new map)
- **Route**: `/dashboard/mindmaps/[id]` (edit existing)
- Canvas-based editor with drag-and-drop
- Node editing panel
- Color picker
- Connection management
- Save, update, and convert options

## Technical Architecture

### Database Schema

```typescript
model MindMap {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title         String
  description   String?

  // Mind map data stored as JSON
  nodes         String   // JSON array of MindMapNode objects
  edges         String   // JSON array of MindMapEdge objects

  // Conversion tracking
  isConverted   Boolean  @default(false)
  convertedAt   DateTime?
  rootProjectId String?  // ID of root project created from this mind map

  // Metadata
  nodeCount     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
  @@index([isConverted])
}
```

### Node Data Structure

```typescript
interface MindMapNode {
  id: string;              // Unique identifier
  label: string;           // Display text
  description?: string;    // Optional description
  color?: string;          // Color name (blue, red, green, etc.)
  parentId?: string | null;// Parent node ID (null for root)
  metadata?: {
    priority?: string;
    dueDate?: string;
    startDate?: string;
    [key: string]: any;
  };
  x?: number;              // Canvas X position
  y?: number;              // Canvas Y position
}
```

### Edge Data Structure

```typescript
interface MindMapEdge {
  id: string;      // Unique identifier
  source: string;  // Source node ID
  target: string;  // Target node ID
  label?: string;  // Optional label
}
```

## API Endpoints

### GET /api/mindmaps
List all mind maps for the current user

**Query Parameters**:
- `includeConverted` (boolean, optional): Include converted mind maps

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "mind-map-123",
      "title": "Project Planning",
      "description": "Q4 Project Roadmap",
      "nodeCount": 25,
      "isConverted": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/mindmaps
Create a new mind map

**Request Body**:
```json
{
  "title": "My Mind Map",
  "description": "Optional description",
  "nodes": [
    {
      "id": "root",
      "label": "Root Node",
      "color": "blue"
    }
  ],
  "edges": []
}
```

**Response**: Returns the created mind map with parsed nodes/edges

### GET /api/mindmaps/[id]
Get a specific mind map

**Response**: Returns the mind map with parsed nodes/edges

### PATCH /api/mindmaps/[id]
Update a mind map (title, description, nodes, or edges)

**Request Body**: Same as POST, with optional fields

**Limitations**: Cannot update converted mind maps

### DELETE /api/mindmaps/[id]
Delete a mind map

### POST /api/mindmaps/[id]/convert
Convert a mind map to projects and tasks

**Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "mindMapId": "mind-map-123",
    "rootProjectId": "project-456",
    "rootProjectName": "Root Node",
    "projectsCreated": 5,
    "tasksCreated": 12,
    "edgesProcessed": 8,
    "message": "Successfully converted mind map to 12 tasks and projects"
  }
}
```

## Conversion Logic

### Node to Object Mapping

1. **Root Node** → Root Project
   - Project with `projectLevel = 0`
   - Uses node label as project name
   - Uses node color as project color

2. **Branch Nodes** (nodes with children) → Subprojects
   - Created under parent project
   - `projectLevel = parent.level + 1`
   - Respects subscription nesting limits

3. **Leaf Nodes** (nodes without children) → Tasks
   - Created in the appropriate project
   - Task title = node label
   - Task description = node description
   - Can include metadata (priority, dates)

4. **Edges** → Task Dependencies
   - Only connections between tasks create dependencies
   - Source task depends on target task
   - Stored as `dependsOnTaskId`

### Validation During Conversion

- ✅ User can create the required number of projects
- ✅ User can create the required number of tasks
- ✅ Projects don't exceed nesting level limits
- ✅ Tasks don't exceed count limits
- ✅ Mind map hasn't already been converted

## Limits Enforcement

### Subscription Validation Functions

Located in `lib/projectLimits.ts`:

```typescript
// Check if user can create a mind map
canCreateMindMap(plan: SubscriptionPlan, currentCount: number)

// Check if mind map can have X nodes
canCreateMindMapWithNodes(plan: SubscriptionPlan, nodeCount: number)

// Get mind map limits for a plan
getMindMapLimit(plan: SubscriptionPlan)
```

### Limits Checking Points

1. **At Mind Map Creation**: Check `maxMindMaps` limit
2. **At Node Addition**: Check `maxNodesPerMindMap` limit
3. **At Conversion**: Validate all limits for projects/tasks

## Frontend Components

### MindMapEditor (components/MindMapEditor.tsx)
Main editor component with canvas-based UI

**Features**:
- Canvas-based node editing
- Drag-and-drop repositioning
- Color selection
- Node creation/deletion
- Connection management
- Save/update/convert workflows
- JSON export

**Props**:
```typescript
interface MindMapEditorProps {
  mindMapId?: string;
  initialTitle?: string;
  initialDescription?: string;
  onSave?: (mindMapId: string) => void;
  onConvert?: (mindMapId: string) => void;
}
```

### Mind Maps List Page (app/dashboard/mindmaps/page.tsx)
Lists all mind maps for the user

**Features**:
- Grid view of mind maps
- Create new mind map
- Edit/delete mind maps
- View conversion status
- Plan upgrade prompts for FREE users

### Mind Map Editor Pages
- **New**: `/dashboard/mindmaps/new`
- **Edit**: `/dashboard/mindmaps/[id]`

## Usage Guide

### Creating a Mind Map

1. Navigate to **Mind Maps** in the dashboard
2. Click **Create New Mind Map**
3. Enter a title and description
4. Click on the canvas to select the root node
5. Use the side panel to:
   - Edit node label
   - Add description
   - Choose color
   - Add child nodes
   - Delete nodes
6. Click **Add Connection** to link nodes
7. Click **Save Mind Map** to persist

### Converting to Projects & Tasks

1. Open a saved mind map
2. Click **Convert to Projects** button
3. Confirm the conversion (this action is irreversible)
4. The system will:
   - Create root project
   - Create subprojects for branch nodes
   - Create tasks for leaf nodes
   - Link task dependencies
5. Redirect to mind maps list
6. Mind map is marked as "Converted"

### Exporting Mind Map

1. In the editor, click **Export as JSON**
2. This downloads a JSON file with nodes and edges
3. Can be used for backup or sharing

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Mind mapping is not available" | FREE plan | Upgrade to PRO |
| "You have reached your mind map limit" | Too many maps | Delete old maps or upgrade |
| "Mind map exceeds node limit" | Too many nodes | Remove nodes or upgrade |
| "Cannot update a converted mind map" | Mind map already converted | Create a new mind map |
| "This mind map has already been converted" | Already converted | Cannot convert again |

## Performance Considerations

- Canvas rendering optimized for up to 100+ nodes
- JSON parsing for nodes/edges cached in React state
- Conversion operation runs synchronously (should complete < 1 second)
- Database indexes on `userId` and `isConverted` for fast queries

## Security

- All endpoints require JWT authentication
- User isolation: Can only access own mind maps
- Mind maps cannot be modified after conversion
- API validates subscription limits before operations
- Converted mind maps tracked for audit purposes

## Future Enhancements

Potential features for future iterations:

- [ ] Collaborative mind mapping (share maps with team)
- [ ] Import mind maps from other tools
- [ ] Rich text editing in nodes
- [ ] Attachment support
- [ ] Mind map templates
- [ ] Real-time collaboration
- [ ] Undo/redo functionality
- [ ] Keyboard shortcuts
- [ ] Mind map templates library
- [ ] Export to various formats (PNG, SVG, PDF)

## Testing

### Test Scenarios

1. **Creation Tests**
   - Create mind map as PRO user
   - Attempt to create as FREE user (should fail)
   - Create maximum allowed maps
   - Create beyond limit (should fail)

2. **Editing Tests**
   - Add/remove nodes
   - Update node properties
   - Create connections
   - Update converted map (should fail)

3. **Conversion Tests**
   - Convert small mind map
   - Convert large mind map (50 nodes)
   - Verify project hierarchy created
   - Verify task dependencies linked
   - Verify limits enforced

4. **Error Handling Tests**
   - Invalid data format
   - Unauthorized access
   - Missing required fields
   - Duplicate conversions

## Database Migrations

To add the MindMap model to your database:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

Or if deploying to production:

```bash
# Push schema changes to database
npx prisma db push
```

## Integration with Existing Features

The mind mapping feature integrates seamlessly with:

- **Projects**: Converted mind maps create real projects
- **Tasks**: Leaf nodes become tasks with full task features
- **Subscriptions**: Respects all tier-based limits
- **Authentication**: Uses existing JWT auth system
- **Dashboard**: Accessible from main navigation

## Support & Troubleshooting

### FAQ

**Q: Can I edit a mind map after converting it?**
A: No, converted mind maps are locked. Create a new mind map if you need to make changes.

**Q: What happens to my mind map data after conversion?**
A: The mind map is marked as converted but data is preserved. You can still view it in the list.

**Q: Can I convert the same mind map multiple times?**
A: No, each mind map can only be converted once to prevent duplicate projects.

**Q: What if conversion fails?**
A: The mind map remains unconverted and you can try again. Check error messages for details.

**Q: Can I undo a conversion?**
A: No, conversions are permanent. However, the created projects/tasks can be deleted manually.

## Contact & Support

For issues or questions about the mind mapping feature, contact support or check the help documentation.
