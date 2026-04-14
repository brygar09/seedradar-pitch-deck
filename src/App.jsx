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
    const formData = new FormData();

    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    files.forEach(f => formData.append("files", f));

    setIsLoading(true);
    setMessages(prev => [...prev, { role: "assistant", content: "Processing submission..." }]);

    await fetch("/api/pitch", {
      method: "POST",
      body: formData
    });

    await sleep(800);

    setMessages(prev => {
      const copy = [...prev];
      copy[copy.length - 1] = {
        role: "assistant",
        content: "✅ Pitch submitted successfully 🚀"
      };
      return copy;
    });

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

        <div style={styles.header}>Seed Radar - Cold Pitch Intake</div>

        <div style={styles.chat}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.msg,
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "#10a37f" : "#ececf1",
                color: m.role === "user" ? "#fff" : "#111827"
              }}
            >
              {m.content}
              {isLoading && i === messages.length - 1 && m.role === "assistant" && (
                <LoadingDots />
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        <div style={styles.inputArea}>
          {steps[step] !== "attachments" ? (
            <textarea
              style={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={isLoading}
            />
          ) : (
            <input type="file" multiple onChange={handleFiles} />
          )}

          <button style={styles.button} onClick={nextStep} disabled={isLoading}>
            {step === steps.length - 1 ? "Submit" : "Next"}
          </button>
        </div>

      </div>
    </div>
  );
}


const styles = {
  page: {
    height: "100vh",
    background: "#f7f7f8",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial"
  },
  card: {
    width: 440,
    height: "90vh",
    background: "#fff",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #e5e7eb"
  },
  header: {
    padding: 14,
    fontWeight: 600,
    borderBottom: "1px solid #e5e7eb"
  },
  chat: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  msg: {
    padding: 10,
    borderRadius: 12,
    maxWidth: "80%",
    fontSize: 14,
    whiteSpace: "pre-wrap"
  },
  inputArea: {
    padding: 12,
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  input: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #e5e7eb"
  },
  button: {
    padding: 10,
    background: "#10a37f",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer"
  },
  dots: {
    marginLeft: 6,
    animation: "blink 1s infinite"
  }
};
