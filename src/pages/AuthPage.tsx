import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BalanceLogo } from "../components/BalanceLogo";
import { GoogleIcon } from "../components/GoogleIcon";
import { getToken } from "../lib/auth";
import { fetchAuthStatus, loginOrRegister, saveAuth, saveUser, startGoogleLogin } from "../lib/auth";

type Mode = "login" | "signup";

type LoginForm = {
  email: string;
  password: string;
};

type SignupForm = {
  name: string;
  email: string;
  password: string;
};

const initialLogin: LoginForm = {
  email: "",
  password: ""
};

const initialSignup: SignupForm = {
  name: "",
  email: "",
  password: ""
};

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("signup");
  const [loginForm, setLoginForm] = useState<LoginForm>(initialLogin);
  const [signupForm, setSignupForm] = useState<SignupForm>(initialSignup);
  const [loginVisible, setLoginVisible] = useState(false);
  const [signupVisible, setSignupVisible] = useState(false);
  const [loginStatus, setLoginStatus] = useState("");
  const [signupStatus, setSignupStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loginError = useMemo(() => {
    if (!loginForm.email || !loginForm.password) {
      return "";
    }
    if (!/\S+@\S+\.\S+/.test(loginForm.email)) {
      return "Please enter a valid email address.";
    }
    return "";
  }, [loginForm]);

  const signupError = useMemo(() => {
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      return "";
    }
    if (!/^[A-Za-z ]{3,40}$/.test(signupForm.name)) {
      return "Full name should contain only letters and spaces.";
    }
    if (!/\S+@\S+\.\S+/.test(signupForm.email)) {
      return "Please enter a valid email address.";
    }
    if (signupForm.password.length < 8 || signupForm.password.length > 100) {
      return "Password must be 8-100 characters.";
    }
    if (!/[A-Z]/.test(signupForm.password)) {
      return "Password must include at least one uppercase letter.";
    }
    if (!/\d/.test(signupForm.password)) {
      return "Password must include at least one number.";
    }
    if (!/[^A-Za-z0-9]/.test(signupForm.password)) {
      return "Password must include at least one special character.";
    }
    return "";
  }, [signupForm]);

  const passwordIssues = useMemo(() => {
    const issues: string[] = [];

    if (signupForm.password.length > 0 && signupForm.password.length < 8) {
      issues.push("At least 8 characters");
    }
    if (signupForm.password.length > 100) {
      issues.push("No more than 100 characters");
    }
    if (signupForm.password.length > 0 && !/[A-Z]/.test(signupForm.password)) {
      issues.push("At least one uppercase letter");
    }
    if (signupForm.password.length > 0 && !/\d/.test(signupForm.password)) {
      issues.push("At least one number");
    }
    if (signupForm.password.length > 0 && !/[^A-Za-z0-9]/.test(signupForm.password)) {
      issues.push("At least one special character");
    }

    return issues;
  }, [signupForm.password]);

  useEffect(() => {
    if (getToken()) {
      navigate("/measurement", { replace: true });
      return;
    }

    const run = async () => {
      try {
        const status = await fetchAuthStatus();
        if (status.authenticated) {
          if (status.user) saveUser(status.user);
          navigate("/measurement", { replace: true });
        }
      } catch {
        // not authenticated, stay on auth page
      }
    };
    void run();
  }, [navigate]);

  useEffect(() => {
    const state = location.state as { error?: string } | null;
    if (!state?.error) {
      return;
    }

    setMode("login");
    setLoginStatus(state.error);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!loginForm.email || !loginForm.password) {
      setLoginStatus("Please fill out all login fields.");
      return;
    }

    if (loginError) {
      setLoginStatus(loginError);
      return;
    }

    setLoading(true);
    setLoginStatus("Logging in...");

    try {
      const response = await loginOrRegister("/auth/login", loginForm);
      saveAuth(response);
      navigate("/measurement", { replace: true });
    } catch (error) {
      setLoginStatus(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setSignupStatus("Please fill out all signup fields.");
      return;
    }

    if (signupError) {
      setSignupStatus(signupError);
      return;
    }

    setLoading(true);
    setSignupStatus("Creating your account...");

    try {
      const response = await loginOrRegister("/auth/register", {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password
      });
      saveAuth(response);
      navigate("/measurement", { replace: true });
    } catch (error) {
      setSignupStatus(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-4 sm:px-5 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[10%] h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl sm:h-56 sm:w-56" />
        <div className="absolute bottom-[12%] right-[10%] h-44 w-44 rounded-full bg-amber-200/50 blur-3xl sm:h-64 sm:w-64" />
        <div className="absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />
      </div>

      <section className="relative grid w-full max-w-[56rem] gap-3 lg:grid-cols-[0.78fr_1fr]">
        <div className="hidden min-h-[460px] rounded-[28px] border border-white/70 bg-gradient-to-br from-slate-900 via-brand-700 to-cyan-600 p-5 text-white shadow-auth lg:flex lg:items-center lg:justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/95 shadow-panel">
              <BalanceLogo className="h-11 w-11" />
            </div>
            <h1 className="mt-4 text-[1.8rem] font-bold leading-tight">Quantity Measurement App</h1>
            <p className="mt-2 max-w-[220px] text-sm leading-6 text-white/80">
              Compare, convert, and calculate quantities in one clean workspace.
            </p>
          </div>
        </div>

        <section className="mx-auto w-full max-w-[29rem] rounded-[28px] border border-white/70 bg-white/90 p-3.5 shadow-auth backdrop-blur">
          <div className="mb-2.5 flex items-center justify-center">
            <h2 className="text-center text-2xl font-bold text-slate-900">{mode === "login" ? "Login" : "Signup"}</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-slate-100/90 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setLoginStatus("");
                setSignupStatus("");
              }}
              className={`rounded-[16px] px-3 py-2 text-center text-sm font-semibold transition ${
                mode === "login" ? "bg-white text-slate-900 shadow-sm shadow-slate-200" : "text-slate-500 hover:bg-white/60"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setLoginStatus("");
                setSignupStatus("");
              }}
              className={`rounded-[16px] px-3 py-2 text-center text-sm font-semibold transition ${
                mode === "signup" ? "bg-white text-slate-900 shadow-sm shadow-slate-200" : "text-slate-500 hover:bg-white/60"
              }`}
            >
              Signup
            </button>
          </div>

          {mode === "login" ? (
            <form className="mt-3 space-y-2" onSubmit={submitLogin}>
              <FieldLabel htmlFor="loginEmail" label="Email Id" />
              <FieldInput
                id="loginEmail"
                type="email"
                placeholder="name@example.com"
                value={loginForm.email}
                onChange={(value) => {
                  setLoginForm((current) => ({ ...current, email: value }));
                  setLoginStatus("");
                }}
              />

              <FieldLabel htmlFor="loginPassword" label="Password" />
              <PasswordField
                id="loginPassword"
                placeholder="Enter your password"
                value={loginForm.password}
                visible={loginVisible}
                onToggle={() => setLoginVisible((current) => !current)}
                onChange={(value) => {
                  setLoginForm((current) => ({ ...current, password: value }));
                  setLoginStatus("");
                }}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[18px] bg-gradient-to-r from-brand-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                Login
              </button>

              <button
                type="button"
                onClick={startGoogleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/measurement", { replace: true })}
                className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white hover:text-brand-700"
              >
                Continue as Guest
              </button>

              <StatusText text={loginStatus || loginError} />

              <p className="text-center text-sm text-slate-600">
                New user?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setLoginStatus("");
                    setSignupStatus("");
                  }}
                  className="font-semibold text-brand-600 transition hover:text-brand-700"
                >
                  Signup
                </button>
              </p>
            </form>
          ) : (
            <form className="mt-3 space-y-2" onSubmit={submitSignup}>
              <FieldLabel htmlFor="signupName" label="Full Name" />
              <FieldInput
                id="signupName"
                placeholder="Your full name"
                value={signupForm.name}
                onChange={(value) => {
                  setSignupForm((current) => ({ ...current, name: value }));
                  setSignupStatus("");
                }}
              />

              <FieldLabel htmlFor="signupEmail" label="Email Id" />
              <FieldInput
                id="signupEmail"
                type="email"
                placeholder="name@example.com"
                value={signupForm.email}
                onChange={(value) => {
                  setSignupForm((current) => ({ ...current, email: value }));
                  setSignupStatus("");
                }}
              />

              <FieldLabel htmlFor="signupPassword" label="Password" />
              <PasswordField
                id="signupPassword"
                placeholder="Create a password"
                value={signupForm.password}
                visible={signupVisible}
                onToggle={() => setSignupVisible((current) => !current)}
                onChange={(value) => {
                  setSignupForm((current) => ({ ...current, password: value }));
                  setSignupStatus("");
                }}
              />
              <PasswordHints issues={passwordIssues} />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[18px] bg-gradient-to-r from-brand-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-200/60 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                Signup
              </button>

              <button
                type="button"
                onClick={startGoogleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/measurement", { replace: true })}
                className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white hover:text-brand-700"
              >
                Continue as Guest
              </button>

              <StatusText text={signupStatus || signupError} />

              <p className="text-center text-sm text-slate-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setLoginStatus("");
                    setSignupStatus("");
                  }}
                  className="font-semibold text-brand-600 transition hover:text-brand-700"
                >
                  Login
                </button>
              </p>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

type FieldLabelProps = {
  htmlFor: string;
  label: string;
};

function FieldLabel({ htmlFor, label }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-800 sm:text-sm">
      {label}
    </label>
  );
}

type FieldInputProps = {
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

function FieldInput({ id, type = "text", placeholder, value, onChange }: FieldInputProps) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-0.5 w-full rounded-[16px] border border-slate-200 bg-slate-50/75 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
    />
  );
}

type PasswordFieldProps = {
  id: string;
  placeholder?: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
};

function PasswordField({ id, placeholder, value, visible, onToggle, onChange }: PasswordFieldProps) {
  return (
    <div className="relative mt-1">
      <input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[16px] border border-slate-200 bg-slate-50/75 px-3 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
      >
        {visible ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
      </button>
    </div>
  );
}

type StatusTextProps = {
  text: string;
};

function StatusText({ text }: StatusTextProps) {
  return <p className="min-h-4 text-xs font-medium leading-4 text-[#ad2f39] sm:text-sm">{text}</p>;
}

type PasswordHintsProps = {
  issues: string[];
};

function PasswordHints({ issues }: PasswordHintsProps) {
  if (issues.length === 0) {
    return <p className="text-xs text-slate-500">Use 8-100 characters with at least one uppercase letter, one number, and one special character.</p>;
  }

  return (
    <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <p className="font-semibold">Password is missing:</p>
      <ul className="mt-1 list-disc space-y-1 pl-4">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}
