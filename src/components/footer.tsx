import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    workspace: [
      { name: "Calculators", href: "/tools" },
      { name: "insights", href: "/insights" },
      { name: "Glossary", href: "/glossary" },
    ],
    support: [
      { name: "About Us", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
    legal: [
      { name: "Disclaimer", href: "/disclaimer" },
      { name: "Privacy Policy", href: "/privacy-policy" },
    ],
  };

  return (
    <footer className="mt-auto border-t border-white/5 bg-[#05060a]/50 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold tracking-tight text-white">
              NumberIQ
            </span>
            <span className="text-[9px] uppercase font-semibold tracking-widest text-[#4f7cff] bg-[#4f7cff]/10 px-1 py-0.5 rounded border border-[#4f7cff]/20">
              saas
            </span>
          </div>
          <p className="text-xs text-[#737c92] max-w-xs leading-relaxed">
            Unified intelligence platform for MIS reporting, Indian GST compliance, direct tax computation, and corporate finance.
          </p>
        </div>

        {/* Links Column 1 */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#737c92] mb-3">
            Workspace
          </h4>
          <ul className="flex flex-col gap-2">
            {links.workspace.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-[#aab2c5] hover:text-white transition-colors capitalize"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Links Column 2 */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#737c92] mb-3">
            Organization
          </h4>
          <ul className="flex flex-col gap-2">
            {links.support.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-[#aab2c5] hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Links Column 3 */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#737c92] mb-3">
            Legal
          </h4>
          <ul className="flex flex-col gap-2">
            {links.legal.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-[#aab2c5] hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#737c92]">
        <p>&copy; {currentYear} NumberIQ. All rights reserved.</p>
        <p className="max-w-md text-center sm:text-right leading-relaxed">
          Disclaimer: Calculations are for educational & reference purposes. Consult a qualified professional (CA/tax advisor) before taking financial decisions.
        </p>
      </div>
    </footer>
  );
}
