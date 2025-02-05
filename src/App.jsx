import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import ImageCapture from './components/ImageCapture';
import RecordViewer from './components/RecordViewer';
import { initializeDB, addRMARecord, addLogisticsRecord, getRecentRMARecords, getRecentLogisticsRecords } from './db/database';

function App() {
  const [activeTab, setActiveTab] = useState('Logística');
  const [sku, setSku] = useState('');
  const [serialNumbers, setSerialNumbers] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [labelSizes, setLabelSizes] = useState({
    large: false,
    small: false,
  });
  const [rma, setRma] = useState('');
  const [isPallet, setIsPallet] = useState('');
  const [packagingType, setPackagingType] = useState('');
  const [packagingCondition, setPackagingCondition] = useState('');
  const [validationError, setValidationError] = useState('');
  const [bulkType, setBulkType] = useState('');
  const [customBulkNumber, setCustomBulkNumber] = useState('');
  const [images, setImages] = useState([]);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [recentRecords, setRecentRecords] = useState([]);
  const [serverStatus, setServerStatus] = useState({ isConnected: false, error: null, loading: true });

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDB();
        setServerStatus({ isConnected: true, error: null, loading: false });
        await loadRecentRecords();
      } catch (error) {
        console.error('Error de conexión:', error);
        setServerStatus({ 
          isConnected: false, 
          error: error.message || 'Error al conectar con el servidor', 
          loading: false 
        });
      }
    };
    init();
  }, []);

  const loadRecentRecords = async () => {
    if (!serverStatus.isConnected) return;
    
    try {
      const records = activeTab === 'RMA' 
        ? await getRecentRMARecords()
        : await getRecentLogisticsRecords();
      setRecentRecords(records);
    } catch (error) {
      console.error('Error al cargar registros:', error);
      setServerStatus(prev => ({
        ...prev,
        error: 'Error al cargar los registros'
      }));
    }
  };

  useEffect(() => {
    loadRecentRecords();
  }, [activeTab]);

  const handleImageCapture = (updatedImages) => {
    setImages(updatedImages);
  };

  const validateRMAForm = () => {
    if (!rma.trim()) {
      setValidationError('Por favor, introduce el número de RMA');
      return false;
    }
    if (!isPallet) {
      setValidationError('Por favor, selecciona si viene en pallet o no');
      return false;
    }
    if (!packagingType) {
      setValidationError('Por favor, selecciona el tipo de embalaje');
      return false;
    }
    if (!packagingCondition) {
      setValidationError('Por favor, selecciona el estado del embalaje');
      return false;
    }
    if (!bulkType) {
      setValidationError('Por favor, selecciona el número de bultos');
      return false;
    }
    if (bulkType === 'custom' && !customBulkNumber.trim()) {
      setValidationError('Por favor, especifica el número de bultos');
      return false;
    }
    if (!labelSizes.large && !labelSizes.small) {
      setValidationError('Por favor, selecciona al menos un tamaño de etiqueta');
      return false;
    }
    if (images.length === 0) {
      setValidationError('Por favor, añade al menos una imagen');
      return false;
    }
    setValidationError('');
    return true;
  };

  const getBulkNumber = () => {
    if (bulkType === 'one') return '1';
    if (bulkType === 'two') return '2';
    if (bulkType === 'custom') return customBulkNumber;
    return '';
  };

  const generateQrCode = async () => {
    if (activeTab === 'RMA' && !validateRMAForm()) {
      return;
    }

    try {
      const currentDate = new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/:/g, '-').replace(/\//g, '-');

      let value;
      if (activeTab === 'Logística') {
        const serialsArray = serialNumbers.split('\n').filter(line => line.trim() !== '');
        const serials = serialsArray.join(':');
        const serialCount = serialsArray.length.toString().padStart(2, '0');
        value = `BULK:V1:${sku}:${serialCount}:${serials}:[${currentDate}]`;
        await addLogisticsRecord({ sku, serialNumbers: serials });
      } else {
        value = `RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}:${getBulkNumber()} Bultos:[${currentDate}]`;
        await addRMARecord({
          rma,
          isPallet,
          packagingType,
          packagingCondition,
          bulkCount: getBulkNumber(),
          images: images
        });
      }

      const dataUrl = await QRCode.toDataURL(value, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: 'H'
      });
      setQrCodeDataUrl(dataUrl);
      
      // Recargar registros después de agregar uno nuevo
      await loadRecentRecords();
    } catch (err) {
      console.error('Error al generar el código QR:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLabelSizeChange = (event) => {
    setLabelSizes({
      ...labelSizes,
      [event.target.name]: event.target.checked,
    });
  };

  const handleSkuKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('serialNumbers').focus();
    }
  };

  if (serverStatus.loading) {
    return (
      <div style={{ 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <p>Conectando con el servidor...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {serverStatus.error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error: </strong>{serverStatus.error}
          <br />
          <small>Asegúrate de que el servidor esté ejecutándose en http://localhost:3001</small>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('Logística')} 
          style={{ fontWeight: activeTab === 'Logística' ? 'bold' : 'normal' }}
          disabled={!serverStatus.isConnected}
        >
          Logística
        </button>
        <button 
          onClick={() => setActiveTab('RMA')} 
          style={{ fontWeight: activeTab === 'RMA' ? 'bold' : 'normal' }}
          disabled={!serverStatus.isConnected}
        >
          RMA
        </button>
      </div>

      {activeTab === 'Logística' && (
        <div>
          <h1>Generador de Etiquetas Logísticas QR</h1>
          <div className="form-group">
            <label htmlFor="sku">SKU:</label>
            <input
              type="text"
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              onKeyDown={handleSkuKeyDown}
              autoFocus={activeTab === 'Logística'}
            />
          </div>
          <div className="form-group">
            <label htmlFor="serialNumbers">Números de Serie (uno por línea):</label>
            <textarea
              id="serialNumbers"
              rows="5"
              value={serialNumbers}
              onChange={(e) => setSerialNumbers(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <label>Tamaño de Etiqueta:</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
              <div>
                <input
                  type="checkbox"
                  id="largeLabel"
                  name="large"
                  checked={labelSizes.large}
                  onChange={handleLabelSizeChange}
                />
                <label htmlFor="largeLabel" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  110x50mm
                </label>
              </div>
              <div>
                <input
                  type="checkbox"
                  id="smallLabel"
                  name="small"
                  checked={labelSizes.small}
                  onChange={handleLabelSizeChange}
                />
                <label htmlFor="smallLabel" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  57x32mm
                </label>
              </div>
            </div>
          </div>

          <button onClick={generateQrCode}>
            Generar Código QR
          </button>

          {(labelSizes.large || labelSizes.small) && qrCodeDataUrl && (
            <div style={{ marginTop: '20px' }}>
              {labelSizes.large && (
                <div className="qr-code-container print-section large-label">
                  <img src={qrCodeDataUrl} alt="QR Code Large" style={{ maxWidth: '100%' }} />
                  <p style={{ wordBreak: 'break-all' }}>
                    {activeTab === 'Logística' ? 
                      `BULK:V1:${sku}:${serialNumbers.split('\n').filter(line => line.trim() !== '').join(':')}:[${new Date().toLocaleString('es-ES').replace(/:/g, '-').replace(/\//g, '-')}]` :
                      `RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}:${getBulkNumber()} Bultos:[${new Date().toLocaleString('es-ES').replace(/:/g, '-').replace(/\//g, '-')}]`
                    }
                  </p>
                </div>
              )}
              {labelSizes.small && (
                <div className="qr-code-container print-section small-label" style={{ marginTop: '10px' }}>
                  <img src={qrCodeDataUrl} alt="QR Code Small" style={{ maxWidth: '100%' }} />
                  <p style={{ wordBreak: 'break-all' }}>
                    {activeTab === 'Logística' ? 
                      `BULK:V1:${sku}:${serialNumbers.split('\n').filter(line => line.trim() !== '').join(':')}:[${new Date().toLocaleString('es-ES').replace(/:/g, '-').replace(/\//g, '-')}]` :
                      `RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}:${getBulkNumber()} Bultos:[${new Date().toLocaleString('es-ES').replace(/:/g, '-').replace(/\//g, '-')}]`
                    }
                  </p>
                </div>
              )}
              <button style={{ marginTop: '10px' }} onClick={handlePrint}>
                Imprimir / Guardar como PDF
              </button>
            </div>
          )}
          <RecordViewer records={recentRecords} type="Logística" />
        </div>
      )}

      {activeTab === 'RMA' && (
        <div>
          <h1>Generador de Etiquetas RMA</h1>
          {validationError && (
            <div style={{ color: 'red', marginBottom: '10px' }}>
              {validationError}
            </div>
          )}
          <div className="form-group">
            <label>RMA:</label>
            <div className="input-container">
              <input
                type="text"
                id="rma"
                value={rma}
                onChange={(e) => setRma(e.target.value)}
                autoFocus={activeTab === 'RMA'}
              />
            </div>
          </div>
          <div className="form-group">
            <label>¿Viene en pallet?</label>
            <div className="input-container">
              <div style={{ display: 'flex', gap: '20px' }}>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="pallet"
                    name="pallet"
                    value="pallet"
                    checked={isPallet === 'pallet'}
                    onChange={(e) => setIsPallet(e.target.value)}
                  />
                  <label htmlFor="pallet">Sí</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="no_pallet"
                    name="pallet"
                    value="no_pallet"
                    checked={isPallet === 'no_pallet'}
                    onChange={(e) => setIsPallet(e.target.value)}
                  />
                  <label htmlFor="no_pallet">No</label>
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Tipo de Embalaje:</label>
            <div className="input-container">
              <div style={{ display: 'flex', gap: '20px' }}>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="original"
                    name="packaging"
                    value="original"
                    checked={packagingType === 'original'}
                    onChange={(e) => setPackagingType(e.target.value)}
                  />
                  <label htmlFor="original">Original</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="no_original"
                    name="packaging"
                    value="no_original"
                    checked={packagingType === 'no_original'}
                    onChange={(e) => setPackagingType(e.target.value)}
                  />
                  <label htmlFor="no_original">No Original</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="sin_embalaje"
                    name="packaging"
                    value="sin_embalaje"
                    checked={packagingType === 'sin_embalaje'}
                    onChange={(e) => setPackagingType(e.target.value)}
                  />
                  <label htmlFor="sin_embalaje">Sin embalaje</label>
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Estado del embalaje:</label>
            <div className="input-container">
              <div style={{ display: 'flex', gap: '20px' }}>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="bueno"
                    name="condition"
                    value="Bueno"
                    checked={packagingCondition === 'Bueno'}
                    onChange={(e) => setPackagingCondition(e.target.value)}
                  />
                  <label htmlFor="bueno">Bueno</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="regular"
                    name="condition"
                    value="Regular"
                    checked={packagingCondition === 'Regular'}
                    onChange={(e) => setPackagingCondition(e.target.value)}
                  />
                  <label htmlFor="regular">Regular</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="malo"
                    name="condition"
                    value="Malo"
                    checked={packagingCondition === 'Malo'}
                    onChange={(e) => setPackagingCondition(e.target.value)}
                  />
                  <label htmlFor="malo">Malo</label>
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Tamaño de Etiqueta:</label>
            <div className="input-container">
              <div style={{ display: 'flex', gap: '20px' }}>
                <div className="radio-option">
                  <input
                    type="checkbox"
                    id="largeLabelRMA"
                    name="large"
                    checked={labelSizes.large}
                    onChange={handleLabelSizeChange}
                  />
                  <label htmlFor="largeLabelRMA">110x50mm</label>
                </div>
                <div className="radio-option">
                  <input
                    type="checkbox"
                    id="smallLabelRMA"
                    name="small"
                    checked={labelSizes.small}
                    onChange={handleLabelSizeChange}
                  />
                  <label htmlFor="smallLabelRMA">57x32mm</label>
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Número de Bultos:</label>
            <div className="input-container">
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="one_bulk"
                    name="bulk"
                    value="one"
                    checked={bulkType === 'one'}
                    onChange={(e) => {
                      setBulkType(e.target.value);
                      setCustomBulkNumber('');
                    }}
                  />
                  <label htmlFor="one_bulk">1 Bulto</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="two_bulk"
                    name="bulk"
                    value="two"
                    checked={bulkType === 'two'}
                    onChange={(e) => {
                      setBulkType(e.target.value);
                      setCustomBulkNumber('');
                    }}
                  />
                  <label htmlFor="two_bulk">2 Bultos</label>
                </div>
                <div className="radio-option" style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    id="custom_bulk"
                    name="bulk"
                    value="custom"
                    checked={bulkType === 'custom'}
                    onChange={(e) => setBulkType(e.target.value)}
                  />
                  <label htmlFor="custom_bulk">Más de 2:</label>
                  <input
                    type="number"
                    min="3"
                    style={{ width: '60px', marginLeft: '10px' }}
                    value={customBulkNumber}
                    onChange={(e) => setCustomBulkNumber(e.target.value)}
                    disabled={bulkType !== 'custom'}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Imagen:</label>
            <div className="input-container">
              <ImageCapture onImageCapture={handleImageCapture} />
            </div>
          </div>

          <button onClick={generateQrCode}>
            Generar Código QR
          </button>

          {(labelSizes.large || labelSizes.small) && qrCodeDataUrl && (
            <div style={{ marginTop: '20px' }}>
              {labelSizes.large && (
                <div className="qr-code-container print-section large-label">
                  <img src={qrCodeDataUrl} alt="QR Code Large" style={{ maxWidth: '100%' }} />
                  <p style={{ wordBreak: 'break-all' }}>
                    {activeTab === 'Logística' ? 
                      `BULK:V1:${sku}:${serialNumbers.split('\n').filter(line => line.trim() !== '').join(':')}:[${new Date().toLocaleString('es-ES').replace(/:/g, '-').replace(/\//g, '-')}]` :
                      `RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}:${getBulkNumber()} Bultos:[${new Date().toLocaleString('es-ES').replace(/:/g, '-').replace(/\//g, '-')}]`
                    }
                  </p>
                </div>
              )}
              {labelSizes.small && (
                <div className="qr-code-container print-section small-label" style={{ marginTop: '10px' }}>
                  <img src={qrCodeDataUrl} alt="QR Code Small" style={{ maxWidth: '100%' }} />
                  <p style={{ wordBreak: 'break-all' }}>
                    {activeTab === 'Logística' ? 
                      `BULK:V1:${sku}:${serialNumbers.split('\n').filter(line => line.trim() !== '').join(':')}:[${new Date().toLocaleString('es-ES').replace(/:/g, '-').replace(/\//g, '-')}]` :
                      `RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}:${getBulkNumber()} Bultos:[${new Date().toLocaleString('es-ES').replace(/:/g, '-').replace(/\//g, '-')}]`
                    }
                  </p>
                </div>
              )}
              <button style={{ marginTop: '10px' }} onClick={handlePrint}>
                Imprimir / Guardar como PDF
              </button>
            </div>
          )}
          <RecordViewer records={recentRecords} type="RMA" />
        </div>
      )}
    </div>
  );
}

export default App;
