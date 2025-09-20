import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import {
    getPayPalAccessToken,
    getPayPalBaseUrl,
    getPlanLimits,
} from "../_utils";

async function getUserFromToken(request: NextRequest) {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("No token provided");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
    });
    if (!user) throw new Error("User not found");
    return user;
}

export async function POST(request: NextRequest) {
    try {
        console.log("🚀 Cancel subscription request started");
        
        const user = await getUserFromToken(request);
        console.log(`👤 User found: ${user.id}`);
        
        const { reason } = await request
            .json()
            .catch(() => ({ reason: "User requested cancellation" }));
        console.log(`📝 Cancellation reason: ${reason}`);

        const subscription = await prisma.subscription.findUnique({
            where: { user_id: user.id },
            select: { external_subscription_id: true, plan_type: true, is_active: true, billing_date: true },
        });
        console.log(`📊 Current subscription:`, subscription);
        
        // Check if subscription is already inactive
        if (subscription && !subscription.is_active && subscription.plan_type === 'BASIC') {
            console.log("ℹ️ Subscription is already cancelled and on BASIC plan");
            return NextResponse.json({ status: "already_cancelled", plan: "BASIC" });
        }
        
        if (!subscription?.external_subscription_id) {
            console.log("⚠️ No external subscription ID found - user might be on basic plan already");

            // If no external subscription but user is on paid plan, calculate end date
            if (subscription?.plan_type !== 'BASIC') {
                let subscriptionEndDate = subscription?.billing_date || new Date();
                const now = new Date();

                // If billing_date is in the past or not set, add 30 days from cancellation date
                if (subscriptionEndDate <= now) {
                    subscriptionEndDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
                }

                console.log(`📅 No PayPal subscription but user on ${subscription?.plan_type} plan. Will remain active until: ${subscriptionEndDate.toISOString()}`);

                const updatedSubscription = await prisma.subscription.update({
                    where: { user_id: user.id },
                    data: {
                        cancelled_at: new Date(),
                        auto_renew: false,
                        external_subscription_id: null,
                        payment_method: null,
                        payment_provider: null,
                        last_four_digits: null,
                        billing_date: subscriptionEndDate,
                    },
                });

                console.log(`✅ Subscription cancelled for user ${user.id} - plan ${subscription?.plan_type} remains active until expiration`);
                return NextResponse.json({
                    status: "cancelled",
                    plan: subscription?.plan_type,
                    expires_at: subscriptionEndDate.toISOString(),
                    message: "Subscription cancelled. Your current plan will remain active until the end of your billing period."
                });
            } else {
                // User is already on BASIC plan
                const { tokenLimit, storageLimit } = getPlanLimits("BASIC");
                console.log(`📊 User already on BASIC plan`);
                const updatedSubscription = await prisma.subscription.update({
                    where: { user_id: user.id },
                    data: {
                        cancelled_at: new Date(),
                        auto_renew: false,
                        external_subscription_id: null,
                        payment_method: null,
                        payment_provider: null,
                        last_four_digits: null,
                        billing_date: null,
                        days_remaining: 0,
                    },
                });

                console.log(`✅ Subscription reset to BASIC for user ${user.id} (no PayPal subscription to cancel)`);
                return NextResponse.json({ status: "cancelled", plan: "BASIC" });
            }
        }

        console.log("🔑 Getting PayPal access token...");
        const accessToken = await getPayPalAccessToken();
        const baseUrl = getPayPalBaseUrl();
        console.log(`🌐 PayPal base URL: ${baseUrl}`);

        console.log(`📞 Calling PayPal cancel API for subscription: ${subscription.external_subscription_id}`);
        const res = await fetch(
            `${baseUrl}/v1/billing/subscriptions/${subscription.external_subscription_id}/cancel`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reason: reason || "User requested cancellation",
                }),
            }
        );

        console.log(`📥 PayPal response status: ${res.status}`);
        
        if (!res.ok) {
            const details = await res.text();
            console.error(`❌ PayPal cancellation failed: ${res.status} - ${details}`);
            
            // If PayPal cancellation fails but it's a "subscription not found", "already cancelled", 
            // or "invalid status" error, we should still proceed with local cancellation
            if (res.status === 404 || 
                res.status === 422 || 
                details.includes("RESOURCE_NOT_FOUND") || 
                details.includes("already") ||
                details.includes("SUBSCRIPTION_STATUS_INVALID") ||
                details.includes("Invalid subscription status")) {
                console.log("⚠️ PayPal subscription not found, already cancelled, or in invalid state - proceeding with local cancellation");
        console.log(`🔄 PayPal error was: ${res.status} - ${details}`);
            } else {
                return NextResponse.json(
                    { error: "Failed to cancel PayPal subscription", details },
                    { status: 500 }
                );
            }
        }

        console.log("✅ PayPal subscription cancelled successfully");

        // Calculate subscription end date based on current billing date
        let subscriptionEndDate = subscription?.billing_date || new Date();

        // If billing_date is in the past, add 30 days from cancellation date
        const now = new Date();
        if (subscriptionEndDate <= now) {
            subscriptionEndDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
        }

        console.log(`📅 Subscription will remain active until: ${subscriptionEndDate.toISOString()}`);

        // Update subscription - remove PayPal connection but keep current plan active until end date
        console.log("💾 Updating subscription in database...");
        const updatedSubscription = await prisma.subscription.update({
            where: { user_id: user.id },
            data: {
                cancelled_at: new Date(),
                auto_renew: false, // Disable auto-renewal
                external_subscription_id: null, // Remove PayPal connection
                payment_method: null,
                payment_provider: null,
                last_four_digits: null,
                billing_date: subscriptionEndDate, // Set to end date
                // Keep current plan_type, token_limit, storage, and is_active until expiration
            },
        });
        console.log("✅ Database updated successfully - PayPal connection removed, plan remains active until expiration");

        console.log(
            `✅ Subscription cancelled - PayPal unlinked for user ${user.id}. Plan ${subscription.plan_type} remains active until ${subscriptionEndDate.toISOString()}`
        );

        return NextResponse.json({
            status: "cancelled",
            plan: subscription.plan_type,
            expires_at: subscriptionEndDate.toISOString(),
            message: "PayPal subscription cancelled. Your current plan will remain active until the end of your billing period."
        });
    } catch (error) {
        console.error("PayPal cancel error:", error);
        return NextResponse.json(
            { error: "Failed to cancel subscription" },
            { status: 500 }
        );
    }
}
