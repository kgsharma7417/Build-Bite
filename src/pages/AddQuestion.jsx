import { useState } from "react";
import { useApp } from "../context/AppContext";

async function generateAnswer(question, topicName) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system:
        "You are an expert programming interview coach. Write a clear, concise answer for the given interview question. Include a short code example if relevant. Keep it under 200 words. Plain text only, no markdown.",
      messages: [
        {
          role: "user",
          content: `Topic: ${topicName}\nInterview Question: "${question}"\n\nWrite the ideal interview answer.`,
        },
      ],
    }),
  });
  const data = await res.json();
  return data.content?.map((c) => c.text).join("") || "";
}

export default function AddQuestion({ navigate, params }) {
  const { topicId: defaultTopic, questionId } = params;
  const { topics, questions, addQuestion, updateQuestion, addTopic } = useApp();

  const editing = questions.find((q) => q.id === questionId);

  const [form, setForm] = useState(() =>
    editing
      ? {
          topicId: editing.topicId,
          question: editing.question,
          answer: editing.answer,
          difficulty: editing.difficulty,
          tags: (editing.tags || []).join(", "),
        }
      : {
          topicId: defaultTopic || topics[0]?.id,
          question: "",
          answer: "",
          difficulty: "medium",
          tags: "",
        },
  );
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicIcon, setNewTopicIcon] = useState("📁");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    const id = addTopic({
      name: newTopicName.trim(),
      icon: newTopicIcon.trim() || "📁",
    });
    set("topicId", id);
    setNewTopicName("");
    setNewTopicIcon("📁");
    setShowNewTopic(false);
  };

  const handleGenAnswer = async () => {
    if (!form.question.trim()) {
      setError("Please write the question first.");
      return;
    }
    setError("");
    setGenLoading(true);
    try {
      const topic = topics.find((t) => t.id === form.topicId);
      const ans = await generateAnswer(
        form.question,
        topic?.name || form.topicId,
      );
      set("answer", ans);
    } catch {
      setError("Could not generate answer. Try again.");
    }
    setGenLoading(false);
  };

  const handleSave = () => {
    if (!form.question.trim() || !form.answer.trim()) {
      setError("Question and answer are required.");
      return;
    }
    const tagsArr = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (editing) {
      updateQuestion(editing.id, { ...form, tags: tagsArr });
    } else {
      addQuestion({ ...form, tags: tagsArr });
    }
    navigate("topic", { topicId: form.topicId });
  };

  return (
    <div className="page">
      <div className="topbar">
        <button
          className="back-btn"
          onClick={() =>
            navigate(defaultTopic ? "topic" : "home", { topicId: defaultTopic })
          }
        >
          ‹
        </button>
        <h1>{editing ? "Edit Question" : "Add Question"}</h1>
      </div>

      <div className="content" style={{ paddingBottom: 100 }}>
        {error && (
          <div
            style={{
              background: "rgba(255,95,95,0.1)",
              border: "1px solid rgba(255,95,95,0.25)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              color: "var(--danger)",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Topic */}
        <div className="field">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <label style={{ margin: 0 }}>Topic</label>
            <button
              className="btn btn-ghost"
              style={{ padding: "4px 10px", fontSize: 12, width: "auto" }}
              onClick={() => setShowNewTopic((s) => !s)}
            >
              {showNewTopic ? "✕ Cancel" : "+ New Topic"}
            </button>
          </div>

          {showNewTopic && (
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                style={{ width: 56, textAlign: "center" }}
                placeholder="📁"
                value={newTopicIcon}
                onChange={(e) => setNewTopicIcon(e.target.value)}
              />
              <input
                placeholder="Topic name (e.g. System Design)"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
              />
              <button
                className="btn btn-primary"
                style={{ width: "auto", padding: "0 14px" }}
                onClick={handleAddTopic}
              >
                Add
              </button>
            </div>
          )}

          <select
            value={form.topicId}
            onChange={(e) => set("topicId", e.target.value)}
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="field">
          <label>Difficulty</label>
          <div className="chips">
            {["easy", "medium", "hard"].map((d) => (
              <button
                key={d}
                className={`chip ${form.difficulty === d ? "active" : ""}`}
                onClick={() => set("difficulty", d)}
              >
                {d === "easy" ? "🟢" : d === "medium" ? "🟡" : "🔴"} {d}
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="field">
          <label>Question</label>
          <textarea
            rows={3}
            placeholder="e.g. What is event delegation in JavaScript?"
            value={form.question}
            onChange={(e) => set("question", e.target.value)}
          />
        </div>

        {/* Answer */}
        <div className="field">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <label style={{ margin: 0 }}>Answer</label>
            <button
              className="btn btn-ghost"
              style={{ padding: "4px 10px", fontSize: 12, width: "auto" }}
              onClick={handleGenAnswer}
              disabled={genLoading}
            >
              {genLoading ? "⏳ Generating..." : "✨ AI Generate"}
            </button>
          </div>
          <textarea
            rows={6}
            placeholder="Write your answer here, or tap AI Generate above..."
            value={form.answer}
            onChange={(e) => set("answer", e.target.value)}
          />
        </div>

        {/* Tags */}
        <div className="field">
          <label>Tags (comma separated)</label>
          <input
            placeholder="e.g. scope, hoisting, closures"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={handleSave}>
          {editing ? "💾 Update Question" : "💾 Save Question"}
        </button>
      </div>
    </div>
  );
}
