type DateValue = Date | string | null | undefined;

function timestamp(value: DateValue) {
  if (!value) return null;

  const milliseconds = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

export function durationSeconds(start: DateValue, end: DateValue) {
  const startMs = timestamp(start);
  const endMs = timestamp(end);
  if (startMs === null || endMs === null || endMs < startMs) return null;

  return Math.round((endMs - startMs) / 1000);
}

export function projectGenerationTiming(project: {
  generationQueuedAt?: DateValue;
  generationStartedAt?: DateValue;
  generationFinishedAt?: DateValue;
}) {
  return {
    totalSeconds: durationSeconds(project.generationQueuedAt, project.generationFinishedAt),
    queueSeconds: durationSeconds(project.generationQueuedAt, project.generationStartedAt),
    processingSeconds: durationSeconds(project.generationStartedAt, project.generationFinishedAt),
  };
}
