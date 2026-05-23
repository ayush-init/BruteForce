import { apiClient } from '@/api';
import { isAdminToken, clearAuthTokens } from '../lib/auth-utils';
import { showSuccess } from '@/ui/toast';
import { Admin, ApiError } from '@/types/common/api.types';
import { TopicQueryParams } from '@/types/admin/topic.types';
import { ClassFormData, ClassUpdateData } from '@/types/admin/class.types';
import { QuestionFilters, CreateQuestionData, UpdateQuestionData } from '@/types/admin/question.types';
import { StudentSubmitPayload, StudentFilters } from '@/types/admin/student.types';
import { LeaderboardQueryFilters } from '@/types/admin/leaderboard.types';



export const getAdminRoles = async (): Promise<string[]> => {
  const response = await apiClient.get('/api/admin/roles');
  return response.data;
};
export const getCurrentAdmin = async () => {
  // Check if we have an admin token before making the request
  if (!isAdminToken()) {
    clearAuthTokens(); // Clear invalid tokens
    const error = new Error('Access denied. Admins only.');
    const apiError = error as ApiError;
    apiError.response = { status: 403, data: { error: 'Access denied. Admins only.' } };
    throw error;
  }

  const response = await apiClient.get('/api/admin/me');
  return response.data;
};
export const getAdminStats = async (batch_id: number) => {
  const response = await apiClient.post('/api/admin/stats', { batch_id });
  return response.data;
};

export const getAdminBatchTopics = async (batchSlug: string, params?: TopicQueryParams) => {
  const response = await apiClient.get(`/api/admin/${batchSlug}/topics`, { params });
  return response.data; // paginated structure { topics, pagination }
};

export const createAdminTopic = async (formData: FormData) => {
  const response = await apiClient.post('/api/admin/topics', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  showSuccess('Topic Created', 'The new topic has been added successfully.');
  return response.data;
};

export const updateAdminTopic = async (topicSlug: string, formData: FormData) => {
  const response = await apiClient.put(`/api/admin/topics/${topicSlug}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  showSuccess('Topic Updated', 'The topic details have been saved.');
  return response.data;
};

export const deleteAdminTopic = async (topicSlug: string) => {
  const response = await apiClient.delete(`/api/admin/topics/${topicSlug}`);
  showSuccess('Topic Deleted', 'The topic and its content have been removed.');
  return response.data;
};

export const getAllTopics = async () => {
  const response = await apiClient.get('/api/admin/topics');
  return response.data;
};

// ==========================================
// ADMIN PANEL CLASS ENDPOINTS
// ==========================================

export const getAdminTopicClasses = async (batchSlug: string, topicSlug: string) => {
  const response = await apiClient.get(`/api/admin/${batchSlug}/topics/${topicSlug}/classes`);
  return response.data;
};

export const createAdminClass = async (batchSlug: string, topicSlug: string, data: ClassFormData) => {
  const response = await apiClient.post(`/api/admin/${batchSlug}/topics/${topicSlug}/classes`, data);
  showSuccess('Class Created', 'The new class has been added to this topic.');
  return response.data;
};

export const updateAdminClass = async (batchSlug: string, topicSlug: string, classSlug: string, data: ClassUpdateData) => {
  const response = await apiClient.patch(`/api/admin/${batchSlug}/topics/${topicSlug}/classes/${classSlug}`, data);
  showSuccess('Class Updated', 'The class details have been saved.');
  return response.data;
};

export const deleteAdminClass = async (batchSlug: string, topicSlug: string, classSlug: string) => {
  const response = await apiClient.delete(`/api/admin/${batchSlug}/topics/${topicSlug}/classes/${classSlug}`);
  showSuccess('Class Deleted', 'The class and its questions have been removed.');
  return response.data;
};

// ==========================================
// ADMIN PANEL CLASS QUESTIONS ENDPOINTS
// ==========================================

export const getAdminClassQuestions = async (batchSlug: string, topicSlug: string, classSlug: string) => {
  const response = await apiClient.get(`/api/admin/${batchSlug}/topics/${topicSlug}/classes/${classSlug}/questions`);
  return response.data;
};

// New format: questions array with per-question types
interface AssignQuestionItem {
  question_id: number;
  type: 'HOMEWORK' | 'CLASSWORK';
}

export const assignQuestionsToClass = async (
  batchSlug: string,
  topicSlug: string,
  classSlug: string,
  data: { questions: AssignQuestionItem[] }
) => {
  const response = await apiClient.post(`/api/admin/${batchSlug}/topics/${topicSlug}/classes/${classSlug}/questions`, data);
  showSuccess('Questions Assigned', 'The selected questions have been added to this class.');
  return response.data;
};

export const removeQuestionFromClass = async (batchSlug: string, topicSlug: string, classSlug: string, questionId: number) => {
  const response = await apiClient.delete(`/api/admin/${batchSlug}/topics/${topicSlug}/classes/${classSlug}/questions/${questionId}`);
  showSuccess('Question Removed', 'The question has been removed from this class.');
  return response.data;
};

// Update question visibility type (edit homework/classwork for assigned question)
export const updateQuestionVisibilityType = async (
  batchSlug: string,
  topicSlug: string,
  classSlug: string,
  visibilityId: number,
  type: 'HOMEWORK' | 'CLASSWORK'
) => {
  const response = await apiClient.patch(
    `/api/admin/${batchSlug}/topics/${topicSlug}/classes/${classSlug}/visibility/${visibilityId}`,
    { type }
  );
  showSuccess('Type Updated', 'The question visibility has been changed.');
  return response.data;
};

export const getAdminQuestions = async (params: QuestionFilters) => {
  const response = await apiClient.get('/api/admin/questions', { params });
  return response.data; // paginated structure
};

export const createAdminQuestion = async (data: CreateQuestionData) => {
  const response = await apiClient.post('/api/admin/questions', data);
  showSuccess('Question Created', 'The new question has been added to the question bank.');
  return response.data;
};

export const updateAdminQuestion = async (id: number, data: UpdateQuestionData) => {
  const response = await apiClient.patch(`/api/admin/questions/${id}`, data);
  showSuccess('Question Updated', 'The question details have been saved.');
  return response.data;
};

export const deleteAdminQuestion = async (id: number) => {
  const response = await apiClient.delete(`/api/admin/questions/${id}`);
  showSuccess('Question Deleted', 'The question has been removed from the question bank.');
  return response.data;
};

// ==========================================
// ADMIN PANEL STUDENT ENDPOINTS
// ==========================================

export const getAdminStudents = async (params: StudentFilters) => {
  const response = await apiClient.get('/api/admin/students', { params });
  return response.data;
};

// Success toasts for these three calls are fired by the caller (the admin
// students page) so we can include the specific student's name in the
// message rather than a generic "details have been saved". Don't add
// showSuccess() here or we'll get duplicate toasts on every action.
export const createAdminStudent = async (data: StudentSubmitPayload) => {
  const response = await apiClient.post('/api/admin/students', data);
  return response.data;
};

export const updateAdminStudent = async (id: number, data: StudentSubmitPayload) => {
  const response = await apiClient.patch(`/api/admin/students/${id}`, data);
  return response.data;
};

export const deleteAdminStudent = async (id: number) => {
  const response = await apiClient.delete(`/api/admin/students/${id}`);
  return response.data;
};

export const bulkUploadStudents = async (formData: FormData, defaultPassword?: string) => {
  if (defaultPassword) {
    formData.append('default_password', defaultPassword);
  }
  const response = await apiClient.post('/api/admin/bulk-operations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const bulkUploadQuestions = async (formData: FormData) => {
  const response = await apiClient.post('/api/admin/questions/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  showSuccess('Upload Complete', 'All questions from the CSV have been added to the question bank.');
  return response.data;
};

export const getAdminStudentProfile = async (username: string) => {
  // Using the public profiling route due to internal restructuring
  const response = await apiClient.get(`/api/students/profile/${username}`);
  return response.data;
};

// ==========================================
// ADMIN PANEL LEADERBOARD ENDPOINTS
// ==========================================

export const getAdminLeaderboard = async (query: { page?: number; limit?: number; search?: string }, body: LeaderboardQueryFilters) => {
  const response = await apiClient.post('/api/admin/leaderboard', body, { params: query });
  return response.data;
};

