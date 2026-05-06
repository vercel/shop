---
title: Remove unsupported default agent input affordances
changeKey: remove-agent-input-affordances
introducedOn: 2026-05-06
changeType: cleanup
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/agent/agent-panel.tsx
  - apps/template/components/ai-elements/message.tsx
  - apps/template/components/ai-elements/prompt-input.tsx
  - apps/template/components/ai-elements/speech-input.tsx
  - apps/template/components/ai-elements/speech-recognition.d.ts
  - apps/template/lib/i18n/messages/en.json
  - apps/docs/content/docs/anatomy/agent.mdx
relatedSkills: []
---

## Summary

The template no longer renders unsupported agent microphone or attachment controls and removes the unused speech input, browser speech-recognition typings, prompt-input attachment handling, and message attachment previews.

## Why it matters

The default agent did not include a server-side audio transcription path or attachment-aware commerce tools, so the input UI suggested capabilities that were not productized end to end.

## Apply when

- The storefront has not implemented an end-to-end voice, transcription, or attachment-aware agent flow.
- The storefront wants the default agent UI to expose only working capabilities.

## Safe to skip when

- The storefront already wired speech input to a working transcription flow.
- The storefront intentionally depends on browser Web Speech API or uploaded files for agent input.

## Validation

1. `pnpm --filter template lint` should pass without new errors.
2. Confirm no `SpeechInput`, `PromptInputSpeechButton`, `SpeechRecognition`, `PromptInputAttachment`, or `MessageAttachment` references remain in `apps/template`.
3. Confirm the agent panel still submits text messages.
