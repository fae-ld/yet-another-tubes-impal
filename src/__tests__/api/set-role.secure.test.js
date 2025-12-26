// __tests__/api/set-role.secure.test.js
// Test untuk versi dengan auth verification

describe("POST /api/set-role - Secure Version", () => {
  it("should verify Supabase auth token first", async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({}), // Tidak pakai body lagi
      headers: {
        get: jest.fn().mockReturnValue("Bearer valid-supabase-token"),
      },
    };

    // Mock Supabase auth verify
    mockSupabase.auth = {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: "auth-user-123",
            email: "user@example.com",
          },
        },
        error: null,
      }),
    };

    // ... rest of test
  });

  it("should return 401 without auth token", async () => {
    const mockReq = {
      headers: {
        get: jest.fn().mockReturnValue(null), // No token
      },
    };

    const response = await POST(mockReq);
    expect(response.status).toBe(401);
  });
});
