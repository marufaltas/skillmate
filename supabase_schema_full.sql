
-- حذف جميع الجداول القديمة (يرجى الحذر: هذا يمسح كل البيانات)
DROP TABLE IF EXISTS service_images, verification_documents, favorites, audit_logs, notifications, payouts, withdrawal_requests, files, reviews, messages, transactions, orders, services, users, service_categories CASCADE;

-- جدول المستخدمين
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer', -- buyer | seller | admin
  avatar_url TEXT,
  id_card_url TEXT,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- جدول التصنيفات
CREATE TABLE service_categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);


-- جدول الملفات (صور/مستندات)
CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL DEFAULT 'uploads',
  path TEXT NOT NULL,
  url TEXT,
  filename TEXT,
  content_type TEXT,
  size BIGINT,
  metadata JSONB DEFAULT '{}',
  purpose TEXT, -- avatar | id_card | cert | service_media | other
  created_at TIMESTAMPTZ DEFAULT now()
);




-- جدول الخدمات
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  media_url TEXT,
  category_id INT REFERENCES service_categories(id),
  estimated_duration TEXT,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول صور الخدمات (متعدد الصور)
CREATE TABLE service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  file_id uuid REFERENCES files(id) ON DELETE SET NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول الطلبات
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | completed | cancelled
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول المعاملات المالية
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid REFERENCES users(id),
  to_user uuid REFERENCES users(id),
  amount NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول الرسائل
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid REFERENCES users(id),
  to_user uuid REFERENCES users(id),
  content TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول التقييمات
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);



-- جدول طلبات التوثيق
CREATE TABLE verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  file_id uuid REFERENCES files(id) ON DELETE SET NULL,
  doc_type TEXT, -- id_card | passport | certificate
  status TEXT DEFAULT 'pending', -- pending | approved | rejected
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- جدول المفضلة
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, service_id)
);

-- جدول الإشعارات
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول السحب المالي
CREATE TABLE withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT, -- bank | vodafone | orange | paypal
  details JSONB,
  status TEXT DEFAULT 'pending', -- pending | processed | rejected
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول التحويلات المالية (payouts)
CREATE TABLE payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id uuid REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  provider_response JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول سجل العمليات (audit logs)
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action TEXT NOT NULL,
  object_type TEXT,
  object_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- حسابات افتراضية تجريبية
INSERT INTO users (id, name, email, password, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'مشتري تجريبي', 'buyer@test.com', '123456', 'buyer'),
  ('22222222-2222-2222-2222-222222222222', 'بائع تجريبي', 'seller@test.com', '123456', 'seller'),
  ('33333333-3333-3333-3333-333333333333', 'أدمن تجريبي', 'admin@test.com', '123456', 'admin');

-- تصنيفات افتراضية
INSERT INTO service_categories (name) VALUES ('برمجة'), ('تصميم'), ('كتابة'), ('تسويق') ON CONFLICT DO NOTHING;
