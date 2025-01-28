import React, { useState, useEffect } from 'react';
    import QRCode from 'qrcode';

    function App() {
      const [sku, setSku] = useState('');
      const [serialNumbers, setSerialNumbers] = useState('');
      const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
      const [labelSizes, setLabelSizes] = useState({
        large: false,
        small: false,
      });

      const generateQrCode = async () => {
        const serials = serialNumbers.split('\n').filter(line => line.trim() !== '').join(':');
        const value = `BULK:V1:${sku}:${serials}`;
        try {
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

      return (
        <div style={{ padding: '20px' }}>
          <h1>Generador de Etiquetas Logísticas QR</h1>
          <div className="form-group">
            <label htmlFor="sku">SKU:</label>
            <input
              type="text"
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
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
                  10x5mm
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
      );
    }

    export default App;
