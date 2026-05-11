import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
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
}

interface TopicsContextValue {
  topics: Topic[];
  loading: boolean;
  createTopic: (title: string) => Topic;
  deleteTopic: (id: string) => void;
  getTopic: (id: string) => Topic | undefined;
  saveMessages: (topicId: string, messages: Message[]) => void;
  markReady: (topicId: string, profile: LearningProfile) => void;
}

const TopicsContext = createContext<TopicsContextValue | null>(null);

const STORAGE_KEY = "@learnflow_topics";

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `topic-${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 6)}`;
}

export function TopicsProvider({ children }: { children: React.ReactNode }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          setTopics(JSON.parse(raw));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((updated: Topic[]) => {
    setTopics(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const createTopic = useCallback(
    (title: string): Topic => {
      const topic: Topic = {
        id: generateId(),
        title: title.trim(),
        createdAt: new Date().toISOString(),
        messages: [],
        isReady: false,
      };
      persist([topic, ...topics]);
      return topic;
    },
    [topics, persist],
  );

  const deleteTopic = useCallback(
    (id: string) => {
      persist(topics.filter((t) => t.id !== id));
    },
    [topics, persist],
  );

  const getTopic = useCallback(
    (id: string) => topics.find((t) => t.id === id),
    [topics],
  );

  const saveMessages = useCallback(
    (topicId: string, messages: Message[]) => {
      const updated = topics.map((t) =>
        t.id === topicId ? { ...t, messages } : t,
      );
      persist(updated);
    },
    [topics, persist],
  );

  const markReady = useCallback(
    (topicId: string, profile: LearningProfile) => {
      const updated = topics.map((t) =>
        t.id === topicId ? { ...t, isReady: true, learningProfile: profile } : t,
      );
      persist(updated);
    },
    [topics, persist],
  );

  return (
    <TopicsContext.Provider
      value={{ topics, loading, createTopic, deleteTopic, getTopic, saveMessages, markReady }}
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
