import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, LogOut, Smartphone, QrCode } from 'lucide-react';
import {
  getWhatsAppStatus,
  getWhatsAppQR,
  disconnectWhatsApp,
  reconnectWhatsApp,
} from '../../api/whatsappApi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 5000;

export default function WhatsAppConnect() {
  const [status, setStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getWhatsAppStatus();
      setStatus(res.data);
      if (res.data.qrCode) {
        setQrCode(res.data.qrCode);
      } else if (res.data.connected) {
        setQrCode(null);
      }
    } catch (err) {
      console.error('Erro ao buscar status WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQR = useCallback(async () => {
    try {
      const res = await getWhatsAppQR();
      if (res.data.hasQR && res.data.qrCode) {
        setQrCode(res.data.qrCode);
      }
    } catch (err) {
      console.error('Erro ao buscar QR:', err);
    }
  }, []);

  const handleReconnect = async () => {
    setReconnecting(true);
    setQrCode(null);
    try {
      const res = await reconnectWhatsApp();
      if (res.data.qrCode) {
        setQrCode(res.data.qrCode);
        toast.success('QR Code gerado. Escaneie com seu WhatsApp.');
      } else {
        toast.success(res.data.message || 'Reconectando...');
      }
      await fetchStatus();
    } catch (err) {
      toast.error('Erro ao reconectar');
    } finally {
      setReconnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;
    try {
      await disconnectWhatsApp();
      toast.success('WhatsApp desconectado');
      setQrCode(null);
      await fetchStatus();
    } catch (err) {
      toast.error('Erro ao desconectar');
    }
  };

  // Polling do status
  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStatus]);

  // Busca QR se desconectado
  useEffect(() => {
    if (status && !status.connected && !qrCode) {
      fetchQR();
    }
  }, [status, qrCode, fetchQR]);

  const isConnected = status?.connected;

  return (
    <Card className="p-6">
      {/* Header de status */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : isConnected ? (
            <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-success-600" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-warning-50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-warning-600" />
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              WhatsApp {isConnected ? 'Conectado' : 'Desconectado'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isConnected
                ? 'Pronto para enviar mensagens'
                : 'Escaneie o QR Code abaixo para conectar'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleReconnect} loading={reconnecting}>
            <RefreshCw className="w-4 h-4" />
            {isConnected ? 'Reconectar' : 'Gerar novo QR'}
          </Button>
          {isConnected && (
            <Button size="sm" variant="danger" onClick={handleDisconnect}>
              <LogOut className="w-4 h-4" />
              Desconectar
            </Button>
          )}
        </div>
      </div>

      {/* QR Code (só se desconectado) */}
      {!isConnected && !loading && (
        <div className="border-t border-gray-100 pt-6">
          {qrCode ? (
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-2xl border-2 border-primary-100 shadow-sm">
                <img
                  src={qrCode}
                  alt="QR Code do WhatsApp"
                  className="w-64 h-64 sm:w-72 sm:h-72"
                />
              </div>

              <div className="text-center max-w-md space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary-700 font-medium">
                  <Smartphone className="w-5 h-5" />
                  Como conectar
                </div>
                <ol className="text-sm text-gray-600 text-left space-y-1.5 list-decimal list-inside">
                  <li>Abra o <b>WhatsApp</b> no seu celular</li>
                  <li>Toque em <b>⋮ Menu</b> ou <b>Configurações</b></li>
                  <li>Toque em <b>Aparelhos conectados</b></li>
                  <li>Toque em <b>Conectar um aparelho</b></li>
                  <li>Aponte a câmera para este QR Code</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  O QR expira em ~20s. Se sumir, clique em "Gerar novo QR".
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-12">
              <QrCode className="w-12 h-12 text-gray-300" />
              <Spinner size="md" />
              <p className="text-sm text-gray-500">Gerando QR Code...</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
