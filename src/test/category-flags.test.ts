import { describe, it, expect } from "vitest";
import { parseCategoryFlags } from "@/lib/category";

describe("parseCategoryFlags", () => {
  it("press → categoryPress=true, categoryPhoto=false", () => {
    expect(parseCategoryFlags("press")).toEqual({ categoryPress: true, categoryPhoto: false });
  });

  it("photo → categoryPress=false, categoryPhoto=true", () => {
    expect(parseCategoryFlags("photo")).toEqual({ categoryPress: false, categoryPhoto: true });
  });

  it("both → categoryPress=true, categoryPhoto=true", () => {
    expect(parseCategoryFlags("both")).toEqual({ categoryPress: true, categoryPhoto: true });
  });

  it("null → both false (caller must reject)", () => {
    expect(parseCategoryFlags(null)).toEqual({ categoryPress: false, categoryPhoto: false });
  });

  it("enr (old value) → both false (caller must reject)", () => {
    expect(parseCategoryFlags("enr")).toEqual({ categoryPress: false, categoryPhoto: false });
  });
});
