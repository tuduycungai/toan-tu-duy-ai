import { useMemo, useState } from 'react';
import { compileGeometry } from '../lib/geometry-model';
import { ProblemFigure as LocalFigure } from './problem-figure';
import { ProblemFigure as AIFigure } from './tikz-figure';

export function ProblemFigure(props: React.ComponentProps<typeof AIFigure>) {
  const [aiProblem, setAIProblem] = useState('');
  const useAI = aiProblem === props.problem;
  const local = useMemo(
    () => compileGeometry(props.problem).status === 'verified',
    [props.problem],
  );
  if (local && !useAI)
    return (
      <>
        <p className="figure-caption">
          Hình dựng trong ứng dụng · không tốn phí API. Hình được giữ khi em trả lời tiếp.
        </p>
        <LocalFigure
          key={props.redrawToken}
          problem={props.problem}
          level={props.level}
          onProblemChange={props.onProblemChange}
        />
        <button
          className="text-button"
          disabled={props.suspended}
          onClick={() => setAIProblem(props.problem)}
        >
          Dựng hình khác bằng AI (cần API)
        </button>
      </>
    );
  return (
    <>
      {local && (
        <button className="text-button" onClick={() => setAIProblem('')}>
          Dùng hình dựng sẵn
        </button>
      )}
      <AIFigure {...props} />
    </>
  );
}
