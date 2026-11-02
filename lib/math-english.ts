export type Pair = { en: string; vi: string; kind?: string };
export type BilingualReply = { pairs: Pair[]; plan: Pair[]; problem?: Pair };
export type MathWord = {
  en: string;
  vi: string;
  example: Pair;
  lessons: string[];
  aliases: string[];
};
const entries: [string, string, string, string, string, string][] = [
  [
    'monomial',
    'đơn thức',
    'l01,l05',
    'A monomial has one term.',
    'Đơn thức có một hạng tử.',
    'đơn thức',
  ],
  [
    'coefficient',
    'hệ số',
    'l01,l02,l03,l04',
    'Identify the coefficient first.',
    'Trước hết hãy xác định hệ số.',
    'hệ số',
  ],
  [
    'variable',
    'biến',
    'l01,l02,l03',
    'Which variable appears in the expression?',
    'Biến nào xuất hiện trong biểu thức?',
    'biến',
  ],
  [
    'exponent',
    'số mũ',
    'l01,l04,l05',
    'Check the exponent of each variable.',
    'Kiểm tra số mũ của mỗi biến.',
    'số mũ',
  ],
  [
    'degree',
    'bậc',
    'l01,l02',
    'Find the degree after simplifying.',
    'Tìm bậc sau khi thu gọn.',
    'bậc',
  ],
  [
    'polynomial',
    'đa thức',
    'l02,l03,l04,l05',
    'A polynomial is a sum of monomials.',
    'Đa thức là một tổng các đơn thức.',
    'đa thức',
  ],
  [
    'like terms',
    'hạng tử đồng dạng',
    'l02,l03',
    'Combine only like terms.',
    'Chỉ gộp các hạng tử đồng dạng.',
    'đồng dạng,hạng tử',
  ],
  [
    'simplify',
    'thu gọn',
    'l01,l02,l03',
    'Simplify the expression carefully.',
    'Hãy thu gọn biểu thức cẩn thận.',
    'thu gọn,rút gọn',
  ],
  [
    'sum',
    'tổng',
    'l03,l06,l07,l08',
    'Write the sum in brackets.',
    'Viết tổng trong ngoặc.',
    'tổng,cộng',
  ],
  [
    'difference',
    'hiệu',
    'l03,l06,l07,l08',
    'Pay attention to the sign of the difference.',
    'Chú ý dấu của hiệu.',
    'hiệu,trừ',
  ],
  [
    'product',
    'tích',
    'l04,l09',
    'Write the expression as a product.',
    'Viết biểu thức thành một tích.',
    'tích của,phép nhân',
  ],
  [
    'quotient',
    'thương',
    'l05',
    'Check the quotient by multiplication.',
    'Kiểm tra thương bằng phép nhân.',
    'thương,chia',
  ],
  [
    'identity',
    'hằng đẳng thức',
    'l06,l07,l08',
    'An identity holds for all allowed values.',
    'Hằng đẳng thức đúng với mọi giá trị được phép.',
    'hằng đẳng thức',
  ],
  [
    'square',
    'bình phương',
    'l06',
    'The square of a sum has three terms.',
    'Bình phương của một tổng có ba hạng tử.',
    'bình phương',
  ],
  [
    'cube',
    'lập phương',
    'l07,l08',
    'Compare the cube of a sum with a sum of cubes.',
    'So sánh lập phương của một tổng với tổng hai lập phương.',
    'lập phương',
  ],
  [
    'factor',
    'nhân tử',
    'l08,l09',
    'Look for a common factor.',
    'Tìm một nhân tử chung.',
    'nhân tử',
  ],
  [
    'factorisation',
    'phân tích thành nhân tử',
    'l09',
    'Check the factorisation by expanding.',
    'Kiểm tra cách phân tích bằng khai triển.',
    'phân tích thành nhân tử',
  ],
  [
    'expand',
    'khai triển',
    'l04,l06,l07,l08,l09',
    'Expand each product before comparing.',
    'Khai triển mỗi tích trước khi so sánh.',
    'khai triển',
  ],
  [
    'quadrilateral',
    'tứ giác',
    'l10',
    'A quadrilateral has four sides.',
    'Tứ giác có bốn cạnh.',
    'tứ giác',
  ],
  [
    'interior angle',
    'góc trong',
    'l10,l11',
    'Identify each interior angle.',
    'Xác định từng góc trong.',
    'góc',
  ],
  [
    'parallel',
    'song song',
    'l11,l12,l15,l16',
    'Which two lines are parallel?',
    'Hai đường thẳng nào song song?',
    'song song,∥',
  ],
  [
    'perpendicular',
    'vuông góc',
    'l13,l14',
    'Perpendicular lines form a right angle.',
    'Hai đường thẳng vuông góc tạo thành một góc vuông.',
    'vuông góc,⟂',
  ],
  [
    'isosceles trapezoid',
    'hình thang cân',
    'l11',
    'Check the conditions for an isosceles trapezoid.',
    'Kiểm tra điều kiện của hình thang cân.',
    'hình thang cân',
  ],
  [
    'parallelogram',
    'hình bình hành',
    'l12,l13,l14',
    'Opposite sides of a parallelogram are parallel.',
    'Các cạnh đối của hình bình hành song song.',
    'hình bình hành',
  ],
  [
    'rectangle',
    'hình chữ nhật',
    'l13',
    'A rectangle has four right angles.',
    'Hình chữ nhật có bốn góc vuông.',
    'hình chữ nhật',
  ],
  [
    'rhombus',
    'hình thoi',
    'l14',
    'A rhombus has four equal sides.',
    'Hình thoi có bốn cạnh bằng nhau.',
    'hình thoi',
  ],
  [
    'square',
    'hình vuông',
    'l14',
    'A square has equal sides and right angles.',
    'Hình vuông có các cạnh bằng nhau và các góc vuông.',
    'hình vuông',
  ],
  [
    'diagonal',
    'đường chéo',
    'l10,l11,l12,l13,l14',
    'Draw the diagonal between opposite vertices.',
    'Vẽ đường chéo nối hai đỉnh đối diện.',
    'đường chéo',
  ],
  [
    'midpoint',
    'trung điểm',
    'l12,l16',
    'The midpoint divides a segment into two equal parts.',
    'Trung điểm chia một đoạn thẳng thành hai phần bằng nhau.',
    'trung điểm',
  ],
  [
    'line segment',
    'đoạn thẳng',
    'l10,l15,l16',
    'Compare the lengths of the line segments.',
    'So sánh độ dài các đoạn thẳng.',
    'đoạn thẳng,độ dài',
  ],
  [
    'triangle',
    'tam giác',
    'l15,l16,l17',
    'Identify the corresponding sides of the triangles.',
    'Xác định các cạnh tương ứng của các tam giác.',
    'tam giác',
  ],
  [
    'ratio',
    'tỉ số',
    'l15,l17',
    'Keep corresponding lengths in the same order.',
    'Giữ các độ dài tương ứng theo cùng thứ tự.',
    'tỉ số,tỉ lệ',
  ],
  [
    'proportion',
    'tỉ lệ thức',
    'l15,l17',
    'Check both ratios in the proportion.',
    'Kiểm tra hai tỉ số trong tỉ lệ thức.',
    'tỉ lệ thức',
  ],
  [
    'midsegment',
    'đường trung bình',
    'l16',
    'A midsegment joins two side midpoints.',
    'Đường trung bình nối trung điểm của hai cạnh.',
    'đường trung bình',
  ],
  [
    'angle bisector',
    'đường phân giác',
    'l17',
    'An angle bisector divides an angle into two equal angles.',
    'Đường phân giác chia một góc thành hai góc bằng nhau.',
    'phân giác',
  ],
  [
    'given',
    'giả thiết; dữ kiện đã cho',
    'l10,l15',
    'Use only the given information.',
    'Chỉ sử dụng các dữ kiện đã cho.',
    'giả thiết,dữ kiện',
  ],
  [
    'prove',
    'chứng minh',
    'l11,l12,l13,l14,l15,l16,l17',
    'Give a reason for each step of the proof.',
    'Nêu căn cứ cho mỗi bước chứng minh.',
    'chứng minh',
  ],
  [
    'data',
    'dữ liệu',
    'l18,l19,l20',
    'Check the source of the data.',
    'Kiểm tra nguồn dữ liệu.',
    'dữ liệu,số liệu',
  ],
  [
    'qualitative data',
    'dữ liệu định tính',
    'l18',
    'Qualitative data describe categories.',
    'Dữ liệu định tính mô tả các loại.',
    'định tính',
  ],
  [
    'quantitative data',
    'dữ liệu định lượng',
    'l18',
    'Quantitative data represent counts or measurements.',
    'Dữ liệu định lượng biểu diễn số đếm hoặc số đo.',
    'định lượng',
  ],
  [
    'discrete',
    'rời rạc',
    'l18',
    'The number of students is discrete data.',
    'Số học sinh là dữ liệu rời rạc.',
    'rời rạc',
  ],
  [
    'continuous',
    'liên tục',
    'l18',
    'Height is continuous data.',
    'Chiều cao là dữ liệu liên tục.',
    'liên tục',
  ],
  [
    'bar chart',
    'biểu đồ cột',
    'l19',
    'Compare the bar heights using the scale.',
    'So sánh chiều cao các cột theo thang đo.',
    'biểu đồ cột',
  ],
  [
    'line chart',
    'biểu đồ đoạn thẳng',
    'l19',
    'A line chart can show change over time.',
    'Biểu đồ đoạn thẳng có thể thể hiện sự thay đổi theo thời gian.',
    'biểu đồ đoạn thẳng',
  ],
  [
    'pie chart',
    'biểu đồ hình quạt tròn',
    'l19',
    'A pie chart shows parts of a whole.',
    'Biểu đồ hình quạt tròn thể hiện các phần của một tổng thể.',
    'quạt tròn',
  ],
  [
    'axis',
    'trục',
    'l19,l20',
    'Read the axis labels and units.',
    'Đọc nhãn và đơn vị trên trục.',
    'trục',
  ],
  [
    'percentage',
    'tỉ lệ phần trăm',
    'l19,l20',
    'Use the same total when comparing percentages.',
    'Dùng cùng một tổng khi so sánh các tỉ lệ phần trăm.',
    'phần trăm,%',
  ],
  [
    'trend',
    'xu hướng',
    'l20',
    'Describe the trend supported by the data.',
    'Mô tả xu hướng có căn cứ từ dữ liệu.',
    'xu hướng',
  ],
  [
    'sample',
    'mẫu dữ liệu',
    'l18,l20',
    'Do not extend a conclusion beyond the sample.',
    'Không mở rộng kết luận vượt quá mẫu dữ liệu.',
    'mẫu',
  ],
];
export const mathWords: MathWord[] = entries.map(
  ([en, vi, lessons, exampleEn, exampleVi, aliases]) => ({
    en,
    vi,
    lessons: lessons.split(','),
    aliases: aliases.split(','),
    example: { en: exampleEn, vi: exampleVi },
  }),
);
const principles: [string, string][] = [
  [
    'A monomial is a product of a number and variables with non-negative integer exponents. For a nonzero monomial, add the variable exponents to find its degree after simplifying. The zero monomial has no degree.',
    'Đơn thức là tích của một số và các biến có số mũ nguyên không âm. Với đơn thức khác không, cộng số mũ của các biến để tìm bậc sau thu gọn. Đơn thức không không có bậc.',
  ],
  [
    'Simplify a polynomial by combining like terms. For a nonzero polynomial, its degree is the greatest degree of its nonzero terms.',
    'Thu gọn đa thức bằng cách gộp các hạng tử đồng dạng. Với đa thức khác không, bậc của đa thức là bậc lớn nhất trong các hạng tử khác không.',
  ],
  [
    'Only like terms can be combined. When subtracting a polynomial, change the sign of every term inside the brackets.',
    'Chỉ gộp các hạng tử đồng dạng. Khi trừ một đa thức, đổi dấu từng hạng tử trong ngoặc.',
  ],
  [
    'Distribute each term of one polynomial over every term of the other. Then combine like terms.',
    'Nhân từng hạng tử của đa thức này với từng hạng tử của đa thức kia. Sau đó gộp các hạng tử đồng dạng.',
  ],
  [
    'Divide each term by the nonzero monomial. For exact polynomial division, every term must be divisible by it.',
    'Chia từng hạng tử cho đơn thức khác không. Để phép chia đa thức là chia hết, mỗi hạng tử phải chia hết cho đơn thức đó.',
  ],
  [
    'Check the middle term when using a square identity. A difference of squares becomes a product of a sum and a difference.',
    'Kiểm tra hạng tử giữa khi dùng hằng đẳng thức bình phương. Hiệu hai bình phương thành tích của một tổng và một hiệu.',
  ],
  [
    'The cube of a sum or difference has four terms. Check the coefficients and signs by multiplication.',
    'Lập phương của một tổng hoặc hiệu có bốn hạng tử. Kiểm tra hệ số và dấu bằng phép nhân.',
  ],
  [
    'A sum or difference of cubes factors into a linear factor and a quadratic factor. Check the signs by expanding.',
    'Tổng hoặc hiệu hai lập phương được phân tích thành tích của nhân tử bậc nhất và nhân tử bậc hai. Kiểm tra dấu bằng khai triển.',
  ],
  [
    'Look for a common factor, an identity, or a useful grouping. Multiply the factors back to check your work.',
    'Tìm nhân tử chung, hằng đẳng thức hoặc cách nhóm phù hợp. Nhân ngược các nhân tử để kiểm tra.',
  ],
  [
    'The interior angles of a quadrilateral add up to 360 degrees. Use the given angle information.',
    'Tổng các góc trong của một tứ giác bằng 360 độ. Sử dụng dữ kiện về góc đã cho.',
  ],
  [
    'In an isosceles trapezoid, the two angles adjacent to each base are equal. Check the parallel bases before applying a trapezoid property.',
    'Trong hình thang cân, hai góc kề mỗi đáy bằng nhau. Kiểm tra hai đáy song song trước khi dùng tính chất hình thang.',
  ],
  [
    'A parallelogram has two pairs of parallel opposite sides. Its diagonals bisect each other.',
    'Hình bình hành có hai cặp cạnh đối song song. Hai đường chéo cắt nhau tại trung điểm mỗi đường.',
  ],
  [
    'A rectangle is a quadrilateral with four right angles. A parallelogram with equal diagonals is a rectangle.',
    'Hình chữ nhật là tứ giác có bốn góc vuông. Hình bình hành có hai đường chéo bằng nhau là hình chữ nhật.',
  ],
  [
    'A rhombus has four equal sides. A square has four equal sides and four right angles. Do not infer these conditions from appearance alone.',
    'Hình thoi có bốn cạnh bằng nhau. Hình vuông có bốn cạnh bằng nhau và bốn góc vuông. Không suy các điều kiện chỉ từ dáng hình.',
  ],
  [
    'A line parallel to one side of a triangle cuts the other two sides proportionally. Match the corresponding segments and their units.',
    'Đường thẳng song song với một cạnh của tam giác cắt hai cạnh còn lại theo tỉ lệ. Ghép đúng các đoạn tương ứng và đơn vị.',
  ],
  [
    'The segment joining the midpoints of two sides of a triangle is parallel to the third side and half as long.',
    'Đoạn thẳng nối trung điểm hai cạnh của tam giác song song với cạnh thứ ba và dài bằng một nửa cạnh ấy.',
  ],
  [
    'An internal angle bisector of a triangle divides the opposite side in the ratio of the two adjacent sides.',
    'Đường phân giác trong của một tam giác chia cạnh đối diện thành hai đoạn tỉ lệ với hai cạnh kề.',
  ],
  [
    'Classify data by what they describe. Numerical labels alone do not make data quantitative. Check the source and the collection method.',
    'Phân loại dữ liệu theo nội dung chúng mô tả. Nhãn dạng số không tự làm dữ liệu thành định lượng. Kiểm tra nguồn và cách thu thập.',
  ],
  [
    'Choose a chart suited to the comparison. Always include labels, units and an appropriate scale.',
    'Chọn biểu đồ phù hợp với mục đích so sánh. Luôn ghi nhãn, đơn vị và thang đo phù hợp.',
  ],
  [
    'Compare values using the same units and reference total. Support each conclusion with data and state the limits of the sample.',
    'So sánh các giá trị theo cùng đơn vị và tổng tham chiếu. Dùng dữ liệu làm căn cứ cho mỗi kết luận và nêu giới hạn của mẫu.',
  ],
];
export function lessonKnowledge(ids: string[]): Pair[] {
  return ids
    .map((id) => principles[Number(id.replace('l', '')) - 1])
    .filter(Boolean)
    .map(([en, vi]) => ({ en, vi }));
}
export function wordsFor(problem: string, lessonIds: string[]) {
  const lower = problem.toLowerCase();
  const scored = mathWords.map((word, i) => ({
    word,
    i,
    relevant: lessonIds.some((id) => word.lessons.includes(id)),
    direct:
      word.aliases.some((a) => lower.includes(a)) ||
      ((word.en !== 'square' || lessonIds.some((id) => word.lessons.includes(id))) &&
        new RegExp('\\b' + word.en + '\\b', 'i').test(problem)),
  }));
  return scored
    .filter((x) => x.direct || x.relevant)
    .sort(
      (a, b) =>
        Number(b.direct) - Number(a.direct) || Number(b.relevant) - Number(a.relevant) || a.i - b.i,
    )
    .slice(0, 8);
}
