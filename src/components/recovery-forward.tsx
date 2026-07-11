"use client";

import { useEffect } from "react";

/**
 * Supabase password-recovery links land on the Site URL (homepage).
 * Forward the recovery token to the module that owns the reset form.
 */
export function RecoveryForward() {
  useEffect(() => {
    if (
      /type=recovery/.test(window.location.hash) &&
      window.location.pathname.indexOf("/api/module/") !== 0
    ) {
      window.location.replace("/api/module/uaemis" + window.location.hash);
    }
  }, []);
  return null;
}
