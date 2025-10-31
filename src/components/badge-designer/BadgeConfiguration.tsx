import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const BADGE_SIZES = [
  { value: '400x600', label: 'Small (400 x 600)', width: 400, height: 600 },
  { value: '500x750', label: 'Medium (500 x 750)', width: 500, height: 750 },
  { value: '600x900', label: 'Large (600 x 900)', width: 600, height: 900 },
  { value: 'custom', label: 'Custom Size', width: 400, height: 600 },
]

export function BadgeConfiguration() {
  const {
    badgeType,
    setBadgeType,
    currentSide,
    setCurrentSide,
    canvasSize,
    setCanvasSize,
    backgroundImage,
    setBackgroundImage,
  } = useBadgeStore()

  const frontFileInputRef = useRef<HTMLInputElement>(null)
  const backFileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState<'front' | 'back' | null>(null)
  const [loading, setLoading] = useState<'front' | 'back' | null>(null)

  const handleSizeChange = (value: string) => {
    const size = BADGE_SIZES.find((s) => s.value === value)
    if (size && size.value !== 'custom') {
      setCanvasSize({ width: size.width, height: size.height })
    }
  }

  const handleBackgroundUpload = async (file: File, side: 'front' | 'back') => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, GIF, WebP)')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setLoading(side)
    
    try {
      // Convert to base64 Data URL
      const dataURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          if (result) {
            resolve(result)
          } else {
            reject(new Error('Failed to read file'))
          }
        }
        reader.onerror = () => reject(new Error('Error reading file'))
        reader.readAsDataURL(file)
      })

      // Validate that the image can be loaded
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Invalid image file'))
        img.src = dataURL
      })

      // Set the background image
      setBackgroundImage(side, dataURL)
      toast.success(`${side === 'front' ? 'Front' : 'Back'} background uploaded successfully`)
    } catch (error) {
      console.error('Error uploading background:', error)
      toast.error('Failed to upload background image')
    } finally {
      setLoading(null)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (file) {
      handleBackgroundUpload(file, side)
    }
  }

  const handleDrag = (e: React.DragEvent, side: 'front' | 'back') => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(side)
    } else if (e.type === 'dragleave') {
      setDragActive(null)
    }
  }

  const handleDrop = (e: React.DragEvent, side: 'front' | 'back') => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(null)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleBackgroundUpload(file, side)
    }
  }

  const removeBackground = (side: 'front' | 'back') => {
    setBackgroundImage(side, null)
    toast.success(`${side === 'front' ? 'Front' : 'Back'} background removed`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Badge Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badge Type */}
        <div className="space-y-2">
          <Label>Badge Type</Label>
          <Select value={badgeType} onValueChange={(value: 'single' | 'double') => setBadgeType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Sided</SelectItem>
              <SelectItem value="double">Double Sided (Front & Back)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Badge Size */}
        <div className="space-y-2">
          <Label>Badge Size</Label>
          <Select
            value={BADGE_SIZES.find((s) => s.width === canvasSize.width && s.height === canvasSize.height)?.value || 'custom'}
            onValueChange={handleSizeChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BADGE_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Current: {canvasSize.width} x {canvasSize.height}px
          </p>
        </div>

        <Separator />

        {/* Current Side Selection (for double-sided) */}
        {badgeType === 'double' && (
          <div className="space-y-2">
            <Label>Editing Side</Label>
            <div className="flex gap-2">
              <Button
                variant={currentSide === 'front' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentSide('front')}
                className="flex-1"
              >
                Front
              </Button>
              <Button
                variant={currentSide === 'back' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentSide('back')}
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Background Image Upload - Front */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Front Background</Label>
            {backgroundImage.front && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeBackground('front')}
                className="h-6 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
              dragActive === 'front' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } ${backgroundImage.front ? 'bg-gray-50' : ''}`}
            onDragEnter={(e) => handleDrag(e, 'front')}
            onDragLeave={(e) => handleDrag(e, 'front')}
            onDragOver={(e) => handleDrag(e, 'front')}
            onDrop={(e) => handleDrop(e, 'front')}
          >
            {loading === 'front' ? (
              <div className="text-center py-8">
                <Loader2 className="mx-auto h-8 w-8 text-blue-600 animate-spin mb-2" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : backgroundImage.front ? (
              <div className="relative">
                <img
                  src={backgroundImage.front}
                  alt="Front background"
                  className="w-full h-32 object-cover rounded"
                />
                <Badge className="absolute top-1 right-1" variant="secondary">
                  Front
                </Badge>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag & drop or click to upload
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => frontFileInputRef.current?.click()}
                  disabled={loading === 'front'}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            )}
          </div>
          <input
            ref={frontFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileInput(e, 'front')}
          />
        </div>

        {/* Background Image Upload - Back (only for double-sided) */}
        {badgeType === 'double' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Back Background</Label>
              {backgroundImage.back && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBackground('back')}
                  className="h-6 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div
              className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                dragActive === 'back' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              } ${backgroundImage.back ? 'bg-gray-50' : ''}`}
              onDragEnter={(e) => handleDrag(e, 'back')}
              onDragLeave={(e) => handleDrag(e, 'back')}
              onDragOver={(e) => handleDrag(e, 'back')}
              onDrop={(e) => handleDrop(e, 'back')}
            >
              {loading === 'back' ? (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-8 w-8 text-blue-600 animate-spin mb-2" />
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              ) : backgroundImage.back ? (
                <div className="relative">
                  <img
                    src={backgroundImage.back}
                    alt="Back background"
                    className="w-full h-32 object-cover rounded"
                  />
                  <Badge className="absolute top-1 right-1" variant="secondary">
                    Back
                  </Badge>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag & drop or click to upload
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => backFileInputRef.current?.click()}
                    disabled={loading === 'back'}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={backFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileInput(e, 'back')}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

