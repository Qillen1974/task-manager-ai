# Offline Sync Implementation

Complete offline-first architecture for the TaskQuadrant mobile app with automatic synchronization.

## 🎯 Features

### ✅ Implemented

1. **Offline Detection**
   - Real-time network status monitoring
   - Visual offline indicator banner
   - Automatic detection of network changes

2. **Data Persistence**
   - All tasks and projects cached in AsyncStorage
   - Automatic save on every state change
   - Load from cache on app start

3. **Offline Operations**
   - Create tasks/projects offline
   - Update tasks/projects offline
   - Delete tasks/projects offline
   - Optimistic UI updates for instant feedback

4. **Sync Queue**
   - Queues all offline operations
   - Automatic sync when online
   - Retry logic with max 3 attempts
   - Operation ordering preserved

5. **Auto-Sync Triggers**
   - When network is restored
   - When app comes to foreground
   - Manual trigger on pull-to-refresh

## 📁 Architecture

### Core Components

```
mobile-app/src/
├── services/
│   ├── offlineService.ts    # Network detection & monitoring
│   └── syncQueue.ts           # Operation queue & sync logic
├── store/
│   ├── persist.ts             # AsyncStorage persistence middleware
│   ├── taskStore.ts           # Task store with offline support
│   └── projectStore.ts        # Project store with offline support
└── components/
    └── OfflineIndicator.tsx   # Visual offline banner
```

### Data Flow

```
Online Mode:
User Action → API Call → Update Local State → Persist to AsyncStorage

Offline Mode:
User Action → Update Local State (Optimistic) → Queue Operation → Persist to AsyncStorage

Back Online:
Network Restored → Process Queue → Sync to Server → Update Local State
```

## 🔧 How It Works

### 1. Network Detection

```typescript
import { offlineService } from './services/offlineService';

// Check current status
const isOnline = offlineService.getOnlineStatus();

// Subscribe to changes
const unsubscribe = offlineService.subscribe((isOnline) => {
  console.log('Network status:', isOnline ? 'Online' : 'Offline');
});

// Wait for network
await offlineService.waitForOnline();
```

### 2. Sync Queue

```typescript
import { syncQueue } from './services/syncQueue';

// Add operation to queue
await syncQueue.addOperation('CREATE', 'task', taskData);

// Register sync callback
syncQueue.registerSyncCallback('task_CREATE', async (operation) => {
  const newTask = await apiClient.createTask(operation.data);
  // Update local state with server response
});

// Manually trigger sync
await syncQueue.processQueue();
```

### 3. Persistent Stores

```typescript
import { create } from 'zustand';
import { persist } from './persist';

const useStore = create(
  persist(
    (set) => ({
      data: [],
      // ... store logic
    }),
    {
      name: '@store_key',
      partialize: (state) => ({
        data: state.data,
        lastSync: state.lastSync,
      }),
    }
  )
);
```

## 📱 User Experience

### Online Mode
1. User creates/edits task
2. Changes saved to server immediately
3. Local cache updated
4. UI shows success instantly

### Offline Mode
1. User creates/edits task
2. Changes saved to local cache immediately (optimistic update)
3. Operation queued for sync
4. Yellow banner appears: "You're offline - Changes will sync when online"
5. User continues working normally

### Back Online
1. Network detected
2. Sync queue processes automatically
3. All pending operations sent to server
4. Temp IDs replaced with server IDs
5. Fresh data fetched
6. Banner disappears

## 🧪 Testing

### Test Offline Mode

1. **Setup**
   ```bash
   cd mobile-app
   npx expo start --tunnel
   ```

2. **Test Offline Create**
   - Open app and login
   - Enable Airplane Mode on device
   - Create a new task
   - Task appears immediately with temp ID
   - Disable Airplane Mode
   - Task syncs and gets real ID from server

3. **Test Offline Edit**
   - Open app and login
   - Edit a task (change title)
   - Enable Airplane Mode
   - Edit the same task again
   - Changes appear immediately
   - Disable Airplane Mode
   - Changes sync to server

4. **Test Offline Delete**
   - Enable Airplane Mode
   - Delete a task
   - Task disappears immediately
   - Disable Airplane Mode
   - Deletion syncs to server

5. **Test App Foreground Sync**
   - Create task offline
   - Minimize app (home button)
   - Disable Airplane Mode
   - Open app again
   - Watch console logs for "triggering sync"
   - Task syncs automatically

### Expected Behavior

| Scenario | Expected Result |
|----------|----------------|
| Create offline | Task appears with temp ID, syncs when online |
| Edit offline | Changes visible immediately, sync when online |
| Delete offline | Item removed immediately, delete syncs when online |
| Network restored | Yellow banner disappears, auto-sync triggers |
| App foreground | Pending operations sync, fresh data fetched |
| Max retries | Failed operations removed after 3 attempts |

## 🔍 Debugging

### View Sync Queue

Add this to any component:

```typescript
import { syncQueue } from '../services/syncQueue';

// Log pending operations
console.log('Pending operations:', syncQueue.getQueue());
console.log('Count:', syncQueue.getPendingCount());
```

### Monitor Network Status

```typescript
import { offlineService } from '../services/offlineService';

offlineService.subscribe((isOnline) => {
  console.log('Network:', isOnline ? 'ONLINE' : 'OFFLINE');
});
```

### Check Persisted Data

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// View stored tasks
const tasks = await AsyncStorage.getItem('@task_store');
console.log('Cached tasks:', JSON.parse(tasks));

// View sync queue
const queue = await AsyncStorage.getItem('@sync_queue');
console.log('Sync queue:', JSON.parse(queue));
```

### Clear All Data (Debug)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncQueue } from '../services/syncQueue';

// Clear everything
await AsyncStorage.clear();
await syncQueue.clearQueue();
```

## ⚠️ Known Limitations

1. **Conflict Resolution**: Last-write-wins (no merge strategy)
2. **Attachment Uploads**: Not supported offline (images, files)
3. **Real-time Updates**: No server push when offline
4. **Storage Limits**: AsyncStorage limited to ~6MB on some devices
5. **Network Detection**: May have false positives on captive portals

## 🚀 Future Enhancements

### Phase 2
- [ ] Conflict resolution UI (show conflicts to user)
- [ ] Selective sync (choose what to sync)
- [ ] Offline file/image support
- [ ] Background sync (iOS limitations apply)
- [ ] Delta sync (only sync changes)

### Phase 3
- [ ] Peer-to-peer sync (local network)
- [ ] Compression for large datasets
- [ ] Encryption for sensitive data
- [ ] Sync analytics and monitoring

## 📚 Resources

- [React Native NetInfo](https://github.com/react-native-netinfo/react-native-netinfo)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Zustand Persist](https://github.com/pmndrs/zustand#persist-middleware)
- [Offline-First Apps Guide](https://offlinefirst.org/)

## 🤝 Contributing

When adding new features that involve server communication:

1. Check `offlineService.getOnlineStatus()` before API calls
2. Implement optimistic updates for better UX
3. Queue operations using `syncQueue.addOperation()`
4. Register sync callbacks for your operations
5. Test both online and offline scenarios
6. Update this documentation

## 📝 Changelog

### v1.0.0 (2025-01-17)
- Initial offline sync implementation
- Network detection service
- Sync queue with retry logic
- AsyncStorage persistence
- Optimistic UI updates
- Auto-sync on network restore
- Auto-sync on app foreground
- Offline indicator banner

---

**Status**: ✅ Production Ready

**Last Updated**: January 17, 2025
