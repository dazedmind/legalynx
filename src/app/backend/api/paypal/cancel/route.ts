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
            select: { external_subscription_id: true, plan_type: true, is_active: true },
        });
        console.log(`📊 Current subscription:`, subscription);
        
        // Check if subscription is already inactive
        if (subscription && !subscription.is_active && subscription.plan_type === 'BASIC') {
            console.log("ℹ️ Subscription is already cancelled and on BASIC plan");
            return NextResponse.json({ status: "already_cancelled", plan: "BASIC" });
        }
        
        if (!subscription?.external_subscription_id) {
            console.log("⚠️ No external subscription ID found - user might be on basic plan already");
            
            // If no external subscription, just reset to basic plan
            const { tokenLimit, storageLimit } = getPlanLimits("BASIC");
            console.log(`📊 Basic tier limits for reset - tokens: ${tokenLimit}, storage: ${storageLimit}MB`);
            const updatedSubscription = await prisma.subscription.update({
                where: { user_id: user.id },
                data: {
                    is_active: false,
                    cancelled_at: new Date(),
                    plan_type: "BASIC",
                    token_limit: tokenLimit,
                    storage: storageLimit,
                    billing_date: null,
                    external_subscription_id: null,
                    payment_method: null,
                    payment_provider: null,
                    last_four_digits: null,
                    days_remaining: 0,
                },
            });
            
            console.log(`✅ Subscription reset to BASIC for user ${user.id} (no PayPal subscription to cancel)`);
            return NextResponse.json({ status: "cancelled", plan: "BASIC" });
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

        // Get basic tier limits
        const { tokenLimit, storageLimit } = getPlanLimits("BASIC");
        console.log(`📊 Basic tier limits - tokens: ${tokenLimit}, storage: ${storageLimit}MB`);

        // Update subscription to basic tier and mark as cancelled
        console.log("💾 Updating subscription in database...");
        const updatedSubscription = await prisma.subscription.update({
            where: { user_id: user.id },
            data: {
                is_active: false,
                cancelled_at: new Date(),
                plan_type: "BASIC",
                token_limit: tokenLimit,
                storage: storageLimit,
                billing_date: null,
                external_subscription_id: null,
                payment_method: null,
                payment_provider: null,
                last_four_digits: null,
                days_remaining: 0,
            },
        });
        console.log("✅ Database updated successfully:", updatedSubscription.plan_type);

        console.log(
            `✅ Subscription cancelled and downgraded to BASIC for user ${user.id}`
        );
        return NextResponse.json({ status: "cancelled", plan: "BASIC" });
    } catch (error) {
        console.error("PayPal cancel error:", error);
        return NextResponse.json(
            { error: "Failed to cancel subscription" },
            { status: 500 }
        );
    }
}
