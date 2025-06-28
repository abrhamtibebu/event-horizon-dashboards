import { useState, useEffect } from 'react'
import { PlusCircle, Edit, Trash2, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import api from '@/lib/api'

interface Type {
  id: number
  name: string
}

export default function EventTypeManager() {
  const [types, setTypes] = useState<Type[]>([])
  const [newTypeName, setNewTypeName] = useState('')
  const [editingType, setEditingType] = useState<Type | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchTypes = async () => {
    try {
      const response = await api.get('/event-types')
      setTypes(response.data)
    } catch (error) {
      toast.error('Failed to fetch event types.')
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  const handleCreateOrUpdate = async () => {
    if (!newTypeName.trim()) {
      toast.error('Type name cannot be empty.')
      return
    }

    try {
      if (editingType) {
        await api.put(`/event-types/${editingType.id}`, { name: newTypeName })
        toast.success('Type updated successfully!')
      } else {
        await api.post('/event-types', { name: newTypeName })
        toast.success('Type created successfully!')
      }
      fetchTypes()
      setIsDialogOpen(false)
      setNewTypeName('')
      setEditingType(null)
    } catch (error) {
      toast.error(`Failed to ${editingType ? 'update' : 'create'} type.`)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/event-types/${id}`)
      toast.success('Type deleted successfully!')
      fetchTypes()
    } catch (error) {
      toast.error('Failed to delete type.')
    }
  }

  const openEditDialog = (type: Type) => {
    setEditingType(type)
    setNewTypeName(type.name)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setEditingType(null)
    setNewTypeName('')
    setIsDialogOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-blue-600" />
          Manage Event Types
        </h3>
        <Button onClick={openNewDialog}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Type
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit' : 'Add'} Event Type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Type Name"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdate}>
                {editingType ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => (
              <TableRow key={type.id}>
                <TableCell>{type.name}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(type)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(type.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
