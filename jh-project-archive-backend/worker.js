// Legacy custom password/session backend is intentionally disabled.
// JH PROJECT ARCHIVE member signup/login/email verification/password reset now uses
// Firebase Authentication (Spark) + Cloud Firestore security rules.
// Keep this Worker folder only for a future protected-build gateway if needed.
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export default {async fetch(req,env){
  const p=new URL(req.url).pathname;
  if(p.startsWith('/api/')) return json({ok:false,error:'LEGACY_AUTH_DISABLED_USE_FIREBASE'},410);
  if(p.startsWith('/full/')||p.startsWith('/preview/')) return new Response('Protected build gateway is not enabled in this zero-cost member-auth phase.',{status:403});
  return env.ASSETS.fetch(req);
}};
