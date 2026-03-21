import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, ChevronRight, Trophy, Volume2 } from "lucide-react";

const MODES = [
  {
    id: "vi2en",
    label: "Việt → Anh",
    desc: "Nhìn nghĩa tiếng Việt, điền từ tiếng Anh",
  },
  {
    id: "en2vi",
    label: "Anh → Việt",
    desc: "Nhìn từ tiếng Anh, điền nghĩa tiếng Việt",
  },
  { id: "type", label: "Loại từ", desc: "Đoán loại từ của từ tiếng Anh" },
  { id: "mixed", label: "Hỗn hợp", desc: "Ngẫu nhiên tất cả các chế độ" },
];

const TYPE_LABELS = {
  n: "danh từ (n)",
  v: "động từ (v)",
  adj: "tính từ (adj)",
  adv: "trạng từ (adv)",
  prep: "giới từ (prep)",
  conj: "liên từ (conj)",
  pron: "đại từ (pron)",
  interj: "thán từ (interj)",
  phrase: "cụm từ (phrase)",
};
const ALL_TYPES = Object.keys(TYPE_LABELS);

function speak(text) {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

function getQuestionFor(card, forcedMode) {
  const modes =
    forcedMode === "mixed" ? ["vi2en", "en2vi", "type"] : [forcedMode];
  const mode = modes[Math.floor(Math.random() * modes.length)];
  if (mode === "vi2en")
    return {
      prompt: card.vietnamese,
      hint: `(loại từ: ${card.type})`,
      answer: card.english,
      answerLabel: "Từ tiếng Anh",
      mode,
    };
  if (mode === "en2vi")
    return {
      prompt: card.english,
      hint: card.type ? `(${card.type})` : "",
      answer: card.vietnamese,
      answerLabel: "Nghĩa tiếng Việt",
      mode,
    };
  if (mode === "type")
    return {
      prompt: card.english,
      hint: `nghĩa: ${card.vietnamese}`,
      answer: card.type,
      answerLabel: "Loại từ",
      mode,
      isType: true,
    };
  return null;
}

export default function VocabQuiz({ vocab }) {
  const [mode, setMode] = useState("mixed");
  const [sessionSize, setSessionSize] = useState(10);
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]);

  const startSession = useCallback(() => {
    if (vocab.length === 0) return;
    const shuffled = [...vocab].sort(() => Math.random() - 0.5);
    const cards = shuffled.slice(0, Math.min(sessionSize, vocab.length));
    const questions = cards.map((c) => getQuestionFor(c, mode));
    setSession(questions);
    setIdx(0);
    setInput("");
    setResult(null);
    setStats({ correct: 0, wrong: 0 });
    setDone(false);
    setStreak(0);
    setHistory([]);
  }, [vocab, mode, sessionSize]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (vocab.length > 0) startSession();
  }, []);

  const currentQ = session?.[idx];

  const checkAnswer = () => {
    if (!currentQ || result !== null) return;
    const ans = input.trim().toLowerCase();
    const correct = currentQ.answer.trim().toLowerCase();
    const isCorrect =
      ans === correct ||
      (currentQ.mode === "vi2en" &&
        correct
          .split("/")
          .map((s) => s.trim())
          .includes(ans));
    setResult(isCorrect ? "correct" : "wrong");
    setStats((p) => ({
      correct: p.correct + (isCorrect ? 1 : 0),
      wrong: p.wrong + (isCorrect ? 0 : 1),
    }));
    setStreak((p) => (isCorrect ? p + 1 : 0));
    setHistory((p) => [
      ...p,
      { question: currentQ, userAnswer: input, correct: isCorrect },
    ]);
    if (currentQ.mode === "vi2en" || currentQ.mode === "type")
      speak(currentQ.mode === "vi2en" ? currentQ.answer : currentQ.prompt);
  };

  const next = () => {
    if (idx + 1 >= (session?.length || 0)) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setResult(null);
  };

  if (vocab.length === 0)
    return (
      <div style={{ textAlign: "center", padding: 80, color: "var(--text3)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
        <p style={{ fontSize: 16 }}>
          Chưa có từ vựng nào. Hãy thêm từ trong tab{" "}
          <strong style={{ color: "var(--accent2)" }}>Từ Vựng</strong>!
        </p>
      </div>
    );

  if (done)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: 40,
            textAlign: "center",
          }}
        >
          <Trophy
            size={48}
            style={{ color: "var(--yellow)", marginBottom: 16 }}
          />
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Hoàn thành!
          </h2>
          <p style={{ color: "var(--text2)", marginBottom: 24 }}>
            Kết quả phiên luyện tập
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 32,
              marginBottom: 32,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: "var(--green)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {stats.correct}
              </div>
              <div style={{ color: "var(--text3)", fontSize: 13 }}>Đúng</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: "var(--red)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {stats.wrong}
              </div>
              <div style={{ color: "var(--text3)", fontSize: 13 }}>Sai</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: "var(--accent3)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {Math.round(
                  (stats.correct / (stats.correct + stats.wrong)) * 100,
                )}
                %
              </div>
              <div style={{ color: "var(--text3)", fontSize: 13 }}>
                Chính xác
              </div>
            </div>
          </div>
          <button
            onClick={startSession}
            style={{ ...btnPrimary, margin: "0 auto", fontSize: 16 }}
          >
            <RefreshCw size={18} /> Luyện tập lại
          </button>
        </div>

        {/* History */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
          }}
        >
          <h3
            style={{ fontWeight: 700, marginBottom: 16, color: "var(--text2)" }}
          >
            Chi tiết kết quả
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {history.map((h, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: h.correct
                    ? "rgba(74,222,128,0.08)"
                    : "rgba(248,113,113,0.08)",
                  border: `1px solid ${h.correct ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                }}
              >
                <span style={{ fontSize: 18 }}>{h.correct ? "✅" : "❌"}</span>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: "var(--text2)",
                    }}
                  >
                    {h.question.prompt}
                  </span>
                  {!h.correct && (
                    <span
                      style={{
                        color: "var(--text3)",
                        fontSize: 12,
                        marginLeft: 8,
                      }}
                    >
                      bạn: "{h.userAnswer}"
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: h.correct ? "var(--green)" : "var(--red)",
                    fontWeight: 700,
                  }}
                >
                  {h.question.answer}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{ ...modeBtn, ...(mode === m.id ? modeBtnActive : {}) }}
            title={m.desc}
          >
            {m.label}
          </button>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: "auto",
          }}
        >
          <span style={{ color: "var(--text3)", fontSize: 13 }}>Số câu:</span>
          <select
            value={sessionSize}
            onChange={(e) => setSessionSize(Number(e.target.value))}
            style={{ ...selectStyle, width: 70 }}
          >
            {[5, 10, 15, 20, 30, 50]
              .filter((n) => n <= vocab.length)
              .map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            {![5, 10, 15, 20, 30, 50].includes(vocab.length) && (
              <option value={vocab.length}>Tất cả ({vocab.length})</option>
            )}
          </select>
          <button
            onClick={startSession}
            style={{ ...iconBtnSmall }}
            title="Bắt đầu lại"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {session && (
        <div
          style={{
            position: "relative",
            height: 6,
            background: "var(--bg3)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              borderRadius: 3,
              background: "var(--accent)",
              transition: "width 0.4s ease",
              width: `${((idx + (result ? 1 : 0)) / session.length) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Quiz card */}
      {currentQ && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: 40,
            textAlign: "center",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <span
              style={{
                ...badge,
                background: "rgba(124,107,255,0.15)",
                color: "var(--accent3)",
              }}
            >
              {currentQ.mode === "vi2en"
                ? "🇻🇳 → 🇬🇧"
                : currentQ.mode === "en2vi"
                  ? "🇬🇧 → 🇻🇳"
                  : "🏷️ Loại từ"}
            </span>
            <span
              style={{
                color: "var(--text3)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
              }}
            >
              {idx + 1} / {session.length}
            </span>
            {streak >= 3 && (
              <span
                style={{
                  ...badge,
                  background: "rgba(251,191,36,0.15)",
                  color: "var(--yellow)",
                }}
              >
                🔥 {streak} liên tiếp
              </span>
            )}
          </div>

          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "var(--text)",
                letterSpacing: -0.5,
              }}
            >
              {currentQ.prompt}
            </span>
            {(currentQ.mode === "en2vi" || currentQ.mode === "type") && (
              <button
                onClick={() => speak(currentQ.prompt)}
                style={{
                  marginLeft: 12,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text3)",
                  verticalAlign: "middle",
                }}
              >
                <Volume2 size={20} />
              </button>
            )}
          </div>
          {currentQ.hint && (
            <p
              style={{
                color: "var(--text3)",
                fontSize: 14,
                marginBottom: 32,
                fontStyle: "italic",
              }}
            >
              {currentQ.hint}
            </p>
          )}

          {currentQ.isType ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setInput(t);
                  }}
                  disabled={result !== null}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "2px solid",
                    borderColor:
                      result !== null
                        ? t === currentQ.answer
                          ? "var(--green)"
                          : t === input
                            ? "var(--red)"
                            : "var(--border)"
                        : input === t
                          ? "var(--accent)"
                          : "var(--border)",
                    background:
                      result !== null
                        ? t === currentQ.answer
                          ? "rgba(74,222,128,0.15)"
                          : t === input && t !== currentQ.answer
                            ? "rgba(248,113,113,0.15)"
                            : "var(--bg3)"
                        : input === t
                          ? "rgba(124,107,255,0.15)"
                          : "var(--bg3)",
                    color:
                      result !== null
                        ? t === currentQ.answer
                          ? "var(--green)"
                          : t === input
                            ? "var(--red)"
                            : "var(--text3)"
                        : input === t
                          ? "var(--accent3)"
                          : "var(--text2)",
                    transition: "all 0.15s",
                  }}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          ) : (
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") result === null ? checkAnswer() : next();
              }}
              placeholder={`Nhập ${currentQ.answerLabel}...`}
              disabled={result !== null}
              style={{
                ...inputBig,
                borderColor:
                  result === "correct"
                    ? "var(--green)"
                    : result === "wrong"
                      ? "var(--red)"
                      : "var(--border2)",
                background:
                  result === "correct"
                    ? "rgba(74,222,128,0.08)"
                    : result === "wrong"
                      ? "rgba(248,113,113,0.08)"
                      : "var(--bg2)",
              }}
              autoFocus
            />
          )}

          {result === "wrong" && (
            <p style={{ marginTop: 12, color: "var(--red)", fontSize: 15 }}>
              ❌ Sai! Đáp án đúng:{" "}
              <strong
                style={{
                  color: "var(--green)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {currentQ.answer}
              </strong>
            </p>
          )}
          {result === "correct" && (
            <p style={{ marginTop: 12, color: "var(--green)", fontSize: 15 }}>
              ✅ Chính xác!
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              marginTop: 24,
            }}
          >
            {result === null ? (
              <button
                onClick={checkAnswer}
                disabled={!input.trim()}
                style={{ ...btnPrimary, opacity: !input.trim() ? 0.5 : 1 }}
              >
                Kiểm tra
              </button>
            ) : (
              <button onClick={next} style={btnPrimary}>
                {idx + 1 >= session.length ? "🏁 Xem kết quả" : "Tiếp theo"}{" "}
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mini stats */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={statCard}>
          <span
            style={{
              color: "var(--green)",
              fontWeight: 800,
              fontSize: 22,
              fontFamily: "var(--font-mono)",
            }}
          >
            {stats.correct}
          </span>
          <span style={{ color: "var(--text3)", fontSize: 12 }}>Đúng</span>
        </div>
        <div style={statCard}>
          <span
            style={{
              color: "var(--red)",
              fontWeight: 800,
              fontSize: 22,
              fontFamily: "var(--font-mono)",
            }}
          >
            {stats.wrong}
          </span>
          <span style={{ color: "var(--text3)", fontSize: 12 }}>Sai</span>
        </div>
        <div style={{ ...statCard, flex: 1 }}>
          <div
            style={{
              height: 6,
              background: "var(--bg3)",
              borderRadius: 3,
              width: "100%",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "var(--green)",
                borderRadius: 3,
                transition: "width 0.3s",
                width: `${stats.correct + stats.wrong > 0 ? (stats.correct / (stats.correct + stats.wrong)) * 100 : 0}%`,
              }}
            />
          </div>
          <span style={{ color: "var(--text3)", fontSize: 12 }}>
            {stats.correct + stats.wrong > 0
              ? Math.round(
                  (stats.correct / (stats.correct + stats.wrong)) * 100,
                )
              : 0}
            % chính xác
          </span>
        </div>
      </div>
    </div>
  );
}

const btnPrimary = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 28px",
  background: "var(--accent)",
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  transition: "opacity 0.2s",
};
const modeBtn = {
  padding: "8px 16px",
  background: "var(--bg3)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text2)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  transition: "all 0.15s",
  fontFamily: "var(--font-display)",
};
const modeBtnActive = {
  background: "rgba(124,107,255,0.2)",
  borderColor: "var(--accent)",
  color: "var(--accent3)",
};
const selectStyle = {
  background: "var(--bg3)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text)",
  padding: "6px 10px",
  fontSize: 13,
  fontFamily: "var(--font-display)",
};
const iconBtnSmall = {
  background: "var(--bg3)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text2)",
  padding: 7,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};
const inputBig = {
  width: "100%",
  maxWidth: 400,
  background: "var(--bg2)",
  border: "2px solid var(--border2)",
  borderRadius: 10,
  color: "var(--text)",
  padding: "14px 18px",
  fontSize: 18,
  outline: "none",
  textAlign: "center",
  fontFamily: "var(--font-mono)",
  transition: "border-color 0.2s",
};
const badge = {
  padding: "4px 12px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 700,
};
const statCard = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "14px 20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  minWidth: 80,
};
