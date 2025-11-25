# Dark Mode Fix Guide

## Overview
This document provides the systematic replacement patterns needed to fix all hardcoded colors across the codebase for proper dark mode support.

## Critical Replacements

### Background Colors
- `bg-white` → `bg-card`
- `bg-gray-50` → `bg-background`
- `bg-gray-100` → `bg-muted`
- `bg-slate-50` → `bg-background`
- `bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50` → `bg-background`
- `bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50` → `bg-background`

### Text Colors
- `text-gray-900` → `text-foreground` or `text-card-foreground`
- `text-gray-800` → `text-foreground`
- `text-gray-700` → `text-foreground`
- `text-gray-600` → `text-muted-foreground`
- `text-gray-500` → `text-muted-foreground/70`
- `text-gray-400` → `text-muted-foreground`

### Border Colors
- `border-gray-200` → `border-border`
- `border-gray-100` → `border-border`
- `border-gray-300` → `border-border`

### Hover States
- `hover:bg-gray-50` → `hover:bg-accent`
- `hover:bg-gray-100` → `hover:bg-accent`
- `hover:text-gray-700` → `hover:text-foreground`

### Cards
All Card components should use:
- `bg-card` for background
- `text-card-foreground` for primary text
- `border-border` for borders

### Status Colors
Use the utility function from `@/lib/utils`:
```typescript
import { getStatusColor } from '@/lib/utils'
// Instead of inline colors, use:
className={getStatusColor(status)}
```

## Files That Need Updates

### High Priority (Critical Pages)
1. `src/pages/Events.tsx` - ✅ Partially fixed
2. `src/pages/OrganizerDashboard.tsx` - ✅ Partially fixed
3. `src/pages/EventDetails.tsx`
4. `src/pages/AdminDashboard.tsx`
5. `src/pages/Guests.tsx`
6. `src/pages/Messages.tsx`
7. `src/pages/Reports.tsx`

### Medium Priority
8. `src/pages/Users.tsx`
9. `src/pages/Organizers.tsx`
10. `src/pages/VendorManagementRevamped.tsx`
11. `src/pages/Marketing.tsx`
12. `src/pages/Tasks.tsx`
13. All dashboard pages (UsherDashboard, AttendeeDashboard, etc.)

### Components
Many components in `src/components/` also need updates, especially:
- `src/components/DashboardCard.tsx`
- `src/components/MetricCard.tsx`
- `src/components/messaging/*.tsx`
- `src/components/marketing/*.tsx`

## Automated Fix Pattern

For bulk replacements, use these patterns:

```bash
# Backgrounds
find src -name "*.tsx" -type f -exec sed -i 's/bg-white/bg-card/g' {} +
find src -name "*.tsx" -type f -exec sed -i 's/bg-gray-50/bg-background/g' {} +
find src -name "*.tsx" -type f -exec sed -i 's/bg-gray-100/bg-muted/g' {} +

# Text colors
find src -name "*.tsx" -type f -exec sed -i 's/text-gray-900/text-foreground/g' {} +
find src -name "*.tsx" -type f -exec sed -i 's/text-gray-600/text-muted-foreground/g' {} +
find src -name "*.tsx" -type f -exec sed -i 's/text-gray-500/text-muted-foreground\/70/g' {} +

# Borders
find src -name "*.tsx" -type f -exec sed -i 's/border-gray-200/border-border/g' {} +
find src -name "*.tsx" -type f -exec sed -i 's/border-gray-100/border-border/g' {} +
```

**Note:** Be careful with sed replacements - review each change as some may need manual adjustment.



























