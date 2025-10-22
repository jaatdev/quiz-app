"use server";

import { revalidatePath } from 'next/cache';
import { safePost } from '@/lib/server-api';

type ImportPayload = {
  endpoint: string; // relative backend path, e.g. '/admin/questions/bulk' or '/admin/multilingual/import'
  body: any;
};

export async function importQuizAction(payload: ImportPayload) {
  try {
    // safePost returns the parsed response or null on failure
    const res = await safePost(payload.endpoint, payload.body);
    if (!res) {
      return { success: false, error: 'Backend request failed' };
    }

    // Optionally revalidate the home page and admin index so new content appears
    try {
      revalidatePath('/');
    } catch (e) {
      // swallow; revalidation is optional and may fail in some environments
    }

    return { success: true, data: res };
  } catch (err: any) {
    console.error('importQuizAction error', err?.message || err);
    return { success: false, error: err?.message || 'Import failed' };
  }
}
