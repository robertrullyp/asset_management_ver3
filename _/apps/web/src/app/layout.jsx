// src/app/layout.jsx
"use client"; // <- Penting untuk React Query bekerja

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const metadata = {
  title: "Generator Set Management System",
  description: "Manage and monitor your generator units",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .catch((err) => {
          console.error("Service worker registration failed:", err);
        });
    }
  }, []);

  return (
    <>
      <script src="https://cdn.tailwindcss.com"></script>
      <div className="bg-gray-50 min-h-screen">
        {/* ✅ Bungkus children dengan QueryClientProvider */}
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </div>
    </>
  );
}
