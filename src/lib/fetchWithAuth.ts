export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return fetch(input, {
    credentials: "include", // ✅ 쿠키 항상 포함
    ...init,
  });
}