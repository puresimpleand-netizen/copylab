import { useState } from "react";

const COPY_TYPES = [
  { value: "headline", label: "Headline" },
  { value: "tagline", label: "Tagline" },
  { value: "cta", label: "CTA" },
  { value: "social_caption", label: "Social Caption" },
  { value: "product_description", label: "Product Description" },
  { value: "onboarding_message", label: "Onboarding / Welcome" },
  { value: "push_notification", label: "Push Notification" },
  { value: "email_subject", label: "Email Subject Line" },
  { value: "tooltip", label: "Tooltip / Microcopy" },
  { value: "error_message", label: "Error Message" },
  { value: "empty_state", label: "Empty State" },
];

const TONE_TAGS = [
  "Confident", "Playful", "Direct", "Warm",
  "Premium", "Minimal", "Urgent", "Conversational",
  "Bold", "Empowering", "Witty", "Grounded",
];

const API_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  const clean = text.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(clean);
}

function Tag({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px",
      borderRadius: 20,
      border: `1.5px solid ${active ? "#C8401A" : "#DEDAD3"}`,
      background: active ? "#C8401A" : "transparent",
      color: active ? "#FFF" : "#7A7570",
      cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 12,
      fontWeight: 500,
      transition: "all 0.15s",
      lineHeight: 1,
    }}>
      {label}
    </button>
  );
}

function ScoreBar({ label, score, note }) {
  const color = score >= 80 ? "#1E7A48" : score >= 60 ? "#C07820" : "#C0392B";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1915", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.01em" }}>
          {label}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color, background: color + "15", border: `1px solid ${color}25`, borderRadius: 3, padding: "1px 6px" }}>
          {score}
        </span>
      </div>
      <div style={{ height: 3, background: "#E8E3DB", borderRadius: 2, marginBottom: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 2 }} />
      </div>
      <p style={{ fontSize: 11, color: "#8A8580", margin: 0, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{note}</p>
    </div>
  );
}

function Pill({ type, children }) {
  const styles = {
    flag: { bg: "#FFF0EC", border: "#C8401A25", text: "#A63315", dot: "#C8401A" },
    fix: { bg: "#F0FBF5", border: "#1E7A4820", text: "#1A5C38", dot: "#1E7A48" },
  };
  const s = styles[type];
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 12px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, marginBottom: 6 }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, marginTop: 5, flexShrink: 0 }} />
      <p style={{ fontSize: 12, color: s.text, fontFamily: "'DM Sans', sans-serif", margin: 0, lineHeight: 1.55 }}>{children}</p>
    </div>
  );
}

export default function CopyLab() {
  const [mode, setMode] = useState("generate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedV, setSelectedV] = useState(0);
  const [copied, setCopied] = useState(null);

  const [brief, setBrief] = useState("");
  const [copyType, setCopyType] = useState("headline");
  const [tones, setTones] = useState([]);

  const [inputCopy, setInputCopy] = useState("");
  const [context, setContext] = useState("");
  const [analyzeFormat, setAnalyzeFormat] = useState("headline");

  const toggleTone = t => setTones(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const sys = `You are a senior UX copywriter and brand strategist. You write for digital products targeting Millennials and Gen Z. Three non-negotiables:
1. Catchy but clear — the hook must never sacrifice comprehension
2. Bold but not cheesy — confidence without cringe or hype
3. Meaningful but not abstract — real value, not vague aspiration
Return ONLY valid JSON. No markdown, no preamble, no trailing text.`;
      const usr = `Write 3 distinct variants of ${copyType.replace(/_/g, " ")} copy for this brief: "${brief}"
Tone direction: ${tones.length ? tones.join(", ") : "balanced and on-brand"}

Return this exact JSON shape:
{
  "variants": [
    {
      "copy": "the copy string",
      "angle": "2-3 word strategic label",
      "rationale": "why this approach works (1-2 sentences, specific)",
      "strength": "what makes this land (1 sentence)",
      "watch_out": "one honest limitation or risk"
    }
  ]
}`;
      const data = await callClaude(sys, usr);
      setResult({ type: "generate", ...data });
      setSelectedV(0);
    } catch {
      setError("Generation failed. Check your brief and try again.");
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!inputCopy.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const sys = `You are a senior UX copy strategist and editorial director. You review copy for digital products targeting Millennials and Gen Z. Be precise, direct, and specific — no vague praise, no softening. Your job is to reduce revision cycles by giving accurate, reliable feedback.
Return ONLY valid JSON. No markdown, no preamble, no trailing text.`;
      const usr = `Review this ${analyzeFormat.replace(/_/g, " ")} copy: "${inputCopy}"
${context ? `Context: ${context}` : ""}

Score against 5 criteria. Be rigorous. Scores above 85 should only go to genuinely strong work.
1. Clarity — Immediately understood? Does complexity earn its place?
2. Brand Voice — Confident, human, relevant? Not cheesy or abstract?
3. Audience Fit — Will Millennials/Gen Z connect? Does it feel current?
4. Accuracy — Any vague, misleading, or unsubstantiated claims?
5. Structure — Length, rhythm, word choice, format appropriateness?

Return this exact JSON:
{
  "verdict": "one sharp sentence — direct, specific, no hedging",
  "overall_score": 78,
  "scores": {
    "clarity": { "score": 80, "note": "specific observation" },
    "brand_voice": { "score": 75, "note": "specific observation" },
    "audience_fit": { "score": 82, "note": "specific observation" },
    "accuracy": { "score": 85, "note": "specific observation" },
    "structure": { "score": 70, "note": "specific observation" }
  },
  "flags": ["specific problem 1", "specific problem 2"],
  "improvements": ["concrete rewrite suggestion 1", "concrete suggestion 2"],
  "rewrite": "a sharper version, or null if copy is already strong"
}`;
      const data = await callClaude(sys, usr);
      setResult({ type: "analyze", ...data });
    } catch {
      setError("Analysis failed. Make sure there's copy in the field and try again.");
    }
    setLoading(false);
  };

  const inputBase = {
    width: "100%",
    padding: "11px 13px",
    background: "#F9F7F3",
    border: "1.5px solid #E0DBD2",
    borderRadius: 7,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "#1C1915",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.55,
  };

  const labelStyle = {
    display: "block",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#9A9590",
    marginBottom: 7,
  };

  const scoreColor = s => s >= 80 ? "#1E7A48" : s >= 60 ? "#C07820" : "#C0392B";
  const scoreLabel = s => s >= 80 ? "Strong" : s >= 65 ? "Needs work" : "Weak";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cl-mode:hover { background: #EDEBE5 !important; }
        .cl-mode.on { background: #1C1915 !important; color: #F5F2EC !important; }
        .cl-btn:hover:not(:disabled) { background: #A83412 !important; transform: translateY(-1px); }
        .cl-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }
        .cl-input:focus { border-color: #C8401A !important; }
        .cl-vcard { cursor: pointer; transition: border-color 0.15s; }
        .cl-vcard:hover { border-color: #C8401A !important; }
        .cl-vcard.sel { border-color: #C8401A !important; background: #FFF8F6 !important; }
        .cl-copy:hover { background: #EDEBE5 !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #CEC9C0; border-radius: 2px; }
        @keyframes pop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%,100% { opacity:0.3; } 50% { opacity:1; } }
        .cl-fade { animation: pop 0.35s ease; }
        .cl-dot { animation: blink 1.2s ease-in-out infinite; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#F2EFE9", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <header style={{ height: 60, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1.5px solid #DDD9D0", background: "#F2EFE9", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "#1C1915", letterSpacing: "-0.5px" }}>copy/lab</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#C8401A", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 6px", border: "1px solid #C8401A30", borderRadius: 3, background: "#FFF0EC" }}>beta</span>
          </div>

          <div style={{ display: "flex", background: "#E8E4DC", borderRadius: 7, padding: 3, gap: 2 }}>
            {["generate", "analyze"].map(m => (
              <button key={m} className={`cl-mode ${mode === m ? "on" : ""}`} onClick={() => { setMode(m); setResult(null); setError(null); }}
                style={{ padding: "7px 18px", borderRadius: 5, border: "none", cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.03em", background: "transparent", color: "#7A7570", transition: "all 0.15s" }}>
                {m === "generate" ? "Generate" : "Analyze"}
              </button>
            ))}
          </div>

          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#B0ABA4", letterSpacing: "0.05em" }}>Millennials · Gen Z</span>
        </header>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "400px 1fr", overflow: "hidden" }}>

          {/* Left — Controls */}
          <div style={{ borderRight: "1.5px solid #DDD9D0", padding: "24px 24px 24px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

            {mode === "generate" ? (
              <>
                <div>
                  <label style={labelStyle}>Copy Type</label>
                  <select className="cl-input" value={copyType} onChange={e => setCopyType(e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
                    {COPY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Brief</label>
                  <textarea className="cl-input" value={brief} onChange={e => setBrief(e.target.value)} rows={6}
                    placeholder="What are you writing? Be specific — product, feature, campaign moment, placement, goal. The more context you give, the stronger the variants."
                    style={{ ...inputBase, resize: "vertical" }} />
                </div>

                <div>
                  <label style={labelStyle}>Tone <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", color: "#B0ABA4" }}>(pick any)</span></label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {TONE_TAGS.map(t => <Tag key={t} label={t} active={tones.includes(t)} onClick={() => toggleTone(t)} />)}
                  </div>
                </div>

                <button className="cl-btn" onClick={handleGenerate} disabled={loading || !brief.trim()}
                  style={{ padding: "13px", background: "#C8401A", color: "#FFF", border: "none", borderRadius: 7, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", cursor: "pointer", transition: "all 0.15s", marginTop: "auto" }}>
                  {loading ? "Generating…" : "Generate 3 variants →"}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>Format</label>
                  <select className="cl-input" value={analyzeFormat} onChange={e => setAnalyzeFormat(e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
                    {COPY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Copy to Analyze</label>
                  <textarea className="cl-input" value={inputCopy} onChange={e => setInputCopy(e.target.value)} rows={5}
                    placeholder="Paste the copy here."
                    style={{ ...inputBase, resize: "vertical" }} />
                </div>

                <div>
                  <label style={labelStyle}>Context <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", color: "#B0ABA4" }}>(optional but recommended)</span></label>
                  <textarea className="cl-input" value={context} onChange={e => setContext(e.target.value)} rows={3}
                    placeholder="Campaign goal, page placement, product context, feedback already received, or constraints to consider."
                    style={{ ...inputBase, resize: "vertical" }} />
                </div>

                <button className="cl-btn" onClick={handleAnalyze} disabled={loading || !inputCopy.trim()}
                  style={{ padding: "13px", background: "#C8401A", color: "#FFF", border: "none", borderRadius: 7, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", cursor: "pointer", transition: "all 0.15s", marginTop: "auto" }}>
                  {loading ? "Analyzing…" : "Run Analysis →"}
                </button>
              </>
            )}

            {/* Tip */}
            <div style={{ padding: "11px 13px", background: "#EAE7E0", borderRadius: 6 }}>
              <p style={{ fontSize: 11, color: "#8A8580", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                {mode === "generate"
                  ? "Produces 3 strategically distinct variants with angle, rationale, strength, and risk — not just 3 takes on the same idea."
                  : "Scores 5 dimensions independently. Flags factual/accuracy issues, vague claims, and structural problems with specific rewrite guidance."}
              </p>
            </div>
          </div>

          {/* Right — Results */}
          <div style={{ overflowY: "auto", padding: "24px 28px" }}>

            {/* Loading */}
            {loading && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0,1,2].map(i => (
                    <div key={i} className="cl-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#C8401A", animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#A0998F", fontSize: 12 }}>
                  {mode === "generate" ? "Crafting 3 strategic variants…" : "Running full copy audit…"}
                </p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div style={{ padding: "14px 18px", background: "#FFF0EC", border: "1.5px solid #C8401A30", borderRadius: 7, color: "#A63315", fontSize: 12, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            {/* Empty state */}
            {!loading && !result && !error && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#E8E4DC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {mode === "generate" ? "✦" : "◎"}
                </div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#9A9590" }}>
                  {mode === "generate" ? "Variants will appear here." : "Analysis will appear here."}
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#B5B0A8", maxWidth: 240, lineHeight: 1.6 }}>
                  {mode === "generate" ? "Fill in the brief on the left, then hit Generate." : "Paste copy on the left, then hit Run Analysis."}
                </p>
              </div>
            )}

            {/* ── GENERATE RESULTS ── */}
            {!loading && result?.type === "generate" && (
              <div className="cl-fade">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#1C1915", letterSpacing: "-0.3px" }}>3 Variants</h2>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9A9590", letterSpacing: "0.05em" }}>
                    {COPY_TYPES.find(t => t.value === copyType)?.label?.toUpperCase()}
                  </span>
                </div>

                {/* Variant tabs */}
                <div style={{ display: "flex", gap: 5, marginBottom: 18 }}>
                  {result.variants?.map((v, i) => (
                    <button key={i} onClick={() => setSelectedV(i)}
                      style={{ flex: 1, padding: "8px 10px", background: selectedV === i ? "#1C1915" : "#E8E4DC", color: selectedV === i ? "#F5F2EC" : "#7A7570", border: "none", borderRadius: 5, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.angle || `V${i + 1}`}
                    </button>
                  ))}
                </div>

                {/* Variant detail */}
                {result.variants?.[selectedV] && (() => {
                  const v = result.variants[selectedV];
                  return (
                    <div key={selectedV}>
                      {/* Copy display */}
                      <div style={{ background: "#FFF", border: "1.5px solid #DDD9D0", borderRadius: 10, padding: "24px 20px 20px", marginBottom: 12, position: "relative" }}>
                        <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, color: "#1C1915", lineHeight: 1.2, letterSpacing: "-0.5px", paddingRight: 60 }}>
                          "{v.copy}"
                        </p>
                        <button className="cl-copy" onClick={() => handleCopy(v.copy, "main")}
                          style={{ position: "absolute", top: 14, right: 14, padding: "5px 10px", background: "#F2EFE9", border: "1px solid #DDD9D0", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 10, color: copied === "main" ? "#1E7A48" : "#9A9590", transition: "all 0.15s" }}>
                          {copied === "main" ? "✓ Copied" : "Copy"}
                        </button>
                      </div>

                      {/* Insight grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        <div style={{ padding: "13px 15px", background: "#F0FBF5", border: "1px solid #1E7A4820", borderRadius: 7 }}>
                          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1E7A48", marginBottom: 5 }}>What lands</p>
                          <p style={{ fontSize: 12, color: "#1A5C38", lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>{v.strength}</p>
                        </div>
                        <div style={{ padding: "13px 15px", background: "#FFF8F0", border: "1px solid #C0782020", borderRadius: 7 }}>
                          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C07820", marginBottom: 5 }}>Watch out</p>
                          <p style={{ fontSize: 12, color: "#7A4E10", lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif" }}>{v.watch_out}</p>
                        </div>
                      </div>

                      <div style={{ padding: "13px 15px", background: "#F7F5F0", border: "1px solid #DDD9D0", borderRadius: 7 }}>
                        <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9A9590", marginBottom: 5 }}>Strategy</p>
                        <p style={{ fontSize: 12, color: "#3A3730", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{v.rationale}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── ANALYZE RESULTS ── */}
            {!loading && result?.type === "analyze" && (
              <div className="cl-fade">
                {/* Verdict card */}
                <div style={{ padding: "18px 20px", background: "#1C1915", borderRadius: 10, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C8401A" }}>Verdict</p>
                    <div style={{ flex: 1, height: 1, background: "#333" }} />
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
                      color: scoreColor(result.overall_score),
                      background: scoreColor(result.overall_score) + "25",
                      border: `1px solid ${scoreColor(result.overall_score)}30`,
                      borderRadius: 4, padding: "2px 8px"
                    }}>
                      {scoreLabel(result.overall_score)}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: "#F5F2EC", lineHeight: 1.4, marginBottom: 12 }}>
                    {result.verdict}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 30, fontWeight: 500, color: scoreColor(result.overall_score) }}>
                      {result.overall_score}
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#5A5550" }}>/100</span>
                  </div>
                </div>

                {/* Scorecard */}
                <div style={{ background: "#FFF", border: "1.5px solid #DDD9D0", borderRadius: 10, padding: "18px 20px", marginBottom: 12 }}>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9A9590", marginBottom: 14 }}>Scorecard</p>
                  {result.scores && Object.entries(result.scores).map(([key, val]) => (
                    <ScoreBar key={key} label={key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} score={val.score} note={val.note} />
                  ))}
                </div>

                {/* Flags */}
                {result.flags?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C8401A", marginBottom: 8 }}>⚑ Flags</p>
                    {result.flags.map((f, i) => <Pill key={i} type="flag">{f}</Pill>)}
                  </div>
                )}

                {/* Improvements */}
                {result.improvements?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1E7A48", marginBottom: 8 }}>↑ Improvements</p>
                    {result.improvements.map((imp, i) => <Pill key={i} type="fix">{imp}</Pill>)}
                  </div>
                )}

                {/* Rewrite */}
                {result.rewrite && (
                  <div style={{ padding: "16px 18px", background: "#FFF", border: "1.5px solid #C8401A25", borderRadius: 8, position: "relative" }}>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9A9590", marginBottom: 10 }}>✦ Suggested rewrite</p>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: "#1C1915", lineHeight: 1.25, letterSpacing: "-0.3px", paddingRight: 60 }}>
                      "{result.rewrite}"
                    </p>
                    <button className="cl-copy" onClick={() => handleCopy(result.rewrite, "rewrite")}
                      style={{ position: "absolute", top: 14, right: 14, padding: "5px 10px", background: "#F2EFE9", border: "1px solid #DDD9D0", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 10, color: copied === "rewrite" ? "#1E7A48" : "#9A9590", transition: "all 0.15s" }}>
                      {copied === "rewrite" ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
