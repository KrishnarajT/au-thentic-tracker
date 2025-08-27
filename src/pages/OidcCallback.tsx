// src/pages/OidcCallback.tsx
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export default function OidcCallback() {
  const auth = useAuth();

  useEffect(() => {
    // react-oidc-context auto-detects the callback on mount
    // and finalizes the sign-in. Just wait for isLoading to clear.
  }, []);

  if (auth.isLoading) return <p>Completing sign-in…</p>;
  if (auth.error) return <p>Login error: {auth.error.message}</p>;

  // After callback completes, redirect somewhere:
  window.location.replace("/");
  return null;
}
