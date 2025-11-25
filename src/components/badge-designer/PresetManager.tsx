import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Palette, Type, Layout, Save } from 'lucide-react'
import { useBadgeStore } from '@/lib/badge-designer/store/useBadgeStore'
import { toast } from 'sonner'
import { TEXT_STYLE_PRESETS, FONT_PAIRINGS } from '@/lib/badge-designer/utils/typography'

export function PresetManager() {
  const { elements, activeElementId, updateElement } = useBadgeStore()
  const activeElement = elements.find(el => el.id === activeElementId)
  
  const applyTextPreset = (preset: typeof TEXT_STYLE_PRESETS[0]) => {
    if (!activeElement || activeElement.type !== 'text') {
      toast.error('Select a text element to apply preset')
      return
    }
    
    updateElement(activeElementId!, {
      properties: {
        fontSize: preset.fontSize,
        fontFamily: preset.fontFamily,
        fontWeight: preset.fontWeight,
        fontStyle: preset.fontStyle,
        lineHeight: preset.lineHeight,
        letterSpacing: preset.letterSpacing,
        fill: preset.color,
      },
    })
    toast.success(`Applied ${preset.name} style`)
  }
  
  const applyColorScheme = (scheme: { primary: string; secondary: string; accent: string }) => {
    elements.forEach(el => {
      if (el.type === 'text' || el.type === 'shape') {
        // Apply color scheme to elements
        if (el.properties.fill) {
          updateElement(el.id, {
            properties: {
              fill: scheme.primary,
            },
          }, true)
        }
      }
    })
    toast.success('Applied color scheme')
  }
  
  const colorSchemes = [
    {
      name: 'Professional Blue',
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
    },
    {
      name: 'Elegant Purple',
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#c4b5fd',
    },
    {
      name: 'Modern Green',
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
    },
    {
      name: 'Warm Orange',
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fb923c',
    },
  ]
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Save className="h-4 w-4" />
        <h3 className="font-semibold">Design Presets</h3>
      </div>
      
      <Separator />
      
      {/* Text Style Presets */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          <Label className="font-semibold">Text Styles</Label>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {TEXT_STYLE_PRESETS.map(preset => (
            <Card
              key={preset.name}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => applyTextPreset(preset)}
            >
              <CardContent className="p-3">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">{preset.name}</h4>
                  <p
                    className="text-xs"
                    style={{
                      fontFamily: preset.fontFamily,
                      fontSize: `${preset.fontSize * 0.5}px`,
                      fontWeight: preset.fontWeight,
                      color: preset.color,
                    }}
                  >
                    Sample Text
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Separator />
      
      {/* Color Schemes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <Label className="font-semibold">Color Schemes</Label>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {colorSchemes.map(scheme => (
            <Card
              key={scheme.name}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => applyColorScheme(scheme)}
            >
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm mb-2">{scheme.name}</h4>
                <div className="flex gap-1">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: scheme.primary }}
                    title="Primary"
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: scheme.secondary }}
                    title="Secondary"
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: scheme.accent }}
                    title="Accent"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Separator />
      
      {/* Font Pairings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          <Label className="font-semibold">Font Pairings</Label>
        </div>
        
        <div className="space-y-2">
          {FONT_PAIRINGS.map((pairing, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-3">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm" style={{ fontFamily: pairing.heading }}>
                    Heading Font: {pairing.heading}
                  </h4>
                  <p className="text-xs" style={{ fontFamily: pairing.body }}>
                    Body Font: {pairing.body}
                  </p>
                  <p className="text-xs text-muted-foreground">{pairing.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}





