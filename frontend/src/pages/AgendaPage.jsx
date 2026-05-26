import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Pencil,
  AlertTriangle,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  listTarefas,
  updateTarefa,
  deleteTarefa,
  getTarefasCounts,
} from '../api/tarefaApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import TarefaModal from '../components/agenda/TarefaModal';
import toast from 'react-hot-toast';

const prioridadeStyles = {
  alta: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Alta' },
  media: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Média' },
  baixa: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Baixa' },
};

function formatVencimento(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isToday(d)) return `Hoje, ${format(d, 'HH:mm')}`;
  if (isTomorrow(d)) return `Amanhã, ${format(d, 'HH:mm')}`;
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export default function AgendaPage() {
  const navigate = useNavigate();
  const [tarefas, setTarefas] = useState([]);
  const [counts, setCounts] = useState({ pendente: 0, concluida: 0, vencidas: 0 });
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (filtroStatus) params.status = filtroStatus;
      if (filtroPrioridade) params.prioridade = filtroPrioridade;
      const [res, c] = await Promise.all([listTarefas(params), getTarefasCounts()]);
      setTarefas(res.data.data || []);
      setCounts(c.data);
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, filtroPrioridade]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleStatus = async (tarefa) => {
    const novoStatus = tarefa.status === 'concluida' ? 'pendente' : 'concluida';
    try {
      await updateTarefa(tarefa.id, { status: novoStatus });
      load();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDelete = async (tarefa) => {
    if (!window.confirm(`Excluir tarefa "${tarefa.titulo}"?`)) return;
    try {
      await deleteTarefa(tarefa.id);
      toast.success('Tarefa excluída');
      load();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const handleEdit = (tarefa) => {
    setEditing(tarefa);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tarefas, followups e lembretes
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4" />
          Nova tarefa
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFiltroStatus('pendente')}
          className={`text-left p-4 rounded-xl border transition-colors ${
            filtroStatus === 'pendente'
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" /> Pendentes
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{counts.pendente}</div>
        </button>

        <button
          onClick={() => setFiltroStatus('pendente')}
          className={`text-left p-4 rounded-xl border transition-colors ${
            counts.vencidas > 0
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4" /> Vencidas
          </div>
          <div className="text-2xl font-bold text-red-700 mt-1">{counts.vencidas}</div>
        </button>

        <button
          onClick={() => setFiltroStatus('concluida')}
          className={`text-left p-4 rounded-xl border transition-colors ${
            filtroStatus === 'concluida'
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4" /> Concluídas
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{counts.concluida}</div>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <Select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          options={[
            { value: '', label: 'Todos status' },
            { value: 'pendente', label: 'Pendentes' },
            { value: 'concluida', label: 'Concluídas' },
            { value: 'cancelada', label: 'Canceladas' },
          ]}
          className="w-44"
        />
        <Select
          value={filtroPrioridade}
          onChange={(e) => setFiltroPrioridade(e.target.value)}
          options={[
            { value: '', label: 'Todas prioridades' },
            { value: 'alta', label: 'Alta' },
            { value: 'media', label: 'Média' },
            { value: 'baixa', label: 'Baixa' },
          ]}
          className="w-44"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <Spinner />
      ) : tarefas.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="Nenhuma tarefa"
            description="Clique em 'Nova tarefa' para adicionar"
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {tarefas.map((t) => {
            const prio = prioridadeStyles[t.prioridade] || prioridadeStyles.media;
            const vencida =
              t.status === 'pendente' && isPast(new Date(t.data_vencimento));
            const concluida = t.status === 'concluida';

            return (
              <Card
                key={t.id}
                className={`p-4 transition-colors ${
                  vencida ? 'border-l-4 border-l-red-500' : ''
                } ${concluida ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className="flex-shrink-0 mt-0.5"
                    title={concluida ? 'Reabrir' : 'Marcar como concluída'}
                  >
                    {concluida ? (
                      <CheckCircle2 className="w-6 h-6 text-success-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-primary-500" />
                    )}
                  </button>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className={`text-sm font-medium ${
                          concluida ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {t.titulo}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(t)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {t.descricao && (
                      <p className="text-xs text-gray-500 mt-1">{t.descricao}</p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap mt-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${prio.bg} ${prio.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                        {prio.label}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 ${
                          vencida ? 'text-red-600 font-medium' : 'text-gray-500'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {formatVencimento(t.data_vencimento)}
                        {vencida && ' (atrasada)'}
                      </span>

                      {t.lead && (
                        <button
                          onClick={() => navigate(`/leads/${t.lead.id}`)}
                          className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          <UserIcon className="w-3 h-3" />
                          {t.lead.nome}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <TarefaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tarefa={editing}
        onSuccess={load}
      />
    </div>
  );
}
