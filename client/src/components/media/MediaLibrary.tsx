"use client";
import * as React from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Upload, Grid, List, Search, Trash2, Eye,
  RefreshCw, X, ImageIcon, Film, File, Check
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

function resolveUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

interface MediaItem {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number;
  createdAt?: string;
}

interface MediaLibraryProps {
  onSelect?: (mediaIds: string[], medias?: MediaItem[]) => void;
  selectionMode?: "single" | "multiple" | "none";
}

export function MediaLibrary({ onSelect, selectionMode = "none" }: MediaLibraryProps) {
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [medias, setMedias] = React.useState<MediaItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploads, setUploads] = React.useState<{ id: string; name: string; progress: number; status: "uploading" | "success" | "error" }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchMedias = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.append("search", search);
      if (typeFilter) params.append("type", typeFilter);
      const res = await api.get(`/media?${params}`);
      const data = res.data?.data || res.data || [];
      setMedias(Array.isArray(data) ? data : []);
    } catch (e) {
      setMedias([]);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  React.useEffect(() => { fetchMedias(); }, [fetchMedias]);

  const toggleSelection = (media: MediaItem) => {
    if (selectionMode === "none") return;
    const newSel = new Set(selectedIds);
    if (selectionMode === "single") {
      newSel.clear();
      newSel.add(media.id);
    } else {
      newSel.has(media.id) ? newSel.delete(media.id) : newSel.add(media.id);
    }
    setSelectedIds(newSel);
    if (onSelect) {
      const selectedMedias = medias.filter(m => newSel.has(m.id));
      onSelect(Array.from(newSel), selectedMedias);
    }
  };

  const uploadFiles = async (files: File[]) => {
    const tasks = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      progress: 0,
      status: "uploading" as const,
    }));
    setUploads(prev => [...prev, ...tasks]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const task = tasks[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "biblioteca");

      try {
        await api.post("/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e: any) => {
            const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 50;
            setUploads(prev => prev.map(t => t.id === task.id ? { ...t, progress: pct } : t));
          },
        });
        setUploads(prev => prev.map(t => t.id === task.id ? { ...t, progress: 100, status: "success" } : t));
        setTimeout(() => {
          setUploads(prev => prev.filter(t => t.id !== task.id));
        }, 2000);
      } catch {
        setUploads(prev => prev.map(t => t.id === task.id ? { ...t, status: "error" } : t));
      }
    }
    await fetchMedias();
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Excluir esta mídia?")) return;
    try {
      await api.delete(`/media/${id}`);
      setMedias(prev => prev.filter(m => m.id !== id));
      setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao excluir");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) uploadFiles(files);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const isImage = (mime?: string) => mime?.startsWith("image/");
  const isVideo = (mime?: string) => mime?.startsWith("video/");

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 border-b border-border bg-card">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-input border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary-foreground text-foreground rounded-lg"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-input border border-border px-3 py-2 text-xs uppercase tracking-widest outline-none text-muted-foreground focus:border-primary-foreground rounded-lg"
          >
            <option value="">Todos</option>
            <option value="IMAGE">Imagens</option>
            <option value="VIDEO">Vídeos</option>
            <option value="PDF">PDFs</option>
          </select>
          <button onClick={fetchMedias} className="p-2 bg-input border border-border rounded-lg hover:bg-input/80 transition-colors text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-input border border-border p-1 rounded-lg">
            <button onClick={() => setView("grid")} className={cn("px-2 py-1 text-xs font-bold uppercase tracking-widest rounded-md transition-colors", view === "grid" ? "bg-primary-foreground text-primary" : "text-muted-foreground hover:text-white")}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={cn("px-2 py-1 text-xs font-bold uppercase tracking-widest rounded-md transition-colors", view === "list" ? "bg-primary-foreground text-primary" : "text-muted-foreground hover:text-white")}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <label className="bg-primary-foreground text-primary uppercase tracking-widest text-xs px-4 py-2 cursor-pointer inline-flex items-center gap-2 font-bold rounded-lg hover:opacity-90 transition-opacity">
            <Upload className="w-4 h-4" /> Enviar
            <input type="file" multiple accept="image/*,video/*,application/pdf" className="hidden"
              ref={fileInputRef}
              onChange={e => e.target.files && uploadFiles(Array.from(e.target.files))} />
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Drop Zone */}
        <div
          className={cn("flex-1 p-4 overflow-y-auto relative transition-colors", isDragging ? "bg-primary-foreground/10" : "")}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-50 border-2 border-dashed border-primary-foreground bg-background/90 flex items-center justify-center">
              <div className="text-center">
                <Upload className="w-12 h-12 text-primary-foreground mx-auto mb-3" />
                <p className="font-black uppercase tracking-widest text-primary-foreground">Solte para enviar</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-primary-foreground animate-spin" />
            </div>
          ) : medias.length === 0 && uploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
              <p className="font-black text-foreground text-lg mb-2">Nenhuma mídia ainda</p>
              <p className="text-muted-foreground text-sm mb-4">Arraste arquivos aqui ou clique em "Enviar"</p>
              <label className="bg-primary-foreground text-primary uppercase tracking-widest text-xs px-5 py-2.5 cursor-pointer inline-flex items-center gap-2 font-bold rounded-lg">
                <Upload className="w-4 h-4" /> Enviar Arquivos
                <input type="file" multiple className="hidden" onChange={e => e.target.files && uploadFiles(Array.from(e.target.files))} />
              </label>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
              {medias.map(media => {
                const isSelected = selectedIds.has(media.id);
                const thumb = resolveUrl(media.thumbnailUrl || media.url);
                return (
                  <div
                    key={media.id}
                    onClick={() => toggleSelection(media)}
                    className={cn(
                      "group border bg-background aspect-square relative cursor-pointer overflow-hidden transition-all rounded-xl",
                      isSelected ? "border-primary-foreground ring-2 ring-primary-foreground/30" : "border-border hover:border-primary-foreground/50"
                    )}
                  >
                    {isImage(media.mimeType) ? (
                      <img src={thumb} alt={media.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : isVideo(media.mimeType) ? (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <Film className="w-8 h-8 text-zinc-400" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <File className="w-8 h-8 text-zinc-400" />
                      </div>
                    )}

                    {selectionMode !== "none" && (
                      <div className={cn("absolute top-2 left-2 w-5 h-5 border rounded flex items-center justify-center transition-colors",
                        isSelected ? "bg-primary-foreground border-primary-foreground text-primary" : "bg-black/50 border-white/30 opacity-0 group-hover:opacity-100")}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                      <p className="text-[10px] text-white truncate flex-1">{media.name}</p>
                      <button
                        onClick={e => { e.stopPropagation(); deleteMedia(media.id); }}
                        className="text-red-400 hover:text-red-300 ml-1 shrink-0 transition-colors bg-black/50 p-1.5 rounded-full backdrop-blur-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-input/50 text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                  <tr>
                    {selectionMode !== "none" && <th className="px-4 py-3 w-10" />}
                    <th className="px-4 py-3">Arquivo</th>
                    <th className="px-4 py-3 hidden md:table-cell">Tipo</th>
                    <th className="px-4 py-3 hidden md:table-cell">Tamanho</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {medias.map(media => {
                    const isSelected = selectedIds.has(media.id);
                    const thumb = resolveUrl(media.thumbnailUrl || media.url);
                    return (
                      <tr key={media.id} onClick={() => toggleSelection(media)}
                        className={cn("border-b border-border transition-colors cursor-pointer", isSelected ? "bg-primary-foreground/10" : "hover:bg-input/30")}>
                        {selectionMode !== "none" && (
                          <td className="px-4 py-3">
                            <div className={cn("w-4 h-4 border rounded flex items-center justify-center",
                              isSelected ? "bg-primary-foreground border-primary-foreground text-primary" : "border-muted-foreground")}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-input border border-border overflow-hidden shrink-0">
                              {isImage(media.mimeType) ? (
                                <img src={thumb} alt={media.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {isVideo(media.mimeType) ? <Film className="w-4 h-4 text-zinc-400" /> : <File className="w-4 h-4 text-zinc-400" />}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-white truncate max-w-[120px] md:max-w-none">{media.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{media.mimeType}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{formatSize(media.size)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a href={resolveUrl(media.url)} target="_blank" rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-primary-foreground hover:text-white transition-colors">
                              <Eye className="w-4 h-4" />
                            </a>
                            <button onClick={e => { e.stopPropagation(); deleteMedia(media.id); }}
                              className="text-red-400 hover:text-red-300 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Queue */}
        {uploads.length > 0 && (
          <div className="border-t border-border bg-card p-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Enviando {uploads.length} arquivo(s)...</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uploads.map(task => (
                <div key={task.id} className="flex items-center gap-3">
                  <span className="text-xs text-white truncate flex-1">{task.name}</span>
                  <div className="w-24 bg-input h-1.5 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all",
                      task.status === "error" ? "bg-red-500" : task.status === "success" ? "bg-green-500" : "bg-primary-foreground")}
                      style={{ width: `${task.progress}%` }} />
                  </div>
                  {task.status === "success" && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                  {task.status === "error" && <X className="w-4 h-4 text-red-500 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selection Footer */}
        {selectionMode !== "none" && selectedIds.size > 0 && (
          <div className="border-t border-border bg-primary-foreground/10 p-3 flex items-center justify-between">
            <span className="text-xs font-bold text-primary-foreground uppercase tracking-widest">{selectedIds.size} selecionada(s)</span>
            {onSelect && (
              <button onClick={() => {
                const selectedMedias = medias.filter(m => selectedIds.has(m.id));
                onSelect(Array.from(selectedIds), selectedMedias);
              }} className="bg-primary-foreground text-primary text-xs px-4 py-1.5 rounded-lg font-bold uppercase tracking-widest">
                Confirmar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
