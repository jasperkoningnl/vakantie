export const loadSet=(key:string):Set<string>=>{try{return new Set(JSON.parse(localStorage.getItem(key)??'[]') as string[])}catch{return new Set()}};
export const saveSet=(key:string,set:Set<string>)=>localStorage.setItem(key,JSON.stringify([...set]));
export function loadJson<T>(key:string,fallback:T):T{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}}
export function saveJson<T>(key:string,value:T){localStorage.setItem(key,JSON.stringify(value))}
export const uid=(prefix='id')=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
