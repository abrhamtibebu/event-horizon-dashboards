// Badge Designer Canvas - Konva.js based drag-and-drop editor
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Transformer, Line, Circle, Ellipse, Image as KonvaImage } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import type {
  DesignerElement,
  DesignerState,
  SampleAttendeeData,
  BadgeSize,
} from '@/types/badge-designer';
import {
  MM_TO_PX,
  DEFAULT_SAMPLE_DATA,
  DYNAMIC_FIELD_LABELS,
  type DynamicFieldKey,
} from '@/types/badge-designer';
import QRCode from 'qrcode';

// ── Props ────────────────────────────────────────────────────────────────────

interface BadgeCanvasProps {
  elements: DesignerElement[];
  selectedElementIds: string[];
  badgeSize: BadgeSize;
  backgroundColor: string;
  backgroundImage: string | null;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  sampleData: SampleAttendeeData;
  onSelectElement: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<DesignerElement>) => void;
  onClearSelection: () => void;
}

// ── QR Code helper ───────────────────────────────────────────────────────────

function useQRCodeImage(value: string, size: number, fgColor: string, bgColor: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!value) return;
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, value, {
      width: Math.max(size, 64),
      margin: 1,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: 'M',
    }).then(() => {
      const img = new window.Image();
      img.src = canvas.toDataURL();
      img.onload = () => setImage(img);
    }).catch(() => {});
  }, [value, size, fgColor, bgColor]);

  return image;
}

// ── URL Image helper ─────────────────────────────────────────────────────────

function useURLImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) { setImage(null); return; }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
  }, [src]);

  return image;
}

// ── Dynamic Field Value Resolver ─────────────────────────────────────────────

function resolveDynamicField(fieldKey: DynamicFieldKey, data: SampleAttendeeData): string {
  return data[fieldKey] || `{${fieldKey}}`;
}

// ── Individual Element Renderers ─────────────────────────────────────────────

const TextElementRenderer: React.FC<{
  element: DesignerElement & { type: 'text' };
  isSelected: boolean;
}> = ({ element: el }) => (
  <Text
    id={el.id}
    x={el.x}
    y={el.y}
    width={el.width}
    height={el.height}
    text={el.content}
    fontSize={el.fontSize}
    fontFamily={el.fontFamily}
    fontStyle={`${el.fontStyle === 'italic' ? 'italic' : ''} ${el.fontWeight === 'bold' ? 'bold' : ''}`.trim() || 'normal'}
    fill={el.color}
    align={el.textAlign}
    verticalAlign={el.verticalAlign}
    lineHeight={el.lineHeight}
    letterSpacing={el.letterSpacing}
    padding={el.padding}
    opacity={el.opacity}
    rotation={el.rotation}
    visible={el.visible}
    draggable={!el.locked}
    wrap="word"
    ellipsis
  />
);

const DynamicFieldRenderer: React.FC<{
  element: DesignerElement & { type: 'dynamicField' };
  sampleData: SampleAttendeeData;
}> = ({ element: el, sampleData }) => {
  const value = resolveDynamicField(el.fieldKey, sampleData);

  return (
    <Group x={el.x} y={el.y} rotation={el.rotation} opacity={el.opacity} visible={el.visible}>
      {/* Background */}
      {el.backgroundColor && el.backgroundColor !== 'transparent' && (
        <Rect width={el.width} height={el.height} fill={el.backgroundColor} cornerRadius={3} />
      )}
      {/* Dashed border to indicate dynamic */}
      <Rect
        width={el.width}
        height={el.height}
        stroke="#6366f1"
        strokeWidth={1}
        dash={[4, 3]}
        fill="transparent"
        cornerRadius={3}
      />
      <Text
        id={el.id}
        width={el.width}
        height={el.height}
        text={value}
        fontSize={el.fontSize}
        fontFamily={el.fontFamily}
        fontStyle={`${el.fontStyle === 'italic' ? 'italic' : ''} ${el.fontWeight === 'bold' ? 'bold' : ''}`.trim() || 'normal'}
        fill={el.color}
        align={el.textAlign}
        verticalAlign={el.verticalAlign}
        lineHeight={el.lineHeight}
        padding={el.padding}
        draggable={!el.locked}
        wrap="word"
        ellipsis
      />
    </Group>
  );
};

const QRCodeRenderer: React.FC<{
  element: DesignerElement & { type: 'qrCode' };
  sampleData: SampleAttendeeData;
}> = ({ element: el, sampleData }) => {
  const value = el.dataSource === 'customUrl' ? (el.customValue || 'https://evella.et') : sampleData.qrCode;
  const qrImage = useQRCodeImage(value, Math.min(el.width, el.height), el.foregroundColor, el.backgroundColor);

  return qrImage ? (
    <KonvaImage
      id={el.id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      image={qrImage}
      rotation={el.rotation}
      opacity={el.opacity}
      visible={el.visible}
      draggable={!el.locked}
    />
  ) : (
    <Rect
      id={el.id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      fill="#f1f5f9"
      stroke="#cbd5e1"
      strokeWidth={1}
      cornerRadius={4}
      rotation={el.rotation}
      draggable={!el.locked}
    />
  );
};

const ShapeRenderer: React.FC<{
  element: DesignerElement & { type: 'shape' };
}> = ({ element: el }) => {
  if (el.shapeType === 'ellipse' || el.shapeType === 'circle') {
    return (
      <Ellipse
        id={el.id}
        x={el.x + el.width / 2}
        y={el.y + el.height / 2}
        radiusX={el.width / 2}
        radiusY={el.shapeType === 'circle' ? el.width / 2 : el.height / 2}
        fill={el.fill}
        stroke={el.stroke}
        strokeWidth={el.strokeWidth}
        rotation={el.rotation}
        opacity={el.opacity}
        visible={el.visible}
        draggable={!el.locked}
      />
    );
  }

  return (
    <Rect
      id={el.id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      fill={el.fill}
      stroke={el.stroke}
      strokeWidth={el.strokeWidth}
      cornerRadius={el.cornerRadius}
      rotation={el.rotation}
      opacity={el.opacity}
      visible={el.visible}
      draggable={!el.locked}
    />
  );
};

const ImageElementRenderer: React.FC<{
  element: DesignerElement & { type: 'image' };
}> = ({ element: el }) => {
  const img = useURLImage(el.src);

  if (!img) {
    return (
      <Group x={el.x} y={el.y} rotation={el.rotation}>
        <Rect
          id={el.id}
          width={el.width}
          height={el.height}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth={1}
          cornerRadius={el.borderRadius}
          draggable={!el.locked}
        />
        <Text
          width={el.width}
          height={el.height}
          text="📷 Image"
          fontSize={13}
          fill="#94a3b8"
          align="center"
          verticalAlign="middle"
        />
      </Group>
    );
  }

  return (
    <KonvaImage
      id={el.id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      image={img}
      rotation={el.rotation}
      opacity={el.opacity}
      visible={el.visible}
      draggable={!el.locked}
    />
  );
};

// ── Grid Renderer ────────────────────────────────────────────────────────────

const GridLines: React.FC<{ width: number; height: number; gridSize: number }> = ({
  width,
  height,
  gridSize,
}) => {
  const lines: React.ReactElement[] = [];
  const step = gridSize * MM_TO_PX;

  for (let x = 0; x <= width; x += step) {
    lines.push(
      <Line key={`gv-${x}`} points={[x, 0, x, height]} stroke="#e2e8f0" strokeWidth={0.5} />
    );
  }
  for (let y = 0; y <= height; y += step) {
    lines.push(
      <Line key={`gh-${y}`} points={[0, y, width, y]} stroke="#e2e8f0" strokeWidth={0.5} />
    );
  }

  return <>{lines}</>;
};

// ── Main Canvas Component ────────────────────────────────────────────────────

const BadgeCanvas: React.FC<BadgeCanvasProps> = ({
  elements,
  selectedElementIds,
  badgeSize,
  backgroundColor,
  backgroundImage,
  zoom,
  showGrid,
  snapToGrid,
  gridSize,
  sampleData,
  onSelectElement,
  onUpdateElement,
  onClearSelection,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const bgImageObj = useURLImage(backgroundImage || '');

  // Canvas dimensions in px
  const canvasWidth = badgeSize.width * MM_TO_PX;
  const canvasHeight = badgeSize.height * MM_TO_PX;

  // Stage container dimensions
  const stageWidth = canvasWidth * zoom + 80;
  const stageHeight = canvasHeight * zoom + 80;

  // Snap helper
  const snapValue = useCallback(
    (val: number) => {
      if (!snapToGrid) return val;
      const step = gridSize * MM_TO_PX;
      return Math.round(val / step) * step;
    },
    [snapToGrid, gridSize]
  );

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    const nodes = selectedElementIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedElementIds, elements]);

  // Handle stage click (deselect)
  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage() || e.target.attrs?.id === 'badge-bg') {
        onClearSelection();
      }
    },
    [onClearSelection]
  );

  // Handle element click (select)
  const handleElementClick = useCallback(
    (e: KonvaEventObject<MouseEvent>, elementId: string) => {
      e.cancelBubble = true;
      const metaKey = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
      if (metaKey) {
        const newIds = selectedElementIds.includes(elementId)
          ? selectedElementIds.filter((id) => id !== elementId)
          : [...selectedElementIds, elementId];
        onSelectElement(newIds);
      } else {
        onSelectElement([elementId]);
      }
    },
    [selectedElementIds, onSelectElement]
  );

  // Handle drag end (update position)
  const handleDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>, elementId: string) => {
      const node = e.target;
      onUpdateElement(elementId, {
        x: snapValue(node.x()),
        y: snapValue(node.y()),
      });
    },
    [onUpdateElement, snapValue]
  );

  // Handle transform end (update size/rotation)
  const handleTransformEnd = useCallback(
    (e: KonvaEventObject<Event>, elementId: string) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale and apply to width/height
      node.scaleX(1);
      node.scaleY(1);

      onUpdateElement(elementId, {
        x: snapValue(node.x()),
        y: snapValue(node.y()),
        width: Math.max(20, node.width() * scaleX),
        height: Math.max(20, node.height() * scaleY),
        rotation: node.rotation(),
      });
    },
    [onUpdateElement, snapValue]
  );

  // Render a single element
  const renderElement = (el: DesignerElement) => {
    const commonEvents = {
      onClick: (e: KonvaEventObject<MouseEvent>) => handleElementClick(e, el.id),
      onTap: (e: KonvaEventObject<Event>) => {
        onSelectElement([el.id]);
      },
      onDragEnd: (e: KonvaEventObject<DragEvent>) => handleDragEnd(e, el.id),
      onTransformEnd: (e: KonvaEventObject<Event>) => handleTransformEnd(e, el.id),
    };

    const wrapElement = (child: React.ReactElement) => (
      <Group key={el.id} {...commonEvents}>
        {child}
      </Group>
    );

    switch (el.type) {
      case 'text':
        return wrapElement(<TextElementRenderer element={el} isSelected={selectedElementIds.includes(el.id)} />);
      case 'dynamicField':
        return wrapElement(<DynamicFieldRenderer element={el} sampleData={sampleData} />);
      case 'qrCode':
        return wrapElement(<QRCodeRenderer element={el} sampleData={sampleData} />);
      case 'shape':
        return wrapElement(<ShapeRenderer element={el} />);
      case 'image':
        return wrapElement(<ImageElementRenderer element={el} />);
      default:
        return null;
    }
  };

  // Sort by zIndex
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className="flex items-center justify-center overflow-auto bg-muted/30 rounded-lg"
      style={{ minHeight: 500 }}
    >
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={zoom}
        scaleY={zoom}
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{ cursor: 'default' }}
      >
        <Layer>
          {/* Outer padding offset */}
          <Group x={40 / zoom} y={40 / zoom}>
            {/* Badge Background */}
            <Rect
              id="badge-bg"
              width={canvasWidth}
              height={canvasHeight}
              fill={backgroundColor}
              cornerRadius={0}
              shadowColor="rgba(0,0,0,0.15)"
              shadowBlur={12}
              shadowOffsetX={2}
              shadowOffsetY={4}
            />

            {/* Background Image */}
            {bgImageObj && (
              <KonvaImage
                image={bgImageObj}
                width={canvasWidth}
                height={canvasHeight}
                listening={false}
              />
            )}

            {/* Grid */}
            {showGrid && (
              <GridLines width={canvasWidth} height={canvasHeight} gridSize={gridSize} />
            )}

            {/* Elements */}
            {sortedElements.map(renderElement)}

            {/* Transformer for selection handles */}
            <Transformer
              ref={transformerRef}
              rotateEnabled
              keepRatio={(() => {
                const selectedNodes = selectedElementIds.map(id => elements.find(el => el.id === id)).filter(Boolean);
                // Lock ratio if any selected element is image, qrCode, or circle shape
                return selectedNodes.some(el => 
                  el?.type === 'image' || 
                  el?.type === 'qrCode' || 
                  (el?.type === 'shape' && el?.shapeType === 'circle')
                );
              })()}
              enabledAnchors={(() => {
                const selectedNodes = selectedElementIds.map(id => elements.find(el => el.id === id)).filter(Boolean);
                const hasFixedRatio = selectedNodes.some(el => 
                  el?.type === 'image' || 
                  el?.type === 'qrCode' || 
                  (el?.type === 'shape' && el?.shapeType === 'circle')
                );
                
                if (hasFixedRatio) {
                  // Only corner anchors for fixed ratio elements
                  return ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
                }
                return [
                  'top-left', 'top-right', 'bottom-left', 'bottom-right',
                  'top-center', 'bottom-center', 'middle-left', 'middle-right',
                ];
              })()}
              borderStroke="#6366f1"
              borderStrokeWidth={1.5}
              anchorFill="#ffffff"
              anchorStroke="#6366f1"
              anchorSize={8}
              anchorCornerRadius={2}
              padding={2}
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
};

export default BadgeCanvas;
