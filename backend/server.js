require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this';

let supabase = null;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_KEY missing. Some features (DB, storage) will be disabled.');
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Helpers
function sign(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

async function getUserByEmail(email) {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

async function getUserById(id) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing auth' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.id);
    if (!user) return res.status(401).json({ error: 'user not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'email exists' });
    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert([{ name, email, password_hash: hash, role: role || 'buyer' }]).select().single();
    if (error) throw error;
    const token = sign(data);
    res.json({ user: data, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = sign(user);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List services
app.get('/services', async (req, res) => {
  const { data, error } = await supabase.from('services').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Create service (seller)
app.post('/services', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ error: 'only sellers can create services' });
    const { title, description, price, media_url } = req.body;
    const { data, error } = await supabase.from('services').insert([{ seller_id: req.user.id, title, description, price, media_url }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create order and transfer funds (calls DB RPC)
app.post('/orders', authMiddleware, async (req, res) => {
  try {
    const { service_id } = req.body;
    if (!service_id) return res.status(400).json({ error: 'service_id required' });
    // Call the DB function to create order and transfer funds atomically
    const { data, error } = await supabase.rpc('create_order_with_transfer', { buyer_uuid: req.user.id, svc_id: service_id });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true, order_id: data && data[0] && data[0].order_id ? data[0].order_id : data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Messaging
app.post('/messages', authMiddleware, async (req, res) => {
  try {
    const { to_user, content } = req.body;
    if (!to_user || !content) return res.status(400).json({ error: 'to_user and content required' });
    const { data, error } = await supabase.from('messages').insert([{ from_user: req.user.id, to_user, content }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload file to Supabase Storage and record in 'files' table
app.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const purpose = req.body.purpose || req.query.purpose || 'other';
    const bucket = 'uploads';
    const filename = `${req.user.id}/${Date.now()}_${req.file.originalname}`.replace(/\s+/g, '_');
    // upload to supabase storage
    if (!supabase) return res.status(500).json({ error: 'supabase_not_configured' });
    const { data: uploadData, error: uploadErr } = await supabase.storage.from(bucket).upload(filename, req.file.buffer, { contentType: req.file.mimetype });
    if (uploadErr) return res.status(500).json({ error: uploadErr.message || uploadErr });
    // get public url
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filename);
    const publicUrl = publicData && publicData.publicUrl ? publicData.publicUrl : null;
    // record in files table
    const fileRecord = {
      owner_id: req.user.id,
      bucket,
      path: filename,
      url: publicUrl,
      filename: req.file.originalname,
      content_type: req.file.mimetype,
      size: req.file.size,
      purpose
    };
    const { data: fileData, error: fileErr } = await supabase.from('files').insert([fileRecord]).select().single();
    if (fileErr) return res.status(500).json({ error: fileErr.message || fileErr });
    // If purpose is avatar or id_card, update users table
    if (purpose === 'avatar') {
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', req.user.id);
    }
    if (purpose === 'id_card') {
      await supabase.from('users').update({ id_card_url: publicUrl }).eq('id', req.user.id);
      await supabase.from('verification_documents').insert([{ user_id: req.user.id, file_id: fileData.id, doc_type: 'id_card', status: 'pending' }]);
    }
    res.json({ ok: true, file: fileData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save an externally-hosted file link (e.g., uploaded to 0x0.st) into the files table
app.post('/save-file-link', authMiddleware, async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'supabase_not_configured' });
    const { url, filename, content_type, size, purpose } = req.body;
    if (!url || !filename) return res.status(400).json({ error: 'url and filename required' });
    const record = {
      owner_id: req.user.id,
      bucket: 'external',
      path: filename,
      url,
      filename,
      content_type: content_type || 'application/octet-stream',
      size: size || 0,
      purpose: purpose || 'service_media'
    };
    const { data, error } = await supabase.from('files').insert([record]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, file: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List user's uploaded files
app.get('/files', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('files').select('*').eq('owner_id', req.user.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/messages/:withUser', authMiddleware, async (req, res) => {
  try {
    const other = req.params.withUser;
    const { data, error } = await supabase.from('messages').select('*').or(`and(from_user.eq.${req.user.id},to_user.eq.${other}),and(from_user.eq.${other},to_user.eq.${req.user.id}))`);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoints
app.get('/admin/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin required' });
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/admin/service/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin required' });
  const { id } = req.params;
  const { data, error } = await supabase.from('services').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
