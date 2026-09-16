import {readFileSync} from 'node:fs';
const wrap=body=>String.raw`\documentclass[tikz,border=5mm]{standalone}
\usetikzlibrary{calc,angles,quotes,intersections,through,positioning,3d,arrows.meta}
\begin{document}\begin{tikzpicture}[thick]
${body}
\end{tikzpicture}\end{document}`;
export const cases=[
 ['right-isosceles',readFileSync(new URL('./right-isosceles.tex',import.meta.url),'utf8')],
 ['parallelogram-midpoints',wrap(String.raw`\coordinate (A) at (0,0);\coordinate (B) at (5,0);\coordinate (C) at (6,3);\coordinate (D) at (1,3);
\coordinate (O) at ($(A)!0.5!(C)$);\coordinate (E) at ($(O)!0.5!(D)$);\coordinate (F) at ($(O)!0.5!(B)$);
\draw (A)--(B)--(C)--(D)--cycle;\draw[dashed,gray] (A)--(C) (B)--(D);\draw[blue] (A)--(E) (C)--(F);
\foreach \p in {A,B,C,D,O,E,F}{\fill (\p) circle (1pt);\node[above] at (\p) {$\p$};}`)],
 ['circle-tangent',wrap(String.raw`\coordinate (O) at (0,0);\coordinate (A) at (2,0);\coordinate (T) at (2,2);
\draw (O) circle (2);\draw (2,-2.5)--(2,2.5);\draw[dashed] (O)--(A);
\pic[draw,angle radius=0.25cm]{right angle=O--A--T};\fill (O) circle (1pt) (A) circle (1pt);\node[left] at (O) {$O$};\node[right] at (A) {$A$};`)],
 ['perpendicular-foot',wrap(String.raw`\coordinate (A) at (1,3);\coordinate (B) at (0,0);\coordinate (C) at (5,0);\coordinate (H) at ($(B)!(A)!(C)$);
\draw (A)--(B)--(C)--cycle;\draw[dashed] (A)--(H);\pic[draw,angle radius=0.25cm]{right angle=A--H--C};
\foreach \p in {A,B,C,H}{\fill (\p) circle (1pt);\node[above right] at (\p) {$\p$};}`)],
 ['plot',wrap(String.raw`\draw[->] (-2.3,0)--(2.3,0) node[right] {$x$};\draw[->] (0,-0.3)--(0,4.5) node[above] {$y$};\draw[blue,domain=-2:2,samples=60] plot (\x,{\x*\x});`)],
 ['solid-projection',wrap(String.raw`\draw (0,0)--(3,0)--(4,1)--(4,3)--(1,3)--(0,2)--cycle;\draw (0,2)--(3,2)--(4,3) (3,2)--(3,0);\draw[dashed] (0,0)--(1,1)--(4,1) (1,1)--(1,3);`)]
];
