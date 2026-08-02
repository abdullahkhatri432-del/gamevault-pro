"use strict";(()=>{var e={};e.id=146,e.ids=[146],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},1350:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>T,patchFetch:()=>E,requestAsyncStorage:()=>g,routeModule:()=>l,serverHooks:()=>d,staticGenerationAsyncStorage:()=>u});var a={};r.r(a),r.d(a,{GET:()=>p,POST:()=>m});var i=r(3278),o=r(5002),n=r(4877),c=r(1309),s=r(1877);async function p(){let{orders:e}=await (0,s._c)();return c.NextResponse.json(e)}async function m(e){let t=await e.json();if(!t.name||!t.email||!t.game)return c.NextResponse.json({message:"Please provide your name, email, and account selection."},{status:400});let r=await (0,s.fS)(t);return c.NextResponse.json(r,{status:201})}let l=new i.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/orders/route",pathname:"/api/orders",filename:"route",bundlePath:"app/api/orders/route"},resolvedPagePath:"C:\\Users\\abdul\\OneDrive\\Documents\\GitHub\\gamevault-pro\\app\\api\\orders\\route.js",nextConfigOutput:"",userland:a}),{requestAsyncStorage:g,staticGenerationAsyncStorage:u,serverHooks:d}=l,T="/api/orders/route";function E(){return(0,n.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:u})}},1877:(e,t,r)=>{r.d(t,{fS:()=>k,N_:()=>_,ry:()=>I,Ir:()=>w,tr:()=>h,_c:()=>y,nM:()=>v});let a=require("better-sqlite3");var i=r.n(a),o=r(5315),n=r.n(o),c=r(2048),s=r.n(c);let p=n().join(process.cwd(),"data"),m=n().join(p,"gamevault.db");s().existsSync(p)||s().mkdirSync(p,{recursive:!0});let l=new(i())(m);l.pragma("journal_mode = WAL"),l.exec(`
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
`);let g=new Set(l.prepare("PRAGMA table_info(products)").all().map(e=>e.name));for(let[e,t]of[["category",'TEXT NOT NULL DEFAULT "Game"'],["image_url","TEXT"],["description",'TEXT NOT NULL DEFAULT ""']])g.has(e)||l.exec(`ALTER TABLE products ADD COLUMN ${e} ${t}`);let u=l.prepare(`
  INSERT OR IGNORE INTO products (title, price, tag, rating, stock, category, image_url, description)
  VALUES (@title, @price, @tag, @rating, @stock, @category, @image_url, @description)
`),d=l.prepare(`
  INSERT OR IGNORE INTO reviews (name, comment, rating)
  VALUES (@name, @comment, @rating)
`);for(let e of[{title:"Valorant Prime",price:"$18",tag:"Legendary skin bundle",rating:"4.9",stock:"12 left",category:"FPS",image_url:"https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80",description:"Premium Valorant account with rank-ready upgrades and secure login details."},{title:"Fortnite OG",price:"$12",tag:"Battle pass included",rating:"4.8",stock:"8 left",category:"Battle Royale",image_url:"https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=80",description:"Fortnite account with exclusive cosmetics and a fully prepared battle pass."},{title:"EA FC Elite",price:"$24",tag:"Top-tier club account",rating:"4.7",stock:"5 left",category:"Sports",image_url:"https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=700&q=80",description:"Elite FC account with top-tier team chemistry and competitive-edge build."},{title:"PUBG Royale",price:"$20",tag:"Battle royale account",rating:"4.8",stock:"9 left",category:"Battle Royale",image_url:"https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80",description:"PUBG account designed for competitive play with premium unlocks and stable delivery."},{title:"Free Fire Diamond",price:"$9",tag:"Diamond + elite skins",rating:"4.6",stock:"15 left",category:"Mobile",image_url:"https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80",description:"Mobile-first account with diamonds, premium characters, and smooth activation support."},{title:"COD Modern Ops",price:"$16",tag:"Operator pack included",rating:"4.7",stock:"6 left",category:"Shooter",image_url:"https://images.unsplash.com/photo-1586182987320-4f376d39d787?auto=format&fit=crop&w=700&q=80",description:"Call of Duty account with operator progression, weapon skins, and secure handoff."}])u.run(e);for(let e of[{name:"Aarav",comment:"Fast delivery and super clean account setup.",rating:"5.0"},{name:"Lina",comment:"Loved the smooth checkout and modern design.",rating:"4.9"},{name:"Nico",comment:"The order process felt secure and simple.",rating:"4.8"}])d.run(e);let T=l.prepare(`
  SELECT id, title, price, tag, rating, stock, category, image_url as imageUrl, description
  FROM products
  ORDER BY id ASC
`),E=l.prepare("SELECT name, comment, rating FROM reviews ORDER BY id DESC"),N=l.prepare("SELECT id, name, email, game, note, created_at as createdAt FROM orders ORDER BY created_at DESC"),L=l.prepare(`
  INSERT INTO orders (id, name, email, game, note, created_at)
  VALUES (@id, @name, @email, @game, @note, @createdAt)
`),S=l.prepare(`
  INSERT OR IGNORE INTO reviews (name, comment, rating)
  VALUES (@name, @comment, @rating)
`),R=l.prepare(`
  INSERT INTO products (title, price, tag, rating, stock, category, image_url, description)
  VALUES (@title, @price, @tag, @rating, @stock, @category, @imageUrl, @description)
`),O=l.prepare(`
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
`),f=l.prepare("DELETE FROM products WHERE id = @id"),U=l.prepare("SELECT COUNT(*) as count FROM orders"),A=l.prepare("SELECT COALESCE(AVG(CAST(rating AS REAL)), 0) as average FROM reviews");async function y(){let e=T.all(),t=E.all(),r=N.all(),a=U.get().count,i=Number(A.get().average||0);return{featuredAccounts:e,reviews:t,orders:r,stats:{ordersCompleted:a+2400,repeatBuyers:98,averageRating:Number.isFinite(i)?i.toFixed(1):"0.0"}}}async function h(){return T.all()}async function I(e){let t={title:String(e.title||"").trim(),price:String(e.price||"").trim(),tag:String(e.tag||"").trim(),rating:String(e.rating||"4.8").trim(),stock:String(e.stock||"In stock").trim(),category:String(e.category||"Game").trim(),imageUrl:String(e.imageUrl||e.image_url||"").trim(),description:String(e.description||"").trim()};if(!t.title||!t.price||!t.tag)throw Error("Title, price, and tag are required to create a product.");return{id:Number(R.run(t).lastInsertRowid),...t}}async function v(e,t){let r={id:Number(e),title:String(t.title||"").trim(),price:String(t.price||"").trim(),tag:String(t.tag||"").trim(),rating:String(t.rating||"4.8").trim(),stock:String(t.stock||"In stock").trim(),category:String(t.category||"Game").trim(),imageUrl:String(t.imageUrl||t.image_url||"").trim(),description:String(t.description||"").trim()};if(!r.id||!r.title||!r.price||!r.tag)throw Error("A valid product ID, title, price, and tag are required.");return O.run(r),r}async function w(e){return f.run({id:Number(e)}),{deleted:!0,id:Number(e)}}async function k(e){let t={id:Date.now().toString(),name:e.name,email:e.email,game:e.game,note:e.note||"",createdAt:new Date().toISOString()};return L.run(t),t}async function _(e){let t={name:e.name,comment:e.comment,rating:e.rating};return S.run(t),t}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[787,833],()=>r(1350));module.exports=a})();