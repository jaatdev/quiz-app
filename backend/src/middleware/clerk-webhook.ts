import { Webhook } from 'svix';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Clerk Webhook Handler for User Events
export async function handleClerkWebhook(req: Request, res: Response) {
  // Get the webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Get the headers
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  // Get the body
  const payload = req.body;
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return res.status(400).json({ error: 'Webhook verification failed' });
  }

  // Handle the webhook
  const eventType = evt.type;
  const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

  console.log(`Webhook received: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
      case 'user.updated':
        // Sync user to database
        const primaryEmail = email_addresses?.find(
          (e: any) => e.id === evt.data.primary_email_address_id
        );

        await prisma.user.upsert({
          where: { clerkId: id },
          update: {
            email: primaryEmail?.email_address || '',
            name: `${first_name || ''} ${last_name || ''}`.trim() || username || 'Anonymous',
            avatar: image_url,
          },
          create: {
            clerkId: id,
            email: primaryEmail?.email_address || '',
            name: `${first_name || ''} ${last_name || ''}`.trim() || username || 'Anonymous',
            avatar: image_url,
            role: 'user',
          },
        });

        console.log(`✅ User ${id} synced to database`);
        break;

      case 'user.deleted':
        // Optionally handle user deletion
        await prisma.user.update({
          where: { clerkId: id },
          data: {
            // You could add a 'deleted' flag or actually delete
            // For now, we'll just log it
          },
        });
        console.log(`⚠️ User ${id} deleted from Clerk`);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
