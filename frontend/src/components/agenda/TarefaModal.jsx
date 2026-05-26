import { useState, useEffect } from 'react';
import { CalendarClock, User as UserIcon, Flag, AlignLeft } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { createTarefa, updateTarefa } from '../../api/tarefaApi';
import { getLeads } from '../../api/leadApi';
import toast from 'react-hot-toast';

function toLocalDatetime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function TarefaModal({ isOpen, onClose, tarefa = null, onSuccess, defaultLeadId }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [leads, setLeads] = useState([]);
  const [saving, setSaving] = useState(false);

  const isEdit = !!tarefa;

  useEffect(() => {
    if (!isOpen) return;
    if (tarefa) {
      setTitulo(tarefa.titulo || '');
      setDescricao(tarefa.descricao || '');
      setLeadId(tarefa.lead_id || '');
      setDataVencimento(toLocalDatetime(tarefa.data_vencimento));
      setPrioridade(tarefa.prioridade || 'media');
    } else {
      setTitulo('');
      setDescricao('');
      setLeadId(defaultLeadId || '');
      const now = new Date(Date.now() + 60 * 60 * 1000); // default: daqui 1h
      setDataVencimento(toLocalDatetime(now.toISOString()));
      setPrioridade('media');
    }
  }, [isOpen, tarefa, defaultLeadId]);

  useEffect(() => {
    if (!isOpen) return;
    getLeads({ limit: 200 })
      .then((res) => setLeads(res.data.data || []))
      .catch(() => setLeads([]));
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return toast.error('Informe o título');
    if (!dataVencimento) return toast.error('Informe a data de vencimento');

    setSaving(true);
    try {
      const payload = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        lead_id: leadId || null,
        data_vencimento: new Date(dataVencimento).toISOString(),
        prioridade,
      };

      if (isEdit) {
        await updateTarefa(tarefa.id, payload);
        toast.success('Tarefa atualizada');
      } else {
        await createTarefa(payload);
        toast.success('Tarefa criada');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar tarefa' : 'Nova tarefa'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Ligar para Maria sobre proposta"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <AlignLeft className="w-4 h-4 inline mr-1" />
            Descrição (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            placeholder="Detalhes adicionais..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CalendarClock className="w-4 h-4 inline mr-1" />
              Data e hora
            </label>
            <input
              type="datetime-local"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              required
            />
          </div>

          <Select
            label={<><Flag className="w-4 h-4 inline mr-1" />Prioridade</>}
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            options={[
              { value: 'baixa', label: 'Baixa' },
              { value: 'media', label: 'Média' },
              { value: 'alta', label: 'Alta' },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <UserIcon className="w-4 h-4 inline mr-1" />
            Lead vinculado (opcional)
          </label>
          <select
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
          >
            <option value="">Sem vínculo</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome} - {l.whatsapp}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Salvar' : 'Criar tarefa'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
