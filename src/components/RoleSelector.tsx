import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOrganizerRoles, OrganizerRole } from '@/hooks/use-organizer-roles'
import { Loader2 } from 'lucide-react'

interface RoleSelectorProps {
  value?: number | null
  onValueChange: (roleId: number | null) => void
  disabled?: boolean
  placeholder?: string
  showEmpty?: boolean
}

export function RoleSelector({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select a role',
  showEmpty = true,
}: RoleSelectorProps) {
  const { roles, isLoading } = useOrganizerRoles()
  const [selectedRole, setSelectedRole] = useState<number | null>(value || null)

  useEffect(() => {
    setSelectedRole(value || null)
  }, [value])

  const handleChange = (newValue: string) => {
    const roleId = newValue === 'none' ? null : parseInt(newValue, 10)
    setSelectedRole(roleId)
    onValueChange(roleId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  return (
    <Select
      value={selectedRole ? selectedRole.toString() : showEmpty ? 'none' : undefined}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showEmpty && (
          <SelectItem value="none">
            <span className="text-muted-foreground">No role</span>
          </SelectItem>
        )}
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id.toString()}>
            <div className="flex items-center justify-between w-full">
              <span>{role.name}</span>
              {role.is_system_role && (
                <span className="ml-2 text-xs text-muted-foreground">(System)</span>
              )}
            </div>
          </SelectItem>
        ))}
        {roles.length === 0 && (
          <SelectItem value="no-roles" disabled>
            No roles available
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}

