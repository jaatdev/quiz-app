"use server";

import { revalidatePath } from 'next/cache';
import { safePost } from '@/lib/server-api';
import serverApi from '@/lib/server-api';
import { auth } from '@clerk/nextjs/server';

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

// Admin: delete a subject
export async function deleteSubjectAction(subjectId: string) {
  try {
    const resp = await serverApi.delete(`/admin/subjects/${subjectId}`);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('deleteSubjectAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Delete failed' };
  }
}

// Admin: delete a topic
export async function deleteTopicAction(topicId: string) {
  try {
    const resp = await serverApi.delete(`/admin/topics/${topicId}`);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('deleteTopicAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Delete failed' };
  }
}

// Admin: create or update subject
export async function saveSubjectAction(payload: { id?: string; name: string }) {
  try {
    if (payload.id) {
      const resp = await serverApi.put(`/admin/subjects/${payload.id}`, { name: payload.name });
      return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
    }
    const resp = await serverApi.post(`/admin/subjects`, { name: payload.name });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('saveSubjectAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Save failed' };
  }
}

// Admin: create or update topic
export async function saveTopicAction(payload: { id?: string; name: string; subjectId: string }) {
  try {
    if (payload.id) {
      const resp = await serverApi.put(`/admin/topics/${payload.id}`, { name: payload.name, subjectId: payload.subjectId });
      return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
    }
    const resp = await serverApi.post(`/admin/topics`, { name: payload.name, subjectId: payload.subjectId });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('saveTopicAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Save failed' };
  }
}

// Admin: bulk import subjects
export async function importSubjectsAction(names: string[]) {
  try {
    const resp = await serverApi.post(`/admin/subjects/bulk`, { names });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('importSubjectsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Import failed' };
  }
}

// Admin: bulk import topics
export async function importTopicsAction(rows: Array<{ subjectName: string; topicName: string }>) {
  try {
    const resp = await serverApi.post(`/admin/topics/bulk`, { rows });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('importTopicsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Import failed' };
  }
}

// Admin: fetch topics (used by client components)
export async function fetchTopicsAction() {
  try {
    const data = await safePost('/admin/topics/query', {} as any).catch(() => null);
    // Some backends return via GET; fallback to GET if POST-returned null
    if (data == null) {
      const resp = await serverApi.get('/admin/topics');
      return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('fetchTopicsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

// Admin: fetch subtopics for a topic
export async function fetchSubTopicsAction(topicId: string) {
  try {
    const resp = await serverApi.get(`/admin/topics/${topicId}/subtopics`);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchSubTopicsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

// Admin: fetch topic meta by id
export async function fetchTopicByIdAction(topicId: string) {
  try {
    const resp = await serverApi.get(`/admin/topics/${topicId}`);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchTopicByIdAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

// Admin: create subtopic
export async function createSubTopicAction(name: string, topicId: string) {
  try {
    const resp = await serverApi.post(`/admin/subtopics`, { name, topicId });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('createSubTopicAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Create failed' };
  }
}

// Admin: update subtopic
export async function updateSubTopicAction(id: string, name: string) {
  try {
    const resp = await serverApi.put(`/admin/subtopics/${id}`, { name });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('updateSubTopicAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Update failed' };
  }
}

// Admin: delete subtopic
export async function deleteSubTopicAction(id: string) {
  try {
    const resp = await serverApi.delete(`/admin/subtopics/${id}`);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('deleteSubTopicAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Delete failed' };
  }
}

// Admin: bulk create subtopics for a topic
export async function bulkCreateSubTopicsAction(topicId: string, names: string[]) {
  try {
    const resp = await serverApi.post(`/admin/topics/${topicId}/subtopics/bulk`, { names });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('bulkCreateSubTopicsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Bulk create failed' };
  }
}

// Admin: bulk create topics under a subject
export async function bulkCreateTopicsAction(subjectId: string, names: string[]) {
  try {
    const resp = await serverApi.post(`/admin/subjects/${subjectId}/topics/bulk`, { topics: names });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('bulkCreateTopicsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Bulk create failed' };
  }
}

// Admin: create or update question
export async function saveQuestionAction(payload: { id?: string; body: any }) {
  try {
    if (payload.id) {
      const resp = await serverApi.put(`/admin/questions/${payload.id}`, payload.body);
      return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
    }
    const resp = await serverApi.post(`/admin/questions`, payload.body);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('saveQuestionAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Save failed' };
  }
}

// Admin: delete question
export async function deleteQuestionAction(questionId: string) {
  try {
    const resp = await serverApi.delete(`/admin/questions/${questionId}`);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('deleteQuestionAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Delete failed' };
  }
}

// Admin: fetch subjects with topics (used by admin overview)
export async function fetchSubjectsWithTopicsAction() {
  try {
    const resp = await serverApi.get('/admin/subjects-with-topics');
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchSubjectsWithTopicsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

// Admin: fetch all users for admin UI
export async function fetchUsersAction() {
  try {
    const resp = await serverApi.get('/admin/users');
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchUsersAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

// Admin: update a user's role
export async function updateUserRoleAction(userId: string, role: string) {
  try {
    const resp = await serverApi.put(`/admin/users/${userId}/role`, { role });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('updateUserRoleAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Update failed' };
  }
}

// Admin: export all subtopics across all subjects/topics (used by admin UI to generate CSV)
export async function exportAllSubTopicsAction() {
  try {
    const resp = await serverApi.get('/admin/subjects-with-topics');
    if (!resp || resp.status < 200 || resp.status >= 300) {
      return { success: false, error: 'Failed to fetch subjects' };
    }
    const subjects = resp.data || [];
    const rows: Array<{ subjectName: string; topicName: string; subTopicId: string; subTopicName: string; questionsCount: number }> = [];

    for (const s of subjects) {
      for (const t of (s.topics || [])) {
        let page = 1;
        const pageSize = 200;
        let totalPages = 1;
        while (page <= totalPages) {
          const stResp = await serverApi.get(`/admin/topics/${t.id}/subtopics`, { params: { page, pageSize } });
          if (!stResp || stResp.status < 200 || stResp.status >= 300) break;
          const stData = stResp.data || { items: [], totalPages: 1 };
          totalPages = stData.totalPages || 1;
          (stData.items || []).forEach((st: any) => {
            rows.push({
              subjectName: s.name,
              topicName: t.name,
              subTopicId: st.id,
              subTopicName: st.name,
              questionsCount: st._count?.questions || 0,
            });
          });
          page++;
        }
      }
    }

    return { success: true, data: rows };
  } catch (err: any) {
    console.error('exportAllSubTopicsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Export failed' };
  }
}

// Admin: translation stats
export async function fetchTranslationStatsAction() {
  try {
    const resp = await serverApi.get('/admin/translations/stats');
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchTranslationStatsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

// Admin: paginated translation questions
export async function fetchTranslationQuestionsAction(page = 1, limit = 20, search?: string, hasHindi?: boolean) {
  try {
    const params: Record<string, any> = { page, limit };
    if (search) params.search = search;
    if (typeof hasHindi === 'boolean') params.hasHindiTranslation = hasHindi;
    const resp = await serverApi.get('/admin/translations/questions', { params });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchTranslationQuestionsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

export async function saveQuestionTranslationAction(questionId: string, body: any) {
  try {
    const resp = await serverApi.put(`/admin/translations/questions/${questionId}`, body);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('saveQuestionTranslationAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Save failed' };
  }
}

// Admin: translation subjects
export async function fetchTranslationSubjectsAction() {
  try {
    const resp = await serverApi.get('/admin/translations/subjects');
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchTranslationSubjectsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

export async function saveSubjectTranslationAction(subjectId: string, body: any) {
  try {
    const resp = await serverApi.put(`/admin/translations/subjects/${subjectId}`, body);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('saveSubjectTranslationAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Save failed' };
  }
}

// Admin: translation topics
export async function fetchTranslationTopicsAction() {
  try {
    const resp = await serverApi.get('/admin/translations/topics');
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchTranslationTopicsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

export async function saveTopicTranslationAction(topicId: string, body: any) {
  try {
    const resp = await serverApi.put(`/admin/translations/topics/${topicId}`, body);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('saveTopicTranslationAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Save failed' };
  }
}

// Admin: fetch subject by id (with topics)
export async function fetchSubjectByIdAction(subjectId: string) {
  try {
    const resp = await serverApi.get(`/admin/subjects/${subjectId}`);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchSubjectByIdAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

// Admin: fetch paginated topics for a subject
export async function fetchTopicsForSubjectAction(subjectId: string, page = 1, pageSize = 12, q?: string) {
  try {
    const params: Record<string, any> = { page, pageSize };
    if (q) params.q = q;
    const resp = await serverApi.get(`/admin/subjects/${subjectId}/topics`, { params });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchTopicsForSubjectAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

// Admin: fetch platform settings (from backend file)
export async function fetchSettingsAction() {
  try {
    const resp = await serverApi.get('/admin/settings');
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data?.data ?? resp?.data };
  } catch (err: any) {
    console.error('fetchSettingsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

export async function saveSettingsAction(payload: any) {
  try {
    const resp = await serverApi.put('/admin/settings', payload);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data?.data ?? resp?.data };
  } catch (err: any) {
    console.error('saveSettingsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Save failed' };
  }
}

// Admin: fetch paginated questions for a topic
export async function fetchQuestionsAction(topicId: string, page = 1, pageSize = 12, q?: string) {
  try {
    const params: Record<string, any> = { page, pageSize };
    if (q) params.q = q;
    const resp = await serverApi.get(`/admin/topics/${topicId}/questions`, { params });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('fetchQuestionsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Fetch failed' };
  }
}

// Admin: bulk import questions into a topic
export async function bulkImportQuestionsAction(topicId: string, questions: any[]) {
  try {
    const resp = await serverApi.post(`/admin/topics/${topicId}/questions/bulk`, { questions });
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('bulkImportQuestionsAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Import failed' };
  }
}

// Upload notes PDF for a topic (server-side)
export async function uploadTopicNotesAction(topicId: string, file: File) {
  try {
    // Build FormData and forward using fetch so we can attach Clerk token
    const formData = new FormData();
    formData.append('notes', file, (file as any).name || 'notes.pdf');

    // Get backend base URL from serverApi (falls back if not set)
    const base = (serverApi.defaults && (serverApi.defaults as any).baseURL) || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

    // Attach Clerk server token via auth()
  const headers: Record<string, string> = {};
    try {
      const authObj = await auth();
      const token = typeof authObj?.getToken === 'function' ? await authObj.getToken() : undefined;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      // swallow
    }

    const resp = await fetch(`${base}/admin/topics/${topicId}/notes`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!resp.ok) {
      let data: any = null;
      try { data = await resp.json(); } catch { data = null; }
      return { success: false, error: data?.error || `Upload failed (${resp.status})` };
    }

    const data = await resp.json().catch(() => null);
    return { success: true, data };
  } catch (err: any) {
    console.error('uploadTopicNotesAction error', err?.message || err);
    return { success: false, error: err?.message || 'Upload failed' };
  }
}

// Delete notes PDF for a topic (server-side)
export async function deleteTopicNotesAction(topicId: string) {
  try {
    const resp = await serverApi.delete(`/admin/topics/${topicId}/notes`);
    return { success: resp?.status >= 200 && resp?.status < 300, data: resp?.data };
  } catch (err: any) {
    console.error('deleteTopicNotesAction error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || 'Delete failed' };
  }
}
