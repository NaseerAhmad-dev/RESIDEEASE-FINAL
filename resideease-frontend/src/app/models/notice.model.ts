export type NoticeCategory = 'general' | 'academic' | 'hostel' | 'maintenance' | 'emergency';
export type NoticePriority = 'normal' | 'important' | 'urgent';

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  postedBy: string;
  isPinned: boolean;
  expiresAt?: string;
  createdAt: string;
}
