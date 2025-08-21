import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";
import crypto from "crypto";
import { z } from "zod";

// Get all units with company info
export async function GET(request) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const url = new URL(request.url);
    const querySchema = z.object({
      search: z.string().trim().max(100).optional(),
      sortBy: z
        .enum(["created_at", "unit_name"])
        .optional()
        .default("created_at"),
    });

    const parseResult = querySchema.safeParse(
      Object.fromEntries(url.searchParams.entries()),
    );
    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid query parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { search, sortBy } = parseResult.data;

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
      params.push(`%${search}%`);
      query += ` AND (
        LOWER(u.unit_name) LIKE LOWER($${params.length}) OR
        LOWER(u.model) LIKE LOWER($${params.length}) OR
        LOWER(u.serial_number) LIKE LOWER($${params.length}) OR
        LOWER(u.serial_number_engine) LIKE LOWER($${params.length}) OR
        LOWER(c.name) LIKE LOWER($${params.length})
      )`;
    }

    const sortColumns = {
      created_at: "u.created_at",
      unit_name: "u.unit_name",
    };
    query += ` ORDER BY ${sortColumns[sortBy]} DESC`;

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
    const session = await requireRole();
    if (session instanceof Response) return session;

    const bodySchema = z.object({
      company_id: z.number().int().optional().nullable(),
      unit_name: z.string().min(1),
      model: z.string().optional().nullable(),
      model_engine: z.string().optional().nullable(),
      model_generator: z.string().optional().nullable(),
      serial_number: z.string().optional().nullable(),
      serial_number_engine: z.string().optional().nullable(),
      serial_number_generator: z.string().optional().nullable(),
      install_date: z.string().optional().nullable(),
      specifications: z.string().optional().nullable(),
      warranty_end: z.string().optional().nullable(),
      register_date: z.string().optional().nullable(),
      frequency_hz: z.number().optional().nullable(),
      rpm: z.number().optional().nullable(),
      module_control: z.string().optional().nullable(),
      system_operation: z.string().optional().nullable(),
      operation_mode: z.string().optional().nullable(),
      transfer_system: z.string().optional().nullable(),
      oil_capacity_liters: z.number().optional().nullable(),
      oil_type: z.string().optional().nullable(),
      fuel_filter_part_number: z.string().optional().nullable(),
      fuel_filter_qty: z.number().optional().default(1),
      fuel_separator_part_number: z.string().optional().nullable(),
      fuel_separator_qty: z.number().optional().default(1),
      oil_filter_part_number: z.string().optional().nullable(),
      oil_filter_qty: z.number().optional().default(1),
      air_filter_part_number: z.string().optional().nullable(),
      air_filter_qty: z.number().optional().default(1),
      unit_photos: z.array(z.string()).optional().default([]),
    });

    const body = bodySchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json(
        { error: "Invalid input", details: body.error.flatten() },
        { status: 400 },
      );
    }
    const data = body.data;

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
        data.company_id ?? null,
        data.unit_name ?? "",
        data.model ?? null,
        data.model_engine ?? null,
        data.model_generator ?? null,
        data.serial_number ?? null,
        data.serial_number_engine ?? null,
        data.serial_number_generator ?? null,
        data.install_date ?? null,
        accessToken,
        data.specifications ?? null,
        data.warranty_end ?? null,
        data.register_date ?? new Date().toISOString().split("T")[0],
        data.frequency_hz ?? null,
        data.rpm ?? null,
        data.module_control ?? null,
        data.system_operation ?? null,
        data.operation_mode ?? null,
        data.transfer_system ?? null,
        data.oil_capacity_liters ?? null,
        data.oil_type ?? null,
        data.fuel_filter_part_number ?? null,
        data.fuel_filter_qty ?? 1,
        data.fuel_separator_part_number ?? null,
        data.fuel_separator_qty ?? 1,
        data.oil_filter_part_number ?? null,
        data.oil_filter_qty ?? 1,
        data.air_filter_part_number ?? null,
        data.air_filter_qty ?? 1,
        data.unit_photos ?? [],
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
