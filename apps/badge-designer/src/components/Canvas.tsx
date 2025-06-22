import React from 'react';
import { useBadgeStore } from '../store/useBadgeStore';
import { PAGE_SIZES } from '../types/types';

// Convert mm to px for display (assuming 96 DPI)
const mmToPx = (mm: number) => (mm / 25.4) * 96;

const Canvas = () => {
  const template = useBadgeStore(state => state.template);
  const { pageSize, backgroundColor, backgroundImage } = template;
  
  const dimensions = PAGE_SIZES[pageSize];
  const style = {
    width: `${mmToPx(dimensions.width)}px`,
    height: `${mmToPx(dimensions.height)}px`,
    backgroundColor: backgroundColor,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
  };

  return (
    <div 
      className="shadow-lg relative bg-cover bg-center"
      style={style}
    >
      {/* Elements will be rendered here */}
    </div>
  );
};

export default Canvas; 