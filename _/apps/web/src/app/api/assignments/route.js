import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";

// Get all assignments with task, teknisi, and supervisor info
export async function GET(request) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const url = new URL(request.url);
    const supervisor_id = url.searchParams.get("supervisor_id");
    const teknisi_id = url.searchParams.get("teknisi_id");
    const status = url.searchParams.get("status");
    const task_id = url.searchParams.get("task_id");

    let query = `
      SELECT 
        a.*,
        t.title as task_title,
        t.task_type,
        t.priority,
        t.status as task_status,
        t.deadline,
        u_teknisi.name as teknisi_name,
        u_teknisi.phone as teknisi_phone,
        u_supervisor.name as supervisor_name,
        units.unit_name,
        companies.name as company_name
      FROM assignments a
      LEFT JOIN tasks t ON a.task_id = t.id
      LEFT JOIN users u_teknisi ON a.teknisi_id = u_teknisi.id
      LEFT JOIN users u_supervisor ON a.supervisor_id = u_supervisor.id
      LEFT JOIN units ON t.unit_id = units.id
      LEFT JOIN companies ON t.company_id = companies.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (supervisor_id) {
      paramCount++;
      query += ` AND a.supervisor_id = $${paramCount}`;
      params.push(supervisor_id);
    }

    if (teknisi_id) {
      paramCount++;
      query += ` AND a.teknisi_id = $${paramCount}`;
      params.push(teknisi_id);
    }

    if (task_id) {
      paramCount++;
      query += ` AND a.task_id = $${paramCount}`;
      params.push(task_id);
    }

    // Status filter based on assignment completion
    if (status) {
      if (status === 'pending') {
        query += ` AND a.started_at IS NULL`;
      } else if (status === 'in_progress') {
        query += ` AND a.started_at IS NOT NULL AND a.completed_at IS NULL`;
      } else if (status === 'completed') {
        query += ` AND a.completed_at IS NOT NULL`;
      }
    }

    query += ` ORDER BY a.assigned_at DESC`;

    const assignments = await sql(query, params);

    return Response.json({ assignments });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return Response.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

// Create new assignment
export async function POST(request) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const data = await request.json();
    const { task_id, teknisi_id, supervisor_id, notes } = data;

    // Validate required fields
    if (!task_id || !teknisi_id || !supervisor_id) {
      return Response.json(
        { error: "task_id, teknisi_id, and supervisor_id are required" },
        { status: 400 }
      );
    }

    // Check if task exists and is not already assigned
    const existingAssignment = await sql(
      `SELECT id FROM assignments WHERE task_id = $1`,
      [task_id]
    );

    if (existingAssignment.length > 0) {
      return Response.json(
        { error: "Task is already assigned" },
        { status: 400 }
      );
    }

    const [assignment] = await sql.transaction([
      // Create assignment
      sql`
        INSERT INTO assignments (task_id, teknisi_id, supervisor_id, notes)
        VALUES (${task_id}, ${teknisi_id}, ${supervisor_id}, ${notes || null})
        RETURNING *
      `,
      // Update task status to 'assigned'
      sql`
        UPDATE tasks 
        SET status = 'assigned' 
        WHERE id = ${task_id}
        RETURNING *
      `
    ]);

    return Response.json({ assignment: assignment[0] });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return Response.json(
      { error: "Failed to create assignment", details: error.message },
      { status: 500 }
    );
  }
}