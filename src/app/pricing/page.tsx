"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { 
  Check, 
  Sparkles, 
  CreditCard, 
  Lock, 
  HelpCircle, 
  ShieldCheck, 
  Info,
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
    ctaText: "Upgrade to Pro",
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
    ctaText: "Contact Sales",
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

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Checkout Form State
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [paymentStep, setPaymentStep] = useState<"input" | "processing" | "success">("input");
  const [userPlan, setUserPlan] = useState<string>("free");

  // Load current user subscription status
  useEffect(() => {
    const savedPlan = localStorage.getItem("numberiq_user_plan");
    if (savedPlan) {
      setUserPlan(savedPlan);
    }
  }, []);

  const openCheckout = (plan: Plan) => {
    if (plan.id === "free") return;
    if (plan.id === "enterprise") {
      window.location.href = "mailto:sales@numberiq.in?subject=Enterprise Plan Inquiry";
      return;
    }
    setSelectedPlan(plan);
    setPaymentStep("input");
    setIsModalOpen(true);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvv || !cardName) {
      alert("Please fill in all credit card details.");
      return;
    }
    
    setPaymentStep("processing");
    
    // Simulate gateway request delay
    setTimeout(() => {
      setPaymentStep("success");
      setUserPlan("pro");
      localStorage.setItem("numberiq_user_plan", "pro");
      // Optionally notify other tabs/services
      window.dispatchEvent(new Event("storage"));
    }, 2500);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
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

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {pricingPlans.map((plan) => {
            const isCurrent = userPlan === plan.id;
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
                      onClick={() => openCheckout(plan)}
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
                  Absolutely. All calculator inputs and PDF invoice extractions are processed locally on your client machine. No private transactions data is stored on our servers.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <HelpCircle className="text-[#4f7cff] shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">What payment methods are supported?</h4>
                <p className="text-[11px] text-[#737c92] mt-1.5 leading-relaxed">
                  We support all major Indian credit cards, corporate debit cards, and instant UPI transfers through our secure payment gateway.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>

      <Footer />

      {/* Stripe-Grade Interactive Checkout Modal */}
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
              {paymentStep !== "processing" && (
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full border border-white/5 bg-white/5 text-[#737c92] hover:text-white transition-colors cursor-pointer"
                >
                  <XIcon size={14} />
                </button>
              )}

              {/* Modal Body */}
              <div className="p-6 sm:p-8 flex flex-col gap-6">
                
                {/* STEP 1: PAYMENT FORM */}
                {paymentStep === "input" && (
                  <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-5">
                    <div className="text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4f7cff] uppercase tracking-wider mb-2">
                        <CreditCard size={11} /> Secure Checkout
                      </span>
                      <h3 className="text-lg font-bold text-white">Subscribe to {selectedPlan.name}</h3>
                      <p className="text-xs text-[#737c92] mt-1">
                        Amount Due: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
                          billingPeriod === "monthly" ? selectedPlan.monthlyPrice : selectedPlan.annualPrice
                        )} ({billingPeriod === "monthly" ? "Monthly" : "Annual"})
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
                      {/* Cardholder Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="e.g. CA Sitaram Pareek"
                          className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20"
                        />
                      </div>

                      {/* Card Number */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            placeholder="4111 2222 3333 4444"
                            className="w-full bg-[#06080D] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20 font-mono"
                          />
                          <Lock size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737c92]" />
                        </div>
                      </div>

                      {/* Expiry & CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">Expiry Date</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={expiry}
                            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20 font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-[#737c92] font-bold">CVV Code</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                            placeholder="•••"
                            className="bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#4f7cff] transition-all placeholder:text-white/20 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start mt-2">
                      <ShieldCheck size={16} className="text-[#00D68F] shrink-0 mt-0.5" />
                      <p className="text-[9px] text-[#737c92] leading-relaxed">
                        PCI-DSS compliant connection. Transactions are encrypted using 256-bit SSL protocols. Secure gateway processing handles direct debiting safely.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-[#4f7cff] hover:bg-[#3d66dd] text-sm font-bold text-white rounded-xl shadow-[0_0_20px_rgba(79,124,255,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Authorize Payment
                    </button>
                  </form>
                )}

                {/* STEP 2: PROCESSING STATE */}
                {paymentStep === "processing" && (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                    <Loader2 size={36} className="text-[#4f7cff] animate-spin" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Verifying Transaction</h4>
                      <p className="text-xs text-[#737c92] mt-1 max-w-xs mx-auto leading-relaxed">
                        Communicating with the card issuer network. Please do not close this window or refresh the page.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 3: SUCCESS STATE */}
                {paymentStep === "success" && (
                  <div className="py-8 flex flex-col items-center justify-center text-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-[#00D68F]/10 border border-[#00D68F]/25 flex items-center justify-center text-[#00D68F]">
                      <Check size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Upgrade Successful!</h4>
                      <p className="text-xs text-[#737c92] mt-1.5 max-w-xs mx-auto leading-relaxed">
                        Welcome to **NumberIQ Pro**. Your professional practice account features are now unlocked. An invoice receipt has been sent to your email.
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
