import * as fabric from 'fabric'

export async function uploadImageToCanvas(
  file: File,
  canvas: fabric.Canvas
): Promise<fabric.Image | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const dataURL = e.target?.result as string
      
      fabric.Image.fromURL(dataURL, (img) => {
        if (!img) {
          reject(new Error('Failed to load image'))
          return
        }
        
        // Scale image to reasonable size
        const maxWidth = 200
        const maxHeight = 200
        
        if (img.width && img.width > maxWidth) {
          img.scaleToWidth(maxWidth)
        }
        if (img.height && img.height > maxHeight) {
          img.scaleToHeight(maxHeight)
        }
        
        // Add to canvas
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
        
        resolve(img)
      })
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'))
    }
    
    reader.readAsDataURL(file)
  })
}

export function validateImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!validTypes.includes(file.type)) {
    return false
  }
  
  if (file.size > maxSize) {
    return false
  }
  
  return true
}


