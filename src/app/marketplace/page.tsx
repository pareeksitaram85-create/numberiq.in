"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { 
  FileSpreadsheet, 
  ShoppingBag, 
  Upload, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Settings, 
  Key, 
  ChevronRight, 
  Trash2, 
  Loader2,
  Building2,
  FileCheck2
} from "lucide-react";

interface Template {
  id: string;
  title: string;
  desc: string;
  price: string;
  originalPrice: string;
  features: string[];
  downloads: string;
}

const templates: Template[] = [
  {
    id: "msme-43b-payment-tracker",
    title: "MSME Section 43B(h) Auditor Sheet",
    desc: "Ensure compliance with Section 43B(h) rules. Track supplier classification (micro/small/medium), calculate 15/45-day limits, and auto-compute penal interest.",
    price: "₹499",
    originalPrice: "₹1,199",
    features: [
      "Due date automatic calendar alerts",
      "Micro vs Small category classification rules",
      "Compound interest rate computation (3x SBI rate)",
      "Auditor verification checklist"
    ],
    downloads: "389 downloads"
  }
];

interface MSMERecord {
  pan: string;
  udyamNumber: string;
  name: string;
  type: string;
  activity: string;
  status: string;
  source: string;
  error?: string;
}

export default function MarketplacePage() {
  // Verification states
  const [panInput, setPanInput] = useState("");
  const [bulkPans, setBulkPans] = useState<string[]>([]);
  const [results, setResults] = useState<MSMERecord[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [fileError, setFileError] = useState("");
  
  // API credentials settings
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [provider, setProvider] = useState<"surepass" | "cashfree">("surepass");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [keyMasked, setKeyMasked] = useState(false);

  // Load API settings on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("msme_api_mode") || "demo";
      setMode(savedMode as any);
      const savedProvider = localStorage.getItem("msme_api_provider") || "surepass";
      setProvider(savedProvider as any);
      
      const savedKey = localStorage.getItem("msme_api_key") || "";
      if (savedKey) {
        setApiKey(savedKey.length > 10 ? `${savedKey.slice(0, 5)}…${savedKey.slice(-4)}` : savedKey);
        setKeyMasked(true);
      }
      const savedSecret = localStorage.getItem("msme_api_secret") || "";
      if (savedSecret) {
        setApiSecret(savedSecret.length > 10 ? `${savedSecret.slice(0, 5)}…${savedSecret.slice(-4)}` : savedSecret);
      }
    } catch (e) {}
  }, []);

  // Save key helper
  const saveApiCredentials = () => {
    try {
      localStorage.setItem("msme_api_mode", mode);
      localStorage.setItem("msme_api_provider", provider);
      
      // Store actual raw values if they aren't masked representations
      if (!apiKey.includes("…")) {
        localStorage.setItem("msme_api_key", apiKey);
      }
      if (apiSecret && !apiSecret.includes("…")) {
        localStorage.setItem("msme_api_secret", apiSecret);
      }
      
      setKeyMasked(true);
      alert("Verification configurations saved successfully!");
      setShowSettings(false);
    } catch (e) {
      alert("Failed to save credentials.");
    }
  };

  const handleClearCredentials = () => {
    localStorage.removeItem("msme_api_key");
    localStorage.removeItem("msme_api_secret");
    setApiKey("");
    setApiSecret("");
    setKeyMasked(false);
    alert("Saved API keys cleared.");
  };

  // Safe credentials fetcher for live execution
  const getRawApiKey = () => {
    if (keyMasked) {
      return localStorage.getItem("msme_api_key") || "";
    }
    return apiKey;
  };

  const getRawApiSecret = () => {
    if (apiSecret.includes("…")) {
      return localStorage.getItem("msme_api_secret") || "";
    }
    return apiSecret;
  };

  // Helper to extract PANs from CSV/text
  const extractPans = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const pans: string[] = [];
    for (const line of lines) {
      const parts = line.split(/[,\s\t]+/).map(p => p.trim().toUpperCase());
      for (const part of parts) {
        if (/[A-Z]{5}[0-9]{4}[A-Z]/.test(part)) {
          pans.push(part);
        }
      }
    }
    return [...new Set(pans)];
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const found = extractPans(text);
      if (found.length === 0) {
        setFileError("No valid 10-character PAN card numbers found in the file.");
        setBulkPans([]);
      } else {
        setBulkPans(found);
      }
    };
    reader.onerror = () => {
      setFileError("Could not read the uploaded CSV file.");
    };
    reader.readAsText(file);
  };

  // Verification pipeline
  const verifyPanNumber = async (targetPan: string): Promise<MSMERecord> => {
    try {
      const requestPayload = {
        pan: targetPan,
        mode: mode,
        provider: provider,
        apiKey: getRawApiKey(),
        apiSecret: getRawApiSecret()
      };

      const res = await fetch("/api/msme-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload)
      });

      const data = await res.json();
      if (data.success) {
        return {
          pan: targetPan,
          udyamNumber: data.data.udyamNumber,
          name: data.data.name,
          type: data.data.type,
          activity: data.data.activity,
          status: data.data.status,
          source: data.source
        };
      } else {
        return {
          pan: targetPan,
          udyamNumber: "N/A",
          name: "Failed Search",
          type: "Non-MSME",
          activity: "N/A",
          status: "Inactive",
          source: mode,
          error: data.error || "Udyam verification failed"
        };
      }
    } catch (e: any) {
      return {
        pan: targetPan,
        udyamNumber: "N/A",
        name: "Connection Error",
        type: "Non-MSME",
        activity: "N/A",
        status: "Inactive",
        source: mode,
        error: e.message || "Failed to reach backend proxy"
      };
    }
  };

  // Run verification
  const handleVerify = async () => {
    setVerifying(true);
    let queue: string[] = [];

    if (panInput) {
      const clean = panInput.trim().toUpperCase();
      if (!/[A-Z]{5}[0-9]{4}[A-Z]/.test(clean)) {
        alert("Please enter a valid 10-character PAN number (e.g. ABCDE1234F)");
        setVerifying(false);
        return;
      }
      queue.push(clean);
    } else if (bulkPans.length > 0) {
      queue = [...bulkPans];
    } else {
      alert("Please enter a PAN number or upload a CSV file containing PANs.");
      setVerifying(false);
      return;
    }

    if (mode === "live" && !getRawApiKey()) {
      alert("Please configure your API credentials in the settings panel first.");
      setVerifying(false);
      return;
    }

    setProgress({ done: 0, total: queue.length });
    const runResults: MSMERecord[] = [];

    for (let i = 0; i < queue.length; i++) {
      const result = await verifyPanNumber(queue[i]);
      runResults.push(result);
      setProgress({ done: i + 1, total: queue.length });
      
      // sequential delay for Live API mode to avoid rate limits
      if (mode === "live" && i < queue.length - 1) {
        await new Promise(r => setTimeout(r, 600));
      }
    }

    setResults(runResults);
    setVerifying(false);
    setPanInput("");
    setBulkPans([]);
  };

  // Export CSV Report
  const handleDownloadReport = () => {
    if (results.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "PAN,Udyam Registration Number,Enterprise Name,Enterprise Classification,Activity Type,Verification Status,Source,Error Note\n";
    
    results.forEach((r) => {
      const nameEscaped = (r.name || "").replace(/"/g, '""');
      csvContent += `${r.pan},${r.udyamNumber},"${nameEscaped}",${r.type},${r.activity},${r.status},${r.source},"${r.error || ""}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `msme_udyam_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />
      
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10 space-y-16">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4f7cff]/10 border border-[#4f7cff]/20 text-xs font-semibold text-[#4f7cff]">
            <ShoppingBag size={12} />
            Digital Asset Store &amp; Verification
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-2">
            MSME Compliance Center
          </h1>
          <p className="text-sm md:text-base text-[#737c92] leading-relaxed">
            Acquire Section 43B(h) compliance tools and run programmatic Udyam status checks on your supplier PAN records.
          </p>
        </div>

        {/* 1. Templates Section */}
        <div className="space-y-6">
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <FileSpreadsheet className="text-[#4f7cff]" size={20} />
            MSME Compliance Tools
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="border border-white/5 bg-white/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm shadow-[0_0_40px_rgba(0,0,0,0.3)] group hover:border-[#4f7cff]/20 transition-all duration-300 md:col-span-3 lg:col-span-1"
              >
                <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-[#4f7cff]/10 to-transparent blur-xl pointer-events-none" />
                
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#4f7cff]/10 border border-[#4f7cff]/20 flex items-center justify-center text-[#4f7cff]">
                      <FileSpreadsheet size={20} />
                    </div>
                    <span className="text-[10px] text-[#34d399] bg-[#34d399]/10 px-2 py-0.5 rounded font-mono">
                      {tpl.downloads}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#4f7cff] transition-colors">{tpl.title}</h3>
                    <p className="text-xs text-[#737c92] mt-2 leading-relaxed">{tpl.desc}</p>
                  </div>
                  
                  <ul className="space-y-2 text-xs text-[#aab2c5]">
                    {tpl.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-[#34d399] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-white">{tpl.price}</span>
                    <span className="text-xs text-[#737c92] line-through ml-2">{tpl.originalPrice}</span>
                  </div>
                  
                  <button className="px-4 py-2 bg-[#4f7cff] hover:bg-[#3d66dd] text-xs font-semibold text-white rounded-xl transition-all shadow-[0_0_15px_rgba(79,124,255,0.2)] cursor-pointer">
                    Buy Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Interactive Udyam PAN Verifier Tool */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="text-[#4f7cff]" size={20} />
              Udyam MSME Status Lookup (PAN)
            </h2>
            
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 text-xs text-[#aab2c5] hover:text-white transition-colors cursor-pointer bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
            >
              <Settings size={14} />
              Settings
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="border border-white/10 bg-white/[0.02] p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Key size={16} className="text-[#4f7cff]" />
                API Integration Configurations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#aab2c5]">Verification Mode</label>
                  <select 
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="bg-[#05060a] border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="demo">Demo Mode (Simulation &amp; Samples)</option>
                    <option value="live">Live API Mode (Real verification)</option>
                  </select>
                </div>

                {mode === "live" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#aab2c5]">KYC Provider</label>
                    <select 
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as any)}
                      className="bg-[#05060a] border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="surepass">Surepass API</option>
                      <option value="cashfree">Cashfree API</option>
                    </select>
                  </div>
                )}
              </div>

              {mode === "live" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#aab2c5] font-mono">
                      {provider === "surepass" ? "Auth Bearer Key" : "Client ID"}
                    </label>
                    <input 
                      type="password"
                      placeholder="Enter token key..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setKeyMasked(false);
                      }}
                      className="bg-[#05060a] border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  {provider === "cashfree" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#aab2c5] font-mono">Client Secret</label>
                      <input 
                        type="password"
                        placeholder="Enter client secret..."
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        className="bg-[#05060a] border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                {mode === "live" && (
                  <button 
                    onClick={handleClearCredentials}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Clear Keys
                  </button>
                )}
                <button 
                  onClick={saveApiCredentials}
                  className="px-4 py-2 bg-[#4f7cff] hover:bg-[#3d66dd] text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer"
                >
                  Save Configurations
                </button>
              </div>
            </div>
          )}

          {/* Verification input controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Input Form */}
            <div className="md:col-span-5 border border-white/5 bg-white/[0.01] p-6 rounded-3xl space-y-6">
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">Single PAN Verification</label>
                <input 
                  type="text"
                  maxLength={10}
                  placeholder="Enter 10-character PAN (e.g. KDKSO8162G)"
                  value={panInput}
                  onChange={(e) => {
                    setPanInput(e.target.value.toUpperCase());
                    setBulkPans([]);
                  }}
                  disabled={verifying}
                  className="bg-[#05060a] border border-white/10 focus:border-[#4f7cff] focus:outline-none rounded-xl px-4 py-3 text-sm text-white font-mono uppercase tracking-widest placeholder:tracking-normal placeholder:font-sans"
                />
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[10px] text-[#737c92] font-bold uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              {/* Bulk File upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">Bulk CSV Upload</label>
                
                <div className="border-2 border-dashed border-white/10 hover:border-[#4f7cff]/40 rounded-2xl p-6 text-center cursor-pointer relative transition-all duration-300">
                  <input 
                    type="file" 
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    disabled={verifying}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto text-[#737c92] mb-2" size={24} />
                  <p className="text-xs text-[#aab2c5] font-semibold">Upload CSV / TXT File</p>
                  <p className="text-[10px] text-[#737c92] mt-1">Select a file containing vendor PAN lists</p>
                </div>

                {bulkPans.length > 0 && (
                  <p className="text-xs text-[#34d399] font-semibold flex items-center gap-1.5 bg-[#34d399]/5 border border-[#34d399]/20 px-3 py-2 rounded-lg mt-2">
                    <CheckCircle2 size={14} /> Found {bulkPans.length} unique PAN records ready to check!
                  </p>
                )}

                {fileError && (
                  <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5 bg-red-400/5 border border-red-400/20 px-3 py-2 rounded-lg mt-2">
                    <AlertCircle size={14} /> {fileError}
                  </p>
                )}
              </div>

              <button 
                onClick={handleVerify}
                disabled={verifying || (!panInput && bulkPans.length === 0)}
                className="w-full py-3.5 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] disabled:bg-white/5 disabled:text-[#737c92] text-xs font-semibold text-white transition-all shadow-[0_0_20px_rgba(79,124,255,0.2)] disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Verifying {progress.done}/{progress.total}...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 size={14} />
                    <span>Verify MSME Udyam Status</span>
                  </>
                )}
              </button>
            </div>

            {/* Verification Results Panel */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Verification Audit Logs</h3>
                
                {results.length > 0 && (
                  <button 
                    onClick={handleDownloadReport}
                    className="flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 text-white rounded-lg px-2.5 py-1 border border-white/10 cursor-pointer transition-colors"
                  >
                    <Download size={10} />
                    Export CSV Report
                  </button>
                )}
              </div>

              <div className="border border-white/5 bg-white/[0.01] rounded-3xl overflow-hidden min-h-[300px]">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-12 min-h-[300px] text-[#737c92]">
                    <Building2 size={36} className="mb-3 opacity-30" />
                    <p className="text-xs font-semibold">No active lookups conducted</p>
                    <p className="text-[10px] mt-1 max-w-xs">Run a single PAN check or upload a CSV vendor file to perform MSME verification. You can test Demo Mode with KDKSO8162G or MSTEC9182F!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/[0.02]">
                          <th className="p-3.5">PAN</th>
                          <th className="p-3.5">Udyam URN</th>
                          <th className="p-3.5">Enterprise Name</th>
                          <th className="p-3.5">Classification</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[#aab2c5]">
                        {results.map((r, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-3.5 font-mono font-bold text-white">{r.pan}</td>
                            <td className="p-3.5 font-mono text-[11px]">{r.udyamNumber}</td>
                            <td className="p-3.5 font-semibold text-white max-w-[160px] truncate">{r.name}</td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.type === "Micro" ? "text-cyan-400 bg-cyan-400/10" :
                                r.type === "Small" ? "text-purple-400 bg-purple-400/10" :
                                r.type === "Medium" ? "text-amber-400 bg-amber-400/10" :
                                "text-[#737c92] bg-white/5"
                              }`}>
                                {r.type}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1 font-bold ${
                                r.status === "Active" ? "text-green-400" : "text-red-400"
                              }`}>
                                {r.status === "Active" ? (
                                  <CheckCircle2 size={10} />
                                ) : (
                                  <XCircle size={10} />
                                )}
                                {r.status}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-semibold text-white capitalize">{r.source}</span>
                                {r.error && (
                                  <span className="text-[9px] text-red-400 truncate max-w-[100px]">{r.error}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
