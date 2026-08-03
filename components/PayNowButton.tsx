"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loadRazorpayScript } from "@/lib/razorpay";
import { createPaymentOrder, verifyPayment, apiErrorMessage } from "@/lib/api";
import { BillResponse } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

export function PayNowButton({
  bill,
  onPaid,
}: {
  bill: BillResponse;
  onPaid: () => void;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("Couldn't load payment gateway. Check your connection.", "error");
        setLoading(false);
        return;
      }

      const order = await createPaymentOrder(bill.id);

      const razorpay = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: "AarogyaAI Hospital",
        description: `Bill payment · ${bill.doctorName}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: "#0F766E" },
        handler: async (response: any) => {
          try {
            await verifyPayment({
              billId: bill.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            showToast("Payment successful — bill marked as paid.", "success");
            onPaid();
          } catch (err) {
            showToast(
              apiErrorMessage(err, "Payment succeeded but verification failed. Contact support."),
              "error"
            );
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      razorpay.on("payment.failed", () => {
        showToast("Payment failed or was cancelled.", "error");
        setLoading(false);
      });

      razorpay.open();
      setLoading(false);
    } catch (err) {
      showToast(apiErrorMessage(err, "Couldn't start payment. Try again."), "error");
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handlePay} loading={loading}>
      <CreditCard className="h-3.5 w-3.5" />
      Pay now
    </Button>
  );
}