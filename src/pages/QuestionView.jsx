import { useState } from "react";
import { useApp } from "../context/AppContext";

async function fetchHint(question, answer) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system:
        "You are an expert coding interview coach. Give a concise, clear hint to help the user understand the concept. Use simple language. Include a short code example if relevant. Keep it under 150 words.",
      messages: [
        {
          role: "user",
          content: `Interview Question: "${question}"\n\nGive me a helpful hint to understand and answer this question. Don't give the full answer away — just guide me.`,
        },
      ],
    }),
  });
  const data = await res.json();
  return data.content?.map((c) => c.text).join("") || "Could not get hint.";
}

async function fetchExplanation(question, answer) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system:
        "You are an expert coding interview coach. Explain the concept deeply but concisely. Use bullet points and a code example. Keep under 200 words.",
      messages: [
        {
          role: "user",
          content: `Question: "${question}"\nAnswer: "${answer}"\n\nGive me a deeper explanation with an example to help me really understand this.`,
        },
      ],
    }),
  });
  const data = await res.json();
  return (
    data.content?.map((c) => c.text).join("") || "Could not get explanation."
  );
}

export default function QuestionView({ navigate, params }) {
  const { questionId, topicId } = params;
  const { questions, topics, markPracticed } = useApp();

  const q = questions.find((x) => x.id === questionId);
  const topic = topics.find((t) => t.id === topicId);

  const [showAnswer, setShowAnswer] = useState(false);
  const [hint, setHint] = useState("");
  const [hintLoading, setHintLoading] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [explLoading, setExplLoading] = useState(false);
  const [notes, setNotes] = useState(q?.notes || "");
  const [notesSaved, setNotesSaved] = useState(false);

  if (!q) return null;

  const handleHint = async () => {
    if (hint) {
      setHint("");
      return;
    }
    setHintLoading(true);
    try {
      const h = await fetchHint(q.question, q.answer);
      setHint(h);
    } catch {
      setHint("❌ Could not load hint. Check your connection.");
    }
    setHintLoading(false);
  };

  const handleExplain = async () => {
    if (explanation) {
      setExplanation("");
      return;
    }
    setExplLoading(true);
    try {
      const e = await fetchExplanation(q.question, q.answer);
      setExplanation(e);
    } catch {
      setExplanation("❌ Could not load explanation.");
    }
    setExplLoading(false);
  };

  const handleMarkPracticed = () => {
    markPracticed(q.id);
    navigate("topic", { topicId });
  };

  return (
    <div className="page">
      <div className="topbar">
        <button
          className="back-btn"
          onClick={() => navigate("topic", { topicId })}
        >
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 15 }}>
            {topic?.icon} {topic?.name}
          </h1>
        </div>
        <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
      </div>

      <div className="content" style={{ paddingBottom: 120 }}>
        {/* Question */}
        <div
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "var(--accent)",
              fontWeight: 600,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Question
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 500 }}>
            {q.question}
          </p>
          {q.tags?.length > 0 && (
            <div className="tags" style={{ marginTop: 10 }}>
              {q.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            {showAnswer ? "🙈 Hide Answer" : "👁 Show Answer"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleHint}
            disabled={hintLoading}
          >
            {hintLoading ? "..." : hint ? "✕ Hide Hint" : "💡 AI Hint"}
          </button>
        </div>

        {/* Answer */}
        {showAnswer && (
          <div>
            <p className="section-title" style={{ marginBottom: 8 }}>
              Answer
            </p>
            <div className="answer-box">{q.answer}</div>
          </div>
        )}

        {/* AI Hint */}
        {hint && (
          <div className="hint-box">
            <div className="hint-label">✨ AI Hint</div>
            {hint}
          </div>
        )}

        {/* Deeper explanation */}
        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-ghost"
            style={{ width: "100%" }}
            onClick={handleExplain}
            disabled={explLoading}
          >
            {explLoading
              ? "Loading..."
              : explanation
                ? "▲ Hide Deep Explanation"
                : "🧠 Ask Claude to Explain Deeper"}
          </button>
          {explanation && (
            <div className="hint-box" style={{ marginTop: 10 }}>
              <div className="hint-label">🧠 Deep Explanation</div>
              {explanation}
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Personal Notes */}
        <div className="field">
          <label>📝 My Notes</label>
          <textarea
            rows={4}
            placeholder="Write your own understanding here..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesSaved(false);
            }}
          />
        </div>
        <button
          className="btn btn-secondary"
          style={{ marginBottom: 16 }}
          onClick={() => setNotesSaved(true)}
        >
          {notesSaved ? "✅ Saved" : "💾 Save Notes"}
        </button>

        <div className="divider" />

        {/* Mark practiced */}
        {!q.practiced ? (
          <button className="btn btn-success" onClick={handleMarkPracticed}>
            ✓ Mark as Practiced
          </button>
        ) : (
          <p
            style={{
              color: "var(--success)",
              fontSize: 14,
              textAlign: "center",
              padding: 12,
            }}
          >
            ✅ Already practiced!
          </p>
        )}
      </div>
    </div>
  );
}
