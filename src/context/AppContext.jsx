import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

const DEFAULT_TOPICS = [
  {
    id: "js",
    name: "JavaScript",
    icon: "⚡",
    color: "#f7df1e",
    bg: "rgba(247,223,30,0.12)",
  },
  {
    id: "react",
    name: "React",
    icon: "⚛️",
    color: "#61dafb",
    bg: "rgba(97,218,251,0.12)",
  },
  {
    id: "node",
    name: "Node.js",
    icon: "🟢",
    color: "#68a063",
    bg: "rgba(104,160,99,0.12)",
  },
  {
    id: "css",
    name: "CSS",
    icon: "🎨",
    color: "#264de4",
    bg: "rgba(38,77,228,0.15)",
  },
  {
    id: "python",
    name: "Python",
    icon: "🐍",
    color: "#3572A5",
    bg: "rgba(53,114,165,0.12)",
  },
  {
    id: "dsa",
    name: "DSA",
    icon: "🧠",
    color: "#ff6b35",
    bg: "rgba(255,107,53,0.12)",
  },
];

const SAMPLE_QUESTIONS = [
  {
    id: "q1",
    topicId: "js",
    question: "What is the difference between var, let, and const?",
    answer:
      "var is function-scoped and hoisted to the top of its function. let and const are block-scoped.\n\nvar can be re-declared and updated.\nlet can be updated but not re-declared in the same scope.\nconst cannot be updated or re-declared — but for objects/arrays, the contents can still be mutated.\n\nExample:\nvar x = 1; var x = 2; // OK\nlet y = 1; let y = 2; // SyntaxError\nconst z = {}; z.a = 1; // OK, object mutation is allowed",
    difficulty: "easy",
    tags: ["scope", "hoisting"],
    practiced: false,
    incorrectCount: 0,
  },
  {
    id: "q2",
    topicId: "js",
    question: "What is a closure in JavaScript?",
    answer:
      "A closure is a function that remembers the variables from its outer scope even after the outer function has finished executing.\n\nExample:\nfunction counter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\nconst inc = counter();\ninc(); // 1\ninc(); // 2\n\nThe inner function 'closes over' the count variable.",
    difficulty: "medium",
    tags: ["scope", "functions"],
    practiced: false,
    incorrectCount: 0,
  },
  {
    id: "q3",
    topicId: "react",
    question: "What is the difference between useEffect and useLayoutEffect?",
    answer:
      "useEffect runs asynchronously AFTER the browser paints — good for data fetching, subscriptions.\n\nuseLayoutEffect runs synchronously AFTER DOM mutations but BEFORE the browser paints — use it when you need to read layout or prevent visual flicker.\n\nRule of thumb: always start with useEffect. Switch to useLayoutEffect only if you see flickering.",
    difficulty: "hard",
    tags: ["hooks", "rendering"],
    practiced: false,
    incorrectCount: 0,
  },
];

export function AppProvider({ children }) {
  const [topics, setTopics] = useState(() => {
    try {
      const saved = localStorage.getItem("ip_topics");
      return saved ? JSON.parse(saved) : DEFAULT_TOPICS;
    } catch {
      return DEFAULT_TOPICS;
    }
  });

  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem("ip_questions");
      return saved ? JSON.parse(saved) : SAMPLE_QUESTIONS;
    } catch {
      return SAMPLE_QUESTIONS;
    }
  });

  const [pdfs, setPdfs] = useState(() => {
    try {
      const saved = localStorage.getItem("ip_pdfs");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [streak, setStreak] = useState(() => {
    try {
      const saved = localStorage.getItem("ip_streak");
      return saved ? JSON.parse(saved) : { count: 0, lastDate: null };
    } catch {
      return { count: 0, lastDate: null };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ip_topics", JSON.stringify(topics));
    } catch {}
  }, [topics]);

  useEffect(() => {
    try {
      localStorage.setItem("ip_questions", JSON.stringify(questions));
    } catch {}
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem("ip_pdfs", JSON.stringify(pdfs));
    } catch {}
  }, [pdfs]);

  useEffect(() => {
    try {
      localStorage.setItem("ip_streak", JSON.stringify(streak));
    } catch {}
  }, [streak]);

  // ---- Topics ----
  const addTopic = (topic) => {
    const id = `t${Date.now()}`;
    setTopics((prev) => [
      ...prev,
      {
        id,
        name: topic.name,
        icon: topic.icon || "📁",
        color: topic.color || "#9b8cff",
        bg: topic.bg || "rgba(155,140,255,0.15)",
      },
    ]);
    return id;
  };

  const deleteTopic = (id) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    setQuestions((prev) => prev.filter((q) => q.topicId !== id));
  };

  // ---- Questions ----
  const addQuestion = (q) => {
    const newQ = {
      ...q,
      id: `q${Date.now()}`,
      practiced: false,
      incorrectCount: 0,
    };
    setQuestions((prev) => [...prev, newQ]);
    return newQ.id;
  };

  const updateQuestion = (id, updates) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    );
  };

  const deleteQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // ---- Streak ----
  const recordPractice = () => {
    const today = new Date().toDateString();
    setStreak((s) => {
      if (s.lastDate === today) return s;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const count = s.lastDate === yesterday ? s.count + 1 : 1;
      return { count, lastDate: today };
    });
  };

  const markPracticed = (id) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, practiced: true, incorrectCount: 0 } : q,
      ),
    );
    recordPractice();
  };

  // For spaced repetition: increments priority so question resurfaces sooner
  const markIncorrect = (id) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, incorrectCount: (q.incorrectCount || 0) + 1 } : q,
      ),
    );
    recordPractice();
  };

  // ---- PDFs ----
  const addPdf = (pdf) =>
    setPdfs((prev) => [...prev, { ...pdf, id: `pdf${Date.now()}` }]);
  const deletePdf = (id) => setPdfs((prev) => prev.filter((p) => p.id !== id));

  // ---- Helpers ----
  const getTopicQuestions = (topicId) =>
    questions.filter((q) => q.topicId === topicId);
  const getTopicPdfs = (topicId) => pdfs.filter((p) => p.topicId === topicId);
  const getStats = (topicId) => {
    const qs = getTopicQuestions(topicId);
    return {
      total: qs.length,
      practiced: qs.filter((q) => q.practiced).length,
    };
  };

  return (
    <AppContext.Provider
      value={{
        topics,
        questions,
        pdfs,
        streak,
        addTopic,
        deleteTopic,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        markPracticed,
        markIncorrect,
        addPdf,
        deletePdf,
        getTopicQuestions,
        getTopicPdfs,
        getStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
