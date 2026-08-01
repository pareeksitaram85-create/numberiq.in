/**
 * NumberIQ — practice-area landing pages served through /practice/[slug].
 *
 * Statutory references use Income-tax Act 1961 numbering, which governs every
 * assessment year up to and including the year ending 31 March 2026. The
 * Income-tax Act 2025 applies from 1 April 2026 — see the Statutory Time
 * Machine tool for the renumbering.
 */

export interface PracticeFaq {
  question: string;
  answer: string;
}

export interface PracticeService {
  title: string;
  body: string;
}

export interface PracticeDeadline {
  form: string;
  what: string;
  due: string;
}

export interface PracticeArea {
  slug: string;
  name: string;
  eyebrow: string;
  tone: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  lede: string;
  chips: string[];
  stats: { value: string; label: string }[];
  overviewHeading: string;
  overview: string[];
  services: PracticeService[];
  deadlinesHeading: string;
  deadlines: PracticeDeadline[];
  pitfallsHeading: string;
  pitfalls: string[];
  faqs: PracticeFaq[];
  relatedTools: { slug: string; name: string }[];
}

export const practiceAreas: Record<string, PracticeArea> = {
  "transfer-pricing": {
    slug: "transfer-pricing",
    name: "Transfer Pricing",
    eyebrow: "Sections 92 to 92F · Rule 10B",
    tone: "#f4b740",
    icon: "TP",
    metaTitle: "Transfer Pricing India — Form 3CEB, Master File & CbCR | NumberIQ",
    metaDescription:
      "Transfer pricing compliance in India — arm's length pricing under Rule 10B, Form 3CEB certification, Master File, CbCR thresholds, safe harbour, APA and secondary adjustment.",
    lede: "Every international transaction between associated enterprises must be priced at arm's length. The documentation burden is layered, the deadlines are staggered, and the penalties for getting the paperwork wrong are levied independently of whether the pricing itself was defensible.",
    chips: ["Form 3CEB", "Master File", "CbCR", "Safe Harbour", "APA"],
    stats: [
      { value: "6", label: "Prescribed methods under Rule 10B" },
      { value: "31 Oct", label: "Form 3CEB due date" },
      { value: "₹500 Cr", label: "Master File revenue threshold" },
      { value: "2%", label: "Penalty on unreported transactions" },
    ],
    overviewHeading: "How Transfer Pricing Works in India",
    overview: [
      "Sections 92 to 92F require that income arising from an international transaction between associated enterprises be computed having regard to the arm's length price — the price that would have been charged had the same transaction taken place between unrelated parties. The provisions extend to specified domestic transactions as well, though the threshold for those has been raised over time and now catches far fewer taxpayers than it once did.",
      "Rule 10B prescribes six methods for determining the arm's length price: comparable uncontrolled price, resale price, cost plus, profit split, transactional net margin, and such other method as may be prescribed. No method enjoys statutory priority — the rule requires the most appropriate method having regard to the nature of the transaction and the availability of reliable data. In practice the transactional net margin method dominates Indian benchmarking because comparable data at transaction level is rarely available, but defaulting to it without documenting why the others were rejected is a recurring weakness in transfer pricing studies.",
      "Where more than one price is determined by the most appropriate method, the arm's length price is taken as the arithmetic mean, or where the dataset is large enough, a range. A tolerance band applies, so a price falling within the permitted variation of the arm's length price is not adjusted. The band is notified annually and differs between wholesale trading and other transactions.",
      "The documentation obligation runs on three tiers. A local file under Rule 10D supports the pricing of the taxpayer's own transactions. A Master File in Form 3CEAA gives the group-level picture, required where consolidated group revenue exceeds ₹500 crore and the value of international transactions crosses the prescribed limits. Country-by-Country reporting in Form 3CEAD applies to groups with consolidated revenue above the notified threshold, and is exchanged between tax administrations rather than assessed locally.",
      "Two mechanisms exist to buy certainty in advance. Safe harbour rules under Rules 10TA to 10TG let eligible taxpayers accept prescribed margins for defined transaction categories, foreclosing dispute for those transactions at the cost of margins that are typically above what benchmarking would produce. An Advance Pricing Agreement binds the department to an agreed methodology for up to five future years, with rollback available for four prior years — slower and more expensive to obtain, but far more valuable where the transaction volume is large or the issue recurs.",
      "Where a primary adjustment is made and the resulting funds are not repatriated to India within the prescribed period, Section 92CE deems the excess to be an advance to the associated enterprise and imputes interest on it. This secondary adjustment catches taxpayers who accept an adjustment for the year in question without appreciating that the cash consequence continues to accrue until the money actually moves.",
    ],
    services: [
      {
        title: "Benchmarking & method selection",
        body: "Comparable searches, screening criteria and a documented rationale for the most appropriate method — including why the alternatives under Rule 10B were rejected, which is where studies are most often found wanting on scrutiny.",
      },
      {
        title: "Form 3CEB certification",
        body: "Accountant's report covering every international transaction and specified domestic transaction, reconciled to the books and to the tax return so the three sets of figures do not diverge.",
      },
      {
        title: "Master File & CbCR",
        body: "Form 3CEAA and Form 3CEAB filings for the group, and Form 3CEAD notification and reporting where the consolidated revenue threshold is crossed.",
      },
      {
        title: "Safe harbour & APA",
        body: "Evaluating whether prescribed safe harbour margins are worth the certainty they buy, and preparing Advance Pricing Agreement applications with rollback where the transaction is large or recurring.",
      },
      {
        title: "Assessment & dispute support",
        body: "Responses to TPO references, Dispute Resolution Panel objections, appeals before the Tribunal, and Mutual Agreement Procedure where the same income is taxed in two jurisdictions.",
      },
      {
        title: "Secondary adjustment planning",
        body: "Tracking repatriation timelines under Section 92CE so an accepted primary adjustment does not quietly generate imputed interest year after year.",
      },
    ],
    deadlinesHeading: "Transfer Pricing Compliance Calendar",
    deadlines: [
      { form: "Form 3CEB", what: "Accountant's report on international and specified domestic transactions", due: "31 October" },
      { form: "Form 3CEAB", what: "Intimation of the constituent entity designated to file the Master File", due: "One month before the 3CEAA due date" },
      { form: "Form 3CEAA", what: "Master File — Part A by every constituent entity, Part B on crossing thresholds", due: "30 November" },
      { form: "Form 3CEAC", what: "Notification by an Indian constituent entity of the CbCR filing entity", due: "Two months before the CbCR due date" },
      { form: "Form 3CEAD", what: "Country-by-Country Report", due: "12 months from the end of the reporting accounting year" },
      { form: "Form 3CEFA", what: "Option to apply safe harbour rules", due: "On or before the return due date" },
    ],
    pitfallsHeading: "Where Transfer Pricing Compliance Goes Wrong",
    pitfalls: [
      "Filing Form 3CEB with figures that do not reconcile to the audited financials or to the tax return — the mismatch is the first thing a TPO reconciles.",
      "Selecting TNMM by default without recording why CUP, resale price or cost plus were considered and rejected.",
      "Treating the Master File as a group problem and missing that Part A of Form 3CEAA is due from every constituent entity regardless of threshold.",
      "Overlooking Section 92CE — accepting a primary adjustment while leaving the funds abroad, so imputed interest accrues silently.",
      "Applying a benchmarking study prepared for an earlier year without refreshing the comparable set for the year under review.",
      "Missing that penalty under Section 271AA for failure to report a transaction is levied on the transaction value and is independent of whether the pricing was at arm's length.",
    ],
    faqs: [
      {
        question: "Who has to file Form 3CEB?",
        answer:
          "Every person who has entered into an international transaction with an associated enterprise, or a specified domestic transaction above the threshold, during the year. There is no monetary floor for international transactions — a single transaction of any value triggers the obligation, which is why small Indian subsidiaries of foreign groups are caught even where the amounts are modest.",
      },
      {
        question: "Which transfer pricing method should I use?",
        answer:
          "Rule 10B does not rank the six methods; it requires the most appropriate method having regard to the nature of the transaction, the availability of reliable comparable data, and the degree of comparability. TNMM predominates in India because transaction-level comparables are scarce, but the study must record why the alternatives were rejected rather than simply asserting TNMM.",
      },
      {
        question: "What is a secondary adjustment under Section 92CE?",
        answer:
          "Where a primary transfer pricing adjustment is made and the corresponding money is not repatriated to India within the prescribed time, the excess is treated as an advance made by the taxpayer to the associated enterprise, and interest is imputed on it. It converts a one-year adjustment into a recurring cash cost until the funds are actually brought back.",
      },
      {
        question: "Is safe harbour worth opting for?",
        answer:
          "It depends on the gap between the prescribed margin and what genuine benchmarking would support. Safe harbour margins are deliberately set above market to compensate the department for giving up the right to adjust, so it buys certainty at a real tax cost. It suits taxpayers with modest transaction values who want to avoid the cost of a study and the risk of dispute; it rarely suits high-volume transactions.",
      },
      {
        question: "How does an Advance Pricing Agreement differ from safe harbour?",
        answer:
          "An APA is negotiated rather than prescribed. It binds the department to an agreed methodology for up to five future years, with rollback available for four prior years, and it can be unilateral, bilateral or multilateral. It takes considerably longer and costs more to obtain than electing safe harbour, but the agreed margin reflects the taxpayer's actual facts rather than a notified rate.",
      },
      {
        question: "What is the penalty for transfer pricing non-compliance?",
        answer:
          "Section 271AA levies penalty for failure to keep documentation or to report a transaction, computed on the transaction value. Section 271BA levies a separate penalty for failure to furnish Form 3CEB. These are documentation penalties — they apply regardless of whether the pricing itself was at arm's length, which is why procedural compliance matters independently of the substantive position.",
      },
      {
        question: "Does transfer pricing apply to domestic transactions?",
        answer:
          "Only to specified domestic transactions above the prescribed aggregate threshold. The scope was narrowed considerably from the original provisions, and most purely domestic related-party dealings now fall outside it. Where the threshold is crossed, the same methods and documentation requirements apply as for international transactions.",
      },
    ],
    relatedTools: [
      { slug: "statutory-time-machine", name: "Statutory Time Machine" },
      { slug: "litigation-cost-calculator", name: "Litigation Cost Calculator" },
      { slug: "appeal-deadline-calculator", name: "Appeal Deadline Calculator" },
    ],
  },

  "international-tax": {
    slug: "international-tax",
    name: "International Tax",
    eyebrow: "DTAA · Section 90 & 195 · POEM",
    tone: "#38e1d6",
    icon: "IX",
    metaTitle: "International Tax India — DTAA, Section 195, POEM & PE | NumberIQ",
    metaDescription:
      "Cross-border tax in India — DTAA treaty relief under Section 90, withholding under Section 195, Form 15CA/15CB, permanent establishment, POEM residence and equalisation levy.",
    lede: "Cross-border tax turns on two questions asked in order: does India have the right to tax this income at all, and if so, has the treaty reduced that right. Getting the sequence wrong is what produces both over-withholding and unexpected demands.",
    chips: ["DTAA", "Section 195", "PE", "POEM", "15CA/15CB"],
    stats: [
      { value: "90+", label: "Comprehensive tax treaties" },
      { value: "s.195", label: "Withholding on non-resident payments" },
      { value: "Form 10F", label: "Required alongside the TRC" },
      { value: "182", label: "Days for individual residence" },
    ],
    overviewHeading: "How Cross-Border Taxation Works in India",
    overview: [
      "India taxes residents on worldwide income and non-residents on income that accrues, arises, or is deemed to accrue or arise in India. The deeming provisions in Section 9 do most of the work in practice — they bring business connection, interest, royalty and fees for technical services within the Indian net even where the recipient never sets foot in the country.",
      "Where a tax treaty applies, Section 90 lets the taxpayer choose whichever of the Act or the treaty is more beneficial, provision by provision. That choice is conditional: a Tax Residency Certificate from the other state is mandatory, and Form 10F must be furnished electronically alongside it. The practical failure point is rarely the substantive treaty analysis — it is that the TRC is obtained late, or does not cover the relevant period, and treaty relief is denied on that ground alone.",
      "Permanent establishment is where most cross-border disputes actually live. A fixed place of business, a dependent agent habitually concluding contracts, a service PE arising from personnel present beyond the treaty threshold, or a construction site exceeding the specified duration will each create a taxable presence. Once a PE exists, profits attributable to it are taxable in India, and the attribution exercise is itself frequently contested.",
      "Residence for a company turns on place of effective management under Section 6(3). A company incorporated abroad becomes an Indian resident, taxable on worldwide income, if its key management and commercial decisions are in substance made in India. Board minutes recording meetings held overseas carry limited weight where the decisions were actually taken elsewhere.",
      "Payments to non-residents attract withholding under Section 195 at the rates in force, read with the treaty where beneficial. The obligation arises on any sum chargeable to tax, and the payer who under-deducts becomes an assessee in default with the disallowance and interest consequences that follow. Form 15CA and, where required, a Form 15CB certificate from an accountant must accompany the remittance.",
      "Beyond the treaty framework sit a set of unilateral measures: equalisation levy on specified digital transactions, the General Anti-Avoidance Rules, and the treaty modifications introduced through the Multilateral Instrument, including the principal purpose test that can deny treaty benefits where obtaining them was a principal purpose of the arrangement.",
    ],
    services: [
      {
        title: "Treaty positions & relief",
        body: "Article-by-article analysis under the relevant DTAA, TRC and Form 10F compliance, and documentation of the beneficial ownership position where the treaty requires it.",
      },
      {
        title: "Section 195 withholding",
        body: "Determining whether a sum is chargeable to tax, the correct rate read with the treaty, lower deduction certificates under Section 197, and Form 15CA/15CB certification for the remittance.",
      },
      {
        title: "Permanent establishment analysis",
        body: "Assessing fixed place, agency, service and construction PE exposure against the specific treaty, and profit attribution where a PE is found to exist.",
      },
      {
        title: "POEM & residence",
        body: "Testing where key management and commercial decisions are substantively made, and structuring governance so the residence position matches the documentation.",
      },
      {
        title: "Expatriate & secondment",
        body: "Residence determination, salary sourcing, tie-breaker analysis under the treaty, social security agreements, and the service PE risk that secondment arrangements frequently create.",
      },
      {
        title: "BEPS, MLI & GAAR",
        body: "Principal purpose test exposure, treaty modifications flowing from the Multilateral Instrument, and anti-avoidance analysis for holding and financing structures.",
      },
    ],
    deadlinesHeading: "Cross-Border Compliance Calendar",
    deadlines: [
      { form: "Form 15CA / 15CB", what: "Declaration and accountant's certificate for a foreign remittance", due: "Before the remittance is made" },
      { form: "Form 10F", what: "Electronic filing alongside the Tax Residency Certificate", due: "Before claiming treaty relief" },
      { form: "Form 27Q", what: "Quarterly TDS return for payments to non-residents", due: "Quarterly, per the TDS calendar" },
      { form: "Form 3CEB", what: "Where the non-resident is an associated enterprise", due: "31 October" },
      { form: "Form 67", what: "Foreign tax credit claim", due: "On or before the return due date" },
      { form: "Section 197 certificate", what: "Application for lower or nil withholding", due: "In advance of the payment" },
    ],
    pitfallsHeading: "Where Cross-Border Positions Fail",
    pitfalls: [
      "Claiming treaty relief without a valid TRC covering the relevant period, or without filing Form 10F — relief is denied on the procedural failure regardless of the merits.",
      "Treating Section 195 as applying only to the taxable portion, when the obligation arises on any sum chargeable and a Section 195(2) application is the correct route to reduce it.",
      "Seconding personnel to India without testing service PE exposure under the applicable treaty threshold.",
      "Recording board meetings abroad while the commercial decisions are in fact taken in India, leaving the POEM position unsupported.",
      "Missing Form 67 for foreign tax credit, which is a condition of the claim rather than a formality.",
      "Assuming the treaty as originally signed still applies, without checking how the Multilateral Instrument has modified it.",
    ],
    faqs: [
      {
        question: "When is a Tax Residency Certificate required?",
        answer:
          "Whenever treaty relief is claimed under Section 90. The TRC must be issued by the tax authority of the other contracting state and must cover the period for which relief is sought. Form 10F must be furnished electronically alongside it. Obtaining the TRC after the assessment has begun is a common and usually fatal sequencing error.",
      },
      {
        question: "What creates a permanent establishment in India?",
        answer:
          "It depends on the specific treaty, but broadly: a fixed place of business through which the enterprise operates, a dependent agent habitually exercising authority to conclude contracts, the presence of personnel furnishing services beyond the treaty's day threshold, or a building site or installation project exceeding the specified duration. Preparatory and auxiliary activities are generally excluded.",
      },
      {
        question: "How does POEM affect a foreign company?",
        answer:
          "Under Section 6(3), a company incorporated outside India is resident in India if its place of effective management — where key management and commercial decisions necessary for the conduct of the business as a whole are in substance made — is in India. The consequence is significant: the company becomes taxable in India on its worldwide income rather than only on Indian-source income.",
      },
      {
        question: "Do I need Form 15CB for every foreign remittance?",
        answer:
          "No. Form 15CB, the accountant's certificate, is required where the remittance is chargeable to tax and exceeds the prescribed threshold. Certain categories of remittance listed in the rules are exempt from the 15CA/15CB process entirely, and a Part A declaration suffices below the threshold. The exemption list should be checked before commissioning a certificate.",
      },
      {
        question: "What is the principal purpose test?",
        answer:
          "A treaty anti-abuse rule introduced through the Multilateral Instrument. It denies a treaty benefit where, having regard to all relevant facts, obtaining that benefit was one of the principal purposes of the arrangement, unless granting it would be in accordance with the object and purpose of the relevant provisions. It applies alongside domestic GAAR.",
      },
      {
        question: "Can I take credit for tax paid abroad?",
        answer:
          "Yes, under Section 90 where a treaty applies or Section 91 where it does not, subject to Rule 128. The credit is limited to the Indian tax attributable to the doubly taxed income. Form 67 must be filed, and the courts have divided on whether late filing is fatal — the safe course is to file it on or before the return due date.",
      },
      {
        question: "How is equalisation levy different from income tax?",
        answer:
          "It is a separate levy outside the Income-tax Act, charged on specified digital transactions and collected from the payer. Because it sits outside the Act, it generally falls outside the scope of tax treaties, so treaty relief is not available against it and foreign tax credit in the recipient's home country is often unavailable too.",
      },
    ],
    relatedTools: [
      { slug: "lrs-tcs-calculator", name: "LRS TCS Calculator" },
      { slug: "statutory-time-machine", name: "Statutory Time Machine" },
      { slug: "gstin-validator", name: "GSTIN Validator" },
    ],
  },

  fema: {
    slug: "fema",
    name: "FEMA & Regulatory",
    eyebrow: "FEMA 1999 · FDI · ODI · ECB",
    tone: "#a855f7",
    icon: "FX",
    metaTitle: "FEMA Compliance India — FDI, ODI, ECB, FC-GPR & FLA Return | NumberIQ",
    metaDescription:
      "FEMA compliance for Indian businesses — FDI reporting in FC-GPR and FC-TRS, overseas investment, external commercial borrowings, the annual FLA return, LRS limits and compounding.",
    lede: "FEMA is a civil statute, not a criminal one — but its reporting deadlines are short, they run from the transaction rather than the year end, and a contravention persists until it is compounded. Most FEMA problems are late filings rather than prohibited transactions.",
    chips: ["FC-GPR", "FC-TRS", "ODI", "ECB", "FLA Return"],
    stats: [
      { value: "30 days", label: "FC-GPR filing window" },
      { value: "60 days", label: "FC-TRS filing window" },
      { value: "15 July", label: "Annual FLA return" },
      { value: "$250k", label: "LRS limit per year" },
    ],
    overviewHeading: "How FEMA Regulates Cross-Border Money",
    overview: [
      "The Foreign Exchange Management Act 1999 replaced a prohibitive regime with a regulatory one. Current account transactions are generally permitted subject to reasonable restrictions, while capital account transactions are permitted only to the extent specified in the rules and regulations made under the Act. The consequence for practice is that the question is rarely whether a transaction is legal — it is whether it has been correctly routed, reported and documented within the window.",
      "Inbound investment runs through the FDI policy, which sets sector-specific caps, entry routes and conditions. Most sectors are on the automatic route, requiring no prior approval but full reporting; sensitive sectors require government approval. Investment from countries sharing a land border with India requires government approval regardless of sector, and the beneficial ownership test for that restriction reaches through intermediate holding structures.",
      "The reporting deadlines are the operative constraint. Form FC-GPR must be filed within thirty days of allotment of shares to a non-resident. Form FC-TRS covers transfer of shares between a resident and a non-resident and must be filed within sixty days of receipt of consideration. Both run on the single master form on the RBI's FIRMS portal, and both are missed routinely because the commercial team completes the transaction without telling finance.",
      "Outbound investment is governed by the Overseas Investment Rules and Regulations of 2022, which consolidated a fragmented framework. The distinction between overseas direct investment and overseas portfolio investment now determines the route, the limits and the reporting. Form FC is filed for the investment itself, and an Annual Performance Report is due each year for as long as the overseas entity is held.",
      "External commercial borrowings are subject to a framework governing eligible borrowers and lenders, minimum average maturity, all-in-cost ceilings and end-use restrictions. A Loan Registration Number must be obtained before drawdown, and monthly ECB-2 returns run for the life of the facility.",
      "Individuals remit under the Liberalised Remittance Scheme, currently up to USD 250,000 per financial year for permitted current and capital account transactions. Remittances under the scheme attract TCS at rates that vary by purpose, with concessional treatment for education and medical remittances.",
      "Where a contravention has occurred, compounding under Section 13 provides a route to regularise it. The application is made to the Reserve Bank, the contravention is quantified and a compounding amount is levied. Voluntary disclosure before detection is treated more favourably, and the contravention continues to subsist — with the amount continuing to build — until the application is made.",
    ],
    services: [
      {
        title: "FDI structuring & reporting",
        body: "Sector cap and entry route analysis, pricing guidelines compliance, and FC-GPR and FC-TRS filings on the FIRMS portal within the statutory windows.",
      },
      {
        title: "Overseas investment",
        body: "ODI versus OPI classification under the 2022 rules, Form FC filing, Unique Identification Number, and the Annual Performance Report for each overseas entity.",
      },
      {
        title: "External commercial borrowings",
        body: "Eligibility, minimum average maturity and all-in-cost testing, Loan Registration Number applications, end-use compliance and monthly ECB-2 returns.",
      },
      {
        title: "Annual returns",
        body: "The FLA return to the Reserve Bank each July for every entity holding or having issued foreign investment, including in years with no fresh transaction.",
      },
      {
        title: "Compounding",
        body: "Quantifying a contravention, preparing the compounding application, and representing before the compounding authority — with voluntary disclosure ahead of detection wherever possible.",
      },
      {
        title: "Valuation & pricing",
        body: "Pricing guideline compliance on issue and transfer of shares to and from non-residents, and the valuation certification the guidelines require.",
      },
    ],
    deadlinesHeading: "FEMA Reporting Calendar",
    deadlines: [
      { form: "Form FC-GPR", what: "Issue of shares to a person resident outside India", due: "Within 30 days of allotment" },
      { form: "Form FC-TRS", what: "Transfer of shares between a resident and a non-resident", due: "Within 60 days of receipt of consideration" },
      { form: "FLA Return", what: "Annual return on foreign liabilities and assets", due: "15 July each year" },
      { form: "Form ODI / FC", what: "Overseas direct investment reporting", due: "At the time of the remittance or investment" },
      { form: "Annual Performance Report", what: "Annual report for each overseas entity held", due: "31 December each year" },
      { form: "Form ECB-2", what: "Monthly return on external commercial borrowings", due: "Within 7 working days of month end" },
    ],
    pitfallsHeading: "Where FEMA Compliance Slips",
    pitfalls: [
      "Completing an allotment or share transfer commercially and reporting it only at year end, by which time the 30 or 60 day window has long closed.",
      "Skipping the FLA return in a year with no fresh transaction — it is due from every entity holding foreign investment, not only those that transacted.",
      "Missing the land-border approval requirement because the immediate investor is elsewhere, without testing beneficial ownership up the chain.",
      "Pricing an issue or transfer without the valuation the pricing guidelines require, which cannot be cured retrospectively.",
      "Letting a contravention run unaddressed on the assumption it is minor — it subsists until compounded, and voluntary disclosure is treated far more favourably than detection.",
      "Overlooking the Annual Performance Report for a dormant overseas subsidiary that is still held.",
    ],
    faqs: [
      {
        question: "What is the difference between FC-GPR and FC-TRS?",
        answer:
          "FC-GPR reports a fresh issue of shares by an Indian company to a person resident outside India, and is due within thirty days of allotment. FC-TRS reports a transfer of existing shares between a resident and a non-resident, and is due within sixty days of receipt of consideration. Issue and transfer are distinct events with different forms and different windows.",
      },
      {
        question: "Who has to file the FLA return?",
        answer:
          "Every Indian company, LLP or other entity that has received foreign direct investment or made overseas direct investment in any prior year, and still holds it. The obligation does not depend on activity during the year — an entity with foreign investment on its books must file by 15 July even if nothing happened that year. This is the single most commonly missed FEMA filing.",
      },
      {
        question: "What happens if a FEMA filing is late?",
        answer:
          "It is a contravention that continues to subsist until regularised. The route is compounding under Section 13: the contravention is quantified and a compounding amount is levied by the Reserve Bank. Because the amount is influenced by the duration and by whether disclosure was voluntary, a late filing addressed promptly and voluntarily costs materially less than one discovered on inspection.",
      },
      {
        question: "What is the LRS limit?",
        answer:
          "Currently USD 250,000 per financial year per individual, for permitted current and capital account transactions. Remittances attract TCS at rates that vary by purpose, with concessional treatment for education funded by an education loan and for medical remittances. The limit applies per individual, so family members have separate entitlements.",
      },
      {
        question: "Do I need government approval for foreign investment?",
        answer:
          "Most sectors are on the automatic route and need no prior approval, though reporting remains mandatory. Sensitive sectors require government approval, and any investment from an entity of a country sharing a land border with India — or where the beneficial owner is situated in such a country — requires approval regardless of sector. The beneficial ownership test looks through intermediate holding structures.",
      },
      {
        question: "Is a FEMA contravention a criminal offence?",
        answer:
          "No. FEMA is a civil statute and contraventions are dealt with by penalty and compounding rather than prosecution, which was the significant change from the earlier FERA regime. That said, penalties can be substantial, and specified serious matters can attract action under other statutes, so the civil character should not be mistaken for a low-consequence one.",
      },
      {
        question: "What is an Annual Performance Report?",
        answer:
          "An annual filing required for every overseas entity in which an Indian party holds an overseas direct investment, based on the audited accounts of that entity. It is due by 31 December each year and continues for as long as the investment is held — including for dormant or loss-making entities, which is where it is most often forgotten.",
      },
    ],
    relatedTools: [
      { slug: "lrs-tcs-calculator", name: "LRS TCS Calculator" },
      { slug: "due-date-calendar", name: "Compliance Due Date Calendar" },
      { slug: "statutory-time-machine", name: "Statutory Time Machine" },
    ],
  },

  "tax-audit": {
    slug: "tax-audit",
    name: "Tax Audit",
    eyebrow: "Section 44AB · Form 3CA / 3CB & 3CD",
    tone: "#34d399",
    icon: "AU",
    metaTitle: "Tax Audit under Section 44AB — Limits, Form 3CD & Due Date | NumberIQ",
    metaDescription:
      "Tax audit in India under Section 44AB — turnover thresholds including the enhanced limit on the 5% cash test, Form 3CA/3CB and 3CD clauses, due dates and penalty under Section 271B.",
    lede: "The tax audit threshold is not one number. It moves with how much of your turnover is settled in cash, it differs for professionals, and it is displaced entirely where a presumptive scheme applies — which is why eligibility is decided far more often on the cash test than on the headline limit.",
    chips: ["Section 44AB", "Form 3CD", "3CA / 3CB", "Section 271B"],
    stats: [
      { value: "₹1 Cr", label: "Basic business threshold" },
      { value: "₹10 Cr", label: "Enhanced limit on the 5% cash test" },
      { value: "₹50 L", label: "Professional threshold" },
      { value: "0.5%", label: "Penalty, capped at ₹1.5 lakh" },
    ],
    overviewHeading: "When a Tax Audit Is Required",
    overview: [
      "Section 44AB requires a person carrying on business to get accounts audited where total sales, turnover or gross receipts exceed ₹1 crore in the previous year. That basic threshold is displaced by a substantially higher one — ₹10 crore — where aggregate cash receipts and aggregate cash payments each do not exceed 5% of the respective totals. The enhanced limit is not automatic: both legs of the cash test must be satisfied, and failing either one drops the taxpayer back to the ₹1 crore threshold.",
      "For a person carrying on a profession the threshold is gross receipts exceeding ₹50 lakh, with an enhanced limit of ₹75 lakh available on the same 5% cash basis. Professions are those notified for this purpose, and the distinction between business and profession is occasionally itself the question.",
      "A separate trigger operates through the presumptive schemes. A person who has opted into Section 44AD and subsequently declares income lower than the presumed rate, whose total income exceeds the basic exemption limit, must maintain books and get them audited — regardless of turnover. The same logic applies under Section 44ADA for professionals. This is the trigger that catches small taxpayers who assume they are below the threshold and therefore outside the audit net.",
      "The report is furnished in Form 3CA where the accounts are already required to be audited under another law, typically the Companies Act, and in Form 3CB where they are not. In both cases the substantive content sits in the annexed Form 3CD, a detailed statement of particulars running to more than forty clauses covering payments attracting disallowance, loans and deposits, depreciation, TDS compliance, and much else.",
      "Form 3CD is where the tax audit does its real work. Clauses on payments to micro and small enterprises, on cash transactions, on TDS deduction and deposit, and on amounts inadmissible under Section 40 or 43B feed directly into the computation and into subsequent scrutiny. A clause reported incorrectly does not merely misstate the report — it frequently produces the addition.",
      "Failure to get accounts audited or to furnish the report attracts penalty under Section 271B at 0.5% of turnover or gross receipts, subject to a ceiling of ₹1,50,000. Section 273B provides relief where the taxpayer shows reasonable cause, and reasonable cause has been accepted in circumstances ranging from the illness of the accountant to genuine confusion over whether the threshold was crossed.",
    ],
    services: [
      {
        title: "Threshold determination",
        body: "Testing turnover against the correct limit, including both legs of the 5% cash test that unlocks the enhanced ₹10 crore and ₹75 lakh thresholds.",
      },
      {
        title: "Form 3CD preparation",
        body: "Clause-by-clause completion with the underlying reconciliations, so the particulars agree to the books, the TDS returns and the tax computation.",
      },
      {
        title: "Presumptive interaction",
        body: "Assessing whether declaring below the presumed rate under Section 44AD or 44ADA triggers the audit obligation independently of turnover.",
      },
      {
        title: "Disallowance review",
        body: "Section 40(a) TDS defaults, Section 43B payments allowable only on actual payment including dues to micro and small enterprises, and cash transaction limits under Sections 40A(3) and 269ST.",
      },
      {
        title: "Statutory reconciliation",
        body: "Aligning turnover as reported in the GST returns, the audited financial statements and Form 3CD, since divergence between the three is a standard scrutiny trigger.",
      },
      {
        title: "Penalty defence",
        body: "Reasonable cause representations under Section 273B where the audit or the report was delayed.",
      },
    ],
    deadlinesHeading: "Tax Audit Calendar",
    deadlines: [
      { form: "Form 3CA / 3CB with 3CD", what: "Tax audit report for a taxpayer not subject to transfer pricing", due: "30 September" },
      { form: "Return of income", what: "ITR for a taxpayer subject to tax audit", due: "31 October" },
      { form: "Form 3CEB", what: "Where international or specified domestic transactions exist", due: "31 October" },
      { form: "Return of income", what: "ITR where Form 3CEB applies", due: "30 November" },
      { form: "Form 10B / 10BB", what: "Audit report for a trust or institution", due: "As prescribed for the category" },
      { form: "Revised report", what: "Revision of the audit report where accounts are revised", due: "Before the end of the relevant assessment year" },
    ],
    pitfallsHeading: "Where Tax Audits Go Wrong",
    pitfalls: [
      "Applying the ₹10 crore threshold after testing only cash receipts — the enhanced limit requires both cash receipts and cash payments to be within 5%.",
      "Assuming a turnover below ₹1 crore means no audit, when declaring below the presumptive rate under Section 44AD or 44ADA triggers it independently.",
      "Reporting turnover in Form 3CD that does not agree to the GST returns, which is among the most reliable scrutiny triggers available to the department.",
      "Treating Form 3CD as a compliance formality when its clauses on TDS, cash transactions and Section 43B feed directly into disallowance.",
      "Overlooking amounts payable to micro and small enterprises, which are allowable only on actual payment within the statutory period.",
      "Missing that the audit report deadline and the return deadline are different dates, and that the report must precede the return.",
    ],
    faqs: [
      {
        question: "What is the tax audit limit for FY 2026-27?",
        answer:
          "For business, ₹1 crore of turnover, rising to ₹10 crore where both aggregate cash receipts and aggregate cash payments do not exceed 5% of the respective totals. For a profession, ₹50 lakh of gross receipts, rising to ₹75 lakh on the same cash basis. Failing either leg of the cash test returns the taxpayer to the lower threshold.",
      },
      {
        question: "Does the 5% cash test apply to receipts only?",
        answer:
          "No, and this is the most consequential misunderstanding in the provision. Both aggregate cash receipts and aggregate cash payments must each be within 5% of the respective totals. A business with negligible cash sales but substantial cash expenditure fails the test and remains on the ₹1 crore threshold.",
      },
      {
        question: "Can a tax audit be required below the turnover threshold?",
        answer:
          "Yes. A taxpayer who has opted into Section 44AD and later declares income below the presumed rate, whose total income exceeds the basic exemption limit, must maintain books and have them audited irrespective of turnover. Section 44ADA operates similarly for professionals. Turnover is therefore not the only route into the audit net.",
      },
      {
        question: "What is the difference between Form 3CA and Form 3CB?",
        answer:
          "Form 3CA is used where the accounts are already required to be audited under another law — most commonly a company audited under the Companies Act. Form 3CB is used where no such requirement exists, typically for a proprietorship or a firm. Both annex the same Form 3CD, which carries the substantive particulars.",
      },
      {
        question: "What is the penalty for not getting a tax audit done?",
        answer:
          "Section 271B levies 0.5% of total sales, turnover or gross receipts, subject to a maximum of ₹1,50,000. Section 273B provides that no penalty shall be imposed where the taxpayer proves reasonable cause, and reasonable cause has been accepted in a range of circumstances including genuine uncertainty about whether the threshold was crossed.",
      },
      {
        question: "Can a tax audit report be revised?",
        answer:
          "Yes, where the accounts are revised or a disallowance requires the particulars to be corrected — for example where a payment covered by Section 40 or 43B is subsequently made. The revised report should be furnished before the end of the relevant assessment year and should record the reason for revision.",
      },
      {
        question: "Does turnover for tax audit include GST?",
        answer:
          "The treatment depends on how the tax is accounted for, and the guidance issued by the Institute should be followed consistently rather than switched between years. What matters practically is that turnover reported in Form 3CD reconciles to the GST returns and to the audited financial statements — an unexplained difference between the three is a standard scrutiny trigger.",
      },
    ],
    relatedTools: [
      { slug: "presumptive-tax-optimiser", name: "Presumptive Tax Optimiser" },
      { slug: "msme-payment-tracker-calculator", name: "MSME Payment Tracker" },
      { slug: "due-date-calendar", name: "Compliance Due Date Calendar" },
    ],
  },
};

export const practiceSlugs = Object.keys(practiceAreas);
