const express = require('express');
const router = express.Router();
const tarefaController = require('../controllers/tarefaController');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', tarefaController.list);
router.get('/counts', tarefaController.counts);
router.get('/:id', tarefaController.getById);
router.post('/', tarefaController.create);
router.put('/:id', tarefaController.update);
router.delete('/:id', tarefaController.remove);

module.exports = router;
