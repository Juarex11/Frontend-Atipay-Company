import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Loader2, 
  UploadCloud, 
  X, 
  FileText, 
  Trash2, 
  ExternalLink, 
  CheckCircle2,
  Info
} from 'lucide-react';
import DepositService from '@/services/depositService';
import type { PurchaseRequest } from '@/services/productService';

interface UploadProofProps {
  purchase: PurchaseRequest;
  onClose: () => void;
  onSuccess: () => void;
}

// Corrige rutas del backend local
const fixUrl = (url: string | null | undefined) => {
  if (!url) return undefined;

  if (url.includes('http://localhost/storage')) {
    return url.replace('http://localhost/', 'http://127.0.0.1:8000/');
  }

  if (url.startsWith('/storage')) {
    return `http://127.0.0.1:8000${url}`;
  }

  return url;
};

export const UploadProof: React.FC<UploadProofProps> = ({ purchase, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: 'Formato no válido',
        description: 'Por favor sube una imagen (JPG, PNG, WEBP).',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.size > 4 * 1024 * 1024) {
      toast({
        title: 'Archivo demasiado grande',
        description: 'La imagen no debe superar los 4MB.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const result = await DepositService.uploadDepositProof(Number(purchase.id), file);

      if (result.success) {
        toast({
          title: '¡Comprobante subido!',
          description: 'Tu comprobante fue enviado correctamente.',
          className: 'bg-green-50 border-green-200 text-green-800',
        });
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'No se pudo subir el archivo.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error de conexión',
        description: 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const proofUrl = fixUrl(purchase.deposit_proof_path);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Subir Comprobante</h2>
            <p className="text-xs text-gray-500">
              Solicitud <span className="font-mono bg-gray-200 px-1 rounded">#{purchase.id}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200/70"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Producto */}
          <div className="flex items-start gap-3 p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-full">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">Producto a pagar:</p>
              <p className="text-sm font-bold text-blue-700">{purchase.product?.name || purchase.description || 'Compra sin nombre'}</p>
            </div>
          </div>

          {/* Indicaciones */}
          <div className="p-3 text-xs bg-gray-50 rounded-lg border border-gray-200 flex gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            <div className="space-y-1">
              <p className="font-medium text-gray-700">Indicaciones para subir tu comprobante:</p>
              <ul className="list-disc pl-5 space-y-0.5 text-gray-600">
                <li>La imagen debe ser clara y legible.</li>
                <li>Debe verse el monto total enviado.</li>
                <li>Debe verse la fecha y código de operación.</li>
                <li>Tamaño máximo: <b>4MB</b>.</li>
                <li>Formatos aceptados: JPG, PNG, WEBP.</li>
              </ul>
            </div>
          </div>

          {/* Área de subir archivo */}
          {!file ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                ${isDragging ? 'bg-green-50 border-green-500 scale-[0.98]' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'}
              `}
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-6 h-6 text-green-600" />
              </div>

              <p className="font-medium text-gray-700">Haz clic o arrastra tu comprobante aquí</p>
              <p className="text-xs text-gray-500 mt-1">Solo imágenes de hasta 4MB</p>

              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />
            </div>
          ) : (
            <div className="relative border rounded-xl overflow-hidden shadow-md group">
              {preview && (
                <img src={preview} className="w-full h-56 object-cover" alt="Preview" />
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeFile}
                  className="rounded-full"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Quitar
                </Button>
              </div>

              <div className="absolute bottom-0 w-full bg-white/90 px-3 py-2 text-xs flex justify-between border-t">
                <span className="truncate max-w-[200px] font-medium">{file.name}</span>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          )}

          {/* Si ya tiene comprobante */}
          {proofUrl && !file && (
            <div className="border border-green-200 bg-green-50 p-3 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-800 font-medium">Comprobante existente</p>
                  <p className="text-xs text-green-600">Puedes reemplazarlo si deseas</p>
                </div>
              </div>

              <a 
                href={proofUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs bg-white px-3 py-1.5 rounded-md border shadow-sm hover:text-green-900 flex items-center gap-1"
              >
                Ver <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>Enviar comprobante</>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default UploadProof;
