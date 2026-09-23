import {problemForTurn} from './problem-diagram';

/** A student's conclusion is not a new statement of the problem. */
export function problemForConversation(text:string,previous=''):string{
 const t=text.trim().normalize('NFC');
 if(!previous)return problemForTurn(t);
 if(/bài tương tự|^Tạo đúng \d+ câu/iu.test(t))return '';
 if(/^(?:bài mới|đề mới|cho\s|xét\s|sửa đề|đính chính|đổi giả thiết|thay giả thiết)/iu.test(t)){
  const next=problemForTurn(t,previous);
  return next===previous?t:next;
 }
 if(/^(?:nối\s|qua\s+[A-Z]|kẻ\s|vẽ\s|dựng\s|gọi\s+[A-Z])/iu.test(t))return problemForTurn(t,previous);
 return previous;
}
