import apiClient from "./client";

export async function createCheckoutSession(): Promise<{ checkout_url: string; session_id: string }> {
  const { data } = await apiClient.post("/api/payments/checkout");
  return data;
}

export async function createCustomerPortal(): Promise<{ portal_url: string }> {
  const { data } = await apiClient.post("/api/payments/portal");
  return data;
}

export async function syncCheckoutSession(sessionId: string): Promise<{ status: string; role: string }> {
  const { data } = await apiClient.post("/api/payments/checkout/sync", null, {
    params: { session_id: sessionId },
  });
  return data;
}
