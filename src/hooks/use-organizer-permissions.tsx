/**
 * Organizer permissions hook - simplified stub
 * (Custom permission system has been removed)
 */
export function useOrganizerPermissions() {
    // Return stub functions that mimic the old interface
    // All permission checks now return true (rely on role-based access)
    return {
        hasPermission: () => true,
        isOrganizerAdmin: false,
        permissions: [],
        loading: false,
    }
}
