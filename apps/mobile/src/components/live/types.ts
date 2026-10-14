import type { BridgeMessage } from "./protocol";
export interface GameCanvasProps {
  html: string;
  voice: boolean;
  onMessage: (message: BridgeMessage) => void;
  onError: (message: string) => void;
  onExternalActivity: (active: boolean) => void;
}
