import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Optimized badge generation utility
export interface BadgeGenerationOptions {
  scale?: number;
  format?: 'jpeg' | 'png';
  quality?: number;
  backgroundColor?: string;
}

export const DEFAULT_BADGE_OPTIONS: BadgeGenerationOptions = {
  scale: 1.5, // Optimized scale for faster rendering
  format: 'jpeg', // Smaller file size
  quality: 0.9, // High quality but compressed
  backgroundColor: '#ffffff'
};

/**
 * Generate a single badge PDF with optimized settings
 */
export async function generateSingleBadgePDF(
  element: HTMLElement,
  options: BadgeGenerationOptions = DEFAULT_BADGE_OPTIONS
): Promise<Blob> {
  const { scale, format, quality, backgroundColor } = { ...DEFAULT_BADGE_OPTIONS, ...options };
  
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor
  });
  
  const imgData = canvas.toDataURL(`image/${format}`, quality);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [400, 400] });
  pdf.addImage(imgData, format.toUpperCase(), 0, 0, 400, 400);
  
  return pdf.output('blob');
}

/**
 * Generate multiple badges PDF with parallel processing
 */
export async function generateBatchBadgePDF(
  elements: HTMLElement[],
  options: BadgeGenerationOptions = DEFAULT_BADGE_OPTIONS
): Promise<Blob> {
  const { scale, format, quality, backgroundColor } = { ...DEFAULT_BADGE_OPTIONS, ...options };
  
  // Process all badges in parallel for maximum speed
  const canvasPromises = elements.map((el) => 
    html2canvas(el, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor
    })
  );
  
  const canvases = await Promise.all(canvasPromises);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [400, 400] });
  
  for (let i = 0; i < canvases.length; i++) {
    const imgData = canvases[i].toDataURL(`image/${format}`, quality);
    if (i > 0) pdf.addPage([400, 400], 'portrait');
    pdf.addImage(imgData, format.toUpperCase(), 0, 0, 400, 400);
  }
  
  return pdf.output('blob');
}

/**
 * Optimized print function with faster iframe handling
 */
export function printPDFBlob(blob: Blob): void {
  const blobUrl = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  
  // Optimized iframe styling
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none'
  });
  
  iframe.src = blobUrl;
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    const cleanup = () => {
      if (iframe.parentNode) document.body.removeChild(iframe);
      URL.revokeObjectURL(blobUrl);
    };
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(cleanup, 200); // Reduced cleanup delay
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    
    try {
      const cw = iframe.contentWindow;
      cw?.focus();
      setTimeout(() => cw?.print(), 200); // Reduced print delay
    } catch (e) {
      setTimeout(cleanup, 60000); // Reduced fallback timeout
    }
    
    // Absolute fallback to avoid leaks
    setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibility);
      cleanup();
    }, 60000);
  };
}

/**
 * Wait for DOM element to be ready with optimized timeout
 */
export function waitForElement(
  selector: string,
  container: HTMLElement,
  timeout: number = 150
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const element = container.querySelector(selector) as HTMLElement;
    if (element) {
      resolve(element);
      return;
    }
    
    const timeoutId = setTimeout(() => resolve(null), timeout);
    
    const observer = new MutationObserver(() => {
      const element = container.querySelector(selector) as HTMLElement;
      if (element) {
        clearTimeout(timeoutId);
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(container, { childList: true, subtree: true });
  });
}
