import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RoleSelectorProps {
    value: number | null
    onValueChange: (value: number | null) => void
    placeholder?: string
    showEmpty?: boolean
}

/**
 * Role selector component - simplified stub
 * (Custom role management has been removed)
 */
export function RoleSelector({ value, onValueChange, placeholder, showEmpty }: RoleSelectorProps) {
    // Since custom roles have been removed, this component now shows a disabled empty selector
    return (
        <Select disabled>
            <SelectTrigger>
                <SelectValue placeholder={placeholder || "No custom roles available"} />
            </SelectTrigger>
            <SelectContent>
                {showEmpty && (
                    <SelectItem value="none">No role assigned</SelectItem>
                )}
            </SelectContent>
        </Select>
    )
}
