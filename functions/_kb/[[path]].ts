/**
 * Chặn truy cập công khai vào kho tri thức dist/_kb/* (chế độ server). /api/knowledge/query đọc các file này qua
 * env.ASSETS.fetch - đường đó phục vụ thẳng file tĩnh, không đi qua Function này.
 */
export const onRequest = async (): Promise<Response> => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
