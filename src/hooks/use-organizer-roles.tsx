/**
 * Organizer roles hook - simplified stub
 * (Custom permission system has been removed)
 */
export interface OrganizerRole {
    id: number
    name: string
    description?: string
    is_system_role: boolean
    organizer_id?: number
    permissions?: Array<{ permission: string }>
    users_count?: number
    users?: Array<any>
}

export function useOrganizerRoles() {
    // Return stub that mimics the old interface
    // No actual role management functionality
    return {
        roles: [] as OrganizerRole[],
        isLoading: false,
        createRole: async () => { },
        updateRole: async () => { },
        deleteRole: async () => { },
        assignPermissions: async () => { },
    }
}
