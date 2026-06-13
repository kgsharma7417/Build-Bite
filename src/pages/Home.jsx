import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function Home({ navigate }) {
  const {
    topics,
    questions,
    getTopicQuestions,
    getStats,
    pdfs,
    streak,
    addTopic,
  } = useApp();
  const [search, setSearch] = useState("");
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({
    name: "",
    icon: "📁",
    color: "#9b8cff",
  });

  const totalQ = topics.reduce(
    (acc, t) => acc + getTopicQuestions(t.id).length,
    0,
  );
  const totalPracticed = topics.reduce(
    (acc, t) => acc + getStats(t.id).practiced,
    0,
  );

  const searchResults = search.trim()
    ? questions.filter((q) =>
        q.question.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : [];

  const handleAddTopic = () => {
    if (!newTopic.name.trim()) return;
    addTopic({
      name: newTopic.name.trim(),
      icon: newTopic.icon.trim() || "📁",
      color: newTopic.color,
      bg: newTopic.color + "26",
    });
    setNewTopic({ name: "", icon: "📁", color: "#9b8cff" });
    setShowAddTopic(false);
  };

  return (
    <div className="page">
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1>Interview Prep 🎯</h1>
          <p>
            {totalQ} questions · {totalPracticed} practiced
            {streak?.count > 0 && <> · 🔥 {streak.count} day streak</>}
          </p>
        </div>
        <button
          className="btn btn-ghost"
          style={{ padding: "8px 12px", fontSize: 13 }}
          onClick={() => navigate("pdf")}
        >
          📄 PDFs{" "}
          {pdfs.length > 0 && (
            <span style={{ color: "var(--accent)" }}>({pdfs.length})</span>
          )}
        </button>
      </div>

      <div className="content with-fab">
        {/* Global search */}
        <div className="field" style={{ marginBottom: 16 }}>
          <input
            placeholder="🔍  Search all questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {search.trim() ? (
          <>
            <div className="section-header" style={{ marginBottom: 16 }}>
              <span className="section-title">
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""}
              </span>
            </div>
            {searchResults.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🤔</div>
                <p>No matching questions</p>
              </div>
            ) : (
              searchResults.map((q) => {
                const topic = topics.find((t) => t.id === q.topicId);
                return (
                  <div
                    key={q.id}
                    className="card"
                    onClick={() =>
                      navigate("question", {
                        questionId: q.id,
                        topicId: q.topicId,
                      })
                    }
                  >
                    <div
                      className="topic-dot"
                      style={{ background: topic?.bg }}
                    >
                      <span style={{ fontSize: 20 }}>{topic?.icon}</span>
                    </div>
                    <div className="card-body">
                      <div className="card-title">{q.question}</div>
                      <div className="card-sub">{topic?.name}</div>
                    </div>
                    <span className={`badge badge-${q.difficulty}`}>
                      {q.difficulty}
                    </span>
                  </div>
                );
              })
            )}
          </>
        ) : (
          <>
            <div className="section-header" style={{ marginBottom: 16 }}>
              <span className="section-title">Topics</span>
              <button
                className="btn btn-ghost"
                style={{ width: "auto", padding: "4px 10px", fontSize: 12 }}
                onClick={() => setShowAddTopic((s) => !s)}
              >
                {showAddTopic ? "✕ Cancel" : "+ New Topic"}
              </button>
            </div>

            {showAddTopic && (
              <div
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Topic name</label>
                  <input
                    placeholder="e.g. System Design"
                    value={newTopic.name}
                    onChange={(e) =>
                      setNewTopic((t) => ({ ...t, name: e.target.value }))
                    }
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Icon (emoji)</label>
                    <input
                      placeholder="📁"
                      value={newTopic.icon}
                      onChange={(e) =>
                        setNewTopic((t) => ({ ...t, icon: e.target.value }))
                      }
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Color</label>
                    <input
                      type="color"
                      value={newTopic.color}
                      onChange={(e) =>
                        setNewTopic((t) => ({ ...t, color: e.target.value }))
                      }
                      style={{ height: 38, padding: 4 }}
                    />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleAddTopic}>
                  Add Topic
                </button>
              </div>
            )}

            {topics.map((topic) => {
              const { total, practiced } = getStats(topic.id);
              const pct = total > 0 ? Math.round((practiced / total) * 100) : 0;

              return (
                <div
                  key={topic.id}
                  className="card"
                  onClick={() => navigate("topic", { topicId: topic.id })}
                >
                  <div className="topic-dot" style={{ background: topic.bg }}>
                    <span style={{ fontSize: 20 }}>{topic.icon}</span>
                  </div>

                  <div className="card-body">
                    <div className="card-title">{topic.name}</div>
                    <div className="card-sub">
                      {total === 0
                        ? "No questions yet"
                        : `${practiced}/${total} practiced`}
                    </div>
                    {total > 0 && (
                      <div className="progress-bar" style={{ marginTop: 6 }}>
                        <div
                          className="progress-fill"
                          style={{ width: `${pct}%`, background: topic.color }}
                        />
                      </div>
                    )}
                  </div>

                  <span style={{ color: "var(--text3)", fontSize: 18 }}>›</span>
                </div>
              );
            })}

            <div className="divider" />

            <div className="section-header">
              <span className="section-title">Quick Actions</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <button
                className="btn btn-secondary"
                style={{
                  flexDirection: "column",
                  gap: 6,
                  padding: "16px 12px",
                  height: "auto",
                }}
                onClick={() => navigate("addQuestion", {})}
              >
                <span style={{ fontSize: 22 }}>✏️</span>
                <span style={{ fontSize: 13 }}>Add Question</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{
                  flexDirection: "column",
                  gap: 6,
                  padding: "16px 12px",
                  height: "auto",
                }}
                onClick={() => navigate("pdf")}
              >
                <span style={{ fontSize: 22 }}>📄</span>
                <span style={{ fontSize: 13 }}>Upload PDF</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{
                  flexDirection: "column",
                  gap: 6,
                  padding: "16px 12px",
                  height: "auto",
                  gridColumn: "1 / -1",
                }}
                onClick={() => {
                  const allTopics = topics.filter(
                    (t) => getTopicQuestions(t.id).length > 0,
                  );
                  if (allTopics.length > 0)
                    navigate("practice", {
                      topicId: allTopics[0].id,
                      allTopics: true,
                    });
                }}
              >
                <span style={{ fontSize: 22 }}>🔥</span>
                <span style={{ fontSize: 13 }}>Practice All Topics</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
