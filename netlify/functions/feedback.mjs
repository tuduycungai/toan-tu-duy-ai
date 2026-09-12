import {handleFeedback} from '../../server/feedback.mjs';
export default (request)=>handleFeedback(request,process.env);
