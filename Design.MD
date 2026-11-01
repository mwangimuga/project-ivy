# PROJECT_IVY_SPEC

## 1. System Overview & Aesthetic
Project Ivy is an enterprise-level, elegant real-estate management and transaction platform. 
*   **Brand Aesthetic:** Warm minimalism. Deep forest greens, muted creams, charcoal typography, and generous whitespace. High-end hospitality feel.
*   **UI/UX Engine:** Utilize GSAP for smooth scroll animations and page transitions.

## 2. Core Tech Stack
*   **Frontend/Backend:** Next.js (App Router) using TypeScript.
*   **Styling:** Tailwind CSS + GSAP.
*   **Database/Auth:** Supabase (PostgreSQL).
*   **Payments:** Paystack API & Webhooks.
*   **3D Viewer:** React Three Fiber (for .gltf/.glb virtual tours).

## 3. User Roles & Authentication
All accounts MUST require mandatory Email Verification before accessing any protected routes.

1.  **Super Agent (System Admin):** 
    *   Hardcode an initial seed user: `Username: Mark`, `Password: 12345`.
    *   System must prompt Mark to change the password immediately upon first verified login.
    *   Permissions: Global visibility, views the system's ledger account, handles manual master withdrawals.
2.  **Project Managers:** Manage operations, approve listings, monitor portfolios.
3.  **Landlords:** Customize listings, view net revenue after system cuts, and request withdrawals.
4.  **Maintenance (Caretakers):** Field workers who view tickets and update issue statuses.
5.  **Clients (Leasers):** Browse listings, execute leases, pay rent, view ledgers, and chat.

## 4. The Unified Operations Chat
Implement a real-time messaging system using Supabase Realtime (WebSockets).
Clients can open context-specific chat streams tied to their active lease:
*   **Maintenance:** Routes to Caretakers.
*   **Security:** Routes to Project Managers.
*   **Billing:** Routes to the Project Manager/Accounting.

## 5. Dynamic Custom Listing Builder
Landlords/Managers can create listings with dynamic guidelines based on the property type.
Include a media upload module targeting Supabase Storage for images and 3D Virtual Tours (.glb files). The frontend must use React Three Fiber to allow users to interact with uploaded 3D tours.

Dynamic Form Logic by Type:
*   **Apartments and Houses:** Floor plans, bedrooms, utilities, security deposits.
*   **Student Housing:** Per-bed pricing, shared amenities, gender designations, term lengths.
*   **Commercial Households/Leaseholds:** Parking ratios, CAM (Common Area Maintenance) splits, zoning permissions.
*   **Lands & Developments:** Acreage, title deed status, GIS coordinates, zoning use.
*   **Airbnbs:** Calendar booking matrix, per-night rates, cleaning fees.

## 6. Financial Engine & Paystack Integration
The system handles localized payments (M-Pesa/Card) via Paystack and manages a split-revenue ledger.

**A. Real-Time Balance Logic:**
*   Set up a Paystack Webhook endpoint (`/api/webhooks/paystack`).
*   Validate the `x-paystack-signature` using HMAC SHA512.
*   On a successful charge, update the Client's ledger via Supabase Realtime so the UI refreshes instantly without a page reload.
*   **Overpayment Logic:** If a client pays more than their current arrears, the balance MUST roll into the negative (e.g., `-1000 KSh`), acting as a credit for the next cycle.

**B. Transaction & Withdrawal Tiering Engine:**
When a transaction occurs, the system splits the money into a `system_balance` (for the Super Agent) and a `landlord_balance`. 
Implement the following mathematical logic in the database triggers or edge functions:

*   **Tier 1: 10,000 to 50,000 KSh**
    *   On Payment: 20 KSh is instantly debited to `system_balance`. The rest goes to `landlord_balance`.
    *   On Withdrawal: When Landlord withdraws, 2.0% of the withdrawal amount is debited to `system_balance`.
*   **Tier 2: 50,001 to 200,000 KSh**
    *   On Payment: 50 KSh is debited to `system_balance`.
    *   On Withdrawal: 2.5% is debited to `system_balance`.
*   **Tier 3: Above 200,000 KSh**
    *   On Payment: 500 KSh is debited to `system_balance`.
    *   On Withdrawal: 3.0% is debited to `system_balance`.

## 7. Execution Phasing (Antigravity Instructions)
Agent, execute this build in the following phases. Wait for my approval before moving to the next phase:
1.  **Phase 1:** Initialize Next.js, configure Tailwind, and scaffold the Supabase PostgreSQL schema (Tables: Users, Properties, Leases, Ledgers, Messages) with strict RLS policies. Include the seed logic for the Super Agent.
2.  **Phase 2:** Build the Authentication flow with Email Verification.
3.  **Phase 3:** Build the Dynamic Listing Builder and 3D Viewer component.
4.  **Phase 4:** Build the Financial Ledger system and Paystack Webhook integration with the exact transaction logic defined above.
5.  **Phase 5:** Implement the Real-time Chat and GSAP UI refinements.