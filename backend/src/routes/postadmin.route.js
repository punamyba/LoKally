import express from "express";
import authMiddleware, { adminOnly } from "../middleware/auth.middleware.js";
import * as AdminPostCtrl from "../controllers/postAdmin.controller.js";

const router = express.Router();

// All routes require admin
router.use(authMiddleware, adminOnly);

router.get(   "/reports",              AdminPostCtrl.adminGetReports);
router.get(   "/",                     AdminPostCtrl.adminGetPosts);
router.get(   "/:id",                  AdminPostCtrl.adminGetPost);
router.patch( "/:id/hide",             AdminPostCtrl.adminHidePost);
router.patch( "/:id/unhide",           AdminPostCtrl.adminUnhidePost);
router.delete("/:id",                  AdminPostCtrl.adminDeletePost);
router.patch( "/:id/dismiss-reports",  AdminPostCtrl.adminDismissReports);

export default router;