// Badge Designer Toolbar - Element insertion, tools, undo/redo, zoom
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MousePointer2,
  Type,
  Image,
  QrCode,
  Square,
  Minus,
  Undo2,
  Redo2,
  Grid3X3,
  Magnet,
  ZoomIn,
  ZoomOut,
  Hash,
  Trash2,
  Copy,
  Layers,
} from 'lucide-react';
import type { DesignerTool, BadgeSizeKey, DynamicFieldKey } from '@/types/badge-designer';
import { BADGE_SIZES, DYNAMIC_FIELD_LABELS } from '@/types/badge-designer';

interface DesignerToolbarProps {
  activeTool: DesignerTool;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  badgeSize: BadgeSizeKey;
  activeSide: 'front' | 'back';
  selectedCount: number;
  onSetTool: (tool: DesignerTool) => void;
  onSetZoom: (zoom: number) => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSetBadgeSize: (size: BadgeSizeKey) => void;
  onSetActiveSide: (side: 'front' | 'back') => void;
  onAddText: () => void;
  onAddDynamicField: (fieldKey: DynamicFieldKey) => void;
  onAddImage: () => void;
  onAddQRCode: () => void;
  onAddShape: (shapeType: 'rectangle' | 'ellipse' | 'circle') => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
}

const ToolButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ icon, label, isActive, onClick, disabled }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant={isActive ? 'default' : 'ghost'}
        size="icon"
        className={`h-8 w-8 ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={onClick}
        disabled={disabled}
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">
      {label}
    </TooltipContent>
  </Tooltip>
);

const Separator = () => <div className="h-6 w-px bg-border mx-1" />;

const DesignerToolbar: React.FC<DesignerToolbarProps> = ({
  activeTool,
  zoom,
  showGrid,
  snapToGrid,
  canUndo,
  canRedo,
  badgeSize,
  activeSide,
  selectedCount,
  onSetTool,
  onSetZoom,
  onToggleGrid,
  onToggleSnap,
  onUndo,
  onRedo,
  onSetBadgeSize,
  onSetActiveSide,
  onAddText,
  onAddDynamicField,
  onAddImage,
  onAddQRCode,
  onAddShape,
  onDeleteSelected,
  onDuplicateSelected,
}) => {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-lg shadow-sm flex-wrap">
      {/* Badge Size */}
      <Select value={badgeSize} onValueChange={(v) => onSetBadgeSize(v as BadgeSizeKey)}>
        <SelectTrigger className="h-8 w-[165px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(BADGE_SIZES).map(([key, val]) => (
            <SelectItem key={key} value={key} className="text-xs">
              {val.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Front/Back */}
      <div className="flex items-center bg-muted rounded-md p-0.5">
        <Button
          variant={activeSide === 'front' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs px-3"
          onClick={() => onSetActiveSide('front')}
        >
          Front
        </Button>
        <Button
          variant={activeSide === 'back' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs px-3"
          onClick={() => onSetActiveSide('back')}
        >
          Back
        </Button>
      </div>

      <Separator />

      {/* Tools */}
      <ToolButton
        icon={<MousePointer2 className="h-4 w-4" />}
        label="Select (V)"
        isActive={activeTool === 'select'}
        onClick={() => onSetTool('select')}
      />

      <Separator />

      {/* Insert Elements */}
      <ToolButton
        icon={<Type className="h-4 w-4" />}
        label="Add Text"
        onClick={onAddText}
      />
      <ToolButton
        icon={<Hash className="h-4 w-4" />}
        label="Add Dynamic Field"
        onClick={() => onAddDynamicField('fullName')}
      />
      <ToolButton
        icon={<Image className="h-4 w-4" />}
        label="Add Image"
        onClick={onAddImage}
      />
      <ToolButton
        icon={<QrCode className="h-4 w-4" />}
        label="Add QR Code"
        onClick={onAddQRCode}
      />
      <ToolButton
        icon={<Square className="h-4 w-4" />}
        label="Add Rectangle"
        onClick={() => onAddShape('rectangle')}
      />

      <Separator />

      {/* Selection Actions */}
      <ToolButton
        icon={<Copy className="h-4 w-4" />}
        label="Duplicate"
        onClick={onDuplicateSelected}
        disabled={selectedCount === 0}
      />
      <ToolButton
        icon={<Trash2 className="h-4 w-4" />}
        label="Delete"
        onClick={onDeleteSelected}
        disabled={selectedCount === 0}
      />

      <Separator />

      {/* Undo/Redo */}
      <ToolButton
        icon={<Undo2 className="h-4 w-4" />}
        label="Undo (Ctrl+Z)"
        onClick={onUndo}
        disabled={!canUndo}
      />
      <ToolButton
        icon={<Redo2 className="h-4 w-4" />}
        label="Redo (Ctrl+Y)"
        onClick={onRedo}
        disabled={!canRedo}
      />

      <Separator />

      {/* Canvas Controls */}
      <ToolButton
        icon={<Grid3X3 className="h-4 w-4" />}
        label="Toggle Grid"
        isActive={showGrid}
        onClick={onToggleGrid}
      />
      <ToolButton
        icon={<Magnet className="h-4 w-4" />}
        label="Snap to Grid"
        isActive={snapToGrid}
        onClick={onToggleSnap}
      />

      <Separator />

      {/* Zoom */}
      <ToolButton
        icon={<ZoomOut className="h-4 w-4" />}
        label="Zoom Out"
        onClick={() => onSetZoom(zoom - 0.1)}
      />
      <span className="text-xs text-muted-foreground font-mono w-10 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <ToolButton
        icon={<ZoomIn className="h-4 w-4" />}
        label="Zoom In"
        onClick={() => onSetZoom(zoom + 0.1)}
      />
    </div>
  );
};

export default DesignerToolbar;
