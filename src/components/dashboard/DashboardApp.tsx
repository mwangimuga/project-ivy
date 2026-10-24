"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Sidebar,
  TopBar,
  SADash,
  PMDash,
  LLDash,
  MTDash,
  CLDash,
  Properties,
  PropDetail,
  Badge,
  C,
  TITLES,
  applyTheme,
} from "@/components/ProjectIvy";
import ListingBuilderReal from "@/components/listing/ListingBuilderReal";
import LedgerReal from "@/components/dashboard/LedgerReal";
import TicketsReal from "@/components/dashboard/TicketsReal";
import RealtimeChat from "@/components/chat/RealtimeChat";
import UserMgmtReal from "@/components/dashboard/UserMgmtReal";
import AuditLogs from "@/components/dashboard/AuditLogs";
import MyProfile from "@/components/dashboard/MyProfile";
import SystemInfo from "@/components/dashboard/SystemInfo";
import MyTeam from "@/components/dashboard/MyTeam";
import LoadingState from "@/components/ui/LoadingState";
import RoleRequestsPanel from "@/components/dashboard/RoleRequestsPanel";
import type { Profile, PropertyRow, Lease, LedgerEntry, Ticket, WithdrawalRequest } from "@/lib/types/database";

// Adapts a raw DB property row into the shape the (visually rich, already
// built) dashboard/property components expect: `type` instead of
// `property_type`, a resolved 'available' | 'occupied' | 'pending' status,
// and `desc` instead of `description`.
function adaptProperty(row: PropertyRow, leases: Lease[]) {
  const hasActiveLease = leases.some((l) => l.property_id === row.id && l.status === "active");
  const status = row.status === "draft" ? "pending" : hasActiveLease ? "occupied" : "available";
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    type: row.property_type,
    status,
    landlord_id: row.landlord_id,
    rent: row.rent,
    rating: row.rating,
    details: row.details,
    desc: row.description,
    media_urls: row.media_urls,
    virtual_tour_url: row.virtual_tour_url,
  };
}

function adaptLease(row: Lease, ledger: LedgerEntry[]) {
  const balance = ledger.filter((l) => l.lease_id === row.id).reduce((s, l) => s + l.balance_change, 0);
  return { ...row, balance };
}

export default function DashboardApp({ initialProfile }: { initialProfile: Profile }) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [screen, setScreen] = useState<string>(() => searchParams.get("screen") || "dashboard");
  const [col, setCol] = useState(false);
  const [dark, setDark] = useState(false);
  const [sel, setSel] = useState<ReturnType<typeof adaptProperty> | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("ivy-theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial = saved === "dark" || (!saved && prefersDark);
    setDark(initial);
    applyTheme(initial ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      applyTheme(next ? "dark" : "light");
      window.localStorage.setItem("ivy-theme", next ? "dark" : "light");
      return next;
    });
  };

  const INACTIVITY_LIMIT_MS = 20 * 60 * 1000;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.replace("/login?reason=timeout");
      }, INACTIVITY_LIMIT_MS);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, reset));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back-button guard: after logging out, pressing Back can restore the frozen
  // dashboard from the browser's in-memory page cache with NO server request,
  // so nothing ever checks the session. Re-verify whenever a page is restored
  // from cache or a tab becomes visible again (also catches logout in another tab).
  useEffect(() => {
    const recheck = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) window.location.replace("/login");
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) recheck();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") recheck();
    };
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setMobileNavOpen(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const [propertyRows, setPropertyRows] = useState<PropertyRow[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadSlow, setLoadSlow] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const loadAll = useCallback(async () => {
    // Retries each query a couple of times on transient failure before
    // giving up — a brief network blip shouldn't dump the user on a
    // broken-looking empty dashboard.
    const loadOne = async <T,>(query: PromiseLike<{ data: T | null; error: unknown }>) => {
      let result = await query;
      for (let attempt = 0; attempt < 2 && result.error; attempt++) {
        setLoadSlow(true);
        await new Promise((r) => setTimeout(r, 900 * Math.pow(2, attempt)));
        result = await query;
      }
      return result;
    };

    const [propsRes, leasesRes, ledgerRes, ticketsRes, profilesRes, wdRes] = await Promise.all([
      loadOne(supabase.from("properties").select("*").order("created_at", { ascending: false })),
      loadOne(supabase.from("leases").select("*")),
      loadOne(supabase.from("ledgers").select("*").order("created_at", { ascending: false })),
      loadOne(supabase.from("tickets").select("*").order("created_at", { ascending: false })),
      loadOne(supabase.from("profiles").select("*")),
      loadOne(supabase.from("withdrawal_requests").select("*").order("requested_at", { ascending: false })),
    ]);

    if (propsRes.data) setPropertyRows(propsRes.data as PropertyRow[]);
    if (leasesRes.data) setLeases(leasesRes.data as Lease[]);
    if (ledgerRes.data) setLedger(ledgerRes.data as LedgerEntry[]);
    if (ticketsRes.data) setTickets(ticketsRes.data as Ticket[]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (wdRes.data) setWithdrawals(wdRes.data as WithdrawalRequest[]);
    setLoadSlow(false);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Realtime: ledger inserts (payments/charges/withdrawals) push straight
  // into state — this is the "balance refreshes instantly, no reload"
  // requirement from the spec.
  useEffect(() => {
    const channel = supabase
      .channel("ledgers-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ledgers" }, (payload) => {
        setLedger((prev) => [payload.new as LedgerEntry, ...prev]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawal_requests" }, () => {
        supabase
          .from("withdrawal_requests")
          .select("*")
          .order("requested_at", { ascending: false })
          .then(({ data }) => data && setWithdrawals(data as WithdrawalRequest[]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    // Hard navigation that REPLACES this history entry: no frozen dashboard
    // left in memory or behind the Back button.
    window.location.replace("/login");
  };

  const properties = useMemo(() => propertyRows.map((r) => adaptProperty(r, leases)), [propertyRows, leases]);
  const adaptedLeases = useMemo(() => leases.map((l) => adaptLease(l, ledger)), [leases, ledger]);
  const profilesById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles]);
  // Reflects edits made in "My Profile" immediately, without waiting on a
  // fresh server-rendered `initialProfile` (which only updates on reload).
  const myProfile = profilesById[initialProfile.id] || initialProfile;

  const myActiveLease = useMemo(
    () => leases.find((l) => l.client_id === initialProfile.id && l.status === "active"),
    [leases, initialProfile.id]
  );

  const getDash = () => {
    if (initialProfile.role === "super_agent")
      return <SADash user={{ name: initialProfile.full_name }} properties={properties} leases={adaptedLeases} ledger={ledger.map((l) => ({ ...l, type: l.transaction_type, uid: l.client_id }))} users={profiles} setScreen={setScreen} />;
    if (initialProfile.role === "project_manager")
      return <PMDash properties={properties} leases={adaptedLeases} tickets={tickets} setScreen={setScreen} />;
    if (initialProfile.role === "landlord")
      return <LLDash user={{ id: initialProfile.id }} properties={properties} ledger={ledger.map((l) => ({ ...l, type: l.transaction_type }))} setScreen={setScreen} />;
    if (initialProfile.role === "maintenance") return <MTDash user={{ id: initialProfile.id }} tickets={tickets} setScreen={setScreen} />;
    return <CLDash user={{ id: initialProfile.id }} leases={adaptedLeases} properties={properties} setScreen={setScreen} />;
  };

  const renderScreen = () => {
    if ((screen === "users" || screen === "system-info") && initialProfile.role !== "super_agent") {
      return getDash();
    }
    if (screen === "logs" && initialProfile.role !== "super_agent" && initialProfile.role !== "system_agent") {
      return getDash();
    }
    if (screen === "my-team" && initialProfile.role !== "landlord") {
      return getDash();
    }
    switch (screen) {
      case "dashboard":
        return getDash();
      case "properties":
        return (
          <Properties
            user={{ role: initialProfile.role }}
            properties={properties}
            setSel={(p: ReturnType<typeof adaptProperty>) => setSel(p)}
            setScreen={setScreen}
          />
        );
      case "property-detail":
        return (
          <PropDetail
            property={sel}
            user={{ id: initialProfile.id, role: initialProfile.role }}
            setScreen={setScreen}
            leases={adaptedLeases}
            setLeases={async () => {
              if (!sel) return;
              const start = new Date();
              const end = new Date(start);
              end.setFullYear(end.getFullYear() + 1);
              const { error } = await supabase.from("leases").insert({
                client_id: initialProfile.id,
                property_id: sel.id,
                start_date: start.toISOString().slice(0, 10),
                end_date: end.toISOString().slice(0, 10),
                rent_amount: sel.rent,
                status: "pending",
              });
              if (error) {
                showToast(`Couldn't submit application: ${error.message}`, "error");
              } else {
                await loadAll();
              }
            }}
            showToast={showToast}
            onEdit={initialProfile.role === "super_agent" ? () => { setEditingPropertyId(sel!.id); setScreen("listing-builder"); } : undefined}
            onDelete={initialProfile.role === "super_agent" ? async () => {
              if (!sel) return;
              if (!confirm(`Permanently delete "${sel.name}"? This cannot be undone.`)) return;
              const { error } = await supabase.from("properties").delete().eq("id", sel.id);
              if (error) showToast(error.message, "error");
              else {
                showToast("Listing deleted.");
                setSel(null);
                setScreen("properties");
                await loadAll();
              }
            } : undefined}
          />
        );
      case "listing-builder":
        return (
          <ListingBuilderReal
            profile={initialProfile}
            existingProperty={editingPropertyId ? propertyRows.find((p) => p.id === editingPropertyId) : undefined}
            onCreated={() => {
              loadAll();
              setScreen("properties");
            }}
            onUpdated={() => {
              loadAll();
              setEditingPropertyId(null);
              setScreen("property-detail");
            }}
          />
        );
      case "ledger":
        return <LedgerReal profile={initialProfile} ledger={ledger} leases={leases} profilesById={profilesById} onChanged={loadAll} />;
      case "withdrawals":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {withdrawals
              .filter((w) => initialProfile.role === "super_agent" || w.landlord_id === initialProfile.id)
              .map((w) => (
                <div key={w.id} style={{ background: C.cardBg, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: C.charcoal }}>
                      {profilesById[w.landlord_id]?.full_name || "Landlord"} — Tier {w.tier}
                    </div>
                    <div style={{ fontSize: 13, color: C.gray }}>
                      Requested {new Intl.NumberFormat().format(w.amount)} · Fee {new Intl.NumberFormat().format(w.fee)} · Net {new Intl.NumberFormat().format(w.net_amount)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Badge
                      text={w.status}
                      color={w.status === "paid" ? C.emerald : w.status === "failed" ? C.red : C.amber}
                      bg={w.status === "paid" ? "#D1FAE5" : w.status === "failed" ? "#FEE2E2" : "#FEF3C7"}
                    />
                    {initialProfile.role === "super_agent" && w.status === "pending" && (
                      <button
                        onClick={async () => {
                          await fetch("/api/withdrawals/approve", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ requestId: w.id }),
                          });
                        }}
                        style={{ padding: "8px 18px", background: C.forest, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {withdrawals.length === 0 && <div style={{ color: C.gray, textAlign: "center", padding: 40 }}>No withdrawal requests yet.</div>}
          </div>
        );
      case "chat":
        return myActiveLease ? (
          <RealtimeChat profile={initialProfile} leaseId={myActiveLease.id} />
        ) : (
          <div style={{ color: C.gray, textAlign: "center", padding: 60 }}>
            Chat opens once you have an active lease tied to a property.
          </div>
        );
      case "lease": {
        const myLease = adaptedLeases.find((l) => l.client_id === initialProfile.id && l.status !== "terminated");
        const myLeaseProperty = myLease ? propertyRows.find((p) => p.id === myLease.property_id) : null;
        if (!myLease) {
          return (
            <div style={{ textAlign: "center", padding: 60, color: C.gray }}>
              No active lease or application yet.{" "}
              <button onClick={() => setScreen("properties")} style={{ color: C.forest, fontWeight: 600, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Browse properties
              </button>{" "}
              to apply.
            </div>
          );
        }
        return (
          <div style={{ background: C.cardBg, borderRadius: 16, padding: 28, border: `1px solid ${C.border}`, maxWidth: 560 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.charcoal }}>{myLeaseProperty?.name || "Property"}</div>
                <div style={{ fontSize: 13, color: C.gray }}>{myLeaseProperty?.address}</div>
              </div>
              <Badge
                text={myLease.status === "active" ? "Active" : "Pending approval"}
                color={myLease.status === "active" ? C.emerald : C.amber}
                bg={myLease.status === "active" ? "#D1FAE5" : "#FEF3C7"}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
              <div>
                <div style={{ color: C.gray, fontSize: 12, marginBottom: 4 }}>Rent</div>
                <div style={{ fontWeight: 700, color: C.charcoal }}>KSh {Number(myLease.rent_amount).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: C.gray, fontSize: 12, marginBottom: 4 }}>Balance</div>
                <div style={{ fontWeight: 700, color: myLease.balance <= 0 ? C.emerald : C.amber }}>
                  {myLease.balance <= 0 ? `${Math.abs(myLease.balance).toLocaleString()} CR` : `KSh ${myLease.balance.toLocaleString()}`}
                </div>
              </div>
              <div>
                <div style={{ color: C.gray, fontSize: 12, marginBottom: 4 }}>Start Date</div>
                <div style={{ fontWeight: 600, color: C.charcoal }}>{myLease.start_date}</div>
              </div>
              <div>
                <div style={{ color: C.gray, fontSize: 12, marginBottom: 4 }}>End Date</div>
                <div style={{ fontWeight: 600, color: C.charcoal }}>{myLease.end_date}</div>
              </div>
            </div>
            {myLease.status === "pending" && (
              <div style={{ marginTop: 20, padding: 14, background: "#FEF3C7", borderRadius: 10, fontSize: 13, color: "#92400E" }}>
                Your application is awaiting Project Manager approval.
              </div>
            )}
          </div>
        );
      }
      case "approvals":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(initialProfile.role === "super_agent" || initialProfile.role === "system_agent") && (
              <RoleRequestsPanel profilesById={profilesById} onChanged={loadAll} />
            )}
            {adaptedLeases
              .filter((l) => l.status === "pending")
              .map((l) => {
                const p = propertyRows.find((pr) => pr.id === l.property_id);
                const applicant = profilesById[l.client_id];
                return (
                  <div key={l.id} style={{ background: C.cardBg, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: C.charcoal }}>{applicant?.full_name || "Applicant"}</div>
                      <div style={{ fontSize: 13, color: C.gray }}>
                        {p?.name || "Property"} · KSh {Number(l.rent_amount).toLocaleString()}/mo · {l.start_date} → {l.end_date}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={async () => {
                          const { error } = await supabase.from("leases").update({ status: "active" }).eq("id", l.id);
                          if (error) showToast(error.message, "error");
                          else {
                            showToast("Lease approved.", "success");
                            await loadAll();
                          }
                        }}
                        style={{ padding: "8px 18px", background: C.forest, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          const { error } = await supabase.from("leases").update({ status: "terminated" }).eq("id", l.id);
                          if (error) showToast(error.message, "error");
                          else {
                            showToast("Application declined.", "success");
                            await loadAll();
                          }
                        }}
                        style={{ padding: "8px 18px", background: C.cream, color: C.gray, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            {adaptedLeases.filter((l) => l.status === "pending").length === 0 && (
              <div style={{ color: C.gray, textAlign: "center", padding: 40 }}>No pending applications.</div>
            )}
          </div>
        );
      case "tickets":
        return <TicketsReal profile={initialProfile} tickets={tickets} properties={propertyRows} profilesById={profilesById} />;
      case "profile":
        return <MyProfile profile={myProfile} onUpdated={loadAll} />;
      case "users":
        return <UserMgmtReal profiles={profiles} currentUserId={initialProfile.id} onChanged={loadAll} />;
      case "logs":
        return <AuditLogs profilesById={profilesById} />;
      case "system-info":
        return <SystemInfo />;
      case "my-team":
        return <MyTeam myTeam={profiles.filter((p) => p.created_by === initialProfile.id)} onChanged={loadAll} />;
      default:
        return getDash();
    }
  };

  useEffect(() => {
    if (screen === "property-detail" && !sel) setScreen("properties");
  }, [screen, sel]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.warmWhite, fontFamily: "var(--font-outfit), sans-serif" }}>
        <LoadingState label="Loading your workspace" slow={loadSlow} size="lg" />
      </div>
    );
  }

  const sw = col ? 72 : 240;
  const sidebarUser = {
    role: initialProfile.role,
    name: myProfile.full_name,
    initials: myProfile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
  };
  const goTo = (s: string) => {
    if (s === "properties") setSel(null);
    setScreen(s);
    setMobileNavOpen(false);
  };
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-outfit), sans-serif", background: C.cream }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            left: isMobile ? 20 : "auto",
            zIndex: 2000,
            padding: "14px 20px",
            borderRadius: 12,
            background: toast.type === "success" ? "#4CAF50" : "#DC2626",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            maxWidth: isMobile ? "none" : 380,
          }}
        >
          {toast.msg}
        </div>
      )}
      {isMobile ? (
        <>
          {mobileNavOpen && (
            <div onClick={() => setMobileNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 250 }} />
          )}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: 240,
              height: "100vh",
              zIndex: 300,
              transform: mobileNavOpen ? "translateX(0)" : "translateX(-105%)",
              transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <Sidebar user={sidebarUser} active={screen} setScreen={goTo} onLogout={logout} col={false} setCol={() => {}} />
          </div>
        </>
      ) : (
        <Sidebar user={sidebarUser} active={screen} setScreen={goTo} onLogout={logout} col={col} setCol={setCol} />
      )}
      <div style={{ flex: 1, minWidth: 0, marginLeft: isMobile ? 0 : sw, transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar
          title={(TITLES as Record<string, string>)[screen] || "Dashboard"}
          user={{ name: myProfile.full_name, initials: sidebarUser.initials }}
          setScreen={setScreen}
          dark={dark}
          onToggleTheme={toggleTheme}
          onMenu={isMobile ? () => setMobileNavOpen(true) : undefined}
        />
        <main style={{ flex: 1, padding: isMobile ? "16px 14px 40px" : "28px 28px 48px", overflowY: "auto", minWidth: 0 }}>{renderScreen()}</main>
      </div>
    </div>
  );
}
