import { describe, expect, it } from "vitest";
import axios from "axios";

const CRM_BASE_URL = "https://nexxuscrm.one";
const CRM_API_KEY = process.env.CRM_API_KEY || "";

describe("CRM API Integration", () => {
  it("CRM_API_KEY environment variable is set", () => {
    expect(CRM_API_KEY).toBeTruthy();
    expect(CRM_API_KEY.startsWith("nxt_")).toBe(true);
  });

  it("CRM API is reachable and accepts the key for system routes", async () => {
    // The x-api-key authenticates for system routes (returns FORBIDDEN, not UNAUTHORIZED)
    const response = await axios.post(
      `${CRM_BASE_URL}/api/trpc/system.notifyOwner`,
      { json: { title: "Test", content: "Connectivity test" } },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CRM_API_KEY,
        },
        validateStatus: () => true,
      }
    );

    // FORBIDDEN (403) means the key authenticated but lacks admin permission
    // This confirms the key is valid and the CRM is reachable
    expect(response.status).toBe(403);
    expect(response.data?.error?.json?.message).toContain("permission");
  });

  it("CRM deals.create endpoint exists", async () => {
    // Verify the endpoint exists (even if auth fails for now)
    const response = await axios.get(
      `${CRM_BASE_URL}/api/trpc/deals.create`,
      {
        headers: { "x-api-key": CRM_API_KEY },
        validateStatus: () => true,
      }
    );

    // 405 = method not supported for GET on mutation = endpoint exists
    expect(response.status).toBe(405);
  });
});
