import prisma from "@/app/api/utils/prisma";
import { requireRole } from "@/app/api/utils/auth-middleware";
import { z } from "zod";

// Get single service log with materials, consumables and photos
export async function GET(request, { params }) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const { id } = params;
    const log = await prisma.serviceLog.findUnique({
      where: { id: Number(id) },
      include: {
        unit: { select: { unitName: true } },
        materials: { include: { material: { select: { name: true } } } },
        unitConsumables: { include: { consumable: { select: { name: true } } } },
        photos: { select: { url: true } },
      },
    });

    if (!log) {
      return Response.json({ error: "Service log not found" }, { status: 404 });
    }

    return Response.json({
      service_log: {
        id: log.id,
        unit_id: log.unitId,
        hour_meter: log.hourMeter,
        notes: log.notes,
        created_at: log.createdAt,
        updated_at: log.updatedAt,
        unit_name: log.unit?.unitName,
        materials: log.materials.map((m) => ({
          material_id: m.materialId,
          material_name: m.material?.name,
          quantity: m.quantity,
        })),
        consumables: log.unitConsumables.map((c) => ({
          consumable_id: c.consumableId,
          consumable_name: c.consumable?.name,
          quantity: c.quantity,
        })),
        photos: log.photos.map((p) => ({ url: p.url })),
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

      const existingMaterials = await tx.serviceLogMaterial.findMany({
        where: { serviceLogId: Number(id) },
        select: { materialId: true, quantity: true },
      });
      for (const m of existingMaterials) {
        await tx.material.update({
          where: { id: m.materialId },
          data: { stock: { increment: m.quantity } },
        });
      }
      await tx.serviceLogMaterial.deleteMany({
        where: { serviceLogId: Number(id) },
      });

      for (const m of materials) {
        await tx.serviceLogMaterial.create({
          data: {
            serviceLogId: Number(id),
            materialId: m.material_id,
            quantity: m.quantity,
          },
        });
        await tx.material.update({
          where: { id: m.material_id },
          data: { stock: { decrement: m.quantity } },
        });
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

      await tx.serviceLogPhoto.deleteMany({ where: { serviceLogId: Number(id) } });
      for (const url of photos) {
        await tx.serviceLogPhoto.create({
          data: { serviceLogId: Number(id), url },
        });
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
      const materials = await tx.serviceLogMaterial.findMany({
        where: { serviceLogId: Number(id) },
        select: { materialId: true, quantity: true },
      });
      for (const m of materials) {
        await tx.material.update({
          where: { id: m.materialId },
          data: { stock: { increment: m.quantity } },
        });
      }
      await tx.serviceLogMaterial.deleteMany({
        where: { serviceLogId: Number(id) },
      });

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

      await tx.serviceLogPhoto.deleteMany({ where: { serviceLogId: Number(id) } });
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
