import {Router} from 'express';
import {authMiddleware} from '../middlewares/auth';

import {
    deleteProject,
    deployProject,
    getProjectDetails,
    getProjectMetrics,
    reDeployProject,
    startProject,
    stopProject,
    streamDeploymentLogs,
    syncProjectEnv
} from '../controllers/deployment.controller';
import {getProjectsList} from '../controllers/project.controller';

const router = Router();


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


// sync environment variables
router.post('/:project_id/sync', authMiddleware, syncProjectEnv);

// get project metrics (CPU, memory, uptime)
router.get('/:project_id/metrics', authMiddleware, getProjectMetrics);

// stream deployment logs (SSE)
router.get('/:project_id/logs/stream', authMiddleware, streamDeploymentLogs);

export default router;