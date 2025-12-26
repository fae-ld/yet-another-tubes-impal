// src/__tests__/setup.js
import { vi } from "vitest";

// Provide jest globals for compatibility
global.jest = vi;
global.describe = describe;
global.test = test;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;

// Mock console
global.console.error = vi.fn();
global.console.log = vi.fn();
