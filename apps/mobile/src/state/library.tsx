import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { decodeLibrary } from "../data/catalog";
const KEY = "seolin.library.v1";
const Context = createContext<{
  ids: string[];
  ready: boolean;
  error: string;
  toggle: (id: string) => Promise<void>;
  reload: () => void;
}>({
  ids: [],
  ready: false,
  error: "",
  toggle: async () => {},
  reload: () => {},
});
export function LibraryProvider({ children }: PropsWithChildren) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const current = useRef<string[]>([]);
  const busy = useRef(false);
  const reload = () => {
    setReady(false);
    setError("");
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        current.current = decodeLibrary(raw);
        setIds(current.current);
        setReady(true);
      })
      .catch(() =>
        setError(
          "내 앱을 불러오지 못했어요. 저장 공간을 확인한 후 다시 시도해 주세요.",
        ),
      );
  };
  useEffect(reload, []);
  async function toggle(id: string) {
    if (!ready || busy.current) return;
    busy.current = true;
    const next = current.current.includes(id)
      ? current.current.filter((x) => x !== id)
      : [...current.current, id];
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      current.current = next;
      setIds(next);
      setError("");
    } catch {
      setError("저장하지 못했어요. 저장 공간을 확인하고 다시 눌러 주세요.");
    } finally {
      busy.current = false;
    }
  }
  return (
    <Context.Provider value={{ ids, ready, error, toggle, reload }}>
      {children}
    </Context.Provider>
  );
}
export const useLibrary = () => useContext(Context);
