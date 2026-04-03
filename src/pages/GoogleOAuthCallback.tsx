import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, fetchAuthStatus, fetchCurrentUser, saveAuth, saveUser } from "../lib/auth";

export function GoogleOAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const token =
          params.get("token") ??
          params.get("accessToken") ??
          hashParams.get("token") ??
          hashParams.get("accessToken");

        const error =
          params.get("error") ??
          params.get("oauthError") ??
          hashParams.get("error") ??
          hashParams.get("oauthError");
        window.history.replaceState({}, document.title, window.location.pathname);

        if (error) {
          clearAuth();
          navigate("/auth", { replace: true, state: { error } });
          return;
        }

        if (token) {
          try {
            const user = await fetchCurrentUser(token);
            saveAuth({ accessToken: token, user });
            navigate("/measurement", { replace: true });
            return;
          } catch {
            clearAuth();
            navigate("/auth", { replace: true, state: { error: "Failed to load user" } });
            return;
          }
        }

        const status = await fetchAuthStatus();
        if (status.authenticated) {
          if (status.user) {
            saveUser(status.user);
          }
          navigate("/measurement", { replace: true });
          return;
        }

        clearAuth();
        navigate("/auth", { replace: true, state: { error: "Google login did not return a token." } });
      } catch (err) {
        console.error("OAuth callback error:", err);
        clearAuth();
        navigate("/auth", { replace: true, state: { error: "Unable to complete Google login." } });
      }
    };

    void handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-700">Completing authentication...</p>
        <p className="mt-2 text-sm text-slate-500">Please wait while we process your login.</p>
      </div>
    </div>
  );
}
