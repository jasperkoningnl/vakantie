export const loadSet=(key:string):Set<string>=>{try{return new Set(JSON.parse(localStorage.getItem(key)??'[]') as string[])}catch{return new Set()}};
export const saveSet=(key:string,set:Set<string>)=>localStorage.setItem(key,JSON.stringify([...set]));
