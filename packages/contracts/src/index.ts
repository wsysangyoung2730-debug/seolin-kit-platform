export type Category = "game" | "education" | "editing" | "classroom";
export type MiniAppId =
  | "ox"
  | "breaking"
  | "freeze"
  | "initials"
  | "wordchain"
  | "memory"
  | "timer"
  | "tabata";
export interface MiniApp {
  id: MiniAppId;
  name: string;
  summary: string;
  description: string;
  category: Category;
  status: "available" | "coming-soon";
  access: "free" | "undecided";
  runtime: "native" | "bundled-html";
}

// Server-backed entitlements will replace this boundary; clients do not grant paid access.
export interface AccessDecision {
  allowed: boolean;
  reason: "free" | "trial" | "subscription" | "unavailable";
  expiresAt?: string;
}
