import React, { useState, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group } from 'react-konva';
import useImage from 'use-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Download, 
  Undo, 
  Redo, 
  Trash2, 
  Plus,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  Palette,
  Move,
  RotateCw,
  Eye,
  EyeOff
} from 'lucide-react';

// Badge element types
export interface BadgeElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'guestField';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  visible: boolean;
  
  // Text properties
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  
  // Image properties
  src?: string;
  
  // Shape properties
  shapeType?: 'rectangle' | 'circle' | 'line';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  
  // Guest field properties
  guestField?: 'name' | 'company' | 'jobTitle' | 'email' | 'phone' | 'guestType' | 'qrCode';
}

// Guest field options
const GUEST_FIELDS = [
  { value: 'name', label: 'Full Name', icon: '👤' },
  { value: 'company', label: 'Company', icon: '🏢' },
  { value: 'jobTitle', label: 'Job Title', icon: '💼' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📞' },
  { value: 'guestType', label: 'Guest Type', icon: '🎫' },
  { value: 'qrCode', label: 'QR Code', icon: '📱' },
];

// Canvas dimensions - 4"x4" badge
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

// Default badge template
const DEFAULT_TEMPLATE: BadgeElement[] = [
  {
    id: 'name-field',
    type: 'guestField',
    x: 50,
    y: 50,
    width: 300,
    height: 40,
    rotation: 0,
    zIndex: 1,
    visible: true,
    guestField: 'name',
    fontSize: 24,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center'
  },
  {
    id: 'company-field',
    type: 'guestField',
    x: 50,
    y: 100,
    width: 300,
    height: 30,
    rotation: 0,
    zIndex: 2,
    visible: true,
    guestField: 'company',
    fontSize: 18,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    color: '#475569',
    textAlign: 'center'
  },
  {
    id: 'qr-field',
    type: 'guestField',
    x: 150,
    y: 200,
    width: 100,
    height: 100,
    rotation: 0,
    zIndex: 3,
    visible: true,
    guestField: 'qrCode'
  },
  {
    id: 'guest-type-field',
    type: 'guestField',
    x: 50,
    y: 320,
    width: 300,
    height: 30,
    rotation: 0,
    zIndex: 4,
    visible: true,
    guestField: 'guestType',
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center'
  }
];

// Sample guest data for preview
const SAMPLE_GUEST = {
  name: 'John Doe',
  company: 'Tech Corp',
  jobTitle: 'Software Engineer',
  email: 'john@techcorp.com',
  phone: '+1 (555) 123-4567',
  guestType: 'VIP',
  qrCode: 'QR123456'
};

const SimpleBadgeDesigner: React.FC = () => {
  const [elements, setElements] = useState<BadgeElement[]>(DEFAULT_TEMPLATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<BadgeElement[][]>([DEFAULT_TEMPLATE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showProperties, setShowProperties] = useState(true);
  const [activeTab, setActiveTab] = useState('design');
  
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  // History management
  const saveToHistory = useCallback((newElements: BadgeElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory.slice(-20)); // Keep last 20 states
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // Element management
  const addElement = (type: BadgeElement['type'], guestField?: BadgeElement['guestField']) => {
    const id = `element_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let newElement: BadgeElement;

    switch (type) {
      case 'text':
        newElement = {
          id,
          type: 'text',
          x: 50,
          y: 50,
          width: 200,
          height: 30,
          rotation: 0,
          zIndex: elements.length,
          visible: true,
          content: 'Sample Text',
          fontSize: 18,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'left'
        };
        break;
      case 'guestField':
        newElement = {
          id,
          type: 'guestField',
          x: 50,
          y: 50,
          width: 200,
          height: 30,
          rotation: 0,
          zIndex: elements.length,
          visible: true,
          guestField: guestField || 'name',
          fontSize: 18,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'left'
        };
        break;
      case 'image':
        newElement = {
          id,
          type: 'image',
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          rotation: 0,
          zIndex: elements.length,
          visible: true,
          src: ''
        };
        break;
      case 'shape':
        newElement = {
          id,
          type: 'shape',
          x: 50,
          y: 50,
          width: 100,
          height: 60,
          rotation: 0,
          zIndex: elements.length,
          visible: true,
          shapeType: 'rectangle',
          backgroundColor: '#3b82f6',
          borderColor: '#1e40af',
          borderWidth: 2
        };
        break;
      default:
        return;
    }

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedId(id);
  };

  const deleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedId(null);
  };

  const updateElement = (id: string, updates: Partial<BadgeElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    saveToHistory(newElements);
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;

    const newElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      x: element.x + 20,
      y: element.y + 20,
      zIndex: elements.length
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedId(newElement.id);
  };

  // Selection handling
  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleDeselect = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
  };

  // Transform handling
  const handleTransformEnd = (id: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    updateElement(id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation()
    });

    node.scaleX(1);
    node.scaleY(1);
  };

  // Layer management
  const moveToFront = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;

    const maxZ = Math.max(...elements.map(el => el.zIndex));
    updateElement(id, { zIndex: maxZ + 1 });
  };

  const moveToBack = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;

    const minZ = Math.min(...elements.map(el => el.zIndex));
    updateElement(id, { zIndex: minZ - 1 });
  };

  // Export functions
  const exportAsImage = () => {
    const uri = stageRef.current?.toDataURL();
    if (uri) {
      const link = document.createElement('a');
      link.href = uri;
      link.download = `badge-template-${Date.now()}.png`;
      link.click();
    }
  };

  const saveTemplate = () => {
    const template = {
      name: `Badge Template ${new Date().toLocaleDateString()}`,
      elements,
      createdAt: new Date().toISOString()
    };
    
    const templates = JSON.parse(localStorage.getItem('badge-templates') || '[]');
    templates.push(template);
    localStorage.setItem('badge-templates', JSON.stringify(templates));
    
    alert('Template saved successfully!');
  };

  const loadTemplate = (template: any) => {
    setElements(template.elements);
    setSelectedId(null);
    saveToHistory(template.elements);
  };

  // Get guest field value for preview
  const getGuestFieldValue = (field: string) => {
    return SAMPLE_GUEST[field as keyof typeof SAMPLE_GUEST] || '';
  };

  // Render element based on type
  const renderElement = (element: BadgeElement) => {
    const isSelected = selectedId === element.id;
    
    if (!element.visible) return null;

    switch (element.type) {
      case 'text':
        return (
          <Group key={element.id}>
            <Text
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              text={element.content || ''}
              fontSize={element.fontSize || 18}
              fontFamily={element.fontFamily || 'Arial'}
              fontStyle={element.fontWeight || 'normal'}
              fill={element.color || '#000000'}
              align={element.textAlign || 'left'}
              rotation={element.rotation}
              draggable
              onClick={() => handleSelect(element.id)}
              onTap={() => handleSelect(element.id)}
              onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
              onTransformEnd={(e) => handleTransformEnd(element.id, e)}
            />
            {isSelected && (
              <Transformer
                ref={transformerRef}
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

      case 'guestField':
        const fieldValue = getGuestFieldValue(element.guestField || '');
        return (
          <Group key={element.id}>
            <Text
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              text={fieldValue}
              fontSize={element.fontSize || 18}
              fontFamily={element.fontFamily || 'Arial'}
              fontStyle={element.fontWeight || 'normal'}
              fill={element.color || '#000000'}
              align={element.textAlign || 'left'}
              rotation={element.rotation}
              draggable
              onClick={() => handleSelect(element.id)}
              onTap={() => handleSelect(element.id)}
              onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
              onTransformEnd={(e) => handleTransformEnd(element.id, e)}
            />
            {isSelected && (
              <Transformer
                ref={transformerRef}
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

      case 'image':
        return (
          <Group key={element.id}>
            <Rect
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              fill="#f3f4f6"
              stroke="#d1d5db"
              strokeWidth={1}
              rotation={element.rotation}
              draggable
              onClick={() => handleSelect(element.id)}
              onTap={() => handleSelect(element.id)}
              onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
              onTransformEnd={(e) => handleTransformEnd(element.id, e)}
            />
            <Text
              x={element.x + element.width / 2}
              y={element.y + element.height / 2}
              text="Image"
              fontSize={12}
              fill="#6b7280"
              align="center"
              offsetX={20}
              offsetY={6}
            />
            {isSelected && (
              <Transformer
                ref={transformerRef}
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

      case 'shape':
        return (
          <Group key={element.id}>
            {element.shapeType === 'circle' ? (
              <Rect
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                fill={element.backgroundColor || '#3b82f6'}
                stroke={element.borderColor || '#1e40af'}
                strokeWidth={element.borderWidth || 2}
                cornerRadius={Math.min(element.width, element.height) / 2}
                rotation={element.rotation}
                draggable
                onClick={() => handleSelect(element.id)}
                onTap={() => handleSelect(element.id)}
                onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
                onTransformEnd={(e) => handleTransformEnd(element.id, e)}
              />
            ) : (
              <Rect
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                fill={element.backgroundColor || '#3b82f6'}
                stroke={element.borderColor || '#1e40af'}
                strokeWidth={element.borderWidth || 2}
                rotation={element.rotation}
                draggable
                onClick={() => handleSelect(element.id)}
                onTap={() => handleSelect(element.id)}
                onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
                onTransformEnd={(e) => handleTransformEnd(element.id, e)}
              />
            )}
            {isSelected && (
              <Transformer
                ref={transformerRef}
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

      default:
        return null;
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Badge Designer</h1>
            <p className="text-sm text-gray-600">Design custom badges for your events</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsImage}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={saveTemplate}
            >
              <Save className="w-4 h-4" />
              Save Template
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Tools */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-4">
              {/* Guest Fields */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Guest Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {GUEST_FIELDS.map((field) => (
                    <Button
                      key={field.value}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addElement('guestField', field.value as any)}
                    >
                      <span className="mr-2">{field.icon}</span>
                      {field.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Design Elements */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Design Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addElement('text')}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addElement('image')}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addElement('shape')}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Shape
                  </Button>
                </CardContent>
              </Card>

              {/* Layers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Layers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {elements
                    .sort((a, b) => b.zIndex - a.zIndex)
                    .map((element) => (
                      <div
                        key={element.id}
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer ${
                          selectedId === element.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => handleSelect(element.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${element.visible ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm">
                            {element.type === 'guestField' ? element.guestField : element.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateElement(element.id, { visible: !element.visible });
                            }}
                          >
                            {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteElement(element.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Saved Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 text-center py-4">
                    No saved templates yet. Create and save your first template!
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 p-8">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="text-sm text-gray-500 mb-2 text-center">Badge Preview (4" x 4")</div>
            <Stage
              ref={stageRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleDeselect}
              onTouchStart={handleDeselect}
            >
              <Layer>
                {/* Badge border */}
                <Rect
                  x={0}
                  y={0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  stroke="#e5e7eb"
                  strokeWidth={2}
                  fill="transparent"
                />
                {/* Render all elements */}
                {elements.map(renderElement)}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {showProperties && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProperties(false)}
              >
                ×
              </Button>
            </div>

            {selectedElement ? (
              <div className="space-y-4">
                {/* Basic Properties */}
                <div className="space-y-2">
                  <Label>Position & Size</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        value={selectedElement.x}
                        onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        value={selectedElement.y}
                        onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <Input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {/* Text Properties */}
                {(selectedElement.type === 'text' || selectedElement.type === 'guestField') && (
                  <div className="space-y-2">
                    <Label>Text Properties</Label>
                    {selectedElement.type === 'text' && (
                      <div>
                        <Label className="text-xs">Content</Label>
                        <Input
                          value={selectedElement.content || ''}
                          onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        />
                      </div>
                    )}
                    {selectedElement.type === 'guestField' && (
                      <div>
                        <Label className="text-xs">Guest Field</Label>
                        <Select
                          value={selectedElement.guestField || 'name'}
                          onValueChange={(value) => updateElement(selectedElement.id, { guestField: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GUEST_FIELDS.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.icon} {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Font Size</Label>
                        <Input
                          type="number"
                          value={selectedElement.fontSize || 18}
                          onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <Input
                          type="color"
                          value={selectedElement.color || '#000000'}
                          onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Font Weight</Label>
                      <Select
                        value={selectedElement.fontWeight || 'normal'}
                        onValueChange={(value) => updateElement(selectedElement.id, { fontWeight: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Text Align</Label>
                      <Select
                        value={selectedElement.textAlign || 'left'}
                        onValueChange={(value) => updateElement(selectedElement.id, { textAlign: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Shape Properties */}
                {selectedElement.type === 'shape' && (
                  <div className="space-y-2">
                    <Label>Shape Properties</Label>
                    <div>
                      <Label className="text-xs">Shape Type</Label>
                      <Select
                        value={selectedElement.shapeType || 'rectangle'}
                        onValueChange={(value) => updateElement(selectedElement.id, { shapeType: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rectangle">Rectangle</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Fill Color</Label>
                        <Input
                          type="color"
                          value={selectedElement.backgroundColor || '#3b82f6'}
                          onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Border Color</Label>
                        <Input
                          type="color"
                          value={selectedElement.borderColor || '#1e40af'}
                          onChange={(e) => updateElement(selectedElement.id, { borderColor: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Border Width</Label>
                      <Input
                        type="number"
                        value={selectedElement.borderWidth || 2}
                        onChange={(e) => updateElement(selectedElement.id, { borderWidth: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <Label>Actions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveToFront(selectedElement.id)}
                    >
                      <Move className="w-4 h-4 mr-1" />
                      Front
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveToBack(selectedElement.id)}
                    >
                      <Move className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateElement(selectedElement.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteElement(selectedElement.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🎨</div>
                <p>Select an element to edit its properties</p>
              </div>
            )}
          </div>
        )}

        {/* Properties Toggle */}
        {!showProperties && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProperties(true)}
            >
              <Palette className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleBadgeDesigner;
