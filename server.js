const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPA_URL = 'https://rkpnprhatxidaneyuxmw.supabase.co';
const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve portal_demo_v2.html as root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'portal_demo_v2.html'));
});

// /app → 毎日使うユーザー専用入り口（LP省略）
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'portal_demo_v2.html'));
});

// /portal → メンバー向けスタンドアロンポータル（スケール変換なし、完全操作可能）
app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'portal.html'));
});

// /api/invite → Supabase Admin APIでメール招待（service_role key必須）
app.post('/api/invite', async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'メールアドレスが必要です' });
  if (!SUPA_SERVICE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY が設定されていません' });

  const siteUrl = process.env.SITE_URL || `http://localhost:${PORT}`;
  const body = JSON.stringify({
    email,
    data: { role: role || 'member' },
    redirect_to: `${siteUrl}/portal`
  });

  const options = {
    hostname: 'rkpnprhatxidaneyuxmw.supabase.co',
    path: '/auth/v1/invite',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPA_SERVICE_KEY,
      'Authorization': `Bearer ${SUPA_SERVICE_KEY}`,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (response.statusCode >= 400) {
          return res.status(response.statusCode).json({ error: json.msg || json.message || '招待に失敗しました' });
        }
        res.json({ success: true });
      } catch(e) {
        res.status(500).json({ error: '応答の解析に失敗しました' });
      }
    });
  });

  request.on('error', (e) => res.status(500).json({ error: e.message }));
  request.write(body);
  request.end();
});

// /api/delete-user → Supabase Admin APIでユーザー完全削除（auth.users + profiles両方）
app.delete('/api/delete-user/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'ユーザーIDが必要です' });
  if (!SUPA_SERVICE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY が設定されていません' });

  const options = {
    hostname: 'rkpnprhatxidaneyuxmw.supabase.co',
    path: `/auth/v1/admin/users/${userId}`,
    method: 'DELETE',
    headers: {
      'apikey': SUPA_SERVICE_KEY,
      'Authorization': `Bearer ${SUPA_SERVICE_KEY}`,
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      if (response.statusCode >= 400) {
        try {
          const json = JSON.parse(data);
          return res.status(response.statusCode).json({ error: json.msg || json.message || '削除に失敗しました' });
        } catch(e) {
          return res.status(response.statusCode).json({ error: '削除に失敗しました' });
        }
      }
      res.json({ success: true });
    });
  });

  request.on('error', (e) => res.status(500).json({ error: e.message }));
  request.end();
});

app.listen(PORT, () => {
  console.log(`AI社内ポータルBuilder running on port ${PORT}`);
});
