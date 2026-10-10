import { readSession, saveSession } from '../lib/session-recovery';
import { useEffect, useState } from 'react';
import App from '../app/page';
import { chapters, units, routeContext, unitLabel, title, tagline } from '../lib/curriculum';
import { readProfile, type Profile } from '../lib/tutor';
import { BookOpen, ArrowUpRight, Moon, Sun } from 'lucide-react';
import '../app/curriculum.css';
export function CurriculumShell() {
  const [route, setRoute] = useState(() => routeContext());
  const [code, setCode] = useState('');
  const [profile, setProfile] = useState<Profile | null>(readProfile);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('ai-tutor-theme') || 'light';
    } catch {
      return 'light';
    }
  });
  useEffect(() => {
    const pop = () => setRoute(routeContext());
    addEventListener('popstate', pop);
    return () => removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    document.title = title;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('ai-tutor-theme', theme);
    } catch {}
  }, [theme]);
  function go(chapterId?: string, lessonId?: string) {
    const url = new URL(location.href);
    url.search = chapterId
      ? new URLSearchParams({
          chapter: chapterId,
          ...(lessonId ? { lesson: lessonId } : {}),
        }).toString()
      : '';
    history.pushState({}, '', url);
    setRoute(routeContext());
    window.scrollTo(0, 0);
  }
  if (route)
    return (
      <App
        key={`${route.chapter.id}:${route.unit.id}`}
        chapter={route.chapter}
        unit={route.unit}
        onHome={() => go()}
        onUnit={(id) => go(route.chapter.id, id)}
        onChapter={(id) => go(id)}
        shared={{ code, setCode, profile, setProfile, theme, setTheme }}
      />
    );
  let resume: { chapterId: string; lessonId: string } | null = null;
  try {
    const last = JSON.parse(sessionStorage.getItem('curriculum-last') || 'null');
    if (units.some((u) => u.id === last?.lessonId && u.chapterId === last?.chapterId))
      resume = last;
  } catch {}
  const legacy = readSession();
  return (
    <div className="curriculum-home">
      <header className="curriculum-top">
        <span className="curriculum-logo">
          <BookOpen size={24} /> {title}
        </span>
        <button
          className="icon-button"
          aria-label="Đổi giao diện sáng tối"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </button>
      </header>
      <main>
        <section className="curriculum-hero">
          <span className="eyebrow">TOÁN 8 · TẬP 1 · KẾT NỐI TRI THỨC</span>
          <h1>
            Mỗi câu hỏi mở ra
            <br />
            <em>một cách nghĩ mới.</em>
          </h1>
          <p>{tagline}</p>
          <div className="curriculum-pill">
            5 chương <span>·</span> 20 bài học <span>·</span> Gợi mở từng bước
          </div>
          {resume && (
            <button
              className="primary resume-button"
              onClick={() => go(resume!.chapterId, resume!.lessonId)}
            >
              Tiếp tục học · Chương {chapters.find((c) => c.id === resume!.chapterId)?.roman} ·{' '}
              {unitLabel(units.find((u) => u.id === resume!.lessonId)!)} <ArrowUpRight size={18} />
            </button>
          )}
        </section>
        {legacy.problem || legacy.messages.length || legacy.input ? (
          <details className="curriculum-theory">
            <summary>Khôi phục phiên trước khi nâng cấp</summary>
            <p>
              Phiên cũ còn nguyên. Chọn chương để tiếp tục; dữ liệu cũ chưa đủ nhãn để tự phân loại.
            </p>
            <p>{(legacy.problem || legacy.input).slice(0, 220)}</p>
            <div className="chart-inputs">
              {chapters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    saveSession(
                      { ...legacy, tutorToken: undefined, progress: undefined },
                      `${c.id}:${c.units[0]}`,
                    );
                    go(c.id, c.units[0]);
                  }}
                >
                  Chương {c.roman}
                </button>
              ))}
            </div>
          </details>
        ) : null}
        <section className="chapter-grid" aria-label="Danh sách 5 chương">
          {chapters.map((c, i) => (
            <article className={`chapter-card chapter-${c.id}`} key={c.id}>
              <span className="chapter-symbol" aria-hidden="true">
                {['x² + xy', '(a + b)²', '◇', '△', '▥'][i]}
              </span>
              <span className="eyebrow">CHƯƠNG {c.roman}</span>
              <h2>{c.title}</h2>
              <p>{c.description}</p>
              <div className="chapter-card-foot">
                <span>{c.units.filter((id) => /^l\d/.test(id)).length} bài học</span>
                <button className="primary" onClick={() => go(c.id)}>
                  Vào học <ArrowUpRight size={17} />
                </button>
              </div>
            </article>
          ))}
        </section>
        <section className="curriculum-promise">
          <BookOpen />
          <div>
            <h2>Học bằng cách tự tìm lời giải</h2>
            <p>
              Đọc hiểu đề, kết nối kiến thức, thử một hướng giải và tự kiểm tra. Gia sư AI đồng hành
              theo từng bước em làm.
            </p>
          </div>
        </section>
      </main>
      <footer>
        {title} · {tagline}
      </footer>
    </div>
  );
}
