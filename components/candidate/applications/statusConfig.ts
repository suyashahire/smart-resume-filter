import {
  Clock,
  FileSearch,
  Users,
  Gift,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const statusConfig: Record<
  string,
  { icon: LucideIcon; label: string; color: string; bgColor: string; borderColor: string }
> = {
  applied: {
    icon: Clock,
    label: 'Applied',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  screening: {
    icon: FileSearch,
    label: 'Under Review',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  interview: {
    icon: Users,
    label: 'Interview',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  offer: {
    icon: Gift,
    label: 'Offer Received',
    color: 'text-candidate-500',
    bgColor: 'bg-candidate-500/10',
    borderColor: 'border-candidate-500/20',
  },
  hired: {
    icon: CheckCircle,
    label: 'Hired',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  rejected: {
    icon: XCircle,
    label: 'Not Selected',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  withdrawn: {
    icon: AlertCircle,
    label: 'Withdrawn',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
  },
};

export const statusFilterOptions = [
  { value: '', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Under Review' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];
