import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";

// Get single task
export async function GET(request, { params }) {
  try {
    const authResult = await requireRole();
    if (authResult instanceof Response) return authResult;

    const { id } = params;

    const result = await sql(
      `
      SELECT 
        t.id, t.title, t.task_type, t.description, t.priority, t.status, 
        t.deadline, t.created_at, t.unit_id, t.company_id, t.created_by,
        u.unit_name, u.model as unit_model,
        c.name as company_name,
        creator.name as created_by_name,
        a.id as assignment_id, a.assigned_at, a.started_at, a.completed_at, a.notes as assignment_notes,
        teknisi.id as assigned_teknisi_id, teknisi.name as assigned_teknisi_name,
        supervisor.id as assigned_supervisor_id, supervisor.name as assigned_supervisor_name
      FROM tasks t
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN companies c ON t.company_id = c.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN assignments a ON t.id = a.task_id
      LEFT JOIN users teknisi ON a.teknisi_id = teknisi.id
      LEFT JOIN users supervisor ON a.supervisor_id = supervisor.id
      WHERE t.id = $1
      `,
      [parseInt(id)]
    );

    if (result.length === 0) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json({ task: result[0] });
  } catch (error) {
    console.error("Error fetching task:", error);
    return Response.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

// Update task
export async function PUT(request, { params }) {
  try {
    const authResult = await requireRole();
    if (authResult instanceof Response) return authResult;

    const { id } = params;
    const data = await request.json();

    // Validate task_type if provided
    if (data.task_type) {
      const validTaskTypes = ['visit', 'minor', 'major', 'kontrak'];
      if (!validTaskTypes.includes(data.task_type)) {
        return Response.json(
          { error: "Invalid task type. Must be one of: " + validTaskTypes.join(', ') }, 
          { status: 400 }
        );
      }
    }

    // Validate priority if provided
    if (data.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(data.priority)) {
        return Response.json(
          { error: "Invalid priority. Must be one of: " + validPriorities.join(', ') }, 
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (data.status) {
      const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'closed'];
      if (!validStatuses.includes(data.status)) {
        return Response.json(
          { error: "Invalid status. Must be one of: " + validStatuses.join(', ') }, 
          { status: 400 }
        );
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    const updateableFields = [
      'title', 'task_type', 'description', 'priority', 
      'status', 'unit_id', 'company_id', 'deadline'
    ];

    updateableFields.forEach(field => {
      if (data[field] !== undefined) {
        paramCount++;
        updateFields.push(`${field} = $${paramCount}`);
        values.push(data[field]);
      }
    });

    if (updateFields.length === 0) {
      return Response.json(
        { error: "No valid fields to update" }, 
        { status: 400 }
      );
    }

    paramCount++;
    values.push(parseInt(id));

    const result = await sql(
      `
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, task_type, description, priority, status, 
                unit_id, company_id, created_by, deadline, created_at
      `,
      values
    );

    if (result.length === 0) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json({ task: result[0] });
  } catch (error) {
    console.error("Error updating task:", error);
    return Response.json(
      { 
        error: "Failed to update task",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

// Delete task (soft delete by marking as closed)
export async function DELETE(request, { params }) {
  try {
    const authResult = await requireRole();
    if (authResult instanceof Response) return authResult;

    const { id } = params;

    const result = await sql(
      `
      UPDATE tasks 
      SET status = 'closed'
      WHERE id = $1
      RETURNING id, title, status
      `,
      [parseInt(id)]
    );

    if (result.length === 0) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json({ 
      message: "Task closed successfully",
      task: result[0] 
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}