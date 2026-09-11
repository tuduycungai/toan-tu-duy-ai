export async function submitGoogleForm(data:{name:string;school:string;email:string;rating:number;comment:string}){
  const url="https://docs.google.com/forms/d/e/1FAIpQLScySWZ7CZxnxKjmfwUOZov9LXzd5aeQ_iZ7TEa7qaccUjz41A/formResponse";
  const body=new URLSearchParams({
    "entry.551915748":data.name,
    "entry.1887301755":data.school,
    "entry.1301171588":data.email,
    "entry.54850382":String(data.rating),
    "entry.326585189":data.comment
  });
  await fetch(url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
}
