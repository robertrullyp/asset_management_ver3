import sql from "@/app/api/utils/sql";
import { z } from "zod";

// Get all users
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const querySchema = z.object({
      search: z.string().trim().optional(),
      role: z.enum(["admin", "supervisor", "teknisi", "sales"]).optional(),
      active: z.enum(["true", "false"]).optional(),
    });

    const parsed = querySchema.safeParse(
      Object.fromEntries(url.searchParams.entries()),
    );
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { search, role, active } = parsed.data;

    let query = `
      SELECT 
        id, name, email, phone, role, is_active, created_at
      FROM users 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (
        LOWER(name) LIKE LOWER($${paramCount}) OR 
        LOWER(email) LIKE LOWER($${paramCount}) OR 
        LOWER(phone) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(active === "true");
    }

    query += ` ORDER BY created_at DESC`;

    const users = await sql(query, params);

    return Response.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// Create new user
export async function POST(request) {
  try {
    const bodySchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional().nullable(),
      role: z.enum(["admin", "supervisor", "teknisi", "sales"]),
      is_active: z.boolean().optional(),
    });

    const parsedBody = bodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return Response.json(
        { error: "Invalid input", details: parsedBody.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsedBody.data;

    // Check if email already exists
    const existingUser = await sql(
      `SELECT id FROM users WHERE email = $1`,
      [data.email]
    );

    if (existingUser.length > 0) {
      return Response.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const result = await sql(
      `
      INSERT INTO users (name, email, phone, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, is_active, created_at
      `,
      [
        data.name,
        data.email,
        data.phone || null,
        data.role,
        data.is_active !== undefined ? data.is_active : true,
      ]
    );

    return Response.json({ user: result[0] });
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json(
      { 
        error: "Failed to create user",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}