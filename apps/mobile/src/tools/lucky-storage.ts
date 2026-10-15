import {
  createLuckyState,
  decodeLucky,
  drawLucky,
  type DrawResult,
  type LuckyModeId,
  type LuckyState,
  type Prize,
} from "./lucky-draw";
export const LUCKY_STORAGE_KEY = "seolin.lucky-draw.v1";
export type LuckyStorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};
/** One shared instance serializes stock and history changes into a single document. */
const recoveryMessage =
  "저장 결과를 확인할 수 없어요. 기록을 다시 불러와 마지막 결과를 확인해 주세요.";
export class LuckyStore {
  private busy = false;
  private requiresReload = false;
  private observedRaw: string | null = null;
  get recoveryRequired() {
    return this.requiresReload;
  }
  constructor(
    private storage: LuckyStorageAdapter,
    private key = LUCKY_STORAGE_KEY,
  ) {}
  private async exclusive<T>(
    task: () => Promise<T>,
    allowRecovery = false,
  ): Promise<T> {
    if (this.requiresReload && !allowRecovery) throw new Error(recoveryMessage);
    if (this.busy)
      throw new Error("처리 중이에요. 잠시 뒤 한 번만 다시 눌러 주세요.");
    this.busy = true;
    try {
      return await task();
    } finally {
      this.busy = false;
    }
  }
  private async read(): Promise<LuckyState> {
    try {
      const raw = await this.storage.getItem(this.key);
      const state = decodeLucky(raw);
      this.observedRaw = raw;
      return state;
    } catch {
      throw new Error(
        this.requiresReload
          ? recoveryMessage
          : "저장된 상품과 기록을 불러오지 못했어요. 다시 불러오거나 임시 모드를 선택해 주세요.",
      );
    }
  }
  private async commit(next: LuckyState, action = "이번 추첨"): Promise<void> {
    const raw = JSON.stringify(next);
    try {
      await this.storage.setItem(this.key, raw);
    } catch {
      // A provider may report an error after writing. Verify the exact old/new document.
      let readBack: string | null;
      try {
        readBack = await this.storage.getItem(this.key);
      } catch {
        this.requiresReload = true;
        throw new Error(recoveryMessage);
      }
      if (readBack === raw) return;
      if (readBack !== this.observedRaw) {
        this.requiresReload = true;
        throw new Error(recoveryMessage);
      }
      throw new Error(
        `${action}을 저장하지 못했어요. 기존 수량과 기록은 유지돼요. 다시 시도하거나 임시 모드를 선택해 주세요.`,
      );
    }
  }
  load() {
    return this.exclusive(async () => {
      const state = await this.read();
      this.requiresReload = false;
      return state;
    }, true);
  }
  savePrizes(prizes: Prize[]) {
    return this.exclusive(async () => {
      await this.read(); // Never replace unread or corrupt stored data with defaults.
      const next = createLuckyState(prizes);
      await this.commit(next, "상품 설정");
      return next;
    });
  }
  reset() {
    return this.exclusive(async () => {
      const current = await this.read();
      const next = createLuckyState(current.prizes);
      await this.commit(next, "새 회차");
      return next;
    });
  }
  draw(
    mode: LuckyModeId,
    selectedIndex?: number,
  ): Promise<{ state: LuckyState; result: DrawResult }> {
    return this.exclusive(async () => {
      const current = await this.read();
      const next = drawLucky(current, mode, { selectedIndex });
      await this.commit(next.state);
      return next;
    });
  }
}
