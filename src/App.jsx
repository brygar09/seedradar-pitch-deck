import { useState, useRef, useEffect } from "react";

const steps = [
  "companyName",
  "website",
  "description",
  "founders",
  "linkedin",
  "attachments"
];

const questions = {
  companyName: "What is your Company name?",
  website: "What is your company's Website URL?",
  description: "Provide Brief description of your company",
  founders: "Who are the Founders?",
  linkedin: "Provide Founders LinkedIn Profile",
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
    description: "",
    founders: "",
    linkedin: ""
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  const nextStep = async () => {
    const key = steps[step];

    if (key !== "attachments") {
      setForm(prev => ({ ...prev, [key]: input }));
    }

    const next = step + 1;

    if (next < steps.length) {
      setMessages(prev => [...prev, { role: "user", content: input }]);

      setIsLoading(true);
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      await sleep(800);

      setMessages(prev => {
        const copy = [...prev];
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

const submit = async () => {
  const payload = {
    ...form,
    attachments: files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    })),
    submittedAt: new Date().toISOString()
  };

  setIsLoading(true);

  setMessages((p) => [
    ...p,
    { role: "assistant", content: "Submitting to system..." }
  ]);

  try {
    const res = await fetch(
      "https://hook.us2.make.com/pwv97ctf3lauprqry0hwgykmedyiy2uo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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

  const handleFiles = e => setFiles(Array.from(e.target.files));

  const handleKey = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) nextStep();
    }
  };

    const LoadingDots = () => (
    <div style={styles.loadingDots}>
      <span style={{ ...styles.dot, animationDelay: "0s" }} />
      <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
      <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
    </div>
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

        {/* CHAT */}
        <div style={styles.chat}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.msg,
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background:
                  m.role === "user"
                    ? "linear-gradient(135deg, #10a37f, #0e8f6f)"
                    : "#ffffff",
                color: m.role === "user" ? "#fff" : "#111827",
                border:
                  m.role === "user"
                    ? "none"
                    : "1px solid rgba(0,0,0,0.06)"
              }}
            >
              {m.content}

              {isLoading &&
                i === messages.length - 1 &&
                m.role === "assistant" && (
                  <div style={styles.dots}>
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div style={styles.inputArea}>
          {steps[step] !== "attachments" ? (
            <textarea
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={isLoading}
              placeholder="Type your answer..."
            />
          ) : (
            <input type="file" multiple onChange={handleFiles} />
          )}

          <button
            style={styles.button}
            onClick={nextStep}
            disabled={isLoading}
          >
            {step === steps.length - 1 ? "Submit Pitch" : "Continue"}
          </button>
        </div>

      </div>
    </div>
  );
}

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
  }
};
