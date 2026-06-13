import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

async function extractQuestions(base64Data, topics) {
  const topicList = topics.map((t) => `${t.id}: ${t.name}`).join(", ");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: `You are an expert interview prep assistant. Read the attached document and generate 5-10 useful interview questions based on its content. Available topics (id: name): ${topicList}. Respond ONLY with a raw JSON array, no markdown formatting, no preamble or explanation. Each item must be exactly: {"topicId": "<one of the topic ids above that best fits>", "question": "<string>", "answer": "<concise plain-text answer>", "difficulty": "easy"|"medium"|"hard", "tags": ["string", ...]}`,
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
              text: "Generate interview questions based on this document.",
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

export default function PDFViewer({ navigate, params }) {
  const { pdfs, addPdf, deletePdf, addQuestion, topics } = useApp();
  const fileRef = useRef();
  const [viewing, setViewing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extractingId, setExtractingId] = useState(null);
  const [extractMsg, setExtractMsg] = useState("");

  const handleUpload = (e) => {
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
      });
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete this PDF?")) deletePdf(id);
    if (viewing?.id === id) setViewing(null);
  };

  const handleExtract = async (e, pdf) => {
    e.stopPropagation();
    setExtractMsg("");
    setExtractingId(pdf.id);
    try {
      const base64Data = pdf.dataUrl.split(",")[1];
      const items = await extractQuestions(base64Data, topics);
      let count = 0;
      items.forEach((item) => {
        if (!item?.question || !item?.answer) return;
        const topicId = topics.find((t) => t.id === item.topicId)
          ? item.topicId
          : topics[0]?.id;
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

  // PDF viewer screen
  if (viewing) {
    return (
      <div className="page">
        <div className="topbar">
          <button className="back-btn" onClick={() => setViewing(null)}>
            ‹
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 14,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {viewing.name}
            </h1>
          </div>
        </div>
        <div style={{ flex: 1, background: "#1a1a22" }}>
          <iframe
            src={viewing.dataUrl}
            title={viewing.name}
            style={{
              width: "100%",
              height: "calc(100vh - 57px)",
              border: "none",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate("home")}>
          ‹
        </button>
        <h1>📄 My PDFs</h1>
      </div>

      <div className="content with-fab">
        {/* Upload zone */}
        <div
          style={{
            border: "2px dashed var(--border)",
            borderRadius: "var(--radius)",
            padding: 28,
            textAlign: "center",
            marginBottom: 20,
            background: "var(--bg2)",
            cursor: "pointer",
          }}
          onClick={() => fileRef.current?.click()}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📤</div>
          <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 4 }}>
            {uploading ? "Uploading..." : "Tap to upload a PDF"}
          </p>
          <p style={{ fontSize: 12, color: "var(--text3)" }}>
            Study materials, notes, etc.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </div>

        {extractMsg && (
          <div
            style={{
              background: "rgba(61,220,132,0.1)",
              border: "1px solid rgba(61,220,132,0.2)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              color: "var(--success)",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {extractMsg}
          </div>
        )}

        {pdfs.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📂</div>
            <p>No PDFs yet. Upload your notes or study material!</p>
          </div>
        ) : (
          <>
            <div className="section-header">
              <span className="section-title">
                {pdfs.length} file{pdfs.length !== 1 ? "s" : ""}
              </span>
            </div>

            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="pdf-item"
                onClick={() => setViewing(pdf)}
                style={{ flexWrap: "wrap", gap: 8 }}
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
                  {extractingId === pdf.id ? "⏳ Working..." : "✨ Extract Qs"}
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
                  onClick={(e) => handleDelete(e, pdf.id)}
                >
                  🗑
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <button className="fab" onClick={() => fileRef.current?.click()}>
        +
      </button>
    </div>
  );
}
