// Badge Designer Layers Panel - Visual layer ordering of elements
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Type,
  Hash,
  Image,
  QrCode,
  Square,
  Minus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DesignerElement } from '@/types/badge-designer';

interface LayersPanelProps {
  elements: DesignerElement[];
  selectedElementIds: string[];
  onSelectElement: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<DesignerElement>) => void;
}

const elementIcons: Record<string, React.ReactNode> = {
  text: <Type className="h-3.5 w-3.5" />,
  dynamicField: <Hash className="h-3.5 w-3.5" />,
  image: <Image className="h-3.5 w-3.5" />,
  qrCode: <QrCode className="h-3.5 w-3.5" />,
  barcode: <Minus className="h-3.5 w-3.5" />,
  shape: <Square className="h-3.5 w-3.5" />,
  line: <Minus className="h-3.5 w-3.5" />,
};

const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElementIds,
  onSelectElement,
  onUpdateElement,
}) => {
  // Show elements from top (highest z) to bottom (lowest z)
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="space-y-1">
      <div className="px-3 py-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Layers ({elements.length})
        </h3>
      </div>

      {sorted.length === 0 && (
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-muted-foreground">No elements yet</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Add elements from the toolbar
          </p>
        </div>
      )}

      <div className="space-y-0.5 px-1">
        {sorted.map((el) => {
          const isSelected = selectedElementIds.includes(el.id);
          return (
            <div
              key={el.id}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors group text-xs',
                isSelected
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'hover:bg-muted/60 text-foreground border border-transparent'
              )}
              onClick={() => onSelectElement([el.id])}
            >
              <span className="text-muted-foreground/40 group-hover:text-muted-foreground">
                <GripVertical className="h-3 w-3" />
              </span>

              <span className={cn(
                'flex-shrink-0',
                el.type === 'dynamicField' ? 'text-indigo-500' : 'text-muted-foreground'
              )}>
                {elementIcons[el.type] || <Square className="h-3.5 w-3.5" />}
              </span>

              <span className="flex-1 truncate font-medium">{el.name}</span>

              {/* Visibility toggle */}
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateElement(el.id, { visible: !el.visible });
                }}
              >
                {el.visible ? (
                  <Eye className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-3 w-3 text-muted-foreground/50" />
                )}
              </button>

              {/* Lock toggle */}
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateElement(el.id, { locked: !el.locked });
                }}
              >
                {el.locked ? (
                  <Lock className="h-3 w-3 text-amber-500" />
                ) : (
                  <Unlock className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayersPanel;
