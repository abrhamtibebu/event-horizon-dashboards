# EventDetails.tsx - Structural Analysis & Fixes

## Executive Summary

The `EventDetails.tsx` component is **5,800 lines** long, making it one of the largest React components in the codebase. This violates multiple software engineering principles and creates significant maintainability, performance, and testing challenges.

## Critical Issues Identified

### 1. **God Component Anti-Pattern** ⚠️ CRITICAL
- **Issue**: Single component handling 15+ distinct responsibilities
- **Impact**: 
  - Impossible to maintain
  - Difficult to test
  - Poor code reusability
  - High cognitive load
  - Merge conflicts in team environments

### 2. **Excessive State Management** ⚠️ CRITICAL
- **Issue**: 50+ `useState` hooks in a single component
- **Impact**:
  - Unnecessary re-renders
  - Difficult state debugging
  - No clear state ownership
  - Performance degradation

### 3. **Multiple useEffect Dependencies** ⚠️ HIGH
- **Issue**: 15+ `useEffect` hooks with complex dependency arrays
- **Impact**:
  - Race conditions
  - Infinite loop risks
  - Unpredictable side effects
  - Difficult to debug

### 4. **Mixed Concerns** ⚠️ HIGH
- **Issue**: UI rendering, business logic, API calls, and data transformation all in one file
- **Impact**:
  - Violates Single Responsibility Principle
  - Difficult to unit test
  - Code duplication across similar pages

### 5. **No Code Splitting** ⚠️ MEDIUM
- **Issue**: All functionality loaded upfront
- **Impact**:
  - Large initial bundle size
  - Slow page load times
  - Poor user experience

## Component Responsibilities (Current)

The component currently handles:
1. Event details display
2. Attendee management (CRUD)
3. Badge printing (single & batch)
4. CSV import/export
5. Usher assignment
6. Analytics & reporting
7. Forms management
8. Event sessions
9. Invitations
10. Share analytics
11. Team management
12. Event editing
13. Check-in management
14. Guest type management
15. Ticket type management
16. Dialog management (10+ dialogs)

## Recommended Structural Refactoring

### Phase 1: Extract Feature Components (Priority: HIGH)

#### 1.1 Create Feature-Based Directory Structure
```
src/
├── features/
│   ├── events/
│   │   ├── components/
│   │   │   ├── EventDetailsHeader.tsx
│   │   │   ├── EventDetailsTabs.tsx
│   │   │   ├── EventInfoCard.tsx
│   │   │   └── EventActions.tsx
│   │   ├── hooks/
│   │   │   ├── useEventDetails.ts
│   │   │   ├── useEventEdit.ts
│   │   │   └── useEventDelete.ts
│   │   └── types/
│   │       └── event.types.ts
│   ├── attendees/
│   │   ├── components/
│   │   │   ├── AttendeesList.tsx
│   │   │   ├── AttendeeTable.tsx
│   │   │   ├── AttendeeFilters.tsx
│   │   │   ├── AddAttendeeDialog.tsx
│   │   │   ├── EditAttendeeDialog.tsx
│   │   │   └── AttendeeBulkActions.tsx
│   │   ├── hooks/
│   │   │   ├── useAttendees.ts
│   │   │   ├── useAttendeeCRUD.ts
│   │   │   └── useAttendeeFilters.ts
│   │   └── utils/
│   │       └── attendeeExport.ts
│   ├── badges/
│   │   ├── components/
│   │   │   ├── BadgePrintPreview.tsx
│   │   │   ├── BadgeBatchPrint.tsx
│   │   │   └── BadgePrintDialog.tsx
│   │   └── hooks/
│   │       └── useBadgePrint.ts
│   ├── analytics/
│   │   ├── components/
│   │   │   ├── EventAnalytics.tsx
│   │   │   ├── ShareAnalytics.tsx
│   │   │   └── SessionAnalytics.tsx
│   │   └── hooks/
│   │       └── useEventAnalytics.ts
│   ├── ushers/
│   │   ├── components/
│   │   │   └── UsherManagement.tsx
│   │   └── hooks/
│   │       └── useUsherAssignment.ts
│   └── forms/
│       ├── components/
│       │   └── EventFormsTab.tsx
│       └── hooks/
│           └── useEventForms.ts
```

#### 1.2 Refactored Main Component Structure
```typescript
// EventDetails.tsx (reduced to ~200 lines)
import { EventDetailsHeader } from '@/features/events/components/EventDetailsHeader'
import { EventDetailsTabs } from '@/features/events/components/EventDetailsTabs'
import { useEventDetails } from '@/features/events/hooks/useEventDetails'
import { AttendeesTab } from '@/features/attendees/components/AttendeesTab'
import { AnalyticsTab } from '@/features/analytics/components/AnalyticsTab'
// ... other imports

export default function EventDetails() {
  const { eventId } = useParams()
  const { eventData, loading, error, refetch } = useEventDetails(eventId)

  if (loading) return <EventDetailsSkeleton />
  if (error) return <EventDetailsError error={error} />
  if (!eventData) return <EventNotFound />

  return (
    <div className="space-y-6">
      <EventDetailsHeader event={eventData} />
      <EventDetailsTabs eventId={eventId} event={eventData}>
        <AttendeesTab eventId={eventId} />
        <AnalyticsTab eventId={eventId} />
        <SessionsTab eventId={eventId} />
        <FormsTab eventId={eventId} />
        {/* ... other tabs */}
      </EventDetailsTabs>
    </div>
  )
}
```

### Phase 2: Custom Hooks Extraction (Priority: HIGH)

#### 2.1 Extract State Management Hooks
```typescript
// hooks/useEventDetails.ts
export function useEventDetails(eventId: string | undefined) {
  const [eventData, setEventData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    // ... fetch logic
  }, [eventId])

  return { eventData, loading, error, refetch }
}

// hooks/useAttendees.ts
export function useAttendees(eventId: string, filters: AttendeeFilters) {
  // ... all attendee-related state and logic
}

// hooks/useBadgePrint.ts
export function useBadgePrint() {
  // ... badge printing logic
}
```

### Phase 3: Context API for Shared State (Priority: MEDIUM)

#### 3.1 Create Event Context
```typescript
// contexts/EventContext.tsx
interface EventContextType {
  event: Event | null
  loading: boolean
  error: string | null
  refetch: () => void
  updateEvent: (updates: Partial<Event>) => void
}

export const EventContext = createContext<EventContextType | null>(null)

export function EventProvider({ eventId, children }) {
  const { eventData, loading, error, refetch } = useEventDetails(eventId)
  
  return (
    <EventContext.Provider value={{ event: eventData, loading, error, refetch }}>
      {children}
    </EventContext.Provider>
  )
}
```

### Phase 4: Code Splitting & Lazy Loading (Priority: MEDIUM)

#### 4.1 Lazy Load Heavy Components
```typescript
// EventDetails.tsx
const AttendeesTab = lazy(() => import('@/features/attendees/components/AttendeesTab'))
const AnalyticsTab = lazy(() => import('@/features/analytics/components/AnalyticsTab'))
const BadgeDesigner = lazy(() => import('@/features/badges/components/BadgeDesigner'))

// In render:
<Suspense fallback={<TabSkeleton />}>
  <AttendeesTab eventId={eventId} />
</Suspense>
```

## Specific Code Issues & Fixes

### Issue 1: Duplicate State Variables
**Problem**: Multiple state variables for similar purposes
```typescript
// Current (BAD)
const [addAttendeeDialogOpen, setAddAttendeeDialogOpen] = useState(false)
const [createParticipantDialogOpen, setCreateParticipantDialogOpen] = useState(false)
const [editAttendeeDialogOpen, setEditAttendeeDialogOpen] = useState(false)
```

**Fix**: Use a single dialog state manager
```typescript
// Better
const [dialogState, setDialogState] = useState<{
  type: 'add' | 'edit' | 'create' | null
  data?: any
}>({ type: null })
```

### Issue 2: Inline Style Objects
**Problem**: Large inline style objects in JSX
```typescript
// Current (BAD) - Lines 2041-2079
<div style={{ position: 'absolute', top: -9999, ... }}>
```

**Fix**: Extract to CSS classes or styled components
```typescript
// Better
<div className="print-area-hidden">
```

### Issue 3: Complex Conditional Rendering
**Problem**: Deeply nested ternary operators
```typescript
// Current (BAD)
{eventLoading ? (
  <Spinner />
) : eventError ? (
  <Error />
) : !eventData ? (
  <NotFound />
) : (
  <Content />
)}
```

**Fix**: Use early returns or guard clauses
```typescript
// Better
if (eventLoading) return <Spinner />
if (eventError) return <Error />
if (!eventData) return <NotFound />
return <Content />
```

### Issue 4: Magic Numbers and Strings
**Problem**: Hardcoded values throughout
```typescript
// Current (BAD)
setTimeout(() => { ... }, 300) // What is 300?
params.append('per_page', '15') // Why 15?
```

**Fix**: Extract to constants
```typescript
// Better
const PRINT_DELAY_MS = 300
const DEFAULT_PAGE_SIZE = 15
```

### Issue 5: Duplicate API Call Logic
**Problem**: Similar API call patterns repeated
```typescript
// Current (BAD) - Repeated pattern
api.get(`/events/${eventId}/...`)
  .then((res) => setData(res.data))
  .catch((err) => setError('Failed'))
  .finally(() => setLoading(false))
```

**Fix**: Create reusable API hook
```typescript
// Better
function useApiCall<T>(endpoint: string, deps: any[]) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // ... unified logic
  }, deps)
  
  return { data, loading, error }
}
```

## Performance Optimizations

### 1. Memoization
```typescript
// Add memoization for expensive computations
const filteredAttendees = useMemo(() => {
  return attendees.filter(/* ... */)
}, [attendees, searchTerm, filters])

const eventStats = useMemo(() => {
  return calculateStats(eventData, attendees)
}, [eventData, attendees])
```

### 2. Callback Memoization
```typescript
// Memoize callbacks to prevent unnecessary re-renders
const handleAttendeeSelect = useCallback((id: number) => {
  // ... logic
}, [])

const handleExport = useCallback(() => {
  // ... logic
}, [attendees])
```

### 3. Virtual Scrolling
```typescript
// For large attendee lists
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={attendees.length}
  itemSize={50}
>
  {AttendeeRow}
</FixedSizeList>
```

## Testing Strategy

### Current State: ❌ Untestable
- Component too large to unit test
- Too many dependencies
- No clear boundaries

### After Refactoring: ✅ Testable
```typescript
// Example: Test attendee hook
describe('useAttendees', () => {
  it('should fetch attendees on mount', async () => {
    const { result } = renderHook(() => useAttendees('1', {}))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.attendees).toHaveLength(10)
  })
})

// Example: Test attendee component
describe('AttendeesTab', () => {
  it('should render attendee list', () => {
    render(<AttendeesTab eventId="1" />)
    expect(screen.getByText('Attendees')).toBeInTheDocument()
  })
})
```

## Migration Plan

### Step 1: Create Feature Directories (Week 1)
- Set up folder structure
- Create type definitions
- Extract shared utilities

### Step 2: Extract Hooks (Week 2)
- Move state management to custom hooks
- Extract API calls
- Create context providers

### Step 3: Extract Components (Week 3-4)
- Start with leaf components (buttons, cards)
- Move to feature components (tabs, dialogs)
- Update imports

### Step 4: Refactor Main Component (Week 5)
- Reduce to orchestration logic only
- Add lazy loading
- Implement code splitting

### Step 5: Testing & Optimization (Week 6)
- Write unit tests
- Add integration tests
- Performance profiling
- Bundle size optimization

## Expected Benefits

### Maintainability
- ✅ 90% reduction in file size (5,800 → ~200 lines)
- ✅ Clear separation of concerns
- ✅ Easier to locate and fix bugs
- ✅ Reduced merge conflicts

### Performance
- ✅ Faster initial load (code splitting)
- ✅ Reduced re-renders (memoization)
- ✅ Better memory usage
- ✅ Improved bundle size

### Developer Experience
- ✅ Easier onboarding
- ✅ Better IDE performance
- ✅ Improved code navigation
- ✅ Better debugging

### Testability
- ✅ Unit testable components
- ✅ Testable hooks
- ✅ Integration testable features
- ✅ Better test coverage

## Immediate Quick Wins (Can be done now)

1. **Extract Constants** (30 min)
   - Move magic numbers to constants file
   - Extract repeated strings

2. **Extract Utility Functions** (1 hour)
   - Move helper functions to utils
   - Create reusable formatters

3. **Split Large Functions** (2 hours)
   - Break down 100+ line functions
   - Extract inline handlers

4. **Add TypeScript Interfaces** (1 hour)
   - Define proper types for state
   - Replace `any` types

5. **Extract Dialog Components** (3 hours)
   - Move dialogs to separate files
   - Create dialog wrapper component

## Conclusion

The `EventDetails.tsx` component is a prime example of technical debt that needs immediate attention. The recommended refactoring will:

1. **Improve maintainability** by 10x
2. **Reduce bugs** through better separation of concerns
3. **Enhance performance** via code splitting and optimization
4. **Enable testing** through modular architecture
5. **Accelerate development** with reusable components

**Priority**: 🔴 **CRITICAL** - Should be addressed in next sprint

**Estimated Effort**: 6 weeks (1 developer) or 3 weeks (2 developers)

**ROI**: High - Will save significant time in future development and bug fixes
