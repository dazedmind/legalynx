import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "../../paypal/_utils";

export async function POST(request: NextRequest) {
    try {
        const now = new Date();

        // Find subscriptions that have expired
        const expiredSubscriptions = await prisma.subscription.findMany({
            where: {
                AND: [
                    {
                        is_active: true, // Still marked as active
                    },
                    {
                        plan_type: {
                            not: "BASIC", // Not already on basic plan
                        },
                    },
                    {
                        cancelled_at: {
                            not: null, // Has been cancelled
                        },
                    },
                    {
                        billing_date: {
                            lte: now, // Billing date has passed
                        },
                    },
                ],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });

        console.log(`📊 Found ${expiredSubscriptions.length} expired subscriptions to process`);

        if (expiredSubscriptions.length === 0) {
            return NextResponse.json({
                message: "No expired subscriptions found",
                processed: 0,
            });
        }

        const { tokenLimit, storageLimit } = getPlanLimits("BASIC");
        let processedCount = 0;

        // Process each expired subscription
        for (const subscription of expiredSubscriptions) {
            try {
                console.log(`⬇️ Downgrading user ${subscription.user.email} from ${subscription.plan_type} to BASIC`);

                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        is_active: false,
                        plan_type: "BASIC",
                        token_limit: tokenLimit,
                        storage: storageLimit,
                        billing_date: null,
                        days_remaining: 0,
                        auto_renew: false,
                        // Keep cancelled_at date for records
                    },
                });

                processedCount++;
                console.log(`✅ Successfully downgraded user ${subscription.user.email} to BASIC plan`);
            } catch (error) {
                console.error(`❌ Failed to downgrade user ${subscription.user.email}:`, error);
            }
        }

        console.log(`🎉 Subscription expiration check completed. Processed ${processedCount}/${expiredSubscriptions.length} subscriptions`);

        return NextResponse.json({
            message: `Successfully processed expired subscriptions`,
            processed: processedCount,
            total: expiredSubscriptions.length,
        });
    } catch (error) {
        console.error("❌ Error checking expired subscriptions:", error);
        return NextResponse.json(
            { error: "Failed to check expired subscriptions" },
            { status: 500 }
        );
    }
}

// This endpoint can be called by external cron services like GitHub Actions, Vercel Cron, etc.
export async function GET(request: NextRequest) {
    // Add a simple auth check using a secret key
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || "default-cron-secret"}`;

    if (authHeader !== expectedAuth) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    // Call the same logic as POST
    return POST(request);
}