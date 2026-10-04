import { useState } from "react";

import {

  Eye,

  EyeOff,

  LockKeyhole,

  Mail,

  LogIn,

  UserRound,

  UserPlus,

  BriefcaseBusiness,

  Building2,

  ShieldCheck,

  ArrowLeft,

} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";



function Login() {

  const navigate = useNavigate();

  const { login, register } = useAuth();



  const [mode, setMode] = useState("login");

  const [role, setRole] = useState("Employee");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [name, setName] = useState("");

  const [jobRole, setJobRole] = useState("");

  const [department, setDepartment] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");



  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");



  const isRegister = mode === "register";



  const switchMode = (nextMode) => {

    setMode(nextMode);

    setError("");

    setPassword("");

    setConfirmPassword("");

    setRole("Employee");

    setJobRole("");

    setDepartment("");

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");



    if (isRegister) {

      if (!name.trim() || !email.trim() || !password || !confirmPassword) {

        setError("Please fill in all required fields.");

        return;

      }



      if (password.length < 6) {

        setError("Password must be at least 6 characters.");

        return;

      }



      if (password !== confirmPassword) {

        setError("Passwords do not match.");

        return;

      }



      if (role === "Employee" && (!jobRole.trim() || !department.trim())) {

        setError("Employee Job Role and Department are required.");

        return;

      }

    } else if (!email.trim() || !password) {

      setError("Please enter your email and password.");

      return;

    }



    try {

      setLoading(true);



      if (isRegister) {

        const result = await register({

          name,

          email,

          password,

          role,

          jobRole,

          department,

        });



        // Employee accounts are logged in immediately.

        // HR accounts stay on the login page because they require Admin approval.

        if (result?.pendingApproval) {

          setMode("login");

          setPassword("");

          setConfirmPassword("");

          setError("");

          window.alert(

            "HR account created successfully. Your account is pending Admin verification. You can log in after an Admin approves it."

          );

        } else {

          navigate("/", { replace: true });

        }

      } else {

        await login(email, password);

        navigate("/", { replace: true });

      }

    } catch (err) {

      setError(

        err.message ||

          (isRegister ? "Registration failed." : "Invalid email or password.")

      );

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="min-h-screen overflow-hidden bg-[#020817] text-white">

      <div className="relative flex min-h-screen flex-col lg:flex-row">

        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-900/30 blur-[1px]" />

        <div className="pointer-events-none absolute -bottom-48 -right-32 h-96 w-96 rounded-full border-[45px] border-blue-900/20" />

        <div className="pointer-events-none absolute -bottom-40 -right-20 h-80 w-80 rounded-full border-[35px] border-blue-800/10" />



        <div className="relative hidden w-1/2 px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16">

          <div>

            <h1 className="text-4xl font-bold tracking-tight">

              Employee<span className="text-blue-500">Hub</span>

            </h1>

            <p className="mt-2 text-base text-slate-400">

              Employee Management System

            </p>

          </div>



          <div className="max-w-2xl">

            <h2 className="text-4xl font-bold leading-tight xl:text-5xl">

              Manage your workforce

              <br />

              with confidence.

            </h2>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">

              Manage employees, attendance, tasks, leave, payroll, performance

              and reports from one centralized platform.

            </p>



            <div className="mt-10 space-y-7">

              <Feature

                icon={<UserRound size={24} />}

                title="Employee Management"

                text="Keep employee information organized."

              />

              <Feature

                icon={<ShieldCheck size={24} />}

                title="Secure Role Access"

                text="HR registration requires Admin verification."

              />

            </div>

          </div>



          <p className="text-sm text-slate-500">

            EmployeeHub © {new Date().getFullYear()}. All rights reserved.

          </p>

        </div>



        <div className="relative flex min-h-screen w-full flex-1 items-center justify-center px-4 pb-8 pt-28 sm:px-6 sm:py-10 lg:min-h-0 lg:w-1/2">

          <div className="absolute left-4 top-5 max-w-[calc(100%-2rem)] sm:left-6 sm:top-7 lg:hidden">

            <h1 className="text-2xl font-bold sm:text-3xl">

              Employee<span className="text-blue-500">Hub</span>

            </h1>

            <p className="mt-1 text-sm text-slate-400">

              Employee Management System

            </p>

          </div>



          <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/80 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-8 sm:p-10">

            <div className="mb-6 sm:mb-8">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">

                EmployeeHub

              </p>

              <h2 className="mt-3 text-2xl font-bold text-white sm:mt-4 sm:text-3xl">

                {isRegister ? "Create New Account" : "Sign In"}

                {!isRegister && (

                  <span className="font-normal text-slate-300">

                    {" "}

                    to Your Account

                  </span>

                )}

              </h2>

            </div>



            {error && (

              <div className="mb-5 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">

                {error}

              </div>

            )}



            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

              {isRegister && (

                <>

                  <Field label="Full Name" icon={<UserRound size={19} />}>

                    <input

                      type="text"

                      value={name}

                      onChange={(e) => setName(e.target.value)}

                      placeholder="Full Name"

                      autoComplete="name"

                      className={inputClass("pl-12")}

                    />

                  </Field>



                  <Field label="Account Role" icon={<ShieldCheck size={19} />}>

                    <select

                      value={role}

                      onChange={(e) => setRole(e.target.value)}

                      className={inputClass("pl-12 appearance-none")}

                    >

                      <option value="Employee" className="bg-slate-900">

                        Employee

                      </option>

                      <option value="HR" className="bg-slate-900">

                        HR

                      </option>

                    </select>

                  </Field>



                  {role === "Employee" && (

                    <>

                      <Field

                        label="Job Role"

                        icon={<BriefcaseBusiness size={19} />}

                      >

                        <input

                          type="text"

                          value={jobRole}

                          onChange={(e) => setJobRole(e.target.value)}

                          placeholder="e.g. Software Developer"

                          className={inputClass("pl-12")}

                        />

                      </Field>



                      <Field

                        label="Department"

                        icon={<Building2 size={19} />}

                      >

                        <input

                          type="text"

                          value={department}

                          onChange={(e) => setDepartment(e.target.value)}

                          placeholder="e.g. IT"

                          className={inputClass("pl-12")}

                        />

                      </Field>

                    </>

                  )}



                  {role === "HR" && (

                    <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">

                      <div className="flex items-start gap-2">

                        <ShieldCheck size={18} className="mt-0.5 shrink-0" />

                        <span>

                          HR accounts are saved as <strong>Pending</strong>.

                          An Admin must verify and approve the account before

                          the HR user can log in.

                        </span>

                      </div>

                    </div>

                  )}

                </>

              )}



              <Field label="Email Address" icon={<Mail size={19} />}>

                <input

                  type="email"

                  value={email}

                  onChange={(e) => setEmail(e.target.value)}

                  placeholder="Email Address"

                  autoComplete="email"

                  className={inputClass("pl-12")}

                />

              </Field>



              <Field label="Password" icon={<LockKeyhole size={19} />}>

                <input

                  type={showPassword ? "text" : "password"}

                  value={password}

                  onChange={(e) => setPassword(e.target.value)}

                  placeholder="Password"

                  autoComplete={

                    isRegister ? "new-password" : "current-password"

                  }

                  className={inputClass("pl-12 pr-12")}

                />

                <button

                  type="button"

                  onClick={() => setShowPassword(!showPassword)}

                  aria-label={

                    showPassword ? "Hide password" : "Show password"

                  }

                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-400"

                >

                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}

                </button>

              </Field>



              {isRegister && (

                <Field

                  label="Confirm Password"

                  icon={<LockKeyhole size={19} />}

                >

                  <input

                    type={showPassword ? "text" : "password"}

                    value={confirmPassword}

                    onChange={(e) => setConfirmPassword(e.target.value)}

                    placeholder="Confirm Password"

                    autoComplete="new-password"

                    className={inputClass("pl-12")}

                  />

                </Field>

              )}



              <button

                type="submit"

                disabled={loading}

                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"

              >

                {loading ? (

                  <>

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                    {isRegister ? "Creating Account..." : "Signing In..."}

                  </>

                ) : (

                  <>

                    {isRegister ? (

                      <UserPlus size={18} />

                    ) : (

                      <LogIn size={18} />

                    )}

                    {isRegister ? "Create Account" : "Sign In"}

                  </>

                )}

              </button>

            </form>



            <div className="mt-6 text-center text-sm text-slate-400">

              {isRegister ? (

                <button

                  type="button"

                  onClick={() => switchMode("login")}

                  className="inline-flex items-center gap-2 font-medium text-blue-400 hover:text-blue-300"

                >

                  <ArrowLeft size={16} />

                  Back to Sign In

                </button>

              ) : (

                <p>

                  Don't have an account?{" "}

                  <button

                    type="button"

                    onClick={() => switchMode("register")}

                    className="font-semibold text-blue-400 hover:text-blue-300"

                  >

                    Create New Account

                  </button>

                </p>

              )}

            </div>



            {isRegister && (

              <p className="mt-5 text-center text-xs leading-5 text-slate-500">

                No Employee Profile ID is required. Employee registration

                creates the Employee profile automatically. HR registration

                creates a pending account that must be verified by an Admin.

              </p>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}



function Field({ label, icon, children }) {

  return (

    <div>

      <label className="mb-2 block text-sm font-medium text-slate-200">

        {label}

      </label>

      <div className="relative">

        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">

          {icon}

        </span>

        {children}

      </div>

    </div>

  );

}



function inputClass(extra = "") {

  return `w-full rounded-xl border border-slate-600 bg-slate-950/70 py-3.5 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${extra}`;

}



function Feature({ icon, title, text }) {

  return (

    <div className="flex items-center gap-5">

      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-950/60 text-blue-400 ring-1 ring-blue-900/40">

        {icon}

      </div>

      <div>

        <h3 className="text-lg font-semibold text-white">{title}</h3>

        <p className="mt-1 text-sm text-slate-500">{text}</p>

      </div>

    </div>

  );

}



export default Login;
