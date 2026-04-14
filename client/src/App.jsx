
import { useState, useRef, useEffect } from "react";

const steps = ["companyName","website","description","founders","linkedin","attachments"];

const questions = {
  companyName: "Company name?",
  website: "Website URL?",
  description: "Brief description?",
  founders: "Founders?",
  linkedin: "Founders LinkedIn?",
  attachments: "Upload files"
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

  const sleep = ms => new Promise(r => setTimeout(r, ms));

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

      await sleep(700);

      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: questions[steps[next]] };
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

    Object.entries(form).forEach(([k,v]) => formData.append(k,v));
    files.forEach(f => formData.append("files", f));

    setIsLoading(true);

    setMessages(prev => [...prev, { role: "assistant", content: "Processing submission..." }]);

    await fetch("/api/pitch", { method: "POST", body: formData });

    await sleep(800);

    setMessages(prev => {
      const copy = [...prev];
      copy[copy.length - 1] = {
        role: "assistant",
        content: "? Pitch submitted successfully ??"
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
    <div style={{ display:"flex", gap:4, marginTop:6 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:"#6b7280", animation:"bounce 1.4s infinite" }} />
      <span style={{ width:6, height:6, borderRadius:"50%", background:"#6b7280", animation:"bounce 1.4s infinite 0.2s" }} />
      <span style={{ width:6, height:6, borderRadius:"50%", background:"#6b7280", animation:"bounce 1.4s infinite 0.4s" }} />
    </div>
  );

  return (
    <div style={{height:"100vh",background:"#f7f7f8",display:"flex",justifyContent:"center",alignItems:"center"}}>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
      `}</style>

      <div style={{width:440,height:"90vh",background:"#fff",borderRadius:16,border:"1px solid #e5e7eb",display:"flex",flexDirection:"column"}}>

        <div style={{padding:14,fontWeight:600,borderBottom:"1px solid #e5e7eb"}}>Cold Pitch Intake</div>

        <div style={{flex:1,padding:16,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
          {messages.map((m,i)=>(
            <div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",background:m.role==="user"?"#10a37f":"#ececf1",color:m.role==="user"?"#fff":"#111827",padding:10,borderRadius:12,maxWidth:"80%"}}>
              {m.content}
              {isLoading && i===messages.length-1 && m.role==="assistant" && <LoadingDots/>}
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>

        <div style={{padding:12,borderTop:"1px solid #e5e7eb",display:"flex",flexDirection:"column",gap:8}}>
          {steps[step]!=="attachments" ? (
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} disabled={isLoading} style={{padding:10,borderRadius:10,border:"1px solid #e5e7eb"}}/>
          ) : (
            <input type="file" multiple onChange={handleFiles}/>
          )}

          <button onClick={nextStep} disabled={isLoading} style={{padding:10,background:"#10a37f",color:"#fff",border:0,borderRadius:10}}>
            {step===steps.length-1?"Submit":"Next"}
          </button>
        </div>

      </div>
    </div>
  );
}