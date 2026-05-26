const TarefaModel = require('../models/tarefaModel');

const PRIORIDADES = ['baixa', 'media', 'alta'];
const STATUS = ['pendente', 'concluida', 'cancelada'];

async function list(req, res, next) {
  try {
    const { page = 1, limit = 50, status, prioridade, lead_id, vencidas, search } = req.query;
    const result = await TarefaModel.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      prioridade,
      lead_id,
      vencidas,
      search,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const tarefa = await TarefaModel.findById(req.params.id);
    if (!tarefa) return res.status(404).json({ error: 'Tarefa nao encontrada' });
    res.json(tarefa);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { titulo, descricao, lead_id, responsavel_id, data_vencimento, prioridade } = req.body;
    if (!titulo || !titulo.trim()) return res.status(400).json({ error: 'titulo e obrigatorio' });
    if (!data_vencimento) return res.status(400).json({ error: 'data_vencimento e obrigatoria' });
    if (prioridade && !PRIORIDADES.includes(prioridade)) {
      return res.status(400).json({ error: 'prioridade invalida' });
    }

    const data = {
      titulo: titulo.trim(),
      descricao: descricao || null,
      lead_id: lead_id || null,
      responsavel_id: responsavel_id || req.user.id,
      data_vencimento,
      prioridade: prioridade || 'media',
      criado_por: req.user.id,
    };

    const tarefa = await TarefaModel.create(data);
    res.status(201).json(tarefa);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const updates = { ...req.body };
    if (updates.prioridade && !PRIORIDADES.includes(updates.prioridade)) {
      return res.status(400).json({ error: 'prioridade invalida' });
    }
    if (updates.status && !STATUS.includes(updates.status)) {
      return res.status(400).json({ error: 'status invalido' });
    }
    // Limpa campos nao editaveis
    delete updates.id;
    delete updates.criado_por;
    delete updates.criado_em;

    const tarefa = await TarefaModel.update(req.params.id, updates);
    res.json(tarefa);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await TarefaModel.delete(req.params.id);
    res.json({ message: 'Tarefa removida' });
  } catch (err) {
    next(err);
  }
}

async function counts(req, res, next) {
  try {
    const result = await TarefaModel.countByStatus();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, counts };
