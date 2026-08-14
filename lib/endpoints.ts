// frontend/lib/endpoints.ts
// Type-safe API endpoints

import apiClient from './api';
import type {
  // Auth
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshRequest,
  RefreshResponse,
  UserResponse,
  
  // Profile
  ProfileResponse,
  ProfileUpdateRequest,
  
  // Settings
  SettingsResponse,
  SettingsUpdateRequest,
  
  // Dashboard
  DashboardResponse,
  
  // Conversation
  StartSessionRequest,
  SessionResponse,
  MessageSendRequest,
  AIResponse,
  CoachingReportResponse,
  ConversationHistoryResponse,
  
  // Gamification
  GamificationProfileResponse,
  AchievementCatalogResponse,
  
  // Curriculum
  CurriculumListResponse,
  CurriculumDetailResponse,
  UnitListResponse,
  LessonListResponse,
  LessonDetailResponse,
  
  // Progress
  LessonProgressResponse,
  ExerciseSubmitRequest,
  ExerciseSubmitResponse,
  LessonCompleteResponse,
  ProgressListResponse,
  
  // Admin
  AdminCurriculumCreateRequest,
  AdminCurriculumResponse,
  AdminCurriculumListResponse,
  AdminCurriculumUpdateRequest,
  AdminUnitCreateRequest,
  AdminUnitResponse,
  AdminUnitListResponse,
  AdminUnitUpdateRequest,
  AdminLessonCreateRequest,
  AdminLessonResponse,
  AdminLessonListResponse,
  AdminLessonUpdateRequest,
  AdminExerciseCreateRequest,
  AdminExerciseResponse,
  AdminExerciseListResponse,
  AdminExerciseUpdateRequest,
  
  // RAG
  DocumentUploadResponse,
  RAGSearchRequest,
  RAGSearchResponse,
  
  // Voice
  VoiceTranscriptionResponse,
  PronunciationFeedbackResponse,
} from '@/types/api';

// ============================================================
// Authentication
// ============================================================

export const authEndpoints = {
  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  refresh: (data: RefreshRequest) =>
    apiClient.post<RefreshResponse>('/auth/refresh', data),

  logout: () => {
    const refreshToken = typeof window !== 'undefined'
      ? localStorage.getItem('refresh_token')
      : null;
    // Backend LogoutRequest uses alias "refreshToken" (camelCase).
    // Send the token so the backend can revoke it from the database.
    return apiClient.post<void>('/auth/logout', { refreshToken: refreshToken || '' });
  },

  me: () =>
    apiClient.get<UserResponse>('/auth/me'),
};

// ============================================================
// Profile
// ============================================================

export const profileEndpoints = {
  get: () =>
    apiClient.get<ProfileResponse>('/profile'),

  update: (data: ProfileUpdateRequest) =>
    apiClient.put<ProfileResponse>('/profile', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ avatar_url: string }>('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ============================================================
// Settings
// ============================================================

export const settingsEndpoints = {
  get: () =>
    apiClient.get<SettingsResponse>('/settings'),

  update: (data: SettingsUpdateRequest) =>
    apiClient.put<SettingsResponse>('/settings', data),
};

// ============================================================
// Dashboard
// ============================================================

export const dashboardEndpoints = {
  get: () =>
    apiClient.get<DashboardResponse>('/dashboard'),
};

// ============================================================
// AI Conversations
// ============================================================

export const conversationEndpoints = {
  start: (data: StartSessionRequest) =>
    apiClient.post<SessionResponse>('/conversations/start', data),

  sendMessage: (sessionId: string, data: MessageSendRequest) =>
    apiClient.post<AIResponse>(`/conversations/${sessionId}/messages`, data),

  getMessages: (sessionId: string) =>
    apiClient.get<MessageResponse[]>(`/conversations/${sessionId}/messages`),

  end: (sessionId: string) =>
    apiClient.post<CoachingReportResponse>(`/conversations/${sessionId}/end`),

  getHistory: (limit?: number) =>
    apiClient.get<ConversationHistoryResponse>(`/conversations/history${limit ? `?limit=${limit}` : ''}`),

  getReport: (sessionId: string) =>
    apiClient.get<CoachingReportResponse>(`/conversations/${sessionId}/report`),
};

// ============================================================
// Gamification
// ============================================================

export const gamificationEndpoints = {
  getProfile: () =>
    apiClient.get<GamificationProfileResponse>('/gamification/profile'),

  getAchievements: () =>
    apiClient.get<AchievementCatalogResponse>('/gamification/achievements'),
};

// ============================================================
// Curriculum (Public)
// ============================================================

export const curriculumEndpoints = {
  list: (targetLanguage?: string) =>
    apiClient.get<CurriculumListResponse>(`/curricula${targetLanguage ? `?target_language=${targetLanguage}` : ''}`),

  get: (curriculumId: string) =>
    apiClient.get<CurriculumDetailResponse>(`/curricula/${curriculumId}`),

  listUnits: (curriculumId: string) =>
    apiClient.get<UnitListResponse>(`/curricula/${curriculumId}/units`),

  listLessons: (unitId: string) =>
    apiClient.get<LessonListResponse>(`/units/${unitId}/lessons`),

  getLesson: (lessonId: string) =>
    apiClient.get<LessonDetailResponse>(`/lessons/${lessonId}`),
};

// ============================================================
// Lesson Progress
// ============================================================

export const lessonProgressEndpoints = {
  start: (lessonId: string) =>
    apiClient.post<LessonProgressResponse>(`/lessons/${lessonId}/start`),

  submitExercise: (lessonId: string, exerciseId: string, data: ExerciseSubmitRequest) =>
    apiClient.post<ExerciseSubmitResponse>(`/lessons/${lessonId}/exercises/${exerciseId}/submit`, data),

  complete: (lessonId: string) =>
    apiClient.post<LessonCompleteResponse>(`/lessons/${lessonId}/complete`),

  getProgress: (lessonId: string) =>
    apiClient.get<LessonProgressResponse>(`/lessons/${lessonId}/progress`),

  listMyProgress: () =>
    apiClient.get<ProgressListResponse>('/progress'),
};

// ============================================================
// Admin - Curriculum (Phase 11)
// ============================================================

export const adminCurriculumEndpoints = {
  // Curriculum
  create: (data: AdminCurriculumCreateRequest) =>
    apiClient.post<AdminCurriculumResponse>('/admin/curricula', data),

  list: () =>
    apiClient.get<AdminCurriculumListResponse>('/admin/curricula'),

  get: (curriculumId: string) =>
    apiClient.get<AdminCurriculumResponse>(`/admin/curricula/${curriculumId}`),

  update: (curriculumId: string, data: AdminCurriculumUpdateRequest) =>
    apiClient.put<AdminCurriculumResponse>(`/admin/curricula/${curriculumId}`, data),

  delete: (curriculumId: string) =>
    apiClient.delete<void>(`/admin/curricula/${curriculumId}`),

  publish: (curriculumId: string) =>
    apiClient.post<AdminCurriculumResponse>(`/admin/curricula/${curriculumId}/publish`),

  unpublish: (curriculumId: string) =>
    apiClient.post<AdminCurriculumResponse>(`/admin/curricula/${curriculumId}/unpublish`),

  // Unit
  createUnit: (curriculumId: string, data: AdminUnitCreateRequest) =>
    apiClient.post<AdminUnitResponse>(`/admin/curricula/${curriculumId}/units`, data),

  listUnits: (curriculumId: string) =>
    apiClient.get<AdminUnitListResponse>(`/admin/curricula/${curriculumId}/units`),

  updateUnit: (unitId: string, data: AdminUnitUpdateRequest) =>
    apiClient.put<AdminUnitResponse>(`/admin/units/${unitId}`, data),

  deleteUnit: (unitId: string) =>
    apiClient.delete<void>(`/admin/units/${unitId}`),

  publishUnit: (unitId: string) =>
    apiClient.post<AdminUnitResponse>(`/admin/units/${unitId}/publish`),

  unpublishUnit: (unitId: string) =>
    apiClient.post<AdminUnitResponse>(`/admin/units/${unitId}/unpublish`),

  // Lesson
  createLesson: (unitId: string, data: AdminLessonCreateRequest) =>
    apiClient.post<AdminLessonResponse>(`/admin/units/${unitId}/lessons`, data),

  listLessons: (unitId: string) =>
    apiClient.get<AdminLessonListResponse>(`/admin/units/${unitId}/lessons`),

  getLesson: (lessonId: string) =>
    apiClient.get<AdminLessonResponse>(`/admin/lessons/${lessonId}`),

  updateLesson: (lessonId: string, data: AdminLessonUpdateRequest) =>
    apiClient.put<AdminLessonResponse>(`/admin/lessons/${lessonId}`, data),

  deleteLesson: (lessonId: string) =>
    apiClient.delete<void>(`/admin/lessons/${lessonId}`),

  publishLesson: (lessonId: string) =>
    apiClient.post<AdminLessonResponse>(`/admin/lessons/${lessonId}/publish`),

  unpublishLesson: (lessonId: string) =>
    apiClient.post<AdminLessonResponse>(`/admin/lessons/${lessonId}/unpublish`),

  // Exercise
  createExercise: (lessonId: string, data: AdminExerciseCreateRequest) =>
    apiClient.post<AdminExerciseResponse>(`/admin/lessons/${lessonId}/exercises`, data),

  listExercises: (lessonId: string) =>
    apiClient.get<AdminExerciseListResponse>(`/admin/lessons/${lessonId}/exercises`),

  updateExercise: (exerciseId: string, data: AdminExerciseUpdateRequest) =>
    apiClient.put<AdminExerciseResponse>(`/admin/exercises/${exerciseId}`, data),

  deleteExercise: (exerciseId: string) =>
    apiClient.delete<void>(`/admin/exercises/${exerciseId}`),
};

// ============================================================
// RAG / Upload
// ============================================================

export const ragEndpoints = {
  uploadDocument: (file: File, title?: string, description?: string, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (category) formData.append('category', category);
    return apiClient.post<DocumentUploadResponse>('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  listDocuments: () =>
    apiClient.get<DocumentUploadResponse[]>('/upload/documents'),

  deleteDocument: (documentId: string) =>
    apiClient.delete<void>(`/upload/documents/${documentId}`),

  search: (data: RAGSearchRequest) =>
    apiClient.post<RAGSearchResponse>('/upload/search', data),

  getContext: (data: RAGSearchRequest) =>
    apiClient.post<{ context: string }>('/upload/context', data),
};

// ============================================================
// Voice
// ============================================================

export const voiceEndpoints = {
  transcribe: (file: File, language: string = 'en') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    return apiClient.post<VoiceTranscriptionResponse>('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  textToSpeech: (text: string, voice: string = 'nova', speed: number = 1.0) =>
    apiClient.post<Blob>('/voice/tts', { text, voice, speed }, {
      responseType: 'blob',
    }),

  analyzePronunciation: (file: File, expectedText: string, language: string = 'en') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('expected_text', expectedText);
    formData.append('language', language);
    return apiClient.post<PronunciationFeedbackResponse>('/voice/pronunciation', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  voiceMessage: (sessionId: string, file: File, language: string = 'en') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    return apiClient.post<AIResponse>(`/voice/conversation/${sessionId}/voice-message`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};