import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  decodeLesson,
  defaultLesson,
  lessonError,
  type Lesson,
} from "@seolin/ox";
const KEY = "seolin.ox.lesson.v1";
const Context = createContext<{
  lesson: Lesson;
  ready: boolean;
  error: string;
  save: (lesson: Lesson) => Promise<boolean>;
  reload: () => void;
}>({
  lesson: defaultLesson,
  ready: false,
  error: "",
  save: async () => false,
  reload: () => {},
});
export function LessonProvider({ children }: PropsWithChildren) {
  const [lesson, setLesson] = useState(defaultLesson);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  function reload() {
    setReady(false);
    setError("");
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        setLesson(decodeLesson(raw));
        setReady(true);
      })
      .catch(() =>
        setError(
          "저장된 수업을 불러오지 못했어요. 다시 시도하거나 기본 문제로 새로 저장해 주세요.",
        ),
      );
  }
  useEffect(reload, []);
  async function save(next: Lesson) {
    if (busy.current) return false;
    const problem = lessonError(next);
    if (problem) {
      setError(problem);
      return false;
    }
    busy.current = true;
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      setLesson(next);
      setReady(true);
      setError("");
      return true;
    } catch {
      setError(
        "수업을 저장하지 못했어요. 저장 공간을 확인한 후 다시 시도해 주세요.",
      );
      return false;
    } finally {
      busy.current = false;
    }
  }
  return (
    <Context.Provider value={{ lesson, ready, error, save, reload }}>
      {children}
    </Context.Provider>
  );
}
export const useLesson = () => useContext(Context);
