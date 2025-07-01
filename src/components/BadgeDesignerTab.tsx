import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/button';
import Badge from './Badge';
import { BadgeTemplate, BadgeElement } from '@/types/badge';
import {
  getBadgeTemplates,
  createBadgeTemplate,
  updateBadgeTemplate,
  deleteBadgeTemplate as apiDeleteBadgeTemplate,
} from '@/lib/api';

const FONT_FAMILIES = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia'];
const FONT_WEIGHTS = ['normal', 'bold', 'bolder', 'lighter'];
const TEXT_ALIGNS = ['left', 'center', 'right'];

const TOOLBOX_ELEMENTS = [
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'qr', label: 'QR Code' },
  { type: 'shape', label: 'Shape' },
];

const createDefaultTemplate = (name = 'Custom Badge'): BadgeTemplate => ({
  id: uuidv4(),
  name,
  pageSize: 'A6',
  backgroundColor: '#FFFFFF',
  backgroundImage: null,
  elements: [],
});

export const BadgeDesignerTab: React.FC<{ eventId?: string }> = ({ eventId }) => {
  // Multiple templates support
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates from backend or localStorage
  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    getBadgeTemplates(eventId)
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const loaded = res.data.map((t: any) => ({ ...t.template_json, id: t.id, name: t.name }));
          setTemplates(loaded);
          setActiveTemplateId(loaded[0]?.id || null);
        } else {
          const def = [createDefaultTemplate('Default Badge')];
          setTemplates(def);
          setActiveTemplateId(def[0].id);
        }
      })
      .catch(() => {
        // fallback to localStorage
        const saved = localStorage.getItem(`badge_templates_${eventId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setTemplates(parsed);
          setActiveTemplateId(parsed[0]?.id || null);
        } else {
          const def = [createDefaultTemplate('Default Badge')];
          setTemplates(def);
          setActiveTemplateId(def[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  // Save templates to backend or localStorage
  const saveTemplates = async (newTemplates: BadgeTemplate[]) => {
    if (!eventId) return;
    try {
      // Save each template (create or update)
      for (const t of newTemplates) {
        if (t.id && typeof t.id === 'number') {
          await updateBadgeTemplate(eventId, String(t.id), { name: t.name, template_json: t });
        } else {
          const res = await createBadgeTemplate(eventId, { name: t.name, template_json: t });
          t.id = res.data.id;
        }
      }
    } catch (e) {
      // fallback to localStorage
      localStorage.setItem(`badge_templates_${eventId}`, JSON.stringify(newTemplates));
    }
  };

  // Add new template
  const handleAddTemplate = async () => {
    const name = prompt('Template name?') || `Badge ${templates.length + 1}`;
    const newTemplate = createDefaultTemplate(name);
    const newTemplates = [...templates, newTemplate];
    setTemplates(newTemplates);
    setActiveTemplateId(newTemplate.id);
    await saveTemplates(newTemplates);
  };

  // Delete template
  const handleDeleteTemplate = async (id: string) => {
    if (templates.length === 1) return alert('At least one template required.');
    const t = templates.find(t => String(t.id) === String(id));
    if (t && t.id && typeof t.id === 'number') {
      try {
        await apiDeleteBadgeTemplate(eventId!, String(t.id));
      } catch (e) {
        // fallback: remove from localStorage
      }
    }
    const newTemplates = templates.filter(t => String(t.id) !== String(id));
    setTemplates(newTemplates);
    setActiveTemplateId(newTemplates[0].id);
    await saveTemplates(newTemplates);
  };

  // Select template
  const handleSelectTemplate = (id: string) => setActiveTemplateId(id);

  // Save current template
  const handleSave = async () => {
    const newTemplates = templates.map(t => t.id === activeTemplate.id ? activeTemplate : t);
    setTemplates(newTemplates);
    await saveTemplates(newTemplates);
    alert('Template saved!');
  };

  // Add element from toolbox
  const handleAddElement = (type: string) => {
    if (!activeTemplate) return;
    const newElement: BadgeElement = {
      id: uuidv4(),
      type,
      x: 50,
      y: 50,
      width: 100,
      height: 30,
      rotation: 0,
      zIndex: activeTemplate.elements.length + 1,
      ...(type === 'text' && { content: 'Text', fontFamily: 'Arial', fontSize: 18, fontWeight: 'normal', color: '#000', textAlign: 'left' }),
      ...(type === 'image' && { src: '{profilePicture}' }),
      ...(type === 'qr' && { vCardData: { firstName: '', lastName: '', organization: '', title: '', email: '', phone: '' } }),
      ...(type === 'shape' && { shapeType: 'rectangle', backgroundColor: '#eee', borderColor: '#ccc', borderWidth: 1 }),
    } as BadgeElement;
    const updated = { ...activeTemplate, elements: [...activeTemplate.elements, newElement] };
    updateActiveTemplate(updated);
    setSelectedElementId(newElement.id);
  };

  // Update active template
  const updateActiveTemplate = (updated: BadgeTemplate) => {
    const newTemplates = templates.map(t => t.id === updated.id ? updated : t);
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
  };

  // Select element
  const handleSelect = (id: string) => setSelectedElementId(id);

  // Update element properties
  const handleUpdateElement = (id: string, updates: Partial<BadgeElement>) => {
    if (!activeTemplate) return;
    const updated = {
      ...activeTemplate,
      elements: activeTemplate.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    };
    updateActiveTemplate(updated);
  };

  // Remove element
  const handleRemoveElement = (id: string) => {
    if (!activeTemplate) return;
    const updated = { ...activeTemplate, elements: activeTemplate.elements.filter(el => el.id !== id) };
    updateActiveTemplate(updated);
    setSelectedElementId(null);
  };

  // Simple drag (for demo)
  const handleDrag = (id: string, dx: number, dy: number) => {
    handleUpdateElement(id, { x: (activeTemplate.elements.find(e => e.id === id)?.x || 0) + dx, y: (activeTemplate.elements.find(e => e.id === id)?.y || 0) + dy });
  };

  // Handle background image upload
  const handleBackgroundImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeTemplate) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...activeTemplate, backgroundImage: reader.result as string };
      updateActiveTemplate(updated);
    };
    reader.readAsDataURL(file);
  };

  // Properties panel
  const selectedElement = activeTemplate?.elements.find(el => el.id === selectedElementId);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Template Management */}
      <div className="w-full md:w-1/5 space-y-2">
        <h3 className="font-bold mb-2">Templates</h3>
        {templates.map(t => (
          <div key={t.id} className="flex items-center gap-2 mb-1">
            <Button variant={t.id === activeTemplateId ? 'default' : 'outline'} className="flex-1" onClick={() => handleSelectTemplate(t.id)}>{t.name}</Button>
            <Button variant="destructive" size="icon" onClick={() => handleDeleteTemplate(t.id)} disabled={templates.length === 1}>×</Button>
          </div>
        ))}
        <Button className="w-full mt-2" onClick={handleAddTemplate}>Add Template</Button>
        <Button className="w-full mt-4" onClick={handleSave}>Save Template</Button>
        <div className="mb-4 p-2 bg-blue-50 rounded text-xs">
          <b>Available Placeholders:</b>
          <ul className="list-disc ml-4">
            <li>{'{firstName}'}, {'{lastName}'}, {'{fullName}'}</li>
            <li>{'{jobTitle}'}, {'{company}'}, {'{guestType}'}</li>
            <li>{'{email}'}, {'{phone}'}</li>
            <li>{'{profileImage}'} (for text or image src)</li>
          </ul>
        </div>
      </div>
      {/* Canvas */}
      <div className="relative bg-gray-100 border rounded shadow p-4 flex-1 min-h-[400px]" style={{ minWidth: 400, minHeight: 600 }}>
        <div style={{ position: 'relative', width: 396, height: 560, background: activeTemplate?.backgroundColor, backgroundImage: activeTemplate?.backgroundImage ? `url(${activeTemplate.backgroundImage})` : undefined, backgroundSize: 'cover' }}>
          {activeTemplate?.elements.map(el => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                border: selectedElementId === el.id ? '2px solid #3b82f6' : '1px dashed #ccc',
                cursor: 'move',
                zIndex: el.zIndex,
                background: el.type === 'shape' ? (el as any).backgroundColor : undefined,
              }}
              onClick={() => handleSelect(el.id)}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('text/plain', el.id);
              }}
              onDragEnd={e => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                const dx = e.clientX - rect.left;
                const dy = e.clientY - rect.top;
                handleDrag(el.id, dx, dy);
              }}
            >
              {el.type === 'text' && <span style={{ fontFamily: (el as any).fontFamily, fontSize: (el as any).fontSize, color: (el as any).color, fontWeight: (el as any).fontWeight, textAlign: (el as any).textAlign }}>{(el as any).content}</span>}
              {el.type === 'image' && <img src="https://via.placeholder.com/100" alt="img" style={{ width: '100%', height: '100%' }} />}
              {el.type === 'qr' && <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>QR</div>}
              {el.type === 'shape' && <div style={{ width: '100%', height: '100%' }} />}
              <button className="absolute top-0 right-0 bg-red-500 text-white rounded px-1 text-xs" onClick={e => { e.stopPropagation(); handleRemoveElement(el.id); }}>x</button>
            </div>
          ))}
        </div>
        {/* Toolbox */}
        <div className="absolute top-2 right-2 bg-white rounded shadow p-2">
          {TOOLBOX_ELEMENTS.map(tool => (
            <Button key={tool.type} variant="outline" size="sm" className="mb-1" onClick={() => handleAddElement(tool.type)}>{tool.label}</Button>
          ))}
        </div>
      </div>
      {/* Properties Panel */}
      <div className="w-full md:w-1/4 space-y-2">
        <h3 className="font-bold mb-2">Properties</h3>
        {/* Template properties */}
        <div className="mb-4 p-2 border rounded">
          <div>
            <label className="block text-xs">Background Color</label>
            <input type="color" value={activeTemplate?.backgroundColor || '#FFFFFF'} onChange={e => updateActiveTemplate({ ...activeTemplate, backgroundColor: e.target.value })} className="w-full border px-2 py-1 rounded" />
          </div>
          <div className="mt-2">
            <label className="block text-xs">Background Image</label>
            <input type="file" accept="image/*" onChange={handleBackgroundImage} className="w-full" />
            {activeTemplate?.backgroundImage && <img src={activeTemplate.backgroundImage} alt="bg" className="mt-2 w-full h-16 object-cover rounded" />}
          </div>
        </div>
        {/* Element properties */}
        {selectedElement ? (
          <div className="space-y-2">
            <div>
              <label className="block text-xs">X</label>
              <input type="number" value={selectedElement.x} onChange={e => handleUpdateElement(selectedElement.id, { x: Number(e.target.value) })} className="w-full border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="block text-xs">Y</label>
              <input type="number" value={selectedElement.y} onChange={e => handleUpdateElement(selectedElement.id, { y: Number(e.target.value) })} className="w-full border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="block text-xs">Width</label>
              <input type="number" value={selectedElement.width} onChange={e => handleUpdateElement(selectedElement.id, { width: Number(e.target.value) })} className="w-full border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="block text-xs">Height</label>
              <input type="number" value={selectedElement.height} onChange={e => handleUpdateElement(selectedElement.id, { height: Number(e.target.value) })} className="w-full border px-2 py-1 rounded" />
            </div>
            {selectedElement.type === 'text' && (
              <>
                <div>
                  <label className="block text-xs">Content</label>
                  <input type="text" value={(selectedElement as any).content} onChange={e => handleUpdateElement(selectedElement.id, { content: e.target.value })} className="w-full border px-2 py-1 rounded" />
                </div>
                <div>
                  <label className="block text-xs">Font Family</label>
                  <select value={(selectedElement as any).fontFamily} onChange={e => handleUpdateElement(selectedElement.id, { fontFamily: e.target.value })} className="w-full border px-2 py-1 rounded">
                    {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs">Font Size</label>
                  <input type="number" value={(selectedElement as any).fontSize} onChange={e => handleUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })} className="w-full border px-2 py-1 rounded" />
                </div>
                <div>
                  <label className="block text-xs">Font Weight</label>
                  <select value={(selectedElement as any).fontWeight} onChange={e => handleUpdateElement(selectedElement.id, { fontWeight: e.target.value })} className="w-full border px-2 py-1 rounded">
                    {FONT_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs">Text Align</label>
                  <select value={(selectedElement as any).textAlign} onChange={e => handleUpdateElement(selectedElement.id, { textAlign: e.target.value })} className="w-full border px-2 py-1 rounded">
                    {TEXT_ALIGNS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs">Color</label>
                  <input type="color" value={(selectedElement as any).color} onChange={e => handleUpdateElement(selectedElement.id, { color: e.target.value })} className="w-full border px-2 py-1 rounded" />
                </div>
              </>
            )}
            {/* Add more property controls as needed */}
          </div>
        ) : <div>Select an element to edit its properties.</div>}
      </div>
    </div>
  );
}; 