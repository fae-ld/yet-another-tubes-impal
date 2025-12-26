import { vi, describe, it, expect, beforeEach } from "vitest";
import { POST } from "../../app/api/set-role/route.js";

// 1. Mocking Variables (WAJIB pake prefix 'mock')
const mockCookieSet = vi.fn();
const mockNextResponseJson = vi.fn((data, options = {}) => {
  return {
    json: () => Promise.resolve(data),
    status: options.status || 200,
    cookies: {
      set: mockCookieSet,
    },
  };
});

const mockFrom = vi.fn();

// 2. Setup Mocks
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table) => mockFrom(table),
  },
}));

vi.mock("jose", () => {
  // class constructor palsu
  return {
    SignJWT: vi.fn().mockImplementation(function () {
      this.setProtectedHeader = vi.fn().mockReturnThis();
      this.setExpirationTime = vi.fn().mockReturnThis();
      this.sign = vi.fn().mockResolvedValue("mock-jwt-token-xyz");
      return this;
    }),
  };
});

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data, options) => mockNextResponseJson(data, options),
  },
}));

describe("POST /api/set-role - MVP Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default implementation untuk mockFrom
    mockFrom.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }));
  });

  // Helper mock sequential queries
  const setupMockQueries = (pelangganData, stafData) => {
    mockFrom.mockImplementation((table) => {
      const data = table === "pelanggan" ? pelangganData : stafData;
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data, error: null }),
          }),
        }),
      };
    });
  };

  it("1. User found as pelanggan - should return JWT cookie", async () => {
    const mockReq = {
      json: vi.fn().mockResolvedValue({ userId: "pelanggan-123" }),
    };

    setupMockQueries({ id_pelanggan: "pelanggan-123", nama: "John Doe" }, null);

    const response = await POST(mockReq);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(response.status).toBe(200);
    expect(mockCookieSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "role",
        value: "mock-jwt-token-xyz",
      }),
    );
  });

  it("2. User found as staf - should return staf JWT cookie", async () => {
    const mockReq = {
      json: vi.fn().mockResolvedValue({ userId: "staf-456" }),
    };

    setupMockQueries(null, { id_staf: "staf-456", nama: "Admin User" });

    await POST(mockReq);

    const { SignJWT } = await import("jose");
    expect(SignJWT).toHaveBeenCalledWith(
      expect.objectContaining({ role: "staf" }),
    );
    expect(mockFrom).toHaveBeenCalledWith("pelanggan");
    expect(mockFrom).toHaveBeenCalledWith("staf");
  });

  it("3. User not found in any table - should return 400 error", async () => {
    const mockReq = {
      json: vi.fn().mockResolvedValue({ userId: "unknown-999" }),
    };

    setupMockQueries(null, null);

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("User role not found");
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("4. Missing userId in request - should return 400", async () => {
    const mockReq = {
      json: vi.fn().mockResolvedValue({}),
    };

    const response = await POST(mockReq);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("User ID required");
  });

  it("5. Database error - should handle gracefully", async () => {
    const mockReq = {
      json: vi.fn().mockResolvedValue({ userId: "error-test" }),
    };

    mockFrom.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    // Sesuain lagi aja dengan logic route.js, atau pake try-catch throw aja
    await expect(POST(mockReq)).rejects.toThrow("Database connection failed");
  });
});
