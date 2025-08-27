// src/contexts/AuthProvider.tsx
import { ReactNode, useMemo } from "react";
import { AuthProvider as OIDCProvider } from "react-oidc-context";

const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI,
  post_logout_redirect_uri: import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI,
  scope: import.meta.env.VITE_OIDC_SCOPE,
  // Good SPA defaults:
  response_type: "code",
  automaticSilentRenew: true,       // uses iframe if allowed; otherwise token refresh on redirect
  loadUserInfo: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // You can tweak storage here; default is sessionStorage.
  // For tighter security use memory storage; for persistence, sessionStorage/localStorage.
  return <OIDCProvider {...oidcConfig}>{children}</OIDCProvider>;
}
