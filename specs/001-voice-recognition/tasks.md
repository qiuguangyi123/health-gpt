# Implementation Tasks: Voice Recognition with Speech-to-Text

**Feature**: 001-voice-recognition | **Branch**: `001-voice-recognition` | **Date**: 2025-11-10
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)

## Overview

This document breaks down the voice recognition feature implementation into executable tasks organized by user story. Each phase is independently testable and delivers incremental value.

**Total Estimated Tasks**: 43
**MVP Scope**: Phase 3 (User Story 1 - 17 tasks)
**Implementation Strategy**: Test-first development with progressive feature delivery (P1 → P2 → P3)

---

## Phase 1: Setup & Dependencies

**Goal**: Install dependencies and configure project for voice recording functionality

**Duration**: ~15 minutes

### Tasks

- [X] T001 Install expo-audio package via `npx expo install expo-audio`
- [X] T002 Install expo-file-system package via `npx expo install expo-file-system`
- [X] T003 [P] Install @react-native-community/netinfo via `npm install @react-native-community/netinfo`
- [X] T004 [P] Configure microphone permissions in app.json plugins section
- [X] T005 [P] Create project structure directories: constants/, types/, services/, hooks/, utils/
- [X] T006 Verify all dependencies installed correctly via `npm list`

**Completion Criteria**:
- ✅ All packages installed without errors
- ✅ app.json includes microphone permission configuration
- ✅ Directory structure matches plan.md

---

## Phase 2: Foundational Tasks

**Goal**: Implement shared infrastructure required by all user stories

**Duration**: ~45 minutes

**Note**: These tasks must complete before any user story implementation begins as they provide core functionality used across all features.

### Tasks

- [X] T007 [P] Create voice configuration constants in constants/voice.ts
- [X] T008 [P] Create TypeScript type definitions in types/voice.ts (包含从 index.tsx 抽离的类型)
- [X] T009 [P] Create ASR error types in types/asr.ts
- [X] T010 [P] Implement ASR error class with retry logic in services/alibabaASR.ts
- [X] T011 Implement token retrieval placeholder function in services/alibabaASR.ts
- [X] T012 Implement audio storage service in services/audioStorage.ts
- [X] T013 [P] Create useNetworkStatus hook in hooks/useNetworkStatus.ts
- [ ] T014 [P] Create error message constants in constants/voice.ts
- [ ] T015 [P] Implement permissions utility in utils/permissions.ts

**Completion Criteria**:
- ✅ All constant values defined (MAX_DURATION=60, MIN_DURATION=0.5, etc.)
- ✅ TypeScript types compile without errors
- ✅ ASR error class handles all 27 error codes from contracts/alibaba-asr-api.md
- ✅ Network status hook returns boolean online/offline state
- ✅ All files follow Chinese comment guidelines from constitution.md

---

## Phase 3: User Story 1 - Record and Transcribe Voice Input (P1)

**Goal**: Users can press and hold a button to record their voice, speak naturally, and receive an accurate text transcription.

**Priority**: P1 - MVP Core Functionality

**Why this priority**: This is the core functionality - without voice recording and transcription, the feature has no value.

**Duration**: ~3-4 hours

### Independent Test Criteria

Can be fully tested by:
1. Opening the app and navigating to the chat screen
2. Pressing and holding the microphone button
3. Speaking a simple Chinese phrase (e.g., "今天天气很好")
4. Releasing the button after 2-3 seconds
5. Verifying the transcribed text appears correctly in the conversation

**Delivers immediate value**: Converts voice to text, enabling users to send voice messages without typing.

### Tasks

#### Core Recording Infrastructure

- [ ] T016 [US1] Create ASR_RECORDING_PRESET constant in constants/voice.ts
- [ ] T017 [US1] Implement transcribeAudio function in services/alibabaASR.ts
- [ ] T018 [P] [US1] Implement useVoiceRecording hook in hooks/useVoiceRecording.ts
- [ ] T019 [P] [US1] Implement useAlibabaASR hook in hooks/useAlibabaASR.ts

#### UI Components

- [ ] T020 [P] [US1] Create RecordButton component in components/RecordButton.tsx
- [ ] T021 [US1] Implement press animation for RecordButton using react-native-reanimated
- [ ] T022 [US1] Create VoiceMessage component in components/VoiceMessage.tsx
- [ ] T023 [US1] Add fade-in animation to VoiceMessage (200ms FadeInDown)

#### Integration

- [ ] T024 [US1] Integrate RecordButton into chat screen at app/(tabs)/index.tsx
- [ ] T025 [US1] Implement recording state management in chat screen
- [ ] T026 [US1] Connect useVoiceRecording hook to RecordButton
- [ ] T027 [US1] Implement transcription workflow (recording → transcribe → display)
- [ ] T028 [US1] Add VoiceMessage to chat history on successful transcription
- [ ] T029 [US1] Implement audio file cleanup after successful transcription
- [ ] T030 [US1] Add haptic feedback on recording start in useVoiceRecording hook
- [ ] T031 [US1] Add haptic feedback on recording stop in useVoiceRecording hook
- [ ] T032 [US1] Implement waveform animation during recording (reuse existing WaveformBar component)

**Phase 3 Completion Criteria**:
- ✅ User can press and hold button to start recording
- ✅ Waveform animation appears during recording at 60fps
- ✅ Recording stops when button is released
- ✅ Transcription request sent to Alibaba Cloud ASR
- ✅ Transcribed text appears in conversation within 5 seconds
- ✅ Audio file deleted after successful transcription
- ✅ Haptic feedback provided on start and stop
- ✅ Recording < 0.5s is cancelled with appropriate feedback
- ✅ All acceptance scenarios from spec.md User Story 1 pass

**Parallel Execution Opportunities**:
- T016 can run in parallel with T017-T019
- T020-T023 (UI components) can run in parallel with T018-T019 (hooks)
- T024-T032 must run sequentially as they depend on previous integration points

---

## Phase 4: User Story 2 - Handle Recording Errors Gracefully (P2)

**Goal**: Users receive clear feedback when voice recording encounters problems (microphone permissions, background noise, network issues).

**Priority**: P2 - Error Handling & Resilience

**Why this priority**: Error handling ensures users aren't confused when recording fails, improving overall user experience and reducing support requests.

**Duration**: ~2-3 hours

### Independent Test Criteria

Can be tested by simulating error conditions:
1. **Permission test**: Deny microphone permission → verify permission prompt appears
2. **Network test**: Disconnect network during transcription → verify error message with retry button
3. **Short audio test**: Release button before 0.5s → verify cancellation feedback
4. **Quality test**: Record in very noisy environment → verify quality warning (if ASR returns low confidence)

**Delivers value**: Prevents user confusion, reduces support tickets, builds trust in the feature.

### Tasks

#### Error Handling Infrastructure

- [ ] T033 [P] [US2] Implement error handler utility in utils/errorHandler.ts
- [ ] T034 [US2] Add error state management to useVoiceRecording hook
- [ ] T035 [US2] Add error state management to useAlibabaASR hook

#### Permission Handling

- [ ] T036 [US2] Implement microphone permission check in useVoiceRecording hook
- [ ] T037 [US2] Add permission denied error UI in chat screen
- [ ] T038 [US2] Implement "go to settings" action for denied permissions

#### Network Error Handling

- [ ] T039 [US2] Add network check before starting recording in useVoiceRecording hook
- [ ] T040 [US2] Display offline error message when network unavailable
- [ ] T041 [US2] Implement manual retry button for failed transcriptions
- [ ] T042 [US2] Preserve audio file on transcription failure for retry

#### Quality & Validation

- [ ] T043 [US2] Add audio duration validation (< 0.5s cancellation)
- [ ] T044 [US2] Display cancellation feedback with haptic error response

**Phase 4 Completion Criteria**:
- ✅ Permission request prompt appears when microphone not granted
- ✅ Clear error message shown when permissions denied
- ✅ "Go to Settings" button works correctly
- ✅ Network offline error displays before recording starts
- ✅ Failed transcription shows retry button
- ✅ Retry button successfully retries using preserved audio file
- ✅ Recording < 0.5s cancelled with haptic error feedback
- ✅ All acceptance scenarios from spec.md User Story 2 pass

**Parallel Execution Opportunities**:
- T033-T035 (error infrastructure) can run in parallel
- T036-T038 (permissions) can run in parallel with T039-T042 (network)
- T043-T044 (validation) depends on T034 completing

---

## Phase 5: User Story 3 - View Recording Duration and Control (P3)

**Goal**: Users can see how long they've been recording in real-time and understand the recording limits.

**Priority**: P3 - UX Enhancement

**Why this priority**: Enhances user experience by providing feedback during recording, but not critical for basic functionality.

**Duration**: ~1-2 hours

### Independent Test Criteria

Can be tested by:
1. Starting a recording and observing the duration timer updates every 0.1 seconds
2. Recording for exactly 60 seconds and verifying automatic stop
3. Recording for less than 0.5 seconds and verifying cancellation with haptic feedback

**Delivers value**: Provides transparency and control, helps users understand system limits.

### Tasks

- [ ] T045 [P] [US3] Create duration display component in components/VoiceRecorder.tsx
- [ ] T046 [US3] Implement real-time duration counter using SharedValue in useVoiceRecording hook
- [ ] T047 [US3] Add 60-second automatic stop logic in useVoiceRecording hook
- [ ] T048 [US3] Display duration counter during recording in chat screen
- [ ] T049 [US3] Add visual indicator for approaching 60-second limit
- [ ] T050 [US3] Implement haptic feedback on automatic stop at 60 seconds

**Phase 5 Completion Criteria**:
- ✅ Duration counter displays and updates every 0.1 seconds during recording
- ✅ Counter stops at 60 seconds and recording automatically ends
- ✅ Haptic feedback provided when 60-second limit reached
- ✅ Visual indicator appears when approaching time limit (e.g., at 55 seconds)
- ✅ Counter uses SharedValue to avoid re-renders (60fps performance maintained)
- ✅ All acceptance scenarios from spec.md User Story 3 pass

**Parallel Execution Opportunities**:
- T045 can run in parallel with T046-T047
- T048-T050 must run sequentially as they depend on T045-T047

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Final optimizations, cleanup, and production readiness

**Duration**: ~1-2 hours

### Tasks

#### Performance Optimization

- [ ] T051 [P] Implement app startup audio file cleanup in services/audioStorage.ts
- [ ] T052 [P] Add component unmount cleanup in useVoiceRecording hook
- [ ] T053 [P] Optimize VoiceMessage component with React.memo
- [ ] T054 [P] Verify waveform animation runs at 60fps during recording

#### Documentation & Testing

- [ ] T055 [P] Add usage examples to components/RecordButton.tsx comments
- [ ] T056 [P] Add usage examples to hooks/useVoiceRecording.ts comments
- [ ] T057 [P] Document error codes in types/asr.ts comments
- [ ] T058 Update app/(tabs)/index.tsx with integration comments

#### Final Integration

- [ ] T059 Test full workflow: record → transcribe → display → cleanup
- [ ] T060 Verify all audio files cleaned up after transcription
- [ ] T061 Test on both iOS and Android platforms
- [ ] T062 Verify performance metrics meet success criteria from spec.md
- [ ] T063 Conduct final constitution compliance check

**Phase 6 Completion Criteria**:
- ✅ Audio files cleaned up on app startup (files > 24 hours old deleted)
- ✅ No memory leaks from recording sessions
- ✅ All components use React.memo where appropriate
- ✅ Waveform animation verified at 60fps on real devices
- ✅ All code includes clear Chinese comments
- ✅ Full workflow tested end-to-end on iOS and Android
- ✅ Performance metrics meet spec.md success criteria:
  - Recording start latency < 200ms
  - Transcription complete < 5 seconds
  - Waveform at 60fps
  - Cancellation feedback < 100ms
- ✅ Constitution compliance verified (all 5 principles)

**Parallel Execution Opportunities**:
- T051-T054 (performance) can all run in parallel
- T055-T058 (documentation) can all run in parallel
- T059-T063 (testing) must run sequentially

---

## Dependencies & Execution Order

### Story-Level Dependencies

```
Setup (Phase 1)
    ↓
Foundational (Phase 2) [BLOCKING - must complete before user stories]
    ↓
    ├─→ User Story 1 (Phase 3) [P1 - MVP]
    │       ↓
    ├─→ User Story 2 (Phase 4) [P2 - Depends on US1 completing]
    │       ↓
    └─→ User Story 3 (Phase 5) [P3 - Depends on US1 completing]
            ↓
        Polish (Phase 6)
```

**Critical Path**: Phase 1 → Phase 2 → Phase 3 (MVP)

**Notes**:
- Phase 2 (Foundational) must complete entirely before starting any user story
- User Story 2 and 3 both depend on User Story 1, but are independent of each other
- User Story 2 and 3 can potentially run in parallel if two developers are working
- Phase 6 should only begin after all user stories complete

### Task-Level Dependencies (Within Phases)

**Phase 3 Critical Path**:
```
T016,T017 → T018,T019 → T020,T021 → T024 → T025 → T026 → T027 → T028 → T029
```

**Phase 4 Critical Path**:
```
T033 → T034,T035 → T036,T039 → T037,T040 → T041,T042
```

**Phase 5 Critical Path**:
```
T045,T046,T047 → T048 → T049,T050
```

---

## Parallel Execution Examples

### Maximum Parallelization Strategy

**Phase 1 (Setup)**:
- Developer A: T001, T002, T006 (package installation)
- Developer B: T003, T004, T005 (configuration and structure)

**Phase 2 (Foundational)**:
- Developer A: T007, T008, T009 (constants and types)
- Developer B: T010, T011, T012 (services)
- Developer C: T013, T014, T015 (hooks and utilities)

**Phase 3 (User Story 1) - 2 Developer Team**:
- Developer A: T016-T019 (core infrastructure) → T024-T029 (integration)
- Developer B: T020-T023 (UI components) → T030-T032 (polish)

**Phase 4 (User Story 2) - 2 Developer Team**:
- Developer A: T033-T038 (error handling + permissions)
- Developer B: T039-T044 (network errors + validation)

---

## Success Metrics

### Performance Targets (from spec.md)

- **SC-001**: Total workflow < 5 seconds (2s record + 3s process) ✅
- **SC-002**: Transcription accuracy ≥ 90% for clear Chinese speech ✅
- **SC-003**: 95% recording success rate ✅
- **SC-004**: Recording start latency < 200ms ✅
- **SC-005**: Waveform animation at 60fps ✅
- **SC-006**: Error display < 1 second ✅
- **SC-007**: Complete workflow < 10 seconds total ✅
- **SC-008**: Cancellation feedback < 100ms ✅

### Quality Gates

Each phase must pass before proceeding:
- ✅ All tasks completed
- ✅ Independent test criteria passed
- ✅ No TypeScript compilation errors
- ✅ No runtime errors on iOS and Android
- ✅ Performance metrics met
- ✅ Constitution principles followed

---

## Implementation Strategy

### MVP First Approach

**Minimum Viable Product** = Phase 1 + Phase 2 + Phase 3 (User Story 1)

This delivers core value:
- Users can record voice messages
- Voice is transcribed to text
- Text appears in conversation

**Recommended sequence**:
1. Complete MVP (Phases 1-3) and deploy to staging
2. Gather user feedback on core functionality
3. Implement error handling (Phase 4) based on real-world errors
4. Add duration control (Phase 5) if users request it
5. Polish and optimize (Phase 6)

### Test-First Development

For each task involving logic:
1. Write test case first (if applicable)
2. Implement minimum code to pass test
3. Refactor for quality and performance
4. Add Chinese comments explaining the code

### Code Review Checklist

Before marking any phase complete:
- [ ] All Chinese comments present and accurate
- [ ] TypeScript types defined for all functions
- [ ] React.memo used where appropriate
- [ ] SharedValue used for high-frequency updates
- [ ] Error handling present for all async operations
- [ ] File paths match plan.md structure exactly
- [ ] No hardcoded values (use constants/)
- [ ] Performance metrics verified on real device

---

**Document Version**: 1.0.0
**Generated**: 2025-11-10
**Status**: Ready for implementation
**Estimated Total Duration**: 8-12 hours (single developer) or 4-6 hours (2 developers with parallelization)
