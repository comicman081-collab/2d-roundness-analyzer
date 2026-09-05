const enc = new TextEncoder();
const json = (v, status=200, headers={}) => new Response(JSON.stringify(v), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const b64u = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fromB64u = s => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4-s.length%4)%4)), c=>c.charCodeAt(0));
const hex = bytes => [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
async function sha256(text){ return hex(await crypto.subtle.digest('SHA-256', enc.encode(String(text)))); }
async function hmac(secret, text){ const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']); return b64u(await crypto.subtle.sign('HMAC',key,enc.encode(text))); }
async function timingSafeHex(a,b){ if(!a||!b||a.length!==b.length)return false; let x=0; for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i); return x===0; }
function parseCookies(req){ return Object.fromEntries((req.headers.get('cookie')||'').split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return [v.slice(0,i),v.slice(i+1)];})); }
async function signSession(env,payload){ const body=b64u(enc.encode(JSON.stringify(payload))); return `${body}.${await hmac(env.SESSION_SECRET,body)}`; }
async function readSession(req,env){ try{ const token=parseCookies(req).jhpa_session; if(!token)return null; const [body,sig]=token.split('.'); if(!body||!sig)return null; const expected=await hmac(env.SESSION_SECRET,body); if(expected!==sig)return null; const data=JSON.parse(new TextDecoder().decode(fromB64u(body))); if(!data.exp||Date.now()>data.exp)return null; return data; }catch{return null;} }
function sessionCookie(token,maxAge=2592000){ return `jhpa_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`; }
async function issue(env,role,full=false){ return signSession(env,{role,full,iat:Date.now(),exp:Date.now()+30*24*60*60*1000}); }
async function body(req){ try{return await req.json();}catch{return {};}}
async function login(req,env){ const x=await body(req); const id=String(x.id||'').trim(); const input=await sha256(x.password||''); let role=''; if(id===env.ADMIN_ID && await timingSafeHex(input,env.ADMIN_PASSWORD_SHA256)) role='admin'; else if(id===env.FRIEND_ID && await timingSafeHex(input,env.FRIEND_PASSWORD_SHA256)) role='friend'; else return json({ok:false,error:'INVALID_LOGIN'},401); const token=await issue(env,role,role==='admin'); return json({ok:true,role,full:role==='admin'},200,{'set-cookie':sessionCookie(token)}); }
async function unlock(req,env){ const s=await readSession(req,env); if(!s)return json({ok:false,error:'LOGIN_REQUIRED'},401); const x=await body(req); const input=await sha256(x.code||''); if(!(await timingSafeHex(input,env.FULL_ACCESS_CODE_SHA256))) return json({ok:false,error:'INVALID_ACCESS_CODE'},403); const token=await issue(env,s.role,true); return json({ok:true,role:s.role,full:true},200,{'set-cookie':sessionCookie(token)}); }
async function logout(){ return json({ok:true},200,{'set-cookie':'jhpa_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'}); }
async function session(req,env){ const s=await readSession(req,env); return json({ok:true,authenticated:!!s,role:s?.role||null,full:!!s?.full}); }
async function previewStart(req,env){ const u=new URL(req.url); const project=(u.searchParams.get('project')||'').replace(/[^a-z0-9-]/gi,'').slice(0,64); if(!project)return json({ok:false,error:'PROJECT_REQUIRED'},400); const token=await signSession(env,{preview:project,exp:Date.now()+30_000}); return json({ok:true,project,previewToken:token,expiresIn:30}); }
async function previewValid(req,env,project){ const token=new URL(req.url).searchParams.get('pt')||''; try{const [b,sig]=token.split('.'); if(!b||!sig||await hmac(env.SESSION_SECRET,b)!==sig)return false; const d=JSON.parse(new TextDecoder().decode(fromB64u(b))); return d.preview===project && Date.now()<d.exp;}catch{return false;} }
function cleanPath(pathname){ try{return decodeURIComponent(pathname).replace(/\.\./g,'');}catch{return pathname;} }
export default { async fetch(req,env){
  const url=new URL(req.url), p=cleanPath(url.pathname);
  if(p==='/api/login'&&req.method==='POST')return login(req,env);
  if(p==='/api/unlock'&&req.method==='POST')return unlock(req,env);
  if(p==='/api/logout'&&req.method==='POST')return logout();
  if(p==='/api/session')return session(req,env);
  if(p==='/api/preview/start'&&req.method==='POST')return previewStart(req,env);
  if(p.startsWith('/full/')){ const s=await readSession(req,env); if(!s?.full)return new Response('Full Access required',{status:403}); return env.ASSETS.fetch(req); }
  if(p.startsWith('/preview/')){ const project=p.split('/')[2]||''; const s=await readSession(req,env); if(s?.full)return env.ASSETS.fetch(req); if(!(await previewValid(req,env,project)))return new Response('Preview expired',{status:403}); return env.ASSETS.fetch(req); }
  return env.ASSETS.fetch(req);
}};