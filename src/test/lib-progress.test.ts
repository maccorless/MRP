import { describe, it, expect } from "vitest";
import { progressWidthClass } from "@/lib/progress";

describe("progressWidthClass", () => {
  it("returns the right class for integer percentages", () => {
    expect(progressWidthClass(0)).toBe("progress-w-0");
    expect(progressWidthClass(50)).toBe("progress-w-50");
    expect(progressWidthClass(100)).toBe("progress-w-100");
  });

  it("rounds fractional percentages", () => {
    expect(progressWidthClass(37.4)).toBe("progress-w-37");
    expect(progressWidthClass(37.5)).toBe("progress-w-38");
    expect(progressWidthClass(99.9)).toBe("progress-w-100");
  });

  it("clamps below zero to zero", () => {
    expect(progressWidthClass(-10)).toBe("progress-w-0");
    expect(progressWidthClass(-0.1)).toBe("progress-w-0");
  });

  it("clamps above 100 to 100", () => {
    expect(progressWidthClass(120)).toBe("progress-w-100");
    expect(progressWidthClass(250)).toBe("progress-w-100");
  });

  it("treats NaN and non-finite as zero", () => {
    expect(progressWidthClass(NaN)).toBe("progress-w-0");
    expect(progressWidthClass(Infinity)).toBe("progress-w-100");
    expect(progressWidthClass(-Infinity)).toBe("progress-w-0");
  });
});
