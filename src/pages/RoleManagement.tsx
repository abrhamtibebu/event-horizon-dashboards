import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Shield, Users, Settings, Sparkles, Info, CheckCircle2 } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { useOrganizerRoles, OrganizerRole } from '@/hooks/use-organizer-roles'
import { PermissionMatrix } from '@/components/PermissionMatrix'
import { useModernAlerts } from '@/hooks/useModernAlerts'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

export default function RoleManagement() {
  const { roles, isLoading, createRole, updateRole, deleteRole, assignPermissions } =
    useOrganizerRoles()
  const { showSuccess, showError } = useModernAlerts()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)

  const [selectedRole, setSelectedRole] = useState<OrganizerRole | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = () => {
    setFormData({ name: '', description: '' })
    setSelectedPermissions([])
    setSelectedRole(null)
    setCreateDialogOpen(true)
  }

  const handleEdit = (role: OrganizerRole) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description || '',
    })
    setSelectedPermissions(role.permissions?.map((p) => p.permission) || [])
    setEditDialogOpen(true)
  }

  const handleDelete = (role: OrganizerRole) => {
    setSelectedRole(role)
    setDeleteDialogOpen(true)
  }

  const handlePermissions = (role: OrganizerRole) => {
    setSelectedRole(role)
    setSelectedPermissions(role.permissions?.map((p) => p.permission) || [])
    setPermissionsDialogOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await createRole({
        name: formData.name,
        description: formData.description,
        permissions: selectedPermissions,
      })
      showSuccess('Success', 'Role created successfully!')
      setCreateDialogOpen(false)
      setFormData({ name: '', description: '' })
      setSelectedPermissions([])
    } catch (error: any) {
      showError('Error', error.message || 'Failed to create role')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return

    setSubmitting(true)

    try {
      await updateRole(selectedRole.id, {
        name: formData.name,
        description: formData.description,
      })
      showSuccess('Success', 'Role updated successfully!')
      setEditDialogOpen(false)
      setSelectedRole(null)
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update role')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRole) return

    setSubmitting(true)

    try {
      await deleteRole(selectedRole.id)
      showSuccess('Success', 'Role deleted successfully!')
      setDeleteDialogOpen(false)
      setSelectedRole(null)
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete role')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePermissionsSave = async () => {
    if (!selectedRole) return

    setSubmitting(true)

    try {
      await assignPermissions(selectedRole.id, selectedPermissions)
      showSuccess('Success', 'Permissions updated successfully!')
      setPermissionsDialogOpen(false)
      setSelectedRole(null)
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update permissions')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Role Management', href: '/dashboard/role-management' },
            ]}
          />
          <h1 className="text-3xl font-bold mt-2">Role Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage custom roles for your team members
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {role.name}
                    {role.is_system_role && (
                      <Badge variant="secondary" className="ml-2">
                        System
                      </Badge>
                    )}
                  </CardTitle>
                  {role.description && (
                    <CardDescription className="mt-1">{role.description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{role.users_count || 0} users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    <span>{role.permissions?.length || 0} permissions</span>
                  </div>
                </div>

                {!role.is_system_role && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(role)}
                      className="flex-1"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePermissions(role)}
                      className="flex-1"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Permissions
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(role)}
                      disabled={role.users_count && role.users_count > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {roles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No roles yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first custom role to get started
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>
        )}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border px-6 py-5">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold">Create New Role</DialogTitle>
                  <DialogDescription className="text-base mt-1">
                    Define a custom role with specific permissions for your team members
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-hide">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                      Role Name
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Event Manager, Marketing Lead, Operations Coordinator"
                        required
                        className="h-11 pl-4 pr-4 text-base border-2 focus:border-primary transition-colors"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Choose a clear, descriptive name for this role
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description" className="text-sm font-semibold">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the responsibilities and scope of this role. This helps team members understand what this role entails."
                      rows={4}
                      className="resize-none border-2 focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Provide context about when and why this role should be used
                    </p>
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-semibold">Permissions</h3>
                  </div>
                  {selectedPermissions.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="rounded-lg border-2 border-border bg-muted/30 p-1">
                  <PermissionMatrix
                    selectedPermissions={selectedPermissions}
                    onPermissionsChange={setSelectedPermissions}
                  />
                </div>
                
                {selectedPermissions.length === 0 && (
                  <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 border border-dashed border-border">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Select permissions above to define what users with this role can access
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={submitting}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || !formData.name.trim()}
                className="min-w-[140px] bg-primary hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Role
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role name and description</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Spinner className="mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Select the permissions for this role. Users with this role will have access to the
              selected features.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PermissionMatrix
              selectedPermissions={selectedPermissions}
              onPermissionsChange={setSelectedPermissions}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPermissionsDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handlePermissionsSave} disabled={submitting}>
              {submitting ? <Spinner className="mr-2" /> : null}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role &quot;{selectedRole?.name}&quot;? This action
              cannot be undone.
              {selectedRole?.users_count && selectedRole.users_count > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This role is assigned to {selectedRole.users_count} user(s). You must
                  remove all assignments before deleting.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={submitting || (selectedRole?.users_count && selectedRole.users_count > 0)}
              className="bg-destructive text-destructive-foreground"
            >
              {submitting ? <Spinner className="mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

