import {writeFileSync} from 'node:fs';
import {loadTS} from '../tests/load-ts.mjs';
const {worksheets}=await loadTS('lib/worksheets.ts');
const {lessons}=await loadTS('lib/learning.ts');
// A generated data projection, not a second source of exercises or solutions.
writeFileSync(new URL('../server/practice-bank.json',import.meta.url),JSON.stringify([...worksheets.map(w=>({id:w.id,topic:w.section,problem:w.problem})),...lessons.map(l=>({id:l.id,topic:l.topic,problem:l.problem}))],null,2)+'\n');
