import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";

const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 };

async function extractQuestions(base64Data, topic) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: `You are an expert interview prep assistant. Read the attached document and generate 5-10 useful interview questions specifically about "${topic.name}", based on the document's content. Respond ONLY with a raw JSON array, no markdown, no preamble. Each item must be exactly: {"question": "<string>", "answer": "<concise plain-text answer>", "difficulty": "easy"|"medium"|"hard", "tags": ["string", ...]}`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `Generate ${topic.name} interview questions based on this document.`,
            },
          ],
        },
      ],
    }),
  });
  const data = await res.json();
  const text = data.content?.map((c) => c.text).join("") || "[]";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function TopicView({ navigate, params }) {
  const { topicId } = params;
  const {
    topics,
    getTopicQuestions,
    getStats,
    deleteQuestion,
    getTopicPdfs,
    addPdf,
    deletePdf,
    addQuestion,
  } = useApp();
  const topic = topics.find((t) => t.id === topicId);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [extractingId, setExtractingId] = useState(null);
  const [extractMsg, setExtractMsg] = useState("");
  const [showPdfs, setShowPdfs] = useState(false);

  const allQ = getTopicQuestions(topicId);
  const { total, practiced } = getStats(topicId);
  const topicPdfs = getTopicPdfs(topicId);

  const filtered = allQ
    .filter((q) => {
      if (filter === "practiced") return q.practiced;
      if (filter === "unpracticed") return !q.practiced;
      if (filter === "easy" || filter === "medium" || filter === "hard")
        return q.difficulty === filter;
      return true;
    })
    .filter((q) =>
      search ? q.question.toLowerCase().includes(search.toLowerCase()) : true,
    )
    .sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete this question?")) deleteQuestion(id);
  };

  const handleEdit = (e, id) => {
    e.stopPropagation();
    navigate("addQuestion", { topicId, questionId: id });
  };

  const handleUploadPdf = (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      addPdf({
        name: file.name,
        size: file.size,
        dataUrl: ev.target.result,
        uploadedAt: new Date().toLocaleDateString(),
        topicId,
      });
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeletePdf = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete this PDF?")) deletePdf(id);
  };

  const handleExtract = async (e, pdf) => {
    e.stopPropagation();
    setExtractMsg("");
    setExtractingId(pdf.id);
    try {
      const base64Data = pdf.dataUrl.split(",")[1];
      const items = await extractQuestions(base64Data, topic);
      let count = 0;
      items.forEach((item) => {
        if (!item?.question || !item?.answer) return;
        addQuestion({
          topicId,
          question: item.question,
          answer: item.answer,
          difficulty: ["easy", "medium", "hard"].includes(item.difficulty)
            ? item.difficulty
            : "medium",
          tags: Array.isArray(item.tags) ? item.tags : [],
        });
        count++;
      });
      setExtractMsg(
        count > 0
          ? `✅ Added ${count} question${count !== 1 ? "s" : ""} from "${pdf.name}"`
          : "⚠️ No questions could be generated from this PDF.",
      );
    } catch {
      setExtractMsg("❌ Could not extract questions. Try again.");
    }
    setExtractingId(null);
  };

  return (
    <div className="page">
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate("home")}>
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <h1>
            {topic?.icon} {topic?.name}
          </h1>
          <p>
            {practiced}/{total} practiced
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "auto", padding: "8px 14px", fontSize: 13 }}
          onClick={() => navigate("practice", { topicId })}
          disabled={allQ.length === 0}
        >
          Practice
        </button>
      </div>

      <div className="content with-fab">
        {/* Topic PDFs */}
        <div
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            onClick={() => setShowPdfs((s) => !s)}
          >
            <span className="section-title">
              📄 {topic?.name} PDFs{" "}
              {topicPdfs.length > 0 && (
                <span style={{ color: "var(--accent)" }}>
                  ({topicPdfs.length})
                </span>
              )}
            </span>
            <span style={{ color: "var(--text3)", fontSize: 14 }}>
              {showPdfs ? "▲" : "▼"}
            </span>
          </div>

          {showPdfs && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  border: "2px dashed var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: 16,
                  textAlign: "center",
                  cursor: "pointer",
                  marginBottom: 12,
                }}
                onClick={() => fileRef.current?.click()}
              >
                <p style={{ fontSize: 13, color: "var(--text2)" }}>
                  {uploading
                    ? "Uploading..."
                    : `📤 Tap to upload a ${topic?.name} PDF`}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={handleUploadPdf}
                />
              </div>

              {extractMsg && (
                <div
                  style={{
                    background: "rgba(61,220,132,0.1)",
                    border: "1px solid rgba(61,220,132,0.2)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    color: "var(--success)",
                    fontSize: 12,
                    marginBottom: 10,
                  }}
                >
                  {extractMsg}
                </div>
              )}

              {topicPdfs.length === 0 ? (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text3)",
                    textAlign: "center",
                  }}
                >
                  No PDFs for this topic yet.
                </p>
              ) : (
                topicPdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="pdf-item"
                    style={{ flexWrap: "wrap", gap: 8, marginBottom: 8 }}
                    onClick={() => navigate("pdf", { topicId, pdfId: pdf.id })}
                  >
                    <div className="pdf-icon">📋</div>
                    <div className="pdf-info">
                      <div className="pdf-name">{pdf.name}</div>
                      <div className="pdf-size">
                        {formatSize(pdf.size)} · {pdf.uploadedAt}
                      </div>
                    </div>
                    <button
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--accent)",
                        fontSize: 12,
                        cursor: "pointer",
                        padding: "6px 10px",
                        whiteSpace: "nowrap",
                      }}
                      onClick={(e) => handleExtract(e, pdf)}
                      disabled={extractingId === pdf.id}
                    >
                      {extractingId === pdf.id
                        ? "⏳ Working..."
                        : "✨ Extract Qs"}
                    </button>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text3)",
                        fontSize: 18,
                        cursor: "pointer",
                        padding: "4px 8px",
                      }}
                      onClick={(e) => handleDeletePdf(e, pdf.id)}
                    >
                      🗑
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="field" style={{ marginBottom: 12 }}>
          <input
            placeholder="🔍  Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="chips" style={{ marginBottom: 16 }}>
          {["all", "unpracticed", "practiced", "easy", "medium", "hard"].map(
            (f) => (
              <button
                key={f}
                className={`chip ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ),
          )}
        </div>

        {/* Progress */}
        {total > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.round((practiced / total) * 100)}%`,
                  background: topic?.color,
                }}
              />
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
              {Math.round((practiced / total) * 100)}% complete
            </p>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🤔</div>
            <p>{search ? "No matching questions" : "No questions yet"}</p>
            <button
              className="btn btn-primary"
              style={{ maxWidth: 200, margin: "0 auto" }}
              onClick={() => navigate("addQuestion", { topicId })}
            >
              + Add Question
            </button>
          </div>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              className="card"
              onClick={() =>
                navigate("question", { questionId: q.id, topicId })
              }
            >
              {q.practiced && (
                <span style={{ fontSize: 16, color: "var(--success)" }}>✓</span>
              )}
              <div className="card-body">
                <div className="card-title">{q.question}</div>
                <div className="tags">
                  {q.tags?.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                  {q.incorrectCount > 0 && (
                    <span className="tag" style={{ color: "var(--danger)" }}>
                      🔁 needs review
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                <span className={`badge badge-${q.difficulty}`}>
                  {q.difficulty}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text3)",
                      fontSize: 16,
                      cursor: "pointer",
                      padding: 4,
                    }}
                    onClick={(e) => handleEdit(e, q.id)}
                  >
                    ✏️
                  </button>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text3)",
                      fontSize: 16,
                      cursor: "pointer",
                      padding: 4,
                    }}
                    onClick={(e) => handleDelete(e, q.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        className="fab"
        onClick={() => navigate("addQuestion", { topicId })}
      >
        +
      </button>
    </div>
  );
}
