const QRCode = require('qrcode');

// Generates a QR code as a base64 data URL for the given payload
const generateQRCode = async (payload) => {
  const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const dataUrl = await QRCode.toDataURL(dataString, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
  });
  return dataUrl;
};

module.exports = { generateQRCode };
