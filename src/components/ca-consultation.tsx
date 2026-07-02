"use client";

import { useState } from "react";
import { Shield, Send, Check, User, Phone, Mail, MapPin, MessageSquare } from "lucide-react";

interface CAConsultationProps {
  toolName: string;
}

export function CAConsultation({ toolName }: CAConsultationProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, city, query, tool: toolName })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to submit request.");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-white/10 bg-white/[0.02] p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.3)]">
      <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-[#4f7cff]/10 to-transparent blur-xl pointer-events-none" />
      
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#4f7cff]/10 border border-[#4f7cff]/20 flex items-center justify-center text-[#4f7cff] flex-shrink-0">
          <Shield size={14} />
        </div>
        <div>
          <h4 className="font-semibold text-white text-sm">Consult a Tax Expert / CA</h4>
          <p className="text-[10px] text-[#737c92] mt-0.5">
            Need professional help with waivers, disputes, or filings? Connect with a local verified CA.
          </p>
        </div>
      </div>

      {success ? (
        <div className="text-center py-6 flex flex-col items-center justify-center gap-2 animate-scaleIn">
          <div className="w-10 h-10 rounded-full bg-[#34d399]/15 border border-[#34d399]/30 flex items-center justify-center text-[#34d399]">
            <Check size={20} />
          </div>
          <h5 className="text-xs font-semibold text-white">Request Received Successfully!</h5>
          <p className="text-[10px] text-[#737c92] max-w-[240px]">
            A verified Chartered Accountant will contact you shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <User size={12} className="absolute left-3.5 top-3 text-[#737c92]" />
              <input
                type="text"
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl pl-9 pr-3.5 py-2 text-xs text-white transition-colors"
              />
            </div>
            <div className="relative">
              <Phone size={12} className="absolute left-3.5 top-3 text-[#737c92]" />
              <input
                type="tel"
                required
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl pl-9 pr-3.5 py-2 text-xs text-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Mail size={12} className="absolute left-3.5 top-3 text-[#737c92]" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl pl-9 pr-3.5 py-2 text-xs text-white transition-colors"
              />
            </div>
            <div className="relative">
              <MapPin size={12} className="absolute left-3.5 top-3 text-[#737c92]" />
              <input
                type="text"
                required
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl pl-9 pr-3.5 py-2 text-xs text-white transition-colors"
              />
            </div>
          </div>

          <div className="relative">
            <MessageSquare size={12} className="absolute left-3.5 top-3.5 text-[#737c92]" />
            <textarea
              placeholder="Describe your query / tax situation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#4f7cff] focus:outline-none rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-[10px] text-[#ff5d73] bg-[#ff5d73]/10 border border-[#ff5d73]/20 px-3 py-1.5 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-xl bg-[#4f7cff] hover:bg-[#3d66dd] disabled:bg-[#4f7cff]/50 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(79,124,255,0.15)]"
          >
            {loading ? "Submitting..." : (
              <>
                Request CA Call
                <Send size={12} />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
