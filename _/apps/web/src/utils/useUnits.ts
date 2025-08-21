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
    credentials: "include",
  });

  const contentType = response.headers.get("content-type");
  let data: UnitsResponse;

  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    const lower = text.toLowerCase();

    if (
      text.trim().startsWith("<") ||
      lower.includes("signin") ||
      lower.includes("sign-in") ||
      lower.includes("login") ||
      lower.includes("unauth")
    ) {
      throw new Error("Unauthorized – redirecting to sign-in");
    }

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        !response.ok && text
          ? text
          : `Failed to fetch units: ${response.status} ${response.statusText}`
      );
    }
  } else {
    data = await response.json();
  }

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
