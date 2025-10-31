import { useState, useEffect } from 'react';
import { QrReader } from '@blackbox-vision/react-qr-reader';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (data: string) => void;
  isEnabled?: boolean;
}

export function QRScanner({ onScan, isEnabled = true }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  useEffect(() => {
    // Request camera permission
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
    } catch (err) {
      setHasPermission(false);
      setError('Camera permission denied. Please enable camera access to scan QR codes.');
    }
  };

  const handleScan = (result: any) => {
    if (result && isEnabled) {
      const scannedData = result?.text || result;
      
      // Prevent scanning the same code multiple times
      if (scannedData && scannedData !== lastScanned) {
        setLastScanned(scannedData);
        onScan(scannedData);
        
        // Reset after 2 seconds to allow rescanning
        setTimeout(() => setLastScanned(null), 2000);
      }
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner error:', err);
    setError('Failed to access camera. Please check your camera settings.');
  };

  if (hasPermission === null) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Camera className="w-12 h-12 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Requesting camera permission...</p>
        </div>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Camera access is required to scan QR codes.'}
          </AlertDescription>
        </Alert>
        <Button
          onClick={requestCameraPermission}
          className="mt-4 w-full"
          variant="outline"
        >
          <Camera className="w-4 h-4 mr-2" />
          Enable Camera
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="relative aspect-square bg-black">
          {isEnabled ? (
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: 'environment' }}
              containerStyle={{
                width: '100%',
                height: '100%',
              }}
              videoStyle={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <CameraOff className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Scanner paused</p>
              </div>
            </div>
          )}
          
          {/* Viewfinder overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-4 border-white/50 rounded-lg w-64 h-64 relative">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Alert>
        <Camera className="h-4 w-4" />
        <AlertDescription>
          {isEnabled
            ? 'Position the QR code within the frame to scan'
            : 'Scanner is paused while processing previous scan'}
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

