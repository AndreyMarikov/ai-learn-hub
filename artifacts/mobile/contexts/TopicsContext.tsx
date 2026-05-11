import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface Message {
  id: string;
  role: "user" | "assistant" | "widget";
  content: string;
  createdAt: string;
}

export interface LearningProfile {
  topic: string;
  skillLevel: string;
  intensity: string;
  learningStyle: string;
  notificationFrequency: string;
  quietHours: string;
  goals: string;
}

export interface Topic {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  isReady: boolean;
  learningProfile?: LearningProfile;
  widgetActive?: boolean;
}

interface TopicsContextValue {
  topics: Topic[];
  loading: boolean;
  createTopic: (initialMessage: string) => Topic;
  deleteTopic: (id: string) => void;
  getTopic: (id: string) => Topic | undefined;
  saveMessages: (topicId: string, messages: Message[]) => void;
  markReady: (topicId: string, profile: LearningProfile) => void;
  setWidgetActive: (topicId: string, active: boolean) => void;
  updateTopicTitle: (topicId: string, title: string) => void;
}

const TopicsContext = createContext<TopicsContextValue | null>(null);

const STORAGE_KEY = "@learnflow_topics";

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `topic-${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 6)}`;
}

function generateUniqueId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function TopicsProvider({ children }: { children: React.ReactNode }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const topicsRef = useRef<Topic[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const loaded = JSON.parse(raw) as Topic[];
          setTopics(loaded);
          topicsRef.current = loaded;
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((updated: Topic[]) => {
    topicsRef.current = updated;
    setTopics(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const createTopic = useCallback(
    (initialMessage: string): Topic => {
      const firstMsg: Message = {
        id: generateUniqueId(),
        role: "user",
        content: initialMessage,
        createdAt: new Date().toISOString(),
      };
      const topic: Topic = {
        id: generateId(),
        title: "...",
        createdAt: new Date().toISOString(),
        messages: [firstMsg],
        isReady: false,
      };
      persist([topic, ...topicsRef.current]);
      return topic;
    },
    [persist],
  );

  const deleteTopic = useCallback(
    (id: string) => {
      persist(topicsRef.current.filter((t) => t.id !== id));
    },
    [persist],
  );

  const getTopic = useCallback(
    (id: string) => topicsRef.current.find((t) => t.id === id),
    [],
  );

  const saveMessages = useCallback(
    (topicId: string, messages: Message[]) => {
      const updated = topicsRef.current.map((t) =>
        t.id === topicId ? { ...t, messages } : t,
      );
      persist(updated);
    },
    [persist],
  );

  const markReady = useCallback(
    (topicId: string, profile: LearningProfile) => {
      const updated = topicsRef.current.map((t) =>
        t.id === topicId
          ? { ...t, isReady: true, learningProfile: profile }
          : t,
      );
      persist(updated);
    },
    [persist],
  );

  const setWidgetActive = useCallback(
    (topicId: string, active: boolean) => {
      const updated = topicsRef.current.map((t) =>
        t.id === topicId ? { ...t, widgetActive: active } : t,
      );
      persist(updated);
    },
    [persist],
  );

  const updateTopicTitle = useCallback(
    (topicId: string, title: string) => {
      const updated = topicsRef.current.map((t) =>
        t.id === topicId ? { ...t, title } : t,
      );
      persist(updated);
    },
    [persist],
  );

  return (
    <TopicsContext.Provider
      value={{
        topics,
        loading,
        createTopic,
        deleteTopic,
        getTopic,
        saveMessages,
        markReady,
        setWidgetActive,
        updateTopicTitle,
      }}
    >
      {children}
    </TopicsContext.Provider>
  );
}

export function useTopics() {
  const ctx = useContext(TopicsContext);
  if (!ctx) throw new Error("useTopics must be used within TopicsProvider");
  return ctx;
}
