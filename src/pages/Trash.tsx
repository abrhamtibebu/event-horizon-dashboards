import React, { useState, useEffect } from 'react'
import {
  Trash2,
  RotateCcw,
  Search,
  MoreHorizontal,
  Calendar,
  Building,
  Users,
  User,
  Tag,
  Folder,
  UserCheck,
  UserCheck2,
  X,
  RefreshCw,
  Trash,
  Eye,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { format, formatDistanceToNow } from 'date-fns'

interface TrashItem {
  id: number
  name?: string
  email?: string
  location?: string
  start_date?: string
  end_date?: string
  phone?: string
  company?: string
  role?: string
  tin_number?: string
  description?: string
  deleted_at: string
  organizer?: { name: string; email: string }
  eventType?: { name: string }
  eventCategory?: { name: string }
  event?: { name: string }
  guest?: { name: string; email: string }
  guestType?: { name: string }
  users?: Array<{ name: string; email: string }>
}

interface TrashCategory {
  key: string
  title: string
  icon: string
  count: number
}

interface TrashData {
  categories: TrashCategory[]
  total_items: number
}

const iconMap: Record<string, React.ReactNode> = {
  calendar: <Calendar className="h-4 w-4" />,
  building: <Building className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  tag: <Tag className="h-4 w-4" />,
  folder: <Folder className="h-4 w-4" />,
  'user-check': <UserCheck className="h-4 w-4" />,
  'user-tag': <UserCheck2 className="h-4 w-4" />,
}

// PAGE 1: Category Selection View
function TrashCategoryList({
  categories,
  totalItems,
  onSelectCategory,
}: {
  categories: TrashCategory[]
  totalItems: number
  onSelectCategory: (category: string) => void
}) {
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trash</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage deleted items and restore or permanently delete them
              </p>
            </div>
            <Button variant="destructive" size="lg">
              <Trash2 className="h-5 w-5 mr-2" />
              Empty Trash ({totalItems})
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No deleted items
              </h3>
              <p className="text-gray-500">There are no items in the trash.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Card
                key={cat.key}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20"
                onClick={() => onSelectCategory(cat.key)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {iconMap[cat.icon] || <Trash2 className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {cat.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {cat.count} item{cat.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// PAGE 2: Category Details View
function TrashCategoryDetails({
  selectedCategory,
  onBack,
}: {
  selectedCategory: string
  onBack: () => void
}) {
  const [categoryInfo, setCategoryInfo] = useState<TrashCategory | null>(null)
  const [items, setItems] = useState<TrashItem[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategoryItems()
    // eslint-disable-next-line
  }, [selectedCategory, search])

  async function fetchCategoryItems() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ category: selectedCategory })
      if (search) params.append('search', search)
      const res = await api.get(`/trash?${params}`)
      setCategoryInfo(res.data.category)
      setItems(res.data.items.data || [])
      setSelectedItems([])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load items',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleSelectItem(id: number) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function handleSelectAll() {
    if (selectedItems.length === items.length) setSelectedItems([])
    else setSelectedItems(items.map((i) => i.id))
  }

  function clearSelection() {
    setSelectedItems([])
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Categories
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {iconMap[categoryInfo?.icon || ''] || (
                    <Trash2 className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {categoryInfo?.title || 'Category Details'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {items.length} item{items.length !== 1 ? 's' : ''} in this
                    category
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {items.length} items
            </Badge>
          </div>
        </div>

        {/* Search and Actions Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {search && (
              <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                Clear
              </Button>
            )}
          </div>

          {/* Action Bar for Selected Items */}
          {selectedItems.length > 0 && (
            <div
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 shadow-md"
              style={{ minHeight: '64px' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.length} item
                  {selectedItems.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex flex-col xs:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full xs:w-auto"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    <span className="hidden xs:inline">Restore</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full xs:w-auto"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    <span className="hidden xs:inline">Delete Permanently</span>
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading items...</p>
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {search ? 'No items found' : 'No items in this category'}
                </h3>
                <p className="text-gray-500">
                  {search
                    ? 'Try adjusting your search terms.'
                    : 'All items in this category have been restored or permanently deleted.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Select All Bar */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={
                      selectedItems.length === items.length && items.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select all ({items.length} items)
                  </span>
                </div>
                {selectedItems.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {selectedItems.length} selected
                  </span>
                )}
              </div>

              {/* Items */}
              {items.map((item) => (
                <Card
                  key={item.id}
                  className={`transition-all duration-200 ${
                    selectedItems.includes(item.id)
                      ? 'ring-2 ring-primary bg-primary/5 border-primary/20'
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => handleSelectItem(item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {item.name || item.email || `Item #${item.id}`}
                          </h4>
                          <p className="text-sm text-gray-500 truncate">
                            {item.email || item.location || item.company || ''}
                          </p>
                          <p className="text-xs text-gray-400">
                            Deleted{' '}
                            {formatDistanceToNow(new Date(item.deleted_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash className="h-4 w-4 mr-2" />
                              Delete Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Component
const Trash: React.FC = () => {
  const [categories, setCategories] = useState<TrashCategory[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedCategory) {
      fetchCategories()
    }
    // eslint-disable-next-line
  }, [selectedCategory])

  async function fetchCategories() {
    setLoading(true)
    try {
      const res = await api.get('/trash')
      setCategories(res.data.categories || [])
      setTotalItems(res.data.total_items || 0)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Render the appropriate view
  if (selectedCategory) {
    return (
      <TrashCategoryDetails
        selectedCategory={selectedCategory}
        onBack={() => setSelectedCategory(null)}
      />
    )
  }

  return (
    <TrashCategoryList
      categories={categories}
      totalItems={totalItems}
      onSelectCategory={setSelectedCategory}
    />
  )
}

export default Trash
