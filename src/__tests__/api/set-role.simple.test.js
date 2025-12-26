// src/__tests__/api/set-role.vitest.test.js
import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock console.error
global.console.error = vi.fn();

describe("Set-role API - Manual Test with Vitest", () => {
  // Simulate the logic
  const simulateAPI = async (userId) => {
    if (!userId) {
      console.error("No User id");
      return { error: "User ID required", status: 400 };
    }

    const isPelanggan = userId && userId.includes("pelanggan");
    const isStaf = userId && userId.includes("staf");

    if (isPelanggan) {
      return {
        success: true,
        role: "pelanggan",
        cookie: { name: "role", value: "jwt-token-pelanggan" },
      };
    } else if (isStaf) {
      return {
        success: true,
        role: "staf",
        cookie: { name: "role", value: "jwt-token-staf" },
      };
    }
    console.error("Gaada di staf");
    return { error: "User role not found", status: 400 };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Pelanggan user should return pelanggan role", async () => {
    const result = await simulateAPI("pelanggan-123");

    expect(result.success).toBe(true);
    expect(result.role).toBe("pelanggan");
    expect(console.error).not.toHaveBeenCalled();
  });

  test("Staf user should return staf role", async () => {
    const result = await simulateAPI("staf-456");

    expect(result.success).toBe(true);
    expect(result.role).toBe("staf");
  });

  test("Unknown user should return 400 error", async () => {
    const result = await simulateAPI("unknown-999");

    expect(result.error).toBe("User role not found");
    expect(result.status).toBe(400);
    expect(console.error).toHaveBeenCalledWith("Gaada di staf");
  });

  test("Missing userId should return 400 error", async () => {
    const result = await simulateAPI(null);

    expect(result.error).toBe("User ID required");
    expect(result.status).toBe(400);
    expect(console.error).toHaveBeenCalledWith("No User id");
  });
});
