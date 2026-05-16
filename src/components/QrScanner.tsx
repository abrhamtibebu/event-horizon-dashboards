import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'

interface QrScannerProps {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
  onClose: () => void
  paused?: boolean
}

export default function QrScanner({ onScan, onError, onClose, paused }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(true)
  const lastScannedRef = useRef<string>('')
  const lastScannedTimeRef = useRef<number>(0)

  useEffect(() => {
    const scannerId = 'qr-scanner-region'
    let mounted = true

    const startScanner = async () => {
      try {
        setIsStarting(true)
        setCameraError(null)

        const scanner = new Html5Qrcode(scannerId)
        scannerRef.current = scanner

        // Get available cameras to prefer back camera
        const cameras = await Html5Qrcode.getCameras()
        if (!cameras || cameras.length === 0) {
          setCameraError('No camera found on this device.')
          setIsStarting(false)
          return
        }

        // Prefer the back/environment camera
        const backCamera = cameras.find(
          (c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
        )
        const cameraId = backCamera?.id || cameras[cameras.length - 1].id

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Debounce: ignore the same code within 3 seconds
            const now = Date.now()
            if (
              decodedText === lastScannedRef.current &&
              now - lastScannedTimeRef.current < 3000
            ) {
              return
            }
            lastScannedRef.current = decodedText
            lastScannedTimeRef.current = now
            onScan(decodedText)
          },
          () => {
            // QR scan error (no code found in frame) - ignore silently
          }
        )

        if (mounted) {
          setIsStarting(false)
        }
      } catch (err: any) {
        console.error('QR Scanner error:', err)
        if (mounted) {
          const msg =
            typeof err === 'string'
              ? err
              : err?.message || 'Failed to access camera'
          
          if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
            setCameraError('Camera permission denied. Please allow camera access in your browser settings and try again.')
          } else if (msg.includes('NotFoundError')) {
            setCameraError('No camera found on this device.')
          } else if (msg.includes('NotReadableError') || msg.includes('in use')) {
            setCameraError('Camera is in use by another app. Please close other camera apps and try again.')
          } else {
            setCameraError(msg)
          }
          setIsStarting(false)
          onError?.(msg)
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      const scanner = scannerRef.current
      if (scanner) {
        try {
          const state = scanner.getState()
          if (
            state === Html5QrcodeScannerState.SCANNING ||
            state === Html5QrcodeScannerState.PAUSED
          ) {
            scanner.stop().catch(() => {})
          }
        } catch {
          // Scanner may already be stopped
        }
        scannerRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle pause/resume
  useEffect(() => {
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      const state = scanner.getState()
      if (paused && state === Html5QrcodeScannerState.SCANNING) {
        scanner.pause()
      } else if (!paused && state === Html5QrcodeScannerState.PAUSED) {
        scanner.resume()
      }
    } catch {
      // ignore
    }
  }, [paused])

  return (
    <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden">
      {/* Camera feed renders here */}
      <div
        id="qr-scanner-region"
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: 280 }}
      />

      {/* Loading overlay */}
      {isStarting && !cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Opening Camera...
          </span>
        </div>
      )}

      {/* Error overlay */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-300 font-medium max-w-[260px]">{cameraError}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
        </div>
      )}

      {/* Scanner frame overlay - only show when camera is active */}
      {!isStarting && !cameraError && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Corner brackets */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px]">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-lg" />
            {/* Scan line animation */}
            <div className="absolute left-2 right-2 h-0.5 bg-primary/60 animate-scan-line" />
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-30 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
