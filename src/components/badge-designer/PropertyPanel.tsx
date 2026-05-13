// Badge Designer Property Panel - Edit properties of selected elements
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { compressImage } from '@/lib/utils';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
  Copy,
} from 'lucide-react';
import type { DesignerElement, DynamicFieldKey } from '@/types/badge-designer';
import { FONT_FAMILIES, DYNAMIC_FIELD_LABELS, COLOR_PRESETS } from '@/types/badge-designer';

interface PropertyPanelProps {
  selectedElements: DesignerElement[];
  onUpdateElement: (id: string, updates: Partial<DesignerElement>) => void;
  onDeleteElements: (ids: string[]) => void;
  onDuplicateElements: (ids: string[]) => void;
  onMoveLayer: (id: string, dir: 'up' | 'down' | 'top' | 'bottom') => void;
}

// ── Color Picker ─────────────────────────────────────────────────────────────

const ColorInput: React.FC<{
  label: string;
  value: string;
  onChange: (color: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-border cursor-pointer p-0"
          style={{ appearance: 'none' }}
        />
      </div>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs font-mono flex-1"
        placeholder="#000000"
      />
    </div>
    {/* Quick presets */}
    <div className="flex flex-wrap gap-1">
      {COLOR_PRESETS.slice(0, 12).map((c) => (
        <button
          key={c}
          className="w-4 h-4 rounded-sm border border-border/50 hover:scale-125 transition-transform"
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  </div>
);

// ── Number Input ─────────────────────────────────────────────────────────────

const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, min = 0, max = 999, step = 1 }) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="h-8 text-xs"
    />
  </div>
);

// ── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="pt-3 pb-1">
    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {title}
    </h4>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedElements,
  onUpdateElement,
  onDeleteElements,
  onDuplicateElements,
  onMoveLayer,
}) => {
  if (selectedElements.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Select an element to edit its properties</p>
        <p className="text-xs mt-1">Click on any element on the canvas</p>
      </div>
    );
  }

  if (selectedElements.length > 1) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm font-medium">{selectedElements.length} elements selected</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicateElements(selectedElements.map((e) => e.id))}
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Duplicate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteElements(selectedElements.map((e) => e.id))}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>
    );
  }

  const el = selectedElements[0];
  const update = (updates: Partial<DesignerElement>) =>
    onUpdateElement(el.id, updates);

  return (
    <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Element Name */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Name</Label>
        <Input
          value={el.name}
          onChange={(e) => update({ name: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => update({ visible: !el.visible })}
        >
          {el.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => update({ locked: !el.locked })}
        >
          {el.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMoveLayer(el.id, 'top')}>
          <ChevronsUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMoveLayer(el.id, 'up')}>
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMoveLayer(el.id, 'down')}>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMoveLayer(el.id, 'bottom')}>
          <ChevronsDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Position & Size */}
      <SectionHeader title="Position & Size" />
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="X" value={Math.round(el.x)} onChange={(v) => update({ x: v })} />
        <NumberInput label="Y" value={Math.round(el.y)} onChange={(v) => update({ y: v })} />
        <NumberInput label="W" value={Math.round(el.width)} onChange={(v) => update({ width: v })} min={10} />
        <NumberInput label="H" value={Math.round(el.height)} onChange={(v) => update({ height: v })} min={10} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Rotation" value={el.rotation} onChange={(v) => update({ rotation: v })} min={-360} max={360} />
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Opacity</Label>
          <Slider
            value={[el.opacity * 100]}
            onValueChange={([v]) => update({ opacity: v / 100 })}
            min={0}
            max={100}
            step={1}
            className="mt-2"
          />
        </div>
      </div>

      {/* Text Properties */}
      {(el.type === 'text' || el.type === 'dynamicField') && (
        <>
          <SectionHeader title="Text" />

          {el.type === 'text' && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Content</Label>
              <textarea
                value={(el as any).content || ''}
                onChange={(e) => update({ content: e.target.value } as any)}
                className="w-full h-16 text-xs border border-border rounded-md p-2 bg-background resize-none"
              />
            </div>
          )}

          {el.type === 'dynamicField' && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Data Field</Label>
              <Select
                value={(el as any).fieldKey}
                onValueChange={(v) => update({ fieldKey: v as DynamicFieldKey, name: `Field: ${v}` } as any)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DYNAMIC_FIELD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Font</Label>
            <Select
              value={(el as any).fontFamily}
              onValueChange={(v) => update({ fontFamily: v } as any)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Size"
              value={(el as any).fontSize}
              onChange={(v) => update({ fontSize: v } as any)}
              min={6}
              max={120}
            />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Style</Label>
              <div className="flex gap-1">
                <Button
                  variant={(el as any).fontWeight === 'bold' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => update({ fontWeight: (el as any).fontWeight === 'bold' ? 'normal' : 'bold' } as any)}
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={(el as any).fontStyle === 'italic' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => update({ fontStyle: (el as any).fontStyle === 'italic' ? 'normal' : 'italic' } as any)}
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Alignment */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Alignment</Label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <Button
                  key={align}
                  variant={(el as any).textAlign === align ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => update({ textAlign: align } as any)}
                >
                  {align === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                  {align === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
                  {align === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                </Button>
              ))}
            </div>
          </div>

          <ColorInput
            label="Text Color"
            value={(el as any).color}
            onChange={(v) => update({ color: v } as any)}
          />
          <ColorInput
            label="Background"
            value={(el as any).backgroundColor}
            onChange={(v) => update({ backgroundColor: v } as any)}
          />
        </>
      )}

      {/* Shape Properties */}
      {el.type === 'shape' && (
        <>
          <SectionHeader title="Shape" />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Shape Type</Label>
            <Select
              value={(el as any).shapeType}
              onValueChange={(v) => update({ shapeType: v } as any)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle" className="text-xs">Rectangle</SelectItem>
                <SelectItem value="ellipse" className="text-xs">Ellipse</SelectItem>
                <SelectItem value="circle" className="text-xs">Circle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ColorInput label="Fill" value={(el as any).fill} onChange={(v) => update({ fill: v } as any)} />
          <ColorInput label="Stroke" value={(el as any).stroke} onChange={(v) => update({ stroke: v } as any)} />
          <NumberInput
            label="Stroke Width"
            value={(el as any).strokeWidth}
            onChange={(v) => update({ strokeWidth: v } as any)}
            min={0}
            max={20}
          />
          <NumberInput
            label="Corner Radius"
            value={(el as any).cornerRadius}
            onChange={(v) => update({ cornerRadius: v } as any)}
            min={0}
            max={100}
          />
        </>
      )}

      {/* QR Code Properties */}
      {el.type === 'qrCode' && (
        <>
          <SectionHeader title="QR Code" />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Data Source</Label>
            <Select
              value={(el as any).dataSource}
              onValueChange={(v) => update({ dataSource: v } as any)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendeeId" className="text-xs">Attendee ID</SelectItem>
                <SelectItem value="confirmationCode" className="text-xs">Confirmation Code</SelectItem>
                <SelectItem value="customUrl" className="text-xs">Custom URL</SelectItem>
                <SelectItem value="vCard" className="text-xs">vCard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(el as any).dataSource === 'customUrl' && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Custom Value</Label>
              <Input
                value={(el as any).customValue}
                onChange={(e) => update({ customValue: e.target.value } as any)}
                className="h-8 text-xs"
                placeholder="https://..."
              />
            </div>
          )}
          <ColorInput
            label="Foreground"
            value={(el as any).foregroundColor}
            onChange={(v) => update({ foregroundColor: v } as any)}
          />
          <ColorInput
            label="Background"
            value={(el as any).backgroundColor}
            onChange={(v) => update({ backgroundColor: v } as any)}
          />
        </>
      )}

      {/* Image Properties */}
      {el.type === 'image' && (
        <>
          <SectionHeader title="Image" />
          {/* Image Preview */}
          {(el as any).src && (
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30 aspect-video">
              <img
                src={(el as any).src}
                alt="Element preview"
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          {/* Upload Button */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Upload Image</Label>
            <div
              className="relative border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer group"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (event) => {
                  const file = (event.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    alert('Image must be under 5MB');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = async (ev) => {
                    const dataUrl = ev.target?.result as string;
                    if (dataUrl) {
                      const compressed = await compressImage(dataUrl);
                      update({ src: compressed } as any);
                    }
                  };
                  reader.readAsDataURL(file);
                };
                input.click();
              }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/5'); }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-primary/5'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                const file = e.dataTransfer.files[0];
                if (!file || !file.type.startsWith('image/')) return;
                if (file.size > 5 * 1024 * 1024) {
                  alert('Image must be under 5MB');
                  return;
                }
                const reader = new FileReader();
                reader.onload = async (ev) => {
                  const dataUrl = ev.target?.result as string;
                  if (dataUrl) {
                    const compressed = await compressImage(dataUrl);
                    update({ src: compressed } as any);
                  }
                };
                reader.readAsDataURL(file);
              }}
            >
              <div className="text-xs font-medium text-muted-foreground group-hover:text-primary">
                Click or drop image here
              </div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">PNG, JPG, SVG · Max 5MB</div>
            </div>
          </div>
          {/* URL Input */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Or paste URL</Label>
            <Input
              value={(el as any).src}
              onChange={(e) => update({ src: e.target.value } as any)}
              className="h-8 text-xs"
              placeholder="https://..."
            />
          </div>
          {/* Clear Image */}
          {(el as any).src && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-destructive"
              onClick={() => update({ src: '' } as any)}
            >
              Remove Image
            </Button>
          )}
          {/* Object Fit */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fit Mode</Label>
            <Select
              value={(el as any).objectFit || 'cover'}
              onValueChange={(v) => update({ objectFit: v } as any)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover (fill)</SelectItem>
                <SelectItem value="contain">Contain (fit)</SelectItem>
                <SelectItem value="fill">Stretch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberInput
            label="Border Radius"
            value={(el as any).borderRadius}
            onChange={(v) => update({ borderRadius: v } as any)}
            min={0}
            max={200}
          />
          <ColorInput
            label="Border Color"
            value={(el as any).borderColor || '#d1d5db'}
            onChange={(v) => update({ borderColor: v } as any)}
          />
          <NumberInput
            label="Border Width"
            value={(el as any).borderWidth || 0}
            onChange={(v) => update({ borderWidth: v } as any)}
            min={0}
            max={20}
          />
        </>
      )}

      {/* Delete / Duplicate */}
      <SectionHeader title="Actions" />
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onDuplicateElements([el.id])}
        >
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Duplicate
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={() => onDeleteElements([el.id])}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default PropertyPanel;
