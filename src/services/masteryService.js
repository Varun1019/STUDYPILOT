// Mastery Computation & Knowledge Gap Analysis Engine

export const TOPIC_STATUS = {
  WEAK: 'Weak',
  DEVELOPING: 'Developing',
  STRONG: 'Strong',
  NOT_ATTEMPTED: 'Not Attempted'
};

/**
 * Compute mastery score (0-100) for a specific topic based on attempts
 */
export function computeTopicMastery(topicId, attemptsForTopic) {
  if (!attemptsForTopic || attemptsForTopic.length === 0) {
    return {
      topicId,
      masteryScore: 0,
      status: TOPIC_STATUS.NOT_ATTEMPTED,
      totalAttempts: 0,
      correctCount: 0,
      accuracyPct: 0,
      avgTimeSec: 0,
      recentAttempts: 0
    };
  }

  const now = Date.now();
  let totalWeightedScore = 0;
  let totalWeight = 0;
  let totalTime = 0;
  let correctCount = 0;

  // Process attempts sorted chronologically
  const sorted = [...attemptsForTopic].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  sorted.forEach(attempt => {
    const isCorrect = attempt.correct === true;
    if (isCorrect) correctCount++;

    const timeSec = attempt.timeTaken || 25;
    totalTime += timeSec;

    // 1. Recency Decay Weighting: Exponential decay based on days ago
    // Days ago = (now - timestamp) in days
    const daysAgo = Math.max(0, (now - (attempt.timestamp || now)) / (1000 * 60 * 60 * 24));
    // Recent attempts weigh significantly more (halflife ~ 14 days)
    const recencyWeight = Math.exp(-0.04 * daysAgo);

    // 2. Difficulty Weighting
    let diffWeight = 1.0;
    if (attempt.difficulty === 'Hard') diffWeight = 1.35;
    else if (attempt.difficulty === 'Easy') diffWeight = 0.75;
    else diffWeight = 1.0; // Medium

    // 3. Time Performance Modifier
    let timeModifier = 1.0;
    if (isCorrect) {
      if (timeSec < 20) timeModifier = 1.15; // Fast correct = high confidence
      else if (timeSec > 60) timeModifier = 0.90; // Slow correct = hesitant
    } else {
      if (timeSec < 15) timeModifier = 1.25; // Fast wrong = Careless penalty (weighs more as failure)
      else if (timeSec > 45) timeModifier = 1.10; // Slow wrong = Concept gap
    }

    const itemWeight = recencyWeight * diffWeight * timeModifier;
    const baseValue = isCorrect ? 100 : 0;

    totalWeightedScore += baseValue * itemWeight;
    totalWeight += itemWeight;
  });

  const rawMastery = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
  
  // Cap between 0 and 100
  const masteryScore = Math.min(100, Math.max(0, Math.round(rawMastery)));

  // Classify Status
  let status = TOPIC_STATUS.DEVELOPING;
  if (masteryScore < 50) status = TOPIC_STATUS.WEAK;
  else if (masteryScore >= 75) status = TOPIC_STATUS.STRONG;

  const totalAttempts = attemptsForTopic.length;
  const accuracyPct = Math.round((correctCount / totalAttempts) * 100);
  const avgTimeSec = Math.round(totalTime / totalAttempts);

  return {
    topicId,
    masteryScore,
    status,
    totalAttempts,
    correctCount,
    accuracyPct,
    avgTimeSec,
    recentAttempts: attemptsForTopic.filter(a => (now - a.timestamp) < 7 * 86400000).length
  };
}

/**
 * Computes mastery map for all topics
 */
export function computeAllTopicsMastery(topics, attempts) {
  const result = {};
  
  // Group attempts by topicId
  const attemptsByTopic = {};
  attempts.forEach(a => {
    if (!attemptsByTopic[a.topicId]) attemptsByTopic[a.topicId] = [];
    attemptsByTopic[a.topicId].push(a);
  });

  topics.forEach(topic => {
    const topicAttempts = attemptsByTopic[topic.id] || [];
    result[topic.id] = {
      ...computeTopicMastery(topic.id, topicAttempts),
      topicName: topic.name,
      category: topic.category || 'General'
    };
  });

  return result;
}

/**
 * Detect Error Patterns (Careless mistakes, Concept gaps, Guessing)
 */
export function detectErrorPatterns(attempts, topicsMap = {}) {
  if (!attempts || attempts.length === 0) return [];

  const totalAttempts = attempts.length;
  const wrongAttempts = attempts.filter(a => !a.correct);
  if (wrongAttempts.length === 0) {
    return [{
      id: 'pattern-flawless',
      type: 'PERFECT',
      title: 'Flawless Accuracy',
      severity: 'LOW',
      percentage: 100,
      description: 'You have answered all attempted questions correctly!',
      recommendation: 'Challenge yourself with Harder difficulty questions to push your boundaries.'
    }];
  }

  const patterns = [];

  // Pattern 1: Careless Mistakes (Fast wrong answers < 15 seconds)
  const carelessWrongs = wrongAttempts.filter(a => (a.timeTaken || 0) > 0 && (a.timeTaken || 0) < 15);
  const carelessPct = Math.round((carelessWrongs.length / wrongAttempts.length) * 100);
  if (carelessWrongs.length > 0) {
    patterns.push({
      id: 'pattern-careless',
      type: 'CARELESS',
      title: 'Careless Speed Errors',
      severity: carelessPct > 35 ? 'HIGH' : 'MEDIUM',
      percentage: carelessPct,
      count: carelessWrongs.length,
      description: `${carelessPct}% of your wrong answers were submitted in under 15 seconds.`,
      recommendation: 'Pause and re-read the options carefully before submitting. Write out quick scratch work even for easy questions.'
    });
  }

  // Pattern 2: Concept Gaps (Slow wrong answers > 45 seconds)
  const conceptWrongs = wrongAttempts.filter(a => (a.timeTaken || 0) >= 45);
  const conceptPct = Math.round((conceptWrongs.length / wrongAttempts.length) * 100);
  if (conceptWrongs.length > 0) {
    patterns.push({
      id: 'pattern-concept',
      type: 'CONCEPT_GAP',
      title: 'Deep Concept Gaps',
      severity: conceptPct > 40 ? 'HIGH' : 'MEDIUM',
      percentage: conceptPct,
      count: conceptWrongs.length,
      description: `${conceptPct}% of your wrong answers involved high time investment (>45s) without reaching the correct solution.`,
      recommendation: 'Target these specific concepts with synthesized Flashcards and Step-by-Step AI Explanations before re-testing.'
    });
  }

  // Pattern 3: Easy Question Drops (Wrong on Easy difficulty)
  const easyWrongs = wrongAttempts.filter(a => a.difficulty === 'Easy');
  if (easyWrongs.length > 0) {
    const easyPct = Math.round((easyWrongs.length / wrongAttempts.length) * 100);
    patterns.push({
      id: 'pattern-easy-drop',
      type: 'FOUNDATION_SLIP',
      title: 'Foundation Slippage',
      severity: easyPct > 30 ? 'HIGH' : 'LOW',
      percentage: easyPct,
      count: easyWrongs.length,
      description: `You missed ${easyWrongs.length} Easy difficulty questions. Fundamental formulas or definitions need quick revision.`,
      recommendation: 'Review Short Notes summaries to reinforce foundational definitions.'
    });
  }

  return patterns;
}

/**
 * Calculate overall readiness score (0-100%)
 */
export function calculateReadinessScore(topics, attempts) {
  if (!topics || topics.length === 0) return 0;
  
  const masteryMap = computeAllTopicsMastery(topics, attempts);
  const topicList = Object.values(masteryMap);

  // 1. Average Mastery Component (50%)
  const attemptedTopics = topicList.filter(t => t.status !== TOPIC_STATUS.NOT_ATTEMPTED);
  const avgMastery = attemptedTopics.length > 0
    ? attemptedTopics.reduce((acc, curr) => acc + curr.masteryScore, 0) / attemptedTopics.length
    : 0;

  // 2. Syllabus Coverage Component (30%)
  const coverageRatio = attemptedTopics.length / topics.length;

  // 3. Quiz Volume / Recency Component (20%)
  const quizBonus = Math.min(1.0, attempts.length / 30); // 30+ attempts gives full 20% bonus

  const readinessScore = (avgMastery * 0.50) + (coverageRatio * 100 * 0.30) + (quizBonus * 100 * 0.20);
  
  return Math.min(100, Math.max(0, Math.round(readinessScore)));
}
