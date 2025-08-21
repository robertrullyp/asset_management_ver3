import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";

// Get all companies
export async function GET(request) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const url = new URL(request.url);
    const search = url.searchParams.get("search");

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

    const data = await request.json();

    if (!data.name) {
      return Response.json(
        { error: "Company name is required" },
        { status: 400 },
      );
    }

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
