const express=require("express");
const {requireAuth,requireAdmin}=require("../middleware/auth");
const c=require("../controllers/articleController");
const router=express.Router();
// Static admin routes must be registered before /:slug.
router.get("/admin/list",requireAuth,requireAdmin,c.listAdmin);
router.get("/admin/:id",requireAuth,requireAdmin,c.getAdmin);
router.post("/admin",requireAuth,requireAdmin,c.create);
router.put("/admin/:id",requireAuth,requireAdmin,c.update);
router.patch("/admin/:id/status",requireAuth,requireAdmin,c.setStatus);
router.get("/",c.listPublished);
router.get("/:slug",c.getPublished);
module.exports=router;
