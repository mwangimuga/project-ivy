"use client";

import { useEffect, useState, useCallback } from "react";
import { BadgeCheck, Clock, XCircle, Lock, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/components/ProjectIvy";
import { getErrorMessage } from "@/lib/errors";
import LoadingState from "@/components/ui/LoadingState";
import type { LandlordVerification, OwnershipBasis, Profile } from "@/lib/types/database";

const BASIS: { value: OwnershipBasis; label: string; hint: string }[] = [
  { value: "title_deed", label: "I own the property (title deed)", hint: "Upload the title deed or a recent official search." },
  { value: "lease_with_authority", label: "I lease it and may sublet", hint: "Upload your lease showing the right to sublet, or the owner’s written consent." },
  { value: "management_mandate", label: "I manage it for the owner", hint: "Upload the owner’s signed management mandate / letter of authority." },
];

const MAX_BYTES = 5 * 1024 * 1024;
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "");
const extOf = (f: File) => (f.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");

export default function LandlordVerificationCard({ profile, onChanged }: { profile: Profile; onChanged: () => void }) {
  const supabase = createClient();
  const [latest, setLatest] = useState<LandlordVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [legalName, setLegalName] = useState(profile.full_name);
  const [nationalId, setNationalId] = useState("");
  const [kra, setKra] = useState("");
  const [phone, setPhone] = useState("");
  const [basis, setBasis] = useState<OwnershipBasis>("title_deed");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [ownFile, setOwnFile] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("landlord_verifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1);
    setLatest(((data as LandlordVerification[]) || [])[0] || null);
    setLoading(false);
  }, [supabase, profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const pickFile = (setter: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > MAX_BYTES) {
      setNotice({ msg: `“${f.name}” is larger than 5 MB. Please upload a smaller scan or photo.`, type: "error" });
      e.target.value = "";
      return;
    }
    setNotice(null);
    setter(f);
  };

  const upload = async (file: File, tag: string) => {
    const path = `${profile.id}/${Date.now()}-${tag}.${extOf(file)}`;
    const { error } = await supabase.storage.from("verification-docs").upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (error) throw error;
    return path;
  };

  const submit = async () => {
    if (!idFile || !ownFile) return;
    setBusy(true);
    setNotice(null);
    try {
      const idPath = await upload(idFile, "id");
      const ownPath = await upload(ownFile, "ownership");
      const selfiePath = selfie ? await upload(selfie, "selfie") : null;
      const { error } = await supabase.from("landlord_verifications").insert({
        user_id: profile.id,
        legal_name: legalName.trim(),
        national_id_number: nationalId.trim(),
        kra_pin: kra.trim() || null,
        phone: phone.trim(),
        ownership_basis: basis,
        id_document_path: idPath,
        ownership_document_path: ownPath,
        selfie_path: selfiePath,
        status: "pending",
      });
      if (error) throw error;
      setNotice({ msg: "Submitted. An Ivy administrator will review your documents and you will see the result here.", type: "success" });
      setIdFile(null);
      setOwnFile(null);
      setSelfie(null);
      await load();
      onChanged();
    } catch (e) {
      setNotice({ msg: getErrorMessage(e, "We couldn’t submit your documents. Please try again."), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const verified = !!profile.landlord_verified;
  const canSubmit = legalName.trim().length >= 3 && nationalId.trim().length >= 6 && phone.trim().length >= 9 && !!idFile && !!ownFile;
  const showForm = !verified && (!latest || latest.status === "rejected");

  const input = { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, marginTop: 6, fontSize: 14, fontFamily: "inherit", background: C.cardBg, color: C.charcoal } as const;

  return (
    <div style={{ background: C.cardBg, borderRadius: 16, padding: 28, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <BadgeCheck size={16} /> Landlord verification
      </div>

      {loading ? (
        <LoadingState size="sm" label="Checking status" />
      ) : verified ? (
        <div style={{ background: "#D1FAE5", color: "#065F46", padding: "12px 16px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.6 }}>
          <strong>Verified landlord</strong>{profile.landlord_verified_at ? ` since ${fmtDate(profile.landlord_verified_at)}` : ""}. You can publish listings immediately, and a “Verified landlord” badge shows on them.
        </div>
      ) : latest?.status === "pending" ? (
        <div style={{ background: "#FEF3C7", color: "#92400E", padding: "12px 16px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.6, display: "flex", gap: 10 }}>
          <Clock size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong>Under review.</strong> Submitted {fmtDate(latest.created_at)}. Until it’s approved your listings are saved as drafts.</span>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: C.gray, margin: "0 0 16px", lineHeight: 1.6 }}>
          Tenants trust verified landlords more, and listings can only go live once you’re verified. An Ivy administrator checks your ID and your right to let the property.
        </p>
      )}

      {latest?.status === "rejected" && !verified && (
        <div style={{ background: "#FEE2E2", color: C.red, padding: "12px 16px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.6, margin: "0 0 16px", display: "flex", gap: 10 }}>
          <XCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong>Not approved.</strong> {latest.reviewer_note || "Please check your documents and submit again."}</span>
        </div>
      )}

      {notice && (
        <div style={{ background: notice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: notice.type === "success" ? "#065F46" : C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, margin: "12px 0" }}>
          {notice.msg}
        </div>
      )}

      {showForm && !loading && (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Full legal name (as on your ID)</label>
          <input value={legalName} onChange={(e) => setLegalName(e.target.value)} style={input} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "14px 0 0" }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>National ID / passport no.</label>
              <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} style={input} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07…" style={input} />
            </div>
          </div>

          <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginTop: 14 }}>KRA PIN <span style={{ fontWeight: 400, color: C.gray }}>(optional)</span></label>
          <input value={kra} onChange={(e) => setKra(e.target.value)} style={input} />

          <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, display: "block", marginTop: 14 }}>Your right to let the property</label>
          <select value={basis} onChange={(e) => setBasis(e.target.value as OwnershipBasis)} style={input}>
            {BASIS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{BASIS.find((b) => b.value === basis)?.hint}</div>

          {[
            { label: "ID document (front) *", file: idFile, set: setIdFile },
            { label: "Proof of right to let *", file: ownFile, set: setOwnFile },
            { label: "Photo of you holding your ID (optional)", file: selfie, set: setSelfie },
          ].map((f) => (
            <div key={f.label} style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{f.label}</label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, padding: "10px 14px", border: `1.5px dashed ${f.file ? C.forest : C.border}`, borderRadius: 10, cursor: "pointer", fontSize: 13, color: f.file ? C.charcoal : C.gray }}>
                <Upload size={15} /> {f.file ? f.file.name : "Choose a photo or PDF (max 5 MB)"}
                <input type="file" accept="image/*,application/pdf" onChange={pickFile(f.set)} style={{ display: "none" }} />
              </label>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: C.gray, margin: "16px 0", lineHeight: 1.6 }}>
            <Lock size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            Your documents are stored in a private vault that only you and Ivy administrators can open, and are used only to verify you (see the Privacy section of the Terms).
          </div>

          <button onClick={submit} disabled={!canSubmit || busy} style={{ padding: "11px 24px", background: C.forest, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: !canSubmit || busy ? "not-allowed" : "pointer", opacity: !canSubmit || busy ? 0.55 : 1 }}>
            {busy ? "Uploading…" : latest?.status === "rejected" ? "Submit again" : "Submit for verification"}
          </button>
        </div>
      )}
    </div>
  );
}
