"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Database,
  Layers,
  Cpu,
  Activity,
  Lock,
  Image as ImageIcon,
  BookOpen,
  ArrowRight,
} from "lucide-react";

// Inner component that uses useSearchParams — must be inside <Suspense>
function LoginAndProjectLanding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [twoFaRequired, setTwoFaRequired] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");

  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState(null);
  const recaptchaContainerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    const isNgrok = hostname.endsWith(".ngrok.io") ||
      hostname.endsWith(".ngrok-free.dev");

    // Use test key on IPs and ngrok domains, but custom key on localhost
    const useTestKey = isIpAddress || isNgrok;
    const activeKey = useTestKey
      ? "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
      : process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    
    console.log("[reCAPTCHA Debug] Host:", hostname, "Using test key:", useTestKey, "Site Key:", activeKey);
    setRecaptchaSiteKey(activeKey);
  }, []);

  // Render the reCAPTCHA widget into the container ref.
  // Handles both first-load (inject script) and return-visit (script already present) cases.
  useEffect(() => {
    if (!recaptchaSiteKey) return;

    const renderWidget = () => {
      const container = recaptchaContainerRef.current;
      if (!container) return;
      // reCAPTCHA injects an <iframe> when a widget is rendered.
      // If one already exists in this exact container, skip.
      if (container.querySelector("iframe")) return;
      try {
        const id = window.grecaptcha.render(container, {
          sitekey: recaptchaSiteKey,
          theme: "dark",
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.error("Error rendering reCAPTCHA:", err);
      }
    };

    const scriptId = "recaptcha-script";

    if (window.grecaptcha && window.grecaptcha.ready) {
      // Script already loaded — call ready() to ensure API is fully initialised
      window.grecaptcha.ready(renderWidget);
    } else if (!document.getElementById(scriptId)) {
      // First visit — inject the script with an onload callback
      window.__recaptchaInit = renderWidget;
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://www.google.com/recaptcha/api.js?onload=__recaptchaInit&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      // Script tag exists but hasn't finished loading yet — update the callback
      window.__recaptchaInit = renderWidget;
    }
  }, [recaptchaSiteKey]);

  // If already authenticated, go straight to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      router.replace(callbackUrl);
    }
  }, [status, router, searchParams]);

  // Smooth scroll helper
  const scrollToLogin = (e) => {
    e.preventDefault();
    const loginSection = document.getElementById("login-card-section");
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Email is required.");
    if (!password) return setError("Password is required.");

    if (twoFaRequired) {
      // ── STEP 2: Submit with 2FA code ──
      if (!twoFaCode.trim()) return setError("2FA Code is required.");

      // Check reCAPTCHA if site key is configured
      let recaptchaToken = undefined;
      if (recaptchaSiteKey) {
        if (!window.grecaptcha) {
          return setError(
            "reCAPTCHA is still loading. Please wait and try again.",
          );
        }
        try {
          recaptchaToken =
            widgetIdRef.current !== null
              ? window.grecaptcha.getResponse(widgetIdRef.current)
              : window.grecaptcha.getResponse();
        } catch {
          if (recaptchaContainerRef.current) {
            recaptchaContainerRef.current.innerHTML = "";
            window.grecaptcha.ready(() => {
              try {
                const id = window.grecaptcha.render(
                  recaptchaContainerRef.current,
                  {
                    sitekey: recaptchaSiteKey,
                    theme: "dark",
                  },
                );
                widgetIdRef.current = id;
              } catch (err) {
                console.error("Error re-rendering reCAPTCHA:", err);
              }
            });
          }
          return setError(
            "reCAPTCHA was reset. Please complete the verification and try again.",
          );
        }
        if (!recaptchaToken) {
          return setError(
            "Please complete the reCAPTCHA security verification.",
          );
        }
      }

      setLoading(true);
      try {
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
          recaptchaToken,
          twoFACode: twoFaCode,
        });

        if (!res || res.error) {
          setError("Invalid email or password.");

          if (recaptchaSiteKey && window.grecaptcha) {
            try {
              if (widgetIdRef.current !== null) {
                window.grecaptcha.reset(widgetIdRef.current);
              } else {
                window.grecaptcha.reset();
              }
            } catch (_) { }
          }
          setLoading(false);
          return;
        }

        const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
        router.replace(callbackUrl);
      } catch {
        setError("Something went wrong. Please try again.");
        if (recaptchaSiteKey && window.grecaptcha) {
          try {
            if (widgetIdRef.current !== null) {
              window.grecaptcha.reset(widgetIdRef.current);
            } else {
              window.grecaptcha.reset();
            }
          } catch (_) { }
        }
        setLoading(false);
      }
      return;
    }
    let recaptchaToken = undefined;
    if (recaptchaSiteKey) {
      if (!window.grecaptcha) {
        setLoading(false);
        return setError(
          "reCAPTCHA is still loading. Please wait and try again.",
        );
      }
      try {
        recaptchaToken =
          widgetIdRef.current !== null
            ? window.grecaptcha.getResponse(widgetIdRef.current)
            : window.grecaptcha.getResponse();
      } catch {
        if (recaptchaContainerRef.current) {
          recaptchaContainerRef.current.innerHTML = "";
          window.grecaptcha.ready(() => {
            try {
              const id = window.grecaptcha.render(
                recaptchaContainerRef.current,
                {
                  sitekey: recaptchaSiteKey,
                  theme: "dark",
                },
              );
              widgetIdRef.current = id;
            } catch (err) {
              console.error("Error re-rendering reCAPTCHA:", err);
            }
          });
        }
        setLoading(false);
        return setError(
          "reCAPTCHA was reset. Please complete the verification and try again.",
        );
      }
      if (!recaptchaToken) {
        setLoading(false);
        return setError("Please complete the reCAPTCHA security verification.");
      }
    }
    // ── STEP 1: Pre-check if 2FA is required ──
    setLoading(true);
    try {
      const preRes = await fetch("/api/auth/pre-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const preData = await preRes.json();

      if (preData.data?.twoFARequired) {
        // Show 2FA input — reset captcha so user completes a fresh challenge
        setTwoFaRequired(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Pre-login check failed:", err);
      // Fall through to normal login if pre-check fails
    }

    // ── STEP 2 (no 2FA): Submit normally ──

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        recaptchaToken,
      });

      if (!res || res.error) {
        setError("Invalid email or password.");

        if (recaptchaSiteKey && window.grecaptcha) {
          try {
            if (widgetIdRef.current !== null) {
              window.grecaptcha.reset(widgetIdRef.current);
            } else {
              window.grecaptcha.reset();
            }
          } catch (_) { }
        }
        setLoading(false);
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      router.replace(callbackUrl);
    } catch {
      setError("Something went wrong. Please try again.");
      if (recaptchaSiteKey && window.grecaptcha) {
        try {
          if (widgetIdRef.current !== null) {
            window.grecaptcha.reset(widgetIdRef.current);
          } else {
            window.grecaptcha.reset();
          }
        } catch (_) { }
      }
      setLoading(false);
    }
  }

  // Show spinner while checking session
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2
            className="animate-spin text-indigo-500 mx-auto mb-4"
            size={40}
          />
          <p className="text-slate-400 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/25">
              GB
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight block">
                Global Backend
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block -mt-1">
                Headless CMS
              </span>
            </div>
          </div>

          {/* Navigation & Action */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-indigo-400 transition">
              Features
            </a>
            <a
              href="#architecture"
              className="hover:text-indigo-400 transition"
            >
              Architecture
            </a>

          </nav>

          <div>
            <a
              href="#login-card-section"
              onClick={scrollToLogin}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-indigo-400 hover:bg-slate-800 hover:text-white transition duration-200"
            >
              Access Portal
              <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <main className="grow">
        <section className="relative overflow-hidden pt-20 pb-16 px-6 lg:px-12 border-b border-slate-900">
          {/* Decorative ambient background glows */}
          <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl -z-10" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Project Copy */}
            <div className="lg:col-span-7 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
                <Cpu size={14} className="animate-pulse" />
                Next.js 16 Multi-Tenant Architecture
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
                Modern Headless CMS &{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
                  Admin Engine
                </span>
              </h1>
              <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl">
                A secure, highly customizable, and performant headless CMS
                project. Built to deliver isolated multi-site rendering,
                advanced media management, compliance mechanisms, and real-time
                statistics to client frontends.
              </p>

              {/* Tech Badges */}
              <div className="pt-4 flex flex-wrap gap-2.5">
                {[
                  "Next.js App Router",
                  "Prisma ORM",
                  "PostgreSQL",
                  "NextAuth Security",
                  "Cloudinary Media",
                  "TOTP 2FA",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Specs Grid */}
              <div className="pt-6 grid grid-cols-3 gap-6 max-w-md border-t border-slate-900">
                <div>
                  <span className="block text-2xl font-extrabold text-white">
                    100ms
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Avg Latency
                  </span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-white">
                    Scoping
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Tenant Scoped
                  </span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-white">
                    2FA
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    MFA Secured
                  </span>
                </div>
              </div>
            </div>

            {/* Login Widget Container */}
            <div
              id="login-card-section"
              className="lg:col-span-5 flex justify-center"
            >
              <div className="w-full max-w-md rounded-2xl bg-slate-900/60 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl hover:border-indigo-500/30 transition duration-300">
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold mb-3 border border-indigo-500/20">
                    <ShieldCheck size={12} />
                    Secure Login
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Dashboard Portal
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    Sign in with your CMS admin credentials
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {twoFaRequired ? (
                    <div>
                      <label
                        htmlFor="twoFaCode"
                        className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                      >
                        Two-Factor Authentication Code
                      </label>
                      <input
                        id="twoFaCode"
                        type="text"
                        required
                        maxLength={6}
                        value={twoFaCode}
                        onChange={(e) => {
                          setTwoFaCode(e.target.value);
                          setError("");
                        }}
                        placeholder="e.g. 123456"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none hover:border-slate-700 focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-center font-mono tracking-widest text-base"
                      />
                      <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                        Open your authenticator app to retrieve your security
                        code.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Email */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                        >
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          placeholder="admin@example.com"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none hover:border-slate-700 focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label
                            htmlFor="password"
                            className="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                          >
                            Password
                          </label>
                          <Link
                            href="/forgot-password"
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition"
                          >
                            Forgot Password?
                          </Link>
                        </div>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setError("");
                            }}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 pr-11 text-xs text-white outline-none hover:border-slate-700 focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* reCAPTCHA — explicitly rendered into this ref container */}
                  {recaptchaSiteKey && (
                    <div className="flex justify-center my-4 rounded-lg overflow-hidden">
                      <div ref={recaptchaContainerRef} />
                    </div>
                  )}

                  {/* Error Alert */}
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3 py-2.5 text-xs text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    id="login-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 text-xs font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {twoFaRequired
                          ? "Verifying OTP…"
                          : "Verifying Credentials…"}
                      </>
                    ) : twoFaRequired ? (
                      "Verify Code & Sign In"
                    ) : (
                      "Sign In to Dashboard"
                    )}
                  </button>

                  {twoFaRequired && (
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFaRequired(false);
                        setTwoFaCode("");
                        setError("");
                      }}
                      className="w-full text-center text-xs text-slate-500 hover:text-slate-350 transition duration-150 mt-1 font-semibold"
                    >
                      Back to Sign In
                    </button>
                  )}
                </form>

                <p className="mt-5 text-center text-[10px] text-slate-500">
                  Protected by NextAuth credentials verification.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES SECTION ────────────────────────────────────────────── */}
        <section
          id="features"
          className="py-20 px-6 lg:px-12 bg-slate-950 border-b border-slate-900"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold text-white">
                Full-Stack CMS Features
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Everything required to govern, serve, and secure website
                portfolios.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
                <Database className="text-indigo-400 mb-4" size={24} />
                <h3 className="font-bold text-white text-base mb-2">
                  Multi-Site PostgreSQL Scoping
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Database is strictly partitioned by `siteId`. Integrate
                  multiple clients on different domains while maintaining data
                  isolation.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
                <Lock className="text-indigo-400 mb-4" size={24} />
                <h3 className="font-bold text-white text-base mb-2">
                  Security Hardened Entry
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Authentication is protected using Google reCAPTCHA
                  verification, rate-limiting, and TOTP 2FA credentials
                  verification.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
                <ImageIcon className="text-indigo-400 mb-4" size={24} />
                <h3 className="font-bold text-white text-base mb-2">
                  Cloudinary Asset Pipeline
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Secure media directories, media compression via Cloudinary
                  CDN, subfolder mappings, and optimized image rendering.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
                <Activity className="text-indigo-400 mb-4" size={24} />
                <h3 className="font-bold text-white text-base mb-2">
                  Live Analytics & GDPR
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Monitor active viewer histories, request rates, error logs,
                  and visitor cookie consent tracking directly in the dashboard.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
                <Layers className="text-indigo-400 mb-4" size={24} />
                <h3 className="font-bold text-white text-base mb-2">
                  Structured Layout Builder
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Customize layout headers, footers, redirects, legal pages,
                  testimonials, services, and dynamic sections on the fly.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
                <ShieldCheck className="text-indigo-400 mb-4" size={24} />
                <h3 className="font-bold text-white text-base mb-2">
                  Role-Based (RBAC) Permissions
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Support granular permissions through global roles (Superadmin,
                  Editor, Author, Viewer) and site-specific mapping.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── ARCHITECTURE SECTION ────────────────────────────────────────── */}
        <section
          id="architecture"
          className="py-20 px-6 lg:px-12 bg-slate-950/50"
        >
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-12">
              <h2 className="text-3xl font-extrabold text-white">
                System Architecture
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Unified modular flow between site clients, database layer, and
                Next.js portal.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 text-slate-400 text-sm leading-relaxed">
                <p>
                  The Global Backend CMS serves as a decoupled content gateway.
                  Website frontends map their site identity using an HTTP header
                  (`x-site-id`) or query string, allowing the Next.js API layer
                  to fetch isolated database structures.
                </p>
                <div className="space-y-4 pt-2">
                  <div className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Prisma Database Transactions
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Transactions ensure atomic changes across pages,
                        sections, categories, and audit histories.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Dynamic Metadata Rendering
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Automatic OpenGraph schemas, JSON-LD scripts injection,
                        and sitemaps are served from site content rows.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        IP blocking & Rate-limiting
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        A built-in custom token bucket check restricts rapid
                        form submissions and blocks blacklisted IPs dynamically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* visual graphic */}
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-b border-slate-800 pb-3">
                  <span>API ENDPOINT ROUTING</span>
                  <span className="text-indigo-400">ACTIVE CLIENT GATEWAY</span>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between text-xs">
                    <span className="font-mono text-indigo-400 font-semibold">
                      GET /api/content?siteId=...
                    </span>
                    <span className="text-slate-400">
                      Reads layout, pages, and dynamic lists
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between text-xs">
                    <span className="font-mono text-indigo-400 font-semibold">
                      POST /api/forms/submit
                    </span>
                    <span className="text-slate-400">
                      Verifies reCAPTCHA and captures new leads
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between text-xs">
                    <span className="font-mono text-indigo-400 font-semibold">
                      GET /preview?pageId=...
                    </span>
                    <span className="text-slate-400">
                      Renders live draft layout templates
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-650">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} Global Backend Project. Secured with
            NextAuth & Google reCAPTCHA.
          </p>
          <p className="flex gap-4">
            <a href="#features" className="hover:text-indigo-400 transition">
              Documentation
            </a>
            <span>·</span>
            <a href="/login" className="hover:text-indigo-400 transition">
              Access Console
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Outer page component with Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      }
    >
      <LoginAndProjectLanding />
    </Suspense>
  );
}
