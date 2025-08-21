import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";
import { z } from "zod";

// Get single service log with materials, consumables and photos
export async function GET(request, { params }) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const { id } = params;

    const logs = await sql`
      SELECT sl.*, u.unit_name
      FROM service_logs sl
      LEFT JOIN units u ON sl.unit_id = u.id
      WHERE sl.id = ${id}
    `;

    if (logs.length === 0) {
      return Response.json({ error: "Service log not found" }, { status: 404 });
    }

    const materials = await sql`
      SELECT slm.material_id, slm.quantity, m.name as material_name
      FROM service_log_materials slm
      LEFT JOIN materials m ON slm.material_id = m.id
      WHERE slm.service_log_id = ${id}
    `;

    const consumables = await sql`
      SELECT uc.consumable_id, uc.quantity, ci.name as consumable_name
      FROM unit_consumables uc
      LEFT JOIN consumable_items ci ON uc.consumable_id = ci.id
      WHERE uc.service_log_id = ${id}
    `;

    const photos = await sql`
      SELECT url FROM service_log_photos WHERE service_log_id = ${id}
    `;

    return Response.json({
      service_log: {
        ...logs[0],
        materials,
        consumables,
        photos,
      },
    });
  } catch (error) {
    console.error("Error fetching service log:", error);
    return Response.json(
      { error: "Failed to fetch service log" },
      { status: 500 },
    );
  }
}

// Update a service log and adjust stock
export async function PUT(request, { params }) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const { id } = params;
    const bodySchema = z.object({
      hour_meter: z.number().optional(),
      notes: z.string().optional(),
      materials: z
        .array(
          z.object({
            material_id: z.number(),
            quantity: z.number().positive(),
          }),
        )
        .optional()
        .default([]),
      consumables: z
        .array(
          z.object({
            consumable_id: z.number(),
            quantity: z.number().positive(),
          }),
        )
        .optional()
        .default([]),
      photos: z.array(z.string()).optional().default([]),
    });

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { hour_meter, notes, materials, consumables, photos } = parsed.data;

    await sql.transaction(async (tx) => {
      await tx`
        UPDATE service_logs
        SET hour_meter = COALESCE(${hour_meter}, hour_meter),
            notes = COALESCE(${notes}, notes)
        WHERE id = ${id}
      `;

      const existingMaterials = await tx`
        SELECT material_id, quantity FROM service_log_materials
        WHERE service_log_id = ${id}
      `;
      for (const m of existingMaterials) {
        await tx`UPDATE materials SET stock = stock + ${m.quantity} WHERE id = ${m.material_id}`;
      }
      await tx`DELETE FROM service_log_materials WHERE service_log_id = ${id}`;

      for (const m of materials) {
        await tx`
          INSERT INTO service_log_materials (service_log_id, material_id, quantity)
          VALUES (${id}, ${m.material_id}, ${m.quantity})
        `;
        await tx`
          UPDATE materials SET stock = stock - ${m.quantity} WHERE id = ${m.material_id}
        `;
      }

      const existingConsumables = await tx`
        SELECT consumable_id, quantity FROM unit_consumables
        WHERE service_log_id = ${id}
      `;
      for (const c of existingConsumables) {
        await tx`UPDATE consumable_items SET stock = stock + ${c.quantity} WHERE id = ${c.consumable_id}`;
      }
      await tx`DELETE FROM unit_consumables WHERE service_log_id = ${id}`;

      const unitRow = await tx`SELECT unit_id FROM service_logs WHERE id = ${id}`;
      const unitId = unitRow[0].unit_id;
      for (const c of consumables) {
        await tx`
          INSERT INTO unit_consumables (service_log_id, unit_id, consumable_id, quantity)
          VALUES (${id}, ${unitId}, ${c.consumable_id}, ${c.quantity})
        `;
        await tx`
          UPDATE consumable_items SET stock = stock - ${c.quantity} WHERE id = ${c.consumable_id}
        `;
      }

      await tx`DELETE FROM service_log_photos WHERE service_log_id = ${id}`;
      for (const url of photos) {
        await tx`
          INSERT INTO service_log_photos (service_log_id, url)
          VALUES (${id}, ${url})
        `;
      }
    });

    return Response.json({ message: "Service log updated" });
  } catch (error) {
    console.error("Error updating service log:", error);
    return Response.json(
      { error: "Failed to update service log" },
      { status: 500 },
    );
  }
}

// Delete a service log and restock materials
export async function DELETE(request, { params }) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const { id } = params;

    await sql.transaction(async (tx) => {
      const materials = await tx`
        SELECT material_id, quantity FROM service_log_materials
        WHERE service_log_id = ${id}
      `;
      for (const m of materials) {
        await tx`UPDATE materials SET stock = stock + ${m.quantity} WHERE id = ${m.material_id}`;
      }
      await tx`DELETE FROM service_log_materials WHERE service_log_id = ${id}`;

      const consumables = await tx`
        SELECT consumable_id, quantity FROM unit_consumables
        WHERE service_log_id = ${id}
      `;
      for (const c of consumables) {
        await tx`UPDATE consumable_items SET stock = stock + ${c.quantity} WHERE id = ${c.consumable_id}`;
      }
      await tx`DELETE FROM unit_consumables WHERE service_log_id = ${id}`;

      await tx`DELETE FROM service_log_photos WHERE service_log_id = ${id}`;
      await tx`DELETE FROM service_logs WHERE id = ${id}`;
    });

    return Response.json({ message: "Service log deleted" });
  } catch (error) {
    console.error("Error deleting service log:", error);
    return Response.json(
      { error: "Failed to delete service log" },
      { status: 500 },
    );
  }
}
