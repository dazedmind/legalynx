"use client";
import React, { useEffect, useState } from "react";
import { profileService } from "../../../../lib/api";
import LoaderComponent from "../../components/ui/LoaderComponent";
import {
  Crown,
  Zap,
  Calendar,
  AlertCircle,
  Gift,
  RefreshCw,
  ExternalLink,
  Ban,
  X,
  Link,
} from "lucide-react";
import { Progress } from "@/app/frontend/components/ui/progress";
import { paypalService } from "../../../../lib/api";
import { toast, Toaster } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmationModal, {
  ModalType,
} from "../../components/layout/ConfirmationModal";
import { FaPaypal } from "react-icons/fa";
import BillingHistory from "./BillingHistory";
import { Separator } from "@/app/frontend/components/ui/separator";

// Helper function to format MB to human readable format
function formatStorage(mb: number): string {
  if (mb === 0) return "0 MB";
  if (mb < 1024) return mb + " MB";
  const gb = mb / 1024;
  return parseFloat(gb.toFixed(1)) + " GB";
}

function SubscriptionPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [subscription, setSubscription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokenLimit, setTokenLimit] = useState(0);
  const [billingDate, setBillingDate] = useState("");
  const [subscriptionDays, setSubscriptionDays] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<boolean>(false);
  const [showBillingHistory, setShowBillingHistory] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const profile = await profileService.getProfile();
        setSubscription(profile.subscription?.plan_type?.toUpperCase() || "");
        setTokensUsed(profile.subscription?.tokens_used || 0);
        setTokenLimit(profile.subscription?.token_limit || 0);
        setBillingDate(profile.subscription?.billing_date || "");
        setSubscriptionDays(profile.subscription?.days_remaining || 0);
        setStorageUsed(profile.subscription?.storage_used || 0);
        setStorageLimit(profile.subscription?.storage || 0);
        setPaymentMethod(profile.subscription?.payment_method || "");
        setLastFourDigits(profile.subscription?.last_four_digits || "");
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  // Detect PayPal return and capture subscription
  useEffect(() => {
    const paypal = search.get("paypal");
    const subscriptionId = search.get("subscription_id");
    const token = search.get("token"); // PayPal returns token parameter
    const plan = (search.get("plan") || "").toUpperCase();
    const billing = search.get("billing");

    // Debug: Log all URL parameters
    console.log("🔍 PayPal return URL parameters:", {
      paypal,
      subscriptionId,
      token,
      plan,
      billing,
      allParams: Object.fromEntries(search.entries()),
      currentURL: window.location.href,
      searchString: window.location.search,
    });

    // Handle success with either subscription_id or token from PayPal
    const paypalSubId = subscriptionId || token;

    if (
      paypal === "success" &&
      paypalSubId &&
      (plan === "BASIC" || plan === "STANDARD" || plan === "PREMIUM") &&
      (billing === "monthly" || billing === "yearly")
    ) {
      console.log(
        `🚀 Attempting to capture subscription: ${paypalSubId} for ${plan}/${billing}`
      );
      (async () => {
        try {
          const res = await paypalService.captureSubscription(
            paypalSubId,
            plan as "BASIC" | "STANDARD" | "PREMIUM",
            billing as "monthly" | "yearly"
          );
          console.log("✅ Capture subscription response:", res);
          toast.success("Subscription activated");
          // Refresh profile to reflect new plan
          const profile = await profileService.getProfile();
          console.log(
            "📊 Updated profile after capture:",
            profile.subscription
          );
          setSubscription(profile.subscription?.plan_type?.toUpperCase() || "");
          setTokensUsed(profile.subscription?.tokens_used || 0);
          setTokenLimit(profile.subscription?.token_limit || 0);
          setBillingDate(profile.subscription?.billing_date || "");
          setSubscriptionDays(profile.subscription?.days_remaining || 0);
          setStorageUsed(profile.subscription?.storage_used || 0);
          setStorageLimit(profile.subscription?.storage || 0);
          setPaymentMethod(profile.subscription?.payment_method || "");
          setLastFourDigits(profile.subscription?.last_four_digits || "");
          // Clean URL
          router.replace("/frontend/settings");
        } catch (e: any) {
          console.error("❌ Failed to capture subscription:", e);
          toast.error(
            e?.response?.data?.error || "Failed to activate subscription"
          );
        }
      })();
    } else if (paypal === "success") {
      console.log("⚠️ PayPal success but missing required parameters:", {
        paypalSubId,
        plan,
        billing,
        hasValidPlan: ["BASIC", "STANDARD", "PREMIUM"].includes(plan),
        hasValidBilling: ["monthly", "yearly"].includes(billing || ""),
      });
    }
  }, [search, router]);

  const getSubscriptionColor = (plan: string) => {
    switch (plan) {
      case "PREMIUM":
        return "from-purple-500 to-indigo-700";
      case "STANDARD":
        return "from-blue-500 to-indigo-700";
      case "BASIC":
        return "from-gray-400 to-gray-600";
      default:
        return "from-blue-500 to-indigo-700";
    }
  };

  const getSubscriptionIcon = (plan: string) => {
    switch (plan) {
      case "PREMIUM":
        return <Crown className="w-5 h-5" />;
      case "STANDARD":
        return <Zap className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  const tokenPercentage = (tokensUsed / tokenLimit) * 100;
  const isNearLimit = tokenPercentage >= 80;
  const daysUntilBilling = Math.ceil(
    (new Date(billingDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const cancelSubscription = async () => {
    if (isCancelling) return;

    setIsCancelling(true);
    setConfirmationModal(false);

    try {
      const result = await paypalService.cancelSubscription(
        "User requested cancellation"
      );

      if (result.status === "already_cancelled") {
        toast.info(
          "Subscription is already cancelled. Your account is on the Basic tier."
        );
      } else if (result.expires_at) {
        const expiryDate = new Date(result.expires_at).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        );
        toast.success(
          `Subscription cancelled successfully. Your ${result.plan} plan will remain active until ${expiryDate}.`
        );
      } else {
        toast.success(
          "Subscription cancelled successfully. Your account has been downgraded to Basic tier."
        );
      }

      // Refresh the profile data to reflect the changes
      const profile = await profileService.getProfile();
      setSubscription(
        profile.subscription?.plan_type?.toUpperCase() || "BASIC"
      );
      setTokensUsed(profile.subscription?.tokens_used || 0);
      setTokenLimit(profile.subscription?.token_limit || 1000);
      setBillingDate(profile.subscription?.billing_date || "");
      setSubscriptionDays(profile.subscription?.days_remaining || 0);
      setStorageUsed(profile.subscription?.storage_used || 0);
      setStorageLimit(profile.subscription?.storage || 100);
      // Only clear payment info if subscription is cancelled and expires_at is provided
      if (result.expires_at) {
        setPaymentMethod("");
        setLastFourDigits("");
      } else {
        setPaymentMethod(profile.subscription?.payment_method || "");
        setLastFourDigits(profile.subscription?.last_four_digits || "");
      }
    } catch (error: any) {
      console.error("Failed to cancel subscription:", error);
      toast.error(
        error?.response?.data?.error || "Failed to cancel subscription"
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <LoaderComponent />;
  }

  if (showBillingHistory) {
    return <BillingHistory onBack={() => setShowBillingHistory(false)} />;
  }

  return (
    <div>
      <span className="flex flex-col gap-1 p-4 px-4">
        <h1 className="text-3xl font-bold font-serif">Subscription</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and preferences.
        </p>
      </span>

      <section className="space-y-4 mb-8">
        {/* Current Subscription Card */}
        <div className="p-4 bg-panel rounded-md border flex flex-col gap-2 border-tertiary mx-4">
          <p className="text-sm text-muted-foreground">
            You are currently on the{" "}
            <span className="font-medium">{subscription}</span> plan
            {subscription === "BASIC" && (
              <span className="text-blue-600">
                {" "}
                Upgrade to unlock more features!
              </span>
            )}
          </p>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <span
              className={`w-fit font-bold text-2xl rounded-md p-3 bg-gradient-to-bl ${getSubscriptionColor(
                subscription
              )} text-white border border-tertiary flex items-center gap-2`}
            >
              {getSubscriptionIcon(subscription)}
              {subscription}
            </span>
            {subscription !== "BASIC" && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {daysUntilBilling > 0
                    ? `${daysUntilBilling} days until renewal`
                    : "Renews today"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Next billing:{" "}
                  {new Date(billingDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Token Usage Card */}
        <div className="p-4 bg-panel rounded-md border flex flex-col gap-3 border-tertiary mx-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              Token Usage
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-baseline gap-2">
              <h1 className="text-3xl font-bold text-foreground">
                {typeof tokensUsed === "number" && subscription !== "PREMIUM"
                  ? tokensUsed.toLocaleString()
                  : "♾️"}
              </h1>
              <span className="text-xl text-muted-foreground">
                /{" "}
                {subscription === "PREMIUM"
                  ? "Unlimited"
                  : tokenLimit.toLocaleString()}
                {/* {typeof tokenLimit === "number"
                  ? tokenLimit.toLocaleString()
                  : "--"} */}
              </span>
            </span>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                {/* {(tokenLimit - tokensUsed).toLocaleString()} remaining */}
              </div>
            </div>
          </div>
          {subscription !== "PREMIUM" && (
            <div className="space-y-2">
              <Progress value={tokenPercentage} className="h-2" />
              {isNearLimit && (
                <div className="flex items-center gap-2 p-2 bg-yellow/10 border border-yellow rounded text-yellow-700 text-sm mt-4">
                  <AlertCircle className="w-4 h-4" />
                  {tokenPercentage === 100
                    ? "You've reached your token limit! Consider upgrading your plan."
                    : tokenPercentage >= 95
                    ? "You're almost out of tokens! Consider upgrading your plan."
                    : "You're running low on tokens. Consider upgrading soon."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Billing Information */}
        {billingDate !== "" && (
          <div className="p-4 bg-panel rounded-md border flex flex-col gap-3 border-tertiary mx-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                Billing Information
              </h2>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Payment Method
                </div>
                <div className="flex items-center gap-2">
                  {paymentMethod === "paypal" ? (
                    <>
                      <div className="w-8 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                        <FaPaypal />
                      </div>
                      <span className="text-sm">PayPal</span>
                      <p className="text-xs text-blue p-1 bg-accent rounded">
                        Account Linked
                      </p>
                    </>
                  ) : paymentMethod === "card" && lastFourDigits ? (
                    <>
                      <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                        VISA
                      </div>
                      <span className="text-sm">
                        •••• •••• •••• {lastFourDigits}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No payment method
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Next Billing Date
                </div>
                <div className="text-sm font-medium">
                  {new Date(billingDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 pt-2 ">
              <button
                onClick={() => setShowBillingHistory(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-tertiary rounded hover:bg-accent transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                View Billing History
              </button>
              {paymentMethod !== "" && (
                <button
                  onClick={() => setConfirmationModal(true)}
                  disabled={isCancelling}
                  className={`flex items-center gap-2 px-3 py-2 text-sm border rounded transition-colors cursor-pointer ${
                    isCancelling
                      ? "border-tertiary text-muted-foreground cursor-not-allowed"
                      : "hover:border-destructive hover:text-destructive hover:bg-destructive/10"
                  }`}
                >
                  {isCancelling ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  {isCancelling ? "Cancelling..." : "Cancel Subscription"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Plan Comparison / Upgrade */}
        <div className="p-4 bg-panel rounded-md border flex flex-col gap-3 border-tertiary mx-4">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              Available Plans
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 border rounded-lg ${
                subscription === "BASIC"
                  ? "border-blue-500 bg-blue/20"
                  : "border-tertiary"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Basic</span>
                {subscription === "BASIC" && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                    Current
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mb-2">
                $0
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• 1,000 tokens/month</div>
                <div>• 100 MB storage</div>
                <div>• Basic features</div>
                <div>• Community support</div>
              </div>
            </div>

            <div
              className={`p-4 border rounded-lg ${
                subscription === "STANDARD"
                  ? "border-blue-500 bg-blue/20"
                  : "border-tertiary"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Standard</span>
                {subscription === "STANDARD" && (
                  <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded">
                    Current
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mb-2">
                ₱149
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• 10,000 tokens/month</div>
                <div>• 1 GB storage</div>
                <div>• Access to Chat History</div>
                <div>• Save Chat Sessions</div>
              </div>
              {subscription !== "STANDARD" && (
                <button
                  onClick={async () => {
                    try {
                      const { approvalUrl } =
                        await paypalService.createSubscription(
                          "STANDARD",
                          "monthly"
                        );
                      if (approvalUrl) window.location.href = approvalUrl;
                      else toast.error("Could not get PayPal approval URL");
                    } catch (e: any) {
                      toast.error(
                        e?.response?.data?.error ||
                          "Failed to create subscription"
                      );
                    }
                  }}
                  className="flex items-center justify-center gap-2 w-full mt-3 px-3 py-2 bg-gray-800 text-white rounded-sm text-sm hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  {subscription === "BASIC"
                    ? "Upgrade to Standard"
                    : "Downgrade to Basic"}
                </button>
              )}
            </div>

            <div
              className={`p-4 border rounded-lg ${
                subscription === "PREMIUM"
                  ? "border-blue-500 bg-blue/20"
                  : "border-tertiary"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Premium</span>
                {subscription === "PREMIUM" && (
                  <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded">
                    Current
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mb-2">
                ₱249
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Unlimited tokens</div>
                <div>• 10 GB storage</div>
                <div>• All features</div>
                <div>• Dedicated support</div>
              </div>
              {subscription !== "PREMIUM" && (
                <button
                  onClick={async () => {
                    try {
                      const { approvalUrl } =
                        await paypalService.createSubscription(
                          "PREMIUM",
                          "monthly"
                        );
                      if (approvalUrl) window.location.href = approvalUrl;
                      else toast.error("Could not get PayPal approval URL");
                    } catch (e: any) {
                      toast.error(
                        e?.response?.data?.error ||
                          "Failed to create subscription"
                      );
                    }
                  }}
                  className="flex items-center justify-center gap-2 w-full mt-3 px-3 py-2 bg-gray-800 text-white rounded-sm text-sm hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  <FaPaypal />
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {confirmationModal && (
        <ConfirmationModal
          isOpen={confirmationModal}
          onClose={() => setConfirmationModal(false)}
          onSave={cancelSubscription}
          modal={{
            header: "Cancel Subscription?",
            message: `Your payment method will be removed and your subscription will remain active until the end of your billing period.`,
            trueButton: "Yes",
            falseButton: "No",
            type: ModalType.DANGER,
          }}
        />
      )}
      <Toaster />
    </div>
  );
}

export default SubscriptionPage;
