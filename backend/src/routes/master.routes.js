import express from 'express';
import { asyncRoute } from '../middleware/tenant.js';
import * as masterController from '../controllers/master.controller.js';

const router = express.Router();

// Public onboarding and authentication
router.get('/live', asyncRoute(masterController.getLive));
router.get('/health', asyncRoute(masterController.getHealth));
router.get('/public/companies', asyncRoute(masterController.getPublicCompanies));
router.post('/public/company-registrations', asyncRoute(masterController.postCompanyRegistrations));
router.post('/public/resolve-login', asyncRoute(masterController.resolveLogin));
router.post('/public/onboarding-status', asyncRoute(masterController.onboardingStatus));
router.post('/public/complete-registration', asyncRoute(masterController.completeRegistration));
router.post('/login', asyncRoute(masterController.postMasterLogin));

// Superadmin protected routes
router.get('/state', asyncRoute(masterController.getMasterState));
router.post('/companies', asyncRoute(masterController.createCompany));
router.post('/company-registrations/:id/approve', asyncRoute(masterController.approveRegistration));
router.post('/company-registrations/:id/reject', asyncRoute(masterController.rejectRegistration));
router.patch('/companies/:id/modules', asyncRoute(masterController.updateCompanyModules));
router.get('/ui-templates', asyncRoute((req, res) => masterController.templates.list(req, res)));
router.post('/companies/:id/template-allowance/reset', asyncRoute((req, res) => masterController.templates.resetAllowance(req, res)));
router.post('/template-requests/:id/review', asyncRoute((req, res) => masterController.templates.review(req, res)));
router.patch('/companies/:id/template', asyncRoute((req, res) => masterController.templates.assign(req, res)));
router.patch('/companies/:id/status', asyncRoute(masterController.updateCompanyStatus));
router.delete('/companies/:id', asyncRoute(masterController.deleteCompany));
router.patch('/saas-invoices/:id/status', asyncRoute(masterController.updateInvoiceStatus));
router.patch('/companies/:companyId/users/:userId/pin', asyncRoute(masterController.updateCompanyUserPin));
router.patch('/master-users/:userId/pin', asyncRoute(masterController.updateMasterUserPin));
router.get('/module-pricing', asyncRoute(masterController.getModulePricing));
router.patch('/module-pricing/:key', asyncRoute(masterController.updateModulePrice));
router.post('/reports', asyncRoute(masterController.postReport));
router.get('/master/activity', asyncRoute((req, res) => masterController.console_.activity(req, res)));
router.get('/master/health', asyncRoute((req, res) => masterController.console_.health(req, res)));
router.get('/master/appearance', asyncRoute((req, res) => masterController.console_.getAppearance(req, res)));
router.put('/master/appearance', asyncRoute((req, res) => masterController.console_.setAppearance(req, res)));

export default router;
