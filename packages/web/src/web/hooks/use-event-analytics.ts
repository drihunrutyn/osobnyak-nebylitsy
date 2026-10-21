import { useCallback, useEffect, useRef } from "react";
import { useTrackingMutations } from "../queries/event";
import { type ACTION_LABELS, SECTION_IDS } from "../../shared/event";

export function useEventAnalytics() {
  const { visit, track, heartbeat } = useTrackingMutations();
  const visitId = useRef(crypto.randomUUID());
  const ready = useRef<Promise<unknown> | null>(null);
  const sendVisit = visit.mutateAsync;
  const sendEvent = track.mutateAsync;
  const sendHeartbeat = heartbeat.mutateAsync;
  const record = useCallback(
    (
      kind: "section" | "action",
      label: (typeof ACTION_LABELS)[number] | (typeof SECTION_IDS)[number],
    ) => {
      void ready.current
        ?.then(() => sendEvent({ id: crypto.randomUUID(), visitId: visitId.current, kind, label }))
        .catch(() => {});
    },
    [sendEvent],
  );
  useEffect(() => {
    let source = "Прямой переход";
    try {
      const url = new URL(document.referrer);
      if (url.host !== location.host) source = url.hostname;
    } catch {
      /* direct */
    }
    const params = new URLSearchParams(location.search);
    const ua = navigator.userAgent;
    ready.current = sendVisit({
      id: visitId.current,
      source: (params.get("utm_source") || source).slice(0, 120),
      medium: (params.get("utm_medium") || "").slice(0, 80),
      campaign: (params.get("utm_campaign") || "").slice(0, 120),
      device: /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|Android/i.test(ua) ? "mobile" : "desktop",
      browser: /Edg\//.test(ua)
        ? "Edge"
        : /Firefox/.test(ua)
          ? "Firefox"
          : /Chrome/.test(ua)
            ? "Chrome"
            : /Safari/.test(ua)
              ? "Safari"
              : "Другой",
    });
    // Не создаём unhandled rejection, даже если API недоступен до первого просмотра раздела.
    void ready.current.catch(() => {});
    // Отмечаем каждый увиденный раздел один раз за загрузку страницы.
    const viewed = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id as (typeof SECTION_IDS)[number];
          if (entry.isIntersecting && !viewed.has(id)) {
            viewed.add(id);
            record("section", id);
          }
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll("main section[id]").forEach((el) => observer.observe(el));
    const click = (event: MouseEvent) => {
      const el = (event.target as HTMLElement).closest("a,summary,button");
      if (!el) return;
      if (el.matches(".hero-actions a,.nav-vote,.roles-grid a")) record("action", "cta");
      if (el.matches(".gallery-grid button")) record("action", "gallery");
      if (el.matches(".act>summary")) record("action", "act");
    };
    document.addEventListener("click", click);
    let seconds = 0;
    const flush = () => {
      void ready.current
        ?.then(() => sendHeartbeat({ visitId: visitId.current, seconds }))
        .catch(() => {});
    };
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        seconds += 15;
        if (seconds % 30 === 0) flush();
      }
    }, 15000);
    const visibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      clearInterval(timer);
      document.removeEventListener("click", click);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [sendVisit, record, sendHeartbeat]);
  return useCallback((label: (typeof ACTION_LABELS)[number]) => record("action", label), [record]);
}
