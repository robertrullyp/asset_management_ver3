import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";
import { z } from "zod";

// Get all companies
export async function GET(request) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const url = new URL(request.url);
    const querySchema = z.object({
      search: z.string().trim().optional(),
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

    const { search } = parsed.data;

    let query = `SELECT * FROM companies WHERE deleted_at IS NULL`;
    const params = [];

    if (search) {
      query += ` AND LOWER(name) LIKE LOWER($${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY name ASC`;

    const companies = await sql(query, params);

    return Response.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return Response.json(
      { error: "Failed to fetch companies" },
      { status: 500 },
    );
  }
}

// Create new company
export async function POST(request) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const bodySchema = z.object({
      name: z.string().min(1),
      address: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      contact_person: z.string().optional().nullable(),
      email: z.string().email().optional().nullable(),
      customer_photo: z.string().optional().nullable(),
      industry: z.string().optional().nullable(),
    });

    const parsedBody = bodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return Response.json(
        { error: "Invalid input", details: parsedBody.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsedBody.data;

    const result = await sql(
      `
      INSERT INTO companies (name, address, phone, contact_person, email, customer_photo, industry)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        data.name,
        data.address || null,
        data.phone || null,
        data.contact_person || null,
        data.email || null,
        data.customer_photo || null,
        data.industry || null,
      ],
    );

    return Response.json({ company: result[0] });
  } catch (error) {
    console.error("Error creating company:", error);
    return Response.json(
      { error: "Failed to create company", details: error.message },
      { status: 500 },
    );
  }
}
