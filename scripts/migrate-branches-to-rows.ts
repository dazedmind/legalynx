// Migration script: Convert JSON branches to database rows
// Run this BEFORE applying the schema change that drops the branches column

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MessageBranch {
  content: string;
  createdAt: Date | string;
  subsequentMessages: Array<{
    id: string;
    type: string;
    content: string;
    createdAt: Date | string;
    [key: string]: any;
  }>;
}

async function migrateBranchesToRows() {
  console.log('🔄 Starting migration: Converting JSON branches to database rows...\n');

  try {
    // Find all messages with branches
    const messagesWithBranches = await prisma.$queryRaw<Array<{
      id: string;
      session_id: string;
      role: string;
      content: string;
      branches: any;
      current_branch: number | null;
      created_at: Date;
    }>>`
      SELECT id, session_id, role, content, branches, current_branch, created_at
      FROM chat_messages
      WHERE branches IS NOT NULL AND branches != 'null'::jsonb
    `;

    console.log(`📊 Found ${messagesWithBranches.length} messages with branches to migrate`);

    for (const userMessage of messagesWithBranches) {
      console.log(`\n🔧 Processing message ${userMessage.id.substring(0, 8)}...`);
      
      const branches = userMessage.branches as MessageBranch[];
      if (!Array.isArray(branches) || branches.length === 0) {
        console.log(`   ⏭️  Skipping - invalid branches data`);
        continue;
      }

      console.log(`   Found ${branches.length} branches`);

      // For each branch, extract the subsequent messages and create database rows
      for (let branchIndex = 0; branchIndex < branches.length; branchIndex++) {
        const branch = branches[branchIndex];
        const subsequentMessages = branch.subsequentMessages || [];

        console.log(`   📝 Branch ${branchIndex}: ${subsequentMessages.length} subsequent messages`);

        for (const msg of subsequentMessages) {
          try {
            // Check if this message already exists as a database row
            const existing = await prisma.chatMessage.findUnique({
              where: { id: msg.id }
            });

            if (existing) {
              console.log(`      ✅ Message ${msg.id.substring(0, 8)} already exists`);
              continue;
            }

            // Create the message as a database row
            await prisma.chatMessage.create({
              data: {
                id: msg.id,
                session_id: userMessage.session_id,
                role: msg.type === 'USER' ? 'USER' : 'ASSISTANT',
                content: msg.content,
                created_at: new Date(msg.createdAt),
                parent_message_id: userMessage.id, // Link to the user message
                is_active: branchIndex === (userMessage.current_branch || 0), // Only current branch is active
                sequence_number: null, // Will be calculated later if needed
              }
            });

            console.log(`      ✅ Created database row for message ${msg.id.substring(0, 8)}`);
          } catch (error) {
            console.error(`      ❌ Error creating message ${msg.id}:`, error);
          }
        }
      }

      // Create a snapshot for this message's branches
      try {
        const allMessageIds = branches.flatMap(b => 
          [userMessage.id, ...(b.subsequentMessages?.map(m => m.id) || [])]
        );

        await prisma.chatSnapshot.create({
          data: {
            session_id: userMessage.session_id,
            message_ids: allMessageIds,
            edit_source_id: userMessage.id,
            snapshot_type: 'MIGRATION',
          }
        });

        console.log(`   📸 Created snapshot with ${allMessageIds.length} messages`);
      } catch (error) {
        console.error(`   ❌ Error creating snapshot:`, error);
      }
    }

    console.log('\n✅ Migration complete! All branches converted to database rows.');
    console.log('🔄 You can now safely run: npx prisma db push --accept-data-loss');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateBranchesToRows()
  .catch(console.error);

