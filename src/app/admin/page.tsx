"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { 
  Shield, 
  FileText, 
  BookOpen, 
  Users, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle,
  Server
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("import");
  
  // Importer state
  const [importType, setImportType] = useState<"glossary" | "insights">("glossary");
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importError, setImportError] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  // Leads state
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session && (session.user as any).role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch leads when switching to leads tab
  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      // Ignored
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "leads") {
      fetchLeads();
    }
  }, [activeTab]);

  if (status === "loading") {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#05060a]">
        <span className="text-sm text-[#737c92]">Authorizing Admin access...</span>
      </div>
    );
  }

  if (!session || (session.user as any).role !== "ADMIN") return null;

  // CSV Template Downloads
  const downloadTemplate = (type: "glossary" | "insights") => {
    let content = "";
    let filename = "";
    if (type === "glossary") {
      content = "data:text/csv;charset=utf-8,term,category,definition,explanation,sections,takeaways\nCGST Act,GST,Central Goods and Services Tax,Legislation governing CGST collection in India,Section 1,Governing Statute\n";
      filename = "glossary_import_template.csv";
    } else {
      content = "data:text/csv;charset=utf-8,title,excerpt,content,category,readingTime,published\nIntroduction to GSTR-2B,Reconciliation guide,Complete guide to GSTR-2B filing compliance,GST,4 min read,true\n";
      filename = "insights_import_template.csv";
    }
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV File parser
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          setImportError("CSV file is empty.");
          return;
        }

        const parsedRecords: any[] = [];
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          if (cols.length === 0) continue;

          const record: any = {};
          headers.forEach((header, index) => {
            record[header] = cols[index]?.trim() || "";
          });
          parsedRecords.push(record);
        }

        setImportRows(parsedRecords);
      } catch (err) {
        setImportError("Failed to parse CSV file. Use standard headers.");
      }
    };
    reader.readAsText(file);
  };

  // Trigger API Import
  const runImport = async () => {
    if (importRows.length === 0) return;
    setImportLoading(true);
    setImportError("");

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: importType, records: importRows })
      });

      const data = await res.json();
      if (res.ok) {
        setImportSuccess(data.count);
        setImportRows([]);
      } else {
        setImportError(data.error || "Failed to complete bulk import.");
      }
    } catch (err) {
      setImportError("Connection failed. Check database logs.");
    } finally {
      setImportLoading(false);
    }
  };

  // Export leads to CSV
  const exportLeads = () => {
    if (leads.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,Name,Phone,Email,City,Query,Tool,Date\n";
    leads.forEach(l => {
      csvContent += `"${l.name}","${l.phone}","${l.email}","${l.city}","${l.query.replace(/"/g, '""')}","${l.tool}","${l.createdAt}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "consultation_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4f7cff]/10 border border-[#4f7cff]/20 flex items-center justify-center text-[#4f7cff]">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Admin Command Center</h1>
              <p className="text-xs text-[#737c92]">Batch upload glossary, view client leads, and verify database states.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 px-3 py-1 rounded-xl">
            <Server size={12} />
            Database Online
          </div>
        </div>

        {/* Layout tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel tabs */}
          <div className="lg:col-span-3 border border-white/5 bg-white/5 p-4 rounded-2xl flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab("import")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "import"
                  ? "bg-[#4f7cff] text-white font-bold"
                  : "text-[#aab2c5] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Upload size={14} />
              Bulk CSV Importer
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "leads"
                  ? "bg-[#4f7cff] text-white font-bold"
                  : "text-[#aab2c5] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Users size={14} />
              Consultation Leads
            </button>
          </div>

          {/* Right panel panel */}
          <div className="lg:col-span-9 border border-white/5 bg-white/5 p-6 rounded-2xl min-h-[400px]">
            {activeTab === "import" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold text-white">Spreadsheet Data Importer</h3>
                  <p className="text-[10px] text-[#737c92] mt-0.5">Upload a CSV table to populate database glossary terms or article posts instantly.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-white/5 bg-white/[0.02] p-5 rounded-xl flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-semibold text-white">1. Select Destination Table</h4>
                      <p className="text-[10px] text-[#737c92] mt-1">Specify whether you are importing tax terms or insights articles.</p>
                    </div>
                    <select
                      value={importType}
                      onChange={(e) => {
                        setImportType(e.target.value as any);
                        setImportRows([]);
                        setImportSuccess(null);
                      }}
                      className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] rounded-xl px-3 py-2 text-xs text-white transition-colors cursor-pointer"
                    >
                      <option value="glossary" className="bg-[#080a12]">Glossary (Term Definitions)</option>
                      <option value="insights" className="bg-[#080a12]">Insights (Blog/Guides Articles)</option>
                    </select>
                  </div>

                  <div className="border border-white/5 bg-white/[0.02] p-5 rounded-xl flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-semibold text-white">2. Get Headers Template</h4>
                      <p className="text-[10px] text-[#737c92] mt-1">Export headers configuration to populate CSV columns matching the schema.</p>
                    </div>
                    <button
                      onClick={() => downloadTemplate(importType)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <FileSpreadsheet size={13} className="text-[#34d399]" />
                      Download headers CSV
                    </button>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="border border-dashed border-white/10 p-8 rounded-xl text-center flex flex-col items-center justify-center gap-3">
                  <Upload size={24} className="text-[#737c92]" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Upload Populated CSV</h4>
                    <p className="text-[10px] text-[#737c92] mt-1">Choose your configured CSV file containing records.</p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors mt-2">
                    Browse File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {importError && (
                  <div className="flex items-center gap-2 border border-[#ff5d73]/20 bg-[#ff5d73]/10 px-4 py-3 rounded-xl text-xs text-[#ff5d73]">
                    <AlertTriangle size={14} />
                    {importError}
                  </div>
                )}

                {importSuccess !== null && (
                  <div className="flex items-center gap-2 border border-[#34d399]/20 bg-[#34d399]/10 px-4 py-3 rounded-xl text-xs text-[#34d399]">
                    <Check size={14} />
                    Successfully batch imported {importSuccess} records into database!
                  </div>
                )}

                {importRows.length > 0 && (
                  <div className="border border-white/5 p-4 rounded-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white">Ready to Import: <b className="text-[#4f7cff]">{importRows.length} records</b></span>
                      <button
                        onClick={runImport}
                        disabled={importLoading}
                        className="px-4 py-2 bg-[#4f7cff] hover:bg-[#3d66dd] disabled:bg-[#4f7cff]/50 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-[0_0_15px_rgba(79,124,255,0.2)]"
                      >
                        {importLoading ? "Importing..." : "Run Database Import"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "leads" && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">CA Consultation Leads</h3>
                    <p className="text-[10px] text-[#737c92] mt-0.5">List of prospects captured from calculator consultation banners.</p>
                  </div>
                  {leads.length > 0 && (
                    <button
                      onClick={exportLeads}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#34d399]/10 border border-[#34d399]/20 hover:bg-[#34d399]/20 text-[#34d399] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Download size={13} />
                      Export Leads
                    </button>
                  )}
                </div>

                {leadsLoading ? (
                  <div className="text-center py-12 text-xs text-[#737c92]">Loading Leads...</div>
                ) : leads.length > 0 ? (
                  <div className="border border-white/5 rounded-xl overflow-hidden overflow-x-auto text-xs">
                    <table className="w-full border-collapse text-left min-w-[700px]">
                      <thead>
                        <tr className="border-b border-white/5 text-[#737c92] font-semibold bg-white/5">
                          <th className="px-4 py-3">Client details</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">Source Tool</th>
                          <th className="px-4 py-3">Query</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((l: any, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3">
                              <span className="font-bold text-white block">{l.name}</span>
                              <span className="text-[10px] text-[#737c92] block">{l.email} · {l.phone}</span>
                            </td>
                            <td className="px-4 py-3 text-[#aab2c5]">{l.city}</td>
                            <td className="px-4 py-3 text-white font-mono">{l.tool}</td>
                            <td className="px-4 py-3 text-[#737c92] truncate max-w-xs">{l.query || "No description"}</td>
                            <td className="px-4 py-3 text-[#737c92]">{new Date(l.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-white/10 rounded-xl text-xs text-[#737c92]">
                    No lead submissions recorded yet. Banners are active on the calculator pages.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
