import { useState, useRef, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";

const steps = [
  "companyName",
  "website",
  "description",
  "foundersCount",
  "attachments"
];

const questions = {
  companyName: "What is your company name?",
  website: "What is your company's website URL?",
  description: "Please provide a brief description of your company.",
  foundersCount: "How many founders does your company have?",
  attachments: "Please upload your pitch deck."
};

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  // SPLASH
	const [showSplash, setShowSplash] = useState(true);
	const [splashDone, setSplashDone] = useState(false);
	const [splashProgress, setSplashProgress] = useState(0);

	const [appReady, setAppReady] = useState(false);

	const [loaded, setLoaded] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [typingIndex, setTypingIndex] = useState(null);
	
	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 768);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);
	const [step, setStep] = useState(0);
	const [input, setInput] = useState("");
	const [files, setFiles] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	const bottomRef = useRef(null);

	const [messages, setMessages] = useState([
	  { role: "assistant", content: "" },
	  { role: "assistant", content: "" }
	]);
	
	// =========================
	// SPLASH ANIMATION (Apple style)
	// =========================
	useEffect(() => {
		let progress = 0;

		const interval = setInterval(() => {
		  progress += Math.random() * 10 + 5;

		  if (progress >= 100) {
			progress = 100;
			clearInterval(interval);

			setTimeout(() => {
			  setSplashDone(true);

			  setTimeout(() => {
				setShowSplash(false);
				setTimeout(() => {
				  setAppReady(true);
				}, 50);
			  }, 600);
			}, 300);
		  }

		  setSplashProgress(progress);
		}, 120);

		return () => clearInterval(interval);
	}, []);
	// =========================
  // CARD ANIMATION SAFE MOUNT
  // =========================
  useEffect(() => {
    if (appReady) {
      const t = setTimeout(() => {
        setLoaded(true);
      }, 60);

      return () => clearTimeout(t);
    }
  }, [appReady]);
	// =========================
	// START CHAT AFTER SPLASH
	// =========================
	useEffect(() => {
		if (showSplash) return;

		setTimeout(() => {
			typeMessage("Welcome to Seedradar cold pitch intake — let’s collect your pitch.", 0);

			setTimeout(() => {
			  typeMessage(questions.companyName, 1);
			}, 1500);
		}, 1000);
	}, [showSplash]);
	

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
	const typeMessage = (text, index, speed = 15) => {
		  let i = 0;
		  setTypingIndex(index);

		  const interval = setInterval(() => {
			i++;

			setMessages((prev) => {
			  const copy = [...prev];
			  copy[index] = {
				...copy[index],
				content: text.slice(0, i)
			  };
			  return copy;
			});

			if (i >= text.length) {
			  clearInterval(interval);
			  setTypingIndex(null);
			}
		  }, speed);
	};

  // =========================
  // SPLASH SCREEN
  // =========================
  if (showSplash) {
    return (
      <div
        style={{
          ...styles.splash,
          opacity: splashDone ? 0 : 1,
          transition: "0.6s ease"
        }}
      >
        <div style={styles.splashCard}>
          <img
            src="/seedradar-logo.png"
            alt="logo"
            style={styles.splashLogo}
          />

          <div style={styles.loadingBar}>
            <div
              style={{
                ...styles.loadingFill,
                width: `${splashProgress}%`
              }}
            />
          </div>

          <div style={styles.loadingText}>
            Loading experience...
          </div>
        </div>
      </div>
    );
  }

  const nextStep = async () => {
		if (isSubmitted) return;
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
			setMessages((p) => {
				const updated = [...p, { role: "assistant", content: "" }];
				const index = updated.length - 1;

				setTimeout(() => {
				  typeMessage("Founder 1 name?", index);
				}, 50);

				return updated;
			});

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

				setMessages((p) => {
				  const updated = [...p, { role: "assistant", content: "" }];
				  const index = updated.length - 1;

				  setTimeout(() => {
					typeMessage("Upload your pitch deck.", index);
				  }, 50);

				  return updated;
				});

				return;
			}

			if (!isName) {
				setFounderIndex(nextIndex);
			}

			const text = isName
				? `Founder ${founderIndex + 1} LinkedIn?`
				: `Founder ${nextIndex + 1} name?`;
			setMessages((p) => {
				const updated = [...p, { role: "assistant", content: "" }];
				const index = updated.length - 1;

				setTimeout(() => {
				  typeMessage(text, index);
				}, 50);

				return updated;
			  });

			return;
		}

		// =========================
		// NORMAL FLOW
		// =========================
		if (key !== "attachments") {
			setForm((p) => ({ ...p, [key]: input }));
			setMessages((p) => [...p, { role: "user", content: input }]);

		}

		const next = step + 1;

		
		if (next < steps.length) {
			setIsLoading(true);
			

			await sleep(400);

			setMessages((p) => {
        const updated = [...p, { role: "assistant", content: "" }];
        const index = updated.length - 1;

        setTimeout(() => {
          typeMessage(questions[steps[next]], index);
        }, 300);

        return updated;
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

		setMessages((p) => {
		  const updated = [...p, { role: "assistant", content: "" }];
		  const index = updated.length - 1;

		  setTimeout(() => {
			typeMessage("Submitting...", index);
		  }, 50);

		  return updated;
		});

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
				const updated = [...p, { role: "assistant", content: "" }];
				const index = updated.length - 1;

				setTimeout(() => {
				  typeMessage("✅ Successfully submitted 🚀", index);
				}, 50);

				return updated;
			});
			 // SUMMARY
			setTimeout(() => {
				const summary = `
📋 Summary

Company: ${form.companyName}
Website: ${form.website}
Brief Description: ${form.description}

Founders:
${founders
  .map((f, i) => `${i + 1}. ${f.name} (${f.linkedin})`)
  .join("\n")}

Files: ${files.length} uploaded
					`;

				setMessages((p) => {
				  const updated = [...p, { role: "assistant", content: "" }];
				  const index = updated.length - 1;
				  setTimeout(() => typeMessage(summary, index), 50);
				  return updated;
				});
			}, 800);
			setIsSubmitted(true);
		} catch (err) {
			setMessages((p) => {
				const updated = [...p, { role: "assistant", content: "" }];
				const index = updated.length - 1;

				setTimeout(() => {
				  typeMessage("❌ Submission failed. Please try again.", index);
				}, 50);

				return updated;
			});
		}

		setIsLoading(false);
		
	};

	const handleFiles = (e) => setFiles(Array.from(e.target.files));

	const handleKey = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!isLoading && !isSubmitted) nextStep();
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

  // =========================
  // UI
  // =========================
  return (
		<div style={styles.page}>
			<Analytics />
			<div style={styles.card(isMobile, loaded)}>

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
				{/* PROGRESS BAR */}
				<ProgressBar />
				{/* INPUT */}
				<div style={styles.inputArea}>
				{steps[step] !== "attachments" ? (
				<textarea
				  value={input}
				  onChange={(e) => setInput(e.target.value)}
				  onKeyDown={handleKey}
				  style={styles.input}
				  disabled={isSubmitted}
				/>
				) : (
				<div
					  style={styles.uploadBox}
					  onDragOver={(e) => e.preventDefault()}
					  onDrop={(e) => {
						e.preventDefault();
						setFiles(Array.from(e.dataTransfer.files));
					  }}
					>
					  <input
						  type="file"
						  multiple
						  accept="application/pdf"
						  onChange={handleFiles}
						  style={styles.hiddenInput}
						  id="fileUpload"
						  disabled={isSubmitted}
						/>

					  <label htmlFor="fileUpload" style={styles.uploadLabel}>
						<div style={styles.uploadIcon}>📎</div>

						<div style={styles.uploadText}>
						  <b>Upload your pitch deck</b>
						  <div style={styles.uploadSub}>
							Drag & drop PDF files here or click to browse
						  </div>
						</div>
					  </label>

					  {files.length > 0 && (
						<div style={styles.filePreview}>
						  {files.map((f, i) => (
							<div key={i} style={styles.fileItem}>
							  📄 {f.name}
							</div>
						  ))}
						</div>
					  )}
					</div>
				)}

				<button
				  onClick={nextStep}
				  style={{
					...styles.button,
					opacity: isSubmitted ? 0.6 : 1,
					cursor: isSubmitted ? "not-allowed" : "pointer"
				  }}
				  disabled={isSubmitted}
				>
				{step === steps.length - 1 ? "Submit" : "Next"}
				</button>
				</div>

			</div>
		</div>
	);
}

// =========================
// STYLES
// =========================
const styles = {
  page: {
		height: "100vh",
		width: "100%",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		fontFamily: "Inter, system-ui, sans-serif",
		background: "linear-gradient(135deg, #f5f7fb, #eef2f7)"
	},

	card: (isMobile, loaded) => ({
		opacity: loaded ? 1 : 0,
		transform: loaded
		  ? "translate3d(0,0,0)"
		  : "translate3d(0,40px,0)",
		transition: "opacity 0.9s ease, transform 0.9s ease",
		width: isMobile ? "100%" : 460,
		height: isMobile ? "100vh" : "92vh",
		background: "#fff",
		display: "flex",
		flexDirection: "column",
		borderRadius: 20,
		overflow: "hidden",
		boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
		willChange: "transform, opacity"
	}),

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
	},
	uploadBox: {
		border: "2px dashed #d1d5db",
		borderRadius: 14,
		padding: 16,
		background: "#f9fafb",
		textAlign: "center",
		cursor: "pointer",
		transition: "all 0.2s ease",
		position: "relative"
	},

	uploadLabel: {
		cursor: "pointer",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: 6
	},

	uploadIcon: {
		fontSize: 24
	},

	uploadText: {
		fontSize: 13,
		color: "#111827"
	},

	uploadSub: {
		fontSize: 11,
		color: "#6b7280"
	},

	hiddenInput: {
		display: "none"
	},

	filePreview: {
		marginTop: 12,
		display: "flex",
		flexDirection: "column",
		gap: 6,
		textAlign: "left"
	},

	fileItem: {
		fontSize: 12,
		padding: "6px 10px",
		borderRadius: 8,
		background: "#fff",
		border: "1px solid #e5e7eb"
	},

  // SPLASH (Apple-style)
  splash: {
    height: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(10,10,20,0.85)",
    backdropFilter: "blur(18px)"
  },

  splashCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: 30,
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)"
  },

  splashLogo: {
    width: 140,
    filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.4))"
  },

  loadingBar: {
    width: 200,
    height: 4,
    background: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    overflow: "hidden"
  },

  loadingFill: {
    height: "100%",
    background: "linear-gradient(90deg, #10a37f, #34d399)",
    transition: "width 0.2s ease"
  },

  loadingText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)"
  }
};
