"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function SalesDashboardContent() {
  const { data: remindersData } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const res = await fetch("/api/reminders?upcoming=true");
      if (!res.ok) throw new Error("Failed to fetch reminders");
      return res.json();
    },
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch(
        "/api/tasks?status=pending&sortBy=deadline&sortOrder=asc"
      );
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const reminders = remindersData?.reminders || [];
  const tasks = tasksData?.tasks || [];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">Upcoming Reminders</h2>
        <ul className="space-y-2">
          {reminders.length === 0 && (
            <li className="text-gray-500">No upcoming reminders</li>
          )}
          {reminders.map((r) => (
            <li key={r.id} className="border p-3 rounded-md">
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-gray-500">
                {new Date(r.remind_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Pending Tasks</h2>
        <ul className="space-y-2">
          {tasks.length === 0 && (
            <li className="text-gray-500">No pending tasks</li>
          )}
          {tasks.map((t) => (
            <li key={t.id} className="border p-3 rounded-md">
              <div className="font-medium">{t.title}</div>
              {t.deadline && (
                <div className="text-sm text-gray-500">
                  Due {new Date(t.deadline).toLocaleDateString()}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function SalesDashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <SalesDashboardContent />
    </QueryClientProvider>
  );
}
