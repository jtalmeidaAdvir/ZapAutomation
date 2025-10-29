import QRCodeDisplay from '../QRCodeDisplay';

export default function QRCodeDisplayExample() {
  const mockQRCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  
  return <QRCodeDisplay qrCode={mockQRCode} loading={false} />;
}
