const DESTINATION_FOLDER_ID = '1oUKD65onJYeZWqfoeTdWuEhzr-3TE216';

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    verifySecret_(payload);

    const result = createQuoteSpreadsheet_(payload);
    return json_({
      ok: true,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
      fileName: result.fileName,
    });
  } catch (error) {
    console.error(error);
    return json_({
      ok: false,
      error: error && error.message ? error.message : 'Failed to create quote spreadsheet.',
    });
  }
}

function doGet() {
  return json_({
    ok: true,
    service: 'quote-export-webapp',
  });
}

function parsePayload_(e) {
  const body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  const payload = JSON.parse(body);
  if (!payload || !Array.isArray(payload.selectedWorkItems)) {
    throw new Error('Invalid quote payload.');
  }
  return payload;
}

function verifySecret_(payload) {
  const expected = PropertiesService.getScriptProperties().getProperty('API_SECRET');
  if (!expected) return;
  if (String(payload.apiSecret || '') !== expected) {
    throw new Error('Unauthorized.');
  }
}

function createQuoteSpreadsheet_(state) {
  const fileName = createFileName_(state.projectName || '');
  const spreadsheet = SpreadsheetApp.create(fileName);
  const file = DriveApp.getFileById(spreadsheet.getId());
  const folder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);

  folder.addFile(file);
  try {
    DriveApp.getRootFolder().removeFile(file);
  } catch (error) {
    // Shared drives or newer Drive behavior may not require root removal.
  }

  const sheet = spreadsheet.getSheets()[0];
  sheet.setName('見積書');
  const rows = buildRows_(state);
  const width = 8;
  const values = rows.map(function (row) {
    const next = row.slice(0, width);
    while (next.length < width) next.push('');
    return next;
  });

  sheet.clear();
  sheet.getRange(1, 1, values.length, width).setValues(values);
  formatSheet_(sheet, rows, width);

  return {
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    fileName: fileName,
  };
}

function buildRows_(state) {
  const rows = [];
  rows.push(['見積書']);
  rows.push(['作成日', formatDateTime_(new Date())]);
  rows.push(['物件名', state.projectName || '']);
  rows.push(['宛名', state.customerName || '']);
  rows.push([]);

  const groups = groupItems_(state.selectedWorkItems);
  groups.forEach(function (group) {
    if (!group.items.length) return;
    rows.push(['■' + group.roomLabel]);
    rows.push(['名称', '数量', '単位', '単価', '金額', '原価', '業者', '備考']);

    group.items.forEach(function (item) {
      const qty = toNumber_(item.qty);
      const unitPrice = toNumber_(item.unitPrice);
      rows.push([
        itemName_(item),
        qty,
        item.unit || '',
        unitPrice,
        qty * unitPrice,
        optionalNumber_(item, ['cost', 'costPrice', 'genka']),
        optionalText_(item, ['vendor', 'contractor', 'gyosha']),
        optionalText_(item, ['note', 'notes', 'remark', 'remarks', 'memo']),
      ]);
    });

    rows.push([]);
  });

  rows.push(['合計金額', '', '', '', calculateTotal_(state.selectedWorkItems)]);
  return rows;
}

function groupItems_(items) {
  return items.reduce(function (groups, item) {
    const roomLabel = item.roomLabel || 'その他';
    let group = groups.filter(function (entry) {
      return entry.roomLabel === roomLabel;
    })[0];

    if (!group) {
      group = { roomLabel: roomLabel, items: [] };
      groups.push(group);
    }

    group.items.push(item);
    return groups;
  }, []);
}

function itemName_(item) {
  if (item.selectedOptionLabel) {
    return item.title + '（' + item.selectedOptionLabel + '）';
  }
  return item.title || item.workItemId || '';
}

function calculateTotal_(items) {
  return items.reduce(function (sum, item) {
    return sum + toNumber_(item.qty) * toNumber_(item.unitPrice);
  }, 0);
}

function optionalText_(item, keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const value = item[keys[i]];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
}

function optionalNumber_(item, keys) {
  const text = optionalText_(item, keys);
  const value = Number(text);
  return Number.isFinite(value) ? value : '';
}

function toNumber_(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function createFileName_(projectName) {
  const now = new Date();
  const stamp =
    now.getFullYear() +
    pad_(now.getMonth() + 1) +
    pad_(now.getDate()) +
    '_' +
    pad_(now.getHours()) +
    pad_(now.getMinutes());
  const safeProjectName = sanitizeFileNamePart_(projectName);
  return safeProjectName ? '見積書_' + safeProjectName + '_' + stamp : '見積書_' + stamp;
}

function sanitizeFileNamePart_(value) {
  return String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|#%\u0000-\u001f]/g, '_')
    .replace(/\s+/g, '_');
}

function formatDateTime_(date) {
  return (
    date.getFullYear() +
    '/' +
    pad_(date.getMonth() + 1) +
    '/' +
    pad_(date.getDate()) +
    ' ' +
    pad_(date.getHours()) +
    ':' +
    pad_(date.getMinutes())
  );
}

function pad_(value) {
  return String(value).padStart(2, '0');
}

function formatSheet_(sheet, rows, width) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, width).setFontWeight('bold').setFontSize(14);
  sheet.getRange(1, 1, rows.length, width).setVerticalAlignment('middle');

  rows.forEach(function (row, index) {
    const rowNumber = index + 1;
    if (row[0] === '名称') {
      sheet
        .getRange(rowNumber, 1, 1, width)
        .setFontWeight('bold')
        .setBackground('#f3f4f6');
    }
    if (typeof row[0] === 'string' && row[0].indexOf('■') === 0) {
      sheet
        .getRange(rowNumber, 1, 1, width)
        .setFontWeight('bold')
        .setBackground('#e8eef9');
    }
    if (row[0] === '合計金額') {
      sheet.getRange(rowNumber, 1, 1, width).setFontWeight('bold');
      sheet.getRange(rowNumber, 5).setNumberFormat('#,##0');
    }
  });

  if (rows.length > 1) {
    sheet.getRange(1, 1, rows.length, width).setBorder(true, true, true, true, true, true);
    sheet.getRange(1, 4, rows.length, 3).setNumberFormat('#,##0');
  }

  sheet.autoResizeColumns(1, width);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
