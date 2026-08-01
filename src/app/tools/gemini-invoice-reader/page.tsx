import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { GeminiInvoiceReader } from "@/components/calculators/gemini-invoice-reader";

export const metadata: Metadata = {
  title: "Gemini AI Bulk Invoice Extractor & Tally Exporter | NumberIQ",
  description: "100% Free Gemini AI powered bulk invoice extractor. Upload PDF/images, extract CGST, SGST, IGST, vendor name, and download Tally Prime Excel vouchers.",
  alternates: {
    canonical: "https://numberiq.in/tools/gemini-invoice-reader",
  },
};

export default function GeminiInvoiceReaderPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#05060a]">
      <Navbar />
      <main className="flex-1">
        <GeminiInvoiceReader />
      </main>
      <Footer />
    </div>
  );
}
