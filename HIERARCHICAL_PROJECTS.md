# Hierarchical Project Management Implementation Guide

## Overview

TaskMaster has been expanded with professional-grade hierarchical project management features. This document outlines the implementation, features, and how to use the new functionality.

## Current Status

**Branch**: `feature/hierarchical-projects`
**Latest Commits**:
- ef00985: Add professional hierarchical project UI components
- 8a949b8: Add hierarchical project management with subscription tiers

## Architecture Overview

### Backend (API)

#### Database Schema
- **Project Model** - Enhanced with hierarchical support
  - `parentProjectId`: Reference to parent project (nullable)
  - `projectLevel`: Nesting depth (0 = root)
  - `status`: Project status (ACTIVE, ARCHIVED, COMPLETED, ON_HOLD)
  - Professional fields: `startDate`, `endDate`, `budget`, `owner`

- **Subscription Model** - Updated with hierarchy limits
  - `maxProjectNestingLevel`: Max nesting depth
  - `maxSubprojectsPerProject`: Max subprojects per project

#### API Endpoints

**GET /api/projects**
- Returns root projects only
- Optional `includeChildren=true` for hierarchical data
- Returns task counts and completion stats

**POST /api/projects**
- Create root project or subproject
- Validates subscription limits
- Checks nesting depth for PRO tier
- Supports professional fields (budget, dates, owner)

**GET /api/projects/:id**
- Get project details with optional hierarchy
- Optional `includeChildren=true` and `includeParent=true`
- Returns task statistics

**PATCH /api/projects/:id**
- Update project fields
- Supports all professional fields
- Validates status updates

**DELETE /api/projects/:id**
- Cascade delete for all subprojects
- Recursively deletes all child projects
- Deletes all associated tasks
- Returns deletion summary

### Frontend (UI Components)

#### ProjectTree Component
Located: `components/ProjectTree.tsx`

A hierarchical project navigator with expand/collapse functionality.

**Features**:
- Recursive rendering of nested projects
- Expand/collapse animation
- Visual indicators (color, task count)
- Hover actions (create subproject, edit, delete)
- Active project highlighting
- Prevents accidental deletions with confirmation dialog

**Usage**:
```tsx
<ProjectTree
  projects={rootProjects}
  activeProjectId={currentProjectId}
  onSelectProject={(id) => handleSelect(id)}
  onCreateSubproject={(parentId) => handleCreateSub(parentId)}
  onEditProject={(id) => handleEdit(id)}
  onDeleteProject={(id) => handleDelete(id)}
/>
```

#### ProjectHierarchyModal Component
Located: `components/ProjectHierarchyModal.tsx`

Modal form for creating and editing projects with full hierarchy support.

**Features**:
- Create root projects or subprojects
- Edit existing projects
- Professional fields:
  - Name, description (required/optional)
  - Color selection (8 colors)
  - Start/end dates with validation
  - Project owner name
  - Budget with currency selection
- Parent project display when creating subprojects
- Subscription plan validation (FREE prevents subprojects)
- Form validation and error handling
- Loading states

**Usage**:
```tsx
<ProjectHierarchyModal
  isOpen={isOpen}
  isEditing={false}
  parentProjectId={selectedParentId}
  allProjects={projects}
  userPlan={subscription.plan}
  onSubmit={async (data) => {
    // Handle project creation/update
  }}
  onClose={() => setOpen(false)}
/>
```

#### ProjectBreadcrumb Component
Located: `components/ProjectBreadcrumb.tsx`

Shows current project path from root to active project.

**Features**:
- Clickable breadcrumb navigation
- Auto-builds path from root to current project
- Minimal, clean design
- Easy navigation back up the hierarchy

**Usage**:
```tsx
<ProjectBreadcrumb
  project={activeProject}
  allProjects={projects}
  onProjectClick={(id) => navigate(id)}
/>
```

#### ProjectStats Component
Located: `components/ProjectStats.tsx`

Comprehensive project overview dashboard.

**Features**:
- Project header with name and description
- Metadata display (status, owner, budget)
- Timeline tracking with deadline visualization
- Color-coded status (red for overdue, yellow for urgent)
- Task statistics:
  - Total tasks
  - Completed vs. pending
  - Completion percentage with progress bar
- Subprojects list with task counts
- Edit project button

**Usage**:
```tsx
<ProjectStats
  project={activeProject}
  tasks={projectTasks}
  childProjects={subprojects}
  onEditProject={() => openEditModal()}
/>
```

## Subscription Tier Limits

### FREE Tier
- **Projects**: Max 3 root projects
- **Hierarchy**: Single-level only (no subprojects)
- **Features**: Basic project and task management

### PRO Tier
- **Projects**: Max 5 root projects
- **Hierarchy**: 2-level nesting (root + subprojects)
- **Subprojects**: Unlimited subprojects per project
- **Professional Fields**: Name, description, dates, owner, status
- **Advanced**: Budget tracking, project status management

### ENTERPRISE Tier
- **Projects**: Unlimited
- **Hierarchy**: Unlimited nesting depth
- **Subprojects**: Unlimited at any level
- **All Features**: All professional fields and advanced features

## How to Implement in Main Page

The new components need to be integrated into the main page. Here's the architecture:

```tsx
// Main page structure
export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // 1. Fetch project tree on load
  useEffect(() => {
    fetchProjectTree();
  }, []);

  // 2. Left sidebar - ProjectTree navigation
  // 3. Right panel - ProjectStats for selected project
  // 4. Modal - ProjectHierarchyModal for create/edit

  return (
    <div className="flex gap-4">
      {/* Sidebar with ProjectTree */}
      <aside className="w-64 bg-white rounded-lg p-4">
        <button onClick={() => setShowProjectModal(true)}>
          + New Project
        </button>
        <ProjectTree
          projects={rootProjects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onCreateSubproject={(parentId) => {
            setEditingProject(null);
            setShowProjectModal(true);
          }}
          onEditProject={(id) => {
            const project = findProjectById(id, projects);
            setEditingProject(project);
            setShowProjectModal(true);
          }}
          onDeleteProject={deleteProject}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {activeProjectId && (
          <>
            <ProjectBreadcrumb
              project={activeProject}
              allProjects={projects}
              onProjectClick={setActiveProjectId}
            />
            <ProjectStats
              project={activeProject}
              tasks={projectTasks}
              childProjects={childProjects}
              onEditProject={() => {
                setEditingProject(activeProject);
                setShowProjectModal(true);
              }}
            />
          </>
        )}
      </main>

      {/* Modal */}
      <ProjectHierarchyModal
        isOpen={showProjectModal}
        isEditing={!!editingProject}
        project={editingProject}
        allProjects={projects}
        userPlan={subscription.plan}
        onSubmit={handleSubmitProject}
        onClose={() => {
          setShowProjectModal(false);
          setEditingProject(null);
        }}
      />
    </div>
  );
}
```

## API Integration Pattern

### Fetch Project Tree
```typescript
async function fetchProjectTree() {
  const response = await fetch("/api/projects?includeChildren=true", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}
```

### Create Subproject
```typescript
async function createSubproject(parentProjectId: string, data: ProjectFormData) {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      ...data,
      parentProjectId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    // Handle subscription limit error
    if (error.error?.code === "LIMIT_EXCEEDED") {
      showUpgradePrompt();
    }
  }

  return response.json();
}
```

### Delete Project (Cascade)
```typescript
async function deleteProject(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = await response.json();
  console.log(`Deleted ${result.data.deletedProjectCount} projects and ${result.data.deletedTaskCount} tasks`);
}
```

## Remaining Implementation Tasks

1. **Update Navigation Component**
   - Replace flat project list with ProjectTree
   - Add "Create Project" button

2. **Update Main Page (page.tsx)**
   - Integrate all components
   - Implement state management for selected project
   - Handle API calls for CRUD operations

3. **Update TaskForm Component**
   - Add hierarchical project selector
   - Show only projects at appropriate levels

4. **Testing**
   - Test subscription limit enforcement
   - Test cascade delete
   - Test project navigation
   - Test on different subscription tiers

5. **Documentation Updates**
   - Update user guide
   - Add feature highlights
   - Create tutorial videos (optional)

## Professional Features Highlights

### For Project Managers
- **Hierarchical Organization**: Create complex project structures with multiple levels
- **Timeline Tracking**: Set start/end dates, track progress
- **Budget Management**: Track budget allocation and spending
- **Team Assignment**: Assign project owners and team leads
- **Status Management**: Track project status across lifecycle
- **Progress Visibility**: See completion rates and pending work at a glance

### For Free Users
- Single-level projects (no subprojects)
- Limited to 3 projects
- Basic task management
- Perfect for individuals and small teams

### For PRO Users
- Up to 5 root projects
- Unlimited subprojects per project
- All professional fields
- Better for growing teams and complex projects

### For ENTERPRISE Users
- Unlimited projects with unlimited nesting
- Full feature set
- Perfect for large enterprises and complex organizations

## Performance Considerations

- **Tree Rendering**: Uses recursive rendering, optimized for reasonable depths (3-5 levels)
- **API Calls**: Minimize calls by fetching full tree on page load
- **Cascade Delete**: May take time for large project hierarchies, consider adding progress indicator
- **Database Indexes**: Uses indexes on `userId`, `parentProjectId`, and `status` for fast queries

## Security

- **User Isolation**: All queries filtered by `userId`
- **Ownership Verification**: Projects only accessible to owner
- **Subscription Enforcement**: Limits enforced at API level
- **Cascade Delete Safety**: Proper transaction handling for multi-level deletes

## Next Steps

After this implementation is complete, consider:
1. **Task Dependencies**: Link tasks across projects
2. **Team Collaboration**: Add team member roles and permissions
3. **Advanced Filtering**: Filter tasks across project hierarchy
4. **Calendar View**: Visualize timeline across projects
5. **Reporting**: Generate project and team reports
6. **Integration APIs**: Allow third-party integrations

---

**Last Updated**: October 30, 2025
**Feature Branch**: `feature/hierarchical-projects`
**Status**: Frontend components complete, ready for main page integration
