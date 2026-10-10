import { useState } from 'react';
import {
  exercisesFor,
  findExercise,
  type Chapter,
  type Unit,
  type Exercise,
} from '../lib/curriculum';
import { MathText } from './math-text';
import { StatisticsLab } from './statistics-lab';
export function CurriculumBank({
  unit,
  onChoose,
  disabled = false,
}: {
  unit: Unit;
  onChoose: (e: Exercise) => void;
  disabled?: boolean;
}) {
  return (
    <section className="curriculum-bank">
      <h2>Bài tập theo bài học</h2>
      <p className="caption">Tự biên soạn · Làm từng bước, sau đó kiểm tra cùng gia sư.</p>
      <div className="exercise-grid">
        {exercisesFor(unit).map((e, i) => (
          <button
            className="exercise-card"
            key={e.id}
            disabled={disabled}
            onClick={() => onChoose(e)}
          >
            <span className="eyebrow">
              {i + 1 < 10 ? '0' : ''}
              {i + 1} · {e.level}
            </span>
            <MathText text={e.problem} />
            <small>{e.objective}</small>
            <strong>Bắt đầu bài này →</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
export function CurriculumIntro({
  chapter,
  unit,
  onChoose,
  onStart,
  disabled = false,
}: {
  chapter: Chapter;
  unit: Unit;
  onChoose: (e: Exercise) => void;
  onStart: () => void;
  disabled?: boolean;
}) {
  return (
    <section className="curriculum-intro">
      <span className="eyebrow">
        CHƯƠNG {chapter.roman} · {chapter.title}
      </span>
      <h1>
        {unit.number ? `Bài ${unit.number}. ` : ''}
        {unit.title}
      </h1>
      <p>{unit.objectives.join(' ')}</p>
      <button className="primary" onClick={onStart}>
        Nhập đề hoặc gửi ảnh của em →
      </button>
      <details className="curriculum-theory">
        <summary>Kiến thức trọng tâm & điều kiện cần nhớ</summary>
        {unit.theory.map((t) => (
          <p key={t}>
            <MathText text={t} />
          </p>
        ))}
        <p>
          <b>Kiến thức cần có:</b> {unit.prerequisites.join(' ')}
        </p>
      </details>
      <CurriculumBank unit={unit} onChoose={onChoose} disabled={disabled} />
    </section>
  );
}
export function CurriculumTheory({ unit, problem }: { unit: Unit; problem: string }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="curriculum-theory">
      <button className="theory-heading" onClick={() => setOpen(!open)} aria-expanded={open}>
        Lý thuyết dự kiến dùng <span>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <>
          <p className="caption">
            {findExercise(problem)
              ? 'Theo bài tập đang học'
              : 'Theo bài học đang chọn; đối chiếu lại điều kiện với đề của em.'}
          </p>
          {unit.theory.map((t) => (
            <p key={t}>
              <MathText text={t} />
            </p>
          ))}
          <p>
            <b>Tự kiểm tra:</b> {unit.questions[0]}
          </p>
        </>
      )}
    </section>
  );
}
export function StatisticsSupport({
  unit,
  problem,
  onProblemChange,
}: {
  unit: Unit;
  problem: string;
  onProblemChange: (p: string) => void;
}) {
  return (
    <>
      <StatisticsLab
        key={problem}
        initial={findExercise(problem)?.chart}
        onConfirm={(data) => onProblemChange(problem + '\nBảng dữ liệu em xác nhận:\n' + data)}
      />
      <CurriculumTheory unit={unit} problem={problem} />
    </>
  );
}
