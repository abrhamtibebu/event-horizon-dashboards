/**
 * Manager for QR code Web Worker
 */
import QRCode from 'qrcode'

// Fallback to main thread if workers not available
let worker: Worker | null = null
let workerAvailable = false

// Try to create worker (may fail in some environments)
try {
  // Note: In Vite, we need to handle worker differently
  // For now, we'll use a fallback approach
  workerAvailable = typeof Worker !== 'undefined'
} catch (e) {
  workerAvailable = false
}

interface QRTask {
  data: string
  size: number
  resolve: (url: string) => void
  reject: (error: Error) => void
}

const taskQueue: QRTask[] = []
let processing = false

async function processQueue() {
  if (processing || taskQueue.length === 0) return
  processing = true

  while (taskQueue.length > 0) {
    const task = taskQueue.shift()!
    try {
      const url = await QRCode.toDataURL(task.data, {
        width: task.size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
      task.resolve(url)
    } catch (error) {
      task.reject(error as Error)
    }
  }

  processing = false
}

export async function generateQRCode(data: string, size: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    taskQueue.push({ data, size, resolve, reject })
    
    // Process queue asynchronously
    if (!processing) {
      setTimeout(processQueue, 0)
    }
  })
}

export function cleanupQRWorker() {
  if (worker) {
    worker.terminate()
    worker = null
  }
}





