"use strict";(()=>{var e={};e.id=186,e.ids=[186],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},4805:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>T,patchFetch:()=>E,requestAsyncStorage:()=>l,routeModule:()=>g,serverHooks:()=>d,staticGenerationAsyncStorage:()=>u});var a={};r.r(a),r.d(a,{GET:()=>p,POST:()=>m});var i=r(3278),n=r(5002),o=r(4877),c=r(1309),s=r(1877);async function p(){let{reviews:e}=await (0,s._c)();return c.NextResponse.json(e)}async function m(e){let t=await e.json();if(!t.name||!t.comment||!t.rating)return c.NextResponse.json({message:"Please share your name, rating, and review comment."},{status:400});let r=await (0,s.N_)(t);return c.NextResponse.json(r,{status:201})}let g=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/reviews/route",pathname:"/api/reviews",filename:"route",bundlePath:"app/api/reviews/route"},resolvedPagePath:"C:\\Users\\abdul\\OneDrive\\Documents\\GitHub\\gamevault-pro\\app\\api\\reviews\\route.js",nextConfigOutput:"",userland:a}),{requestAsyncStorage:l,staticGenerationAsyncStorage:u,serverHooks:d}=g,T="/api/reviews/route";function E(){return(0,o.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:u})}},1877:(e,t,r)=>{r.d(t,{fS:()=>k,N_:()=>_,ry:()=>v,Ir:()=>I,tr:()=>h,_c:()=>y,nM:()=>w});let a=require("better-sqlite3");var i=r.n(a),n=r(5315),o=r.n(n),c=r(2048),s=r.n(c);let p=o().join(process.cwd(),"data"),m=o().join(p,"gamevault.db");s().existsSync(p)||s().mkdirSync(p,{recursive:!0});let g=new(i())(m);g.pragma("journal_mode = WAL"),g.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    price TEXT NOT NULL,
    tag TEXT NOT NULL,
    rating TEXT NOT NULL,
    stock TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Game',
    image_url TEXT,
    description TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    comment TEXT NOT NULL,
    rating TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS reviews_unique_seed
  ON reviews (name, comment, rating);

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    game TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);let l=new Set(g.prepare("PRAGMA table_info(products)").all().map(e=>e.name));for(let[e,t]of[["category",'TEXT NOT NULL DEFAULT "Game"'],["image_url","TEXT"],["description",'TEXT NOT NULL DEFAULT ""']])l.has(e)||g.exec(`ALTER TABLE products ADD COLUMN ${e} ${t}`);let u=g.prepare(`
  INSERT OR IGNORE INTO products (title, price, tag, rating, stock, category, image_url, description)
  VALUES (@title, @price, @tag, @rating, @stock, @category, @image_url, @description)
`),d=g.prepare(`
  INSERT OR IGNORE INTO reviews (name, comment, rating)
  VALUES (@name, @comment, @rating)
`);for(let e of[{title:"Valorant Prime",price:"$18",tag:"Legendary skin bundle",rating:"4.9",stock:"12 left",category:"FPS",image_url:"https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80",description:"Premium Valorant account with rank-ready upgrades and secure login details."},{title:"Fortnite OG",price:"$12",tag:"Battle pass included",rating:"4.8",stock:"8 left",category:"Battle Royale",image_url:"https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=80",description:"Fortnite account with exclusive cosmetics and a fully prepared battle pass."},{title:"EA FC Elite",price:"$24",tag:"Top-tier club account",rating:"4.7",stock:"5 left",category:"Sports",image_url:"https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=700&q=80",description:"Elite FC account with top-tier team chemistry and competitive-edge build."},{title:"PUBG Royale",price:"$20",tag:"Battle royale account",rating:"4.8",stock:"9 left",category:"Battle Royale",image_url:"https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80",description:"PUBG account designed for competitive play with premium unlocks and stable delivery."},{title:"Free Fire Diamond",price:"$9",tag:"Diamond + elite skins",rating:"4.6",stock:"15 left",category:"Mobile",image_url:"https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80",description:"Mobile-first account with diamonds, premium characters, and smooth activation support."},{title:"COD Modern Ops",price:"$16",tag:"Operator pack included",rating:"4.7",stock:"6 left",category:"Shooter",image_url:"https://images.unsplash.com/photo-1586182987320-4f376d39d787?auto=format&fit=crop&w=700&q=80",description:"Call of Duty account with operator progression, weapon skins, and secure handoff."}])u.run(e);for(let e of[{name:"Aarav",comment:"Fast delivery and super clean account setup.",rating:"5.0"},{name:"Lina",comment:"Loved the smooth checkout and modern design.",rating:"4.9"},{name:"Nico",comment:"The order process felt secure and simple.",rating:"4.8"}])d.run(e);let T=g.prepare(`
  SELECT id, title, price, tag, rating, stock, category, image_url as imageUrl, description
  FROM products
  ORDER BY id ASC
`),E=g.prepare("SELECT name, comment, rating FROM reviews ORDER BY id DESC"),N=g.prepare("SELECT id, name, email, game, note, created_at as createdAt FROM orders ORDER BY created_at DESC"),L=g.prepare(`
  INSERT INTO orders (id, name, email, game, note, created_at)
  VALUES (@id, @name, @email, @game, @note, @createdAt)
`),S=g.prepare(`
  INSERT OR IGNORE INTO reviews (name, comment, rating)
  VALUES (@name, @comment, @rating)
`),R=g.prepare(`
  INSERT INTO products (title, price, tag, rating, stock, category, image_url, description)
  VALUES (@title, @price, @tag, @rating, @stock, @category, @imageUrl, @description)
`),O=g.prepare(`
  UPDATE products
  SET title = @title,
      price = @price,
      tag = @tag,
      rating = @rating,
      stock = @stock,
      category = @category,
      image_url = @imageUrl,
      description = @description
  WHERE id = @id
`),f=g.prepare("DELETE FROM products WHERE id = @id"),U=g.prepare("SELECT COUNT(*) as count FROM orders"),A=g.prepare("SELECT COALESCE(AVG(CAST(rating AS REAL)), 0) as average FROM reviews");async function y(){let e=T.all(),t=E.all(),r=N.all(),a=U.get().count,i=Number(A.get().average||0);return{featuredAccounts:e,reviews:t,orders:r,stats:{ordersCompleted:a+2400,repeatBuyers:98,averageRating:Number.isFinite(i)?i.toFixed(1):"0.0"}}}async function h(){return T.all()}async function v(e){let t={title:String(e.title||"").trim(),price:String(e.price||"").trim(),tag:String(e.tag||"").trim(),rating:String(e.rating||"4.8").trim(),stock:String(e.stock||"In stock").trim(),category:String(e.category||"Game").trim(),imageUrl:String(e.imageUrl||e.image_url||"").trim(),description:String(e.description||"").trim()};if(!t.title||!t.price||!t.tag)throw Error("Title, price, and tag are required to create a product.");return{id:Number(R.run(t).lastInsertRowid),...t}}async function w(e,t){let r={id:Number(e),title:String(t.title||"").trim(),price:String(t.price||"").trim(),tag:String(t.tag||"").trim(),rating:String(t.rating||"4.8").trim(),stock:String(t.stock||"In stock").trim(),category:String(t.category||"Game").trim(),imageUrl:String(t.imageUrl||t.image_url||"").trim(),description:String(t.description||"").trim()};if(!r.id||!r.title||!r.price||!r.tag)throw Error("A valid product ID, title, price, and tag are required.");return O.run(r),r}async function I(e){return f.run({id:Number(e)}),{deleted:!0,id:Number(e)}}async function k(e){let t={id:Date.now().toString(),name:e.name,email:e.email,game:e.game,note:e.note||"",createdAt:new Date().toISOString()};return L.run(t),t}async function _(e){let t={name:e.name,comment:e.comment,rating:e.rating};return S.run(t),t}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[787,833],()=>r(4805));module.exports=a})();