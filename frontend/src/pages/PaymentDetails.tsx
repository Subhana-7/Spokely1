import { CheckCircle, DollarSign, Tag, Receipt, ArrowLeft } from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { paymentDetails } from "../services/adminService";
import toast from "react-hot-toast";

interface PaymentResponse {
  amount: number;
  currency: string;
  status: string;
  paypalOrderId: string;

  details?: {
    payer?: {
      name?: { given_name: string; surname: string };
      email_address?: string;
      payer_id?: string;
      address?: { country_code: string };
    };

    payment_source?: {
      paypal?: {
        account_id?: string;
        account_status?: string;
      };
    };

    purchase_units?: Array<{
      shipping?: {
        name?: { full_name: string };
        address?: { country_code: string };
      };
    }>;
  };
}

const PaymentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await paymentDetails(id!);
        setPayment(res.data?.data || null);
      } catch (error: any) {
        console.error(error);
        toast.error("Failed to load payment details");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-300 text-lg">
        Loading payment details...
      </div>
    );

  if (!payment)
    return (
      <div className="min-h-screen flex justify-center items-center text-red-400 text-lg">
        Payment not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-14 px-6">
      <div className="max-w-4xl mx-auto">
        {/* PAGE HEADER */}
        <div className="flex items-center gap-3 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors mr-4"
          >
            <ArrowLeft size={22} />
          </button>

          <Receipt size={32} className="text-emerald-400" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Payment Details
          </h1>
        </div>

        {/* STATUS CARD */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg mb-10">
          <div className="flex items-center gap-3">
            <CheckCircle
              className={`${
                payment.status === "COMPLETED"
                  ? "text-emerald-400"
                  : "text-yellow-400"
              }`}
              size={28}
            />
            <h2 className="text-xl font-semibold">
              {payment.status === "COMPLETED"
                ? "Payment Successful"
                : payment.status}
            </h2>
          </div>

          <p className="text-gray-400 mt-2">
            The payment has been processed through PayPal.
          </p>
        </div>

        {/* PAYMENT AMOUNT */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg mb-10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <DollarSign size={20} /> Transaction Summary
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-center">
            <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-emerald-400">
                ${payment.amount}
              </div>
              <p className="text-gray-400 text-sm">Amount</p>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10">
              <div className="text-xl font-bold text-emerald-400">
                {payment.currency}
              </div>
              <p className="text-gray-400 text-sm">Currency</p>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10">
              <div className="text-lg font-bold text-emerald-400 break-all">
                {payment.status}
              </div>
              <p className="text-gray-400 text-sm">Status</p>
            </div>
          </div>
        </div>

        {/* PAYER DETAILS */}
        {/* <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg mb-10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <User size={20} /> Payer Information
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Name</p>
              <p className="font-semibold">
                {payer?.name?.given_name || "N/A"}{" "}
                {payer?.name?.surname || ""}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Email</p>
              <p className="font-semibold flex items-center gap-2">
                <Mail size={16} /> {payer?.email_address || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Payer ID</p>
              <p className="font-semibold">{payer?.payer_id || "N/A"}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Country</p>
              <p className="font-semibold flex items-center gap-2">
                <MapPin size={16} />{" "}
                {payer?.address?.country_code || "N/A"}
              </p>
            </div>
          </div>
        </div> */}

        {/* PAYPAL ACCOUNT DETAILS */}
        {/* <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg mb-10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <CreditCard size={20} /> PayPal Account Details
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Account ID</p>
              <p className="font-semibold">
                {account?.account_id || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Account Status</p>
              <p className="font-semibold text-yellow-400">
                {account?.account_status || "N/A"}
              </p>
            </div>
          </div>
        </div> */}

        {/* ORDER DETAILS */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
            <Tag size={20} /> Order Details
          </h3>

          <div>
            <p className="text-gray-400 text-sm mb-1">PayPal Order ID</p>
            <p className="font-semibold break-all">{payment.paypalOrderId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
