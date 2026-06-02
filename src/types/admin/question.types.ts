export type Question = {
  id: number;
  question_name: string;
  question_link: string;
  topic_id: number;
  platform: 'LEETCODE' | 'GFG' | 'OTHER';
  level: 'EASY' | 'MEDIUM' | 'HARD';
  // type removed - now in QuestionVisibility
  topic?: {
    topic_name: string;
    slug: string;
  };
  isAssignedInTopic?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CreateQuestionData = {
  question_name: string;
  question_link: string;
  topic_id: number;
  level?: 'EASY' | 'MEDIUM' | 'HARD';
  // type removed - set during assignment to class
};

export type UpdateQuestionData = Partial<CreateQuestionData>;

export interface QuestionFilters {
  page?: number;
  limit?: number;
  search?: string;
  topic?: string;
  topicSlug?: string;
  level?: string;
  platform?: string;
  type?: string;
  assignmentStatus?: 'all' | 'assigned' | 'unassigned';
  assignmentBatchSlug?: string;
  assignmentTopicSlug?: string;
  assignmentClassSlug?: string;
}

// New type for assigned questions with visibility info
export type AssignedQuestion = Question & {
  visibility_id: number;
  type: 'HOMEWORK' | 'CLASSWORK';
  assigned_at: string;
};

export type QuestionsResponse = {
  data: Question[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Component Props
export interface QuestionsHeaderProps {
  totalRecords: number;
}

export interface QuestionsFilterProps {
  qSearch: string;
  setQSearch: (value: string) => void;
  qLevel: string;
  setQLevel: (value: string) => void;
  qPlatform: string;
  setQPlatform: (value: string) => void;
  setIsCreateOpen: (value: boolean) => void;
  setIsBulkUploadOpen: (value: boolean) => void;
  setPage: (value: number) => void;
}

export interface QuestionsTableProps {
  questions: Question[];
  loading: boolean;
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
  setPage: (value: number) => void;
  setLimit: (value: number) => void;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
}

export interface QuestionsModalsProps {
  isCreateOpen: boolean;
  setIsCreateOpen: (value: boolean) => void;
  isEditOpen: boolean;
  setIsEditOpen: (value: boolean) => void;
  isDeleteOpen: boolean;
  setIsDeleteOpen: (value: boolean) => void;
  isBulkUploadOpen: boolean;
  setIsBulkUploadOpen: (value: boolean) => void;
  selectedQ: Question | null;
  loadQuestions: () => void;
  topicsForBulkUpload: Array<{ label: string; value: string }>;
}

export interface CreateQuestionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  topics: Array<{ label: string; value: string }>;
}

export interface UpdateQuestionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  question: Question | null;
  topics: Array<{ label: string; value: string }>;
}

export interface DeleteQuestionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  question: Question | null;
}

export interface BulkUploadQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  topics: Array<{ label: string; value: string }>;
}
