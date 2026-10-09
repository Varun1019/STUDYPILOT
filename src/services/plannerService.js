// Revision Planner & Spaced Repetition Engine

import { TOPIC_STATUS } from './masteryService.js';

export function generateRevisionPlan(examDateStr, dailyHours = 3, topics = [], masteryMap = {}) {
  if (!topics || topics.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = examDateStr ? new Date(examDateStr) : new Date(today.getTime() + 30 * 86400000);
  targetDate.setHours(0, 0, 0, 0);

  const totalDaysRemaining = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const daysToSchedule = Math.min(30, totalDaysRemaining); // Schedule up to 30 days ahead

  const isFinalWeek = totalDaysRemaining <= 7;

  // Group topics by status
  const weakTopics = topics.filter(t => (masteryMap[t.id]?.status === TOPIC_STATUS.WEAK || masteryMap[t.id]?.masteryScore < 50));
  const developingTopics = topics.filter(t => masteryMap[t.id]?.status === TOPIC_STATUS.DEVELOPING);
  const strongTopics = topics.filter(t => masteryMap[t.id]?.status === TOPIC_STATUS.STRONG);
  const unattemptedTopics = topics.filter(t => !masteryMap[t.id] || masteryMap[t.id]?.status === TOPIC_STATUS.NOT_ATTEMPTED);

  const planDays = [];

  // Available minutes per day
  const dailyMins = Math.max(60, dailyHours * 60);

  for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
    const currentDate = new Date(today.getTime() + dayOffset * 86400000);
    const dateStr = currentDate.toISOString().split('T')[0];
    const daysUntilExam = totalDaysRemaining - dayOffset;

    let dayLabel = `Day ${dayOffset + 1}`;
    if (dayOffset === 0) dayLabel = 'Today';
    else if (dayOffset === 1) dayLabel = 'Tomorrow';

    const tasks = [];
    let allocatedMins = 0;

    // Rule 1: Final Week Mode (<= 7 days left)
    if (daysUntilExam <= 7) {
      // Add Mock Test or Rapid Quiz
      if (dayOffset % 2 === 0) {
        tasks.push({
          id: `task-${dateStr}-mock`,
          type: 'Mock Test',
          title: 'Full Subject Diagnostic Mock',
          topicName: 'Mixed Topics',
          durationMins: 45,
          completed: false,
          priority: 'High'
        });
        allocatedMins += 45;
      }

      // Fill remaining time with Weak Topics revision & Flashcards
      const priorityPool = [...weakTopics, ...unattemptedTopics, ...developingTopics];
      let topicIdx = dayOffset % (priorityPool.length || 1);

      while (allocatedMins < dailyMins && priorityPool.length > 0 && tasks.length < 5) {
        const topic = priorityPool[topicIdx % priorityPool.length];
        
        tasks.push({
          id: `task-${dateStr}-weak-rev-${tasks.length}`,
          type: 'Revise Notes',
          title: `Rapid Notes & Formula Review: ${topic.name}`,
          topicId: topic.id,
          topicName: topic.name,
          durationMins: 30,
          completed: false,
          priority: 'High'
        });
        allocatedMins += 30;

        tasks.push({
          id: `task-${dateStr}-weak-quiz-${tasks.length}`,
          type: 'Practice Quiz',
          title: `Adaptive Target Quiz: ${topic.name}`,
          topicId: topic.id,
          topicName: topic.name,
          durationMins: 25,
          completed: false,
          priority: 'High'
        });
        allocatedMins += 25;

        topicIdx++;
      }
    } 
    // Rule 2: Normal Spaced Repetition Mode (> 7 days left)
    else {
      // Day pattern logic:
      // Spaced repetition intervals:
      // Weak topics -> every 1-2 days
      // Developing topics -> every 3-4 days
      // Strong topics -> every 7 days

      // Pick topic for today
      let targetTopic = null;
      let taskType = 'Practice Quiz';

      if (weakTopics.length > 0 && dayOffset % 2 === 0) {
        targetTopic = weakTopics[dayOffset % weakTopics.length];
        taskType = 'Practice Quiz';
      } else if (unattemptedTopics.length > 0) {
        targetTopic = unattemptedTopics[dayOffset % unattemptedTopics.length];
        taskType = 'Revise Notes';
      } else if (developingTopics.length > 0) {
        targetTopic = developingTopics[dayOffset % developingTopics.length];
        taskType = 'Flashcards';
      } else if (strongTopics.length > 0) {
        targetTopic = strongTopics[dayOffset % strongTopics.length];
        taskType = 'Practice Quiz';
      } else {
        targetTopic = topics[dayOffset % topics.length];
      }

      if (targetTopic) {
        tasks.push({
          id: `task-${dateStr}-main-quiz`,
          type: taskType,
          title: taskType === 'Practice Quiz' 
            ? `Targeted Practice: ${targetTopic.name}`
            : (taskType === 'Revise Notes' ? `Concept Notes: ${targetTopic.name}` : `Flashcard Review: ${targetTopic.name}`),
          topicId: targetTopic.id,
          topicName: targetTopic.name,
          durationMins: 35,
          completed: false,
          priority: (masteryMap[targetTopic.id]?.masteryScore || 0) < 50 ? 'High' : 'Normal'
        });
        allocatedMins += 35;
      }

      // Add a 2nd task for flashcards or secondary weak topic
      if (allocatedMins < dailyMins && topics.length > 1) {
        const secTopic = weakTopics.length > 0 
          ? weakTopics[(dayOffset + 1) % weakTopics.length]
          : topics[(dayOffset + 1) % topics.length];

        tasks.push({
          id: `task-${dateStr}-sec-fc`,
          type: 'Flashcards',
          title: `Smart Spaced Flashcards: ${secTopic.name}`,
          topicId: secTopic.id,
          topicName: secTopic.name,
          durationMins: 20,
          completed: false,
          priority: 'Normal'
        });
        allocatedMins += 20;
      }
    }

    planDays.push({
      date: dateStr,
      dayLabel,
      dayOffset,
      isToday: dayOffset === 0,
      isFinalWeek: daysUntilExam <= 7,
      daysUntilExam,
      totalDurationMins: allocatedMins,
      tasks
    });
  }

  return planDays;
}

/**
 * Automatically reschedules past uncompleted tasks to Today's schedule
 */
export function syncAndReschedulePlan(existingPlan, topics, masteryMap, examDateStr, dailyHours) {
  if (!existingPlan || existingPlan.length === 0) {
    return generateRevisionPlan(examDateStr, dailyHours, topics, masteryMap);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Check if today exists in existingPlan
  const todayIdx = existingPlan.findIndex(d => d.date === todayStr);

  if (todayIdx < 0) {
    // Generate fresh plan starting from today
    return generateRevisionPlan(examDateStr, dailyHours, topics, masteryMap);
  }

  // Gather past uncompleted tasks before today
  const pastUncompleted = [];
  for (let i = 0; i < todayIdx; i++) {
    const day = existingPlan[i];
    day.tasks.forEach(t => {
      if (!t.completed) {
        pastUncompleted.push({
          ...t,
          id: `rescheduled-${t.id}`,
          title: `[Rescheduled] ${t.title}`,
          rescheduled: true
        });
      }
    });
  }

  // Prepend past uncompleted to today's task list (without duplicating)
  const updatedPlan = [...existingPlan];
  const todayPlan = { ...updatedPlan[todayIdx] };

  const existingTodayTaskTitles = new Set(todayPlan.tasks.map(t => t.title));
  const newTasksToInject = pastUncompleted.filter(t => !existingTodayTaskTitles.has(t.title));

  todayPlan.tasks = [...newTasksToInject, ...todayPlan.tasks];
  updatedPlan[todayIdx] = todayPlan;

  return updatedPlan.filter(d => d.date >= todayStr);
}
