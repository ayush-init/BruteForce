/**
 * Class detail / assigned questions types for admin
 */

import { Question } from './question.types';
import { BatchSelection } from '../common/index.types';

export interface ClassAssignedQuestion {
  id: number;
  question_id: number;
  class_id: number;
  type: 'HOMEWORK' | 'CLASSWORK';
  assigned_at: string;
  question?: Question;
}

export interface ClassDetails {
  class_name: string;
  description?: string;
  pdf_url?: string | null;
  duration_minutes?: number;
  class_date: string;
  topic_name: string;
}

export interface ClassDetailHeaderProps {
  selectedBatch: BatchSelection | null;
  topicSlug: string;
  classSlug: string;
  classDetails: ClassDetails | null;
  onAssignClick: () => void;
}

export interface ClassDetailFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  assignedTotalCount: number;
}

export interface ClassDetailTableProps {
  assignedQuestions: ClassAssignedQuestion[];
  loading: boolean;
  onEditType: (question: ClassAssignedQuestion) => void;
  onRemoveQuestion: (questionId: number) => void;
  // Multi-select — owned by the parent page so the bulk-delete toolbar
  // (which lives outside this component) stays in sync.
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
}

export interface AssignQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchSlug: string;
  topicSlug: string;
  classSlug: string;
  assignedQuestions: ClassAssignedQuestion[];
}

export interface EditQuestionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchSlug: string;
  topicSlug: string;
  classSlug: string;
  question: ClassAssignedQuestion | null;
}

export interface ClassDetailShimmerProps {
  // No props needed
}
