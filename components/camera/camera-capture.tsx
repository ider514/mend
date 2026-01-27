'use client'

import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, RefreshCw } from 'lucide-react'

interface CameraCaptureProps {
    onCapture: (file: File) => void
    label?: string
}

export function CameraCapture({ onCapture, label = "Зураг авах" }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [image, setImage] = useState<string | null>(null)

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
        }
    }

    const takePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current

            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            const context = canvas.getContext('2d')
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height)

                // Convert to blob/file
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
                        onCapture(file)
                        setImage(canvas.toDataURL('image/jpeg'))
                        stopCamera()
                    }
                }, 'image/jpeg', 0.8)
            }
        }
    }, [onCapture])

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }

    const retake = () => {
        setImage(null)
        startCamera()
    }

    return (
        <div className="space-y-4">
            {image ? (
                <div className="relative rounded-lg overflow-hidden aspect-video bg-black">
                    <img src={image} alt="Taken selfie" className="w-full h-full object-cover" />
                    <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={retake}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" /> Дахин авах
                    </Button>
                </div>
            ) : (
                <div className="relative rounded-lg overflow-hidden aspect-video bg-black">
                    {!stream && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Button onClick={startCamera} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                                <Camera className="w-4 h-4 mr-2" /> Камер нээх
                            </Button>
                        </div>
                    )}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`}
                    />
                    {stream && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <Button onClick={takePhoto} size="lg" className="rounded-full h-16 w-16 p-0 border-4 border-white bg-transparent hover:bg-white/20">
                                <span className="sr-only">Take Photo</span>
                            </Button>
                        </div>
                    )}
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}
