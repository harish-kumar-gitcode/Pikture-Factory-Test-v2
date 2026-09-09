'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  Folder,
  FolderPlus,
  Images,
  RefreshCw,
  Square,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

function fmtBytes(value) {
  if (!value) return '';

  const units = ['B', 'KB', 'MB', 'GB'];
  let n = Number(value);
  let i = 0;

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }

  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

function AdminMediaGalleryPageInner() {
  const params = useSearchParams();
  const projectId = params.get('project') || '';

  const showToast = useToast();

  const [project, setProject] = useState(null);
  const [media, setMedia] = useState([]);
  const [album, setAlbum] = useState('All');
  const [selected, setSelected] = useState(new Set());
  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [folders, setFolders] = useState([]);
  const [folderBusy, setFolderBusy] = useState(false);

  async function load() {
    if (!projectId) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/media`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to load gallery.');
      }

      setProject(data.project);
      setMedia(data.media || []);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadFolders() {
    if (!projectId) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/drive/folders`);

      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch {
      // Keep gallery usable even if folder loading fails.
    }
  }

  useEffect(() => {
    load();
    loadFolders();
  }, [projectId]);

  async function syncDrive() {
    if (!projectId) return;

    setSyncing(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/media`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Drive sync failed.');
      }

      setProject(data.project);
      setMedia(data.media || []);

      await loadFolders();

      showToast(`${data.synced || 0} files synced.`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSyncing(false);
    }
  }

  async function createFolder(parentId) {
    const name = window.prompt('New folder name');

    if (!name?.trim() || folderBusy || !parentId) {
      return;
    }

    setFolderBusy(true);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/drive/folders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            parentId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to create folder.');
      }

      await loadFolders();

      showToast(
        `Folder “${data.folder.name}” created.`,
        'success'
      );
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setFolderBusy(false);
    }
  }

  async function toggleClient(item) {
    const next = !item.clientVisible;

    setMedia((prev) =>
      prev.map((m) =>
        m._id === item._id
          ? {
              ...m,
              clientVisible: next,
            }
          : m
      )
    );

    const res = await fetch(`/api/project-media/${item._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientVisible: next,
      }),
    });

    if (!res.ok) {
      setMedia((prev) =>
        prev.map((m) =>
          m._id === item._id
            ? {
                ...m,
                clientVisible: !next,
              }
            : m
        )
      );

      showToast('Unable to update client selection.', 'error');
      return;
    }

    if (viewer?._id === item._id) {
      setViewer((prev) =>
        prev
          ? {
              ...prev,
              clientVisible: next,
            }
          : prev
      );
    }
  }

  async function setAlbumForItem(item, value) {
    if (!value.trim()) return;

    const res = await fetch(`/api/project-media/${item._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        album: value.trim(),
      }),
    });

    if (res.ok) {
      setMedia((prev) =>
        prev.map((m) =>
          m._id === item._id
            ? {
                ...m,
                album: value.trim(),
              }
            : m
        )
      );
    }
  }

  const albums = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(
          media.map((m) => m.album || 'Unsorted')
        )
      ),
    ],
    [media]
  );

  const visible = media.filter(
    (m) =>
      album === 'All' ||
      (m.album || 'Unsorted') === album
  );

  const selectedCount = media.filter(
    (m) => m.clientVisible
  ).length;

  function openViewer(item) {
    setViewer(item);
  }

  function moveViewer(direction) {
    if (!viewer || !visible.length) return;

    const index = visible.findIndex(
      (m) => m._id === viewer._id
    );

    const next =
      visible[
        (index + direction + visible.length) %
          visible.length
      ];

    if (next) {
      setViewer(next);
    }
  }

  async function selectAll() {
    const items = visible.filter(
      (m) => !m.clientVisible
    );

    await Promise.all(
      items.map((item) => toggleClient(item))
    );
  }

  async function clearAll() {
    const items = visible.filter(
      (m) => m.clientVisible
    );

    await Promise.all(
      items.map((item) => toggleClient(item))
    );
  }

  function download(item) {
    const a = document.createElement('a');

    a.href = `/api/admin/project-media/${item._id}/download`;
    a.target = '_blank';
    a.rel = 'noreferrer';

    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (!projectId) {
    return (
      <div className="panel py-20 text-center text-secondary">
        No project selected.
      </div>
    );
  }

  if (loading && !project) {
    return (
      <div className="text-secondary">
        Loading gallery…
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-7">
        <div>
          <a
            href="/admin/media"
            className="text-xs text-secondary inline-flex items-center gap-1.5 mb-3"
          >
            <ArrowLeft size={13} />
            Media Library
          </a>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary text-gold flex items-center justify-center">
              <Images size={21} />
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-[.2em] text-gold font-semibold">
                Admin gallery
              </span>

              <h1 className="font-head text-3xl sm:text-4xl mt-1">
                {project?.eventType || 'Event'} ·{' '}
                {project?.client?.name || 'Client'}
              </h1>

              <p className="text-xs text-secondary mt-1">
                {project?.eventDate
                  ? new Date(
                      project.eventDate
                    ).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Date TBD'}{' '}
                · {project?.projectCode}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={syncDrive}
            disabled={syncing}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw
              size={14}
              className={
                syncing ? 'animate-spin' : ''
              }
            />

            {syncing ? 'Syncing…' : 'Sync Drive'}
          </button>

          {project?.drive?.projectFolderUrl && (
            <a
              href={project.drive.projectFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-sm"
            >
              <Cloud size={14} />
              Drive
            </a>
          )}
        </div>
      </div>

      {/* DRIVE FOLDERS */}
      <section className="panel mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="font-head text-xl">
              Drive folders
            </h2>

            <p className="text-xs text-secondary mt-1">
              Create folders and subfolders directly
              inside this project workspace.
            </p>
          </div>

          <button
            onClick={() =>
              createFolder(
                project?.drive?.projectFolderId
              )
            }
            disabled={
              folderBusy ||
              !project?.drive?.projectFolderId
            }
            className="btn btn-outline btn-sm"
          >
            <FolderPlus size={14} />
            New folder
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {project?.drive?.rawFolderId && (
            <button
              onClick={() =>
                createFolder(
                  project.drive.rawFolderId
                )
              }
              className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:border-gold"
            >
              <Folder
                size={13}
                className="inline mr-1.5 text-gold"
              />
              RAW{' '}
              <span className="text-secondary">
                · add subfolder
              </span>
            </button>
          )}

          {project?.drive?.editedFolderId && (
            <button
              onClick={() =>
                createFolder(
                  project.drive.editedFolderId
                )
              }
              className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:border-gold"
            >
              <Folder
                size={13}
                className="inline mr-1.5 text-gold"
              />
              EDITED{' '}
              <span className="text-secondary">
                · add subfolder
              </span>
            </button>
          )}

          {folders
            .filter(
              (f) =>
                f.name !== 'RAW' &&
                f.name !== 'EDITED'
            )
            .map((f) => (
              <button
                key={f.id}
                onClick={() => createFolder(f.id)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:border-gold"
              >
                <Folder
                  size={13}
                  className="inline mr-1.5 text-gold"
                />

                {f.path}

                <span className="text-secondary">
                  {' '}
                  · +
                </span>
              </button>
            ))}
        </div>
      </section>

      {/* ALBUM FILTERS */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {albums.map((a) => (
          <button
            key={a}
            onClick={() => setAlbum(a)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border ${
              album === a
                ? 'bg-primary text-white border-primary'
                : 'bg-white border-border text-secondary hover:border-gold'
            }`}
          >
            <Folder
              size={12}
              className="inline mr-1.5"
            />
            {a}
          </button>
        ))}
      </div>

      {/* SELECTION CONTROLS */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <p className="text-xs text-secondary">
          {visible.length} images in this view ·{' '}
          <b>{selectedCount} selected for client</b>
        </p>

        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="btn btn-outline btn-sm"
          >
            <CheckSquare size={13} />
            Select view
          </button>

          <button
            onClick={clearAll}
            className="btn btn-outline btn-sm"
          >
            Clear view
          </button>
        </div>
      </div>

      {/* GALLERY */}
      {loading ? (
        <div className="panel py-20 text-center text-secondary">
          Loading media…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map((item) => (
            <article
              key={item._id}
              className={`rounded-2xl overflow-hidden border bg-white ${
                item.clientVisible
                  ? 'border-gold shadow-soft'
                  : 'border-border'
              }`}
            >
              <button
                onClick={() => openViewer(item)}
                className="block w-full aspect-[4/3] bg-primary relative overflow-hidden group text-left"
              >
                <img
                  src={`/api/project-media/${item._id}/preview`}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />

                <span className="absolute inset-x-3 bottom-3 rounded-full bg-black/55 backdrop-blur text-white text-[10px] font-semibold px-3 py-2 opacity-0 group-hover:opacity-100 transition">
                  Open image
                </span>

                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleClient(item);
                  }}
                  className={`absolute top-3 right-3 rounded-full px-3 py-2 backdrop-blur text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer ${
                    item.clientVisible
                      ? 'bg-gold text-primary'
                      : 'bg-black/55 text-white'
                  }`}
                >
                  {item.clientVisible ? (
                    <Check size={12} />
                  ) : (
                    <Square size={12} />
                  )}

                  {item.clientVisible
                    ? 'Client'
                    : 'Select'}
                </span>
              </button>

              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-secondary">
                    {fmtBytes(item.size)}
                  </span>

                  <button
                    onClick={() => download(item)}
                    className="text-xs font-semibold flex items-center gap-1 hover:text-gold"
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <select
                    value={item.album || 'Unsorted'}
                    onChange={(e) =>
                      setAlbumForItem(
                        item,
                        e.target.value
                      )
                    }
                    className="input text-xs py-2"
                  >
                    <option value="Unsorted">
                      Unsorted
                    </option>

                    {albums
                      .filter(
                        (a) =>
                          a !== 'All' &&
                          a !== 'Unsorted'
                      )
                      .map((a) => (
                        <option
                          key={a}
                          value={a}
                        >
                          {a}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* IMAGE VIEWER */}
      {viewer && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewer(null)}
        >
          {/* CLOSE */}
          <button
            onClick={() => setViewer(null)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="Close image"
          >
            <X size={22} />
          </button>

          {/* PREVIOUS */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveViewer(-1);
            }}
            className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>

          {/* IMAGE + CONTROLS */}
          <div
            className="max-w-6xl max-h-[88vh] w-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`/api/project-media/${viewer._id}/preview`}
              alt=""
              className="max-h-[72vh] max-w-full object-contain rounded-xl"
            />

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() =>
                  toggleClient(viewer)
                }
                className={`btn btn-sm ${
                  viewer.clientVisible
                    ? 'btn-gold'
                    : 'btn-outline !border-white/25 !text-white'
                }`}
              >
                {viewer.clientVisible ? (
                  <Check size={14} />
                ) : (
                  <Square size={14} />
                )}

                {viewer.clientVisible
                  ? 'Selected for client'
                  : 'Select for client'}
              </button>

              <button
                onClick={() => download(viewer)}
                className="btn btn-outline btn-sm !border-white/25 !text-white"
              >
                <Download size={14} />
                Download
              </button>

              <span className="text-xs text-white/45">
                {fmtBytes(viewer.size)} ·{' '}
                {visible.findIndex(
                  (m) => m._id === viewer._id
                ) + 1}{' '}
                / {visible.length}
              </span>
            </div>
          </div>

          {/* NEXT */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveViewer(1);
            }}
            className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminMediaGalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="panel py-20 text-center text-secondary">
          Loading gallery…
        </div>
      }
    >
      <AdminMediaGalleryPageInner />
    </Suspense>
  );
}