import {Router} from 'express';
import {authMiddleware} from '../middlewares/auth';

import {
    deleteProject,
    deployProject,
    getProjectDetails,
    reDeployProject,
    startProject,
    stopProject,
    syncProjectEnv
} from '../controllers/deployment.controller';
import {getProjectsList} from '../controllers/project.controller';


const router = Router();


// router.use(authMiddleware);

// get all projects
router.get('/', authMiddleware, getProjectsList);

// deploy project
router.post('/deploy', authMiddleware, deployProject);

// redeploy project
router.post('/:project_id/redeploy', authMiddleware, reDeployProject);

// get project details
router.get('/:project_id', authMiddleware, getProjectDetails);

// delete project
router.delete('/:project_id', authMiddleware, deleteProject);


// stop project
router.post('/:project_id/stop', authMiddleware, stopProject);

// start project
router.post('/:project_id/start', authMiddleware, startProject);


router.post('/:project_id/sync', authMiddleware, syncProjectEnv);


export default router;
