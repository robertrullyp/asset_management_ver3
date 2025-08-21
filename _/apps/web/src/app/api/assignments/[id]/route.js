import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";

// Get assignment by ID
export async function GET(request, { params }) {
  try {
    const authResult = await requireRole();
    if (authResult instanceof Response) return authResult;

    const { id } = params;

    const assignments = await sql(`
      SELECT 
        a.*,
        t.title as task_title,
        t.task_type,
        t.priority,
        t.status as task_status,
        t.deadline,
        t.description as task_description,
        u_teknisi.name as teknisi_name,
        u_teknisi.phone as teknisi_phone,
        u_teknisi.email as teknisi_email,
        u_supervisor.name as supervisor_name,
        u_supervisor.phone as supervisor_phone,
        units.unit_name,
        units.model as unit_model,
        companies.name as company_name,
        companies.contact_person,
        companies.phone as company_phone
      FROM assignments a
      LEFT JOIN tasks t ON a.task_id = t.id
      LEFT JOIN users u_teknisi ON a.teknisi_id = u_teknisi.id
      LEFT JOIN users u_supervisor ON a.supervisor_id = u_supervisor.id
      LEFT JOIN units ON t.unit_id = units.id
      LEFT JOIN companies ON t.company_id = companies.id
      WHERE a.id = $1
    `, [id]);

    if (assignments.length === 0) {
      return Response.json({ error: "Assignment not found" }, { status: 404 });
    }

    return Response.json({ assignment: assignments[0] });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return Response.json({ error: "Failed to fetch assignment" }, { status: 500 });
  }
}

// Update assignment (start, complete, add notes)
export async function PUT(request, { params }) {
  try {
    const authResult = await requireRole();
    if (authResult instanceof Response) return authResult;

    const { id } = params;
    const data = await request.json();

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    if (data.action === 'start') {
      paramCount++;
      updateFields.push(`started_at = $${paramCount}`);
      values.push(new Date().toISOString());
      
      // Also update task status to 'in_progress'
      paramCount++;
      updateFields.push(`notes = COALESCE(notes, '') || $${paramCount}`);
      values.push(`\nWork started at ${new Date().toLocaleString()}`);
    } else if (data.action === 'complete') {
      paramCount++;
      updateFields.push(`completed_at = $${paramCount}`);
      values.push(new Date().toISOString());
      
      if (data.completion_notes) {
        paramCount++;
        updateFields.push(`notes = COALESCE(notes, '') || $${paramCount}`);
        values.push(`\nCompleted: ${data.completion_notes}`);
      }
    } else {
      // Regular update
      if (data.notes !== undefined) {
        paramCount++;
        updateFields.push(`notes = $${paramCount}`);
        values.push(data.notes);
      }

      if (data.started_at !== undefined) {
        paramCount++;
        updateFields.push(`started_at = $${paramCount}`);
        values.push(data.started_at);
      }

      if (data.completed_at !== undefined) {
        paramCount++;
        updateFields.push(`completed_at = $${paramCount}`);
        values.push(data.completed_at);
      }
    }

    if (updateFields.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    paramCount++;
    const query = `
      UPDATE assignments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    values.push(id);

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Update task status based on assignment state
    const assignment = result[0];
    let taskStatus = 'assigned';
    if (assignment.completed_at) {
      taskStatus = 'completed';
    } else if (assignment.started_at) {
      taskStatus = 'in_progress';
    }

    await sql(`
      UPDATE tasks 
      SET status = $1 
      WHERE id = $2
    `, [taskStatus, assignment.task_id]);

    return Response.json({ assignment: result[0] });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return Response.json(
      { error: "Failed to update assignment", details: error.message },
      { status: 500 }
    );
  }
}

// Delete assignment (unassign task)
export async function DELETE(request, { params }) {
  try {
    const authResult = await requireRole();
    if (authResult instanceof Response) return authResult;

    const { id } = params;

    // Get assignment info first
    const assignments = await sql(`
      SELECT task_id FROM assignments WHERE id = $1
    `, [id]);

    if (assignments.length === 0) {
      return Response.json({ error: "Assignment not found" }, { status: 404 });
    }

    const taskId = assignments[0].task_id;

    await sql.transaction([
      // Delete assignment
      sql`DELETE FROM assignments WHERE id = ${id}`,
      // Reset task status to 'pending'
      sql`UPDATE tasks SET status = 'pending' WHERE id = ${taskId}`
    ]);

    return Response.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return Response.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}