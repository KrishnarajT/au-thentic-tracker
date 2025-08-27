// src/components/ProtectedRoute.tsx
import { useAuth } from "react-oidc-context";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (auth.isLoading) return <p>Checking session…</p>;
  if (!auth.isAuthenticated) {
    auth.signinRedirect(); // send user to Authentik
    return null;
  }
  return children;
}
