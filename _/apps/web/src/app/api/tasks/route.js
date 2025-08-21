import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";
import { z } from "zod";

// Get all tasks
export async function GET(request) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const url = new URL(request.url);
    const querySchema = z.object({
      search: z.string().trim().optional(),
      sortBy: z
        .enum(["created_at", "deadline", "priority", "status", "title", "task_type"])
        .optional()
        .default("created_at"),
      sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      status: z
        .enum(["pending", "assigned", "in_progress", "completed", "closed"])
        .optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      task_type: z.enum(["visit", "minor", "major", "kontrak"]).optional(),
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

    const {
      search,
      sortBy,
      sortOrder,
      status,
      priority,
      task_type: taskType,
    } = parsed.data;

    // Get current user info from users table
    const userQuery = await sql`
      SELECT id, role FROM users WHERE email = ${session.user.email}
    `;

    if (userQuery.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = userQuery[0];

    // Build the base query with proper parameter handling
    let whereConditions = ["1=1"];
    let queryParams = [];

    function getNextParamIndex() {
      return queryParams.length + 1;
    }

    // Role-based filtering
    if (currentUser.role === "teknisi") {
      // Teknisi can only see tasks assigned to them or unassigned tasks
      whereConditions.push(`(
        t.id IN (SELECT task_id FROM assignments WHERE teknisi_id = $${getNextParamIndex()})
        OR t.id NOT IN (SELECT task_id FROM assignments WHERE task_id IS NOT NULL)
      )`);
      queryParams.push(currentUser.id);
    }

    // Search filter
    if (search) {
      const searchPattern = `%${search}%`;
      const fields = [
        "t.title",
        "t.description",
        "c.name",
        "u.unit_name",
        "u.serial_number_engine",
      ];
      const conditions = fields
        .map((field) => {
          const idx = getNextParamIndex();
          queryParams.push(searchPattern);
          return `LOWER(${field}) LIKE LOWER($${idx})`;
        })
        .join(" OR ");
      whereConditions.push(`(${conditions})`);
    }

    // Status filter
    if (status) {
      whereConditions.push(`t.status = $${getNextParamIndex()}`);
      queryParams.push(status);
    }

    // Priority filter
    if (priority) {
      whereConditions.push(`t.priority = $${getNextParamIndex()}`);
      queryParams.push(priority);
    }

    // Task type filter
    if (taskType) {
      whereConditions.push(`t.task_type = $${getNextParamIndex()}`);
      queryParams.push(taskType);
    }

    // Hide completed tasks from main view (supervisor/admin feature)
    if (currentUser.role !== "admin") {
      whereConditions.push(`t.status != 'completed'`);
    }

    // Valid sort columns
    const validSortColumns = {
      created_at: "t.created_at",
      deadline: "t.deadline",
      priority: "t.priority",
      status: "t.status",
      title: "t.title",
      task_type: "t.task_type",
    };

    const sortColumn = validSortColumns[sortBy] || "t.created_at";
    const order = sortOrder === "asc" ? "ASC" : "DESC";

    // Priority ordering for sorting
    let orderClause;
    if (sortBy === "priority") {
      orderClause = `
        CASE t.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END ${order}
      `;
    } else {
      orderClause = `${sortColumn} ${order}`;
    }

    const query = `
      SELECT 
        t.*,
        c.name as company_name,
        u.unit_name,
        u.serial_number_engine,
        creator.name as created_by_name,
        a.id as assignment_id,
        a.teknisi_id as assigned_teknisi_id,
        teknisi.name as assigned_teknisi_name,
        supervisor.name as supervisor_name
      FROM tasks t
      LEFT JOIN companies c ON t.company_id = c.id
      LEFT JOIN units u ON t.unit_id = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN assignments a ON t.id = a.task_id
      LEFT JOIN users teknisi ON a.teknisi_id = teknisi.id
      LEFT JOIN users supervisor ON a.supervisor_id = supervisor.id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY ${orderClause}, t.created_at DESC
    `;

    const tasks = await sql(query, queryParams);

    return Response.json({
      tasks,
      filters: {
        sortBy,
        sortOrder,
        status,
        priority,
        taskType,
        search,
      },
      userRole: currentUser.role,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return Response.json(
      {
        error: "Failed to fetch tasks",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// Create new task
export async function POST(request) {
  try {
    const session = await requireRole();
    if (session instanceof Response) return session;

    const bodySchema = z.object({
      title: z.string().min(1),
      task_type: z.enum(["visit", "minor", "major", "kontrak"]),
      description: z.string().optional().nullable(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      status: z
        .enum(["pending", "assigned", "in_progress", "completed", "closed"])
        .optional(),
      unit_id: z.number().optional().nullable(),
      company_id: z.number().optional().nullable(),
      created_by: z.number().optional().nullable(),
      deadline: z.string().optional().nullable(),
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
      INSERT INTO tasks (
        title, task_type, description, priority, status, 
        unit_id, company_id, created_by, deadline
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING id, title, task_type, description, priority, status, 
                unit_id, company_id, created_by, deadline, created_at
      `,
      [
        data.title,
        data.task_type,
        data.description || null,
        data.priority || "medium",
        data.status || "pending",
        data.unit_id || null,
        data.company_id || null,
        data.created_by || null,
        data.deadline || null,
      ],
    );

    return Response.json({ task: result[0] });
  } catch (error) {
    console.error("Error creating task:", error);
    return Response.json(
      {
        error: "Failed to create task",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
