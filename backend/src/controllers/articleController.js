const pool = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const PUBLIC_FIELDS = "id, title, slug, summary, body, seo_title, meta_description, author_name, author_role, author_organization, author_affiliation, published_at, updated_at";
const ADMIN_FIELDS = `${PUBLIC_FIELDS}, status, created_at, author_id`;
const text = (v) => typeof v === "string" ? v.trim() : "";
const slugify = (v) => text(v).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0,180);
function validate(input) {
 const article={title:text(input.title),slug:slugify(input.slug||input.title),summary:text(input.summary),body:text(input.body),seo_title:text(input.seo_title)||text(input.title),meta_description:text(input.meta_description)||text(input.summary),author_name:text(input.author_name),author_role:text(input.author_role),author_organization:text(input.author_organization),author_affiliation:text(input.author_affiliation)};
 const errors=[];
 if(!article.title||article.title.length>180) errors.push("Title is required (maximum 180 characters).");
 if(!article.slug) errors.push("A valid URL slug is required.");
 if(!article.summary||article.summary.length>320) errors.push("Summary is required (maximum 320 characters).");
 if(!article.body||article.body.length>50000) errors.push("Article body is required (maximum 50,000 characters).");
 if(article.seo_title.length>180) errors.push("SEO title must be at most 180 characters.");
 if(article.meta_description.length>320) errors.push("Meta description must be at most 320 characters.");
 if(article.author_name.length>180) errors.push("Author name must be at most 180 characters.");
 if(article.author_role.length>180) errors.push("Author role must be at most 180 characters.");
 if(article.author_organization.length>240) errors.push("Author organization must be at most 240 characters.");
 if(article.author_affiliation.length>240) errors.push("Author affiliation must be at most 240 characters.");
 return {article,errors};
}
const listPublished=asyncHandler(async(_req,res)=>{const q=await pool.query(`SELECT ${PUBLIC_FIELDS} FROM articles WHERE status='published' AND published_at IS NOT NULL ORDER BY published_at DESC`);res.json({success:true,articles:q.rows});});
const getPublished=asyncHandler(async(req,res)=>{const q=await pool.query(`SELECT ${PUBLIC_FIELDS} FROM articles WHERE slug=$1 AND status='published' AND published_at IS NOT NULL LIMIT 1`,[req.params.slug]);if(!q.rows.length)return res.status(404).json({success:false,error:"Article not found."});res.json({success:true,article:q.rows[0]});});
const listAdmin=asyncHandler(async(_req,res)=>{const q=await pool.query(`SELECT ${ADMIN_FIELDS} FROM articles ORDER BY updated_at DESC`);res.json({success:true,articles:q.rows});});
const getAdmin=asyncHandler(async(req,res)=>{const q=await pool.query(`SELECT ${ADMIN_FIELDS} FROM articles WHERE id=$1`,[req.params.id]);if(!q.rows.length)return res.status(404).json({success:false,error:"Article not found."});res.json({success:true,article:q.rows[0]});});
async function audit(client,req,action,a){await client.query("INSERT INTO admin_audit_logs (admin_user_id, action, details) VALUES ($1,$2,$3::jsonb)",[req.user.id,action,JSON.stringify({article_id:a.id,title:a.title,slug:a.slug,status:a.status})]);}
const create=asyncHandler(async(req,res)=>{const {article,errors}=validate(req.body||{});if(errors.length)return res.status(400).json({success:false,error:errors.join(" ")});const c=await pool.connect();try{await c.query("BEGIN");const q=await c.query(`INSERT INTO articles(title,slug,summary,body,seo_title,meta_description,author_name,author_role,author_organization,author_affiliation,status,author_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11) RETURNING ${ADMIN_FIELDS}`,[article.title,article.slug,article.summary,article.body,article.seo_title,article.meta_description,article.author_name,article.author_role,article.author_organization,article.author_affiliation,req.user.id]);await audit(c,req,"article_created_draft",q.rows[0]);await c.query("COMMIT");res.status(201).json({success:true,article:q.rows[0]});}catch(e){await c.query("ROLLBACK");if(e.code==="23505")return res.status(409).json({success:false,error:"That article slug is already in use."});throw e;}finally{c.release();}});
const update=asyncHandler(async(req,res)=>{const {article,errors}=validate(req.body||{});if(errors.length)return res.status(400).json({success:false,error:errors.join(" ")});const c=await pool.connect();try{await c.query("BEGIN");const q=await c.query(`UPDATE articles SET title=$1,slug=$2,summary=$3,body=$4,seo_title=$5,meta_description=$6,author_name=$7,author_role=$8,author_organization=$9,author_affiliation=$10,updated_at=NOW() WHERE id=$11 RETURNING ${ADMIN_FIELDS}`,[article.title,article.slug,article.summary,article.body,article.seo_title,article.meta_description,article.author_name,article.author_role,article.author_organization,article.author_affiliation,req.params.id]);if(!q.rows.length){await c.query("ROLLBACK");return res.status(404).json({success:false,error:"Article not found."});}await audit(c,req,"article_updated",q.rows[0]);await c.query("COMMIT");res.json({success:true,article:q.rows[0]});}catch(e){await c.query("ROLLBACK");if(e.code==="23505")return res.status(409).json({success:false,error:"That article slug is already in use."});throw e;}finally{c.release();}});
const setStatus=asyncHandler(async(req,res)=>{const status=req.body?.status;if(!["draft","published"].includes(status))return res.status(400).json({success:false,error:"Status must be draft or published."});const c=await pool.connect();try{await c.query("BEGIN");const q=await c.query(`UPDATE articles SET status=$1,published_at=CASE WHEN $1::varchar='published'::varchar THEN COALESCE(published_at,NOW()) ELSE NULL END,updated_at=NOW() WHERE id=$2 RETURNING ${ADMIN_FIELDS}`,[status,req.params.id]);if(!q.rows.length){await c.query("ROLLBACK");return res.status(404).json({success:false,error:"Article not found."});}await audit(c,req,status==="published"?"article_published":"article_unpublished",q.rows[0]);await c.query("COMMIT");res.json({success:true,article:q.rows[0]});}catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}});
const deleteDraft=asyncHandler(async(req,res)=>{
 const client=await pool.connect();
 try {
  await client.query("BEGIN");
  const found=await client.query(`SELECT ${ADMIN_FIELDS} FROM articles WHERE id=$1 FOR UPDATE`,[req.params.id]);
  if(!found.rows.length){
   await client.query("ROLLBACK");
   return res.status(404).json({success:false,error:"Article not found."});
  }
  const article=found.rows[0];
  if(article.status!=="draft"){
   await client.query("ROLLBACK");
   return res.status(409).json({success:false,error:"Only draft articles can be deleted. Unpublish the article first."});
  }
  const deleted=await client.query("DELETE FROM articles WHERE id=$1 AND status='draft' RETURNING id",[req.params.id]);
  if(!deleted.rows.length){
   await client.query("ROLLBACK");
   return res.status(409).json({success:false,error:"Only draft articles can be deleted."});
  }
  await audit(client,req,"article_deleted_draft",article);
  await client.query("COMMIT");
  res.json({success:true,message:"Draft deleted."});
 } catch(e) {
  await client.query("ROLLBACK");
  throw e;
 } finally {
  client.release();
 }
});
module.exports={listPublished,getPublished,listAdmin,getAdmin,create,update,setStatus,deleteDraft};
