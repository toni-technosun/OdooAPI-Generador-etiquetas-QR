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
    if (!labelSizes.large && !labelSizes.small) {
      setValidationError('Por favor, selecciona al menos un tamaño de etiqueta');
      return false;
    }
    setValidationError('');
    return true;
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
        value = `RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}`;
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
            <label htmlFor="rma">RMA:</label>
            <input
              type="text"
              id="rma"
              value={rma}
              onChange={(e) => setRma(e.target.value)}
              autoFocus={activeTab === 'RMA'}
            />
          </div>
          <div className="form-group">
            <label>¿Viene en pallet?</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <input
                  type="radio"
                  id="pallet"
                  name="pallet"
                  value="pallet"
                  checked={isPallet === 'pallet'}
                  onChange={(e) => setIsPallet(e.target.value)}
                />
                <label htmlFor="pallet" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  Sí
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  id="no_pallet"
                  name="pallet"
                  value="no_pallet"
                  checked={isPallet === 'no_pallet'}
                  onChange={(e) => setIsPallet(e.target.value)}
                />
                <label htmlFor="no_pallet" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  No
                </label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Tipo de Embalaje:</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <input
                  type="radio"
                  id="original"
                  name="packaging"
                  value="original"
                  checked={packagingType === 'original'}
                  onChange={(e) => setPackagingType(e.target.value)}
                />
                <label htmlFor="original" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  Original
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  id="no_original"
                  name="packaging"
                  value="no_original"
                  checked={packagingType === 'no_original'}
                  onChange={(e) => setPackagingType(e.target.value)}
                />
                <label htmlFor="no_original" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  No Original
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  id="sin_embalaje"
                  name="packaging"
                  value="sin_embalaje"
                  checked={packagingType === 'sin_embalaje'}
                  onChange={(e) => setPackagingType(e.target.value)}
                />
                <label htmlFor="sin_embalaje" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  Sin embalaje
                </label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Estado del embalaje:</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <input
                  type="radio"
                  id="bueno"
                  name="condition"
                  value="Bueno"
                  checked={packagingCondition === 'Bueno'}
                  onChange={(e) => setPackagingCondition(e.target.value)}
                />
                <label htmlFor="bueno" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  Bueno
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  id="regular"
                  name="condition"
                  value="Regular"
                  checked={packagingCondition === 'Regular'}
                  onChange={(e) => setPackagingCondition(e.target.value)}
                />
                <label htmlFor="regular" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  Regular
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  id="malo"
                  name="condition"
                  value="Malo"
                  checked={packagingCondition === 'Malo'}
                  onChange={(e) => setPackagingCondition(e.target.value)}
                />
                <label htmlFor="malo" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  Malo
                </label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Tamaño de Etiqueta:</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <input
                  type="checkbox"
                  id="largeLabelRMA"
                  name="large"
                  checked={labelSizes.large}
                  onChange={handleLabelSizeChange}
                />
                <label htmlFor="largeLabelRMA" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
                  110x50mm
                </label>
              </div>
              <div>
                <input
                  type="checkbox"
                  id="smallLabelRMA"
                  name="small"
                  checked={labelSizes.small}
                  onChange={handleLabelSizeChange}
                />
                <label htmlFor="smallLabelRMA" style={{ fontWeight: 'normal', marginLeft: '5px' }}>
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
                  <p style={{ wordBreak: 'break-all' }}>{`RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}`}</p>
                </div>
              )}
              {labelSizes.small && (
                <div className="qr-code-container print-section small-label" style={{ marginTop: '10px' }}>
                  <img src={qrCodeDataUrl} alt="QR Code Small" style={{ maxWidth: '100%' }} />
                  <p style={{ wordBreak: 'break-all' }}>{`RMA:V1:${rma}:${isPallet === 'pallet' ? 'Pallet' : 'No Pallet'}:${packagingType === 'original' ? 'Original' : packagingType === 'no_original' ? 'No Original' : 'Sin embalaje'}:${packagingCondition}`}</p>
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
