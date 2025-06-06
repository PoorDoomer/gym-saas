'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, Camera, AlertCircle } from 'lucide-react'

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (result: string) => void
  title?: string
  description?: string
}

export function QRScanner({ 
  isOpen, 
  onClose, 
  onScan, 
  title = "QR Scanner",
  description = "Position the QR code within the camera view" 
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    if (isOpen) {
      startScanning()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isOpen])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Create a new instance of the code reader
      const reader = new BrowserMultiFormatReader()
      setCodeReader(reader)

      // Get video devices
      const videoInputDevices = await reader.listVideoInputDevices()
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found. Please ensure your device has a camera and grant permission.')
      }

      // Use the first available camera (usually back camera on mobile)
      const firstDeviceId = videoInputDevices[0].deviceId

      if (videoRef.current) {
        // Start decoding from video device
        reader.decodeFromVideoDevice(
          firstDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              // QR code successfully scanned
              const scannedText = result.getText()
              console.log('QR Code scanned:', scannedText)
              onScan(scannedText)
              stopScanning()
              onClose()
            }
            
            if (error && !(error.name === 'NotFoundException')) {
              // Only log actual errors, not "not found" which is normal
              console.error('QR scanning error:', error)
            }
          }
        )
      }
    } catch (err) {
      console.error('Error starting QR scanner:', err)
      setError(err instanceof Error ? err.message : 'Failed to start camera')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReader) {
      codeReader.reset()
      setCodeReader(null)
    }
    setIsScanning(false)
    setError(null)
  }

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-gray-100 rounded-lg object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  
                  {/* Scanner overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-blue-500 border-dashed rounded-lg"></div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {isScanning ? 'Scanning...' : 'Initializing...'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            {error && (
              <Button onClick={startScanning} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 