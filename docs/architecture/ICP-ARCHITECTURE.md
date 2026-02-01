# ICP Architecture — JLPT Pass Pods

This document defines the **Information-Container-Presentation (ICP)** architecture pattern used throughout the JLPT Pass Pods application.

---

## Overview

ICP separates UI concerns into three distinct layers:

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION                         │
│         (Visual components, layouts, styling)           │
├─────────────────────────────────────────────────────────┤
│                     CONTAINER                           │
│      (State management, business logic, handlers)       │
├─────────────────────────────────────────────────────────┤
│                    INFORMATION                          │
│        (Data models, API contracts, data flow)          │
└─────────────────────────────────────────────────────────┘
```

---

## Layer Definitions

### 1. Information Layer (I)

The **data foundation** of the application. Defines what data exists and how it flows.

**Responsibilities:**
- Data models and types
- API contracts and endpoints
- Data validation schemas
- State shape definitions
- Data transformation utilities

**Examples in JLPT Pass Pods:**
```
Information/
├── models/
│   ├── User.ts
│   ├── Pod.ts
│   ├── StudyLog.ts
│   ├── CheckIn.ts
│   └── WeeklyReview.ts
├── api/
│   ├── pods.api.ts
│   ├── checkins.api.ts
│   └── users.api.ts
└── schemas/
    ├── checkin.schema.ts
    └── pod.schema.ts
```

### 2. Container Layer (C)

The **logic layer** that orchestrates data and user interactions.

**Responsibilities:**
- State management (local and global)
- Business logic and rules
- Event handlers and side effects
- Data fetching and caching
- Feature flags and permissions

**Examples in JLPT Pass Pods:**
```
Container/
├── hooks/
│   ├── usePod.ts
│   ├── useCheckIn.ts
│   ├── useStreak.ts
│   └── useWeeklyReview.ts
├── stores/
│   ├── userStore.ts
│   ├── podStore.ts
│   └── uiStore.ts
└── logic/
    ├── streakCalculator.ts
    ├── podMatcher.ts
    └── aiCoachingEngine.ts
```

### 3. Presentation Layer (P)

The **visual layer** that users see and interact with.

**Responsibilities:**
- UI components (stateless where possible)
- Layouts and page structures
- Styling and theming
- Animations and transitions
- Accessibility implementations

**Examples in JLPT Pass Pods:**
```
Presentation/
├── components/
│   ├── CheckInCard/
│   ├── StreakBadge/
│   ├── PodMemberList/
│   └── ProgressRing/
├── layouts/
│   ├── DashboardLayout/
│   └── OnboardingLayout/
└── pages/
    ├── Dashboard/
    ├── PodDetail/
    └── CheckIn/
```

---

## Data Flow

```
User Action
    │
    ▼
┌─────────────┐
│ Presentation │ ──► Captures user intent (click, input, gesture)
└─────────────┘
    │
    ▼
┌─────────────┐
│  Container  │ ──► Processes action, applies business logic
└─────────────┘
    │
    ▼
┌─────────────┐
│ Information │ ──► Fetches/mutates data via API
└─────────────┘
    │
    ▼
┌─────────────┐
│  Container  │ ──► Updates state with new data
└─────────────┘
    │
    ▼
┌─────────────┐
│ Presentation │ ──► Re-renders with updated state
└─────────────┘
```

---

## Key Principles

### Separation of Concerns
- Presentation components should NOT contain business logic
- Containers should NOT contain styling or markup
- Information layer should be framework-agnostic

### Testability
- Information: Unit test data transformations and validations
- Container: Test business logic and state transitions
- Presentation: Visual regression and interaction tests

### Reusability
- Information models shared across features
- Container hooks composed for complex features
- Presentation components in a shared design system

---

## Applying ICP to JLPT Pass Pods Features

### Example: Daily Check-In Feature

**Information:**
```typescript
// models/CheckIn.ts
interface CheckIn {
  id: string;
  podId: string;
  userId: string;
  date: Date;
  studyMinutes: number;
  proofType: 'screenshot' | 'note' | 'link';
  proofContent: string;
  mood: 'struggling' | 'okay' | 'great';
  createdAt: Date;
}
```

**Container:**
```typescript
// hooks/useCheckIn.ts
function useCheckIn(podId: string) {
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCheckIn = async (data: CheckInInput) => {
    // Business logic: validate, submit, update streak
  };

  const canCheckIn = useMemo(() => {
    // Logic: only once per day, must be pod member
  }, [todayCheckIn]);

  return { todayCheckIn, submitCheckIn, canCheckIn, isSubmitting };
}
```

**Presentation:**
```tsx
// components/CheckInCard.tsx
function CheckInCard({
  onSubmit,
  isSubmitting,
  canCheckIn
}: CheckInCardProps) {
  return (
    <Card>
      <StudyTimeInput />
      <ProofUploader />
      <MoodSelector />
      <SubmitButton disabled={!canCheckIn} loading={isSubmitting} />
    </Card>
  );
}
```

---

## Directory Structure (Monorepo)

```
jlpt-pass-pods/
├── apps/
│   ├── web/                    # Main web application
│   │   ├── src/
│   │   │   ├── information/    # I layer
│   │   │   ├── container/      # C layer
│   │   │   └── presentation/   # P layer
│   │   └── ...
│   └── mobile/                 # Future mobile app
├── packages/
│   ├── shared-types/           # Shared Information layer
│   ├── ui-components/          # Shared Presentation layer
│   └── business-logic/         # Shared Container utilities
└── docs/
    └── ui-design/              # Design documentation
```

---

## Benefits for JLPT Pass Pods

1. **Team Scalability**: Designers focus on Presentation, backend devs on Information, frontend devs bridge all layers
2. **Feature Isolation**: Each pod feature (check-in, reviews, coaching) is self-contained
3. **Testing Confidence**: Business logic tested independently from UI
4. **Design System Ready**: Presentation layer naturally becomes component library
5. **AI Integration Ready**: Container layer cleanly integrates AI coaching services
