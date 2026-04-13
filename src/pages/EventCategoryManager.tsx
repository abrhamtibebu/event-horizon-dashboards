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
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import api from '@/lib/api'

interface Category {
  id: number
  name: string
  events_count: number
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
      toast.error('Failed to delete category. It might be in use.')
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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Tag className="w-6 h-6 text-purple-600" />
          Manage Event Categories
        </h3>
        <Button onClick={openNewDialog} className="bg-purple-600 hover:bg-purple-700">
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
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Name</label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Music, Technology..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdate} className="bg-purple-600 hover:bg-purple-700">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="text-center font-bold">Usage</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id} className="hover:bg-muted/30">
                <TableCell className="font-medium text-[16px]">{category.name}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
                    {category.events_count || 0} Events
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(category)}
                      className="hover:text-purple-600 hover:bg-purple-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone if it's not in use.`)) {
                          handleDelete(category.id);
                        }
                      }}
                      className="hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
