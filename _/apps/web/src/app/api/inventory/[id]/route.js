import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";
import { z } from "zod";

// Get a single consumable item
export async function GET(request, { params }) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const { id } = params;
    const item = await sql`SELECT id, name, stock, created_at FROM consumable_items WHERE id = ${id}`;
    if (item.length === 0) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }
    return Response.json({ item: item[0] });
  } catch (error) {
    console.error("Error fetching item:", error);
    return Response.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

// Update item fields
export async function PUT(request, { params }) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const { id } = params;
    const bodySchema = z.object({
      name: z.string().min(1).optional(),
      stock: z.number().int().nonnegative().optional(),
    });
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const result = await sql`
      UPDATE consumable_items
      SET name = COALESCE(${data.name}, name),
          stock = COALESCE(${data.stock}, stock)
      WHERE id = ${id}
      RETURNING id, name, stock, created_at
    `;

    if (result.length === 0) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    return Response.json({ item: result[0] });
  } catch (error) {
    console.error("Error updating item:", error);
    return Response.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// Adjust stock by amount
export async function PATCH(request, { params }) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const { id } = params;
    const bodySchema = z.object({ amount: z.number().int() });
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { amount } = parsed.data;

    const current = await sql`SELECT stock FROM consumable_items WHERE id = ${id}`;
    if (current.length === 0) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }
    const newStock = current[0].stock + amount;
    if (newStock < 0) {
      return Response.json({ error: "Insufficient stock" }, { status: 400 });
    }
    const result = await sql`
      UPDATE consumable_items SET stock = ${newStock}
      WHERE id = ${id}
      RETURNING id, name, stock, created_at
    `;
    return Response.json({ item: result[0] });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return Response.json({ error: "Failed to adjust stock" }, { status: 500 });
  }
}

// Delete item
export async function DELETE(request, { params }) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const { id } = params;
    const result = await sql`
      DELETE FROM consumable_items WHERE id = ${id} RETURNING id, name, stock
    `;
    if (result.length === 0) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }
    return Response.json({ message: "Item deleted", item: result[0] });
  } catch (error) {
    console.error("Error deleting item:", error);
    return Response.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
