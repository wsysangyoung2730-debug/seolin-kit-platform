import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

/** Settings are saved only after a successful load or explicit use-without-saving choice. */
export function useTimerPreferences<T>(
  key: string,
  defaults: T,
  decode: (raw: string | null) => T,
) {
  const [settings, setSettings] = useState<T>(defaults);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [localOnly, setLocalOnly] = useState(false);
  const mounted = useRef(false);
  const generation = useRef(0);
  const saving = useRef(false);
  const reload = useCallback(() => {
    const request = ++generation.current;
    setLoading(true);
    setReady(false);
    setError("");
    setLocalOnly(false);
    void AsyncStorage.getItem(key)
      .then((raw) => {
        const saved = decode(raw);
        if (mounted.current && request === generation.current) {
          setSettings(saved);
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted.current && request === generation.current)
          setError(
            "저장된 설정을 불러오지 못했어요. 다시 시도하거나 저장 없이 진행해 주세요.",
          );
      })
      .finally(() => {
        if (mounted.current && request === generation.current)
          setLoading(false);
      });
  }, [key, decode]);
  useEffect(() => {
    mounted.current = true;
    reload();
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, [reload]);
  function useWithoutSaving() {
    generation.current++;
    setLocalOnly(true);
    setLoading(false);
    setReady(true);
    setError("");
  }
  async function save(next: T): Promise<boolean> {
    if (!ready || loading || saving.current || !mounted.current) return false;
    if (localOnly) return true;
    // Decode once more at the storage boundary to reject malformed callers.
    try {
      decode(JSON.stringify(next));
    } catch {
      setError("타이머 설정을 확인해 주세요.");
      return false;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await AsyncStorage.setItem(key, JSON.stringify(next));
      return mounted.current;
    } catch {
      if (mounted.current)
        setError(
          "설정을 저장하지 못했어요. 다시 시도하거나 저장 없이 진행할 수 있어요.",
        );
      return false;
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return {
    settings,
    ready,
    loading,
    busy,
    error,
    localOnly,
    reload,
    save,
    useWithoutSaving,
  };
}
