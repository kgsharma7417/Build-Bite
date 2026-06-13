import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";

const TIMER_SECONDS = 30;
const REQUEUE_OFFSET = 3; // incorrect question reappears after ~3 more questions

export default function PracticeMode({ navigate, params }) {
  const { topicId } = params;
  const { getTopicQuestions, topics, markPracticed, markIncorrect } = useApp();

  const topic = topics.find((t) => t.id === topicId);
  const allQuestions = getTopicQuestions(topicId);

  // Sort so questions that were previously "incorrect" come first
  const [queue, setQueue] = useState(() =>
    [...allQuestions].sort(
      (a, b) => (b.incorrectCount || 0) - (a.incorrectCount || 0),
    ),
  );
  const [totalCount] = useState(allQuestions.length);
  const [completedCount, setCompletedCount] = useState(0);

  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(true);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [done, setDone] = useState(false);

  const q = queue[0];

  // Timer
  useEffect(() => {
    if (!timerActive || showAnswer || done) return;
    if (timeLeft <= 0) {
      setShowAnswer(true);
      setTimerActive(false);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, timerActive, showAnswer, done]);

  // Mark done when queue empties
  useEffect(() => {
    if (totalCount > 0 && queue.length === 0) setDone(true);
  }, [queue, totalCount]);

  const timerClass =
    timeLeft <= 5 ? "danger" : timeLeft <= 12 ? "warning" : "ok";

  const next = useCallback(
    (result) => {
      if (!q) return;

      if (result === "correct") {
        markPracticed(q.id);
        setScore((s) => ({ ...s, correct: s.correct + 1 }));
        setCompletedCount((c) => c + 1);
        setQueue((prev) => prev.slice(1));
      } else {
        markIncorrect(q.id);
        setScore((s) => ({ ...s, incorrect: s.incorrect + 1 }));
        // Requeue: move this question a few spots back in the session
        setQueue((prev) => {
          const rest = prev.slice(1);
          const pos = Math.min(REQUEUE_OFFSET, rest.length);
          return [...rest.slice(0, pos), q, ...rest.slice(pos)];
        });
      }

      setShowAnswer(false);
      setTimeLeft(TIMER_SECONDS);
      setTimerActive(true);
    },
    [q, markPracticed, markIncorrect],
  );

  if (allQuestions.length === 0) {
    return (
      <div className="page">
        <div className="topbar">
          <button
            className="back-btn"
            onClick={() => navigate("topic", { topicId })}
          >
            ‹
          </button>
          <h1>Practice</h1>
        </div>
        <div className="content">
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p>No questions to practice yet!</p>
            <button
              className="btn btn-primary"
              style={{ maxWidth: 200, margin: "0 auto" }}
              onClick={() => navigate("addQuestion", { topicId })}
            >
              + Add Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Done screen
  if (done) {
    const total = score.correct + score.incorrect;
    const pct = Math.round((score.correct / total) * 100);
    return (
      <div className="page">
        <div className="topbar">
          <button
            className="back-btn"
            onClick={() => navigate("topic", { topicId })}
          >
            ‹
          </button>
          <h1>Session Complete! 🎉</h1>
        </div>
        <div
          className="content"
          style={{ textAlign: "center", paddingTop: 40 }}
        >
          <div style={{ fontSize: 72, marginBottom: 16 }}>
            {pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚"}
          </div>
          <p style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
            {pct}%
          </p>
          <p style={{ color: "var(--text2)", marginBottom: 32 }}>
            {score.correct} correct · {score.incorrect} incorrect
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                background: "rgba(61,220,132,0.1)",
                borderRadius: "var(--radius)",
                padding: 16,
                border: "1px solid rgba(61,220,132,0.2)",
              }}
            >
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--success)",
                }}
              >
                {score.correct}
              </p>
              <p style={{ fontSize: 13, color: "var(--text2)" }}>Correct</p>
            </div>
            <div
              style={{
                background: "rgba(255,95,95,0.1)",
                borderRadius: "var(--radius)",
                padding: 16,
                border: "1px solid rgba(255,95,95,0.2)",
              }}
            >
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--danger)",
                }}
              >
                {score.incorrect}
              </p>
              <p style={{ fontSize: 13, color: "var(--text2)" }}>Missed</p>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginBottom: 10 }}
            onClick={() => {
              setQueue(
                [...allQuestions].sort(
                  (a, b) => (b.incorrectCount || 0) - (a.incorrectCount || 0),
                ),
              );
              setCompletedCount(0);
              setShowAnswer(false);
              setTimeLeft(TIMER_SECONDS);
              setTimerActive(true);
              setScore({ correct: 0, incorrect: 0 });
              setDone(false);
            }}
          >
            🔄 Practice Again
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => navigate("topic", { topicId })}
          >
            ← Back to Topic
          </button>
        </div>
      </div>
    );
  }

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
          <h1>{topic?.icon} Practice</h1>
          <p>
            {Math.min(completedCount + 1, totalCount)} of {totalCount}
          </p>
        </div>
        <div
          style={{ textAlign: "right", fontSize: 13, color: "var(--text2)" }}
        >
          ✅ {score.correct} &nbsp; ❌ {score.incorrect}
        </div>
      </div>

      <div className="content" style={{ paddingBottom: 120 }}>
        {/* Progress */}
        <div className="progress-bar" style={{ marginBottom: 20 }}>
          <div
            className="progress-fill"
            style={{
              width: `${(completedCount / totalCount) * 100}%`,
              background: topic?.color,
            }}
          />
        </div>

        {/* Timer */}
        {!showAnswer && (
          <div className="timer-wrap">
            <div className={`timer-circle ${timerClass}`}>{timeLeft}</div>
          </div>
        )}

        {/* Question card */}
        <div
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 20,
            marginBottom: 20,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "var(--accent)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 10,
            }}
          >
            Question {Math.min(completedCount + 1, totalCount)}
            {q.incorrectCount > 0 && " · 🔁 review"}
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.6, fontWeight: 500 }}>
            {q.question}
          </p>
          <div style={{ marginTop: 10 }}>
            <span className={`badge badge-${q.difficulty}`}>
              {q.difficulty}
            </span>
          </div>
        </div>

        {/* Show answer toggle */}
        {!showAnswer ? (
          <button
            className="btn btn-secondary"
            style={{ marginBottom: 16 }}
            onClick={() => {
              setShowAnswer(true);
              setTimerActive(false);
            }}
          >
            👁 Reveal Answer
          </button>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <p className="section-title" style={{ marginBottom: 8 }}>
                Answer
              </p>
              <div className="answer-box">{q.answer}</div>
            </div>

            <p
              style={{
                fontSize: 13,
                color: "var(--text2)",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              How did you do?
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <button
                className="btn btn-danger"
                style={{
                  padding: "14px",
                  flexDirection: "column",
                  gap: 4,
                  height: "auto",
                }}
                onClick={() => next("incorrect")}
              >
                <span style={{ fontSize: 22 }}>😕</span>
                <span>Need more practice</span>
              </button>
              <button
                className="btn btn-success"
                style={{
                  padding: "14px",
                  flexDirection: "column",
                  gap: 4,
                  height: "auto",
                }}
                onClick={() => next("correct")}
              >
                <span style={{ fontSize: 22 }}>😊</span>
                <span>Got it!</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
