---
title: Remove default agent speech input UI
changeKey: remove-agent-speech-input
introducedOn: 2026-05-06
changeType: cleanup
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/agent/agent-panel.tsx
  - apps/template/components/ai-elements/prompt-input.tsx
  - apps/template/components/ai-elements/speech-input.tsx
  - apps/template/components/ai-elements/speech-recognition.d.ts
  - apps/docs/content/docs/anatomy/agent.mdx
relatedSkills: []
---

## Summary

The template no longer renders the agent microphone control and removes the unused speech input component, browser speech-recognition typings, and prompt-input speech button export.

## Why it matters

The default agent did not include a server-side audio transcription path, so the microphone UI suggested a capability that was not reliably supported across browsers.

## Apply when

- The storefront has not implemented an end-to-end voice or transcription flow for the agent.
- The storefront wants the default agent UI to expose only working capabilities.

## Safe to skip when

- The storefront already wired `SpeechInput` or `PromptInputSpeechButton` to a working transcription flow.
- The storefront intentionally depends on the browser Web Speech API for agent input.

## Validation

1. `pnpm --filter template lint` should pass without new errors.
2. Confirm no `SpeechInput`, `PromptInputSpeechButton`, or `SpeechRecognition` references remain in `apps/template`.
3. Confirm the agent panel still submits text and file attachments.
