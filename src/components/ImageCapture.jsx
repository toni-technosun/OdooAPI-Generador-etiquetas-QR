import React, { useState, useRef } from 'react';

function ImageCapture({ onImageCapture }) {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
                onImageCapture(reader.result, file.type);
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setShowCamera(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Error al acceder a la cámara. Por favor, asegúrate de que tienes una cámara conectada y has dado los permisos necesarios.');
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
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setPreviewUrl(imageData);
        onImageCapture(imageData, 'image/jpeg');
        stopCamera();
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
                />
                <label htmlFor="image-input" className="button-like">
                    Seleccionar Imagen
                </label>
                {!showCamera ? (
                    <button onClick={startCamera}>Usar Cámara</button>
                ) : (
                    <button onClick={stopCamera}>Cerrar Cámara</button>
                )}
            </div>

            {showCamera && (
                <div className="camera-container">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', maxWidth: '400px' }}
                    />
                    <button onClick={captureImage}>Capturar</button>
                </div>
            )}

            {previewUrl && (
                <div className="image-preview">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ width: '100%', maxWidth: '400px' }}
                    />
                    <button onClick={() => {
                        setPreviewUrl(null);
                        onImageCapture(null, null);
                    }}>
                        Eliminar Imagen
                    </button>
                </div>
            )}
        </div>
    );
}

export default ImageCapture; 