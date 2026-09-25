export type Theory = { id: string; title: string; content: string; condition: string };
import type { GeometryModel } from './geometry-model';
export type DynamicTheory = Theory & {
  definition: string;
  conditions: string[];
  connectionToProblem: string;
  thinkingOperation: string;
  commonMistake: string;
  source: string;
  example: string;
  recognition: string;
};
const bank: Record<string, Theory> = {
  reading: {
    id: 'reading',
    title: 'Đọc giả thiết và kết luận',
    content:
      'Tách điều đề cho, vị trí điểm và điều cần chứng minh. Chỉ dùng kết quả đã có căn cứ làm dữ kiện cho bước tiếp theo.',
    condition: 'Nếu dữ kiện chưa rõ, xác nhận trước khi áp dụng định lý.',
  },
  circle: {
    id: 'circle',
    title: 'Đường tròn và bán kính',
    content:
      'Đường tròn tâm O bán kính R gồm các điểm cách O một khoảng R. Các bán kính của cùng một đường tròn bằng nhau; đường kính đi qua tâm và dài bằng hai lần bán kính.',
    condition:
      'Hai đoạn đang so sánh phải là bán kính của cùng một đường tròn hoặc hai đường tròn có bán kính bằng nhau.',
  },
  tangent: {
    id: 'tangent',
    title: 'Tiếp tuyến và bán kính',
    content:
      'Tiếp tuyến của đường tròn vuông góc với bán kính tại tiếp điểm. Đảo lại, đường thẳng qua một điểm thuộc đường tròn và vuông góc với bán kính tại đó là tiếp tuyến.',
    condition:
      'Chiều đảo cần cả hai điều kiện: tiếp điểm thuộc đường tròn và đường thẳng vuông góc với bán kính tại chính điểm ấy.',
  },
  angles: {
    id: 'angles',
    title: 'Góc trong và góc ngoài',
    content:
      'Tổng các góc trong một tứ giác bằng 360°; trong tam giác bằng 180°. Hai góc kề bù có tổng 180°.',
    condition: 'Đọc đúng thứ tự đỉnh và phân biệt góc trong với góc ngoài kề bù.',
  },
  midpoint: {
    id: 'midpoint',
    title: 'Trung điểm và tỉ lệ đoạn thẳng',
    content:
      'Trung điểm nằm trên đoạn thẳng và cách đều hai đầu mút. Hai đoạn nhỏ đều bằng nửa đoạn ban đầu. Hệ số nhân độ dài phải được giữ khi biến đổi đẳng thức.',
    condition: 'Đẳng thức độ dài riêng lẻ chưa xác định được vị trí điểm trên đoạn.',
  },
  midline: {
    id: 'midline',
    title: 'Đường trung bình của tam giác',
    content:
      'Đoạn nối trung điểm hai cạnh của tam giác song song với cạnh thứ ba và dài bằng nửa cạnh ấy. Đường qua trung điểm một cạnh, song song với cạnh thứ hai, đi qua trung điểm cạnh còn lại.',
    condition: 'Xác định đúng tam giác và hai cạnh có trung điểm.',
  },
  parallel: {
    id: 'parallel',
    title: 'Song song, vuông góc và góc',
    content:
      'Hai đường thẳng phân biệt cùng vuông góc với một đường thì song song. Khi một đường cắt hai đường song song, các góc so le trong và đồng vị tương ứng bằng nhau.',
    condition: 'Phải xác định cùng đường thứ ba hoặc đúng cặp góc trước khi áp dụng.',
  },
  congruence: {
    id: 'congruence',
    title: 'Hai tam giác bằng nhau',
    content:
      'Các trường hợp thường dùng: cạnh–cạnh–cạnh, cạnh–góc–cạnh, góc–cạnh–góc. Tam giác vuông còn có trường hợp cạnh huyền–cạnh góc vuông hoặc cạnh huyền–góc nhọn.',
    condition: 'Ghép đúng các đỉnh tương ứng; góc trong cạnh–góc–cạnh phải xen giữa hai cạnh.',
  },
  parallelogram: {
    id: 'parallelogram',
    title: 'Hình bình hành',
    content:
      'Có hai cặp cạnh đối song song; các cạnh đối bằng nhau, các góc đối bằng nhau; đường chéo cắt nhau tại trung điểm mỗi đường. Có thể nhận biết bằng hai cặp cạnh đối song song, hai cặp cạnh đối bằng nhau, hoặc một cặp cạnh đối vừa song song vừa bằng nhau. Tứ giác có hai đường chéo cắt nhau tại trung điểm mỗi đường là hình bình hành.',
    condition: 'Nhận biết qua đường chéo đòi hỏi giao điểm là trung điểm của cả hai đường.',
  },
  rectangle: {
    id: 'rectangle',
    title: 'Hình chữ nhật',
    content:
      'Có bốn góc vuông. Hình bình hành có một góc vuông hoặc có hai đường chéo bằng nhau là hình chữ nhật.',
    condition: 'Tứ giác chỉ có hai đường chéo bằng nhau chưa đủ để nhận biết hình chữ nhật.',
  },
  rhombus: {
    id: 'rhombus',
    title: 'Hình thoi',
    content:
      'Có bốn cạnh bằng nhau. Hình bình hành có hai cạnh kề bằng nhau hoặc hai đường chéo vuông góc là hình thoi. Đường chéo hình thoi chia đôi các góc ở đỉnh.',
    condition:
      'Hình thoi không nhất thiết có hai đường chéo bằng nhau; hình vuông là trường hợp có.',
  },
  square: {
    id: 'square',
    title: 'Hình vuông',
    content:
      'Có bốn góc vuông và bốn cạnh bằng nhau. Có thể nhận biết từ hình chữ nhật có hai cạnh kề bằng nhau hoặc từ hình thoi có một góc vuông.',
    condition: 'Hai đường chéo vừa bằng nhau vừa vuông góc chưa đủ với tứ giác bất kì.',
  },
  trapezoid: {
    id: 'trapezoid',
    title: 'Hình thang và hình thang cân',
    content:
      'Hình thang có một cặp cạnh đối song song. Hình thang cân có hai góc kề một đáy bằng nhau; hai đường chéo bằng nhau. Đoạn nối trung điểm hai cạnh bên song song hai đáy, dài bằng nửa tổng hai đáy.',
    condition:
      'Xác định rõ hai đáy, cạnh bên; không nhầm đường trung bình hình thang với của tam giác.',
  },
  symmetry: {
    id: 'symmetry',
    title: 'Đối xứng qua điểm và qua đường',
    content:
      'Đối xứng qua điểm: tâm là trung điểm của đoạn nối hai điểm tương ứng. Đối xứng qua đường: trục là đường trung trực của đoạn nối hai điểm tương ứng.',
    condition: 'Hai phép đối xứng có điều kiện khác nhau; không dùng lẫn tâm và trục.',
  },
  bisector: {
    id: 'bisector',
    title: 'Tia phân giác',
    content:
      'Tia phân giác nằm trong góc và chia góc đó thành hai góc bằng nhau. Điểm trên tia phân giác cách đều hai cạnh của góc.',
    condition: 'Khoảng cách đến cạnh được đo bằng đoạn vuông góc đến đường thẳng chứa cạnh.',
  },
  pythagoras: {
    id: 'pythagoras',
    title: 'Định lí Pythagore',
    content:
      'Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông. Khi dùng định lí đảo, so sánh bình phương cạnh dài nhất với tổng bình phương hai cạnh còn lại.',
    condition: 'Phải xác định góc vuông trước khi áp dụng chiều thuận; thống nhất đơn vị độ dài.',
  },
  area: {
    id: 'area',
    title: 'Diện tích',
    content:
      'Diện tích tam giác bằng nửa tích đáy và chiều cao tương ứng. Diện tích hình chữ nhật bằng tích hai kích thước. Tứ giác có hai đường chéo vuông góc có diện tích bằng nửa tích hai đường chéo.',
    condition: 'Không dùng công thức nửa tích đường chéo nếu chưa có điều kiện vuông góc.',
  },
  inequality: {
    id: 'inequality',
    title: 'Bất đẳng thức tam giác',
    content:
      'Trong một tam giác không suy biến, tổng độ dài hai cạnh lớn hơn cạnh còn lại. Có thể cộng các bất đẳng thức cùng chiều.',
    condition: 'Chọn đúng tam giác và không dùng hình suy biến.',
  },
};
export function theoryForProblem(problem: string): Theory[] {
  const s = problem
      .normalize('NFC')
      .toLowerCase()
      .replace(/\\parallel|\/\//g, '∥')
      .replace(/\\perp|⊥/g, '⟂'),
    ids: string[] = [];
  const add = (id: string) => {
    if (!ids.includes(id)) ids.push(id);
  };
  if (/đường tròn|bán kính|tiếp tuyến/.test(s)) add('circle');
  if (/tiếp tuyến/.test(s)) add('tangent');
  if (
    /trung điểm|trung trực|\d\s*\*?\s*[a-z]{2}\s*=|[a-z]{2}\s*[:/]\s*[a-z]{2}|[a-z]{2}\s*=\s*[a-z]{2}\s*\//.test(
      s,
    )
  ) {
    add('midpoint');
    if (/tam giác|trung điểm/.test(s)) add('midline');
  }
  if (/vuông góc|⟂|song song|∥|đường cao|hình chiếu/.test(s)) add('parallel');
  if (/đối xứng|trung trực/.test(s)) add('symmetry');
  if (/phân giác/.test(s)) add('bisector');
  if (/hình bình hành/.test(s)) add('parallelogram');
  if (/hình chữ nhật/.test(s)) add('rectangle');
  if (/hình thoi/.test(s)) add('rhombus');
  if (/hình vuông/.test(s)) add('square');
  if (/hình thang/.test(s)) add('trapezoid');
  if (/tính.*góc|tính x|∠|\d°|góc ngoài|góc chưa biết/.test(s)) add('angles');
  if (/diện tích/.test(s)) add('area');
  if (
    /p[yit]+th|cạnh huyền|màn hình/.test(s) ||
    (/tính[^.!?]*(?:độ dài|chu vi|chiều cao|đường chéo|cạnh|cm|dm|mét)/.test(s) &&
      /vuông|đường cao|đường chéo|tam giác|thang/.test(s))
  )
    add('pythagoras');
  if (/chu vi|> p|> ab|> ad|so sánh đường chéo/.test(s) && !/tính/.test(s)) add('inequality');
  if (
    /chứng minh|tam giác.*cân|bằng nhau/.test(s) &&
    !ids.includes('inequality') &&
    !ids.includes('circle') &&
    !/tính x|tính bốn góc/.test(s)
  )
    add('congruence');
  if (!ids.length) add('reading');
  return ids.map((id) => bank[id]);
}

const examples: Record<string, string> = {
  midpoint: 'Nếu M là trung điểm PQ thì M thuộc PQ và PM = MQ.',
  midline: 'Trong tam giác PQR, nếu M, N là trung điểm PQ, PR thì MN ∥ QR.',
  parallelogram: 'Trong hình bình hành PQRS, giao điểm hai đường chéo chia đôi mỗi đường.',
  trapezoid: 'Đường trung bình hình thang có độ dài bằng nửa tổng hai đáy.',
  tangent: 'Nếu T thuộc (O), đường qua T và vuông góc OT là tiếp tuyến tại T.',
  circle: 'Nếu P, Q thuộc cùng đường tròn tâm O thì OP = OQ.',
  rectangle: 'Hình bình hành có một góc vuông là hình chữ nhật.',
  rhombus: 'Hình bình hành có hai cạnh kề bằng nhau là hình thoi.',
};
export function dynamicTheoryForProblem(
  problem: string,
  model?: GeometryModel,
  level = 'Cơ bản',
): DynamicTheory[] {
  let cards = theoryForProblem(model?.normalized || problem);
  const mids = (model?.relations || [])
    .filter((r) => r.type === 'midpoint')
    .map((r) => r.data as { of: [string, string] });
  if (mids.length > 1 && model) {
    const p = model.drawing.points;
    const triangle = mids.some((a, i) =>
      mids.slice(i + 1).some((b) => {
        const common = a.of.find((n) => b.of.includes(n)),
          x = a.of.find((n) => n !== common),
          y = b.of.find((n) => n !== common);
        if (!common || !x || !y || !p[common] || !p[x] || !p[y]) return false;
        return (
          Math.abs(
            (p[x].x - p[common].x) * (p[y].y - p[common].y) -
              (p[x].y - p[common].y) * (p[y].x - p[common].x),
          ) > 1e-7
        );
      }),
    );
    if (!triangle) cards = cards.filter((c) => c.id !== 'midline');
  }
  // Rank from actual parsed relations; this works for new problems and provisional figures.
  const priorities = model?.relations.map((r) => r.type) || [];
  const score = (id: string) =>
    (id === 'parallelogram' &&
    model?.relations.some(
      (r) => r.type === 'shape' && /parallelogram|rectangle|rhombus|square/.test(r.description),
    )
      ? 3
      : 0) +
    (priorities.includes('midpoint') && id === 'midpoint' ? 5 : 0) +
    (priorities.includes('tangent') && id === 'tangent' ? 5 : 0) +
    (model?.goal.includes('∥') && id === 'parallel' ? 2 : 0) +
    (id === 'congruence' ? -1 : 0);
  return [...cards]
    .sort((a, b) => score(b.id) - score(a.id))
    .map((card) => {
      let connection = model?.givens.find((g) =>
        card.id === 'midpoint'
          ? /trung điểm/.test(g)
          : card.id === 'tangent'
            ? /tiếp tuyến/iu.test(g)
            : card.id === 'parallel'
              ? /∥|⟂|song song|vuông góc/.test(g)
              : g.toLowerCase().includes(card.title.toLowerCase()),
      );
      if (!connection)
        connection =
          card.id === 'reading'
            ? 'Đề chưa đủ rõ để chọn một định lý chuyên biệt.'
            : `Đối chiếu ${card.title.toLowerCase()} với mục tiêu: ${model?.goal || 'yêu cầu trong đề'}.`;
      return {
        ...card,
        definition: card.content,
        conditions: [card.condition],
        connectionToProblem: connection,
        thinkingOperation: /Mất/.test(level)
          ? 'Cụ thể hóa · Phân tích'
          : /Giỏi|Khá/.test(level)
            ? 'Phân tích · So sánh · Khái quát hóa'
            : 'Phân tích · Tổng hợp',
        commonMistake: card.condition,
        source:
          'Kho kiến thức hình học THCS của ứng dụng; cách tổ chức: Nguyễn Thanh Hưng – Ngô Tùng Nhân (2019), tr.184–187; Bài giảng vấn đề tư duy, tr.9–14.',
        example:
          examples[card.id] ||
          'Hãy chọn một dữ kiện của bài và thử kiểm tra từng điều kiện áp dụng trước khi kết luận.',
        recognition:
          card.id === 'midline'
            ? 'Tìm một tam giác có hai điểm được xác định là trung điểm.'
            : card.id === 'parallelogram'
              ? 'Chú ý cặp cạnh đối hoặc giao điểm hai đường chéo.'
              : 'So sánh đối tượng trong mục tiêu với điều kiện của kiến thức này.',
      };
    });
}
