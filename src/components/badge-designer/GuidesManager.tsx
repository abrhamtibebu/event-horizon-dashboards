import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Grid, Ruler, Eye, EyeOff } from 'lucide-react'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'

export function GuidesManager() {
  const { canvasSize } = useBadgeStore()
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(10)
  const [showRulers, setShowRulers] = useState(true)
  const [snapToObjects, setSnapToObjects] = useState(true)
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Grid className="h-4 w-4" />
        <h3 className="font-semibold">Guides & Grid</h3>
      </div>
      
      <Separator />
      
      {/* Grid Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Grid</Label>
            <p className="text-xs text-muted-foreground">Display grid overlay on canvas</p>
          </div>
          <Switch
            checked={showGrid}
            onCheckedChange={setShowGrid}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Snap to Grid</Label>
            <p className="text-xs text-muted-foreground">Snap elements to grid points</p>
          </div>
          <Switch
            checked={snapToGrid}
            onCheckedChange={setSnapToGrid}
            disabled={!showGrid}
          />
        </div>
        
        {showGrid && (
          <div className="space-y-2">
            <Label>Grid Size: {gridSize}px</Label>
            <Input
              type="number"
              min={5}
              max={50}
              step={5}
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
            />
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* Rulers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          <Label className="font-semibold">Rulers</Label>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Rulers</Label>
            <p className="text-xs text-muted-foreground">Display rulers on canvas edges</p>
          </div>
          <Switch
            checked={showRulers}
            onCheckedChange={setShowRulers}
          />
        </div>
      </div>
      
      <Separator />
      
      {/* Snap Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <Label className="font-semibold">Snap Settings</Label>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Snap to Objects</Label>
            <p className="text-xs text-muted-foreground">Snap to other element edges</p>
          </div>
          <Switch
            checked={snapToObjects}
            onCheckedChange={setSnapToObjects}
          />
        </div>
      </div>
      
      <div className="pt-4 text-xs text-muted-foreground">
        <p>Canvas Size: {canvasSize.width} × {canvasSize.height}px</p>
      </div>
    </div>
  )
}





