import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function VerifyEmail() {
  const { token } = useParams();
  const { verifyEmail } = useAuth();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        const data = await verifyEmail(token);

        if (!active) return;

        setStatus("success");
        setMessage(data.message);
      } catch (error) {
        if (!active) return;

        setStatus("error");
        setMessage(
          error.message || "Email verification failed."
        );
      }
    };

    if (token) {
      verify();
    } else {
      setStatus("error");
      setMessage("Invalid verification link.");
    }

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {status === "loading" && (
          <>
            <Loader2
              className="mx-auto animate-spin text-blue-600"
              size={48}
            />

            <h1 className="mt-4 text-xl font-bold">
              Verifying Email
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Please wait...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle
              className="mx-auto text-emerald-600"
              size={48}
            />

            <h1 className="mt-4 text-xl font-bold">
              Email Verified
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {message}
            </p>

            <Link
              to="/login"
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle
              className="mx-auto text-red-600"
              size={48}
            />

            <h1 className="mt-4 text-xl font-bold">
              Verification Failed
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {message}
            </p>

            <Link
              to="/login"
              className="mt-6 inline-flex rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold dark:border-slate-700"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;