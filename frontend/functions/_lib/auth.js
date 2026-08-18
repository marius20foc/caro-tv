// ============================================================
// CARO.TV v4pro – autentificare minimala pentru /api/admin/*
// (varianta Pages Functions pure)
// ============================================================

export function isAuthorized(request, env) {
  const token = env.ADMIN_TOKEN;
  if (!token) return false;
  const auth = request.headers.get('authorization') || '';
  return auth === `Bearer ${token}`;
}

export function unauthorizedResponse() {
  return Response.json({ error: 'Neautorizat' }, { status: 401 });
}
