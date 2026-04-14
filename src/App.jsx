import { useState, useRef, useEffect } from "react";

const steps = [
  "companyName",
  "website",
  "description",
  "foundersCount",
  "attachments"
];

const questions = {
  companyName: "What is your Company name?",
  website: "What is your company's Website URL?",
  description: "Provide brief description of your company",
  foundersCount: "How many founders are there?",
  attachments: "Upload deck"
};

export default function App() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome — let’s collect your pitch." },
    { role: "assistant", content: questions.companyName }
  ]);

  const [form, setForm] = useState({
    companyName: "",
    website: "",
    description: ""
  });

  // =========================
  // FOUNDERS STATE
  // =========================
  const [founderMode, setFounderMode] = useState(false);
  const [founderCount, setFounderCount] = useState(0);
  const [founders, setFounders] = useState([]);
  const [founderIndex, setFounderIndex] = useState(0);
  const [founderPhase, setFounderPhase] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // =========================
  // PROGRESS CALC
  // =========================
  const currentFounderNumber = founderIndex + 1;
  const totalFounders = founderCount || 1;

  const progressPercent = founderMode
    ? Math.min(
        100,
        Math.round((currentFounderNumber / totalFounders) * 100)
      )
    : 0;

  // =========================
  // MAIN FLOW
  // =========================
  const nextStep = async () => {
    const key = steps[step];

    // =========================
    // START FOUNDERS FLOW
    // =========================
    if (key === "foundersCount" && !founderMode) {
      const count = parseInt(input);

      if (!count || count <= 0) return;

      setMessages((p) => [...p, { role: "user", content: input }]);

      setFounderMode(true);
      setFounderCount(count);
      setFounders([]);
      setFounderIndex(0);
      setFounderPhase("name");

      setInput("");

      setTimeout(() => {
        setMessages((p) => [
          ...p,
          { role: "assistant", content: "Founder 1 name?" }
        ]);
      }, 300);

      return;
    }

    // =========================
    // FOUNDERS FLOW
    // =========================
    if (founderMode) {
      if (!input || input.trim() === "") return;

      const updated = [...founders];

      const isName = founderPhase === "name";

      setMessages((p) => [...p, { role: "user", content: input }]);

      if (isName) {
        updated.push({ name: input.trim(), linkedin: "" });
        setFounderPhase("linkedin");
      } else {
        updated[founderIndex].linkedin = input.trim();
        setFounderPhase("name");
      }

      setFounders(updated);
      setInput("");

      const nextIndex =
        isName ? founderIndex : founderIndex + 1;

      // DONE
      if (nextIndex >= founderCount && !isName) {
        setFounderMode(false);
        setFounderPhase(null);

        setStep(steps.indexOf("attachments"));

        setTimeout(() => {
          setMessages((p) => [
            ...p,
            { role: "assistant", content: "Upload deck" }
          ]);
        }, 300);

        return;
      }

      if (!isName) {
        setFounderIndex(nextIndex);
      }

      setTimeout(() => {
        setMessages((p) => [
          ...p,
          {
            role: "assistant",
            content: isName
              ? `Founder ${founderIndex + 1} LinkedIn?`
              : `Founder ${nextIndex + 1} name?`
          }
        ]);
      }, 300);

      return;
    }

    // =========================
    // NORMAL FLOW
    // =========================
    if (key !== "attachments") {
      setForm((p) => ({ ...p, [key]: input }));
    }

    const next = step + 1;

    setMessages((p) => [...p, { role: "user", content: input }]);

    if (next < steps.length) {
      setIsLoading(true);
      setMessages((p) => [...p, { role: "assistant", content: "..." }]);

      await sleep(400);

      setMessages((p) => {
        const copy = [...p];
        copy[copy.length - 1] = {
          role: "assistant",
          content: questions[steps[next]]
        };
        return copy;
      });

      setIsLoading(false);
      setStep(next);
      setInput("");
    } else {
      await submit();
    }
  };

  // =========================
  // SUBMIT
  // =========================
  const submit = async () => {
    const payload = new FormData();

  // text fields
  payload.append("companyName", form.companyName);
  payload.append("website", form.website);
  payload.append("description", form.description);
  payload.append("founders", JSON.stringify(founders));
  payload.append("submittedAt", new Date().toISOString());

  // files (REAL UPLOAD)
  files.forEach((file, index) => {
    payload.append(`filesAttachment`, file); // same key = array in Make.com
  });
    setIsLoading(true);

    setMessages((p) => [
      ...p,
      { role: "assistant", content: "Submitting..." }
    ]);

    try {
    const res = await fetch(
      "https://hook.us2.make.com/pwv97ctf3lauprqry0hwgykmedyiy2uo",
      {
        method: "POST",
        body: payload
      }
    );

    if (!res.ok) throw new Error("Webhook failed");

    setMessages((p) => {
      const copy = [...p];
      copy[copy.length - 1] = {
        role: "assistant",
        content: "✅ Successfully submitted 🚀"
      };
      return copy;
    });
  } catch (err) {
    setMessages((p) => {
      const copy = [...p];
      copy[copy.length - 1] = {
        role: "assistant",
        content: "❌ Submission failed. Please try again."
      };
      return copy;
    });
  }

    setIsLoading(false);
  };

  const handleFiles = (e) => setFiles(Array.from(e.target.files));

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) nextStep();
    }
  };

  // =========================
  // PROGRESS BAR UI
  // =========================
  const ProgressBar = () => (
    founderMode && (
      <div style={styles.progressWrap}>
        <div style={styles.progressText}>
          Founder {currentFounderNumber} of {founderCount}
        </div>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progressPercent}%`
            }}
          />
        </div>
      </div>
    )
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* HEADER */}
        <div style={{...styles.header, 
			  padding: 14,
			  borderBottom: "1px solid #eee",
			  display: "flex",
			  alignItems: "center",
			  gap: 10,
			  fontWeight: 600,
			  backgroundColor: "rgb(62, 64, 81)",
			  color: "white"
			}}>
          <img
            src="/seedradar-logo.png"
            alt="logo"
            style={{ width: 140, objectFit: "contain" }}
          />
          <span style={{ opacity: 0.7, fontSize: 15 }}>
            Cold Pitch Intake
          </span>
        </div>

        {/* PROGRESS BAR */}
        <ProgressBar />

        {/* CHAT */}
        <div style={styles.chat}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.msg,
                alignSelf:
                  m.role === "user" ? "flex-end" : "flex-start",
                background:
                  m.role === "user" ? "#10a37f" : "#fff",
                color: m.role === "user" ? "#fff" : "#111",
                border:
                  m.role === "assistant"
                    ? "1px solid #eee"
                    : "none"
              }}
            >
              {m.content}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div style={styles.inputArea}>
          {steps[step] !== "attachments" ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              style={styles.input}
            />
          ) : (
            <input type="file" multiple onChange={handleFiles} />
          )}

          <button onClick={nextStep} style={styles.button}>
            {step === steps.length - 1 ? "Submit" : "Next"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const styles = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Inter, system-ui, sans-serif",
    background: "linear-gradient(135deg, #f5f7fb, #eef2f7)"
  },

  card: {
    width: 460,
    height: "92vh",
    background: "#ffffff",
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)"
  },

  chat: {
    flex: 1,
    padding: 18,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: "#fafbfc"
  },

  msg: {
    padding: "12px 14px",
    borderRadius: 14,
    maxWidth: "78%",
    fontSize: 14,
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
  },

  inputArea: {
    padding: 14,
    borderTop: "1px solid rgba(0,0,0,0.06)",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  input: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    transition: "all 0.2s",
    resize: "none"
  },

  button: {
    padding: 12,
    background: "linear-gradient(135deg, #10a37f, #0e8f6f)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.2s",
    boxShadow: "0 6px 18px rgba(16,163,127,0.25)"
  },

  // PROGRESS BAR
  progressWrap: {
    padding: "10px 12px",
    borderBottom: "1px solid #eee"
  },

  progressText: {
    fontSize: 12,
    marginBottom: 6,
    color: "#555"
  },

  progressBar: {
    height: 6,
    background: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    background: "#10a37f",
    transition: "width 0.3s ease"
  }
};
