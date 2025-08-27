// src/components/AuthButtons.tsx
import { useAuth } from "react-oidc-context";

export default function AuthButtons() {
  const auth = useAuth();
  if (auth.isLoading) return <button disabled>Loading…</button>;

  return auth.isAuthenticated ? (
    <div className="flex items-center gap-2">
      <span>Hello, {auth.user?.profile?.email ?? auth.user?.profile?.name}</span>
      <button onClick={() => auth.signoutRedirect()}>Sign out</button>
    </div>
  ) : (
    <button onClick={() => auth.signinRedirect()}>Sign in with Authentik</button>
  );
}
