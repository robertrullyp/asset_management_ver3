import prisma from "@/app/api/utils/prisma";
import { requireRole } from "@/app/api/utils/auth-middleware";
import { z } from "zod";

// List service logs
export async function GET() {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const logs = await prisma.serviceLog.findMany({
      include: { unit: { select: { unitName: true } } },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      service_logs: logs.map((log) => ({
        id: log.id,
        unit_id: log.unitId,
        hour_meter: log.hourMeter,
        notes: log.notes,
        created_at: log.createdAt,
        updated_at: log.updatedAt,
        unit_name: log.unit?.unitName,
      })),
    });
  } catch (error) {
    console.error("Error fetching service logs:", error);
    return Response.json(
      { error: "Failed to fetch service logs" },
      { status: 500 },
    );
  }
}

// Create service log with materials, consumables and photos
export async function POST(request) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const bodySchema = z.object({
      unit_id: z.number(),
      hour_meter: z.number(),
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
    const { unit_id, hour_meter, notes, materials, consumables, photos } = parsed.data;

    const log = await prisma.$transaction(async (tx) => {
      const inserted = await tx.serviceLog.create({
        data: { unitId: unit_id, hourMeter: hour_meter, notes },
        select: { id: true, unitId: true, hourMeter: true, notes: true, createdAt: true, updatedAt: true },
      });

      for (const m of materials) {
        await tx.$executeRaw`INSERT INTO service_log_materials (service_log_id, material_id, quantity) VALUES (${inserted.id}, ${m.material_id}, ${m.quantity})`;
        await tx.$executeRaw`UPDATE materials SET stock = stock - ${m.quantity} WHERE id = ${m.material_id}`;
      }

      for (const c of consumables) {
        await tx.unitConsumable.create({
          data: {
            serviceLogId: inserted.id,
            unitId: unit_id,
            consumableId: c.consumable_id,
            quantity: c.quantity,
          },
        });
        await tx.consumableItem.update({
          where: { id: c.consumable_id },
          data: { stock: { decrement: c.quantity } },
        });
      }

      for (const url of photos) {
        await tx.$executeRaw`INSERT INTO service_log_photos (service_log_id, url) VALUES (${inserted.id}, ${url})`;
      }

      return inserted;
    });

    return Response.json({
      service_log: {
        id: log.id,
        unit_id: log.unitId,
        hour_meter: log.hourMeter,
        notes: log.notes,
        created_at: log.createdAt,
        updated_at: log.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating service log:", error);
    return Response.json(
      { error: "Failed to create service log" },
      { status: 500 },
    );
  }
}
