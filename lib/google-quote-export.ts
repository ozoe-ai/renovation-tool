import { createSign } from "crypto";
import type { AppState, SelectedWorkItem } from "./types";
import { formatItemDisplayName, normalizeRoomLabel } from "./item-display";

const OUTPUT_FOLDER_ID = "1oUKD65onJYeZWqfoeTdWuEhzr-3TE216";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const QUOTE_PREFIX = "\u898b\u7a4d\u66f8";
const SECTION_PREFIX = "\u25a0";
const NAME_LABEL = "\u540d\u79f0";
const QTY_LABEL = "\u6570\u91cf";
const UNIT_LABEL = "\u5358\u4f4d";
const UNIT_PRICE_LABEL = "\u5358\u4fa1";
const AMOUNT_LABEL = "\u91d1\u984d";
const COST_LABEL = "\u539f\u4fa1";
const VENDOR_LABEL = "\u696d\u8005";
const NOTE_LABEL = "\u5099\u8003";
const PROJECT_LABEL = "\u7269\u4ef6\u540d";
const CUSTOMER_LABEL = "\u5b9b\u540d";
const CREATED_AT_LABEL = "\u4f5c\u6210\u65e5";
const TOTAL_LABEL = "\u5408\u8a08\u91d1\u984d";
const SHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet";

type GoogleTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type SheetValuesResponse = {
  values?: string[][];
};

type SpreadsheetMeta = {
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      gridProperties?: {
        rowCount?: number;
      };
    };
  }>;
  spreadsheetUrl?: string;
};

export type QuoteExportResult = {
  spreadsheetId: string;
  spreadsheetUrl: string;
  fileName: string;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getPrivateKey() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;
  return key?.replace(/\\n/g, "\n");
}

async function getAccessToken() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are required.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: `${DRIVE_SCOPE} ${SHEETS_SCOPE}`,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    })
  );
  const unsignedJwt = `${header}.${claimSet}`;
  const signature = createSign("RSA-SHA256").update(unsignedJwt).sign(privateKey);
  const assertion = `${unsignedJwt}.${base64Url(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google auth failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as GoogleTokenResponse;
  return data.access_token;
}

async function googleFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Google API failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as T;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function sanitizeFileNamePart(value: string) {
  return value.trim().replace(/[\\/:*?"<>|#%\u0000-\u001f]/g, "_").replace(/\s+/g, "_");
}

function createFileName(projectName: string) {
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const safeProjectName = sanitizeFileNamePart(projectName);
  return safeProjectName ? `${QUOTE_PREFIX}_${safeProjectName}_${stamp}` : `${QUOTE_PREFIX}_${stamp}`;
}

function formatDateTime(date: Date) {
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function calculateTotal(state: AppState) {
  return state.selectedWorkItems.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0);
}

function itemName(item: SelectedWorkItem) {
  return formatItemDisplayName(item);
}

function optionalText(item: SelectedWorkItem, keys: string[]) {
  const source = item as unknown as Record<string, unknown>;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
}

function optionalNumber(item: SelectedWorkItem, keys: string[]) {
  const value = optionalText(item, keys);
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : "";
}

function groupItems(items: SelectedWorkItem[]) {
  return items.reduce<Array<{ roomLabel: string; items: SelectedWorkItem[] }>>((groups, item) => {
    const roomLabel = normalizeRoomLabel(item.roomLabel);
    const existing = groups.find((group) => group.roomLabel === roomLabel);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ roomLabel, items: [item] });
    }
    return groups;
  }, []);
}

function buildDetailRows(state: AppState) {
  const rows: Array<Array<string | number>> = [];

  rows.push([QUOTE_PREFIX]);
  rows.push([CREATED_AT_LABEL, formatDateTime(new Date())]);
  rows.push([PROJECT_LABEL, state.projectName || ""]);
  rows.push([CUSTOMER_LABEL, state.customerName || ""]);
  rows.push([]);

  for (const group of groupItems(state.selectedWorkItems)) {
    if (group.items.length === 0) continue;
    rows.push([`${SECTION_PREFIX}${group.roomLabel}`]);
    rows.push([NAME_LABEL, QTY_LABEL, UNIT_LABEL, UNIT_PRICE_LABEL, AMOUNT_LABEL, COST_LABEL, VENDOR_LABEL, NOTE_LABEL]);
    for (const item of group.items) {
      const quantity = Number(item.qty) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      rows.push([
        itemName(item),
        quantity,
        item.unit || "",
        unitPrice,
        quantity * unitPrice,
        optionalNumber(item, ["cost", "costPrice", "genka"]),
        optionalText(item, ["vendor", "contractor", "gyosha"]),
        optionalText(item, ["note", "notes", "remark", "remarks", "memo"]),
      ]);
    }
    rows.push([]);
  }

  rows.push([TOTAL_LABEL, "", "", "", calculateTotal(state)]);
  return rows;
}

function findDetailStartRow(values: string[][]) {
  const headerIndex = values.findIndex((row) => {
    const c = row[2] ?? "";
    const d = row[3] ?? "";
    return c.includes(NAME_LABEL) && d.includes(QTY_LABEL);
  });
  if (headerIndex >= 0) return headerIndex + 2;

  return 1;
}

function findCell(values: string[][], needle: string) {
  for (let row = 0; row < values.length; row += 1) {
    for (let col = 0; col < values[row].length; col += 1) {
      if (String(values[row][col] ?? "").includes(needle)) {
        return { row: row + 1, col: col + 1 };
      }
    }
  }
  return null;
}

function a1(row: number, col: number) {
  let letters = "";
  let n = col;
  while (n > 0) {
    const r = (n - 1) % 26;
    letters = String.fromCharCode(65 + r) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return `${letters}${row}`;
}

function adjacentTarget(values: string[][], label: string, fallback: string) {
  const found = findCell(values, label);
  if (!found) return fallback;
  return a1(found.row, found.col + 1);
}

async function createSpreadsheetFile(token: string, fileName: string) {
  const url = "https://www.googleapis.com/drive/v3/files?fields=id,webViewLink,name";
  return googleFetch<{ id: string; webViewLink?: string; name: string }>(url, token, {
    method: "POST",
    body: JSON.stringify({
      name: fileName,
      mimeType: SHEET_MIME_TYPE,
      parents: [OUTPUT_FOLDER_ID],
    }),
  });
}

async function getSpreadsheetMeta(token: string, spreadsheetId: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetUrl,sheets(properties(sheetId,title,gridProperties(rowCount)))`;
  return googleFetch<SpreadsheetMeta>(url, token);
}

async function getSheetValues(token: string, spreadsheetId: string, sheetTitle: string) {
  const encodedTitle = encodeURIComponent(`'${sheetTitle}'!A1:I120`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedTitle}`;
  const data = await googleFetch<SheetValuesResponse>(url, token);
  return data.values ?? [];
}

async function batchUpdate(token: string, spreadsheetId: string, body: unknown) {
  return googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function valuesBatchUpdate(token: string, spreadsheetId: string, body: unknown) {
  return googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function exportQuoteToGoogleSheet(state: AppState): Promise<QuoteExportResult> {
  const token = await getAccessToken();
  const fileName = createFileName(state.projectName);
  const created = await createSpreadsheetFile(token, fileName);
  const spreadsheetId = created.id;
  const meta = await getSpreadsheetMeta(token, spreadsheetId);
  const firstSheet = meta.sheets[0]?.properties;
  if (!firstSheet) throw new Error("Created spreadsheet has no sheets.");

  const sheetTitle = firstSheet.title;
  const sheetId = firstSheet.sheetId;
  const detailRows = buildDetailRows(state);
  const requiredRows = detailRows.length + 5;
  const currentRows = firstSheet.gridProperties?.rowCount ?? 1000;

  if (requiredRows > currentRows) {
    await batchUpdate(token, spreadsheetId, {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: currentRows,
              endIndex: requiredRows,
            },
            inheritFromBefore: true,
          },
        },
      ],
    });
  }

  await valuesBatchUpdate(token, spreadsheetId, {
    valueInputOption: "USER_ENTERED",
    data: [
      {
        range: `'${sheetTitle}'!A1:H${detailRows.length}`,
        values: detailRows,
      },
    ],
  });

  const headerRows: number[] = [];
  const sectionRows: number[] = [];
  detailRows.forEach((row, index) => {
    if (row[0] === NAME_LABEL) headerRows.push(index);
    if (typeof row[0] === "string" && row[0].startsWith(SECTION_PREFIX)) sectionRows.push(index);
  });

  await batchUpdate(token, spreadsheetId, {
    requests: [
      {
        updateSheetProperties: {
          properties: {
            sheetId,
            title: QUOTE_PREFIX,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          fields: "title,gridProperties.frozenRowCount",
        },
      },
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: "COLUMNS",
            startIndex: 0,
            endIndex: 8,
          },
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, fontSize: 14 },
            },
          },
          fields: "userEnteredFormat.textFormat",
        },
      },
      ...sectionRows.map((rowIndex) => ({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.9, green: 0.93, blue: 0.98 },
              textFormat: { bold: true },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)",
        },
      })),
      ...headerRows.map((rowIndex) => ({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
              textFormat: { bold: true },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)",
        },
      })),
    ],
  });

  return {
    spreadsheetId,
    spreadsheetUrl: meta.spreadsheetUrl || created.webViewLink || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    fileName,
  };
}
