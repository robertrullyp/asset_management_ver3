import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import crypto from "crypto";

// Get all units with company info
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    let query = `
      SELECT 
        u.*,
        c.name as company_name,
        c.address as company_address,
        c.contact_person,
        c.phone as company_phone,
        c.email as company_email,
        c.industry,
        c.customer_photo
      FROM units u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.is_active = true AND u.deleted_at IS NULL
    `;

    const params = [];

    if (search) {
      query += ` AND (
        LOWER(u.unit_name) LIKE LOWER($1) OR 
        LOWER(u.model) LIKE LOWER($1) OR 
        LOWER(u.serial_number) LIKE LOWER($1) OR
        LOWER(u.serial_number_engine) LIKE LOWER($1) OR
        LOWER(c.name) LIKE LOWER($1)
      )`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC`;

    const units = await sql(query, params);

    return Response.json({ units });
  } catch (error) {
    console.error("Error fetching units:", error);
    return Response.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

// Create new unit
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Generate unique access token using a secure random UUID
    const accessToken = crypto.randomUUID();

    const result = await sql(
      `
      INSERT INTO units (
        company_id, unit_name, model, model_engine, model_generator, 
        serial_number, serial_number_engine, serial_number_generator,
        install_date, access_token, specifications, warranty_end, register_date,
        frequency_hz, rpm, module_control, system_operation, operation_mode,
        transfer_system, oil_capacity_liters, oil_type,
        fuel_filter_part_number, fuel_filter_qty,
        fuel_separator_part_number, fuel_separator_qty,
        oil_filter_part_number, oil_filter_qty,
        air_filter_part_number, air_filter_qty, unit_photos
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING *
    `,
      [
        data.company_id || null,
        data.unit_name || "",
        data.model || null,
        data.model_engine || null,
        data.model_generator || null,
        data.serial_number || null,
        data.serial_number_engine || null,
        data.serial_number_generator || null,
        data.install_date || null,
        accessToken,
        data.specifications || null,
        data.warranty_end || null,
        data.register_date || new Date().toISOString().split("T")[0],
        data.frequency_hz || null,
        data.rpm || null,
        data.module_control || null,
        data.system_operation || null,
        data.operation_mode || null,
        data.transfer_system || null,
        data.oil_capacity_liters || null,
        data.oil_type || null,
        data.fuel_filter_part_number || null,
        data.fuel_filter_qty || 1,
        data.fuel_separator_part_number || null,
        data.fuel_separator_qty || 1,
        data.oil_filter_part_number || null,
        data.oil_filter_qty || 1,
        data.air_filter_part_number || null,
        data.air_filter_qty || 1,
        data.unit_photos || [],
      ],
    );

    return Response.json({ unit: result[0] });
  } catch (error) {
    console.error("Error creating unit:", error);
    return Response.json(
      {
        error: "Failed to create unit",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
