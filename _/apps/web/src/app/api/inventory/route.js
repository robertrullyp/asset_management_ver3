import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";
import { z } from "zod";

// List consumable items
export async function GET() {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const items = await sql`SELECT id, name, stock, created_at FROM consumable_items ORDER BY name`;
    return Response.json({ items });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return Response.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

// Create a new consumable item
export async function POST(request) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const bodySchema = z.object({
      name: z.string().min(1),
      stock: z.number().int().nonnegative().optional().default(0),
    });
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { name, stock } = parsed.data;

    const result = await sql`
      INSERT INTO consumable_items (name, stock)
      VALUES (${name}, ${stock})
      RETURNING id, name, stock, created_at
    `;

    return Response.json({ item: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return Response.json({ error: "Failed to create item" }, { status: 500 });
  }
}
