import { QuantumPreset } from '../types';

/**
 * Robust Client-Side Wrapper for Google Sheets and Google Drive APIs
 * utilizing the Firebase authenticated user access token.
 */

const SPREADSHEET_TITLE = 'Quantum Vocal Synth Flow Presets';
const BACKUP_MIME_TYPE = 'application/json';

// Fetch options helper
const getHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

/**
 * Search Google Drive for spreadsheets with the specific title.
 */
export async function findPresetsSpreadsheet(token: string): Promise<{ id: string; name: string } | null> {
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.spreadsheet' and name='${SPREADSHEET_TITLE}' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  try {
    const res = await fetch(url, { headers: getHeaders(token) });
    if (!res.ok) throw new Error(`Drive search failed: ${res.statusText}`);
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  } catch (err) {
    console.error('Error finding spreadsheet in Drive:', err);
    return null;
  }
}

/**
 * Create a new spreadsheet in the user's Google Drive.
 */
export async function createPresetsSpreadsheet(token: string): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const body = {
    properties: {
      title: SPREADSHEET_TITLE,
    },
    sheets: [
      {
        properties: {
          title: 'Presets',
        },
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to create spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Setup the header rows
  await populateSheetHeaders(token, spreadsheetId);

  return spreadsheetId;
}

/**
 * Write spreadsheet column headers.
 */
async function populateSheetHeaders(token: string, spreadsheetId: string) {
  const range = 'Presets!A1:I1';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
  
  const body = {
    range,
    majorDimension: 'ROWS',
    values: [
      [
        'Preset ID',
        'Name',
        'Category',
        'Tags (JSON)',
        'Description',
        'Qubits (JSON)',
        'Granular Params (JSON)',
        'Voice Params (JSON)',
        'Synced At'
      ]
    ]
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to populate spreadsheet headers: ${res.statusText}`);
  }
}

/**
 * Overwrite all user custom presets in specified spreadsheet.
 */
export async function syncPresetsToSpreadsheet(token: string, spreadsheetId: string, presets: QuantumPreset[]) {
  // First clear current cell range to prevent stale leftovers
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Presets!A2:I500:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: getHeaders(token),
  });

  // Collect values to write
  const rows = presets.map(p => [
    p.id,
    p.name,
    p.category || 'Atmospheric',
    JSON.stringify(p.tags || []),
    p.description || '',
    JSON.stringify(p.qubits || []),
    JSON.stringify(p.granularParams || {}),
    JSON.stringify(p.voiceParams || {}),
    new Date().toISOString()
  ]);

  if (rows.length === 0) return;

  const range = `Presets!A2:I${1 + rows.length}`;
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const body = {
    range,
    majorDimension: 'ROWS',
    values: rows
  };

  const res = await fetch(writeUrl, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to sync presets: ${res.statusText}`);
  }
}

/**
 * Read and reconstruct custom user presets from the Google Sheet rows.
 */
export async function importPresetsFromSpreadsheet(token: string, spreadsheetId: string): Promise<QuantumPreset[]> {
  const range = 'Presets!A2:I500';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) {
    throw new Error(`Failed to fetch spreadsheet rows: ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.values || data.values.length === 0) {
    return [];
  }

  const parsedPresets: QuantumPreset[] = [];

  for (const row of data.values) {
    try {
      if (!row[0] || !row[1]) continue; // Skip incomplete lines

      // Safe JSON parsing helpers
      const parseJSON = (str: string, fallback: any) => {
        try {
          return str ? JSON.parse(str) : fallback;
        } catch {
          return fallback;
        }
      };

      const preset: QuantumPreset = {
        id: row[0].startsWith('p-custom-') ? row[0] : `p-custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: row[1],
        category: row[2] || 'Atmospheric',
        tags: parseJSON(row[3], [row[2] || 'Atmospheric']),
        description: row[4] || '',
        qubits: parseJSON(row[5], []),
        granularParams: parseJSON(row[6], {
          grainSize: 150,
          overlap: 4,
          pitchRatio: 1.0,
          jitter: 20,
          spray: 25,
          feedback: 0.3
        }),
        voiceParams: parseJSON(row[7], {
          threshold: -45,
          gain: 1.0,
          pitchShift: 0
        })
      };

      parsedPresets.push(preset);
    } catch (err) {
      console.warn('Could not parse spreadsheet preset row:', row, err);
    }
  }

  return parsedPresets;
}

/**
 * Save preset pack (JSON) backup directly to google drive
 */
export async function savePresetPackToDrive(token: string, filename: string, presets: QuantumPreset[]): Promise<string> {
  // Check if file already exists first to overwrite it cleanly
  const query = encodeURIComponent(`name='${filename}' and mimeType='${BACKUP_MIME_TYPE}' and trashed=false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
  
  let fileId = '';
  try {
    const sRes = await fetch(searchUrl, { headers: getHeaders(token) });
    if (sRes.ok) {
      const sData = await sRes.json();
      if (sData.files && sData.files.length > 0) {
        fileId = sData.files[0].id;
      }
    }
  } catch (err) {
    console.warn('Backup duplicate search failed, creating fresh file.', err);
  }

  const fileMetadata = {
    name: filename,
    mimeType: BACKUP_MIME_TYPE,
  };

  const payload = JSON.stringify(presets, null, 2);

  if (fileId) {
    // Overwrite existing file content media
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const res = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': BACKUP_MIME_TYPE,
      },
      body: payload
    });

    if (!res.ok) {
      throw new Error(`Failed to update Drive backup content: ${res.statusText}`);
    }
    return fileId;
  } else {
    // Create new metadata node first
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(fileMetadata),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create Drive backup node: ${createRes.statusText}`);
    }

    const fileNode = await createRes.json();
    const newFileId = fileNode.id;

    // Upload content media
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': BACKUP_MIME_TYPE,
      },
      body: payload
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to write Drive backup content: ${uploadRes.statusText}`);
    }

    return newFileId;
  }
}

/**
 * List JSON files in Drive that might contain quantum presets pack
 */
export async function listPresetPacksInDrive(token: string): Promise<Array<{ id: string; name: string; createdTime: string }>> {
  const query = encodeURIComponent(`mimeType='${BACKUP_MIME_TYPE}' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&orderBy=name`;

  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) {
    throw new Error(`Failed to query preset backups: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Read content of specific JSON preset pack from Google drive
 */
export async function loadPresetPackFromDrive(token: string, fileId: string): Promise<QuantumPreset[]> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to read backup from Google Drive: ${res.statusText}`);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }
  throw new Error('Selected backup file is not a valid presets pack array.');
}
