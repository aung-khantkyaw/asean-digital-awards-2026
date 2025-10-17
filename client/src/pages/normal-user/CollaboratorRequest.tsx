import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Header } from "@/components/common/Header";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000";

type CollaboratorRequest = {
  id: string;
  user_id: string;
  organization: string;
  position: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  admin_notes?: string;
};

const FORM_CARD_CLASS =
  "space-y-6 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 p-8";
const INPUT_CLASS =
  "w-full rounded-lg border border-white/20 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all duration-200 focus:border-emerald-400/60 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 hover:border-white/30";
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-white/20 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all duration-200 focus:border-emerald-400/60 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 hover:border-white/30 resize-none min-h-[120px]";
const LABEL_CLASS = "block text-sm font-semibold text-slate-200 mb-2";
const BUTTON_PRIMARY_CLASS =
  "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

export default function CollaboratorRequest() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] =
    useState<CollaboratorRequest | null>(null);

  const [formData, setFormData] = useState({
    organization: "",
    position: "",
    reason: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      toast.error("Please sign in to request collaborator access.");
      navigate("/sign-in");
      return;
    }

    try {
      const userData = JSON.parse(user);
      const userType = userData.user_type || userData.role || "";

      if (userType.toLowerCase() === "admin") {
        toast.info("You already have admin access.");
        navigate("/admin/dashboard");
        return;
      }

      if (userType.toLowerCase() === "collaborator") {
        toast.info("You already have collaborator access.");
        navigate("/collaborator/overview");
        return;
      }

      setIsAuthenticated(true);
      fetchExistingRequest(token);
    } catch (error) {
      console.error("Failed to parse user data", error);
      navigate("/sign-in");
    }
  }, [navigate]);

  const fetchExistingRequest = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/collaborator-requests/my-request`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.is_success && data.data) {
          setExistingRequest(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch existing request", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.organization.trim()) {
      toast.error("Please enter your organization name.");
      return;
    }

    if (!formData.position.trim()) {
      toast.error("Please enter your position.");
      return;
    }

    if (!formData.reason.trim()) {
      toast.error("Please provide a reason for your request.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Authentication required.");
      navigate("/sign-in");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/collaborator-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.is_success) {
        toast.success(
          "Your collaborator request has been submitted successfully!"
        );
        setExistingRequest(data.data);
        setFormData({ organization: "", position: "", reason: "" });
      } else {
        toast.error(data.msg || data.error || "Failed to submit request.");
      }
    } catch (error) {
      console.error("Failed to submit request", error);
      toast.error("An error occurred while submitting your request.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            <Clock className="h-4 w-4" />
            Pending Review
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            <CheckCircle className="h-4 w-4" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-300">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(192,132,252,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.2)_0%,rgba(15,23,42,0.8)_50%,rgba(15,23,42,0.2)_100%)]" />

      <Header />

      <main className="relative z-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white drop-shadow">
              Collaborator Access Request
            </h1>
            <p className="mt-2 text-slate-300">
              Request access to become a collaborator and contribute to our
              platform.
            </p>
          </div>

          {loading ? (
            <div className={FORM_CARD_CLASS}>
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
                <p className="mt-4 text-sm text-slate-400">Loading...</p>
              </div>
            </div>
          ) : existingRequest ? (
            <div className={FORM_CARD_CLASS}>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="text-2xl font-semibold text-white">
                    Your Request
                  </h2>
                  {getStatusBadge(existingRequest.status)}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Organization
                    </h3>
                    <p className="text-base text-white">
                      {existingRequest.organization}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Position
                    </h3>
                    <p className="text-base text-white">
                      {existingRequest.position}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Reason for Request
                    </h3>
                    <p className="text-base text-white">
                      {existingRequest.reason}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Submitted On
                    </h3>
                    <p className="text-base text-white">
                      {new Date(existingRequest.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>

                  {existingRequest.admin_notes && (
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Admin Notes
                      </h3>
                      <p className="text-base text-white">
                        {existingRequest.admin_notes}
                      </p>
                    </div>
                  )}
                </div>

                {existingRequest.status === "pending" && (
                  <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-4">
                    <p className="text-sm text-yellow-200">
                      Your request is currently under review. You will be
                      notified once an admin makes a decision.
                    </p>
                  </div>
                )}

                {existingRequest.status === "approved" && (
                  <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
                    <p className="text-sm text-emerald-200">
                      Congratulations! Your request has been approved. Please
                      sign out and sign in again to access collaborator
                      features.
                    </p>
                  </div>
                )}

                {existingRequest.status === "rejected" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-rose-400/20 bg-rose-400/5 p-4">
                      <p className="text-sm text-rose-200">
                        Your request has been rejected. If you believe this was
                        a mistake or would like to reapply, please contact
                        support.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={FORM_CARD_CLASS}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="organization" className={LABEL_CLASS}>
                    Organization Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="organization"
                    type="text"
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData({ ...formData, organization: e.target.value })
                    }
                    placeholder="Enter your organization name"
                    className={INPUT_CLASS}
                    required
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    The name of the company or organization you represent.
                  </p>
                </div>

                <div>
                  <label htmlFor="position" className={LABEL_CLASS}>
                    Your Position <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="position"
                    type="text"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    placeholder="e.g., Project Manager, Content Creator"
                    className={INPUT_CLASS}
                    required
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Your role or title within the organization.
                  </p>
                </div>

                <div>
                  <label htmlFor="reason" className={LABEL_CLASS}>
                    Reason for Request <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="Please explain why you would like to become a collaborator and how you plan to contribute..."
                    className={TEXTAREA_CLASS}
                    required
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Describe your motivation and how you plan to contribute to
                    the platform.
                  </p>
                </div>

                <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-emerald-400/50 hover:bg-emerald-400/10 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={BUTTON_PRIMARY_CLASS}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
