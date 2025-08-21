import sql from "@/app/api/utils/sql";
import crypto from "crypto";

// Generate QR code for a unit
export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return Response.json({ error: "Unit ID is required" }, { status: 400 });
  }

  // Fetch unit details including existing token
  const units = await sql`
    SELECT id, serial_number, serial_number_engine, access_token
    FROM units
    WHERE id = ${parseInt(id)} AND is_active = true AND deleted_at IS NULL
  `;

  if (units.length === 0) {
    return Response.json({ error: "Unit not found" }, { status: 404 });
  }

  const unit = units[0];

  // Ensure the unit has a token stored
  let token = unit.access_token;
  if (!token) {
    token = crypto.randomUUID();
    await sql`UPDATE units SET access_token = ${token} WHERE id = ${unit.id}`;
  }

  // Build the URL that the QR code should encode
  const baseUrl = new URL(request.url);
  const origin = `${baseUrl.protocol}//${baseUrl.host}`;
  const serial = unit.serial_number_engine || unit.serial_number;
  const qrLink = `${origin}/unit/${serial}?token=${token}`;

  // Use an external service to generate the QR code image
  const qrResponse = await fetch(
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      qrLink,
    )}`,
  );

  if (!qrResponse.ok) {
    return Response.json({ error: "Failed to generate QR code" }, { status: 500 });
  }

  const imageBuffer = await qrResponse.arrayBuffer();

  return new Response(imageBuffer, {
    headers: { "Content-Type": "image/png" },
  });
}

