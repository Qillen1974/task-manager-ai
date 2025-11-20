# Issue Diagnosis: Application Becoming Unavailable After Document Viewing

## Problem Statement
When clicking on "Dashboard" after viewing a document in the workspace, the application becomes unavailable and the page fails to load.

## Likely Root Causes

### 1. **Potential Infinite API Loop in Dashboard/WorkspacePanel**
**Location:** `app/dashboard/page.tsx` and `components/WorkspacePanel.tsx`

**Issue:** The dashboard page has multiple `useEffect` hooks that load data:
- Line 127-205: Initial data load
- Line 208-263: Auth success handler
- Line 265+: Additional effects

**Risk:** If navigation triggers state updates that cause re-renders, multiple effect dependencies could create cascading API calls.

**Evidence:**
```typescript
// app/dashboard/page.tsx line 144-152
const genResponse = await api.post("/tasks/generate-recurring?action=generate-all", {});
const projectsResponse = await api.getProjects();
const tasksResponse = await api.getTasks();
const userResponse = await api.getCurrentUser();
// Preferences fetch on line 180
```

If any of these fail or take too long, it could block the UI.

---

### 2. **Missing Dependency in useEffect**
**Location:** `components/WorkspacePanel.tsx` line 68-70

```typescript
useEffect(() => {
  loadWorkspace();
}, [teamId]); // Missing: api dependency
```

**Issue:** The `api` object is used in `loadWorkspace()` but not included in the dependency array. This can cause stale closures.

**Solution:**
```typescript
useEffect(() => {
  loadWorkspace();
}, [teamId, api]); // Add api to dependency array
```

---

### 3. **Navigation State Not Resetting**
**Location:** `app/dashboard/teams/[id]/page.tsx` and navigation back to `/dashboard`

**Issue:** When navigating from `/dashboard/teams/[id]` back to `/dashboard`, state from the teams page might not be cleaned up properly.

**Symptom:** The dashboard might be trying to load team-specific data in the wrong context.

---

### 4. **SearchParams Causing Re-renders**
**Location:** `app/dashboard/page.tsx` lines 71-83

```typescript
let initialView = "dashboard";
let initialProjectId = "";

try {
  const searchParams = useSearchParams();
  if (searchParams) {
    initialView = searchParams.get("view") || "dashboard";
    initialProjectId = searchParams.get("projectId") || "";
  }
} catch (e) {
  // searchParams not available
}
```

**Issue:** `useSearchParams()` called at component scope (not in hook) can cause hydration mismatches.

**Fix:** Should be called inside `useEffect`:
```typescript
useEffect(() => {
  const searchParams = useSearchParams();
  if (searchParams) {
    setInitialView(searchParams.get("view") || "dashboard");
    setInitialProjectId(searchParams.get("projectId") || "");
  }
}, []);
```

---

### 5. **Possible Memory Leak or Resource Exhaustion**
**Location:** Anywhere with incomplete cleanup

**Risk:** If modals, subscriptions, or event listeners aren't properly cleaned up, navigating between pages could cause memory issues.

---

## Immediate Fixes to Apply

### Fix 1: Add Missing Dependencies in WorkspacePanel
```typescript
// Before
useEffect(() => {
  loadWorkspace();
}, [teamId]);

// After
useEffect(() => {
  loadWorkspace();
}, [teamId, api]);
```

### Fix 2: Move SearchParams into useEffect
```typescript
// Before (top-level call)
const searchParams = useSearchParams();

// After (in effect)
const [initialView, setInitialView] = useState("dashboard");
const [initialProjectId, setInitialProjectId] = useState("");

useEffect(() => {
  try {
    const searchParams = useSearchParams();
    if (searchParams) {
      setInitialView(searchParams.get("view") || "dashboard");
      setInitialProjectId(searchParams.get("projectId") || "");
    }
  } catch (e) {
    // Use defaults
  }
}, []);
```

### Fix 3: Add Timeout Protection
Wrap API calls with timeouts to prevent hanging:

```typescript
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    ),
  ]);
};

// In dashboard loading
const projectsResponse = await withTimeout(
  api.getProjects(),
  5000 // 5 second timeout
);
```

### Fix 4: Cleanup Previous Requests
When unmounting, cancel pending requests:

```typescript
useEffect(() => {
  const controller = new AbortController();
  
  const loadData = async () => {
    try {
      const response = await fetch('/api/tasks', {
        signal: controller.signal,
      });
      // ...
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed:', err);
      }
    }
  };

  loadData();

  return () => {
    controller.abort(); // Cancel on unmount
  };
}, []);
```

---

## Testing Steps

1. **Clear browser cache and localStorage**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Open DevTools Network tab**
   - Check for hanging/pending requests
   - Look for 404 or 500 errors
   - Check request/response times

3. **Check Console for Errors**
   - Look for red error messages
   - Check for uncaught promise rejections
   - Look for warnings about missing dependencies

4. **Test Navigation Flow**
   - Go to Teams page
   - View workspace/documents
   - Click Dashboard link
   - Verify page loads within 2 seconds

5. **Monitor Network**
   - Watch for repeated requests to same endpoint
   - Check if requests are cancelling properly
   - Look for exponential backoff behavior

---

## Prevention Strategies

### 1. **Use React Query or SWR**
Replace custom API hook with proven library:
```typescript
import { useQuery } from '@tanstack/react-query';

const { data: projects, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: () => api.getProjects(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 2. **Implement Request Debouncing**
```typescript
import { useMemo } from 'react';

const debouncedLoadWorkspace = useMemo(
  () => debounce(() => loadWorkspace(), 300),
  []
);
```

### 3. **Add Loading States & Timeouts**
```typescript
const handleNavigateToDashboard = async () => {
  try {
    setIsNavigating(true);
    // Pre-load data before navigation
    await Promise.race([
      api.getProjects(),
      new Promise((_, reject) => 
        setTimeout(() => reject('Timeout'), 3000)
      ),
    ]);
  } finally {
    setIsNavigating(false);
  }
};
```

### 4. **Use React Suspense (Future)**
```typescript
<Suspense fallback={<LoadingSpinner />}>
  <DashboardContent />
</Suspense>
```

---

## Recommended Action Plan

### Immediate (1-2 hours)
- [ ] Fix useSearchParams placement
- [ ] Add missing dependencies to useEffect hooks
- [ ] Add request timeouts
- [ ] Clear all localStorage/cache and test

### Short-term (1-2 days)
- [ ] Add AbortController for request cancellation
- [ ] Implement proper cleanup in useEffect return
- [ ] Add error boundaries for safer error handling
- [ ] Increase timeout for slow networks

### Long-term (1-2 weeks)
- [ ] Migrate to React Query for better data management
- [ ] Add comprehensive error logging
- [ ] Implement retry logic with exponential backoff
- [ ] Add performance monitoring (e.g., Sentry)

---

## Quick Debugging Checklist

- [ ] Check browser DevTools Network tab
- [ ] Look for requests hanging > 5 seconds
- [ ] Check for circular dependency in state updates
- [ ] Look for infinite loop indicators in console
- [ ] Verify token isn't expired
- [ ] Check database connection status
- [ ] Review recent changes to navigation/routing
- [ ] Check for race conditions in state updates

---

**Status:** Ready for implementation
**Priority:** Critical - Blocks user workflow
**Effort:** Low-Medium (2-4 hours for all fixes)
