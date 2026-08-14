// types/api.ts
// TypeScript types for API responses

// ============================================================
// Common Types
// ============================================================

export interface ApiError {
  detail: string;
  code?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  page_size?: number;
}

// ============================================================
// User Types
// ============================================================

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  profile?: Profile;
  settings?: UserSettings;
}

export interface Profile {
  id: string;
  user_id: string;
  native_language: string;
  learning_language: string;
  level: number;
  learning_style: string;
  daily_goal: number;
  bio?: string;
  avatar_url?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  ai_speed: string;
  ai_voice: string;
  grammar_correction: boolean;
  translation_enabled: boolean;
  email_notifications: boolean;
  daily_reminders: boolean;
  theme: string;
}

// ============================================================
// Auth Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface UserResponse {
  user: User;
}

// ============================================================
// Profile & Settings Types
// ============================================================

// Fixed: Replaced empty interface with type alias
export type ProfileResponse = Profile;

export interface ProfileUpdateRequest {
  full_name?: string;
  username?: string;
  native_language?: string;
  learning_language?: string;
  level?: number;
  learning_style?: string;
  daily_goal?: number;
  bio?: string;
}

// Fixed: Replaced empty interface with type alias
export type SettingsResponse = UserSettings;

export interface SettingsUpdateRequest {
  ai_speed?: string;
  ai_voice?: string;
  grammar_correction?: boolean;
  translation_enabled?: boolean;
  email_notifications?: boolean;
  daily_reminders?: boolean;
  theme?: string;
}

// ============================================================
// Dashboard Types
// ============================================================

export interface DashboardResponse {
  user: User;
  profile: Profile;
  stats: DashboardStats;
  recent_activity: ActivityItem[];
  continue_lesson?: ContinueLesson;
  weekly_progress: WeeklyProgressPoint[];
  achievements?: AchievementItem[];
}

export interface DashboardStats {
  total_xp: number;
  current_streak: number;
  lessons_completed: number;
  lessons_in_progress: number;
  total_sessions: number;
}

export interface ActivityItem {
  id: string;
  type: 'lesson_started' | 'lesson_completed' | 'exercise_completed' | 'conversation_ended';
  title: string;
  description: string;
  xp_earned: number;
  created_at: string;
}

export interface ContinueLesson {
  lesson_id: string;
  lesson_title: string;
  unit_title: string;
  progress: number;
  estimated_duration_minutes: number;
}

export interface WeeklyProgressPoint {
  day: string;
  xp: number;
}

export interface AchievementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at?: string;
}

// ============================================================
// Conversation Types
// ============================================================

export interface StartSessionRequest {
  language: string;
  native_language: string;
  level: string;
  topic?: string;
}

export interface SessionResponse {
  id: string;
  title: string;
  target_language: string;
  native_language: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at?: string;
}

export interface MessageSendRequest {
  message: string;
  language: string;
  level: string;
}

export interface AIResponse {
  response: string;
  grammar_corrections: GrammarCorrection[];
  vocabulary_suggestions: VocabularySuggestion[];
}

export interface GrammarCorrection {
  original: string;
  correction: string;
  explanation: string;
}

export interface VocabularySuggestion {
  word: string;
  suggestion: string;
  alternatives: string[];
  context: string;
}

export interface CoachingReportResponse {
  session_id: string;
  fluency_score: number;
  grammar_score: number;
  vocabulary_score: number;
  pronunciation_readiness_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_tips: string[];
  new_vocabulary: VocabularyItem[];
  grammar_mistakes: GrammarMistake[];
  summary: string;
  recommended_practice: string;
  generated_at: string;
}

export interface VocabularyItem {
  word: string;
  meaning: string;
  example: string;
}

export interface GrammarMistake {
  mistake: string;
  correction: string;
  explanation: string;
}

export interface ConversationHistoryResponse {
  sessions: SessionResponse[];
  total: number;
}

// ============================================================
// Gamification Types
// ============================================================

export interface GamificationProfileResponse {
  total_xp: number;
  total_messages_sent: number;
  total_sessions_completed: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string;
  achievements: UnlockedAchievement[];
}

export interface UnlockedAchievement {
  achievement_code: string;
  title: string;
  description: string;
  unlocked_at: string;
}

export interface AchievementCatalogResponse {
  achievements: AchievementCatalogItem[];
}

export interface AchievementCatalogItem {
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

// ============================================================
// Curriculum Types
// ============================================================

export interface CurriculumSummary {
  id: string;
  title: string;
  description?: string;
  target_language: string;
  native_language?: string;
  difficulty_level: string;
}

export interface CurriculumListResponse {
  items: CurriculumSummary[];
}

export interface CurriculumDetailResponse extends CurriculumSummary {
  units: UnitSummary[];
}

export interface UnitSummary {
  id: string;
  curriculum_id: string;
  title: string;
  description?: string;
  order_index: number;
  lesson_count: number;
}

export interface UnitListResponse {
  items: UnitSummary[];
}

export interface LessonSummary {
  id: string;
  unit_id: string;
  title: string;
  description?: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  order_index: number;
  exercise_count: number;
}

export interface LessonListResponse {
  items: LessonSummary[];
}

export interface LessonDetailResponse extends LessonSummary {
  learning_objectives: string[];
  exercises: ExercisePublicResponse[];
}

export interface ExercisePublicResponse {
  id: string;
  lesson_id: string;
  exercise_type: string;
  prompt: string;
  // Fixed: Replaced any with Record<string, unknown>
  content: Record<string, unknown>;
  points: number;
  order_index: number;
}

// ============================================================
// Lesson Progress Types
// ============================================================

export interface LessonProgressResponse {
  id: string;
  user_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number;
  completion_percentage: number;
  attempt_count: number;
  started_at?: string;
  completed_at?: string;
  last_accessed_at: string;
}

export interface ExerciseSubmitRequest {
  // Fixed: Replaced any with Record<string, unknown>
  answer: Record<string, unknown>;
}

export interface ExerciseSubmitResponse {
  is_correct: boolean;
  score_awarded: number;
  total_score: number;
  feedback: string;
  attempt_number: number;
}

export interface LessonCompleteResponse {
  progress_id: string;
  lesson_id: string;
  score: number;
  xp_earned: number;
  streak_updated: boolean;
  achievements_unlocked: string[];
}

export interface ProgressListResponse {
  items: LessonProgressResponse[];
  total: number;
}

// ============================================================
// Admin Types
// ============================================================

export interface AdminCurriculumCreateRequest {
  title: string;
  description?: string;
  target_language: string;
  native_language?: string;
  difficulty_level: string;
  is_published: boolean;
}

export interface AdminCurriculumUpdateRequest {
  title?: string;
  description?: string;
  target_language?: string;
  native_language?: string;
  difficulty_level?: string;
}

export interface AdminCurriculumResponse {
  id: string;
  title: string;
  description?: string;
  target_language: string;
  native_language?: string;
  difficulty_level: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminCurriculumListResponse {
  items: AdminCurriculumResponse[];
}

export interface AdminUnitCreateRequest {
  title: string;
  description?: string;
  order_index?: number;
  is_published: boolean;
}

export interface AdminUnitUpdateRequest {
  title?: string;
  description?: string;
  order_index?: number;
}

export interface AdminUnitResponse {
  id: string;
  curriculum_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUnitListResponse {
  items: AdminUnitResponse[];
}

export interface AdminLessonCreateRequest {
  title: string;
  description?: string;
  target_language: string;
  native_language?: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  learning_objectives: string[];
  order_index?: number;
  is_published: boolean;
}

export interface AdminLessonUpdateRequest {
  title?: string;
  description?: string;
  target_language?: string;
  native_language?: string;
  difficulty_level?: string;
  estimated_duration_minutes?: number;
  learning_objectives?: string[];
  order_index?: number;
}

export interface AdminLessonResponse {
  id: string;
  unit_id: string;
  title: string;
  description?: string;
  target_language: string;
  native_language?: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  learning_objectives: string[];
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLessonListResponse {
  items: AdminLessonResponse[];
}

export interface AdminExerciseCreateRequest {
  exercise_type: string;
  prompt: string;
  // Fixed: Replaced any with Record<string, unknown>
  content: Record<string, unknown>;
  points: number;
  order_index?: number;
}

export interface AdminExerciseUpdateRequest {
  prompt?: string;
  // Fixed: Replaced any with Record<string, unknown>
  content?: Record<string, unknown>;
  points?: number;
  order_index?: number;
}

export interface AdminExerciseResponse {
  id: string;
  lesson_id: string;
  exercise_type: string;
  prompt: string;
  // Fixed: Replaced any with Record<string, unknown>
  content: Record<string, unknown>;
  points: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AdminExerciseListResponse {
  items: AdminExerciseResponse[];
}

// ============================================================
// RAG Types
// ============================================================

export interface DocumentUploadResponse {
  success: boolean;
  document_id: string;
  filename: string;
  chunk_count: number;
  status: string;
  message: string;
}

export interface RAGSearchRequest {
  query: string;
  top_k?: number;
  category?: string;
}

export interface RAGSearchResult {
  chunk_id: string;
  document_id: string;
  content: string;
  similarity_score: number;
  document: {
    title: string;
    filename: string;
  };
}

export interface RAGSearchResponse {
  query: string;
  results: RAGSearchResult[];
  total: number;
}

// ============================================================
// Voice Types
// ============================================================

export interface VoiceTranscriptionResponse {
  text: string;
  language: string;
  success: string;
}

export interface PronunciationFeedbackResponse {
  transcribed: string;
  expected: string;
  score: number;
  feedback: string[];
  is_correct: boolean;
}