import { useEffect, useState } from "react";
import DashboardHeader from "./DashBoardComponents/Header";
import {
  Award,
  Star,
  User,
  MessageSquare,
  Calendar,
  Mail,
  Tag,
  ArrowLeft,
} from "lucide-react";
import {
  subscriptionStartPayment,
  subscriptionConfirmPayment,
} from "../../services/paymentService";
import { useAuthStore } from "../../store/userAuthStore";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMentorPlans,
  subscribeMentor,
  getUserSubscriptions,
} from "../../services/subscriptionService";
import { mentorProfile } from "../../services/authServices";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Plan {
  id: string;
  type: string;
  price: number;
  time: number;
}

interface Mentor {
  _id: string;
  name: string;
  email: string;
  phone: number;
  profilePicture: string;
  uniqueCode: string;
  role: "mentor" | "user";
  tags: string[];
  document?: {
    documentUrl: string;
    textMessage: string;
    verificationStatus: "approved" | "pending" | "rejected";
  };
  createdAt: string;
  updatedAt: string;
  sessionsDone?: number;
}

interface Subscription {
  _id: string;
  userId: string;
  mentorId: { _id: string; name: string; profilePicture: string };
  plan: string;
  price: number;
  status: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const UserViewMentorProfile = () => {
  const { user } = useAuthStore();
  const { id: mentorId } = useParams<{ id: string }>();

  if (!mentorId) {
    return <div className="text-white">Invalid mentor ID</div>;
  }

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");

  const navigate = useNavigate();

  // ─────────────────────────────────────────────
  // Fetch Mentor, Plans, Subscriptions
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!mentorId) return;

    const init = async () => {
      try {
        const res = await mentorProfile(mentorId);
        setMentor(res.data.mentor);

        const plansRes = await getMentorPlans(mentorId);
        setPlans(
          (plansRes.data || []).map((p: any) => ({
            id: p._id,
            type: p.type,
            price: p.price,
            time: p.time,
          }))
        );

        if (user?.id) {
          const subsRes = await getUserSubscriptions(user.id);

          setUserSubscriptions(
            Array.isArray(subsRes.data?.data) ? subsRes.data.data : []
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load mentor profile");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mentorId, user?.id]);

  // ─────────────────────────────────────────────
  // Subscription Helpers
  // ─────────────────────────────────────────────

  const formatSubscriptionTime = (hour: number) => {
    const suffix = hour >= 12 ? "PM" : "AM";
    const convertedHour = hour % 12 || 12;
    return `${convertedHour} ${suffix}`;
  };

  const isSubscribedToPlan = (plan: Plan) =>
    userSubscriptions.some(
      (sub) =>
        sub.mentorId._id === mentorId &&
        sub.plan.toLowerCase() === plan.type.toLowerCase() &&
        sub.status === "ACTIVE"
    );

  const handleSubscribe = (plan: Plan) => {
    setActivePlan(plan);
    setShowPayPalModal(true);
  };

  useEffect(() => {
    if (!showPayPalModal || !activePlan) return;

    const container = document.getElementById("paypal-button-container");
    if (!container) return;
    container.innerHTML = "";

    const loadPaypalButtons = async () => {
      try {
        const paypalNamespace = await import("@paypal/paypal-js");
        const paypal = await paypalNamespace.loadScript({
          clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
          currency: "USD",
        });

        if (!paypal?.Buttons) {
          setPaymentResult({
            status: "error",
            message: "PayPal failed to load",
          });
          setShowPayPalModal(false);
          return;
        }

        const buttons = paypal.Buttons({
          createOrder: async () => {
            try {
              const resp = await subscriptionStartPayment(
                activePlan.id,
                activePlan.price
              );

              const orderId = resp.data?.id;

              if (!orderId) {
                throw new Error("Order ID missing from backend response.");
              }

              return orderId;
            } catch (err: any) {
              console.error("createOrder error:", err);
              setShowPayPalModal(false);
              setPaymentResult({
                status: "error",
                message: err?.message || "Failed to create order.",
              });
              throw err;
            }
          },

          onApprove: async (data: any) => {
            try {
              setIsProcessing(true);
              const orderId = data.orderID;
              const verify = await subscriptionConfirmPayment(
                orderId,
                activePlan.id
              );

              if (
                verify.data?.status === "COMPLETED" ||
                verify.data?.message
                  ?.toLowerCase()
                  .includes("captured successfully")
              ) {
                await subscribeMentor({
                  mentorId,
                  plan: activePlan.type,
                  price: activePlan.price,
                  userId: user?.id!,
                  time: activePlan.time,
                });

                setPaymentResult({
                  status: "success",
                  message:
                    verify.data?.message || "Subscription successful! 🎉",
                });

                const res = await getUserSubscriptions(user!.id);
                setUserSubscriptions(res.data || []);
              } else {
                setPaymentResult({
                  status: "error",
                  message:
                    verify.data?.message || "Payment verification failed.",
                });
              }
            } catch (err: any) {
              console.error("onApprove error:", err);
              setPaymentResult({
                status: "error",
                message: err?.message || "Payment failed.",
              });
            } finally {
              setIsProcessing(false);
              setShowPayPalModal(false);
            }
          },

          onCancel: () => {
            setShowPayPalModal(false);
            setPaymentResult({ status: "error", message: "Payment cancelled" });
          },
          onError: (err: any) => {
            console.error("PayPal error:", err);
            setShowPayPalModal(false);
            setPaymentResult({
              status: "error",
              message: "Payment error. Please try again.",
            });
          },
        });

        buttons.render("#paypal-button-container");
      } catch (err) {
        console.error("PayPal script load error:", err);
        const container = document.getElementById("paypal-button-container");
        if (container) container.innerText = "PayPal failed to load";
      }
    };

    loadPaypalButtons();
  }, [showPayPalModal, activePlan, mentorId, user]);

  // ─────────────────────────────────────────────
  // Loading/Not Found
  // ─────────────────────────────────────────────

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading mentor profile...
      </div>
    );

  if (!mentor)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        Mentor not found.
      </div>
    );

  // =======================================================================
  // UI STARTS HERE — NEW THEME APPLIED
  // =======================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-10">
      {user?.role !== "admin" && <DashboardHeader />}

      <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col gap-12">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-700 shadow-md hover:scale-105 hover:shadow-lg transition-all"
        >
          <ArrowLeft size={20} className="text-gray-300" />
        </button>
        {/* TOP: PROFILE CARD */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl p-8 flex flex-col md:flex-row gap-8">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-800 border border-white/10 shadow-lg">
            {mentor.profilePicture ? (
              <img
                src={mentor.profilePicture}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <User className="w-16 h-16 text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center gap-2 flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              {mentor.name}
            </h1>

            <p className="flex items-center gap-2 text-gray-300">
              <Mail size={16} /> {mentor.email}
            </p>

            <div className="flex gap-3 mt-2">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                Code: {mentor.uniqueCode}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm border ${
                  mentor.document?.verificationStatus === "approved"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : mentor.document?.verificationStatus === "pending"
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}
              >
                {mentor.document?.verificationStatus.toUpperCase()}
              </span>
            </div>

            <p className="text-gray-400 text-sm mt-2">
              Joined: {new Date(mentor.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* ABOUT & DOCUMENT */}
        <div className="grid md:grid-cols-2 gap-10">
          {/* About */}
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-emerald-400">
              <Award size={20} /> Experience Summary
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {mentor.document?.textMessage || "No verification notes"}
            </p>
          </div>

          {/* Document */}
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-emerald-400">
              <Calendar size={20} /> Experience Certificate
            </h2>

            {mentor.document?.documentUrl ? (
              <img
                src={mentor.document.documentUrl}
                className="rounded-xl border border-white/10 shadow-xl max-h-80 object-cover"
              />
            ) : (
              <p className="text-gray-400">No Experience document uploaded.</p>
            )}
          </div>
        </div>

        {/* SKILLS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <Tag size={20} /> Skills & Expertise
          </h2>

          {mentor.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {mentor.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-sm bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No skills added.</p>
          )}
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* SUBSCRIPTION PLANS (ONLY FOR USERS)           */}
        {/* ───────────────────────────────────────────── */}

        {user?.role === "user" && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-lg">
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Subscription Plans
            </h3>

            {plans.length === 0 ? (
              <p className="text-gray-300">Mentor has no subscription plans</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {plans.map((plan) => {
                  const subscribed = isSubscribedToPlan(plan);

                  return (
                    <div
                      key={plan.id}
                      className="p-5 rounded-2xl bg-gray-800/40 border border-white/10 shadow-lg"
                    >
                      <h4 className="text-lg font-semibold text-green-400">
                        {plan.type} ({formatSubscriptionTime(plan.time)})
                      </h4>
                      <p className="text-gray-300 mt-1">
                        ₹{plan.price} / month
                      </p>

                      <div className="mt-5">
                        {subscribed ? (
                          <div className="text-green-400">
                            ✔ Already Subscribed
                          </div>
                        ) : (
                          <button
                            disabled={isProcessing}
                            onClick={() => handleSubscribe(plan)}
                            className="px-6 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow hover:scale-105 transition disabled:opacity-50"
                          >
                            {isProcessing ? "Processing..." : "Subscribe"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK SECTION */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-emerald-400">
            <MessageSquare size={20} /> Share Your Feedback
          </h3>

          <div className="flex items-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={28}
                className={`cursor-pointer ${
                  star <= (hover || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-600"
                }`}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
              />
            ))}
          </div>

          <textarea
            className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-3 text-white"
            placeholder="Write your feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />

          <button
            disabled={!rating}
            className={`mt-4 px-6 py-2 rounded-full font-medium transition ${
              rating
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            Submit Feedback
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL (unchanged) */}
      {showPayPalModal && activePlan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-300 border border-gray-700 p-6 rounded-2xl shadow-xl w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-white hover:text-white"
              onClick={() => setShowPayPalModal(false)}
              disabled={isProcessing}
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold mb-4">Complete Payment</h2>
            <div id="paypal-button-container"></div>

            {isProcessing && (
              <p className="text-gray-400 mt-4 text-center">
                Processing payment…
              </p>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT RESULT */}
      {paymentResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 max-w-sm w-full text-center">
            <h2
              className={`text-xl font-bold ${
                paymentResult.status === "success"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {paymentResult.status === "success"
                ? "Payment Successful"
                : "Payment Failed"}
            </h2>

            <p className="text-gray-300 mt-2">{paymentResult.message}</p>

            <button
              className="mt-6 bg-emerald-500 px-5 py-2 rounded-lg hover:bg-emerald-600"
              onClick={() => setPaymentResult(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserViewMentorProfile;
