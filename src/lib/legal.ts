/**
 * The legal text. Edit here — the /terms page and the acceptance dialog both
 * read from this file. When you change the substance (not typos), BUMP
 * TERMS_VERSION: every user is then asked to accept again before continuing.
 *
 * DRAFT NOTICE: this is a carefully drafted template written for how Project
 * Ivy actually works, but it is not legal advice. Have a Kenyan advocate review
 * it before you rely on it. Points they should look at are listed in the README.
 */
export const TERMS_VERSION = "1.0";
export const TERMS_EFFECTIVE = "27 October 2026";

export const OPERATOR = {
  name: "Infoma",
  product: "Project Ivy",
  email: "hello@infoma.tech",
  location: "Nairobi, Kenya",
  // Fill in your registered business name / number if you want it shown on the page.
  registration: "",
};

export type Audience = "all" | "landlord" | "client";
export interface LegalSection {
  id: string;
  title: string;
  audience: Audience;
  clauses: string[];
  kind?: "fees";
}

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    id: "about",
    title: "About these Terms",
    audience: "all",
    clauses: [
      "These Terms of Use (the “Terms”) are an agreement between you and Infoma, which operates Project Ivy (“Ivy”, “we”, “us”). They apply whenever you use Ivy’s website or apps, whether or not you have an account.",
      "By creating an account, by ticking “I agree”, or by continuing to use Ivy after we tell you the Terms have changed, you accept these Terms. If you do not accept them, do not use Ivy.",
      "Ivy has several kinds of user. A “Landlord” lists and lets property. A “Client” browses, applies for, rents and pays for property. “Staff” are the administrators and agents who run the platform (Super Agent, System Agent, Project Manager, Maintenance). One person can hold more than one role once we approve it; the terms for every role you hold apply to you.",
      "You confirm that you are at least 18 years old and able to enter into a binding contract. If you use Ivy for a company or another person, you confirm you are authorised to bind them, and “you” includes them.",
    ],
  },
  {
    id: "what-ivy-is",
    title: "What Ivy is, and is not",
    audience: "all",
    clauses: [
      "Ivy is software. It lets Landlords publish listings and receive applications, lets Clients apply, pay rent and communicate, and keeps a record of the money that moves through it.",
      "Ivy is not a party to any tenancy. A tenancy is a contract between the Landlord and the Client. We do not own, inspect or guarantee any listed property, and we do not guarantee that any Landlord, Client or listing is genuine, lawful or suitable.",
      "A “Verified landlord” badge means only that the Landlord submitted identity and ownership documents and our reviewers approved them on the date shown in our records. It is not a guarantee of title, solvency, quality or future conduct. Clients should still inspect the property and read the tenancy agreement before paying.",
      "Ivy’s staff do not give legal, tax or financial advice.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts, security and administrator access",
    audience: "all",
    clauses: [
      "Give accurate information and keep it up to date. Keep your password secret. You are responsible for everything done through your account.",
      "If a Landlord or an administrator creates an account for you, you will receive a temporary password that you must change at first sign-in. The person who created the account is responsible for the accuracy of the details they entered.",
      "For your protection you are signed out automatically after 20 minutes of inactivity.",
      "Administrators can see activity logs and, for support, security or legal reasons, can act on an account using a “log in as” function. Every use is recorded in an audit log. We use it for nothing else.",
      "We may suspend or close an account for breach of these Terms, suspected fraud, a legal requirement, or risk to other people. Where we lawfully can, we will tell you why.",
    ],
  },
  {
    id: "fees",
    title: "Fees and profit share",
    audience: "all",
    kind: "fees",
    clauses: [
      "Ivy charges two fees, both borne by the Landlord: a service fee on each rent payment processed through Ivy, and a withdrawal fee when a Landlord withdraws money to their own account. Ivy adds no fee for Clients on top of the rent and charges shown in the listing. Paystack, your card issuer or your mobile-money provider may apply their own charges, which are outside our control.",
      "When a Client pays, the service fee is deducted from that payment automatically and the remainder (the “Landlord share”) is credited to the Landlord’s balance in the Ivy ledger. The Landlord can see both amounts.",
      "The fee depends on the size of the payment or withdrawal, as set out in the table below. The service fee is a fixed amount per payment; the withdrawal fee is a percentage of the amount withdrawn.",
      "We may change the fees by giving at least 30 days’ notice on Ivy (and by email where we hold your address). A change applies only to payments and withdrawals made after it takes effect. If you do not accept a change you may stop using Ivy before it takes effect.",
      "Fees are not refunded once a payment has been processed, unless we agree otherwise in writing.",
    ],
  },
  {
    id: "payments",
    title: "Payments, autopay, invoices and receipts",
    audience: "all",
    clauses: [
      "Payments are processed by Paystack (card, M-Pesa and other methods Paystack offers). Paystack’s own terms and privacy notice apply to that processing. We do not see or store full card numbers.",
      "A payment counts once Paystack confirms it to us. Ivy then records it in the ledger and produces a receipt. A receipt confirms that a payment was recorded; it is not proof of ownership or of a tenancy.",
      "Autopay (cards only). If you turn it on, you authorise us to charge your saved card, through Paystack, the outstanding rent balance after each monthly rent charge, until you turn it off or the tenancy ends. You can turn it off at any time under Ledger. Mobile-money payments cannot be saved for autopay.",
      "Invoices. Landlords and managers may send you a payment request (invoice) through Paystack. Paying it settles the amount shown.",
      "Rent is charged monthly. A balance you owe stays recorded against your account after a tenancy ends and remains payable.",
      "Chargebacks, reversals and failed payments may be reversed in the ledger, and we may pause related withdrawals while they are resolved.",
      "Withdrawals (Landlords). A Landlord may ask to withdraw their available balance. Each request is reviewed and approved by Ivy staff and paid out through Paystack, less the withdrawal fee. We may delay or decline a withdrawal to investigate suspected fraud, a dispute or a chargeback, or to meet a legal duty. You must give correct payout details; we are not responsible for a payout sent to the details you gave us.",
      "We may hold back amounts where the law or a court order requires it.",
    ],
  },
  {
    id: "tenancies",
    title: "Tenancies: starting, ending, and automatic expiry",
    audience: "all",
    clauses: [
      "Starting. A Client applies for a unit; the Landlord’s team or an Ivy administrator approves; the tenancy becomes active and the unit shows as occupied.",
      "Timed tenancies end automatically at the end of the end date recorded for them, unless a new tenancy is agreed and approved. When a tenancy ends, the unit becomes available again, rent charges and autopay stop, and the Client’s access to that tenancy’s lease and chat closes. Unpaid balances remain payable.",
      "Ending early. A Landlord, a Project Manager acting for them, or an Ivy administrator may record the end of a tenancy using the “End tenancy” function, giving a reason and an end date that is no later than the date the tenancy already ends. A future end date works as a notice: the Client can see it and the tenancy ends automatically after that date. An end date of today ends it immediately. A notice can be withdrawn before it takes effect.",
      "Lawful process. The End tenancy function records a decision; it does not itself give anyone the right to end a tenancy. Whoever uses it confirms that they have given the notice required by the tenancy agreement and the law (which differs for residential and commercial premises) and that they have a lawful reason. Nobody may use Ivy, or anything done outside it, to lock a tenant out, remove their belongings, cut off water or electricity, or otherwise evict without lawful process. If you believe a tenancy has been ended unlawfully, tell us immediately and take legal advice; we may restore the record and suspend the user concerned while the matter is resolved.",
      "Disputes between a Landlord and a Client (rent, deposits, repairs, notice) are for them to resolve through the courts or tribunals that have jurisdiction. We may, but need not, help by providing records (ledger, receipts, messages, audit entries), and we cannot decide who is right.",
    ],
  },
  {
    id: "landlord-agreement",
    title: "Landlord Agreement",
    audience: "landlord",
    clauses: [
      "Verification. To publish listings you must complete verification: your legal name, national ID number, phone number, KRA PIN where applicable, an identity document, and proof that you may let the property (a title deed, a lease that allows you to sublet, or a written management mandate from the owner).",
      "You authorise us to review those documents, to check them against public registers and with the owner or the person who gave you authority, and to store them securely for as long as you are a user and afterwards for as long as the law requires or we need to resolve disputes.",
      "Forged, false or misleading documents will lead to permanent removal, suspension of withdrawals while we investigate, a report to the relevant authorities, and recovery of our losses as far as the law allows.",
      "Tell us promptly if ownership, your authority or your contact details change. We may ask you to verify again at any time.",
      "Listings must be accurate and complete: the rent, any refundable deposit, utility charges (electricity, water, garbage), the floor and unit, and any conditions. You must have the legal right to let the property and to use every photo, video and 3D tour you upload; you give us a non-exclusive licence to show them on Ivy.",
      "Properties must comply with the law, including planning, safety, habitability and non-discrimination rules. You must not charge anything that is not shown in the listing or the tenancy agreement.",
      "We may unpublish a listing, or suspend a Landlord, for breach of these Terms.",
      "You must give every Client a written tenancy agreement where the law requires one. Ivy’s lease record does not replace it.",
      "Deposits are governed by your tenancy agreement and the law. A refundable deposit paid through Ivy appears in the ledger as a payment; you are responsible for refunding it, less lawful deductions, when the tenancy ends. The fees in the schedule apply to every payment processed through Ivy, deposits included.",
      "You are responsible for tax on your rental income and for the acts of any Project Manager or other team member you create.",
      "While a tenancy that started through Ivy is active, you agree to collect its rent through Ivy so that the fees in these Terms are properly accounted for.",
    ],
  },
  {
    id: "client-terms",
    title: "Client terms",
    audience: "client",
    clauses: [
      "Information in your application must be true and complete. Applying does not guarantee a tenancy; the Landlord’s team may approve or decline.",
      "Before paying, read the tenancy agreement and check the listing, including the rent, deposit and utility charges.",
      "Pay for units listed on Ivy through Ivy. Payments made outside Ivy are not recorded and we cannot help with them.",
      "Pay rent on time, look after the property, and report maintenance problems through Ivy tickets.",
      "Messages and tickets on Ivy can be read by the Landlord’s team and Ivy staff and kept as records.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    audience: "all",
    clauses: [
      "Do not use Ivy to commit fraud, post fake or misleading listings, impersonate anyone, harass others, upload content you have no right to, scrape the service, introduce malware, or attempt to bypass security or access another person’s data.",
      "Do not use Ivy for anything unlawful. We may remove content and suspend accounts that break this rule, and may report serious cases to the authorities.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy and your data",
    audience: "all",
    clauses: [
      "What we collect: account details (name, username, email, role); profile and listing content; lease and payment records (not full card numbers); messages and maintenance tickets; for Landlords, the identity and ownership documents submitted for verification; and audit logs and technical data needed to run and secure the service.",
      "Why: to provide Ivy, process and record payments, verify Landlords, prevent fraud, comply with the law, and communicate with you. We do not sell personal data.",
      "Who sees it: only people who need it for those purposes — you, the Landlord and Client to a tenancy, the Landlord’s team, and Ivy staff. Verification documents are kept in a private store that only the Landlord who uploaded them and Ivy administrators can open.",
      "Who processes it for us: Supabase (database, sign-in and file storage), Vercel (hosting) and Paystack (payments). They process data under their own terms and security measures, and some may store data outside Kenya.",
      "Kenya’s Data Protection Act, 2019 gives you rights, including to know what we hold, to correct it, to object to certain uses, and to ask for deletion where we no longer need it. We keep records the law requires (such as financial records) even after deletion. To use your rights, email hello@infoma.tech.",
      "We take reasonable technical and organisational steps to protect data, but no system is completely secure. Tell us at once if you think your account has been compromised.",
    ],
  },
  {
    id: "liability",
    title: "Liability",
    audience: "all",
    clauses: [
      "Ivy is provided “as is”, as far as the law allows. We do not promise that it will be uninterrupted or error-free.",
      "Nothing in these Terms limits liability that the law does not allow to be limited, including for fraud or for death or personal injury caused by negligence.",
      "Subject to that, we are not responsible for the acts or omissions of Landlords, Clients or other users, for the condition or legal status of any property, for outages of payment or telecom providers, or for indirect or consequential losses; and our total liability to you for any claim is limited to the fees we received from you in the 12 months before the claim.",
      "You agree to compensate us for losses we suffer because you broke these Terms or the law, including by giving false listings, documents or information.",
    ],
  },
  {
    id: "general",
    title: "Changes, governing law and contact",
    audience: "all",
    clauses: [
      "We may update these Terms. When we do, we will show the new version and ask you to accept it before you continue. Fee changes also follow the 30 days’ notice in the fees section. The version number and date are shown at the top of this page, and we keep a record of when you accepted each version.",
      "These Terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction, subject to any mandatory rights you have as a consumer. Before starting proceedings, please contact us and try in good faith to resolve the matter.",
      "If any part of these Terms is found to be unenforceable, the rest continues to apply. A delay in enforcing a right is not a waiver of it.",
      "Contact: Infoma, Nairobi, Kenya — hello@infoma.tech.",
    ],
  },
];

/** Short plain-language points shown in the "please accept" dialog. */
export const GATE_SUMMARY: Record<"terms" | "landlord_agreement", string[]> = {
  terms: [
    "Ivy is software that connects landlords and clients. It is not a party to your tenancy.",
    "Landlords pay the fees — a service fee on each rent payment and a withdrawal fee. Clients pay no extra Ivy fee.",
    "Payments run through Paystack. Autopay (cards only) charges your saved card only if you switch it on.",
    "A tenancy can be ended by the landlord, their manager or an administrator — with the notice the law requires. Timed tenancies end automatically on their end date.",
    "Administrators can view audit logs and may use a recorded “log in as” function for support or security.",
    "We handle your data under Kenya’s Data Protection Act, 2019. See the Privacy section.",
  ],
  landlord_agreement: [
    "I have the legal right to let every property I list, and my verification documents are genuine.",
    "I will give lawful notice before ending a tenancy, and will never evict without lawful process.",
    "The service fee and withdrawal fee apply to every payment and withdrawal (see Fees).",
    "While a tenancy that started on Ivy is active, I will collect its rent through Ivy.",
    "I am responsible for tax on my rental income and for the team members I create.",
  ],
};
