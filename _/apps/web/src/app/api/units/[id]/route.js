import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";

// Get single unit
export async function GET(request, { params }) {
  try {
    const authResult = await requireRole();
    if (authResult instanceof Response) return authResult;

    const { id } = params;

    const units = await sql`
      SELECT 
        u.*,
        c.name as company_name,
        c.address as company_address,
        c.phone as company_phone,
        c.contact_person,
        c.email as company_email,
        c.customer_photo,
        c.industry
      FROM units u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.id = ${parseInt(id)} AND u.is_active = true AND u.deleted_at IS NULL
    `;

    if (units.length === 0) {
      return Response.json({ error: "Unit not found" }, { status: 404 });
    }

    const unit = units[0];

    // Fetch work history documents
    const workHistoryDocuments = await sql`
      SELECT 
        wh.id,
        wh.work_date,
        wh.description,
        wh.documents,
        u.name as teknisi_name
      FROM work_history wh
      LEFT JOIN users u ON wh.teknisi_id = u.id
      WHERE wh.unit_id = ${parseInt(id)} 
        AND wh.documents IS NOT NULL 
        AND array_length(wh.documents, 1) > 0
      ORDER BY wh.work_date DESC
      LIMIT 10
    `;

    return Response.json({
      unit,
      workHistoryDocuments,
    });
  } catch (error) {
    console.error("Error fetching unit:", error);
    return Response.json({ error: "Failed to fetch unit" }, { status: 500 });
  }
}

// Update unit
export async function PUT(request, { params }) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const { id } = params;
    const data = await request.json();

    const result = await sql(
      `
      UPDATE units SET
        company_id = $2,
        unit_name = $3,
        model = $4,
        model_engine = $5,
        model_generator = $6,
        serial_number = $7,
        serial_number_engine = $8,
        serial_number_generator = $9,
        install_date = $10,
        specifications = $11,
        warranty_end = $12,
        register_date = $13,
        frequency_hz = $14,
        rpm = $15,
        module_control = $16,
        system_operation = $17,
        operation_mode = $18,
        transfer_system = $19,
        oil_capacity_liters = $20,
        oil_type = $21,
        fuel_filter_part_number = $22,
        fuel_filter_qty = $23,
        fuel_separator_part_number = $24,
        fuel_separator_qty = $25,
        oil_filter_part_number = $26,
        oil_filter_qty = $27,
        air_filter_part_number = $28,
        air_filter_qty = $29,
        unit_photos = $30,
        documents = $31,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true AND deleted_at IS NULL
      RETURNING *
    `,
      [
        parseInt(id),
        data.company_id,
        data.unit_name,
        data.model,
        data.model_engine,
        data.model_generator,
        data.serial_number,
        data.serial_number_engine,
        data.serial_number_generator,
        data.install_date,
        data.specifications,
        data.warranty_end,
        data.register_date,
        data.frequency_hz,
        data.rpm,
        data.module_control,
        data.system_operation,
        data.operation_mode,
        data.transfer_system,
        data.oil_capacity_liters,
        data.oil_type,
        data.fuel_filter_part_number,
        data.fuel_filter_qty,
        data.fuel_separator_part_number,
        data.fuel_separator_qty,
        data.oil_filter_part_number,
        data.oil_filter_qty,
        data.air_filter_part_number,
        data.air_filter_qty,
        data.unit_photos,
        data.documents,
      ],
    );

    if (result.length === 0) {
      return Response.json({ error: "Unit not found" }, { status: 404 });
    }

    return Response.json({ unit: result[0] });
  } catch (error) {
    console.error("Error updating unit:", error);
    return Response.json(
      {
        error: "Failed to update unit",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// Delete unit (soft delete)
export async function DELETE(request, { params }) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const { id } = params;

    // Check if unit has active tasks
    const tasksCheck = await sql`
      SELECT COUNT(*) as task_count FROM tasks 
      WHERE unit_id = ${parseInt(id)} AND status NOT IN ('completed', 'closed') AND deleted_at IS NULL
    `;

    if (parseInt(tasksCheck[0]?.task_count) > 0) {
      return Response.json(
        {
          error: "Cannot delete unit with active tasks",
          details: `This unit has ${tasksCheck[0].task_count} active tasks. Please complete or close the tasks first.`,
        },
        { status: 400 },
      );
    }

    const result = await sql`
      UPDATE units 
      SET 
        is_active = false,
        deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)} AND is_active = true AND deleted_at IS NULL
      RETURNING id, unit_name, deleted_at
    `;

    if (result.length === 0) {
      return Response.json({ error: "Unit not found" }, { status: 404 });
    }

    return Response.json({
      message: "Unit deleted successfully",
      unit: result[0],
    });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return Response.json({ error: "Failed to delete unit" }, { status: 500 });
  }
}
