import { useQuery } from "@tanstack/react-query";

interface UnitsResponse {
  units: any[];
  [key: string]: any;
}

const fetchUnits = async (searchTerm: string): Promise<UnitsResponse> => {
  const url = new URL("/api/units", window.location.origin);
  if (searchTerm) url.searchParams.set("search", searchTerm);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const errorText = await response.text();
    throw new Error(
      !response.ok && errorText && !errorText.trim().startsWith("<")
        ? errorText
        : `Failed to fetch units: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.error ||
        `Failed to fetch units: ${response.status} ${response.statusText}`
    );
  }
  return data;
};

export function useUnits(searchTerm = "") {
  return useQuery({
    queryKey: ["units", searchTerm],
    queryFn: () => fetchUnits(searchTerm),
  });
}

export default useUnits;
