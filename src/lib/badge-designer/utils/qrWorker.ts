/**
 * Web Worker for QR code generation to avoid blocking main thread
 */

// QR code generation in worker
self.onmessage = function(e) {
  const { data, size, id } = e.data
  
  // Import QRCode library dynamically
  import('qrcode').then((QRCode) => {
    QRCode.toDataURL(data, {
      width: size || 150,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url: string) => {
        self.postMessage({ success: true, url, id })
      })
      .catch((error: Error) => {
        self.postMessage({ success: false, error: error.message, id })
      })
  }).catch((error) => {
    self.postMessage({ success: false, error: error.message, id })
  })
}

export {}





