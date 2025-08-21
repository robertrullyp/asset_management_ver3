import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useUnits from "./useUnits";

const createWrapper = () => {
  const queryClient = new QueryClient();
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("useUnits", () => {
  it("fetches units successfully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ units: [{ id: 1 }] }),
    } as any);

    const { result } = renderHook(() => useUnits(""), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ units: [{ id: 1 }] });
    });
    expect(fetch).toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      headers: { get: () => "application/json" },
      json: async () => ({ error: "Failed" }),
      status: 500,
      statusText: "Server Error",
    } as any);

    const { result } = renderHook(() => useUnits(""), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
