"use client";

import { useUnitQrCode } from "@/hooks/useUnitQrCode";
import { QrCode, Download } from "lucide-react";

export function UnitQRCodeCard({ unit }) {
  const { qrCodeUrl, loadingQr, generateQrCode, downloadQrCode } =
    useUnitQrCode(unit);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <QrCode className="h-5 w-5 mr-2" />
        QR Code Access
      </h3>
      <div className="text-center">
        <div className="bg-gray-100 p-4 rounded-lg mb-4 min-h-[200px] flex items-center justify-center">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Unit QR Code"
              className="max-w-full max-h-48 rounded"
            />
          ) : (
            <div className="flex flex-col items-center">
              <QrCode className="h-24 w-24 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Click below to generate QR code
              </p>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          QR code links to:{" "}
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
            /unit/{unit?.serial_number_engine || "ENGINE_SERIAL"}
          </span>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Anyone can scan this QR code to view unit info. Teknisi can start work
          sessions after login.
        </p>
        <div className="space-y-2">
          <button
            onClick={generateQrCode}
            disabled={loadingQr}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loadingQr
              ? "Generating..."
              : qrCodeUrl
              ? "Regenerate QR Code"
              : "Generate QR Code"}
          </button>
          {qrCodeUrl && (
            <button
              onClick={downloadQrCode}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
