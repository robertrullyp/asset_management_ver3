import sql from "@/app/api/utils/sql";
import prisma from "@/app/api/utils/prisma";
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

    await prisma.$transaction(async (tx) => {
      await tx.serviceLog.update({
        where: { id: Number(id) },
        data: {
          hourMeter: hour_meter ?? undefined,
          notes: notes ?? undefined,
        },
      });

      const existingMaterials = await tx.$queryRaw`
        SELECT material_id, quantity FROM service_log_materials
        WHERE service_log_id = ${id}
      `;
      for (const m of existingMaterials) {
        await tx.$executeRaw`UPDATE materials SET stock = stock + ${m.quantity} WHERE id = ${m.material_id}`;
      }
      await tx.$executeRaw`DELETE FROM service_log_materials WHERE service_log_id = ${id}`;

      for (const m of materials) {
        await tx.$executeRaw`INSERT INTO service_log_materials (service_log_id, material_id, quantity) VALUES (${id}, ${m.material_id}, ${m.quantity})`;
        await tx.$executeRaw`UPDATE materials SET stock = stock - ${m.quantity} WHERE id = ${m.material_id}`;
      }

      const existingConsumables = await tx.unitConsumable.findMany({
        where: { serviceLogId: Number(id) },
        select: { consumableId: true, quantity: true },
      });
      for (const c of existingConsumables) {
        await tx.consumableItem.update({
          where: { id: c.consumableId },
          data: { stock: { increment: c.quantity } },
        });
      }
      await tx.unitConsumable.deleteMany({ where: { serviceLogId: Number(id) } });

      const unit = await tx.serviceLog.findUnique({
        where: { id: Number(id) },
        select: { unitId: true },
      });
      const unitId = unit.unitId;

      const consumableTotals = consumables.reduce(
        (acc, { consumable_id, quantity }) => {
          acc.set(
            consumable_id,
            (acc.get(consumable_id) ?? 0) + quantity,
          );
          return acc;
        },
        new Map(),
      );

      for (const [consumableId, totalQty] of consumableTotals) {
        await tx.unitConsumable.create({
          data: {
            serviceLogId: Number(id),
            unitId,
            consumableId,
            quantity: totalQty,
          },
        });
        await tx.consumableItem.update({
          where: { id: consumableId },
          data: { stock: { decrement: totalQty } },
        });
      }

      await tx.$executeRaw`DELETE FROM service_log_photos WHERE service_log_id = ${id}`;
      for (const url of photos) {
        await tx.$executeRaw`INSERT INTO service_log_photos (service_log_id, url) VALUES (${id}, ${url})`;
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

    await prisma.$transaction(async (tx) => {
      const materials = await tx.$queryRaw`
        SELECT material_id, quantity FROM service_log_materials
        WHERE service_log_id = ${id}
      `;
      for (const m of materials) {
        await tx.$executeRaw`UPDATE materials SET stock = stock + ${m.quantity} WHERE id = ${m.material_id}`;
      }
      await tx.$executeRaw`DELETE FROM service_log_materials WHERE service_log_id = ${id}`;

      const consumables = await tx.unitConsumable.findMany({
        where: { serviceLogId: Number(id) },
        select: { consumableId: true, quantity: true },
      });
      for (const c of consumables) {
        await tx.consumableItem.update({
          where: { id: c.consumableId },
          data: { stock: { increment: c.quantity } },
        });
      }
      await tx.unitConsumable.deleteMany({ where: { serviceLogId: Number(id) } });

      await tx.$executeRaw`DELETE FROM service_log_photos WHERE service_log_id = ${id}`;
      await tx.serviceLog.delete({ where: { id: Number(id) } });
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
