import React, { useState } from 'react';
import { useBadgeStore } from '../store/useBadgeStore';
import { HomeIcon } from '@heroicons/react/24/outline';
import { RectangleStackIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const ToolButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left p-2 hover:bg-gray-200 rounded">
    {label}
  </button>
);

const navItems = [
  { label: 'Home', icon: HomeIcon },
  { label: 'Templates', icon: RectangleStackIcon },
  { label: 'Badge Generator', icon: Cog6ToothIcon },
];

const Toolbox = () => {
  const addElement = useBadgeStore(state => state.addElement);
  const [activeNav, setActiveNav] = useState('Home');

  return (
    <aside className="w-56 bg-white p-2 flex flex-col space-y-4 border-r h-full">
      {/* Navigation */}
      <nav className="mb-2">
        <ul className="space-y-1">
          {navItems.map(({ label, icon: Icon }) => (
            <li key={label}>
              <button
                className={`flex items-center w-full px-3 py-2 rounded text-sm font-medium transition-colors duration-150 ${
                  activeNav === label ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setActiveNav(label)}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-b mb-2" />
      <h2 className="text-xs font-bold p-2 uppercase tracking-wider text-gray-500">Elements</h2>
      <ToolButton label="Text" onClick={() => addElement('text')} />
      <ToolButton label="Image" onClick={() => addElement('image')} />
      <ToolButton label="QR Code" onClick={() => addElement('qr')} />
      <ToolButton label="Shape" onClick={() => addElement('shape')} />
    </aside>
  );
};

export default Toolbox; 