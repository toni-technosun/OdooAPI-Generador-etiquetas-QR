import React, { useState } from 'react';
import QRCode from 'qrcode';

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
      let value;
      if (activeTab === 'Logística') {
        const serials = serialNumbers.split('\n').filter(line => line.trim() !== '').join(':');
        value = `BULK:V1:${sku}:${serials}`;
      } else {
        value = `RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}:${getBulkNumber()} Bultos`;
      }

      const dataUrl = await QRCode.toDataURL(value, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: 'H'
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('Logística')} style={{ fontWeight: activeTab === 'Logística' ? 'bold' : 'normal' }}>Logística</button>
        <button onClick={() => setActiveTab('RMA')} style={{ fontWeight: activeTab === 'RMA' ? 'bold' : 'normal' }}>RMA</button>
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
                  <p style={{ wordBreak: 'break-all' }}>{`BULK:V1:${sku}:${serialNumbers.split('\n').filter(line => line.trim() !== '').join(':')}`}</p>
                </div>
              )}
              {labelSizes.small && (
                <div className="qr-code-container print-section small-label" style={{ marginTop: '10px' }}>
                  <img src={qrCodeDataUrl} alt="QR Code Small" style={{ maxWidth: '100%' }} />
                  <p style={{ wordBreak: 'break-all' }}>{`BULK:V1:${sku}:${serialNumbers.split('\n').filter(line => line.trim() !== '').join(':')}`}</p>
                </div>
              )}
              <button style={{ marginTop: '10px' }} onClick={handlePrint}>
                Imprimir / Guardar como PDF
              </button>
            </div>
          )}
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

          <button onClick={generateQrCode}>
            Generar Código QR
          </button>

          {(labelSizes.large || labelSizes.small) && qrCodeDataUrl && (
            <div style={{ marginTop: '20px' }}>
              {labelSizes.large && (
                <div className="qr-code-container print-section large-label">
                  <img src={qrCodeDataUrl} alt="QR Code Large" style={{ maxWidth: '100%' }} />
                  <p style={{ wordBreak: 'break-all' }}>{`RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}:${getBulkNumber()} Bultos`}</p>
                </div>
              )}
              {labelSizes.small && (
                <div className="qr-code-container print-section small-label" style={{ marginTop: '10px' }}>
                  <img src={qrCodeDataUrl} alt="QR Code Small" style={{ maxWidth: '100%' }} />
                  <p style={{ wordBreak: 'break-all' }}>{`RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}:${getBulkNumber()} Bultos`}</p>
                </div>
              )}
              <button style={{ marginTop: '10px' }} onClick={handlePrint}>
                Imprimir / Guardar como PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
