// ===== SkillMate — Google Apps Script Backend v2.0 =====
// Architecture: API Layer -> Service Layer -> Data Layer
// Security: SHA-256 hashing, input validation, role-based access

const SPREADSHEET_ID = '12n98Y8rC2M6QFUghoDxfomBDRGM7kUEastEcJBUCYDM';
const IMAGES_FOLDER_NAME = 'SkillmateImages';
const PLATFORM_COMMISSION = 0.10;
const WELCOME_BONUS = 2000;
const DEFAULT_ADMIN_EMAIL = 'admin@test.com';
const DEFAULT_ADMIN_PASSWORD = '123456';
const DEFAULT_ADMIN_NAME = 'أدمن النظام';

// ==================== WEB APP ENTRY POINTS ====================

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (action) {
    var params = {};
    if (e.parameter.params) { try { params = JSON.parse(e.parameter.params); } catch (err) {} }
    Object.keys(e.parameter).forEach(function(k) { if (k !== 'action' && k !== 'params') params[k] = e.parameter[k]; });
    params.action = action;
    var result = routeAction(params);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok', message: 'SkillMate API v2.0',
    docs: 'POST JSON with { action: "...", ... }'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var payload = {};
  try { payload = JSON.parse(e.postData.contents); } catch (err) { payload = {}; }
  var result = routeAction(payload);
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleApiCall(action, paramsJSON) {
  var params = {};
  try { params = JSON.parse(paramsJSON); } catch (e) { params = {}; }
  params.action = action;
  return JSON.stringify(routeAction(params));
}

// ==================== LOGGING ====================

function logError(context, err) {
  try {
    var sheet = getOrCreateSheet('_Logs');
    if (!sheet) return;
    sheet.appendRow([new Date().toISOString(), context, err.message || String(err), err.stack || '']);
  } catch (e) { /* silent */ }
}

// ==================== ROUTER ====================

function routeAction(content) {
  try {
    ensureDefaultAdminUser();
    var action = content.action;
    if (!action) return { error: 'missing_action' };
    switch (action) {
      case 'registerUser':         return registerUser(content);
      case 'loginUser':            return loginUser(content);
      case 'updateProfile':        return updateProfile(content);
      case 'getCategories':        return getCategories();
      case 'getServices':          return getServices(content);
      case 'getMyServices':        return getMyServices(content);
      case 'addService':           return addService(content);
      case 'deleteService':        return deleteService(content);
      case 'addOrder':             return addOrder(content);
      case 'getOrders':            return getOrders(content);
      case 'updateOrderStatus':    return updateOrderStatus(content);
      case 'getAllOrders':         return getAllOrders();
      case 'getWallet':            return getWallet(content);
      case 'updateWallet':         return updateWallet(content);
      case 'addFavorite':          return addFavorite(content);
      case 'removeFavorite':       return removeFavorite(content);
      case 'getFavorites':         return getFavorites(content);
      case 'addReview':            return addReview(content);
      case 'getReviews':           return getReviews(content);
      case 'sendMessage':          return sendMessage(content);
      case 'getMessages':          return getMessages(content);
      case 'getAllUsers':          return getAllUsers();
      case 'requestVerification':  return requestVerification(content);
      case 'getVerifications':     return getVerifications();
      case 'updateVerificationStatus': return updateVerificationStatus(content);
      case 'updateUserVerification':   return updateUserVerification(content);
      case 'getWithdrawalRequests': return getWithdrawalRequests(content);
      case 'requestWithdrawal':     return requestWithdrawal(content);
      case 'updateWithdrawalStatus': return updateWithdrawalStatus(content);
      case 'getDisputes':           return getDisputes(content);
      case 'createDispute':         return createDispute(content);
      case 'updateDisputeStatus':   return updateDisputeStatus(content);
      case 'getAdminDashboardStats': return getAdminDashboardStats();
      case 'uploadImageBase64':    return uploadImageBase64(content);
      case 'saveFileLink':         return saveFileLink(content);
      case 'testConnection':       return testConnection();
      case 'setupAllSheets':       return setupAllSheets();
      case 'resetAllData':         return resetAllData();
      case 'changePassword':       return changePassword(content);
      case 'getTransactions':      return getTransactions(content);
      case 'getDashboardStats':    return getDashboardStats();
      case 'sendNotification':     return sendNotification(content);
      case 'getNotifications':     return getNotifications(content);
      case 'getUnreadCount':       return getUnreadCount(content);
      case 'markNotifRead':        return markNotifRead(content);
      case 'suspendUser':          return suspendUser(content);
      case 'unsuspendUser':        return unsuspendUser(content);
      case 'moderateService':      return moderateService(content);
      case 'exportData':           return exportData(content);
      default: return { error: 'unknown_action', action: action };
    }
  } catch (err) {
    logError('routeAction', err);
    return { error: 'internal_error', message: err.message || String(err) };
  }
}

// ==================== DATA LAYER ====================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet(name) {
  var ss = getSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (sh) return sh;
  return ss.insertSheet(name);
}

function getHeaders(sheet) {
  if (!sheet) return [];
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];
  var headers = data[0];
  var out = [];
  for (var r = 1; r < data.length; r++) {
    var row = {};
    var valid = false;
    for (var c = 0; c < headers.length; c++) {
      var val = data[r][c];
      if (val !== undefined && val !== null && val !== '') valid = true;
      row[headers[c]] = (val === undefined || val === null) ? '' : val;
    }
    if (valid) out.push(row);
  }
  return out;
}

function ensureHeaders(sheetName, requiredHeaders) {
  var sheet = getOrCreateSheet(sheetName);
  if (!sheet) return null;
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    return sheet;
  }
  var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var missing = [];
  for (var i = 0; i < requiredHeaders.length; i++) {
    var found = false;
    for (var j = 0; j < currentHeaders.length; j++) {
      if (currentHeaders[j] === requiredHeaders[i]) { found = true; break; }
    }
    if (!found) missing.push(requiredHeaders[i]);
  }
  if (missing.length > 0) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
  return sheet;
}

function appendRowData(sheetName, obj) {
  var sheet = getOrCreateSheet(sheetName);
  var existingHeaders = getHeaders(sheet);
  var headers;
  if (existingHeaders.length > 0 && existingHeaders[0] !== '') {
    headers = existingHeaders;
  } else {
    headers = Object.keys(obj);
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    row.push(obj.hasOwnProperty(headers[i]) ? obj[headers[i]] : '');
  }
  sheet.appendRow(row);
}

function generateId(prefix) {
  return (prefix || 'id') + '-' + Math.floor(Math.random() * 900000 + 100000) + '-' + Date.now();
}

function generateRN() {
  var year = new Date().getFullYear();
  var rand = Math.floor(Math.random() * 900000 + 100000);
  return 'RN-' + year + '-' + rand;
}

function ensureFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

// ==================== SECURITY ====================

function hashPassword(password) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  var hex = '';
  for (var i = 0; i < digest.length; i++) {
    var byte = digest[i];
    if (byte < 0) byte += 256;
    hex += ('0' + byte.toString(16)).slice(-2);
  }
  return hex;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ensureDefaultAdminUser() {
  try {
    ensureHeaders('Users', ['id','seller_id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
    var sheet = getOrCreateSheet('Users');
    var users = sheetToObjects(sheet);
    var now = new Date().toISOString();
    var hashedDefault = hashPassword(DEFAULT_ADMIN_PASSWORD);
    var found = null;
    var headers = getHeaders(sheet);
    var emailCol = headers.indexOf('email');
    var passCol = headers.indexOf('password');
    var roleCol = headers.indexOf('role');
    var verifiedCol = headers.indexOf('verified');
    var statusCol = headers.indexOf('status');

    for (var i = 0; i < users.length; i++) {
      if ((users[i].email || '').toString().trim().toLowerCase() === DEFAULT_ADMIN_EMAIL) {
        found = { user: users[i], rowIndex: i + 2 };
        break;
      }
    }

    if (!found) {
      var adminId = 'admin-default';
      var adminRn = 'RN-ADMIN-000001';
      appendRowData('Users', {
        id: adminId,
        seller_id: '',
        rn: adminRn,
        name: DEFAULT_ADMIN_NAME,
        email: DEFAULT_ADMIN_EMAIL,
        password: hashedDefault,
        role: 'admin',
        verified: 'true',
        avatar_url: '',
        id_card_url: '',
        phone: '',
        created_at: now,
        status: 'active'
      });
      ensureHeaders('Wallets', ['user_id','rn','balance','created_at']);
      var walletSheet = getOrCreateSheet('Wallets');
      var walletRows = sheetToObjects(walletSheet);
      var walletExists = false;
      for (var w = 0; w < walletRows.length; w++) {
        if ((walletRows[w].user_id || '') === adminId) { walletExists = true; break; }
      }
      if (!walletExists) appendRowData('Wallets', { user_id: adminId, rn: adminRn, balance: 0, created_at: now });
      return;
    }

    var row = found.rowIndex;
    var user = found.user || {};
    if (emailCol >= 0) sheet.getRange(row, emailCol + 1).setValue(DEFAULT_ADMIN_EMAIL);
    if (passCol >= 0) sheet.getRange(row, passCol + 1).setValue(hashedDefault);
    if (roleCol >= 0) sheet.getRange(row, roleCol + 1).setValue('admin');
    if (verifiedCol >= 0) sheet.getRange(row, verifiedCol + 1).setValue('true');
    if (statusCol >= 0) sheet.getRange(row, statusCol + 1).setValue('active');
    if (!user.id) {
      var idCol = headers.indexOf('id');
      if (idCol >= 0) sheet.getRange(row, idCol + 1).setValue('admin-default');
    }
    if (!user.rn && headers.indexOf('rn') >= 0) sheet.getRange(row, headers.indexOf('rn') + 1).setValue('RN-ADMIN-000001');
    if (!user.name && headers.indexOf('name') >= 0) sheet.getRange(row, headers.indexOf('name') + 1).setValue(DEFAULT_ADMIN_NAME);
  } catch (err) {
    logError('ensureDefaultAdminUser', err);
  }
}

// ==================== AUTH ====================

function registerUser(payload) {
  var email = (payload.email || '').toString().trim().toLowerCase();
  var name = (payload.name || '').toString().trim();
  var password = (payload.password || '').toString();
  var role = (payload.role || 'buyer').toString().toLowerCase();
  var phone = (payload.phone || '').toString().trim();
  var allowAdmin = payload.allow_admin === true || payload.allow_admin === 'true';

  if (!email || !validateEmail(email)) return { error: 'البريد الإلكتروني غير صالح' };
  if (!password || password.length < 3) return { error: 'كلمة المرور قصيرة جداً' };
  if (role !== 'buyer' && role !== 'seller' && !(allowAdmin && role === 'admin')) role = 'buyer';

  ensureHeaders('Users', ['id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
  var existing = sheetToObjects(getOrCreateSheet('Users'));
  for (var i = 0; i < existing.length; i++) {
    if (existing[i] && existing[i].email === email) return { error: 'البريد الإلكتروني موجود بالفعل' };
  }

  var id = generateId('user');
  var rn = generateRN();
  var hashedPass = hashPassword(password);
  var now = new Date().toISOString();

  var sellerId = '';
  if (role === 'seller') sellerId = generateId('seller');
  appendRowData('Users', {
    id: id,
    seller_id: sellerId,
    rn: rn,
    name: name || email.split('@')[0],
    email: email,
    password: hashedPass,
    role: role,
    verified: '',
    avatar_url: '',
    id_card_url: '',
    phone: phone,
    created_at: now,
    status: 'active'
  });

  // Initialize wallet
  ensureHeaders('Wallets', ['user_id','rn','balance','created_at']);
  appendRowData('Wallets', { user_id: id, rn: rn, balance: WELCOME_BONUS, created_at: now });

  return {
    success: true,
    user: {
      id: id, seller_id: sellerId, rn: rn, name: name || email.split('@')[0],
      email: email, role: role, verified: false,
      avatar_url: '', id_card_url: '', phone: phone,
      created_at: now
    }
  };
}

function loginUser(payload) {
  try {
    if (!payload || typeof payload !== 'object') {
      logError('loginUser', new Error('Invalid payload type: ' + typeof payload));
      return { error: 'بيانات الدخول غير صالحة' };
    }

    var email = (payload.email || '').toString().trim().toLowerCase();
    var password = (payload.password || '').toString();

    if (!email) return { error: 'البريد الإلكتروني مطلوب' };
    if (!password) return { error: 'كلمة المرور مطلوبة' };

    if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      ensureDefaultAdminUser();
    }

    ensureHeaders('Users', ['id','seller_id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
    var sheet = getOrCreateSheet('Users');
    var users = sheetToObjects(sheet);

    if (!users || users.length === 0) {
      return { error: 'لا يوجد مستخدمون في النظام' };
    }

    var hashedInput = hashPassword(password);

    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      if (!u) continue;

      var userEmail = (u.email || '').toString().toLowerCase().trim();
      if (userEmail !== email) continue;

      var storedPass = (u.password || '').toString();
      var passMatch = false;

      if (storedPass.length === 64 && /^[a-f0-9]+$/.test(storedPass)) {
        passMatch = (storedPass === hashedInput);
      } else {
        passMatch = (storedPass === password);
        if (passMatch) {
          var passCol = getHeaders(sheet).indexOf('password') + 1;
          if (passCol > 0) {
            var rowIndex = i + 2;
            sheet.getRange(rowIndex, passCol).setValue(hashedInput);
          }
        }
      }

      if (passMatch) {
        return {
          success: true,
          user: {
            id: u.id || '',
            seller_id: u.seller_id || '',
            rn: u.rn || '',
            name: u.name || u.email.split('@')[0],
            email: u.email,
            role: u.role || 'buyer',
            verified: u.verified === 'true',
            avatar_url: u.avatar_url || '',
            id_card_url: u.id_card_url || '',
            phone: u.phone || ''
          }
        };
      } else {
        return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }
    }

    return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
  } catch (err) {
    logError('loginUser', err);
    return { error: 'خطأ في تسجيل الدخول: ' + err.message };
  }
}

function updateProfile(payload) {
  var userId = payload.user_id || payload.userId || '';
  if (!userId) return { error: 'user_id_required' };
  ensureHeaders('Users', ['id','seller_id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
  var sheet = getOrCreateSheet('Users');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  if (data.length < 2) return { error: 'user_not_found' };
  var idCol = headers.indexOf('id');
  if (idCol < 0) return { error: 'no_id_column' };

  var fieldMapping = {
    'profile_pic': 'avatar_url', 'avatar': 'avatar_url', 'avatar_url': 'avatar_url',
    'id_card': 'id_card_url', 'id_card_url': 'id_card_url',
    'name': 'name', 'phone': 'phone', 'role': 'role'
  };

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(userId)) {
      Object.keys(payload).forEach(function(key) {
        var targetHeader = fieldMapping[key] || key;
        var targetCol = headers.indexOf(targetHeader);
        if (targetCol >= 0 && targetHeader !== 'id' && targetHeader !== 'password') {
          sheet.getRange(r + 1, targetCol + 1).setValue(payload[key]);
        }
      });

      var updatedRows = sheetToObjects(sheet);
      var updatedUser = null;
      for (var i = 0; i < updatedRows.length; i++) {
        if (String(updatedRows[i].id) === String(userId)) { updatedUser = updatedRows[i]; break; }
      }

      if (updatedUser && updatedUser.avatar_url && updatedUser.id_card_url) {
        var verCol = headers.indexOf('verified');
        if (verCol >= 0) sheet.getRange(r + 1, verCol + 1).setValue('true');
      }

      return {
        success: true, message: 'Profile updated',
        user: {
          id: updatedUser.id, name: updatedUser.name, email: updatedUser.email,
          role: updatedUser.role, verified: updatedUser.verified === 'true',
          avatar_url: updatedUser.avatar_url || '', id_card_url: updatedUser.id_card_url || '',
          phone: updatedUser.phone || ''
        }
      };
    }
  }
  return { error: 'user_not_found' };
}

function changePassword(payload) {
  var userId = payload.user_id || payload.userId || '';
  var currentPass = payload.current_password || '';
  var newPass = payload.new_password || '';
  if (!userId || !currentPass || !newPass) return { error: 'جميع الحقول مطلوبة' };
  if (newPass.length < 6) return { error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' };
  ensureHeaders('Users', ['id','seller_id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
  var sheet = getOrCreateSheet('Users');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var passCol = headers.indexOf('password');
  if (idCol < 0 || passCol < 0) return { error: 'columns_not_found' };

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(userId)) {
      var storedPass = String(data[r][passCol] || '');
      var currentHashed = hashPassword(currentPass);
      var match = (storedPass === currentHashed) || (storedPass === currentPass);
      if (!match) return { error: 'كلمة المرور الحالية غير صحيحة' };
      sheet.getRange(r + 1, passCol + 1).setValue(hashPassword(newPass));
      return { success: true };
    }
  }
  return { error: 'user_not_found' };
}

// ==================== CATEGORIES ====================

function getCategories() {
  ensureHeaders('Categories', ['id','name','icon','order']);
  return sheetToObjects(getOrCreateSheet('Categories'));
}

// ==================== SERVICES ====================

function getServices(payload) {
  ensureHeaders('Services', ['id','seller_rn','title','description','price','media_url','category','seller_id','seller_name','rating','reviews','status','created_at']);
  var all = sheetToObjects(getOrCreateSheet('Services'));
  var users = sheetToObjects(getOrCreateSheet('Users'));
  var userMap = {};
  for (var i = 0; i < users.length; i++) { userMap[users[i].id] = users[i]; }
  for (var i = 0; i < all.length; i++) {
    var seller = userMap[all[i].seller_id] || {};
    all[i].seller_name = seller.name || '';
    all[i].seller_verified = seller.verified === 'true';
    all[i].seller_rn = seller.rn || all[i].seller_rn || '';
  }
  var category = payload && payload.category ? payload.category : null;
  // sort helper: verified sellers first, then by created_at desc
  function sortServices(arr) {
    arr.sort(function(a, b) {
      var av = a.seller_verified ? 1 : 0;
      var bv = b.seller_verified ? 1 : 0;
      if (av !== bv) return bv - av; // verified first
      var at = a.created_at || '';
      var bt = b.created_at || '';
      if (bt > at) return 1;
      if (bt < at) return -1;
      return 0;
    });
    return arr;
  }

  if (category) {
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].category === category || (all[i].category || '').toLowerCase().indexOf(category.toLowerCase()) !== -1) {
        filtered.push(all[i]);
      }
    }
    return sortServices(filtered);
  }
  return sortServices(all);
}

function getMyServices(payload) {
  var role = (payload && payload.role) ? payload.role : '';
  var sellerId = payload.seller_id || payload.sellerId || payload.seller || '';
  var userId = payload.user_id || payload.userId || '';

  // Seller mode: return services created by this seller
  if (role === 'seller' || sellerId) {
    var sid = sellerId || userId;
    if (!sid) return { error: 'seller_id_required' };
    var all = getServices({});
    var mine = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].seller_id === sid) mine.push(all[i]);
    }
    return mine;
  }

  // Buyer mode: return purchases (orders) for this buyer, with seller contact
  if (role === 'buyer' || userId) {
    var uid = userId;
    if (!uid) return { error: 'user_id_required' };
    ensureHeaders('Orders', ['id','rn','user_id','seller_id','service_id','title','price','status','buyer_rn','seller_rn','buyer_phone','seller_phone','notes','created_at']);
    var orders = sheetToObjects(getOrCreateSheet('Orders'));
    var services = sheetToObjects(getOrCreateSheet('Services'));
    var users = sheetToObjects(getOrCreateSheet('Users'));
    var svcMap = {};
    for (var s = 0; s < services.length; s++) { svcMap[services[s].id] = services[s]; }
    var userMap = {};
    for (var u = 0; u < users.length; u++) { userMap[users[u].id] = users[u]; }

    var out = [];
    for (var i = 0; i < orders.length; i++) {
      if (String(orders[i].user_id) === String(uid)) {
        var ord = orders[i];
        var svc = svcMap[ord.service_id] || {};
        var seller = userMap[ord.seller_id] || {};
        var sellerPhone = seller.phone || ord.seller_phone || '';
        var cleanPhone = (sellerPhone || '').toString().replace(/[^0-9+]/g, '');
        var whatsapp = cleanPhone ? ('https://wa.me/' + cleanPhone.replace(/^\+/, '')) : '';
        var tel = cleanPhone ? ('tel:' + cleanPhone) : '';
        out.push({
          order_id: ord.id,
          service_id: ord.service_id,
          title: ord.title || svc.title || '',
          price: ord.price || svc.price || 0,
          status: ord.status || '',
          seller_id: ord.seller_id || svc.seller_id || '',
          seller_name: seller.name || svc.seller_name || '',
          seller_phone: sellerPhone,
          whatsapp_url: whatsapp,
          tel_url: tel,
          created_at: ord.created_at || ''
        });
      }
    }
    return out;
  }

  return { error: 'invalid_parameters' };
}

function addService(payload) {
  var title = (payload.title || payload.name || '').toString().trim();
  var sellerId = payload.seller_id || payload.sellerId || payload.seller || '';
  if (!title) return { error: 'title_required' };
  if (!sellerId) return { error: 'seller_id_required' };

  var id = generateId('svc');
  var users = sheetToObjects(getOrCreateSheet('Users'));
  var sellerRn = '', sellerName = '';
  var sellerRole = '';
  for (var i = 0; i < users.length; i++) {
    if (users[i] && (users[i].id === sellerId || (users[i].seller_id && users[i].seller_id === sellerId))) {
      sellerRn = users[i].rn || '';
      sellerName = users[i].name || '';
      sellerRole = users[i].role || '';
      break;
    }
  }

  // Only allow actual sellers to add services
  if (sellerRole !== 'seller') return { error: 'only_sellers_can_add_services' };

  ensureHeaders('Services', ['id','seller_rn','title','description','price','media_url','category','seller_id','seller_name','rating','reviews','status','created_at']);
  appendRowData('Services', {
    id: id,
    seller_rn: sellerRn,
    title: title,
    description: (payload.description || payload.desc || '').toString(),
    price: parseFloat(payload.price) || 0,
    media_url: payload.media_url || payload.imageUrl || '',
    category: payload.category || '',
    seller_id: sellerId,
    seller_name: sellerName,
    rating: parseFloat(payload.rating) || 0,
    reviews: parseInt(payload.reviews) || 0,
    status: 'active',
    created_at: new Date().toISOString()
  });
  return { success: true, id: id };
}

function deleteService(payload) {
  var serviceId = payload.service_id || payload.id || payload.serviceId || '';
  if (!serviceId) return { error: 'service_id_required' };
  var sheet = getOrCreateSheet('Services');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { error: 'service_not_found' };
  var headers = data[0];
  var idCol = headers.indexOf('id');
  if (idCol < 0) return { error: 'no_id_column' };
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(serviceId)) {
      sheet.deleteRow(r + 1);
      return { success: true };
    }
  }
  return { error: 'service_not_found' };
}

// ==================== ORDERS ====================

function addOrder(payload) {
  var userId = payload.user_id || payload.userId || '';
  var serviceId = payload.service_id || payload.serviceId || '';
  if (!userId) return { error: 'user_id_required' };
  if (!serviceId) return { error: 'service_id_required' };

  var id = generateId('ord');
  var users = sheetToObjects(getOrCreateSheet('Users'));
  var buyerRn = '', buyerPhone = '', sellerRn = '', sellerPhone = '';
  for (var i = 0; i < users.length; i++) {
    if (users[i] && users[i].id === userId) { buyerRn = users[i].rn || ''; buyerPhone = users[i].phone || ''; }
    if (users[i] && users[i].id === payload.seller_id) { sellerRn = users[i].rn || ''; sellerPhone = users[i].phone || ''; }
  }

  ensureHeaders('Orders', ['id','rn','user_id','seller_id','service_id','title','price','status','buyer_rn','seller_rn','buyer_phone','seller_phone','notes','created_at']);
  appendRowData('Orders', {
    id: id,
    rn: buyerRn,
    user_id: userId,
    seller_id: payload.seller_id || payload.sellerId || '',
    service_id: serviceId,
    title: (payload.title || '').toString(),
    price: parseFloat(payload.price) || 0,
    status: payload.status || 'pending',
    buyer_rn: buyerRn,
    seller_rn: sellerRn,
    buyer_phone: buyerPhone,
    seller_phone: sellerPhone,
    notes: (payload.notes || '').toString(),
    created_at: new Date().toISOString()
  });

  var price = parseFloat(payload.price) || 0;
  var commission = Math.round(price * PLATFORM_COMMISSION * 100) / 100;
  var sellerGets = Math.round((price - commission) * 100) / 100;

  ensureHeaders('Transactions', ['id','rn','order_id','user_id','type','amount','commission','seller_gets','description','status','created_at']);
  appendRowData('Transactions', {
    id: generateId('txn'),
    rn: buyerRn,
    order_id: id,
    user_id: userId,
    type: 'purchase',
    amount: price,
    commission: commission,
    seller_gets: sellerGets,
    description: (payload.title || 'شراء خدمة').toString(),
    status: 'completed',
    created_at: new Date().toISOString()
  });

  return { success: true, id: id, commission: commission, seller_gets: sellerGets };
}

function getOrders(payload) {
  ensureHeaders('Orders', ['id','rn','user_id','seller_id','service_id','title','price','status','buyer_rn','seller_rn','buyer_phone','seller_phone','notes','created_at']);
  var all = sheetToObjects(getOrCreateSheet('Orders'));
  var role = payload && payload.role ? payload.role : '';
  var userId = payload && payload.userId ? payload.userId : (payload && payload.user_id ? payload.user_id : '');
  if (role === 'admin') return all;
  if (userId) {
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].user_id === userId || all[i].seller_id === userId) {
        filtered.push(all[i]);
      }
    }
    return filtered;
  }
  return all;
}

function getAllOrders() {
  ensureHeaders('Orders', ['id','rn','user_id','seller_id','service_id','title','price','status','buyer_rn','seller_rn','buyer_phone','seller_phone','notes','created_at']);
  return sheetToObjects(getOrCreateSheet('Orders'));
}

function updateOrderStatus(payload) {
  var orderId = payload.order_id || payload.id || '';
  var status = payload.status || 'completed';
  if (!orderId) return { error: 'order_id_required' };
  var sheet = getOrCreateSheet('Orders');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { error: 'order_not_found' };
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  if (idCol < 0) return { error: 'no_id_column' };
  if (statusCol < 0) return { error: 'no_status_column' };

  var validStatuses = ['pending','in_progress','completed','cancelled'];
  if (validStatuses.indexOf(status) < 0) status = 'completed';

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(orderId)) {
      sheet.getRange(r + 1, statusCol + 1).setValue(status);
      return { success: true, id: orderId, status: status };
    }
  }
  return { error: 'order_not_found' };
}

// ==================== WALLET ====================

function getWallet(payload) {
  var userId = payload.userId || payload.user_id || '';
  if (!userId) return { success: true, balance: 0 };
  ensureHeaders('Wallets', ['user_id','rn','balance','created_at']);
  var rows = sheetToObjects(getOrCreateSheet('Wallets'));
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].user_id) === String(userId)) {
      return { success: true, balance: parseFloat(rows[i].balance) || 0, rn: rows[i].rn || '' };
    }
  }
  return { success: true, balance: 0 };
}

function updateWallet(payload) {
  var userId = payload.userId || payload.user_id || '';
  var amount = parseFloat(payload.amount) || 0;
  var operation = payload.operation || 'add';
  if (!userId) return { error: 'user_id_required' };
  if (amount <= 0) return { error: 'amount_must_be_positive' };

  ensureHeaders('Wallets', ['user_id','rn','balance','created_at']);
  var sheet = getOrCreateSheet('Wallets');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(userId)) {
      var bal = parseFloat(data[r][2]) || 0;
      if (operation === 'deduct' && bal < amount) return { error: 'رصيد غير كافي' };
      bal = operation === 'add' ? bal + amount : bal - amount;
      if (bal < 0) bal = 0;
      sheet.getRange(r + 1, 3).setValue(bal);
      return { success: true, balance: bal };
    }
  }

  var users = sheetToObjects(getOrCreateSheet('Users'));
  var userRn = '';
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) { userRn = users[i].rn || ''; break; }
  }

  var initial = operation === 'add' ? amount : 0;
  appendRowData('Wallets', { user_id: userId, rn: userRn, balance: Math.max(0, initial), created_at: new Date().toISOString() });
  return { success: true, balance: Math.max(0, initial) };
}

// ==================== FAVORITES ====================

function addFavorite(payload) {
  var userId = payload.userId || payload.user_id || '';
  var serviceId = payload.serviceId || payload.service_id || '';
  if (!userId || !serviceId) return { error: 'user_id_and_service_id_required' };
  var users = sheetToObjects(getOrCreateSheet('Users'));
  var userRn = '';
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) { userRn = users[i].rn || ''; break; }
  }
  ensureHeaders('Favorites', ['user_id','rn','service_id','created_at']);
  appendRowData('Favorites', { user_id: userId, rn: userRn, service_id: serviceId, created_at: new Date().toISOString() });
  return { success: true };
}

function removeFavorite(payload) {
  var userId = payload.userId || payload.user_id || '';
  var serviceId = payload.serviceId || payload.service_id || '';
  if (!userId || !serviceId) return { error: 'user_id_and_service_id_required' };
  var sheet = getOrCreateSheet('Favorites');
  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(userId) && String(data[r][2]) === String(serviceId)) {
      sheet.deleteRow(r + 1);
      return { success: true };
    }
  }
  return { error: 'not_found' };
}

function getFavorites(payload) {
  var userId = payload.userId || payload.user_id || '';
  if (!userId) return [];
  ensureHeaders('Favorites', ['user_id','rn','service_id','created_at']);
  var all = sheetToObjects(getOrCreateSheet('Favorites'));
  var out = [];
  for (var i = 0; i < all.length; i++) {
    if (String(all[i].user_id) === String(userId)) {
      out.push(all[i]);
    }
  }
  return out;
}

// ==================== REVIEWS ====================

function addReview(payload) {
  var serviceId = payload.service_id || payload.serviceId || '';
  var userId = payload.user_id || payload.userId || '';
  var rating = parseFloat(payload.rating) || 0;
  var comment = (payload.comment || '').toString();
  if (!serviceId || !userId) return { error: 'service_id_and_user_id_required' };
  if (rating < 1 || rating > 5) return { error: 'rating_must_be_1_to_5' };

  var users = sheetToObjects(getOrCreateSheet('Users'));
  var userRn = '', userName = '';
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) { userRn = users[i].rn || ''; userName = users[i].name || ''; break; }
  }

  var id = generateId('rev');
  ensureHeaders('Reviews', ['id','service_id','user_id','rn','user_name','rating','comment','created_at']);
  appendRowData('Reviews', {
    id: id,
    service_id: serviceId,
    user_id: userId,
    rn: userRn,
    user_name: userName,
    rating: rating,
    comment: comment,
    created_at: new Date().toISOString()
  });
  return { success: true, id: id };
}

function getReviews(payload) {
  ensureHeaders('Reviews', ['id','service_id','user_id','rn','user_name','rating','comment','created_at']);
  var all = sheetToObjects(getOrCreateSheet('Reviews'));
  var serviceId = payload.service_id || payload.serviceId || '';
  if (serviceId) {
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (String(all[i].service_id) === String(serviceId)) {
        filtered.push(all[i]);
      }
    }
    return filtered;
  }
  return all;
}

// ==================== MESSAGES ====================

function sendMessage(payload) {
  var fromUser = payload.from || payload.from_user || payload.fromUser || '';
  var toUser = payload.toUser || payload.to_user || payload.to || '';
  var content = (payload.content || payload.message || '').toString();
  if (!fromUser || !toUser || !content) return { error: 'from_to_content_required' };
  var id = generateId('msg');
  ensureHeaders('Messages', ['id','from_user','to_user','content','created_at']);
  appendRowData('Messages', { id: id, from_user: fromUser, to_user: toUser, content: content, created_at: new Date().toISOString() });
  return { success: true, id: id };
}

function getMessages(payload) {
  ensureHeaders('Messages', ['id','from_user','to_user','content','created_at']);
  var all = sheetToObjects(getOrCreateSheet('Messages'));
  var user1 = payload.user1 || payload.from_user || '';
  var user2 = payload.user2 || payload.to_user || '';
  if (!user1 || !user2) return all;
  var filtered = [];
  for (var i = 0; i < all.length; i++) {
    var msg = all[i];
    if ((msg.from_user === user1 && msg.to_user === user2) || (msg.from_user === user2 && msg.to_user === user1)) {
      filtered.push(msg);
    }
  }
  return filtered;
}

// ==================== VERIFICATION ====================

function requestVerification(payload) {
  var userId = payload.user_id || payload.userId || '';
  var fileUrl = payload.file_url || '';
  var docType = payload.doc_type || payload.purpose || 'id_card';
  if (!userId || !fileUrl) return { error: 'user_id_and_file_url_required' };

  var users = sheetToObjects(getOrCreateSheet('Users'));
  var userRn = '';
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) { userRn = users[i].rn || ''; break; }
  }

  var id = generateId('ver');
  ensureHeaders('Verifications', ['id','user_id','rn','file_url','doc_type','status','notes','created_at']);
  appendRowData('Verifications', {
    id: id, user_id: userId, rn: userRn,
    file_url: fileUrl, doc_type: docType,
    status: 'pending', notes: '',
    created_at: new Date().toISOString()
  });
  return { success: true, id: id };
}

function getVerifications() {
  ensureHeaders('Verifications', ['id','user_id','rn','file_url','doc_type','status','notes','created_at']);
  return sheetToObjects(getOrCreateSheet('Verifications'));
}

function updateVerificationStatus(payload) {
  var verId = payload.verification_id || payload.id || '';
  var status = payload.status || '';
  var notes = payload.notes || payload.review_notes || '';
  if (!verId || !status) return { error: 'verification_id_and_status_required' };
  var sheet = getOrCreateSheet('Verifications');
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { error: 'verification_not_found' };
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  var notesCol = headers.indexOf('notes');
  var fileUrlCol = headers.indexOf('file_url');
  var userIdCol = headers.indexOf('user_id');
  if (idCol < 0) return { error: 'no_id_column' };

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(verId)) {
      if (statusCol >= 0) sheet.getRange(r + 1, statusCol + 1).setValue(status);
      if (notesCol >= 0 && notes) sheet.getRange(r + 1, notesCol + 1).setValue(notes);

      // If approved, set user's avatar_url and verified flag in Users sheet
      var statLower = String(status).toLowerCase();
      if (statLower === 'approved' || statLower === 'accept' || statLower === 'accepted') {
        var userId = (userIdCol >= 0) ? String(data[r][userIdCol]) : '';
        var fileUrl = (fileUrlCol >= 0) ? String(data[r][fileUrlCol]) : '';
        if (userId) {
          ensureHeaders('Users', ['id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
          var uSheet = getOrCreateSheet('Users');
          var uData = uSheet.getDataRange().getValues();
          var uHeaders = uData[0];
          var uIdCol = uHeaders.indexOf('id');
          var uVerCol = uHeaders.indexOf('verified');
          var uAvatarCol = uHeaders.indexOf('avatar_url');
          for (var ur = 1; ur < uData.length; ur++) {
            if (String(uData[ur][uIdCol]) === String(userId)) {
              if (uAvatarCol >= 0 && fileUrl) uSheet.getRange(ur + 1, uAvatarCol + 1).setValue(fileUrl);
              if (uVerCol >= 0) uSheet.getRange(ur + 1, uVerCol + 1).setValue('true');
              break;
            }
          }
        }
      }

      return { success: true };
    }
  }
  return { error: 'verification_not_found' };
}

function updateUserVerification(payload) {
  var userId = payload.user_id || payload.userId || '';
  var status = payload.status || 'approved';
  var avatar = payload.avatar_url || payload.avatar || payload.file_url || '';
  if (!userId) return { error: 'user_id_required' };
  ensureHeaders('Users', ['id','seller_id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
  var sheet = getOrCreateSheet('Users');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var verCol = headers.indexOf('verified');
  var avatarCol = headers.indexOf('avatar_url');
  if (idCol < 0 || verCol < 0) return { error: 'columns_not_found' };
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(userId)) {
      sheet.getRange(r + 1, verCol + 1).setValue(status === 'approved' ? 'true' : '');
      if (avatarCol >= 0 && avatar) sheet.getRange(r + 1, avatarCol + 1).setValue(avatar);
      return { success: true, user_id: userId, verified: status === 'approved' };
    }
  }
  return { error: 'user_not_found' };
}

// ==================== ADMIN ====================

function getAllUsers() {
  ensureHeaders('Users', ['id','seller_id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
  var all = sheetToObjects(getOrCreateSheet('Users'));
  var out = [];
  for (var i = 0; i < all.length; i++) {
    out.push({
      id: all[i].id,
      seller_id: all[i].seller_id || '',
      rn: all[i].rn || '',
      name: all[i].name,
      email: all[i].email,
      role: all[i].role,
      verified: all[i].verified === 'true',
      avatar_url: all[i].avatar_url || '',
      id_card_url: all[i].id_card_url || '',
      phone: all[i].phone || '',
      created_at: all[i].created_at || ''
    });
  }
  return out;
}

function getDashboardStats() {
  var users = sheetToObjects(getOrCreateSheet('Users'));
  var orders = sheetToObjects(getOrCreateSheet('Orders'));
  var services = sheetToObjects(getOrCreateSheet('Services'));
  var transactions = sheetToObjects(getOrCreateSheet('Transactions'));

  var totalUsers = users.length;
  var totalOrders = orders.length;
  var totalServices = services.length;

  var pendingOrders = 0;
  var completedOrders = 0;
  var totalRevenue = 0;
  var totalCommission = 0;

  for (var i = 0; i < orders.length; i++) {
    var price = parseFloat(orders[i].price) || 0;
    totalRevenue += price;
    totalCommission += price * PLATFORM_COMMISSION;
    if (orders[i].status === 'completed' || orders[i].status === 'done') completedOrders++;
    if (orders[i].status === 'pending' || orders[i].status === 'in_progress') pendingOrders++;
  }

  var verifiedUsers = 0;
  for (var i = 0; i < users.length; i++) {
    if (users[i].verified === 'true') verifiedUsers++;
  }

  return {
    success: true,
    stats: {
      totalUsers: totalUsers,
      totalOrders: totalOrders,
      totalServices: totalServices,
      pendingOrders: pendingOrders,
      completedOrders: completedOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      verifiedUsers: verifiedUsers,
      transactionsCount: transactions.length
    }
  };
}

function getAdminDashboardStats() {
  // ensure sheet headers exist so sheetToObjects reads rows properly
  ensureHeaders('Users', ['id','seller_id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
  ensureHeaders('Orders', ['id','rn','user_id','seller_id','service_id','title','price','status','buyer_rn','seller_rn','buyer_phone','seller_phone','notes','created_at']);
  ensureHeaders('Services', ['id','seller_rn','title','description','price','media_url','category','seller_id','seller_name','rating','reviews','status','created_at']);
  ensureHeaders('Transactions', ['id','rn','order_id','user_id','type','amount','commission','seller_gets','description','status','created_at']);
  ensureHeaders('Verifications', ['id','user_id','rn','file_url','doc_type','status','notes','created_at']);
  ensureHeaders('WithdrawalRequests', ['id','user_id','rn','seller_name','amount','method','account','status','notes','created_at','updated_at']);
  ensureHeaders('Disputes', ['id','order_id','user_id','seller_id','title','description','status','resolution','created_at','updated_at']);

  var users = sheetToObjects(getOrCreateSheet('Users'));
  var orders = sheetToObjects(getOrCreateSheet('Orders'));
  var services = sheetToObjects(getOrCreateSheet('Services'));
  var transactions = sheetToObjects(getOrCreateSheet('Transactions'));
  var verifications = sheetToObjects(getOrCreateSheet('Verifications'));
  var withdrawals = sheetToObjects(getOrCreateSheet('WithdrawalRequests'));
  var disputes = sheetToObjects(getOrCreateSheet('Disputes'));

  var totalRevenue = 0;
  var totalCommission = 0;
  var pendingOrders = 0;
  var completedOrders = 0;
  var verifiedUsers = 0;
  var pendingVerify = 0;
  var pendingWithdrawals = 0;
  var openDisputes = 0;
  var sellerCount = 0;
  var buyerCount = 0;

  for (var i = 0; i < users.length; i++) {
    if (users[i].role === 'seller') sellerCount++;
    if (users[i].role === 'buyer') buyerCount++;
    if (users[i].verified === 'true') verifiedUsers++;
    if (users[i].role !== 'admin' && users[i].avatar_url && users[i].id_card_url && users[i].verified !== 'true') pendingVerify++;
  }

  for (var o = 0; o < orders.length; o++) {
    var price = parseFloat(orders[o].price) || 0;
    totalRevenue += price;
    totalCommission += price * PLATFORM_COMMISSION;
    if (orders[o].status === 'completed' || orders[o].status === 'done') completedOrders++;
    if (orders[o].status === 'pending' || orders[o].status === 'in_progress') pendingOrders++;
  }

  for (var w = 0; w < withdrawals.length; w++) {
    var wStatus = String(withdrawals[w].status || '').toLowerCase();
    if (wStatus === 'pending' || wStatus === 'requested' || wStatus === 'under_review') pendingWithdrawals++;
  }

  for (var d = 0; d < disputes.length; d++) {
    var dStatus = String(disputes[d].status || '').toLowerCase();
    if (dStatus === 'open' || dStatus === 'pending' || dStatus === 'under_review') openDisputes++;
  }

  return {
    success: true,
    stats: {
      totalUsers: users.length,
      totalOrders: orders.length,
      totalServices: services.length,
      totalTransactions: transactions.length,
      totalVerifications: verifications.length,
      totalWithdrawals: withdrawals.length,
      totalDisputes: disputes.length,
      sellerCount: sellerCount,
      buyerCount: buyerCount,
      verifiedUsers: verifiedUsers,
      pendingVerify: pendingVerify,
      pendingOrders: pendingOrders,
      completedOrders: completedOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      pendingWithdrawals: pendingWithdrawals,
      openDisputes: openDisputes
    }
  };
}

function getWithdrawalRequests(payload) {
  ensureHeaders('WithdrawalRequests', ['id','user_id','rn','seller_name','amount','method','account','status','notes','created_at','updated_at']);
  var all = sheetToObjects(getOrCreateSheet('WithdrawalRequests'));
  var status = payload && payload.status ? String(payload.status).toLowerCase() : '';
  if (status) {
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (String(all[i].status || '').toLowerCase() === status) filtered.push(all[i]);
    }
    return filtered;
  }
  return all;
}

function requestWithdrawal(payload) {
  var userId = payload.user_id || payload.userId || '';
  var amount = parseFloat(payload.amount) || 0;
  var method = (payload.method || payload.payout_method || 'wallet').toString();
  var account = (payload.account || payload.destination || '').toString();
  var notes = (payload.notes || '').toString();
  if (!userId) return { error: 'user_id_required' };
  if (amount <= 0) return { error: 'amount_must_be_positive' };

  var users = sheetToObjects(getOrCreateSheet('Users'));
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].id) === String(userId)) { user = users[i]; break; }
  }
  if (!user) return { error: 'user_not_found' };

  var wallet = getWallet({ userId: userId });
  if ((parseFloat(wallet.balance) || 0) < amount) return { error: 'رصيد غير كافي' };

  var now = new Date().toISOString();
  var requestId = generateId('wd');
  ensureHeaders('WithdrawalRequests', ['id','user_id','rn','seller_name','amount','method','account','status','notes','created_at','updated_at']);
  appendRowData('WithdrawalRequests', {
    id: requestId,
    user_id: userId,
    rn: user.rn || '',
    seller_name: user.name || '',
    amount: amount,
    method: method,
    account: account,
    status: 'pending',
    notes: notes,
    created_at: now,
    updated_at: now
  });

  return { success: true, id: requestId, status: 'pending' };
}

function updateWithdrawalStatus(payload) {
  var requestId = payload.request_id || payload.id || '';
  var status = (payload.status || '').toString().toLowerCase();
  var notes = (payload.notes || '').toString();
  if (!requestId) return { error: 'request_id_required' };
  if (!status) return { error: 'status_required' };

  var sheet = getOrCreateSheet('WithdrawalRequests');
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { error: 'request_not_found' };
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  var notesCol = headers.indexOf('notes');
  var updatedCol = headers.indexOf('updated_at');
  var userCol = headers.indexOf('user_id');
  var amountCol = headers.indexOf('amount');
  if (idCol < 0) return { error: 'no_id_column' };

  var valid = { pending: true, approved: true, rejected: true, completed: true, under_review: true };
  if (!valid[status]) return { error: 'invalid_status' };

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(requestId)) {
      if (statusCol >= 0) sheet.getRange(r + 1, statusCol + 1).setValue(status);
      if (notesCol >= 0 && notes) sheet.getRange(r + 1, notesCol + 1).setValue(notes);
      if (updatedCol >= 0) sheet.getRange(r + 1, updatedCol + 1).setValue(new Date().toISOString());

      if (status === 'approved' || status === 'completed') {
        var userId = userCol >= 0 ? String(data[r][userCol]) : '';
        var amount = amountCol >= 0 ? parseFloat(data[r][amountCol]) || 0 : 0;
        if (userId && amount > 0) {
          var walletState = getWallet({ userId: userId });
          var currentBalance = parseFloat(walletState.balance) || 0;
          if (currentBalance >= amount) {
            updateWallet({ userId: userId, amount: amount, operation: 'deduct' });
          }
          ensureHeaders('Transactions', ['id','rn','order_id','user_id','type','amount','commission','seller_gets','description','status','created_at']);
          appendRowData('Transactions', {
            id: generateId('txn'),
            rn: '',
            order_id: '',
            user_id: userId,
            type: 'withdraw',
            amount: amount,
            commission: 0,
            seller_gets: amount,
            description: 'طلب سحب',
            status: 'completed',
            created_at: new Date().toISOString()
          });
        }
      }

      return { success: true, id: requestId, status: status };
    }
  }
  return { error: 'request_not_found' };
}

function getDisputes(payload) {
  ensureHeaders('Disputes', ['id','order_id','user_id','seller_id','title','description','status','resolution','created_at','updated_at']);
  var all = sheetToObjects(getOrCreateSheet('Disputes'));
  var status = payload && payload.status ? String(payload.status).toLowerCase() : '';
  if (status) {
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (String(all[i].status || '').toLowerCase() === status) filtered.push(all[i]);
    }
    return filtered;
  }
  return all;
}

function createDispute(payload) {
  var orderId = payload.order_id || payload.orderId || '';
  var userId = payload.user_id || payload.userId || '';
  var sellerId = payload.seller_id || payload.sellerId || '';
  var title = (payload.title || payload.subject || 'نزاع جديد').toString();
  var description = (payload.description || payload.notes || '').toString();
  if (!orderId || !userId || !sellerId) return { error: 'order_user_seller_required' };

  var users = sheetToObjects(getOrCreateSheet('Users'));
  var userName = '', sellerName = '';
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].id) === String(userId)) userName = users[i].name || '';
    if (String(users[i].id) === String(sellerId)) sellerName = users[i].name || '';
  }

  var disputeId = generateId('dsp');
  ensureHeaders('Disputes', ['id','order_id','user_id','seller_id','title','description','status','resolution','created_at','updated_at']);
  appendRowData('Disputes', {
    id: disputeId,
    order_id: orderId,
    user_id: userId,
    seller_id: sellerId,
    title: title,
    description: description,
    status: 'open',
    resolution: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  return { success: true, id: disputeId };
}

function updateDisputeStatus(payload) {
  var disputeId = payload.dispute_id || payload.id || '';
  var status = (payload.status || '').toString().toLowerCase();
  var resolution = (payload.resolution || payload.notes || '').toString();
  if (!disputeId) return { error: 'dispute_id_required' };
  if (!status) return { error: 'status_required' };

  var sheet = getOrCreateSheet('Disputes');
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { error: 'dispute_not_found' };
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  var resolutionCol = headers.indexOf('resolution');
  var updatedCol = headers.indexOf('updated_at');
  if (idCol < 0) return { error: 'no_id_column' };

  var valid = { open: true, under_review: true, resolved: true, rejected: true, refunded: true, closed: true };
  if (!valid[status]) return { error: 'invalid_status' };

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(disputeId)) {
      if (statusCol >= 0) sheet.getRange(r + 1, statusCol + 1).setValue(status);
      if (resolutionCol >= 0 && resolution) sheet.getRange(r + 1, resolutionCol + 1).setValue(resolution);
      if (updatedCol >= 0) sheet.getRange(r + 1, updatedCol + 1).setValue(new Date().toISOString());
      return { success: true, id: disputeId, status: status };
    }
  }
  return { error: 'dispute_not_found' };
}

// ==================== FILES / IMAGES ====================

function uploadImageBase64(payload) {
  var base64 = payload.base64 || '';
  var fileName = payload.fileName || generateId('img') + '.png';
  if (!base64) return { error: 'no_base64_provided' };
  var parts = base64.split(',');
  var dataPart = parts.length > 1 ? parts[1] : parts[0];
  var mime = 'image/png';
  var mimeMatch = parts[0] && parts[0].match(/data:(.*?);base64/);
  if (mimeMatch) mime = mimeMatch[1];

  try {
    var bytes = Utilities.base64Decode(dataPart);
    var folder = ensureFolder(IMAGES_FOLDER_NAME);
    var blob = Utilities.newBlob(bytes, mime, fileName);
    var file = folder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* ignore */ }
    var url = 'https://drive.google.com/uc?id=' + file.getId();
    var userRn = payload.rn || '';

    ensureHeaders('Files', ['id','rn','filename','url','content_type','size','purpose','created_at']);
    appendRowData('Files', {
      id: generateId('file'), rn: userRn,
      filename: fileName, url: url,
      content_type: mime, size: bytes.length,
      purpose: payload.purpose || 'uploaded',
      created_at: new Date().toISOString()
    });
    return { success: true, url: url, fileId: file.getId() };
  } catch (err) {
    logError('uploadImageBase64', err);
    return { error: 'فشل رفع الصورة: ' + err.message };
  }
}

function saveFileLink(payload) {
  var url = payload.url || '';
  if (!url) return { error: 'url_required' };
  ensureHeaders('Files', ['id','rn','filename','url','content_type','size','purpose','created_at']);
  appendRowData('Files', {
    id: generateId('file'),
    rn: payload.rn || '',
    filename: payload.filename || '',
    url: url,
    content_type: payload.content_type || '',
    size: payload.size || '',
    purpose: payload.purpose || '',
    created_at: new Date().toISOString()
  });
  return { success: true, file: { url: url, filename: payload.filename || '' } };
}

// ==================== TRANSACTIONS ====================

function getTransactions(payload) {
  ensureHeaders('Transactions', ['id','rn','order_id','user_id','type','amount','commission','seller_gets','description','status','created_at']);
  var all = sheetToObjects(getOrCreateSheet('Transactions'));
  var role = payload && payload.role ? payload.role : '';
  var userId = payload && payload.userId ? payload.userId : (payload && payload.user_id ? payload.user_id : '');
  if (role === 'admin') return all;
  if (userId) {
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i] && all[i].user_id === userId) filtered.push(all[i]);
    }
    return filtered;
  }
  return all;
}

// ==================== NOTIFICATIONS ====================

function sendNotification(payload) {
  var userId = payload.userId || payload.user_id || '';
  var message = (payload.message || payload.content || '').toString();
  var type = (payload.type || 'info').toString();
  if (!userId || !message) return { error: 'user_id_and_message_required' };

  var users = sheetToObjects(getOrCreateSheet('Users'));
  var userRn = '';
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) { userRn = users[i].rn || ''; break; }
  }

  var id = generateId('notif');
  ensureHeaders('Notifications', ['id','user_id','rn','message','type','read','created_at']);
  appendRowData('Notifications', {
    id: id, user_id: userId, rn: userRn,
    message: message, type: type,
    read: '', created_at: new Date().toISOString()
  });
  return { success: true, id: id };
}

function getNotifications(payload) {
  ensureHeaders('Notifications', ['id','user_id','rn','message','type','read','created_at']);
  var all = sheetToObjects(getOrCreateSheet('Notifications'));
  var userId = payload.userId || payload.user_id || '';
  var since = payload.since || '';
  if (!userId) return [];
  var filtered = [];
  for (var i = 0; i < all.length; i++) {
    if (String(all[i].user_id) === String(userId)) {
      if (!since || all[i].created_at > since) {
        filtered.push(all[i]);
      }
    }
  }
  // Sort newest first
  filtered.sort(function(a, b) { return b.created_at > a.created_at ? 1 : (b.created_at < a.created_at ? -1 : 0); });
  return filtered.slice(0, 50);
}

function getUnreadCount(payload) {
  var userId = payload.userId || payload.user_id || '';
  if (!userId) return { count: 0 };
  var all = sheetToObjects(getOrCreateSheet('Notifications'));
  var count = 0;
  for (var i = 0; i < all.length; i++) {
    if (String(all[i].user_id) === String(userId) && all[i].read !== 'true') count++;
  }
  return { count: count };
}

function markNotifRead(payload) {
  var notifId = payload.notification_id || payload.id || '';
  if (!notifId) return { error: 'notification_id_required' };
  var sheet = getOrCreateSheet('Notifications');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var readCol = headers.indexOf('read');
  if (idCol < 0 || readCol < 0) return { error: 'columns_not_found' };
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(notifId)) {
      sheet.getRange(r + 1, readCol + 1).setValue('true');
      return { success: true };
    }
  }
  return { error: 'not_found' };
}

// ==================== ADMIN FEATURES ====================

function suspendUser(payload) {
  var userId = payload.user_id || payload.userId || '';
  if (!userId) return { error: 'user_id_required' };
  ensureHeaders('Users', ['id','seller_id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
  var sheet = getOrCreateSheet('Users');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  if (idCol < 0 || statusCol < 0) return { error: 'columns_not_found' };
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(userId)) {
      sheet.getRange(r + 1, statusCol + 1).setValue('suspended');
      return { success: true };
    }
  }
  return { error: 'user_not_found' };
}

function unsuspendUser(payload) {
  var userId = payload.user_id || payload.userId || '';
  if (!userId) return { error: 'user_id_required' };
  ensureHeaders('Users', ['id','seller_id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status']);
  var sheet = getOrCreateSheet('Users');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  if (idCol < 0 || statusCol < 0) return { error: 'columns_not_found' };
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(userId)) {
      sheet.getRange(r + 1, statusCol + 1).setValue('active');
      return { success: true };
    }
  }
  return { error: 'user_not_found' };
}

function moderateService(payload) {
  var serviceId = payload.service_id || payload.id || '';
  var status = payload.status || 'blocked';
  if (!serviceId) return { error: 'service_id_required' };
  var valid = ['active', 'blocked', 'hidden'];
  if (valid.indexOf(status) < 0) return { error: 'invalid_status' };
  var sheet = getOrCreateSheet('Services');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  if (idCol < 0) return { error: 'no_id_column' };
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(serviceId)) {
      if (statusCol >= 0) sheet.getRange(r + 1, statusCol + 1).setValue(status);
      return { success: true, id: serviceId, status: status };
    }
  }
  return { error: 'service_not_found' };
}

function exportData(payload) {
  var type = payload.type || 'users';
  var data = [];
  if (type === 'users') {
    var users = sheetToObjects(getOrCreateSheet('Users'));
    data = users.map(function(u) { return {
      RN: u.rn, Name: u.name, Email: u.email,
      Role: u.role, Verified: u.verified, Phone: u.phone,
      Status: u.status || 'active', Created: u.created_at
    }; });
  } else if (type === 'orders') {
    var orders = sheetToObjects(getOrCreateSheet('Orders'));
    data = orders.map(function(o) { return {
      ID: o.id, BuyerRN: o.buyer_rn, SellerRN: o.seller_rn,
      Title: o.title, Price: o.price, Status: o.status, Created: o.created_at
    }; });
  } else if (type === 'transactions') {
    var txns = sheetToObjects(getOrCreateSheet('Transactions'));
    data = txns.map(function(t) { return {
      RN: t.rn, Type: t.type, Amount: t.amount,
      Commission: t.commission, SellerGets: t.seller_gets,
      Status: t.status, Created: t.created_at
    }; });
  }
  return { success: true, data: data, count: data.length };
}

// ==================== UTILITY ====================

function testConnection() {
  return {
    success: true,
    message: 'SkillMate GAS v2.0 connected',
    timestamp: new Date().toISOString(),
    version: '2.0',
    features: ['auth','services','orders','wallet','messages','verification','files','transactions']
  };
}

function setupAllSheets() {
  var definitions = {
    Users: ['id','seller_id','rn','name','email','password','role','verified','avatar_url','id_card_url','phone','created_at','status'],
    Categories: ['id','name','icon','order'],
    Services: ['id','seller_rn','title','description','price','media_url','category','seller_id','seller_name','rating','reviews','status','created_at'],
    Orders: ['id','rn','user_id','seller_id','service_id','title','price','status','buyer_rn','seller_rn','buyer_phone','seller_phone','notes','created_at'],
    Wallets: ['user_id','rn','balance','created_at'],
    Favorites: ['user_id','rn','service_id','created_at'],
    Messages: ['id','from_user','to_user','content','created_at'],
    Verifications: ['id','user_id','rn','file_url','doc_type','status','notes','created_at'],
    WithdrawalRequests: ['id','user_id','rn','seller_name','amount','method','account','status','notes','created_at','updated_at'],
    Disputes: ['id','order_id','user_id','seller_id','title','description','status','resolution','created_at','updated_at'],
    Reviews: ['id','service_id','user_id','rn','user_name','rating','comment','created_at'],
    Files: ['id','rn','filename','url','content_type','size','purpose','created_at'],
    Transactions: ['id','rn','order_id','user_id','type','amount','commission','seller_gets','description','status','created_at'],
    Notifications: ['id','user_id','rn','message','type','read','created_at'],
    _Logs: ['timestamp','context','message','stack']
  };
  var names = Object.keys(definitions);
  for (var i = 0; i < names.length; i++) {
    ensureHeaders(names[i], definitions[names[i]]);
  }

  var catSheet = getOrCreateSheet('Categories');
  var cats = sheetToObjects(catSheet);
  if (cats.length === 0) {
    var defaults = [
      { id: 'cat-video', name: 'فيديو ومونتاج', icon: 'fa-solid fa-video', order: '1' },
      { id: 'cat-marketing', name: 'تسويق رقمي', icon: 'fa-solid fa-bullhorn', order: '2' },
      { id: 'cat-writing', name: 'كتابة وترجمة', icon: 'fa-solid fa-pen-nib', order: '3' },
      { id: 'cat-dev', name: 'برمجة وتطوير', icon: 'fa-solid fa-code', order: '4' },
      { id: 'cat-design', name: 'تصميم جرافيك', icon: 'fa-solid fa-palette', order: '5' }
    ];
    for (var d = 0; d < defaults.length; d++) {
      appendRowData('Categories', defaults[d]);
    }
  }

  return { success: true, sheets: names };
}

function resetAllData() {
  var names = ['Users','Categories','Services','Orders','Wallets','Favorites','Messages','Verifications','WithdrawalRequests','Disputes','Reviews','Files','Transactions','Notifications','_Logs'];
  var ss = getSpreadsheet();
  for (var i = 0; i < names.length; i++) {
    var sh = ss.getSheetByName(names[i]);
    if (sh) ss.deleteSheet(sh);
  }
  return setupAllSheets();
}

function repairOldUsers() {
  var sheet = getOrCreateSheet('Users');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, fixed: 0 };
  var headers = data[0];
  var colId = headers.indexOf('id');
  var colName = headers.indexOf('name');
  var colEmail = headers.indexOf('email');
  var colPass = headers.indexOf('password');
  var colRole = headers.indexOf('role');
  var colRn = headers.indexOf('rn');
  var fixed = 0;

  for (var r = 1; r < data.length; r++) {
    var id = colId >= 0 ? String(data[r][colId] || '') : '';
    var email = colEmail >= 0 ? String(data[r][colEmail] || '') : '';
    var pass = colPass >= 0 ? String(data[r][colPass] || '') : '';
    var role = colRole >= 0 ? String(data[r][colRole] || '') : '';
    var rn = colRn >= 0 ? String(data[r][colRn] || '') : '';
    var corrupted = false;

    if ((id.indexOf('user-') !== 0 || email.indexOf('@') < 0) && colPass >= 0) corrupted = true;
    if (!corrupted && colPass >= 0 && (pass === 'buyer' || pass === 'seller' || pass === 'admin')) corrupted = true;
    if (!corrupted && colRole >= 0 && role !== 'buyer' && role !== 'seller' && role !== 'admin' && role !== '' && role !== undefined) corrupted = true;

    if (!corrupted) {
      if (!rn && colRn >= 0) {
        sheet.getRange(r + 1, colRn + 1).setValue(generateRN());
        fixed++;
      }
      continue;
    }

    var rowValues = data[r];
    var foundEmail = '', foundPass = '', foundRole = 'buyer', foundName = '';
    for (var c = 0; c < rowValues.length; c++) {
      var val = String(rowValues[c] || '').trim();
      if (val.indexOf('@') > 0 && val.indexOf('.') > 0 && !foundEmail) foundEmail = val;
      if (val.length >= 3 && val.length <= 30 && !foundPass && val !== foundEmail && val !== 'buyer' && val !== 'seller' && val !== 'admin') foundPass = val;
      if (val === 'buyer' || val === 'seller' || val === 'admin') foundRole = val;
    }
    if (foundEmail && foundPass) {
      if (colId >= 0) sheet.getRange(r + 1, colId + 1).setValue('user-' + Math.floor(Math.random() * 900000 + 100000) + '-' + Date.now());
      if (colEmail >= 0) sheet.getRange(r + 1, colEmail + 1).setValue(foundEmail);
      if (colPass >= 0) sheet.getRange(r + 1, colPass + 1).setValue(hashPassword(foundPass));
      if (colRole >= 0) sheet.getRange(r + 1, colRole + 1).setValue(foundRole);
      if (colRn >= 0) sheet.getRange(r + 1, colRn + 1).setValue(generateRN());
      fixed++;
    }
  }
  return { success: true, fixed: fixed };
}
