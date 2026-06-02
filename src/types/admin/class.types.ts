/**
 * Class-related types for admin
 */

import { BatchSelection } from '../common/index.types';

export interface Class {
  id: number;
  slug: string;
  class_name: string;
  topic_id: number;
  batch_id: number;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
  description?: string;
  class_date?: string;
  questionCount?: number;
}

export interface ClassFormData {
  class_name: string;
  topic_id: number;
  pdf_url?: string;
}

export interface ClassSubmitPayload {
  class_name: string;
  topic_id: number;
  pdf_url?: string;
}

export interface ClassUpdateData {
  class_name?: string;
  topic_id?: number;
  pdf_url?: string;
}

export interface ClassHeaderProps {
  selectedBatch: BatchSelection | null;
  topicSlug: string;
  onAddClick: () => void;
}

export interface ClassFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  totalRecords: number;
}

export interface ClassTableProps {
  classesList: Class[];
  loading: boolean;
  search: string;
  topicSlug: string;
  onEdit: (cls: Class) => void;
  onDelete: (cls: Class) => void;
  onViewQuestions: (cls: Class) => void;
  // Multi-select — owned by the parent page so the bulk-delete toolbar
  // (which lives outside this component) stays in sync.
  selectedSlugs: string[];
  onToggleSelect: (slug: string) => void;
  onToggleSelectAll: () => void;
}

export interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchSlug: string;
  topicSlug: string;
}

export interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchSlug: string;
  topicSlug: string;
  classData: Class | null;
}

export interface DeleteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchSlug: string;
  topicSlug: string;
  classData: Class | null;
}

export interface DeletePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchSlug: string;
  topicSlug: string;
  classSlug: string | null;
}

export interface ClassesTableShimmerProps {
  // No props needed
}
