import { useState, useEffect } from 'react'
import { PlusCircle, Edit, Trash2, Tag } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import api from '@/lib/api'

interface Category {
  id: number
  name: string
}

export default function EventCategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchCategories = async () => {
    try {
      const response = await api.get('/event-categories')
      setCategories(response.data)
    } catch (error) {
      toast.error('Failed to fetch event categories.')
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreateOrUpdate = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name cannot be empty.')
      return
    }

    try {
      if (editingCategory) {
        // Update
        await api.put(`/event-categories/${editingCategory.id}`, {
          name: newCategoryName,
        })
        toast.success('Category updated successfully!')
      } else {
        // Create
        await api.post('/event-categories', { name: newCategoryName })
        toast.success('Category created successfully!')
      }
      fetchCategories()
      setIsDialogOpen(false)
      setNewCategoryName('')
      setEditingCategory(null)
    } catch (error) {
      toast.error(
        `Failed to ${editingCategory ? 'update' : 'create'} category.`
      )
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/event-categories/${id}`)
      toast.success('Category deleted successfully!')
      fetchCategories()
    } catch (error) {
      toast.error('Failed to delete category.')
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setEditingCategory(null)
    setNewCategoryName('')
    setIsDialogOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Tag className="w-6 h-6 text-purple-600" />
          Manage Event Categories
        </h3>
        <Button onClick={openNewDialog}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit' : 'Add'} Event Category
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category Name"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdate}>
                {editingCategory ? 'Update' : 'Create'}
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
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
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
