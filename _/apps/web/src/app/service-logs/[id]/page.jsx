"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

const queryClient = new QueryClient();

function ServiceLogDetailContent() {
  const id =
    typeof window !== "undefined" ? window.location.pathname.split("/").pop() : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["service-log", id],
    queryFn: async () => {
      const res = await fetch(`/api/service-logs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch service log");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Failed to load service log</div>;

  const log = data?.service_log;

  return (
    <div className="p-4 space-y-4">
      <a href="/service-logs" className="flex items-center text-sm text-blue-600">
        <ArrowLeft className="mr-1" size={16} /> Back
      </a>
      <h1 className="text-2xl font-bold">Service Log Detail</h1>
      {log && (
        <div className="space-y-4">
          <div>
            <span className="font-medium">Unit:</span> {log.unit_name || `Unit ${log.unit_id}`}
          </div>
          <div>
            <span className="font-medium">Hour Meter:</span> {log.hour_meter}
          </div>
          {log.materials?.length > 0 && (
            <div>
              <h2 className="font-medium mb-2">Materials</h2>
              <ul className="list-disc list-inside">
                {log.materials.map((m) => (
                  <li key={m.material_id}>
                    {m.material_name || `Material ${m.material_id}`} - {m.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {log.photos?.length > 0 && (
            <div>
              <h2 className="font-medium mb-2">Photos</h2>
              <div className="flex flex-wrap gap-2">
                {log.photos.map((p, i) => (
                  <img
                    key={i}
                    src={p.url}
                    alt="Photo"
                    className="h-32 w-32 object-cover rounded"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServiceLogDetailPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <ServiceLogDetailContent />
    </QueryClientProvider>
  );
}
