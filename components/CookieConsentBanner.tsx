"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hirely_cookie_consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "accepted");
    } catch {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // Ignore storage failures and just hide the banner for this session.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl">
      <p className="text-[13px] leading-relaxed text-slate-600">
        We use cookies to improve your experience and keep the site working smoothly.
      </p>
      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={acceptCookies}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-blue-700"
        >
          Accept cookies
        </button>
      </div>
    </div>
  );
}