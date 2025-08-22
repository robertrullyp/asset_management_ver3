import { auth } from "@/auth";

const ROLE_ALIAS = {
  technician: "teknisi",
};

const DEFAULT_ROLES = ["admin", "sales", "supervisor", "technician", "teknisi"];

export async function requireRole(roles = DEFAULT_ROLES) {
  const session = await auth();
  if (!session?.user) {
    return Response.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const normalizedRoles = roles.map((role) => ROLE_ALIAS[role] || role);
  if (!normalizedRoles.includes(session.user.role)) {
    return Response.json(
      { error: "Forbidden" },
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return session;
}
