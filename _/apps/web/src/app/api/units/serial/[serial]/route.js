import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  const { serial } = params;

  if (!serial) {
    return Response.json({ error: "Serial number is required" }, { status: 400 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return Response.json({ error: "Token is required" }, { status: 401 });
  }

  try {
    // Get unit by serial number with limited information for public access
    const [unit] = await sql`
      SELECT 
        u.id,
        u.unit_name,
        u.model,
        u.model_engine,
        u.model_generator,
        u.serial_number,
        u.serial_number_engine,
        u.serial_number_generator,
        u.install_date,
        u.register_date,
        u.warranty_end,
        u.is_active,
        u.frequency_hz,
        u.rpm,
        u.module_control,
        u.system_operation,
        u.operation_mode,
        u.transfer_system,
        u.oil_capacity_liters,
        u.oil_type,
        u.fuel_filter_part_number,
        u.fuel_filter_qty,
        u.fuel_separator_part_number,
        u.fuel_separator_qty,
        u.oil_filter_part_number,
        u.oil_filter_qty,
        u.air_filter_part_number,
        u.air_filter_qty,
        u.unit_photos,
        u.specifications,
        c.name as company_name,
        c.industry
      FROM units u
      JOIN companies c ON u.company_id = c.id
      WHERE u.serial_number = ${serial} AND u.access_token = ${token} AND u.is_active = true
    `;

    if (!unit) {
      return Response.json({ error: "Unit not found" }, { status: 404 });
    }

    // Get recent maintenance schedules (last 5)
    const maintenanceHistory = await sql`
      SELECT 
        maintenance_type,
        description,
        frequency_days,
        last_done,
        next_due,
        is_active
      FROM maintenance_schedules
      WHERE unit_id = ${unit.id} AND is_active = true
      ORDER BY next_due ASC
      LIMIT 5
    `;

    // Log the access
    const userAgent = request.headers.get("user-agent") || "";
    const forwardedFor = request.headers.get("x-forwarded-for");
    const remoteAddr = request.headers.get("x-real-ip");
    const clientIP = forwardedFor?.split(',')[0]?.trim() || remoteAddr || "";

    try {
      await sql`
        INSERT INTO unit_access_logs (unit_id, ip_address, user_agent, access_type)
        VALUES (${unit.id}, ${clientIP}::inet, ${userAgent}, 'qr_scan')
      `;
    } catch (logError) {
      // Don't fail the main request if logging fails
      console.error("Failed to log unit access:", logError);
    }

    return Response.json({
      unit: {
        ...unit,
        maintenanceHistory
      }
    });

  } catch (error) {
    console.error("Error fetching unit by serial:", error);
    return Response.json(
      { error: "Failed to fetch unit information" },
      { status: 500 }
    );
  }
}