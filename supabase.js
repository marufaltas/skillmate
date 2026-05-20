// إعداد Supabase
const SUPABASE_URL = "https://umiwxnmqncaanuqumsqj.supabase.co"; // ضع رابط مشروعك هنا
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtaXd4bm1xbmNhYW51cXVtc3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjI4NTEsImV4cCI6MjA5NDUzODg1MX0.yomJ1dSPslceq70ca9m9-jpgKABMVyHXnKM_WWN3Oqc"; // ضع public key هنا
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// تسجيل الدخول
async function doLogin(email, password) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();
  if (error || !data) throw new Error('بيانات الدخول غير صحيحة');
  localStorage.setItem('user', JSON.stringify(data));
  return data;
}

// تسجيل مستخدم جديد
async function doRegister(name, email, password, role = 'buyer') {
  const { error } = await supabase
    .from('users')
    .insert([{ name, email, password, role }]);
  if (error) throw error;
  return true;
}

// رفع ملف (صورة/هوية/خدمة)
async function uploadFile(file, purpose = 'avatar') {
  const user = JSON.parse(localStorage.getItem('user'));
  const filePath = `${purpose}/${user.id}_${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('uploads').upload(filePath, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
  return urlData.publicUrl;
}

// إضافة خدمة جديدة
async function addService({ title, description, price, media_url, category_id, estimated_duration }) {
  const user = JSON.parse(localStorage.getItem('user'));
  const { error } = await supabase.from('services').insert([{
    seller_id: user.id,
    title,
    description,
    price,
    media_url,
    category_id,
    estimated_duration
  }]);
  if (error) throw error;
  return true;
}

// جلب كل الخدمات
async function fetchServices() {
  const { data, error } = await supabase.from('services').select('*');
  if (error) throw error;
  return data;
}

// جلب كل التصنيفات
async function fetchCategories() {
  const { data, error } = await supabase.from('service_categories').select('*');
  if (error) throw error;
  return data;
}

// جلب بيانات المستخدم الحالي
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user'));
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem('user');
}

// إضافة تقييم
async function addReview(service_id, rating, comment) {
  const user = getCurrentUser();
  const { error } = await supabase.from('reviews').insert([{
    service_id,
    reviewer_id: user.id,
    rating,
    comment
  }]);
  if (error) throw error;
  return true;
}

// إرسال رسالة
async function sendMessage(to_user, content) {
  const user = getCurrentUser();
  const { error } = await supabase.from('messages').insert([{
    from_user: user.id,
    to_user,
    content
  }]);
  if (error) throw error;
  return true;
}

// طلب توثيق
async function requestVerification(file_id, doc_type = 'id_card') {
  const user = getCurrentUser();
  const { error } = await supabase.from('verification_documents').insert([{
    user_id: user.id,
    file_id,
    doc_type
  }]);
  if (error) throw error;
  return true;
}

// إضافة خدمة للمفضلة
async function addFavorite(service_id) {
  const user = getCurrentUser();
  const { error } = await supabase.from('favorites').insert([{
    user_id: user.id,
    service_id
  }]);
  if (error) throw error;
  return true;
}

// حذف خدمة من المفضلة
async function removeFavorite(service_id) {
  const user = getCurrentUser();
  const { error } = await supabase.from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('service_id', service_id);
  if (error) throw error;
  return true;
}

// جلب المفضلة
async function fetchFavorites() {
  const user = getCurrentUser();
  const { data, error } = await supabase.from('favorites').select('service_id').eq('user_id', user.id);
  if (error) throw error;
  return data.map(f => f.service_id);
}

// جلب الطلبات
async function fetchOrders() {
  const user = getCurrentUser();
  const { data, error } = await supabase.from('orders').select('*').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
  if (error) throw error;
  return data;
}

// إنشاء طلب جديد
async function createOrder(service_id, amount) {
  const user = getCurrentUser();
  // تحديد البائع من الخدمة
  const { data: service } = await supabase.from('services').select('seller_id').eq('id', service_id).single();
  const { error } = await supabase.from('orders').insert([{
    buyer_id: user.id,
    service_id,
    seller_id: service.seller_id,
    amount,
    status: 'pending'
  }]);
  if (error) throw error;
  return true;
}

// جلب الإشعارات
async function fetchNotifications() {
  const user = getCurrentUser();
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id);
  if (error) throw error;
  return data;
}

// جلب كل المستخدمين (للأدمن)
async function fetchAllUsers() {
  const user = getCurrentUser();
  if (user.role !== 'admin') throw new Error('غير مصرح');
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
}

// جلب كل الطلبات (للأدمن)
async function fetchAllOrders() {
  const user = getCurrentUser();
  if (user.role !== 'admin') throw new Error('غير مصرح');
  const { data, error } = await supabase.from('orders').select('*');
  if (error) throw error;
  return data;
}

// جلب طلبات التوثيق (للأدمن)
async function fetchAllVerifications() {
  const user = getCurrentUser();
  if (user.role !== 'admin') throw new Error('غير مصرح');
  const { data, error } = await supabase.from('verification_documents').select('*');
  if (error) throw error;
  return data;
}

// تحديث حالة التوثيق (للأدمن)
async function updateVerificationStatus(verification_id, status, review_notes = null) {
  const user = getCurrentUser();
  if (user.role !== 'admin') throw new Error('غير مصرح');
  const { error } = await supabase.from('verification_documents')
    .update({ status, review_notes, reviewed_at: new Date().toISOString() })
    .eq('id', verification_id);
  if (error) throw error;
  return true;
}

// دوال أخرى يمكن إضافتها حسب الحاجة
