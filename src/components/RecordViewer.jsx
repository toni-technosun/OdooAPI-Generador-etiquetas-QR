import React from 'react';

function RecordViewer({ records = [], type }) {
    // Asegurarnos de que records sea un array
    const safeRecords = Array.isArray(records) ? records : [];

    if (safeRecords.length === 0) {
        return <p>No hay registros guardados.</p>;
    }

    const parseImages = (images) => {
        if (!images) return [];
        try {
            // Si images es un string (JSON), intentamos parsearlo
            if (typeof images === 'string') {
                return JSON.parse(images);
            }
            // Si ya es un array, lo devolvemos
            if (Array.isArray(images)) {
                return images;
            }
            // Si no es ninguno de los anteriores, devolvemos array vacío
            return [];
        } catch (error) {
            console.error('Error al parsear imágenes:', error);
            return [];
        }
    };

    return (
        <div className="records-container">
            <h2>Registros Recientes</h2>
            <div className="records-grid">
                {safeRecords.map((record, index) => (
                    <div key={index} className="record-card">
                        {type === 'RMA' ? (
                            <>
                                <h3>RMA: {record.rma_number}</h3>
                                <p>Pallet: {record.has_pallet ? 'Sí' : 'No'}</p>
                                <p>Embalaje: {record.packaging_type === 'original' ? 'Original' : 
                                            record.packaging_type === 'no_original' ? 'No Original' : 'Sin embalaje'}</p>
                                <p>Estado: {record.packaging_condition}</p>
                                <p>Bultos: {record.bulk_count}</p>
                                {parseImages(record.images).length > 0 && (
                                    <div className="record-images">
                                        {parseImages(record.images).map((image, idx) => (
                                            <img 
                                                key={idx}
                                                src={image.url} 
                                                alt={`Imagen RMA ${idx + 1}`} 
                                                style={{ maxWidth: '200px', marginTop: '10px' }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <h3>SKU: {record.sku}</h3>
                                <p>Números de Serie:</p>
                                <pre>{record.serial_numbers?.split(':').join('\n')}</pre>
                            </>
                        )}
                        <p className="record-date">
                            {new Date(record.created_at).toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RecordViewer; 