"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  Shield,
  ShieldCheck,
  History,
  FileText,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  QrCode,
  RefreshCw,
} from "lucide-react";

export default function SecurityConsole({ siteId, user }) {
  // Tabs: "password", "2fa", "history", "audit"
  const [activeTab, setActiveTab] = useState("password");
  const isAdmin = user?.globalRole === "SUPERADMIN" || user?.globalRole === "ADMIN";

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(user?.twoFAEnabled || false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaStep, setTwoFaStep] = useState(1); // 1 = Off, 2 = Secret Generated
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [twoFaToken, setTwoFaToken] = useState("");
  const [twoFaError, setTwoFaError] = useState(null);
  const [twoFaSuccess, setTwoFaSuccess] = useState(null);

  // Logs state
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password confirmation does not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update password");
      }

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Generate 2FA Secret
  const handleStart2Fa = async () => {
    setTwoFaLoading(true);
    setTwoFaError(null);
    try {
      const res = await fetch("/api/auth/2fa", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate 2FA secret");

      setTwoFaSecret(json.secret);
      setTwoFaStep(2);
    } catch (err) {
      setTwoFaError(err.message);
    } finally {
      setTwoFaLoading(false);
    }
  };

  // Verify and Enable 2FA
  const handleVerify2Fa = async (e) => {
    e.preventDefault();
    setTwoFaLoading(true);
    setTwoFaError(null);
    setTwoFaSuccess(null);

    try {
      const res = await fetch("/api/auth/2fa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: twoFaToken }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");

      setTwoFaEnabled(true);
      setTwoFaSuccess("Two-Factor Authentication is now enabled!");
      setTwoFaStep(1);
      setTwoFaSecret("");
      setTwoFaToken("");
    } catch (err) {
      setTwoFaError(err.message);
    } finally {
      setTwoFaLoading(false);
    }
  };

  // Fetch Login History
  const fetchLoginHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/security/login-history");
      const json = await res.json();
      if (res.ok) {
        setLoginHistory(json.loginHistory || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    if (!isAdmin) return;
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/admin/security/audit-logs?site_id=${siteId}`);
      const json = await res.json();
      if (res.ok) {
        setAuditLogs(json.auditLogs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Load appropriate data when tab changes
  useEffect(() => {
    if (activeTab === "history") {
      fetchLoginHistory();
    } else if (activeTab === "audit" && isAdmin) {
      fetchAuditLogs();
    }
  }, [activeTab]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-fit space-y-1">
        <button
          onClick={() => setActiveTab("password")}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition text-left ${
            activeTab === "password"
              ? "bg-blue-50 text-blue-600 border border-blue-100"
              : "text-gray-600 hover:bg-gray-50 border border-transparent"
          }`}
        >
          <Lock size={16} />
          Change Password
        </button>

        <button
          onClick={() => setActiveTab("2fa")}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition text-left ${
            activeTab === "2fa"
              ? "bg-blue-50 text-blue-600 border border-blue-100"
              : "text-gray-600 hover:bg-gray-50 border border-transparent"
          }`}
        >
          <ShieldCheck size={16} />
          Two-Factor Auth (2FA)
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition text-left ${
            activeTab === "history"
              ? "bg-blue-50 text-blue-600 border border-blue-100"
              : "text-gray-600 hover:bg-gray-50 border border-transparent"
          }`}
        >
          <History size={16} />
          Login History
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab("audit")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition text-left ${
              activeTab === "audit"
                ? "bg-blue-50 text-blue-600 border border-blue-100"
                : "text-gray-600 hover:bg-gray-50 border border-transparent"
            }`}
          >
            <FileText size={16} />
            System Audit Logs
          </button>
        )}
      </div>

      {/* Main Console Content */}
      <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[400px]">
        {/* Change Password Tab */}
        {activeTab === "password" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <KeyRound size={20} className="text-blue-600" />
                Change Account Password
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Keep your credentials secure. It is recommended to choose a strong password.
              </p>
            </div>

            {passwordError && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
                <AlertCircle className="shrink-0 animate-bounce" size={18} />
                <p className="font-medium">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex gap-3 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
                <CheckCircle2 className="shrink-0" size={18} />
                <p className="font-medium">{passwordSuccess}</p>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {passwordLoading ? "Saving..." : "Change Password"}
              </button>
            </form>
          </div>
        )}

        {/* Two-Factor Auth Tab */}
        {activeTab === "2fa" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield size={20} className="text-blue-600" />
                Two-Factor Authentication (2FA)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Protect your account by adding an extra layer of security.
              </p>
            </div>

            {twoFaError && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
                <AlertCircle className="shrink-0" size={18} />
                <p className="font-medium">{twoFaError}</p>
              </div>
            )}

            {twoFaSuccess && (
              <div className="flex gap-3 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
                <CheckCircle2 className="shrink-0" size={18} />
                <p className="font-medium">{twoFaSuccess}</p>
              </div>
            )}

            {twoFaEnabled ? (
              <div className="bg-green-50/50 border border-green-200 rounded-xl p-5 max-w-xl space-y-3">
                <div className="flex items-center gap-2 text-green-700 font-bold">
                  <ShieldCheck size={20} />
                  2FA Protection is Enabled
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your login sessions are secured with Two-Factor authentication. Every sign-in request will demand your OTP token from your mobile authenticator app.
                </p>
              </div>
            ) : (
              <div className="max-w-xl space-y-4">
                {twoFaStep === 1 ? (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Two-Factor authentication is currently <strong>disabled</strong> on your profile. Enroll to add high-security multi-factor validation.
                    </p>
                    <button
                      onClick={handleStart2Fa}
                      disabled={twoFaLoading}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      {twoFaLoading ? "Generating Setup..." : "Begin 2FA Setup"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerify2Fa} className="space-y-5 border p-5 rounded-xl bg-gray-50/50">
                    <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                      <QrCode size={18} className="text-blue-600" />
                      Step 1: Scan Authenticator Setup Code
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">
                        Scan this configuration key into Google Authenticator, Microsoft Authenticator, or 1Password:
                      </p>
                      <div className="p-3 bg-white border font-mono rounded text-xs select-all text-gray-800 flex justify-between items-center">
                        <span>{twoFaSecret}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-sans uppercase font-semibold">
                          Base32 Key
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                        <ShieldCheck size={18} className="text-blue-600" />
                        Step 2: Enter Verification Code
                      </div>
                      <p className="text-xs text-gray-600">
                        Input the 6-digit verification code generated by your app:
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={twoFaToken}
                          onChange={(e) => setTwoFaToken(e.target.value)}
                          className="rounded-lg border border-gray-200 p-2.5 outline-none focus:border-blue-600 text-sm font-mono tracking-widest w-36 text-center"
                        />
                        <button
                          type="submit"
                          disabled={twoFaLoading}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                        >
                          {twoFaLoading ? "Verifying..." : "Verify & Enable 2FA"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Login History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <History size={20} className="text-blue-600" />
                  Recent Login History
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Check active sign-ins to verify login integrity.
                </p>
              </div>

              <button
                onClick={fetchLoginHistory}
                disabled={historyLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 font-semibold text-gray-600 transition"
              >
                <RefreshCw size={12} className={historyLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading history logs...</div>
            ) : (
              <div className="overflow-x-auto border rounded-xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-100 text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">IP Address</th>
                      <th className="px-4 py-3">User Agent / Browser</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {loginHistory.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{log.user?.email}</td>
                        <td className="px-4 py-3 font-mono">{log.ipAddress || "unknown"}</td>
                        <td className="px-4 py-3 truncate max-w-[200px]" title={log.userAgent}>
                          {log.userAgent || "unknown"}
                        </td>
                        <td className="px-4 py-3">
                          {log.success ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-200">
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {loginHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          No login attempts recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Global Audit Logs Tab */}
        {activeTab === "audit" && isAdmin && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  System Activity & Audit Logs
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Full security log tracing actions across pages, users, backups, and settings.
                </p>
              </div>

              <button
                onClick={fetchAuditLogs}
                disabled={auditLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 font-semibold text-gray-600 transition"
              >
                <RefreshCw size={12} className={auditLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {auditLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading audit history...</div>
            ) : (
              <div className="overflow-x-auto border rounded-xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-100 text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Responsible User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Logged Action</th>
                      <th className="px-4 py-3">Action Details (JSON)</th>
                      <th className="px-4 py-3">Event Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{log.user?.email || "unknown"}</td>
                        <td className="px-4 py-3 text-slate-500 uppercase text-[10px] tracking-wide">
                          {log.user?.globalRole || "VIEWER"}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{log.action}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-gray-500 max-w-[250px] truncate" title={JSON.stringify(log.meta)}>
                          {log.meta ? JSON.stringify(log.meta) : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          No audit activities recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
