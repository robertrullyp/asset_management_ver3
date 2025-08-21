"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";

const queryClient = new QueryClient();

function ServiceLogsContent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["service-logs"],
    queryFn: async () => {
      const res = await fetch("/api/service-logs");
      if (!res.ok) throw new Error("Failed to fetch service logs");
      return res.json();
    },
  });

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Failed to load service logs</div>;

  const logs = data?.service_logs || [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Service Logs</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Unit</th>
            <th className="px-4 py-2 text-left">Hour Meter</th>
            <th className="px-4 py-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="px-4 py-2">
                <a
                  href={`/service-logs/${log.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {log.unit_name || `Unit ${log.unit_id}`}
                </a>
              </td>
              <td className="px-4 py-2">{log.hour_meter}</td>
              <td className="px-4 py-2">
                {log.created_at &&
                  new Date(log.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ServiceLogsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <ServiceLogsContent />
    </QueryClientProvider>
  );
}
