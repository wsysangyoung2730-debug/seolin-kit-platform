import { expect, it, vi } from "vitest";
import { createSessionGate } from "./session-gate";
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
it("does not open a camera game after leaving a pending permission dialog", async () => {
  const gate = createSessionGate(),
    permission = deferred<boolean>(),
    openCamera = vi.fn();
  const pending = gate.run(() => permission.promise, openCamera);
  gate.cancel();
  permission.resolve(true);
  expect(await pending).toBe(false);
  expect(openCamera).not.toHaveBeenCalled();
});
it("keeps the new session when the older preparation finishes later", async () => {
  const gate = createSessionGate(),
    old = deferred<string>(),
    commit = vi.fn();
  const pending = gate.run(() => old.promise, commit);
  gate.cancel();
  await gate.run(async () => "new", commit);
  old.resolve("old");
  await pending;
  expect(commit.mock.calls).toEqual([["new"]]);
});
it("ignores late errors but surfaces current storage failures", async () => {
  const gate = createSessionGate(),
    old = deferred<string>();
  const pending = gate.run(
    () => old.promise,
    () => {},
  );
  gate.cancel();
  old.reject(new Error("late"));
  expect(await pending).toBe(false);
  await expect(
    gate.run(
      async () => {
        throw new Error("storage");
      },
      () => {},
    ),
  ).rejects.toThrow("storage");
});
