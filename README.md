# StudyPilot 🚀
> **Generative AI Learning Agent for Personalized Exam Preparation**

StudyPilot is an autonomous, personalized exam preparation web application built with React, Vite, and Tailwind CSS. It analyzes a student's quiz performance, identifies topic-by-topic knowledge gaps using an algorithmic mastery scoring formula, generates adaptive question variants, writes personalized short notes and flashcards, and builds automated revision schedules using spaced repetition.

---

## 🌟 Key Features

1. **Onboarding & Profile Switcher**:
   - 3-step setup wizard for student profile (subject, target exam date, daily study hours, level).
   - "Auto-generate syllabus" via AI to propose 8-15 core topics per subject.
   - Multi-subject switcher with instant profile switching.

2. **Diagnostic & Adaptive Practice Quizzes**:
   - MCQ quiz player with optional timer, question navigator grid, mark for review, and live adaptive difficulty (2 correct streak -> Harder; 2 wrong streak -> Easier).
   - Manual past test score upload (form entry or CSV paste import).
   - Instant quiz results with detailed explanations and interactive **"Explain Differently"** (Simple ELI5, Step-by-Step, Analogy/Example) & **"Ask a Doubt"** AI chat panel.

3. **Knowledge-Gap Analysis (Mastery Engine)**:
   - Mastery Score (0-100) incorporating accuracy, difficulty weighting, exponential recency decay, and response speed modifiers.
   - Visual dashboard: Radar chart of topic mastery, bar chart of accuracy, topics x difficulty heatmap matrix, and "Top 3 Gaps" card.
   - Behavioral error pattern detection: Careless speed errors, Deep concept gaps, and Foundation slippage with plain-language recommendations.

4. **Short Notes & Flashcards**:
   - 1-click personalized revision notes generator (formulas, common mistakes, memory mnemonics).
   - Interactive 3D flip flashcards ("Know it" / "Don't know it") auto-generated from missed quiz questions.
   - Export notes as Markdown (`.md`) or print to PDF.

5. **Automated Revision Planner**:
   - Smart day-by-day study schedule using spaced repetition (intervals compressed for upcoming exams).
   - Automatic rescheduling: missed tasks from past days automatically push to today's focus checklist!
   - "Final Week Mode" (auto-triggers within 7 days of exam date for high-yield weak topics & full mock tests).

6. **Progress Analytics & AI Feedback**:
   - Line chart tracking topic mastery and overall exam readiness score over time.
   - Weekly AI-written performance summary ("What Improved", "What Needs Attention", "3 Specific Next Actions").
   - Motivational milestone badges.

7. **Single AI Layer (`aiService`) & Offline Mode**:
   - Supports OpenAI, Anthropic (Claude), or Google Gemini API keys stored locally in browser `localStorage`.
   - If no key is set, seamlessly falls back to a rich built-in offline question bank (40+ seed questions) and offline template engines.

---

## 🛠️ How Mastery Scoring Works

StudyPilot uses an algorithmic scoring formula:

$$\text{Mastery Score} = \frac{\sum (\text{BaseValue} \times \text{RecencyWeight} \times \text{DifficultyWeight} \times \text{SpeedModifier})}{\sum \text{Weights}}$$

- **Difficulty Weighting**: Hard questions = 1.35x, Medium = 1.0x, Easy = 0.75x.
- **Recency Decay**: $e^{-0.04 \times \text{daysAgo}}$ (recent attempts weigh up to 3x higher than attempts from 2+ weeks ago).
- **Speed Modifier**: Fast wrong answers (<15s) penalize mastery score as careless errors; Fast correct answers (<20s) boost mastery score.
- **Classification**:
  - **Weak**: Score < 50%
  - **Developing**: 50% ≤ Score < 75%
  - **Strong**: Score ≥ 75%
  - **Not Attempted**: No quiz attempts yet

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation Steps

1. Clone or navigate to the directory:
   ```bash
   cd /home/varun/.gemini/antigravity/scratch/studypilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000`.

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🔑 How to Add an API Key

1. Click on **Settings & Data** in the left sidebar menu.
2. Under **AI Layer & LLM Credentials**, select your AI Provider (**OpenAI**, **Anthropic**, or **Google Gemini**).
3. Enter your API Key into the **API Key** input field.
4. Click **Save Settings**.
5. Look at the top right of the header: the badge will switch from **"Offline Mode"** to **"AI Mode"**.

> 🔒 **Privacy Note**: Your API key is stored strictly in your browser's `localStorage` (`studypilot_settings`) and is never sent to any server other than direct API calls to your chosen AI provider.
