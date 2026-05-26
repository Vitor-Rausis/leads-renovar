import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  X,
  Cross,
  CalendarClock,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getTarefasCounts } from '../../api/tarefaApi';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/messages', icon: MessageSquare, label: 'Mensagens' },
  { to: '/agenda', icon: CalendarCheck, label: 'Agenda', badgeKey: 'vencidas' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
  { to: '/config/messages', icon: CalendarClock, label: 'Agendamentos' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export default function Sidebar({ open, onClose }) {
  const { logout, user } = useAuth();
  const [vencidas, setVencidas] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () =>
      getTarefasCounts()
        .then((res) => { if (active) setVencidas(res.data?.vencidas || 0); })
        .catch(() => {});
    load();
    // Atualiza o contador a cada 2 minutos
    const id = setInterval(load, 2 * 60 * 1000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-white flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <Cross className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Renovar</h1>
              <p className="text-xs text-white/60">Leads</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const badge = item.badgeKey === 'vencidas' ? vencidas : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-danger-600 text-white text-xs font-bold">
                    {badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-xs text-white/50 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-danger-600 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
