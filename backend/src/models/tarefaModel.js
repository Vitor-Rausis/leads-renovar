const supabase = require('../config/supabase');

class TarefaModel {
  static async findAll({ page = 1, limit = 50, status, prioridade, lead_id, vencidas, search }) {
    let query = supabase
      .from('tarefas')
      .select('*, lead:leads(id, nome, whatsapp), responsavel:users!tarefas_responsavel_id_fkey(id, nome)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (prioridade) query = query.eq('prioridade', prioridade);
    if (lead_id) query = query.eq('lead_id', lead_id);
    if (search) query = query.ilike('titulo', `%${search}%`);

    if (vencidas === 'true') {
      query = query.eq('status', 'pendente').lt('data_vencimento', new Date().toISOString());
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('data_vencimento', { ascending: true })
      .range(from, to);

    if (error) throw error;
    return { data, total: count, page, limit };
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*, lead:leads(id, nome, whatsapp), responsavel:users!tarefas_responsavel_id_fkey(id, nome)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async create(data) {
    const { data: row, error } = await supabase
      .from('tarefas')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return row;
  }

  static async update(id, updates) {
    if (updates.status === 'concluida' && !updates.concluida_em) {
      updates.concluida_em = new Date().toISOString();
    }
    if (updates.status === 'pendente') {
      updates.concluida_em = null;
    }

    const { data, error } = await supabase
      .from('tarefas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('tarefas').delete().eq('id', id);
    if (error) throw error;
  }

  static async countByStatus() {
    const { data, error } = await supabase.from('tarefas').select('status');
    if (error) throw error;
    const counts = { pendente: 0, concluida: 0, cancelada: 0, vencidas: 0 };
    const now = new Date();
    data.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    // Vencidas: pendentes com data passada
    const { count: vencidas } = await supabase
      .from('tarefas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendente')
      .lt('data_vencimento', now.toISOString());
    counts.vencidas = vencidas || 0;
    return counts;
  }
}

module.exports = TarefaModel;
