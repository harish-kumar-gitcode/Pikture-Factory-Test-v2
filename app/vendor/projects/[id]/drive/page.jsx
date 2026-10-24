'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Cloud, ExternalLink, Folder, FolderPlus, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function VendorDrivePage() {
  const { id } = useParams();
  const showToast = useToast();
  const [project, setProject] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [projectRes, folderRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/drive/folders`),
      ]);
      const projectData = await projectRes.json();
      const folderData = await folderRes.json();
      if (!projectRes.ok) throw new Error(projectData.error || 'Project not found.');
      if (!folderRes.ok) throw new Error(folderData.error || 'Unable to load Drive folders.');
      setProject(projectData.project);
      setFolders(folderData.folders || []);
    } catch (error) {
      showToast(error.message || 'Unable to load Drive workspace.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function createFolder(parentId) {
    const name = window.prompt('Folder name');
    if (!name?.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${id}/drive/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to create folder.');
      await load();
      showToast(`Folder “${data.folder.name}” created.`, 'success');
    } catch (error) {
      showToast(error.message || 'Unable to create folder.', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !project) return <div className="text-secondary">Loading Drive workspace…</div>;

  return (
    <div className="space-y-6">
      <Link href={`/vendor/projects/${id}`} className="text-sm text-secondary inline-flex items-center gap-1.5"><ArrowLeft size={14} /> Back to project</Link>

      <section className="rounded-[26px] bg-primary text-white p-7 sm:p-9">
        <div className="flex items-end justify-between gap-5 flex-wrap">
          <div>
            <span className="text-gold text-[10px] uppercase tracking-[.2em] font-semibold">Vendor Drive workspace</span>
            <h1 className="font-head text-3xl sm:text-4xl mt-2">{project?.drive?.folderName || project?.projectCode}</h1>
            <p className="text-white/50 text-sm mt-2">Create folders and subfolders for RAW and EDITED delivery files.</p>
          </div>
          {project?.drive?.projectFolderUrl && <a href={project.drive.projectFolderUrl} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm"><ExternalLink size={13} /> Open in Google Drive</a>}
        </div>
      </section>

      <section className="panel">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
          <div>
            <h2 className="font-head text-xl">Folders</h2>
            <p className="text-xs text-secondary mt-1">Everything created here is a real Google Drive folder.</p>
          </div>
          <button onClick={load} className="btn btn-outline btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {project?.drive?.rawFolderId && <button onClick={() => createFolder(project.drive.rawFolderId)} disabled={busy} className="text-left rounded-2xl border border-border p-4 hover:border-gold"><Folder size={18} className="text-gold" /><b className="block text-sm mt-2">RAW</b><span className="text-xs text-secondary">Create a RAW subfolder</span></button>}
          {project?.drive?.editedFolderId && <button onClick={() => createFolder(project.drive.editedFolderId)} disabled={busy} className="text-left rounded-2xl border border-border p-4 hover:border-gold"><Folder size={18} className="text-gold" /><b className="block text-sm mt-2">EDITED</b><span className="text-xs text-secondary">Create an EDITED subfolder</span></button>}
          {folders.map((folder) => <button key={folder.id} onClick={() => createFolder(folder.id)} disabled={busy} className="text-left rounded-2xl border border-border p-4 hover:border-gold"><Folder size={18} className="text-gold" /><b className="block text-sm mt-2 truncate">{folder.name}</b><span className="text-xs text-secondary block truncate">{folder.path} · create subfolder</span></button>)}
        </div>

        <div className="mt-6 rounded-2xl bg-bglight p-4 text-xs text-secondary flex items-start gap-2">
          <Cloud size={15} className="text-gold shrink-0" />
          The assigned vendor has Editor access to the project workspace. RAW, EDITED and all subfolders inherit that permission, so the vendor can also create folders directly in Google Drive.
        </div>
      </section>
    </div>
  );
}
