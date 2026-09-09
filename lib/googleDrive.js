import crypto from 'crypto';
import DriveIntegration from '@/models/DriveIntegration';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

function clientId() {
  return process.env.GOOGLE_DRIVE_CLIENT_ID || '';
}
function clientSecret() {
  return process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
}
export function driveRedirectUri() {
  return process.env.GOOGLE_DRIVE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/google-drive/callback`;
}
export function driveConfigured() {
  return Boolean(clientId() && clientSecret());
}

export function createDriveOAuthState() {
  return crypto.randomBytes(24).toString('hex');
}

export function getDriveAuthorizationUrl(state) {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: driveRedirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: DRIVE_SCOPE,
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(code) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: driveRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Google authorization failed.');
  return data;
}

async function getAccessToken(integration) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      refresh_token: integration.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Unable to refresh Google Drive access.');
  return data.access_token;
}

export async function getDriveIntegration() {
  return DriveIntegration.findOne({ provider: 'google_drive' });
}

export async function revokeDriveConnection(refreshToken) {
  if (!refreshToken) return;
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: 'POST' });
  } catch (error) {
    console.warn('Google Drive token revoke warning:', error.message);
  }
}

async function driveFetch(path, options = {}) {
  const integration = await getDriveIntegration();
  if (!integration) throw new Error('Google Drive is not connected.');
  const accessToken = await getAccessToken(integration);
  const response = await fetch(`${DRIVE_API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, ...(options.headers || {}) },
  });
  if (!response.ok) {
    let message = `Google Drive request failed (${response.status}).`;
    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {}
    throw new Error(message);
  }
  return response;
}

async function driveJson(path, options = {}) {
  const response = await driveFetch(path, options);
  return response.json();
}

export async function getDriveUserInfo(accessToken) {
  const response = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) return {};
  return response.json();
}

export async function saveDriveConnection({ refreshToken, accessToken, adminId }) {
  let accountEmail = '';
  if (accessToken) accountEmail = (await getDriveUserInfo(accessToken)).email || '';
  const expectedEmail = (process.env.GOOGLE_DRIVE_ACCOUNT_EMAIL || 'pikturefactory@gmail.com').toLowerCase();
  if (accountEmail && accountEmail.toLowerCase() !== expectedEmail) {
    throw new Error(`Please connect the ${expectedEmail} Google account. You connected ${accountEmail}.`);
  }
  const update = {
    refreshToken,
    accountEmail,
    connectedBy: adminId || null,
    connectedAt: new Date(),
  };
  return DriveIntegration.findOneAndUpdate({ provider: 'google_drive' }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function findFolderByName(name, parentId = '') {
  const escaped = name.replace(/'/g, "\\'");
  let q = `name = '${escaped}' and mimeType = '${FOLDER_MIME}' and trashed = false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  else q += ` and 'root' in parents`;
  const data = await driveJson(`/files?q=${encodeURIComponent(q)}&pageSize=10&fields=files(id,name,webViewLink)`);
  return data.files?.[0] || null;
}

async function createFolder(name, parentId = '') {
  const body = { name, mimeType: FOLDER_MIME };
  if (parentId) body.parents = [parentId];
  return driveJson('/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function ensureFolder(name, parentId = '') {
  return (await findFolderByName(name, parentId)) || createFolder(name, parentId);
}

export async function ensurePiktureFactoryRoot() {
  const integration = await getDriveIntegration();
  if (!integration) throw new Error('Google Drive is not connected.');
  if (integration.rootFolderId) return integration;
  const root = await ensureFolder('Pikture Factory');
  integration.rootFolderId = root.id;
  integration.rootFolderUrl = `https://drive.google.com/drive/folders/${root.id}`;
  await integration.save();
  return integration;
}

function safeName(value) {
  return String(value || 'Project').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120);
}

export async function ensureProjectDriveFolders(project, vendorEmail = '') {
  const integration = await ensurePiktureFactoryRoot();
  const clientName = project.client?.name || 'Client';
  const date = project.eventDate ? new Date(project.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date TBD';
  const projectFolderName = safeName(`${date}_${project.vendor?.vendorCode || project.vendorCode || 'VENDOR'}_${clientName}`);
  const projectFolder = await ensureFolder(projectFolderName, integration.rootFolderId);
  const raw = await ensureFolder('RAW', projectFolder.id);
  const edited = await ensureFolder('EDITED', projectFolder.id);

  if (vendorEmail) {
    for (const folderId of [raw.id, edited.id]) {
      try {
        await driveFetch(`/files/${encodeURIComponent(folderId)}/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'user', role: 'writer', emailAddress: vendorEmail }),
        });
      } catch (error) {
        // Sharing can fail when a vendor email is not eligible for Google Drive sharing.
        // The folder is still usable by the connected admin and its link is preserved.
        console.warn('Drive folder sharing warning:', error.message);
      }
    }
  }

  return {
    projectFolderId: projectFolder.id,
    projectFolderUrl: `https://drive.google.com/drive/folders/${projectFolder.id}`,
    rawFolderId: raw.id,
    rawFolderUrl: `https://drive.google.com/drive/folders/${raw.id}`,
    editedFolderId: edited.id,
    editedFolderUrl: `https://drive.google.com/drive/folders/${edited.id}`,
    folderName: projectFolderName,
  };
}

export async function listFolderChildren(folderId) {
  const q = `'${folderId}' in parents and trashed = false`;
  let pageToken = '';
  const files = [];
  do {
    const params = new URLSearchParams({
      q,
      pageSize: '1000',
      orderBy: 'folder,name',
      fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,parents)',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const data = await driveJson(`/files?${params.toString()}`);
    files.push(...(data.files || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return files;
}

export async function listDriveTree(rootFolderId) {
  const output = [];
  async function walk(folderId, path = '') {
    const children = await listFolderChildren(folderId);
    for (const file of children) {
      const nextPath = path ? `${path}/${file.name}` : file.name;
      if (file.mimeType === FOLDER_MIME) {
        await walk(file.id, nextPath);
      } else {
        output.push({ ...file, folderPath: path });
      }
    }
  }
  await walk(rootFolderId);
  return output;
}

export async function downloadDriveFile(fileId) {
  return driveFetch(`/files/${encodeURIComponent(fileId)}?alt=media`);
}

export async function getDriveFile(fileId) {
  return driveJson(`/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,parents`);
}

export { FOLDER_MIME };
