// Create this file: src/lib/token-tracker.ts
import { prisma } from './prisma';

export class TokenTracker {
  
  // Simple token usage recording
  static async useTokens(userId: string, amount: number, operation: string = "chat") {
    try {
      // Update subscription total
      await prisma.subscription.update({
        where: { user_id: userId },
        data: {
          tokens_used: { increment: amount }
        }
      });
      
      // Optional: Log for history (remove if you don't need history)
      await prisma.tokenUsageLog.create({
        data: {
          user_id: userId,
          tokens_used: amount,
          operation,
        }
      });
      
      console.log(`🎯 Recorded ${amount} tokens for user ${userId} (${operation})`);
    } catch (error) {
      console.error('Failed to record token usage:', error);
    }
  }
  
  // Check if user has enough tokens
  static async canUseTokens(userId: string, amount: number): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
        select: { tokens_used: true, token_limit: true }
      });
      
      if (!subscription) return false;
      
      return (subscription.tokens_used + amount) <= subscription.token_limit;
    } catch (error) {
      console.error('Failed to check token limit:', error);
      return false;
    }
  }
  
  // Reset monthly tokens (call this in a cron job)
  static async resetMonthlyTokens(userId: string) {
    try {
      await prisma.subscription.update({
        where: { user_id: userId },
        data: {
          tokens_used: 0,
          tokens_reset_date: new Date()
        }
      });
      
      console.log(`🔄 Reset tokens for user ${userId}`);
    } catch (error) {
      console.error('Failed to reset tokens:', error);
    }
  }
}

// Simple token estimation function
export function estimateTokens(text: string): number {
  // Simple estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}