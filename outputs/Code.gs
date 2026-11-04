var TEMPLATE_SPREADSHEET_ID = '1i3qAzvRCzQvz6uJp-TWQeMQYloKjv90-h732qC6xxr4';
var OUTPUT_FOLDER_ID = '1oUKD65onJYeZWqfoeTdWuEhzr-3TE216';

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('POST data is empty.');
  }

  return JSON.parse(e.postData.contents);
}

function createEstimateSpreadsheet_(payload) {
  var customerName = String(payload.customerName || payload.clientName || payload.name || '');
  var honorific = String(payload.honorific || payload.customerHonorific || '様');
  var projectName = String(payload.projectName || payload.caseName || payload.project || '');
  var items = payload.items || payload.selectedWorkItems || [];
  var discount = toNumber_(payload.discount || payload.discountAmount || 0);
  var groupedItems;
  var fileName;
  var spreadsheet;
  var sheet;

  if (!TEMPLATE_SPREADSHEET_ID) {
    throw new Error('TEMPLATE_SPREADSHEET_ID is not configured.');
  }

  if (!isArray_(items)) {
    throw new Error('items must be an array.');
  }

  groupedItems = groupItemsByRoom_(items);
  fileName = createFileName_(projectName);
  spreadsheet = openExportSpreadsheet_(fileName, payload);
  fileName = payload._fileName;
  sheet = spreadsheet.getSheets()[0];

  var reused = payload._journal.status === 'complete';
  if (!reused) {
    payload._stage = 'write';
    writeToOriginalTemplate_(sheet, customerName, honorific, projectName, groupedItems, discount);
    SpreadsheetApp.flush();
  }
  payload._stage = 'verify';
  if (String(sheet.getRange('A4').getValue()) !== '物件名：' + projectName) throw exportError_('VERIFY_FAILED');
  payload._journal.status = 'complete';
  saveExportJournal_(payload);

  return {
    spreadsheetId: spreadsheet.getId(),
    url: spreadsheet.getUrl(),
    fileName: fileName,
    reused: reused
  };
}

function writeToOriginalTemplate_(sheet, customerName, honorific, projectName, groupedItems, discount) {
  var startRow = 9;
  var row = startRow;
  var itemStartRow = startRow;
  var itemLastRow;
  var totalRow;
  var i;
  var j;
  var group;
  var item;

  sheet.getRange('A3').setValue(customerName);
  sheet.getRange('B3').setValue(honorific);
  sheet.getRange('A4').setValue('物件名：' + projectName);
  sheet.getRange('E1').setFormula('=TODAY()');
  sheet.getRange('E6').clearContent();

  setupHonorificDropdown_(sheet);
  clearEstimateRows_(sheet, startRow);

  for (i = 0; i < groupedItems.length; i = i + 1) {
    group = groupedItems[i];

    copyTemplateRowFormat_(sheet, 9, row);
    sheet.getRange(row, 1).setValue('■' + group.roomLabel);
    sheet.getRange(row, 2, 1, 6).clearContent();
    row = row + 1;

    for (j = 0; j < group.items.length; j = j + 1) {
      item = group.items[j];

      copyTemplateRowFormat_(sheet, 10, row);

      var displayText = itemName_(item);

sheet.getRange(row, 1).setValue(displayText);
sheet.getRange(row, 1).setWrap(true);
sheet.getRange(row, 1).setVerticalAlignment("middle");

if (displayText.indexOf("\n") >= 0) {
  sheet.setRowHeight(row, 42);
} else {
  sheet.setRowHeight(row, 21);
}

setNoteTextRed_(sheet.getRange(row, 1));
      sheet.getRange(row, 2).setValue(optionalNumber_(item, ['qty', 'quantity', 'count']));
      sheet.getRange(row, 3).setValue(optionalText_(item, ['unit']));
      sheet.getRange(row, 4).setValue(optionalNumber_(item, ['unitPrice', 'price']));
      sheet.getRange(row, 5).setFormula('=B' + row + '*D' + row);
      sheet.getRange(row, 6).setValue(optionalNumber_(item, ['cost', 'costPrice']));
      sheet.getRange(row, 7).setValue(optionalText_(item, ['vendor', 'supplier', 'contractor']));

      row = row + 1;
    }
  }

  itemLastRow = row - 1;

  row = row + 3;

  totalRow = writeRemarksAndTotals_(sheet, row, itemStartRow, itemLastRow, discount);

  applyOriginalStyleRules_(sheet, totalRow);
  highlightGroupRows_(sheet, totalRow);
  applyAllBorders_(sheet, 8, totalRow);
}


function writeRemarksAndTotals_(sheet, row, itemStartRow, itemLastRow, discount) {
  var remarksTitleRow = row;
  var note1Row = row + 1;
  var note2Row = row + 2;
  var note3Row = row + 3;
  var note4Row = row + 4;
  var note5Row = row + 5;
  var blankRow = row + 6;
  var discountRow = row + 7;
  var subtotalRow = row + 8;
  var taxRow = row + 9;
  var totalRow = row + 10;
  var sumRange = 'E' + itemStartRow + ':E' + itemLastRow;

  ensureRows_(sheet, totalRow);

  copyTemplateRowFormat_(sheet, 10, remarksTitleRow);
  copyTemplateRowFormat_(sheet, 10, note1Row);
  copyTemplateRowFormat_(sheet, 10, note2Row);
  copyTemplateRowFormat_(sheet, 10, note3Row);
  copyTemplateRowFormat_(sheet, 10, note4Row);
  copyTemplateRowFormat_(sheet, 10, note5Row);
  copyTemplateRowFormat_(sheet, 10, blankRow);
  copyTemplateRowFormat_(sheet, 10, discountRow);
  copyTemplateRowFormat_(sheet, 10, subtotalRow);
  copyTemplateRowFormat_(sheet, 10, taxRow);
  copyTemplateRowFormat_(sheet, 10, totalRow);

  sheet.getRange(remarksTitleRow, 1).setValue('【備考】');
  sheet.getRange(note1Row, 1).setValue('・見積に記載のない内容については追加工事となります。別途見積をさせて頂きます。');
  sheet.getRange(note2Row, 1).setValue('・着工後、現場の不可視部分の確認にて判明された場合の仕様変更、復旧作業は再度見積提示の上で価格変更させて頂きます。予めご了承ください。');
  sheet.getRange(note3Row, 1).setValue('・雨天等、天候上のやむを得ぬや公共性の事象において、工事の着工、完工に期日延期が含まれる旨をご了承ください。');
  sheet.getRange(note4Row, 1).setValue('・工事に伴う電気、水道、ガス等は無償貸与をお願い申し上げます。');
  sheet.getRange(note5Row, 1).setValue('・本見積書の有効期限は、発行日より1か月間といたします。');

  sheet.getRange(discountRow, 1).setValue('お値引き');
  sheet.getRange(discountRow, 5).setValue(discount);

  sheet.getRange(subtotalRow, 1).setValue('小計');
  sheet.getRange(subtotalRow, 5).setFormula('=SUM(' + sumRange + ')+E' + discountRow);

  sheet.getRange(taxRow, 1).setValue('消費税');
  sheet.getRange(taxRow, 5).setFormula('=ROUND(E' + subtotalRow + '*0.1,0)');

  sheet.getRange(totalRow, 1).setValue('合計');
  sheet.getRange(totalRow, 5).setFormula('=E' + subtotalRow + '+E' + taxRow);
　sheet.getRange('B6').setFormula('=E' + totalRow);

  sheet.getRange(note1Row, 1).setFontColor('red');
  sheet.getRange(discountRow, 5).setFontColor('red');

  sheet.getRange(remarksTitleRow, 1, 1, 7).setFontWeight('bold');
  sheet.getRange(totalRow, 1, 1, 7).setFontWeight('bold');

  return totalRow;
}

function clearEstimateRows_(sheet, startRow) {
  var maxRows = sheet.getMaxRows();
  var clearRows = maxRows - startRow + 1;

  if (clearRows > 0) {
    sheet.getRange(startRow, 1, clearRows, 7).clearContent();
  }
}

function copyTemplateRowFormat_(sheet, templateRow, targetRow) {
  ensureRows_(sheet, targetRow);

  sheet.getRange(templateRow, 1, 1, 7)
    .copyTo(sheet.getRange(targetRow, 1, 1, 7), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
}

function ensureRows_(sheet, targetRow) {
  var maxRows = sheet.getMaxRows();

  if (targetRow > maxRows) {
    sheet.insertRowsAfter(maxRows, targetRow - maxRows);
  }
}

function applyOriginalStyleRules_(sheet, lastRow) {
  sheet.getRange('E1').setFormula('=TODAY()');
  sheet.getRange('A1:A' + lastRow).setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
  sheet.getRange('B3').setHorizontalAlignment('center');

  sheet.getRange('D9:F' + lastRow).setNumberFormat('#,##0');
  sheet.getRange('E9:E' + lastRow).setNumberFormat('#,##0');
}

function highlightGroupRows_(sheet, lastRow) {
  var values = sheet.getRange(9, 1, Math.max(lastRow - 8, 1), 1).getValues();
  var i;
  var text;
  var rowNumber;

  for (i = 0; i < values.length; i = i + 1) {
    text = String(values[i][0] || '');
    rowNumber = i + 9;

    if (text.indexOf('■') === 0) {
      sheet.getRange(rowNumber, 1, 1, 7)
        .setBackground('#d9eaf7')
        .setFontWeight('bold');
    }
  }
}

function applyAllBorders_(sheet, startRow, lastRow) {
  if (lastRow < startRow) {
    return;
  }

  sheet.getRange(startRow, 1, lastRow - startRow + 1, 7)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
}

function setupHonorificDropdown_(sheet) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['様', '御中'], true)
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
    roomLabel = item.roomLabel || 'その他';
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
    return title + '（' + item.selectedOptionLabel + '）';
  }

  return title;
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
    return '見積書_' + safeProjectName + '_' + stamp;
  }

  return '見積書_' + stamp;
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
function formatItemNameWithSelections_(item) {
  var lines = [];
  var selections = item.selections || [];
  var note = String(item.note || "").trim();
  var i;
  var value;

  lines.push(itemName_(item));

  if (isArray_(selections)) {
    for (i = 0; i < selections.length; i++) {
      value = selections[i] && selections[i].value;
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        lines.push(String(value).trim());
      }
    }
  }

  if (note) {
    lines.push("※備考：" + note);
  }

  return lines.join("\n");
}
function setNoteTextRed_(range) {
  var text = String(range.getValue() || "");
  var keyword = "※備考：";
  var start = text.indexOf(keyword);

  if (start === -1) {
    return;
  }

  var builder = SpreadsheetApp.newRichTextValue().setText(text);

  builder.setTextStyle(
    start,
    text.length,
    SpreadsheetApp.newTextStyle()
      .setForegroundColor("#ff0000")
      .build()
  );

  range.setRichTextValue(builder.build());
}

// 指定の親フォルダ直下にある担当者フォルダを再利用します。
// 同時実行時もフォルダが重複しないように排他制御します。
function assigneeFolder_(parentId, payload) {
  var name = String(payload.assigneeName || '').trim();
  if (!name) {
    throw new Error('案件の担当者名がありません。アプリから担当者情報を送信してください。');
  }

  if (payload._lockHeld) {
    var existingParent = DriveApp.getFolderById(parentId);
    var existingFolders = existingParent.getFoldersByName(name);
    return existingFolders.hasNext() ? existingFolders.next() : existingParent.createFolder(name);
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var parent = DriveApp.getFolderById(parentId);
    var folders = parent.getFoldersByName(name);
    return folders.hasNext() ? folders.next() : parent.createFolder(name);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, protocolVersion: 'quote-export-v2' });
}

function doPost(e) {
  var payload;
  var lock;
  var held = false;
  try {
    payload = parsePayload_(e);
    payload._stage = 'validation';
    if (payload.protocolVersion !== 'quote-export-v2' || !/^[a-f0-9]{64}$/.test(payload.requestId || '') ||
        !String(payload.assigneeName || '').trim() || !isArray_(payload.items || payload.selectedWorkItems)) {
      throw exportError_('INVALID_PAYLOAD');
    }
    payload._stage = 'authentication';
    var expected = PropertiesService.getScriptProperties().getProperty('API_SECRET');
    if (expected && String(payload.apiSecret || '') !== expected) throw exportError_('ACCESS_DENIED');
    lock = LockService.getScriptLock();
    held = lock.tryLock(20000);
    if (!held) throw exportError_('BUSY');
    payload._lockHeld = true;
    var result = createEstimateSpreadsheet_(payload);
    console.log(JSON.stringify({ requestId: payload.requestId, stage: 'complete', code: 'OK', reused: !!result.reused }));
    return json_({ ok: true, success: true, protocolVersion: 'quote-export-v2', requestId: payload.requestId,
      spreadsheetId: result.spreadsheetId, spreadsheetUrl: result.url, url: result.url,
      fileName: result.fileName, reused: !!result.reused });
  } catch (error) {
    var stages = ['validation', 'authentication', 'folder', 'template', 'copy', 'write', 'verify'];
    var stage = payload && stages.indexOf(payload._stage) >= 0 ? payload._stage : 'validation';
    var code = error && error.exportCode || (stage === 'write' ? 'WRITE_FAILED' : stage === 'verify' ? 'VERIFY_FAILED' : 'DRIVE_ERROR');
    var requestId = payload && /^[a-f0-9]{64}$/.test(payload.requestId || '') ? payload.requestId : undefined;
    // Never log raw exceptions, request bodies, account details, names or tokens.
    console.error(JSON.stringify({ requestId: requestId, stage: stage, code: code, httpStatus: error && error.httpStatus, googleReason: error && error.googleReason }));
    return json_({ ok: false, success: false, protocolVersion: 'quote-export-v2', requestId: requestId,
      stage: stage, code: code, error: '見積の保存処理に失敗しました。入力内容を保持したまま再試行してください。' });
  } finally {
    if (held) lock.releaseLock();
  }
}

function exportError_(code, httpStatus) {
  var error = new Error(code);
  error.exportCode = code;
  error.httpStatus = httpStatus;
  return error;
}

function driveJson_(path, method, body) {
  var options = {
    method: method || 'get', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  if (body) options.payload = JSON.stringify(body);
  var response = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/' + path, options);
  var status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    var problem;
    try { problem = JSON.parse(response.getContentText()); } catch (ignored) {}
    var reason = problem && problem.error && problem.error.errors && problem.error.errors[0] && problem.error.errors[0].reason;
    var allowedReasons = ['insufficientPermissions', 'forbidden', 'notFound', 'accessNotConfigured', 'storageQuotaExceeded', 'rateLimitExceeded', 'userRateLimitExceeded', 'dailyLimitExceeded'];
    var failure = exportError_(status === 401 || status === 403 ? 'ACCESS_DENIED' : 'DRIVE_ERROR', status);
    if (allowedReasons.indexOf(reason) >= 0) failure.googleReason = reason;
    throw failure;
  }
  return JSON.parse(response.getContentText());
}

function saveExportJournal_(payload) {
  PropertiesService.getScriptProperties().setProperty('quote-export:' + payload.requestId, JSON.stringify(payload._journal));
}

function openExportSpreadsheet_(fileName, payload) {
  var properties = PropertiesService.getScriptProperties();
  var raw = properties.getProperty('quote-export:' + payload.requestId);
  var journal = raw ? JSON.parse(raw) : { status: 'new' };
  payload._journal = journal;
  payload._stage = 'folder';
  var folder = journal.folderId ? DriveApp.getFolderById(journal.folderId) : assigneeFolder_(OUTPUT_FOLDER_ID, payload);
  journal.folderId = folder.getId();

  payload._stage = 'template';
  var template = DriveApp.getFileById(TEMPLATE_SPREADSHEET_ID);
  if (template.getMimeType() !== 'application/vnd.google-apps.spreadsheet') throw exportError_('INVALID_PAYLOAD');

  payload._stage = 'copy';
  var fields = 'id,name,mimeType,parents,appProperties,trashed';
  var file;
  if (journal.fileId) {
    file = driveJson_('files/' + encodeURIComponent(journal.fileId) + '?supportsAllDrives=true&fields=' + fields);
  } else {
    // appProperties is written atomically with the template copy. A lost response
    // can therefore be recovered without guessing by filename or copying again.
    var query = "'" + journal.folderId + "' in parents and trashed = false and appProperties has { key='quoteRequestId' and value='" + payload.requestId + "' }";
    var found = driveJson_('files?spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=2&q=' + encodeURIComponent(query) + '&fields=files(' + fields + ')');
    if (found.files && found.files.length > 1) throw exportError_('VERIFY_FAILED');
    file = found.files && found.files[0];
    if (!file) {
      // An ambiguous previous copy must be reconciled, never blindly repeated.
      if (journal.status === 'copy-pending') throw exportError_('COPY_UNCERTAIN');
      journal.status = 'copy-pending';
      saveExportJournal_(payload);
      try {
        file = driveJson_('files/' + encodeURIComponent(TEMPLATE_SPREADSHEET_ID) + '/copy?supportsAllDrives=true&fields=' + fields, 'post', {
          name: fileName, parents: [journal.folderId], appProperties: { quoteRequestId: payload.requestId }
        });
      } catch (error) {
        // A definite rejection did not create a file. Timeouts/5xx remain uncertain.
        if (error.httpStatus >= 400 && error.httpStatus < 500 && error.httpStatus !== 408) {
          journal.status = 'copy-rejected';
          saveExportJournal_(payload);
          throw error;
        }
        throw exportError_('COPY_UNCERTAIN', error.httpStatus);
      }
    }
  }
  if (!file || file.trashed || file.mimeType !== 'application/vnd.google-apps.spreadsheet' ||
      !file.parents || file.parents.indexOf(journal.folderId) < 0 ||
      !file.appProperties || file.appProperties.quoteRequestId !== payload.requestId) throw exportError_('VERIFY_FAILED');
  journal.fileId = file.id;
  payload._fileName = file.name;
  saveExportJournal_(payload);
  payload._stage = 'write';
  return SpreadsheetApp.openById(file.id);
}

// Execute manually in the GAS editor to check access without creating any files.
function diagnoseQuoteExport() {
  var stage = 'template';
  try {
    var template = driveJson_('files/' + TEMPLATE_SPREADSHEET_ID + '?supportsAllDrives=true&fields=mimeType,capabilities(canCopy)');
    stage = 'folder';
    var folder = driveJson_('files/' + OUTPUT_FOLDER_ID + '?supportsAllDrives=true&fields=mimeType,capabilities(canAddChildren)');
    var result = { protocolVersion: 'quote-export-v2', templateIsSpreadsheet: template.mimeType === 'application/vnd.google-apps.spreadsheet',
      canCopyTemplate: !!(template.capabilities && template.capabilities.canCopy),
      destinationIsFolder: folder.mimeType === 'application/vnd.google-apps.folder',
      canAddChildren: !!(folder.capabilities && folder.capabilities.canAddChildren) };
    console.log(JSON.stringify(result));
    return result;
  } catch (error) {
    console.error(JSON.stringify({ stage: stage, code: error.exportCode || 'DRIVE_ERROR', httpStatus: error.httpStatus }));
    throw new Error('アクセス診断に失敗しました。ログの段階とコードを確認してください。');
  }
}
