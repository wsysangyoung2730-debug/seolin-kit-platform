/** Monotonic clock values are supplied by the UI; no interval count is used. */
export type TimerStep = {
  label: string;
  seconds: number;
  round: number;
  totalRounds: number;
  kind: "prepare" | "work" | "rest";
};
export type TimerState = {
  status: "ready" | "running" | "paused" | "completed";
  elapsedMs: number;
  startedAt: number | null;
};
export type TimerEvent = "start" | "tick" | "pause" | "resume" | "reset";
export const initialTimer = (): TimerState => ({
  status: "ready",
  elapsedMs: 0,
  startedAt: null,
});
export const totalDuration = (plan: readonly TimerStep[]) =>
  plan.reduce((sum, step) => sum + step.seconds * 1000, 0);

export function planError(plan: readonly TimerStep[]): string | null {
  if (!plan.length || plan.length > 1000) return "진행할 시간을 설정해 주세요.";
  if (
    plan.some(
      (step) =>
        !Number.isInteger(step.seconds) ||
        step.seconds < 1 ||
        step.seconds > 3600 ||
        !Number.isInteger(step.round) ||
        step.round < 1 ||
        !Number.isInteger(step.totalRounds) ||
        step.round > step.totalRounds ||
        !step.label.trim() ||
        !["prepare", "work", "rest"].includes(step.kind),
    )
  )
    return "타이머 설정을 확인해 주세요.";
  if (totalDuration(plan) > 24 * 60 * 60 * 1000)
    return "전체 시간은 24시간 이내로 설정해 주세요.";
  return null;
}

export function elapsedAt(
  state: TimerState,
  now: number,
  totalMs: number,
): number {
  const delta =
    state.status === "running" && state.startedAt !== null
      ? Math.max(0, now - state.startedAt)
      : 0;
  return Math.min(totalMs, state.elapsedMs + delta);
}

export function advanceTimer(
  state: TimerState,
  event: TimerEvent,
  now: number,
  totalMs: number,
): TimerState {
  if (event === "reset") return initialTimer();
  if (state.status === "completed" || totalMs <= 0 || !Number.isFinite(now))
    return state;
  const elapsedMs = elapsedAt(state, now, totalMs);
  // Reconcile the deadline before pausing, so pausing at zero cannot revive a finished timer.
  if (state.status === "running" && elapsedMs >= totalMs)
    return { status: "completed", elapsedMs: totalMs, startedAt: null };
  if (
    (event === "start" && state.status === "ready") ||
    (event === "resume" && state.status === "paused")
  )
    return { status: "running", elapsedMs, startedAt: now };
  if (event === "pause" && state.status === "running")
    return { status: "paused", elapsedMs, startedAt: null };
  if (event === "tick" && state.status === "running")
    return { status: "running", elapsedMs, startedAt: now };
  return state;
}

export function timerFrame(plan: readonly TimerStep[], elapsedMs: number) {
  let remaining = Math.max(0, elapsedMs);
  for (let index = 0; index < plan.length; index++) {
    const step = plan[index]!;
    if (remaining < step.seconds * 1000)
      return { index, step, remainingMs: step.seconds * 1000 - remaining };
    remaining -= step.seconds * 1000;
  }
  return {
    index: Math.max(0, plan.length - 1),
    step: plan[plan.length - 1],
    remainingMs: 0,
  };
}

export function formatTimer(seconds: number) {
  const value = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = String(value % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}`
    : `${String(minutes).padStart(2, "0")}:${secs}`;
}
