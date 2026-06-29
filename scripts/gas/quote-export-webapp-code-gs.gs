var DESTINATION_FOLDER_ID = '1oUKD65onJYeZWqfoeTdWuEhzr-3TE216';

function doPost(e) {
  try {
    var payload = parsePayload_(e);
    verifySecret_(payload);

    var result = createQuoteSpreadsheet_(payload);
    return json_({
      ok: true,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
      fileName: result.fileName
    });
  } catch (error) {
    return json_({
      ok: false,
      error: error && error.message ? error.message : 'Failed to create quote spreadsheet.'
    });
  }
}

function doGet() {
  return json_({
    ok: true,
    service: 'quote-export-webapp'
  });
}

function parsePayload_(e) {
  var body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  var payload = JSON.parse(body);
  if (!payload || !isArray_(payload.selectedWorkItems)) {
    throw new Error('Invalid quote payload.');
  }
  return payload;
}

function verifySecret_(payload) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_SECRET');
  if (!expected) return;
  if (String(payload.apiSecret || '') !== expected) {
    throw new Error('Unauthorized.');
  }
}

function createQuoteSpreadsheet_(state) {
  var fileName = createFileName_(state.projectName || '');
  var spreadsheet = SpreadsheetApp.create(fileName);
  var file = DriveApp.getFileById(spreadsheet.getId());
  var folder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);

  folder.addFile(file);
  try {
    DriveApp.getRootFolder().removeFile(file);
  } catch (error) {
  }

  var sheet = spreadsheet.getSheets()[0];
  sheet.setName('見積書');

  var rows = buildRows_(state);
  var width = 8;
  var values = [];
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i].slice(0, width);
    while (row.length < width) row.push('');
    values.push(row);
  }

  sheet.clear();
  sheet.getRange(1, 1, values.length, width).setValues(values);
  formatSheet_(sheet, rows, width);

  return {
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    fileName: fileName
  };
}

function buildRows_(state) {
  var rows = [];
  rows.push(['見積書']);
  rows.push(['作成日', formatDateTime_(new Date())]);
  rows.push(['物件名', state.projectName || '']);
  rows.push(['宛名', state.customerName || '']);
  rows.push([]);

  var groups = groupItems_(state.selectedWorkItems);
  for (var i = 0; i < groups.length; i += 1) {
    var group = groups[i];
    if (!group.items.length) continue;

    rows.push(['■' + group.roomLabel]);
    rows.push(['名称', '数量', '単位', '単価', '金額', '原価', '業者', '備考']);

    for (var j = 0; j < group.items.length; j += 1) {
      var item = group.items[j];
      var qty = toNumber_(item.qty);
      var unitPrice = toNumber_(item.unitPrice);
      rows.push([
        itemName_(item),
        qty,
        item.unit || '',
        unitPrice,
        qty * unitPrice,
        optionalNumber_(item, ['cost', 'costPrice', 'genka']),
        optionalText_(item, ['vendor', 'contractor', 'gyosha']),
        optionalText_(item, ['note', 'notes', 'remark', 'remarks', 'memo'])
      ]);
    }

    rows.push([]);
  }

  rows.push(['合計金額', '', '', '', calculateTotal_(state.selectedWorkItems)]);
  return rows;
}

function groupItems_(items) {
  var groups = [];
  for (var i = 0; i < items.length; i += 1) {
    var item = items[i];
    var roomLabel = item.roomLabel || 'その他';
    var group = null;

    for (var j = 0; j < groups.length; j += 1) {
      if (groups[j].roomLabel === roomLabel) {
        group = groups[j];
        break;
      }
    }

    if (!group) {
      group = { roomLabel: roomLabel, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

function itemName_(item) {
  if (item.selectedOptionLabel) {
    return String(item.title || item.workItemId || '') + '（' + item.selectedOptionLabel + '）';
  }
  return String(item.title || item.workItemId || '');
}

function calculateTotal_(items) {
  var total = 0;
  for (var i = 0; i < items.length; i += 1) {
    total += toNumber_(items[i].qty) * toNumber_(items[i].unitPrice);
  }
  return total;
}

function optionalText_(item, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    var value = item[keys[i]];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
}

function optionalNumber_(item, keys) {
  var text = optionalText_(item, keys);
  var value = Number(text);
  return isFinite(value) ? value : '';
}

function toNumber_(value) {
  var numberValue = Number(value);
  return isFinite(numberValue) ? numberValue : 0;
}

function createFileName_(projectName) {
  var now = new Date();
  var stamp =
    now.getFullYear() +
    pad_(now.getMonth() + 1) +
    pad_(now.getDate()) +
    '_' +
    pad_(now.getHours()) +
    pad_(now.getMinutes());
  var safeProjectName = sanitizeFileNamePart_(projectName);
  return safeProjectName ? '見積書_' + safeProjectName + '_' + stamp : '見積書_' + stamp;
}

function sanitizeFileNamePart_(value) {
  var text = String(value || '').trim();
  text = text.replace(/[\\/:*?"<>|#%]/g, '_');
  text = text.replace(/\s+/g, '_');
  return text;
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
  return String(value).length < 2 ? '0' + value : String(value);
}

function formatSheet_(sheet, rows, width) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, width).setFontWeight('bold').setFontSize(14);
  sheet.getRange(1, 1, rows.length, width).setVerticalAlignment('middle');

  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    var rowNumber = i + 1;

    if (row[0] === '名称') {
      sheet.getRange(rowNumber, 1, 1, width).setFontWeight('bold').setBackground('#f3f4f6');
    }

    if (typeof row[0] === 'string' && row[0].indexOf('■') === 0) {
      sheet.getRange(rowNumber, 1, 1, width).setFontWeight('bold').setBackground('#e8eef9');
    }

    if (row[0] === '合計金額') {
      sheet.getRange(rowNumber, 1, 1, width).setFontWeight('bold');
      sheet.getRange(rowNumber, 5).setNumberFormat('#,##0');
    }
  }

  if (rows.length > 1) {
    sheet.getRange(1, 1, rows.length, width).setBorder(true, true, true, true, true, true);
    sheet.getRange(1, 4, rows.length, 3).setNumberFormat('#,##0');
  }

  sheet.autoResizeColumns(1, width);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function isArray_(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}
