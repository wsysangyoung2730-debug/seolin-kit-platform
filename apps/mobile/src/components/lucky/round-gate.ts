export type RoundReply<T> =
  { status: "result"; value: T } | { status: "empty" | "failed" | "ignored" };

/** One committed draw per round, including taps during an asynchronous save. */
export class RoundGate<T> {
  private phase: "open" | "pending" | "resolved" | "revealed" | "disposed" =
    "open";
  private result: T | null = null;
  private generation = 0;

  async request(draw: () => Promise<T | null>): Promise<RoundReply<T>> {
    if (this.phase !== "open") return { status: "ignored" };
    this.phase = "pending";
    const generation = this.generation;
    try {
      const value = await draw();
      if (generation !== this.generation) return { status: "ignored" };
      if (value === null) {
        this.phase = "open";
        return { status: "empty" };
      }
      this.result = value;
      this.phase = "resolved";
      return { status: "result", value };
    } catch {
      if (generation !== this.generation) return { status: "ignored" };
      this.phase = "open";
      return { status: "failed" };
    }
  }

  reveal(): T | null {
    if (this.phase !== "resolved") return null;
    this.phase = "revealed";
    return this.result;
  }

  get value(): T | null {
    return this.result;
  }

  restart(): boolean {
    if (this.phase !== "revealed" && this.phase !== "open") return false;
    this.generation++;
    this.result = null;
    this.phase = "open";
    return true;
  }

  dispose() {
    this.generation++;
    this.phase = "disposed";
    this.result = null;
  }
}
