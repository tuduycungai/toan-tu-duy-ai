import {useEffect,useState} from 'react';
/** One object URL per SVG, revoked on replacement/unmount instead of encoding on every render. */
export function useBlobURL(content:string,mimeType='image/svg+xml'){
  const [url,setURL]=useState('');
  useEffect(()=>{
    if(!content){setURL('');return;}
    const value=URL.createObjectURL(new Blob([content],{type:mimeType}));setURL(value);
    return()=>URL.revokeObjectURL(value);
  },[content,mimeType]);
  return url;
}
