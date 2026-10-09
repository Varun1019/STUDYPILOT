// Initial seed data for StudyPilot (Engineering Edition)

export const DEFAULT_SUBJECTS = [
  "Data Structures & Algorithms",
  "Operating Systems",
  "Database Management Systems",
  "Computer Networks"
];

export const DEMO_PROFILE = {
  id: "demo-profile-1",
  name: "Alex Rivera",
  subject: "Data Structures & Algorithms",
  examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  dailyHours: 3,
  level: "Intermediate",
  createdAt: new Date().toISOString()
};

export const INITIAL_TOPICS = [
  { id: "top-1", name: "Arrays, Two Pointers & Sliding Window", subject: "Data Structures & Algorithms", category: "Linear Data Structures" },
  { id: "top-2", name: "Linked Lists & Pointer Reversal", subject: "Data Structures & Algorithms", category: "Linear Data Structures" },
  { id: "top-3", name: "Stacks, Queues & Monotonic Deques", subject: "Data Structures & Algorithms", category: "Linear Data Structures" },
  { id: "top-4", name: "Binary Trees & BST Traversals", subject: "Data Structures & Algorithms", category: "Non-Linear Data Structures" },
  { id: "top-5", name: "Graph Algorithms (BFS, DFS, Dijkstra)", subject: "Data Structures & Algorithms", category: "Graphs & Networks" },
  { id: "top-6", name: "Dynamic Programming & Memoization", subject: "Data Structures & Algorithms", category: "Optimization Algorithms" },
  { id: "top-7", name: "Recursion, Backtracking & Permutations", subject: "Data Structures & Algorithms", category: "Algorithmic Techniques" },
  { id: "top-8", name: "Hash Tables & Collision Strategies", subject: "Data Structures & Algorithms", category: "Hashing & Indexing" }
];

export function getDefaultTopicsForSubject(subjectName) {
  if (subjectName === 'Operating Systems') {
    return [
      { id: "os-1", name: "Process Scheduling & IPC", subject: "Operating Systems", category: "Processes" },
      { id: "os-2", name: "Threads & Concurrency", subject: "Operating Systems", category: "Concurrency" },
      { id: "os-3", name: "Deadlocks & Banker's Algorithm", subject: "Operating Systems", category: "Deadlocks" },
      { id: "os-4", name: "Virtual Memory & Paging", subject: "Operating Systems", category: "Memory" },
      { id: "os-5", name: "Page Replacement (LRU, Optimal)", subject: "Operating Systems", category: "Memory" },
      { id: "os-6", name: "File Systems & Disk Scheduling", subject: "Operating Systems", category: "Storage" }
    ];
  }
  return INITIAL_TOPICS;
}

// Seed Quiz History for Demo Profile
export const DEMO_ATTEMPTS = [
  { id: "att-1", questionId: "q-101", topicId: "top-1", selected: 1, correct: true, timeTaken: 18, difficulty: "Medium", timestamp: Date.now() - 1 * 86400000 },
  { id: "att-2", questionId: "q-102", topicId: "top-1", selected: 0, correct: false, timeTaken: 55, difficulty: "Hard", timestamp: Date.now() - 1 * 86400000 },
  { id: "att-3", questionId: "q-201", topicId: "top-2", selected: 2, correct: false, timeTaken: 52, difficulty: "Medium", timestamp: Date.now() - 3 * 86400000 },
  { id: "att-4", questionId: "q-301", topicId: "top-3", selected: 0, correct: true, timeTaken: 20, difficulty: "Medium", timestamp: Date.now() - 2 * 86400000 },
  { id: "att-5", questionId: "q-401", topicId: "top-4", selected: 0, correct: true, timeTaken: 15, difficulty: "Easy", timestamp: Date.now() - 5 * 86400000 },
  { id: "att-6", questionId: "q-501", topicId: "top-5", selected: 0, correct: true, timeTaken: 26, difficulty: "Medium", timestamp: Date.now() - 2 * 86400000 },
  { id: "att-7", questionId: "q-601", topicId: "top-6", selected: 0, correct: true, timeTaken: 24, difficulty: "Hard", timestamp: Date.now() - 4 * 86400000 }
];

export const DEMO_FLASHCARDS = [
  {
    id: "fc-1",
    topicId: "top-2",
    topicName: "Linked Lists & Pointer Reversal",
    front: "HOW DO YOU DETECT THE START OF A CYCLE IN A LINKED LIST?",
    back: "1. Advance slow by 1 and fast by 2 until they collide.\n2. Reset slow to head while keeping fast at the collision point.\n3. Advance both 1 step at a time; their new meeting node is the cycle start.",
    mastered: false,
    lastReviewed: Date.now() - 2 * 86400000
  }
];

export const DEMO_NOTES = [];

export const BADGES_LIST = [
  { id: "b-1", title: "Diagnostic Completed", description: "Took the initial diagnostic test to map knowledge gaps.", icon: "Target", unlocked: true },
  { id: "b-2", title: "3-Day Streak", description: "Studied 3 days in a row.", icon: "Flame", unlocked: true },
  { id: "b-3", title: "Gap Crusher", description: "Turned a Weak topic into a Developing or Strong topic.", icon: "ShieldCheck", unlocked: true },
  { id: "b-4", title: "Speed Demon", description: "Answered 5 questions correctly under 15 seconds each.", icon: "Zap", unlocked: false },
  { id: "b-5", title: "Mastermind", description: "Achieved >80% accuracy on a Hard difficulty quiz.", icon: "Award", unlocked: false },
  { id: "b-6", title: "Consistency Master", description: "Completed all tasks on your revision plan for 5 consecutive days.", icon: "CheckCircle2", unlocked: false }
];
