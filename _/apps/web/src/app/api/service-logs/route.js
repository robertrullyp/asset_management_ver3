import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";
import { z } from "zod";

// List service logs
export async function GET() {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const logs = await sql`
      SELECT sl.*, u.unit_name
      FROM service_logs sl
      LEFT JOIN units u ON sl.unit_id = u.id
      ORDER BY sl.created_at DESC
    `;

    return Response.json({ service_logs: logs });
  } catch (error) {
    console.error("Error fetching service logs:", error);
    return Response.json(
      { error: "Failed to fetch service logs" },
      { status: 500 },
    );
  }
}

// Create service log with materials and photos
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
      photos: z.array(z.string()).optional().default([]),
    });

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { unit_id, hour_meter, notes, materials, photos } = parsed.data;

    const log = await sql.transaction(async (tx) => {
      const [inserted] = await tx`
        INSERT INTO service_logs (unit_id, hour_meter, notes)
        VALUES (${unit_id}, ${hour_meter}, ${notes || null})
        RETURNING id, unit_id, hour_meter, notes, created_at
      `;

      for (const m of materials) {
        await tx`
          INSERT INTO service_log_materials (service_log_id, material_id, quantity)
          VALUES (${inserted.id}, ${m.material_id}, ${m.quantity})
        `;
        await tx`
          UPDATE materials SET stock = stock - ${m.quantity}
          WHERE id = ${m.material_id}
        `;
      }

      for (const url of photos) {
        await tx`
          INSERT INTO service_log_photos (service_log_id, url)
          VALUES (${inserted.id}, ${url})
        `;
      }

      return inserted;
    });

    return Response.json({ service_log: log }, { status: 201 });
  } catch (error) {
    console.error("Error creating service log:", error);
    return Response.json(
      { error: "Failed to create service log" },
      { status: 500 },
    );
  }
}
