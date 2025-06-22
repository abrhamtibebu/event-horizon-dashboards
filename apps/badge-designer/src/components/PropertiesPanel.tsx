import React from 'react';

const PropertiesPanel = () => {
  return (
    <aside className="w-64 bg-white p-4 border-l">
      <h2 className="text-sm font-bold mb-4">Properties</h2>
      <div>
        {/* Properties for selected element will go here */}
        <p className="text-xs text-gray-500">Select an element to edit its properties.</p>
      </div>
    </aside>
  );
};

export default PropertiesPanel; 