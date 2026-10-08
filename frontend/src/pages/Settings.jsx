import { useEffect, useState } from "react";
import {
  Monitor,
  Moon,
  Sun,
  Check,
  Bell,
  ClipboardCheck,
  CalendarDays,
  Wallet,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserX,
  RefreshCw,
  Mail,
  UserPlus,
  Lock,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const DEFAULT_PREFERENCES = {
  taskNotifications: true,
  leaveNotifications: true,
  payrollNotifications: true,
};

const SETTINGS_KEY = "employeehub-settings";

function Settings() {
  const { theme, setTheme } = useTheme();

  const {
    user,
    getHrRequests,
    approveHr,
    rejectHr,
    requestAdminEmailChange,
    createAdmin,
  } = useAuth();

  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);

      return saved
        ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) }
        : { ...DEFAULT_PREFERENCES };
    } catch (error) {
      console.error("Failed to load settings:", error);
      return { ...DEFAULT_PREFERENCES };
    }
  });

  const [hrRequests, setHrRequests] = useState([]);
  const [hrLoading, setHrLoading] = useState(false);
  const [hrActionId, setHrActionId] = useState(null);
  const [hrError, setHrError] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    jobRole: "",
    department: "",
  });

  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (user?.role === "Admin") {
      loadHrRequests();
    }
  }, [user?.role]);

  const updatePreference = (key) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const resetPreferences = () => {
    setPreferences({ ...DEFAULT_PREFERENCES });
  };

  const loadHrRequests = async () => {
    try {
      setHrLoading(true);
      setHrError("");

      const data = await getHrRequests();

      setHrRequests(data.requests || []);
    } catch (error) {
      setHrError(error.message || "Failed to load HR requests.");
    } finally {
      setHrLoading(false);
    }
  };

  const handleHrDecision = async (id, action) => {
    try {
      setHrActionId(id);
      setHrError("");

      if (action === "approve") {
        await approveHr(id);
      } else {
        await rejectHr(id);
      }

      await loadHrRequests();
    } catch (error) {
      setHrError(error.message || "Failed to update HR request.");
    } finally {
      setHrActionId(null);
    }
  };

  const handleEmailChange = async (event) => {
    event.preventDefault();

    setEmailMessage("");
    setEmailError("");

    const email = newEmail.trim().toLowerCase();

    if (!email) {
      setEmailError("Please enter a new email address.");
      return;
    }

    if (!email.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (email === user?.email?.toLowerCase()) {
      setEmailError("New email must be different from your current email.");
      return;
    }

    try {
      setEmailLoading(true);

      const data = await requestAdminEmailChange(email);

      setEmailMessage(
        data.message ||
          "Verification email sent. Please check the new email address."
      );

      setNewEmail("");
    } catch (error) {
      setEmailError(error.message || "Unable to change email.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleAdminFormChange = (event) => {
    const { name, value } = event.target;

    setAdminForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    setAdminMessage("");
    setAdminError("");

    if (
      !adminForm.name.trim() ||
      !adminForm.email.trim() ||
      !adminForm.password
    ) {
      setAdminError("Name, email and password are required.");
      return;
    }

    if (!adminForm.email.includes("@")) {
      setAdminError("Please enter a valid email address.");
      return;
    }

    if (adminForm.password.length < 6) {
      setAdminError("Password must be at least 6 characters.");
      return;
    }

    try {
      setAdminLoading(true);

      const data = await createAdmin(adminForm);

      setAdminMessage(
        data.message ||
          "Admin account created. Verification email sent successfully."
      );

      setAdminForm({
        name: "",
        email: "",
        password: "",
        jobRole: "",
        department: "",
      });
    } catch (error) {
      setAdminError(error.message || "Unable to create Admin account.");
    } finally {
      setAdminLoading(false);
    }
  };

  const themes = [
    {
      id: "light",
      name: "Light",
      description: "Use the light appearance",
      icon: Sun,
    },
    {
      id: "dark",
      name: "Dark",
      description: "Use the dark appearance",
      icon: Moon,
    },
    {
      id: "system",
      name: "System",
      description: "Follow your device appearance",
      icon: Monitor,
    },
  ];

  return (
    <div className="min-h-screen min-w-0 text-slate-900 dark:text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your EmployeeHub preferences.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-4 sm:space-y-6">
        {user?.role === "Admin" && (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Mail size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Change Admin Email
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    A verification link will be sent to your new email address.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleEmailChange}
                className="mt-5 space-y-4"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Current Email
                  </label>

                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    New Email
                  </label>

                  <input
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="Enter new email address"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                {emailError && (
                  <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                    {emailError}
                  </div>
                )}

                {emailMessage && (
                  <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-400">
                    {emailMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  <Mail size={16} />
                  {emailLoading ? "Sending..." : "Send Verification Email"}
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                  <UserPlus size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Create Another Admin
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Create an Admin account with a real email address.
                    The new Admin must verify the email before logging in.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleCreateAdmin}
                className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={adminForm.name}
                    onChange={handleAdminFormChange}
                    placeholder="Enter full name"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={adminForm.email}
                    onChange={handleAdminFormChange}
                    placeholder="admin@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="password"
                      name="password"
                      value={adminForm.password}
                      onChange={handleAdminFormChange}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3.5 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Job Role
                  </label>

                  <input
                    type="text"
                    name="jobRole"
                    value={adminForm.jobRole}
                    onChange={handleAdminFormChange}
                    placeholder="Administrator"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={adminForm.department}
                    onChange={handleAdminFormChange}
                    placeholder="Administration"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                {adminError && (
                  <div className="sm:col-span-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                    {adminError}
                  </div>
                )}

                {adminMessage && (
                  <div className="sm:col-span-2 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-400">
                    {adminMessage}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
                  >
                    <UserPlus size={16} />
                    {adminLoading ? "Creating..." : "Create Admin Account"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    <ShieldCheck size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      HR Account Verification
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Review HR accounts created from the public Login page.
                      HR users cannot log in until you approve them.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadHrRequests}
                  disabled={hrLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <RefreshCw
                    size={16}
                    className={hrLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              {hrError && (
                <div className="mt-4 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                  {hrError}
                </div>
              )}

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                {hrLoading && hrRequests.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Loading HR requests...
                  </div>
                ) : hrRequests.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    No pending HR verification requests.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {hrRequests.map((request) => (
                      <div
                        key={request._id}
                        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">{request.name}</p>

                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {request.email}
                          </p>

                          {request.department && (
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                              Department: {request.department}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            Pending verification
                          </p>
                        </div>

                        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                          <button
                            type="button"
                            onClick={() =>
                              handleHrDecision(request._id, "approve")
                            }
                            disabled={hrActionId === request._id}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60 sm:flex-none"
                          >
                            <UserCheck size={16} />
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleHrDecision(request._id, "reject")
                            }
                            disabled={hrActionId === request._id}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60 sm:flex-none"
                          >
                            <UserX size={16} />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Sun size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Appearance</h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose how EmployeeHub looks on your device.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 md:grid-cols-3">
            {themes.map((item) => {
              const Icon = item.icon;
              const selected = theme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40"
                      : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <Icon size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  {selected && (
                    <div className="rounded-full bg-blue-600 p-1 text-white">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Bell size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Notification Preferences
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose which EmployeeHub updates you want to keep enabled.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            <PreferenceRow
              icon={ClipboardCheck}
              title="Task Updates"
              description="Receive notifications about task assignments and progress."
              enabled={preferences.taskNotifications}
              onChange={() => updatePreference("taskNotifications")}
            />

            <PreferenceRow
              icon={CalendarDays}
              title="Leave Updates"
              description="Receive notifications when leave requests are updated."
              enabled={preferences.leaveNotifications}
              onChange={() => updatePreference("leaveNotifications")}
            />

            <PreferenceRow
              icon={Wallet}
              title="Payroll Updates"
              description="Receive notifications about payroll and payment updates."
              enabled={preferences.payrollNotifications}
              onChange={() => updatePreference("payrollNotifications")}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Saved Preferences</h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your notification preferences are saved in this browser.
              </p>
            </div>

            <button
              type="button"
              onClick={resetPreferences}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw size={16} />
              Reset Notifications
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function PreferenceRow({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4 sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon size={18} />
        </div>

        <div>
          <p className="text-sm font-medium">{title}</p>

          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default Settings;