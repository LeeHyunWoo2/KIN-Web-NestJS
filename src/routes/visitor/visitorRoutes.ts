import {Router} from 'express';
import {
  getVisitorListController,
  recordVisitorInfoController,
  trackVisitorActivityController
} from "../../controllers/visitor/visitorController";
import {injectAuthenticatedUser} from "../../middleware/auth/injectAuthenticatedUser";

const visitorRouter: Router = Router();

visitorRouter.get("/", injectAuthenticatedUser, getVisitorListController);

visitorRouter.post("/", recordVisitorInfoController);

visitorRouter.put("/", trackVisitorActivityController);

export {visitorRouter};