import { describe, expect, it } from "vitest";
import { catalog, decodeLibrary, filterCatalog } from "./catalog";
import { miniAppDestination } from "./destinations";

describe("classroom tool discovery", () => {
  it("opens available native tools outside the bundled HTML game runner", () => {
    const tools = filterCatalog("", "classroom");
    expect(tools.some((app) => app.id === "timer")).toBe(true);
    expect(tools.some((app) => app.id === "teams")).toBe(true);
    expect(tools.some((app) => app.id === "tabata")).toBe(true);
    expect(tools.some((app) => app.id === "lucky-draw")).toBe(true);
    for (const app of tools) {
      expect(app.status).toBe("available");
      expect(app.runtime).toBe("native");
      expect(miniAppDestination(app)).toBe(`/tools/${app.id}`);
      expect(decodeLibrary(JSON.stringify([app.id]))).toEqual([app.id]);
    }
  });
  it("keeps the original game entry points", () => {
    for (const app of catalog.filter((item) => item.category !== "classroom")) {
      expect(miniAppDestination(app)).toEqual(
        app.id === "ox"
          ? "/ox"
          : app.id === "taekwondo-pinball"
            ? "/pinball"
            : { pathname: "/game/[id]", params: { id: app.id } },
      );
    }
  });
  it("discovers pinball as a separate miniapp from lucky draw", () => {
    const pinball = catalog.find((app) => app.id === "taekwondo-pinball");
    expect(pinball?.runtime).toBe("bundled-html");
    expect(miniAppDestination(pinball!)).toBe("/pinball");
    expect(decodeLibrary('["taekwondo-pinball","lucky-draw"]')).toEqual([
      "taekwondo-pinball",
      "lucky-draw",
    ]);
  });
});
