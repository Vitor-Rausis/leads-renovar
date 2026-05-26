import client from './client';

export const listTarefas = (params) => client.get('/tarefas', { params });
export const getTarefa = (id) => client.get(`/tarefas/${id}`);
export const createTarefa = (data) => client.post('/tarefas', data);
export const updateTarefa = (id, data) => client.put(`/tarefas/${id}`, data);
export const deleteTarefa = (id) => client.delete(`/tarefas/${id}`);
export const getTarefasCounts = () => client.get('/tarefas/counts');
