var DESTINATION_FOLDER_ID = '1oUKD65onJYeZWqfoeTdWuEhzr-3TE216';

function doPost(e) {
  var response;
  try {
    var payload = parsePayload_(e);
    verifySecret_(payload);
    var result = createQuoteSpreadsheet_(payload);
    response = {};
    response.ok = true;
    response.spreadsheetId = result.spreadsheetId;
    response.spreadsheetUrl = result.spreadsheetUrl;
    response.fileName = result.fileName;
    return json_(response);
  } catch (err) {
    response = {};
    response.ok = false;
    response.error = err && err.message ? err.message : 'Failed to create quote spreadsheet.';
    return json_(response);
  }
}

function doGet() {
  var response = {};
  response.ok = true;
  response.service = 'quote-export-webapp';
  return json_(response);
}

function parsePayload_(e) {
  var body = '{}';
  var payload;
  if (e && e.postData && e.postData.contents) {
    body = e.postData.contents;
  }
  payload = JSON.parse(body);
  if (!payload || !isArray_(payload.selectedWorkItems)) {
    throw new Error('Invalid quote payload.');
  }
  return payload;
}

function verifySecret_(payload) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_SECRET');
  if (!expected) {
    return;
  }
  if (String(payload.apiSecret || '') !== expected) {
    throw new Error('Unauthorized.');
  }
}

function createQuoteSpreadsheet_(state) {
  var fileName = createFileName_(state.projectName || '');
  var spreadsheet = SpreadsheetApp.create(fileName);
  var file = DriveApp.getFileById(spreadsheet.getId());
  var folder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);
  var sheet;
  var rows;
  var width;
  var values;
  folder.addFile(file);
  try {
    DriveApp.getRootFolder().removeFile(file);
  } catch (err) {
  }
  sheet = spreadsheet.getSheets()[0];
  sheet.setName('\u898b\u7a4d\u66f8');
  rows = buildRows_(state);
  width = 8;
  values = normalizeRows_(rows, width);
  sheet.clear();
  sheet.getRange(1, 1, values.length, width).setValues(values);
  formatSheet_(sheet, rows, width);
  return makeResult_(spreadsheet, fileName);
}

function makeResult_(spreadsheet, fileName) {
  var result = {};
  result.spreadsheetId = spreadsheet.getId();
  result.spreadsheetUrl = spreadsheet.getUrl();
  result.fileName = fileName;
  return result;
}

function normalizeRows_(rows, width) {
  var values = [];
  var i;
  var j;
  var row;
  for (i = 0; i < rows.length; i = i + 1) {
    row = [];
    for (j = 0; j < width; j = j + 1) {
      row.push(rows[i][j] === undefined ? '' : rows[i][j]);
    }
    values.push(row);
  }
  return values;
}

function buildRows_(state) {
  var rows = [];
  var groups;
  var i;
  var j;
  var group;
  var item;
  var qty;
  var unitPrice;
  rows.push(['\u898b\u7a4d\u66f8']);
  rows.push(['\u4f5c\u6210\u65e5', formatDateTime_(new Date())]);
  rows.push(['\u500b\u4eba\u540d\u30fb\u4f1a\u793e\u540d', state.customerName || '']);
  rows.push(['\u7269\u4ef6\u540d\uff1a' + (state.projectName || '')]);
  rows.push([]);
  groups = groupItems_(state.selectedWorkItems);
  for (i = 0; i < groups.length; i = i + 1) {
    group = groups[i];
    if (!group.items.length) {
      continue;
    }
    rows.push(['\u25a0' + group.roomLabel]);
    rows.push(['\u540d\u79f0', '\u6570\u91cf', '\u5358\u4f4d', '\u5358\u4fa1', '\u91d1\u984d', '\u539f\u4fa1', '\u696d\u8005', '\u5099\u8003']);
    for (j = 0; j < group.items.length; j = j + 1) {
      item = group.items[j];
      qty = toNumber_(item.qty);
      unitPrice = toNumber_(item.unitPrice);
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
  rows.push(['\u5408\u8a08\u91d1\u984d', '', '', '', calculateTotal_(state.selectedWorkItems)]);
  return rows;
}

function groupItems_(items) {
  var groups = [];
  var i;
  var j;
  var item;
  var roomLabel;
  var group;
  for (i = 0; i < items.length; i = i + 1) {
    item = items[i];
    roomLabel = item.roomLabel || '\u305d\u306e\u4ed6';
    group = null;
    for (j = 0; j < groups.length; j = j + 1) {
      if (groups[j].roomLabel === roomLabel) {
        group = groups[j];
        break;
      }
    }
    if (!group) {
      group = {};
      group.roomLabel = roomLabel;
      group.items = [];
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

function itemName_(item) {
  var title = String(item.title || item.workItemId || '');
  if (item.selectedOptionLabel) {
    return title + '\uff08' + item.selectedOptionLabel + '\uff09';
  }
  return title;
}

function calculateTotal_(items) {
  var total = 0;
  var i;
  for (i = 0; i < items.length; i = i + 1) {
    total = total + toNumber_(items[i].qty) * toNumber_(items[i].unitPrice);
  }
  return total;
}

function optionalText_(item, keys) {
  var i;
  var value;
  for (i = 0; i < keys.length; i = i + 1) {
    value = item[keys[i]];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
}

function optionalNumber_(item, keys) {
  var text = optionalText_(item, keys);
  var value = Number(text);
  if (isFinite(value)) {
    return value;
  }
  return '';
}

function toNumber_(value) {
  var numberValue = Number(value);
  if (isFinite(numberValue)) {
    return numberValue;
  }
  return 0;
}

function createFileName_(projectName) {
  var now = new Date();
  var stamp = '';
  var safeProjectName;
  stamp = stamp + now.getFullYear();
  stamp = stamp + pad_(now.getMonth() + 1);
  stamp = stamp + pad_(now.getDate());
  stamp = stamp + '_';
  stamp = stamp + pad_(now.getHours());
  stamp = stamp + pad_(now.getMinutes());
  safeProjectName = sanitizeFileNamePart_(projectName);
  if (safeProjectName) {
    return '\u898b\u7a4d\u66f8_' + safeProjectName + '_' + stamp;
  }
  return '\u898b\u7a4d\u66f8_' + stamp;
}

function sanitizeFileNamePart_(value) {
  var text = String(value || '').trim();
  text = text.replace(/[\\/:*?"<>|#%]/g, '_');
  text = text.replace(/\s+/g, '_');
  return text;
}

function formatDateTime_(date) {
  var text = '';
  text = text + date.getFullYear();
  text = text + '/';
  text = text + pad_(date.getMonth() + 1);
  text = text + '/';
  text = text + pad_(date.getDate());
  text = text + ' ';
  text = text + pad_(date.getHours());
  text = text + ':';
  text = text + pad_(date.getMinutes());
  return text;
}

function pad_(value) {
  var text = String(value);
  if (text.length < 2) {
    return '0' + text;
  }
  return text;
}

function formatSheet_(sheet, rows, width) {
  var i;
  var row;
  var rowNumber;
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, width).setFontWeight('bold').setFontSize(14);
  sheet.getRange(1, 1, rows.length, width).setVerticalAlignment('middle');
  sheet.getRange(1, 1, rows.length, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  for (i = 0; i < rows.length; i = i + 1) {
    row = rows[i];
    rowNumber = i + 1;
    if (row[0] === '\u540d\u79f0') {
      sheet.getRange(rowNumber, 1, 1, width).setFontWeight('bold').setBackground('#f3f4f6');
    }
    if (typeof row[0] === 'string' && row[0].indexOf('\u25a0') === 0) {
      sheet.getRange(rowNumber, 1, 1, width).setFontWeight('bold').setBackground('#e8eef9');
    }
    if (row[0] === '\u5408\u8a08\u91d1\u984d') {
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
