export type ExerciseChoice = { number: number; problem: string };

/** Reads the numbered, unsolved set returned by the server, not tutor proof steps. */
export function exerciseChoices(text: string): ExerciseChoice[] {
  const body = text.replace(/\[SO_DO\][\s\S]*?\[\/SO_DO\]/g, '');
  const starts = [...body.matchAll(/^Câu (\d{1,2}):\s*/gm)];
  if (starts.length < 5 || starts.length > 10 || starts.some((m, i) => Number(m[1]) !== i + 1))
    return [];
  const choices = starts.map((m, i) => ({
    number: i + 1,
    problem: body
      .slice(m.index! + m[0].length, starts[i + 1]?.index ?? body.length)
      .replace(/\n\s*Gợi mở:[\s\S]*$/u, '')
      .trim(),
  }));
  return choices.every((c) => c.problem.length >= 12) ? choices : [];
}

export function selectedExercise(
  text: string,
  messages: { role: string; content: string }[],
): ExerciseChoice | undefined {
  const number = text
    .trim()
    .match(
      /^(?:(?:em\s+)?(?:chọn|làm|bắt đầu(?: với)?)\s+)?(?:(?:câu|bài)\s+)?(10|[1-9])\s*[.!]?$/iu,
    )?.[1];
  if (!number) return undefined;
  // Only the most recent set is selectable; do not reopen a stale set after tutoring starts.
  const latest = messages.filter((m) => m.role === 'assistant').at(-1)?.content || '';
  return exerciseChoices(latest).find((c) => c.number === Number(number));
}
