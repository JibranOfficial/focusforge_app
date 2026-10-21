import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ProgressBar } from '@/components/Progress';
import { Card, Screen, ScreenHeader, SectionHeader } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { SubjectIcon } from '@/components/SubjectIcon';
import {
  useAddTopic,
  useDeleteSubject,
  useDeleteTopic,
  useSubject,
  useToggleTopic,
} from '@/hooks/queries';
import { errorMessage } from '@/lib/api';
import { useColors } from '@/theme';

export default function SubjectDetailScreen() {
  const router = useRouter();
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useSubject(id);
  const addTopic = useAddTopic(id ?? '');
  const toggleTopic = useToggleTopic(id ?? '');
  const deleteTopic = useDeleteTopic(id ?? '');
  const removeSubject = useDeleteSubject();
  const [topicName, setTopicName] = useState('');

  const subject = q.data;

  const submitTopic = async () => {
    const name = topicName.trim();
    if (!name) return;
    try {
      await addTopic.mutateAsync(name);
      setTopicName('');
    } catch (err) {
      Alert.alert('Could not add topic', errorMessage(err));
    }
  };

  const confirmDelete = () => {
    if (!subject) return;
    Alert.alert(
      'Delete subject',
      `Delete "${subject.name}" along with its topics and tasks? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSubject.mutateAsync(subject.id);
              router.back();
            } catch (err) {
              Alert.alert('Could not delete subject', errorMessage(err));
            }
          },
        },
      ],
    );
  };

  return (
    <Screen
      keyboard
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
    >
      <ScreenHeader
        title={subject?.name ?? 'Subject'}
        right={
          subject ? (
            <Pressable hitSlop={10} onPress={confirmDelete} accessibilityLabel="Delete subject">
              <Ionicons name="trash-outline" size={21} color={c.danger} />
            </Pressable>
          ) : undefined
        }
      />

      {q.isLoading ? <LoadingState /> : null}
      {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}

      {subject ? (
        <>
          <Card style={styles.summary}>
            <View style={styles.summaryRow}>
              <SubjectIcon icon={subject.icon} color={subject.color} size={52} />
              <View style={styles.summaryText}>
                <AppText variant="h3">{subject.name}</AppText>
                <AppText variant="small" tone="muted">
                  {subject.completedTasks} of {subject.tasksCount} tasks done
                </AppText>
              </View>
              <AppText bold tone="accent">
                {subject.progress}%
              </AppText>
            </View>
            <ProgressBar value={subject.progress} color={c.accent} style={styles.bar} />
          </Card>

          <Button
            title="Add task for this subject"
            variant="outline"
            onPress={() => router.push(`/task/new?subjectId=${subject.id}`)}
            icon={<Ionicons name="add" size={18} color={c.text} />}
            style={styles.addTask}
          />

          <SectionHeader title="Topics" />
          {subject.topics.length === 0 ? (
            <EmptyState icon="list-outline" title="No topics yet" hint="Break this subject into topics to track."/>
          ) : (
            subject.topics.map((t) => (
              <Card key={t.id} style={styles.topic}>
                <View style={styles.topicRow}>
                  <Pressable
                    hitSlop={10}
                    onPress={() => toggleTopic.mutate({ topicId: t.id, done: !t.done })}
                    accessibilityLabel="Toggle topic done"
                  >
                    <Ionicons
                      name={t.done ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={t.done ? c.accent : c.muted}
                    />
                  </Pressable>
                  <AppText style={[styles.topicName, t.done ? styles.doneText : null]}>{t.name}</AppText>
                  <Pressable hitSlop={10} onPress={() => deleteTopic.mutate(t.id)} accessibilityLabel="Delete topic">
                    <Ionicons name="close" size={20} color={c.muted} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}

          <View style={styles.addRow}>
            <View style={styles.addInput}>
              <Input
                placeholder="Add a topic"
                value={topicName}
                onChangeText={setTopicName}
                onSubmitEditing={submitTopic}
                returnKeyType="done"
                maxLength={100}
              />
            </View>
            <Pressable
              onPress={submitTopic}
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              accessibilityLabel="Add topic"
            >
              <Ionicons name="add" size={24} color={c.white} />
            </Pressable>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryText: { flex: 1, marginHorizontal: 14 },
  bar: { marginTop: 14 },
  addTask: { marginTop: 14 },
  topic: { marginBottom: 8, padding: 14 },
  topicRow: { flexDirection: 'row', alignItems: 'center' },
  topicName: { flex: 1, marginHorizontal: 12 },
  doneText: { textDecorationLine: 'line-through', opacity: 0.6 },
  addRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  addInput: { flex: 1 },
  addBtn: { width: 52, height: 52, borderRadius: 14, marginLeft: 10, alignItems: 'center', justifyContent: 'center' },
});
