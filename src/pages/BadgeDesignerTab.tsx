import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group, Circle, Line } from 'react-konva';
import { BadgeElement, ElementType } from '../types/badge';
import { Badge } from '@/components/ui/badge';
import useImage from 'use-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getGuestTypeBadgeClasses, GUEST_TYPE_COLORS } from '@/lib/utils';
import { 
  Save, 
  Download, 
  Undo, 
  Redo, 
  Copy, 
  Trash2, 
  Layers, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Minus,
  Eye,
  EyeOff,
  RotateCw,
  Move,
  Maximize2,
  Minimize2
} from 'lucide-react';

const PALETTE_ELEMENTS: { type: ElementType; label: string; icon: string; shapeType?: string }[] = [
  { type: 'text', label: 'Text', icon: '🅣' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'shape', label: 'Rectangle', icon: '⬛', shapeType: 'rectangle' },
  { type: 'shape', label: 'Circle', icon: '⭕', shapeType: 'circle' },
  { type: 'shape', label: 'Line', icon: '➖', shapeType: 'line' },
];

const CANVAS_WIDTH = 400; // 4 inches = 400 points (100mm)
const CANVAS_HEIGHT = 400; // 4 inches = 400 points (100mm)

function getDefaultElement(type: ElementType, shapeType?: string): BadgeElement {
  const id = `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        x: 50,
        y: 50,
        width: 120,
        height: 40,
        rotation: 0,
        zIndex: 0,
        content: 'Sample Text',
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#222',
        textAlign: 'center',
      } as BadgeElement;
    case 'image':
      return {
        id,
        type: 'image',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 0,
        src: '',
      } as BadgeElement;
    case 'shape':
      return {
        id,
        type: 'shape',
        x: 80,
        y: 120,
        width: shapeType === 'line' ? 100 : 120,
        height: shapeType === 'line' ? 2 : 60,
        rotation: 0,
        zIndex: 0,
        shapeType: shapeType || 'rectangle',
        backgroundColor: '#4F46E5',
        borderColor: '#222',
        borderWidth: 2,
      } as BadgeElement;
    default:
      throw new Error('Unknown type');
  }
}

const KonvaImageElement: React.FC<{ el: BadgeElement; isSelected: boolean; onSelect: () => void; onChange: (attrs: any) => void; }> = ({ el, isSelected, onSelect, onChange }) => {
  if (el.type !== 'image') return null;
  const [image] = useImage(el.src || '');
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  return (
    <>
      <KonvaImage
        ref={shapeRef}
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        rotation={el.rotation}
        image={image}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={e => onChange({ ...el, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={e => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          onChange({
            ...el,
            x: node.x(),
            y: node.y(),
            width: Math.max(20, node.width() * scaleX),
            height: Math.max(20, node.height() * scaleY),
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
        shadowForStrokeEnabled
        shadowBlur={isSelected ? 10 : 0}
        shadowColor={isSelected ? '#6366F1' : undefined}
      />
      {isSelected && <Transformer ref={trRef} rotateEnabled={true} />}
    </>
  );
};

const BadgeDesignerTab: React.FC = () => {
  const [elements, setElements] = useState<BadgeElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<ElementType | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [pendingType, setPendingType] = useState<ElementType | null>(null);
  const [pendingProps, setPendingProps] = useState<any>({});
  
  // Enhanced state for better UX
  const [history, setHistory] = useState<BadgeElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showLayers, setShowLayers] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [templateName, setTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Enhanced history management
  const saveToHistory = useCallback((newElements: BadgeElement[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newElements]);
      return newHistory.slice(-20); // Keep last 20 states
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Drag from palette (now opens dialog)
  const handlePaletteClick = (type: ElementType, shapeType?: string) => {
    setPendingType(type);
    setPendingProps({ shapeType });
    setShowAddDialog(true);
  };

  // Add element after dialog
  const handleAddElement = () => {
    if (!pendingType) return;
    const base = getDefaultElement(pendingType, pendingProps.shapeType);
    const newElements = [...elements, { ...base, ...pendingProps, zIndex: elements.length }];
    setElements(newElements);
    saveToHistory(newElements);
    setShowAddDialog(false);
    setPendingType(null);
    setPendingProps({});
  };

  // Drop on canvas
  const handleCanvasDrop = (e: React.DragEvent) => {
    if (!dragType) return;
    const stage = e.target as HTMLDivElement;
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setElements(prev => [
      ...prev,
      { ...getDefaultElement(dragType), x, y, zIndex: prev.length },
    ]);
    setDragType(null);
    setDragOver(false);
  };

  // Select element
  const handleSelect = (id: string) => setSelectedId(id);
  // Deselect
  const handleDeselect = (e: any) => {
    if (e.target === e.target.getStage()) setSelectedId(null);
  };
  // Update element
  const handleElementChange = (id: string, attrs: any) => {
    const newElements = elements.map(el => (el.id === id ? { ...el, ...attrs } : el));
    setElements(newElements);
    saveToHistory(newElements);
  };
  // Layering
  const moveLayer = (id: string, dir: 'up' | 'down') => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx === -1) return;
    const newArr = [...elements];
    if (dir === 'up' && idx < elements.length - 1) {
      [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
    } else if (dir === 'down' && idx > 0) {
      [newArr[idx], newArr[idx - 1]] = [newArr[idx - 1], newArr[idx]];
    }
    setElements(newArr);
    saveToHistory(newArr);
  };
  
  // Delete
  const handleDelete = () => {
    if (!selectedId) return;
    const newElements = elements.filter(el => el.id !== selectedId);
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedId(null);
  };
  // Utility functions
  const duplicateElement = () => {
    if (!selectedId) return;
    const selected = elements.find(el => el.id === selectedId);
    if (!selected) return;
    const duplicated = { ...selected, id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, x: selected.x + 20, y: selected.y + 20 };
    const newElements = [...elements, duplicated];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedId(duplicated.id);
  };

  const resetCanvas = () => {
    setElements([]);
    setSelectedId(null);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const exportAsImage = () => {
    const uri = document.querySelector('canvas')?.toDataURL('image/png');
    if (uri) {
      const link = document.createElement('a');
      link.href = uri;
      link.download = `badge-${Date.now()}.png`;
      link.click();
    }
  };

  const saveTemplate = () => {
    const template = {
      name: templateName || `Badge Template ${Date.now()}`,
      elements,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(`badge-template-${template.name}`, JSON.stringify(template));
    setShowSaveDialog(false);
    setTemplateName('');
  };

  const loadTemplate = (templateName: string) => {
    const saved = localStorage.getItem(`badge-template-${templateName}`);
    if (saved) {
      const template = JSON.parse(saved);
      setElements(template.elements);
      setSelectedId(null);
      saveToHistory(template.elements);
    }
  };

  // Property panel
  const selected = elements.find(el => el.id === selectedId);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
      style={{ transition: 'background 0.3s, color 0.3s' }}>
      {/* Enhanced Header */}
      <header className="flex items-center gap-4 px-8 py-4 shadow-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <span className="text-3xl">🏷️</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Badge Designer</h1>
          <p className="text-sm opacity-80">Design and customize event badges with advanced tools and templates.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Toolbar */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="text-white hover:bg-white/20"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="text-white hover:bg-white/20"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={duplicateElement}
              disabled={!selectedId}
              className="text-white hover:bg-white/20"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={exportAsImage}
              className="text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDarkMode((d) => !d)}
            className="text-white hover:bg-white/20"
          >
            {darkMode ? '🌙' : '☀️'}
          </Button>
        </div>
      </header>
      {/* Main Layout */}
      <main className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Enhanced Sidebar */}
        <aside className={`${isFullscreen ? 'hidden' : 'w-full md:w-64'} bg-white dark:bg-gray-950 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Design Tools</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowLayers(!showLayers)}
              className="p-1"
            >
              <Layers className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Elements Palette */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Elements</h3>
            <div className="space-y-2">
              {PALETTE_ELEMENTS.map((el) => (
                <button
                  key={`${el.type}-${el.shapeType || ''}`}
                  className="flex items-center gap-2 px-3 py-2 rounded transition border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900 group relative w-full"
                  onClick={() => handlePaletteClick(el.type, el.shapeType)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="text-xl">{el.icon}</span>
                  <span className="text-sm">{el.label}</span>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-xs bg-gray-800 text-white px-2 py-1 rounded shadow pointer-events-none transition">Add {el.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={duplicateElement}
                disabled={!selectedId}
                className="w-full justify-start"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAsImage}
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="w-full justify-start"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
          
          {/* Guest Type Color Preview */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Guest Type Colors</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.entries(GUEST_TYPE_COLORS).map(([type, colors]) => (
                <div key={type} className="flex items-center gap-2 p-1 rounded border border-gray-200 dark:border-gray-700">
                  <div className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border || ''} border`}></div>
                  <span className="text-xs font-medium">{type}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
            <Button
              onClick={() => window.print()}
              className="w-full"
            >
              Preview/Print
            </Button>
            <Button
              variant="outline"
              onClick={resetCanvas}
              className="w-full"
            >
              Reset Canvas
            </Button>
          </div>
        </aside>
        {/* Enhanced Canvas Area */}
        <section className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 transition p-4">
          {/* Canvas Controls */}
          <div className="flex items-center gap-4 mb-4 w-full max-w-lg">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                disabled={zoom <= 0.5}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                disabled={zoom >= 2}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom(1)}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
          <div
            className={`relative shadow-2xl rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center ${dragOver ? 'ring-4 ring-blue-400' : ''}`}
            style={{ 
              width: CANVAS_WIDTH * zoom, 
              height: CANVAS_HEIGHT * zoom, 
              transition: 'all 0.2s ease-in-out',
              transform: `scale(${zoom})`,
              transformOrigin: 'center'
            }}
            onDrop={handleCanvasDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDragEnd={() => setDragOver(false)}
          >
            <Stage
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleDeselect}
              onTouchStart={handleDeselect}
              style={{ background: 'transparent', width: '100%', height: '100%' }}
            >
              <Layer>
                {elements.map((el, idx) => {
                  if (el.type === 'text') {
                    return (
                      <Group key={el.id}>
                        <Text
                          x={el.x}
                          y={el.y}
                          width={el.width}
                          height={el.height}
                          text={el.content}
                          fontSize={el.fontSize}
                          fontFamily={el.fontFamily}
                          fontStyle={el.fontWeight}
                          fill={el.color}
                          align={el.textAlign}
                          rotation={el.rotation}
                          draggable
                          onClick={() => handleSelect(el.id)}
                          onTap={() => handleSelect(el.id)}
                          onDragEnd={e => handleElementChange(el.id, { x: e.target.x(), y: e.target.y() })}
                          onTransformEnd={e => {
                            const node = e.target;
                            handleElementChange(el.id, {
                              x: node.x(),
                              y: node.y(),
                              width: Math.max(20, node.width() * node.scaleX()),
                              height: Math.max(20, node.height() * node.scaleY()),
                              rotation: node.rotation(),
                            });
                            node.scaleX(1);
                            node.scaleY(1);
                          }}
                          shadowForStrokeEnabled
                          shadowBlur={selectedId === el.id ? 10 : 0}
                          shadowColor={selectedId === el.id ? '#6366F1' : undefined}
                        />
                        {selectedId === el.id && (
                          <Transformer
                            rotateEnabled={true}
                            boundBoxFunc={(oldBox, newBox) => {
                              if (newBox.width < 20 || newBox.height < 20) {
                                return oldBox;
                              }
                              return newBox;
                            }}
                          />
                        )}
                      </Group>
                    );
                  } else if (el.type === 'image') {
                    return (
                      <KonvaImageElement
                        key={el.id}
                        el={el}
                        isSelected={selectedId === el.id}
                        onSelect={() => handleSelect(el.id)}
                        onChange={attrs => handleElementChange(el.id, attrs)}
                      />
                    );
                  } else if (el.type === 'shape') {
                    return (
                      <Group key={el.id}>
                        {el.shapeType === 'circle' ? (
                          <Circle
                            x={el.x + el.width / 2}
                            y={el.y + el.height / 2}
                            radius={Math.min(el.width, el.height) / 2}
                            fill={el.backgroundColor}
                            stroke={el.borderColor}
                            strokeWidth={el.borderWidth}
                            rotation={el.rotation}
                            draggable
                            onClick={() => handleSelect(el.id)}
                            onTap={() => handleSelect(el.id)}
                            onDragEnd={e => handleElementChange(el.id, { x: e.target.x() - el.width / 2, y: e.target.y() - el.height / 2 })}
                            onTransformEnd={e => {
                              const node = e.target as any;
                              const radius = node.radius() * node.scaleX();
                              handleElementChange(el.id, {
                                x: node.x() - radius,
                                y: node.y() - radius,
                                width: radius * 2,
                                height: radius * 2,
                                rotation: node.rotation(),
                              });
                              node.scaleX(1);
                              node.scaleY(1);
                            }}
                            shadowForStrokeEnabled
                            shadowBlur={selectedId === el.id ? 10 : 0}
                            shadowColor={selectedId === el.id ? '#6366F1' : undefined}
                          />
                        ) : el.shapeType === 'line' ? (
                          <Line
                            points={[0, 0, el.width, 0]}
                            x={el.x}
                            y={el.y}
                            stroke={el.backgroundColor}
                            strokeWidth={el.height}
                            rotation={el.rotation}
                            draggable
                            onClick={() => handleSelect(el.id)}
                            onTap={() => handleSelect(el.id)}
                            onDragEnd={e => handleElementChange(el.id, { x: e.target.x(), y: e.target.y() })}
                            onTransformEnd={e => {
                              const node = e.target;
                              handleElementChange(el.id, {
                                x: node.x(),
                                y: node.y(),
                                width: Math.max(20, node.width() * node.scaleX()),
                                height: Math.max(2, node.height() * node.scaleY()),
                                rotation: node.rotation(),
                              });
                              node.scaleX(1);
                              node.scaleY(1);
                            }}
                            shadowForStrokeEnabled
                            shadowBlur={selectedId === el.id ? 10 : 0}
                            shadowColor={selectedId === el.id ? '#6366F1' : undefined}
                          />
                        ) : (
                          <Rect
                            x={el.x}
                            y={el.y}
                            width={el.width}
                            height={el.height}
                            fill={el.backgroundColor}
                            stroke={el.borderColor}
                            strokeWidth={el.borderWidth}
                            rotation={el.rotation}
                            draggable
                            onClick={() => handleSelect(el.id)}
                            onTap={() => handleSelect(el.id)}
                            onDragEnd={e => handleElementChange(el.id, { x: e.target.x(), y: e.target.y() })}
                            onTransformEnd={e => {
                              const node = e.target;
                              handleElementChange(el.id, {
                                x: node.x(),
                                y: node.y(),
                                width: Math.max(20, node.width() * node.scaleX()),
                                height: Math.max(20, node.height() * node.scaleY()),
                                rotation: node.rotation(),
                              });
                              node.scaleX(1);
                              node.scaleY(1);
                            }}
                            shadowForStrokeEnabled
                            shadowBlur={selectedId === el.id ? 10 : 0}
                            shadowColor={selectedId === el.id ? '#6366F1' : undefined}
                          />
                        )}
                        {selectedId === el.id && (
                          <Transformer
                            rotateEnabled={true}
                            boundBoxFunc={(oldBox, newBox) => {
                              if (newBox.width < 20 || newBox.height < 20) {
                                return oldBox;
                              }
                              return newBox;
                            }}
                          />
                        )}
                      </Group>
                    );
                  }
                  return null;
                })}
              </Layer>
            </Stage>
            {/* Drag overlay */}
            {dragType && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-pulse">
                <span className="text-4xl opacity-30">{PALETTE_ELEMENTS.find(e => e.type === dragType)?.icon}</span>
              </div>
            )}
          </div>
        </section>
        {/* Property Panel */}
        <aside className="w-full md:w-80 bg-white dark:bg-gray-950 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4 min-w-[320px]">
          <h2 className="text-lg font-semibold mb-2">Properties</h2>
          {selected ? (
            <div className="space-y-2 animate-fade-in bg-gray-50 dark:bg-gray-900 rounded-lg p-4 shadow">
              <div className="text-xs text-gray-500">ID: {selected.id}</div>
              <label className="block text-sm">X</label>
              <input type="number" className="w-full border px-2 py-1 rounded" value={selected.x} onChange={e => handleElementChange(selected.id, { x: Number(e.target.value) })} />
              <label className="block text-sm">Y</label>
              <input type="number" className="w-full border px-2 py-1 rounded" value={selected.y} onChange={e => handleElementChange(selected.id, { y: Number(e.target.value) })} />
              <label className="block text-sm">Width</label>
              <input type="number" className="w-full border px-2 py-1 rounded" value={selected.width} onChange={e => handleElementChange(selected.id, { width: Number(e.target.value) })} />
              <label className="block text-sm">Height</label>
              <input type="number" className="w-full border px-2 py-1 rounded" value={selected.height} onChange={e => handleElementChange(selected.id, { height: Number(e.target.value) })} />
              <label className="block text-sm">Rotation</label>
              <input type="number" className="w-full border px-2 py-1 rounded" value={selected.rotation} onChange={e => handleElementChange(selected.id, { rotation: Number(e.target.value) })} />
              {selected.type === 'text' && (
                <>
                  <label className="block text-sm">Text</label>
                  <input className="w-full border px-2 py-1 rounded" value={selected.content} onChange={e => handleElementChange(selected.id, { content: e.target.value })} />
                  <label className="block text-sm">Font Size</label>
                  <input type="number" className="w-full border px-2 py-1 rounded" value={selected.fontSize} onChange={e => handleElementChange(selected.id, { fontSize: Number(e.target.value) })} />
                  <label className="block text-sm">Color</label>
                  <input type="color" className="w-8 h-8 p-0 border rounded" value={selected.color} onChange={e => handleElementChange(selected.id, { color: e.target.value })} />
                </>
              )}
              {selected.type === 'shape' && (
                <>
                  <label className="block text-sm">Fill Color</label>
                  <input type="color" className="w-8 h-8 p-0 border rounded" value={selected.backgroundColor} onChange={e => handleElementChange(selected.id, { backgroundColor: e.target.value })} />
                  <label className="block text-sm">Border Color</label>
                  <input type="color" className="w-8 h-8 p-0 border rounded" value={selected.borderColor} onChange={e => handleElementChange(selected.id, { borderColor: e.target.value })} />
                  <label className="block text-sm">Border Width</label>
                  <input type="number" className="w-full border px-2 py-1 rounded" value={selected.borderWidth} onChange={e => handleElementChange(selected.id, { borderWidth: Number(e.target.value) })} />
                </>
              )}
              <div className="flex gap-2 mt-4">
                <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700" onClick={() => moveLayer(selected.id, 'up')}>Move Up</button>
                <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700" onClick={() => moveLayer(selected.id, 'down')}>Move Down</button>
                <button className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 dark:text-gray-600 text-sm animate-fade-in">Select an element to edit its properties</div>
          )}
        </aside>
        {/* Add Element Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add {pendingType && PALETTE_ELEMENTS.find(e => e.type === pendingType)?.label}</DialogTitle>
            </DialogHeader>
            {pendingType === 'text' && (
              <>
                <label className="block text-sm">Text</label>
                <input className="w-full border px-2 py-1 rounded" value={pendingProps.content || ''} onChange={e => setPendingProps((p: any) => ({ ...p, content: e.target.value }))} />
                <label className="block text-sm mt-2">Font Size</label>
                <input type="number" className="w-full border px-2 py-1 rounded" value={pendingProps.fontSize || 24} onChange={e => setPendingProps((p: any) => ({ ...p, fontSize: Number(e.target.value) }))} />
                <label className="block text-sm mt-2">Color</label>
                <input type="color" className="w-8 h-8 p-0 border rounded" value={pendingProps.color || '#222222'} onChange={e => setPendingProps((p: any) => ({ ...p, color: e.target.value }))} />
              </>
            )}
            {pendingType === 'image' && (
              <>
                <label className="block text-sm">Image URL</label>
                <input className="w-full border px-2 py-1 rounded" value={pendingProps.src || ''} onChange={e => setPendingProps((p: any) => ({ ...p, src: e.target.value }))} />
              </>
            )}
            {pendingType === 'shape' && (
              <>
                <label className="block text-sm">Fill Color</label>
                <input type="color" className="w-8 h-8 p-0 border rounded" value={pendingProps.backgroundColor || '#4F46E5'} onChange={e => setPendingProps((p: any) => ({ ...p, backgroundColor: e.target.value }))} />
                <label className="block text-sm mt-2">Border Color</label>
                <input type="color" className="w-8 h-8 p-0 border rounded" value={pendingProps.borderColor || '#222222'} onChange={e => setPendingProps((p: any) => ({ ...p, borderColor: e.target.value }))} />
                <label className="block text-sm mt-2">Border Width</label>
                <input type="number" className="w-full border px-2 py-1 rounded" value={pendingProps.borderWidth || 2} onChange={e => setPendingProps((p: any) => ({ ...p, borderWidth: Number(e.target.value) }))} />
              </>
            )}
            <DialogFooter>
              <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleAddElement}>Add</button>
              <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 ml-2" onClick={() => setShowAddDialog(false)}>Cancel</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Save Template Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Badge Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={saveTemplate} disabled={!templateName.trim()}>
                Save Template
              </Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default BadgeDesignerTab;
