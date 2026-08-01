"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  Check,
  Sparkles,
  HelpCircle,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  desc: string;
  monthlyPrice: number;
  annualPrice: number;
  features: PlanFeature[];
  badge?: string;
  ctaText: string;
  popular?: boolean;
}

const pricingPlans: Plan[] = [
  {
    id: "free",
    name: "Starter",
    desc: "Essential tax calculation tools for individual practitioners.",
    monthlyPrice: 0,
    annualPrice: 0,
    ctaText: "Current Plan",
    features: [
      { text: "Access to 16+ basic calculators", included: true },
      { text: "1 AI Notice reply draft per month", included: true },
      { text: "Compliance Due Date Calendar", included: true },
      { text: "Standard email support", included: true },
      { text: "Unlimited Invoice to Tally conversions", included: false },
      { text: "AI Tax & FEMA Advisory suite", included: false },
      { text: "CA Boardroom metrics tracking", included: false },
    ],
  },
  {
    id: "pro",
    name: "Professional Pro",
    desc: "Complete toolkit for active tax practitioners and CAs.",
    monthlyPrice: 999,
    annualPrice: 7999,
    badge: "Most Popular",
    popular: true,
    ctaText: "Request early access",
    features: [
      { text: "Access to 16+ basic calculators", included: true },
      { text: "Unlimited AI Notice reply drafts", included: true },
      { text: "Compliance Due Date Calendar", included: true },
      { text: "Priority email & chat support", included: true },
      { text: "Unlimited Invoice to Tally XML exports", included: true },
      { text: "AI Tax & FEMA Advisory suite", included: true },
      { text: "CA Boardroom metrics tracking", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    desc: "For large consulting firms and multi-partner CA practices.",
    monthlyPrice: 4999,
    annualPrice: 39999,
    ctaText: "Talk to sales",
    features: [
      { text: "All Pro tier benefits included", included: true },
      { text: "Dedicated account support partner", included: true },
      { text: "SLA-backed uptime guarantees", included: true },
      { text: "Custom API & webhook integrations", included: true },
      { text: "Unlimited client workspaces", included: true },
      { text: "White-labeled PDF reporting", included: true },
    ],
  },
];

// Billing is not live yet. Until a real gateway is wired up, the paid plans collect an
// early-access lead instead of pretending to take a card — the previous version of this page
// rendered a card form, ran a 2.5s setTimeout and wrote `numberiq_user_plan=pro` to
// localStorage, which charged nobody but told the visitor their payment had succeeded.
// Everyone is therefore on the free plan; there is no client-side entitlement to read.
const CURRENT_PLAN_ID = "free";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Early-access request form state
  const [formStep, setFormStep] = useState<"input" | "submitting" | "success">("input");
  const [formError, setFormError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const openInterestForm = (plan: Plan) => {
    if (plan.id === "free") return;
    setSelectedPlan(plan);
    setFormStep("input");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setFormError("");
    setFormStep("submitting");

    const price = billingPeriod === "monthly" ? selectedPlan.monthlyPrice : selectedPlan.annualPrice;

    try {
      // Reuses the existing /api/leads endpoint (validation + per-IP rate limiting live there).
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          city,
          tool: `pricing-${selectedPlan.id}`,
          query: `Early-access request for the ${selectedPlan.name} plan (${billingPeriod} billing, indicative ₹${price}).`,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "We could not record your request. Please try again.");
      }

      setFormStep("success");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setFormStep("input");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a] text-white">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[45%] h-[40%] rounded-full bg-[#4f7cff]/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[45%] h-[40%] rounded-full bg-[#00d68f]/3 blur-[130px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#00d68f]/10 text-[#00d68f] border border-[#00d68f]/20 mb-4">
            <Sparkles size={11} /> Flexible SaaS Subscriptions
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Plans built for practices <br />
            <span className="bg-gradient-to-r from-[#4f7cff] via-[#a855f7] to-[#00d68f] bg-clip-text text-transparent">
              of all sizes.
            </span>
          </h1>
          <p className="text-sm text-[#737c92] mt-4 max-w-lg mx-auto leading-relaxed">
            Gain access to unlimited notice drafting, real-time metrics dashboards, and professional AI-powered tax advisors. Cancel or switch anytime.
          </p>

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-xs font-semibold ${billingPeriod === "monthly" ? "text-white" : "text-[#737c92]"}`}>
              Monthly billing
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
              className="w-12 h-6.5 rounded-full bg-white/5 border border-white/10 p-1 flex items-center relative transition-colors duration-300 cursor-pointer"
            >
              <motion.div
                className="w-4.5 h-4.5 rounded-full bg-[#4f7cff] shadow-[0_0_10px_rgba(79,124,255,0.4)]"
                animate={{ x: billingPeriod === "annual" ? 22 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingPeriod === "annual" ? "text-white" : "text-[#737c92]"}`}>
              Annual billing 
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-[#00D68F]/10 text-[#00D68F] border border-[#00D68F]/20">
                Save ~20%
              </span>
            </span>
          </div>
        </div>

        {/* Billing is not live — say so before anyone clicks a plan. */}
        <div className="max-w-2xl mx-auto -mt-8 mb-14 flex gap-3 items-start rounded-2xl border border-[#4f7cff]/20 bg-[#4f7cff]/5 px-5 py-4">
          <AlertCircle size={16} className="text-[#4f7cff] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#aab2c5] leading-relaxed">
            <span className="font-bold text-white">Paid plans are not live yet.</span> Prices below are
            indicative. There is no checkout, no card is collected and nothing is charged — choosing a
            plan adds you to the early-access list. All free tools remain fully available.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {pricingPlans.map((plan) => {
            const isCurrent = CURRENT_PLAN_ID === plan.id;
            const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            const formattedPrice = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
            
            return (
              <div 
                key={plan.id}
                className={`border rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden backdrop-blur-md transition-all duration-300 ${
                  plan.popular 
                    ? "bg-[#0E121B] border-[#4f7cff] shadow-[0_0_50px_rgba(79,124,255,0.15)] scale-[1.02]" 
                    : "bg-[#0E121B]/40 border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-white/10"
                }`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#4f7cff]/10 text-[#4f7cff] border border-[#4f7cff]/20 shadow-[0_0_15px_rgba(79,124,255,0.1)]">
                    {plan.badge}
                  </span>
                )}

                {/* Card Top */}
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-[#737c92] mt-2 leading-relaxed">{plan.desc}</p>
                  
                  {/* Price Block */}
                  <div className="mt-6 flex items-baseline gap-1 border-b border-white/5 pb-6">
                    <span className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
                      {formattedPrice}
                    </span>
                    <span className="text-xs text-[#737c92]">
                      {plan.id === "free" ? "" : billingPeriod === "monthly" ? "/month" : "/year"}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="mt-6 flex flex-col gap-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[#aab2c5]">
                        <Check 
                          size={14} 
                          className={`shrink-0 mt-0.5 ${feature.included ? "text-[#00d68f]" : "text-[#737c92] opacity-30"}`} 
                        />
                        <span className={feature.included ? "" : "text-[#737c92] line-through decoration-white/10"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Action */}
                <div className="mt-8">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3.5 rounded-xl bg-white/[0.04] text-[#737c92] border border-white/10 text-xs font-bold uppercase tracking-wider cursor-not-allowed select-none flex items-center justify-center gap-1.5"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => openInterestForm(plan)}
                      className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        plan.popular
                          ? "bg-[#4f7cff] hover:bg-[#3d66dd] text-white shadow-[0_0_20px_rgba(79,124,255,0.3)]"
                          : "bg-white/5 hover:bg-white/10 text-[#aab2c5] hover:text-white border border-white/10"
                      }`}
                    >
                      {plan.ctaText}
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="mt-24 max-w-4xl mx-auto border-t border-white/5 pt-16">
          <h2 className="font-display text-2xl font-bold text-center text-white mb-10">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-3">
              <HelpCircle className="text-[#4f7cff] shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">How do I claim tax deductions for software?</h4>
                <p className="text-[11px] text-[#737c92] mt-1.5 leading-relaxed">
                  CAs and practitioners can claim NumberIQ subscription costs as legitimate business expenditures under Section 37 of the Income-tax Act.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <HelpCircle className="text-[#4f7cff] shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Can I share templates and drafts with clients?</h4>
                <p className="text-[11px] text-[#737c92] mt-1.5 leading-relaxed">
                  Yes. The Pro and Enterprise plans allow exporting drafts and Excel trackers with copy-rights for distribution.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <HelpCircle className="text-[#4f7cff] shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Is my financial data secure?</h4>
                <p className="text-[11px] text-[#737c92] mt-1.5 leading-relaxed">
                  The calculators run entirely in your browser — those inputs never leave your machine. The AI features are different: invoice extraction and notice drafting upload the document to Google&apos;s Gemini API for processing. NumberIQ does not store the document or its contents after the result is returned. Use your judgement before uploading privileged client material.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <HelpCircle className="text-[#4f7cff] shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">When can I actually pay for a plan?</h4>
                <p className="text-[11px] text-[#737c92] mt-1.5 leading-relaxed">
                  Not yet. Paid plans are still being finalised, so there is no checkout on this page and no card is collected. Join the early-access list and we will email you when billing opens — UPI and Indian cards are what we intend to support. Every free tool works in the meantime.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>

      <Footer />

      {/* Early-access request modal (no payment is taken — see CURRENT_PLAN_ID note above) */}
      <AnimatePresence>
        {isModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0E121B] border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative"
            >
              {/* Close Button */}
              {formStep !== "submitting" && (
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full border border-white/5 bg-white/5 text-[#737c92] hover:text-white transition-colors cursor-pointer"
                >
                  <XIcon size={14} />
                </button>
              )}

              {/* Modal Body */}
              <div className="p-6 sm:p-8 flex flex-col gap-6">
                
                {/* STEP 1: EARLY-ACCESS REQUEST FORM */}
                {(formStep === "input" || formStep === "submitting") && (
                  <form onSubmit={handleInterestSubmit} className="flex flex-col gap-5">
                    <div className="text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4f7cff] uppercase tracking-wider mb-2">
                        <Mail size={11} /> Early Access
                      </span>
                      <h3 className="text-lg font-bold text-white">Join the list for {selectedPlan.name}</h3>
                      <p className="text-xs text-[#737c92] mt-1.5 leading-relaxed">
                        Paid plans are not live yet — no card is collected and nothing is charged.
                        Leave your details and we will contact you when billing opens, with the
                        indicative price of {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
                          billingPeriod === "monthly" ? selectedPlan.monthlyPrice : selectedPlan.annualPrice
                        )} {billingPeriod === "monthly" ? "per month" : "per year"} held for you.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="ea-name" className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">Full name</label>
                        <input
                          id="ea-name"
                          type="text"
                          required
                          maxLength={100}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. CA Sitaram Pareek"
                          className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="ea-email" className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">Work email</label>
                        <input
                          id="ea-email"
                          type="email"
                          required
                          maxLength={254}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@yourfirm.in"
                          className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="ea-phone" className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">Phone</label>
                          <input
                            id="ea-phone"
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="ea-city" className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">City</label>
                          <input
                            id="ea-city"
                            type="text"
                            required
                            maxLength={100}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Jaipur"
                            className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                          />
                        </div>
                      </div>
                    </div>

                    {formError && (
                      <div className="flex gap-2.5 items-start rounded-xl border border-[#ff5c5c]/20 bg-[#ff5c5c]/5 p-3">
                        <AlertCircle size={15} className="text-[#ff5c5c] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#ffb4b4] leading-relaxed">{formError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={formStep === "submitting"}
                      className="w-full py-4 bg-[#4f7cff] hover:bg-[#3d66dd] disabled:opacity-60 disabled:cursor-not-allowed text-sm font-bold text-white rounded-xl shadow-[0_0_20px_rgba(79,124,255,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {formStep === "submitting" ? (
                        <>
                          <Loader2 size={15} className="animate-spin" /> Sending…
                        </>
                      ) : (
                        <>Request early access</>
                      )}
                    </button>

                    <p className="text-[9px] text-[#737c92] leading-relaxed text-center">
                      We use these details only to contact you about NumberIQ. Prefer email?{" "}
                      <a href="mailto:sales@numberiq.in?subject=NumberIQ plan enquiry" className="text-[#4f7cff] hover:underline">
                        sales@numberiq.in
                      </a>
                    </p>
                  </form>
                )}

                {/* STEP 2: SUCCESS STATE */}
                {formStep === "success" && (
                  <div className="py-8 flex flex-col items-center justify-center text-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-[#00D68F]/10 border border-[#00D68F]/25 flex items-center justify-center text-[#00D68F]">
                      <Check size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">You are on the list</h4>
                      <p className="text-xs text-[#737c92] mt-1.5 max-w-xs mx-auto leading-relaxed">
                        Thanks — we have recorded your interest in the {selectedPlan.name} plan.
                        Nothing has been charged. We will email you when billing opens.
                        Meanwhile every free tool stays available.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full mt-2 py-3 bg-[#00D68F] hover:bg-[#00b377] text-xs font-bold uppercase tracking-wider text-black rounded-xl transition-all cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline fallback X icon
function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
