"use client";

import { useState } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { Fld as FldBase, Drp as DrpBase, C } from "@/components/ProjectIvy";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Fld = FldBase as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Drp = DrpBase as any;
import GlbViewer from "@/components/three/GlbViewer";
import type { PropertyType, Profile, PropertyRow } from "@/lib/types/database";

const TYPE_OPTS: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment / House" },
  { value: "student_housing", label: "Student Housing" },
  { value: "commercial", label: "Commercial / Leasehold" },
  { value: "land", label: "Land & Development" },
  { value: "airbnb", label: "Airbnb" },
];

// Dynamic field schema per property type — this is the "Dynamic Custom
// Listing Builder" logic called for in the spec (section 5). Deposit and
// the three utility charges are always optional and entirely up to the
// lister — leave any of them blank and it's simply omitted from the
// listing rather than shown as KSh 0.
const DEPOSIT_AND_UTILITIES: { key: string; label: string; type: "number"; sameAsRent?: boolean }[] = [
  { key: "refundable_deposit", label: "Refundable Deposit (KSh)", type: "number", sameAsRent: true },
  { key: "electricity_charge", label: "Electricity Charge (KSh)", type: "number" },
  { key: "water_charge", label: "Water Charge (KSh)", type: "number" },
  { key: "garbage_charge", label: "Garbage Collection Charge (KSh)", type: "number" },
];

const FIELD_SCHEMA: Record<PropertyType, { key: string; label: string; type: "text" | "number" | "select"; opts?: string[]; sameAsRent?: boolean }[]> = {
  apartment: [
    { key: "bedrooms", label: "Bedrooms", type: "number" },
    { key: "bathrooms", label: "Bathrooms", type: "number" },
    { key: "floor", label: "Floor", type: "text" },
    { key: "house_number", label: "House / Unit Number", type: "text" },
    ...DEPOSIT_AND_UTILITIES,
  ],
  student_housing: [
    { key: "beds_per_room", label: "Beds per Room", type: "number" },
    { key: "price_per_bed", label: "Price per Bed (KSh)", type: "number" },
    { key: "gender_designation", label: "Gender Designation", type: "select", opts: ["male", "female", "mixed"] },
    { key: "term_length_months", label: "Term Length (months)", type: "number" },
    { key: "floor", label: "Floor", type: "text" },
    { key: "house_number", label: "Room Number", type: "text" },
    ...DEPOSIT_AND_UTILITIES,
    { key: "shared_amenities", label: "Shared Amenities (comma separated)", type: "text" },
  ],
  commercial: [
    { key: "floor_area_sqm", label: "Floor Area (sqm)", type: "number" },
    { key: "floor", label: "Floor", type: "text" },
    { key: "house_number", label: "Unit / Suite Number", type: "text" },
    { key: "parking_ratio", label: "Parking Ratio (e.g. 1:50)", type: "text" },
    { key: "cam_split_percent", label: "CAM Split %", type: "number" },
    ...DEPOSIT_AND_UTILITIES,
    { key: "zoning_permissions", label: "Zoning Permissions (comma separated)", type: "text" },
  ],
  land: [
    { key: "acreage", label: "Acreage", type: "number" },
    { key: "title_deed_status", label: "Title Deed Status", type: "text" },
    { key: "zoning_use", label: "Zoning Use", type: "text" },
    { key: "gis_lat", label: "GIS Latitude", type: "number" },
    { key: "gis_lng", label: "GIS Longitude", type: "number" },
  ],
  airbnb: [
    { key: "per_night_rate", label: "Per-Night Rate (KSh)", type: "number" },
    { key: "cleaning_fee", label: "Cleaning Fee (KSh)", type: "number" },
    { key: "max_guests", label: "Max Guests", type: "number" },
    { key: "min_stay", label: "Minimum Stay (nights)", type: "number" },
  ],
};

export default function ListingBuilderReal({
  profile,
  onCreated,
  existingProperty,
  onUpdated,
}: {
  profile: Profile;
  onCreated?: (propertyId: string) => void;
  existingProperty?: PropertyRow;
  onUpdated?: () => void;
}) {
  const isEdit = !!existingProperty;
  const supabase = createClient();
  const [name, setName] = useState(existingProperty?.name || "");
  const [address, setAddress] = useState(existingProperty?.address || "");
  const [rent, setRent] = useState(existingProperty ? String(existingProperty.rent) : "");
  const [description, setDescription] = useState(existingProperty?.description || "");
  const [type, setType] = useState<PropertyType>(existingProperty?.property_type || "apartment");
  const [details, setDetails] = useState<Record<string, string>>(() => {
    if (!existingProperty) return {};
    const d = existingProperty.details as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(d || {})) {
      if (k === "gis_coordinates" && v && typeof v === "object") {
        out.gis_lat = String((v as { lat?: number }).lat ?? "");
        out.gis_lng = String((v as { lng?: number }).lng ?? "");
      } else if (Array.isArray(v)) {
        out[k] = v.join(", ");
      } else {
        out[k] = String(v);
      }
    }
    return out;
  });
  const [images, setImages] = useState<File[]>([]);
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [glbPreviewUrl, setGlbPreviewUrl] = useState<string | null>(existingProperty?.virtual_tour_url || null);
  const [status, setStatus] = useState(existingProperty?.status || "draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setDetail = (key: string) => (value: string) =>
    setDetails((d) => ({ ...d, [key]: value }));

  const handleGlbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGlbFile(file);
    setGlbPreviewUrl(URL.createObjectURL(file));
  };

  const submit = async () => {
    setError(null);
    if (!name || !address || !rent) {
      setError("Name, address, and a headline rent/price are required.");
      return;
    }
    setSaving(true);

    try {
      // Normalize numeric / comma-separated fields per schema
      const normalizedDetails: Record<string, unknown> = {};
      for (const field of FIELD_SCHEMA[type]) {
        const raw = details[field.key];
        if (raw === undefined || raw === "") continue;
        if (field.type === "number") normalizedDetails[field.key] = Number(raw);
        else if (field.key.includes("amenities") || field.key.includes("permissions"))
          normalizedDetails[field.key] = raw.split(",").map((s) => s.trim()).filter(Boolean);
        else normalizedDetails[field.key] = raw;
      }
      if (type === "land" && (details.gis_lat || details.gis_lng)) {
        normalizedDetails.gis_coordinates = {
          lat: Number(details.gis_lat || 0),
          lng: Number(details.gis_lng || 0),
        };
        delete normalizedDetails.gis_lat;
        delete normalizedDetails.gis_lng;
      }

      // 1. Upload photos to Supabase Storage (public bucket) — if editing and no
      // new photos were picked, keep the existing media untouched.
      let mediaUrls: string[] = existingProperty?.media_urls || [];
      if (images.length > 0) {
        mediaUrls = [];
        for (const img of images) {
          const path = `${profile.id}/${Date.now()}-${img.name}`;
          const { error: upErr } = await supabase.storage.from("property-media").upload(path, img);
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("property-media").getPublicUrl(path);
          mediaUrls.push(pub.publicUrl);
        }
      }

      // 2. Upload .glb virtual tour, if a new one was provided; otherwise keep
      // whatever's already there.
      let virtualTourUrl: string | null = existingProperty?.virtual_tour_url || null;
      if (glbFile) {
        const glbPath = `${profile.id}/${Date.now()}-${glbFile.name}`;
        const { error: glbErr } = await supabase.storage.from("virtual-tours").upload(glbPath, glbFile);
        if (glbErr) throw glbErr;
        const { data: pub } = supabase.storage.from("virtual-tours").getPublicUrl(glbPath);
        virtualTourUrl = pub.publicUrl;
      }

      const payload = {
        name,
        address,
        property_type: type,
        rent: Number(rent),
        description,
        details: normalizedDetails,
        media_urls: mediaUrls,
        virtual_tour_url: virtualTourUrl,
        ...(isEdit ? { status } : {}),
      };

      if (isEdit) {
        const { error: updateErr } = await supabase.from("properties").update(payload).eq("id", existingProperty!.id);
        if (updateErr) throw updateErr;
        setSuccess(true);
        onUpdated?.();
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("properties")
          .insert({
            ...payload,
            landlord_id: profile.role === "landlord" ? profile.id : null,
            status: "draft",
          })
          .select("id")
          .single();
        if (insertErr) throw insertErr;
        setSuccess(true);
        onCreated?.(inserted!.id as string);
      }
    } catch (e) {
      setError(getErrorMessage(e, `Failed to ${isEdit ? "update" : "create"} listing.`));
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: 48, textAlign: "center", background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}` }}>
        <CheckCircle size={40} color={C.emerald} style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
          {isEdit ? "Listing updated" : "Listing created"}
        </div>
        <div style={{ fontSize: 13, color: C.gray }}>
          {isEdit ? "Your changes are live." : "It's saved as a draft pending manager approval."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28 }}>
      <div style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, padding: 28 }}>
        {error && (
          <div style={{ background: "#FEE2E2", color: C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <Fld label="Listing Name" value={name} onChange={setName} placeholder="e.g. Westlands Luxury Apartments" req />
        <Fld label="Address" value={address} onChange={setAddress} placeholder="e.g. Westlands, Nairobi" req />
        <Fld label="Headline Rent / Price (KSh)" type="number" value={rent} onChange={setRent} placeholder="e.g. 85000" req hint="Monthly rent, per-bed rate, per-night rate, or asking price depending on type." />
        <Fld label="Description" value={description} onChange={setDescription} placeholder="A short, compelling description of the property…" rows={3} />
        <Drp
          label="Property Type"
          value={type}
          onChange={(v: string) => { setType(v as PropertyType); setDetails({}); }}
          opts={TYPE_OPTS.map((o) => ({ v: o.value, l: o.label }))}
          req
        />
        {isEdit && (
          <Drp
            label="Status"
            value={status}
            onChange={(v: string) => setStatus(v)}
            opts={[{ v: "active", l: "Active (publicly visible)" }, { v: "draft", l: "Draft (hidden)" }]}
            req
          />
        )}

        <div style={{ margin: "20px 0 12px", fontSize: 12, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {TYPE_OPTS.find((o) => o.value === type)?.label} details
        </div>
        {FIELD_SCHEMA[type].map((f) =>
          f.type === "select" ? (
            <Drp key={f.key} label={f.label} value={details[f.key] || ""} onChange={setDetail(f.key)} opts={(f.opts || []).map((o) => ({ v: o, l: o }))} />
          ) : f.sameAsRent ? (
            <div key={f.key} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Fld label={f.label} type={f.type} value={details[f.key] || ""} onChange={setDetail(f.key)} hint="Optional — leave blank if no deposit applies." />
                </div>
                <button
                  type="button"
                  onClick={() => setDetail(f.key)(rent || "")}
                  disabled={!rent}
                  style={{ marginBottom: 16, padding: "10px 14px", background: C.cream, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: rent ? C.forest : C.gray, cursor: rent ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}
                >
                  Same as rent
                </button>
              </div>
            </div>
          ) : (
            <Fld key={f.key} label={f.label} type={f.type} value={details[f.key] || ""} onChange={setDetail(f.key)} hint={["electricity_charge", "water_charge", "garbage_charge", "floor", "house_number"].includes(f.key) ? "Optional" : undefined} />
          )
        )}

        <div style={{ margin: "20px 0 8px", fontSize: 13, fontWeight: 600, color: C.charcoal }}>Photos {isEdit && <span style={{ fontWeight: 400, color: C.gray }}>(leave blank to keep existing)</span>}</div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", border: `1px dashed ${C.border}`, borderRadius: 10, cursor: "pointer", color: C.gray, fontSize: 13 }}>
          <Upload size={16} />
          {images.length ? `${images.length} new photo(s) selected` : isEdit ? `${existingProperty?.media_urls?.length || 0} existing photo(s)` : "Upload property photos"}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => setImages(Array.from(e.target.files || []))} />
        </label>

        <div style={{ margin: "20px 0 8px", fontSize: 13, fontWeight: 600, color: C.charcoal }}>3D Virtual Tour (.glb) {isEdit && <span style={{ fontWeight: 400, color: C.gray }}>(leave blank to keep existing)</span>}</div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", border: `1px dashed ${C.border}`, borderRadius: 10, cursor: "pointer", color: C.gray, fontSize: 13 }}>
          <Upload size={16} />
          {glbFile ? glbFile.name : isEdit && existingProperty?.virtual_tour_url ? "Existing tour on file" : "Upload .glb virtual tour"}
          <input type="file" accept=".glb,.gltf" hidden onChange={handleGlbSelect} />
        </label>

        <button
          onClick={submit}
          disabled={saving}
          style={{ marginTop: 28, width: "100%", padding: 14, background: C.forest, color: C.white, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? (isEdit ? "Saving changes…" : "Publishing listing…") : isEdit ? "Save Changes" : "Create Listing"}
        </button>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
          Live 3D preview
        </div>
        <GlbViewer url={glbPreviewUrl} />
      </div>
    </div>
  );
}
