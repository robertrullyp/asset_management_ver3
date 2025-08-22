import { useQuery } from "@tanstack/react-query";

export interface Unit {
  id: number;
  company_id: number | null;
  unit_name: string;
  model: string | null;
  model_engine: string | null;
  model_generator: string | null;
  serial_number: string | null;
  serial_number_engine: string | null;
  serial_number_generator: string | null;
  install_date: string | null;
  access_token: string;
  specifications: string | null;
  warranty_end: string | null;
  register_date: string | null;
  frequency_hz: number | null;
  rpm: number | null;
  module_control: string | null;
  system_operation: string | null;
  operation_mode: string | null;
  transfer_system: string | null;
  oil_capacity_liters: number | null;
  oil_type: string | null;
  fuel_filter_part_number: string | null;
  fuel_filter_qty: number | null;
  fuel_separator_part_number: string | null;
  fuel_separator_qty: number | null;
  oil_filter_part_number: string | null;
  oil_filter_qty: number | null;
  air_filter_part_number: string | null;
  air_filter_qty: number | null;
  unit_photos: string[];
  documents: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  company_name: string | null;
  company_address: string | null;
  contact_person: string | null;
  company_phone: string | null;
  company_email: string | null;
  industry: string | null;
  customer_photo: string | null;
}

interface UnitsResponse {
  units: Unit[];
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
