import { describe, it, expect } from "vitest";
import { filterCatalog, decodeLibrary } from "./catalog";
describe("miniapp discovery", () => {
  it("combines category and normalized query", () => {
    expect(filterCatalog("  초성  ", "education").map((a) => a.id)).toEqual([
      "initials",
    ]);
    expect(filterCatalog("초성", "game")).toEqual([]);
    expect(filterCatalog("", "editing")).toEqual([]);
  });
  it("restores only known unique apps", () => {
    expect(decodeLibrary('["ox","removed","ox"]')).toEqual(["ox"]);
    expect(decodeLibrary(null)).toEqual([]);
  });
  it("rejects damaged local data instead of overwriting it", () => {
    expect(() => decodeLibrary("{")).toThrow();
    expect(() => decodeLibrary("[1]")).toThrow();
  });
});
