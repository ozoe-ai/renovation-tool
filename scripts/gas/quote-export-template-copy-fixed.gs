var TEMPLATE_SPREADSHEET_ID = '1i3qAzvRCzQvz6uJp-TWQeMQYloKjv90-h732qC6xxr4';
var OUTPUT_FOLDER_ID = '1oUKD65onJYeZWqfoeTdWuEhzr-3TE216';

function doPost(e) {
  try {
    var payload = parsePayload_(e);
    var result = createEstimateSpreadsheet_(payload);

    return json_({
      ok: true,
      success: true,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.url,
      url: result.url,
      fileName: result.fileName
    });
  } catch (error) {
    return json_({
      ok: false,
      success: false,
      message: error.message,
      error: error.message
    });
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('POST data is empty.');
  }

  return JSON.parse(e.postData.contents);
}

function createEstimateSpreadsheet_(payload) {
  var customerName = String(payload.customerName || payload.clientName || payload.name || '');
  var honorific = String(payload.honorific || payload.customerHonorific || '\u69d8');
  var projectName = String(payload.projectName || payload.caseName || payload.project || '');
  var items = payload.items || payload.selectedWorkItems || [];
  var groupedItems;
  var fileName;
  var spreadsheet;
  var sheet;

  if (!TEMPLATE_SPREADSHEET_ID || TEMPLATE_SPREADSHEET_ID === '\u3053\u3053\u306b\u539f\u672c\u30b9\u30d7\u30ec\u30c3\u30c9\u30b7\u30fc\u30c8ID\u3092\u5165\u308c\u3066\u304f\u3060\u3055\u3044') {
    throw new Error('TEMPLATE_SPREADSHEET_ID is not configured.');
  }

  if (!isArray_(items)) {
    throw new Error('items must be an array.');
  }

  groupedItems = groupItemsByRoom_(items);
  fileName = createFileName_(projectName);
  spreadsheet = copyTemplateSpreadsheet_(fileName);
  sheet = spreadsheet.getSheets()[0];

  writeToOriginalTemplate_(sheet, customerName, honorific, projectName, groupedItems, items, payload);

  return {
    spreadsheetId: spreadsheet.getId(),
    url: spreadsheet.getUrl(),
    fileName: fileName
  };
}

function copyTemplateSpreadsheet_(fileName) {
  var templateFile = DriveApp.getFileById(TEMPLATE_SPREADSHEET_ID);
  var copiedFile;

  if (OUTPUT_FOLDER_ID) {
    copiedFile = templateFile.makeCopy(fileName, DriveApp.getFolderById(OUTPUT_FOLDER_ID));
  } else {
    copiedFile = templateFile.makeCopy(fileName);
  }

  return SpreadsheetApp.openById(copiedFile.getId());
}

function writeToOriginalTemplate_(sheet, customerName, honorific, projectName, groupedItems, allItems, payload) {
  var startRow = 9;
  var total = estimateTotal_(payload, allItems);
  var row = startRow;
  var i;
  var j;
  var group;
  var item;

  sheet.getRange('A3').setValue(customerName);
  sheet.getRange('B3').setValue(honorific);
  sheet.getRange('A4').setValue('\u7269\u4ef6\u540d\uff1a' + projectName);
  sheet.getRange('E6').setValue(total);

  setupHonorificDropdown_(sheet);
  clearEstimateRows_(sheet, startRow);

  for (i = 0; i < groupedItems.length; i = i + 1) {
    group = groupedItems[i];

    copyTemplateRowFormat_(sheet, 9, row);
    sheet.getRange(row, 1).setValue('\u25a0' + group.roomLabel);
    sheet.getRange(row, 2, 1, 6).clearContent();
    row = row + 1;

    for (j = 0; j < group.items.length; j = j + 1) {
      item = group.items[j];

      copyTemplateRowFormat_(sheet, 10, row);
      sheet.getRange(row, 1).setValue(itemName_(item));
      sheet.getRange(row, 2).setValue(optionalNumber_(item, ['qty', 'quantity', 'count']));
      sheet.getRange(row, 3).setValue(optionalText_(item, ['unit']));
      sheet.getRange(row, 4).setValue(optionalNumber_(item, ['unitPrice', 'price']));
      sheet.getRange(row, 5).setValue(toNumber_(item.qty || item.quantity || item.count) * toNumber_(item.unitPrice || item.price));
      sheet.getRange(row, 6).setValue(optionalNumber_(item, ['cost', 'costPrice', 'baseCost']));
      sheet.getRange(row, 7).setValue(optionalText_(item, ['vendor', 'supplier', 'contractor']));

      row = row + 1;
    }
  }

  applyOriginalStyleRules_(sheet, row - 1);
  writeEstimateAmount_(sheet, total);
}

function estimateTotal_(payload, items) {
  var amount = toNumber_(payload.estimateAmount || payload.totalAmount || payload.quoteTotal || payload.total);
  return amount || calculateTotal_(items);
}

function clearEstimateRows_(sheet, startRow) {
  var maxRows = sheet.getMaxRows();
  var clearRows = maxRows - startRow + 1;

  if (clearRows > 0) {
    sheet.getRange(startRow, 1, clearRows, 7).clearContent();
  }
}

function copyTemplateRowFormat_(sheet, templateRow, targetRow) {
  var maxRows = sheet.getMaxRows();

  if (targetRow > maxRows) {
    sheet.insertRowsAfter(maxRows, targetRow - maxRows);
  }

  sheet
    .getRange(templateRow, 1, 1, 7)
    .copyTo(sheet.getRange(targetRow, 1, 1, 7), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
}

function applyOriginalStyleRules_(sheet, lastRow) {
  var last = Math.max(lastRow, 200);

  sheet.getRange('E1').setFormula('=TODAY()');
  sheet.getRange('A1:A' + last).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  sheet.getRange('B3').setHorizontalAlignment('center');
  sheet.getRange('D9:F' + Math.max(lastRow, 9)).setNumberFormat('#,##0');
}

function writeEstimateAmount_(sheet, total) {
  Logger.log('estimate total=' + total);
  Logger.log('target sheet=' + sheet.getName());
  sheet.getRange('BC6').setValue(total);
  SpreadsheetApp.flush();
}

function setupHonorificDropdown_(sheet) {
  var rule = SpreadsheetApp
    .newDataValidation()
    .requireValueInList(['\u69d8', '\u5fa1\u4e2d'], true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange('B3').setDataValidation(rule);
}

function groupItemsByRoom_(items) {
  var groups = [];
  var i;
  var j;
  var item;
  var roomLabel;
  var group;

  for (i = 0; i < items.length; i = i + 1) {
    item = items[i];
    roomLabel = item.roomLabel || item.category || item.room || '\u305d\u306e\u4ed6';
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
  var title = String(item.title || item.name || item.workItemId || '');

  if (item.selectedOptionLabel) {
    return title + '\uff08' + item.selectedOptionLabel + '\uff09';
  }

  return title;
}

function calculateTotal_(items) {
  var total = 0;
  var i;

  for (i = 0; i < items.length; i = i + 1) {
    total = total + toNumber_(items[i].qty || items[i].quantity || items[i].count) * toNumber_(items[i].unitPrice || items[i].price);
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

function pad_(value) {
  var text = String(value);

  if (text.length < 2) {
    return '0' + text;
  }

  return text;
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function isArray_(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}
