import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, tzOffset } from '@/lib/api';
import type {
  HomeData,
  Priority,
  ProgressData,
  ProgressRange,
  SessionResult,
  Settings,
  Subject,
  SubjectDetail,
  Task,
} from '@/types';

// ---------- Queries ----------

export function useHome() {
  return useQuery({
    queryKey: ['home'],
    queryFn: () => api.get<HomeData>(`/stats/home?tzOffset=${tzOffset()}`),
  });
}

export function useTasksRange(from: Date, to: Date) {
  const f = from.toISOString();
  const t = to.toISOString();
  return useQuery({
    queryKey: ['tasks', f, t],
    queryFn: async () =>
      (await api.get<{ tasks: Task[] }>(`/tasks?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`)).tasks,
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ['task', id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get<{ task: Task }>(`/tasks/${id}`)).task,
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get<{ subjects: Subject[] }>('/subjects')).subjects,
  });
}

export function useSubject(id: string | undefined) {
  return useQuery({
    queryKey: ['subject', id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get<{ subject: SubjectDetail }>(`/subjects/${id}`)).subject,
  });
}

export function useProgress(range: ProgressRange) {
  return useQuery({
    queryKey: ['progress', range],
    queryFn: () => api.get<ProgressData>(`/stats/progress?range=${range}&tzOffset=${tzOffset()}`),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<{ settings: Settings }>('/settings')).settings,
    staleTime: 5 * 60_000,
  });
}

// ---------- Mutations ----------

/** Refresh everything derived from tasks / sessions after a change. */
export function useRefreshData() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['home'] }),
      qc.invalidateQueries({ queryKey: ['tasks'] }),
      qc.invalidateQueries({ queryKey: ['task'] }),
      qc.invalidateQueries({ queryKey: ['subjects'] }),
      qc.invalidateQueries({ queryKey: ['subject'] }),
      qc.invalidateQueries({ queryKey: ['progress'] }),
    ]);
}

export interface NewTaskInput {
  title: string;
  subjectId: string;
  scheduledAt: string;
  estimatedMinutes: number;
  priority: Priority;
  description?: string | null;
}

export function useCreateTask() {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: async (input: NewTaskInput) => (await api.post<{ task: Task }>('/tasks', input)).task,
    onSuccess: () => refresh(),
  });
}

export function useCompleteTask() {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<{ task: Task }>(`/tasks/${id}/complete`)).task,
    onSuccess: () => refresh(),
  });
}

export function useReopenTask() {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<{ task: Task }>(`/tasks/${id}/reopen`)).task,
    onSuccess: () => refresh(),
  });
}

export function useDeleteTask() {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/tasks/${id}`),
    onSuccess: () => refresh(),
  });
}

export function useRescheduleTask() {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: async (input: { id: string; scheduledAt: string }) =>
      (await api.post<{ task: Task }>(`/tasks/${input.id}/reschedule`, { scheduledAt: input.scheduledAt })).task,
    onSuccess: () => refresh(),
  });
}

export function useUpdateTask() {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: async (input: { id: string; progress?: number; title?: string }) => {
      const { id, ...body } = input;
      return (await api.patch<{ task: Task }>(`/tasks/${id}`, body)).task;
    },
    onSuccess: () => refresh(),
  });
}

export function useCreateSubject() {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: async (input: { name: string; icon: string; color: string }) =>
      (await api.post<{ subject: Subject }>('/subjects', input)).subject,
    onSuccess: () => refresh(),
  });
}

export function useDeleteSubject() {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/subjects/${id}`),
    onSuccess: () => refresh(),
  });
}

export function useAddTopic(subjectId: string) {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: (name: string) => api.post(`/subjects/${subjectId}/topics`, { name }),
    onSuccess: () => refresh(),
  });
}

export function useToggleTopic(subjectId: string) {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: (input: { topicId: string; done: boolean }) =>
      api.patch(`/subjects/${subjectId}/topics/${input.topicId}`, { done: input.done }),
    onSuccess: () => refresh(),
  });
}

export function useDeleteTopic(subjectId: string) {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: (topicId: string) => api.delete(`/subjects/${subjectId}/topics/${topicId}`),
    onSuccess: () => refresh(),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Settings>) =>
      (await api.put<{ settings: Settings }>('/settings', patch)).settings,
    // Optimistic update so switches feel instant.
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ['settings'] });
      const previous = qc.getQueryData<Settings>(['settings']);
      if (previous) qc.setQueryData<Settings>(['settings'], { ...previous, ...patch });
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(['settings'], ctx.previous);
    },
    onSuccess: (settings) => qc.setQueryData(['settings'], settings),
  });
}

export interface RecordSessionInput {
  taskId?: string;
  subjectId?: string;
  startedAt: string;
  endedAt: string;
  plannedMinutes: number;
  durationMinutes: number;
  completed: boolean;
}

export function useRecordSession() {
  const refresh = useRefreshData();
  return useMutation({
    mutationFn: (input: RecordSessionInput) =>
      api.post<SessionResult>('/sessions', { ...input, tzOffset: tzOffset() }),
    onSuccess: () => refresh(),
  });
}
