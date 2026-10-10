import { readFile, writeFile } from 'node:fs/promises';
const source = JSON.parse(
  await readFile(new URL('../server/curriculum-content.json', import.meta.url)),
);
const data = {
  ...source,
  exercises: source.exercises.map(
    ({ id, chapterId, lessonId, skillId, skills, level, objective, problem, source, chart }) => ({
      id,
      chapterId,
      lessonId,
      skillId,
      skills,
      level,
      objective,
      problem,
      source,
      ...(chart ? { chart } : {}),
    }),
  ),
};
await writeFile(
  new URL('../lib/curriculum.json', import.meta.url),
  JSON.stringify(data, null, 2) + '\n',
);
console.log(
  `Curriculum: ${data.chapters.length} chapters, ${data.lessons.length} units, ${data.exercises.length} exercises; answer keys remain server-side.`,
);
