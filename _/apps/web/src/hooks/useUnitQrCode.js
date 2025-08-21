import { useState } from "react";

export function useUnitQrCode(unit) {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const generateQrCode = async () => {
    if (!unit?.id) return;

    try {
      setLoadingQr(true);
      const response = await fetch(`/api/units/${unit.id}/qr`);
      if (!response.ok) {
        throw new Error("Failed to generate QR code");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setQrCodeUrl(url);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setLoadingQr(false);
    }
  };

  const downloadQrCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `unit-${unit?.id}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { qrCodeUrl, loadingQr, generateQrCode, downloadQrCode };
}
