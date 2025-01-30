import React, { useState, useRef, useEffect } from 'react';
import './ImageCapture.css';

function ImageCapture({ onImageCapture }) {
    const [images, setImages] = useState([]);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Limpiar el stream de la cámara cuando el componente se desmonta
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newImages = await Promise.all(files.map(async (file) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({
                            url: reader.result,
                            type: file.type,
                            name: file.name
                        });
                    };
                    reader.readAsDataURL(file);
                });
            }));

            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);
            onImageCapture(updatedImages);
            setCameraError(null);
        }
    };

    const startCamera = async () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setShowCamera(true);
            setCameraError(null);
        } catch (error) {
            console.error('Error al acceder a la cámara:', error);
            setCameraError('Error al acceder a la cámara. Por favor, asegúrate de que tienes una cámara conectada y has dado los permisos necesarios.');
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const captureImage = () => {
        if (!videoRef.current) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        const newImage = {
            url: imageData,
            type: 'image/jpeg',
            name: `captura_${new Date().toISOString()}.jpg`
        };
        
        const updatedImages = [...images, newImage];
        setImages(updatedImages);
        onImageCapture(updatedImages);
        stopCamera();
    };

    const removeImage = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
        onImageCapture(updatedImages);
    };

    return (
        <div className="image-capture-container">
            <div className="image-capture-buttons">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="image-input"
                    multiple
                />
                <label htmlFor="image-input" className="button-like" title="Seleccionar Imágenes">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                    </svg>
                </label>
                <button 
                    onClick={showCamera ? stopCamera : startCamera}
                    className={`camera-button ${showCamera ? 'active' : ''}`}
                    title={showCamera ? 'Cerrar Cámara' : 'Usar Cámara'}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                    </svg>
                </button>
            </div>

            {cameraError && (
                <div className="error-message">
                    {cameraError}
                </div>
            )}

            {showCamera && (
                <div className="camera-container">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                    />
                    <button onClick={captureImage} title="Capturar Foto">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="8"/>
                            <circle cx="12" cy="12" r="2"/>
                        </svg>
                    </button>
                </div>
            )}

            {images.length > 0 && (
                <div className="images-grid">
                    {images.map((image, index) => (
                        <div key={index} className="image-preview">
                            <img
                                src={image.url}
                                alt={`Vista previa ${index + 1}`}
                            />
                            <button 
                                onClick={() => removeImage(index)} 
                                title="Eliminar Imagen"
                                className="delete-button"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ImageCapture; 