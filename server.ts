import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { ROUTE_LIST } from "./src/lib/routes-config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust environment variable loading for Hostinger and local setups
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '..', '.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Initialize Supabase Admin Client resiliently (prevents startup crash if env is missing)
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "dummy_key_to_prevent_startup_crash";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

if (supabaseUrl === "https://placeholder.supabase.co" || supabaseServiceKey === "dummy_key_to_prevent_startup_crash") {
  console.warn("⚠️ WARNING: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Supabase admin features will fail.");
}

function safeAppendLog(fileName: string, content: string) {
  try {
    const logDir = path.resolve(process.cwd(), 'scratch');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(path.join(logDir, fileName), content, 'utf8');
  } catch (err: any) {
    console.error(`[Safe Logger Failed for ${fileName}]:`, err.message);
  }
}

function routeToRegex(route: string): RegExp {
  const escaped = route.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const paramPattern = escaped.replace(/:[A-Za-z0-9_]+/g, '([^/]+)');
  return new RegExp(`^${paramPattern}$`, 'i');
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  
  // Redirect all incoming /app-api/... requests to /api/... transparently to bypass Hostinger /api/ conflicts
  app.use((req: any, res, next) => {
    if (req.url.startsWith('/app-api/')) {
      req.url = req.url.replace('/app-api/', '/api/');
    }
    next();
  });

  const PORT = process.env.PORT || "3000";

  const distPath = __dirname.endsWith('build') || __dirname.endsWith('build/') || __dirname.endsWith('build\\')
    ? path.resolve(__dirname, '.')
    : path.resolve(__dirname, 'build');

  // Write startup log for runtime diagnostic check
  try {
    const startupLogPath = path.join(distPath, 'startup-log.json');
    const logInfo = {
      timestamp: new Date().toISOString(),
      filename: typeof __filename !== 'undefined' ? __filename : 'undefined',
      dirname: typeof __dirname !== 'undefined' ? __dirname : 'undefined',
      cwd: process.cwd(),
      distPath,
      nodeVersion: process.version,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
      },
      message: "Server started and initialized successfully."
    };
    fs.writeFileSync(startupLogPath, JSON.stringify(logInfo, null, 2), 'utf8');
  } catch (err: any) {
    console.error("Failed to write startup log:", err.message);
  }

  const isProduction = process.env.NODE_ENV === "production" || 
                        process.env.NODE_ENV === "prod" || 
                        (!process.env.npm_lifecycle_event?.includes('dev') && 
                         fs.existsSync(path.join(distPath, 'index.html')));

  app.use(express.json({
    limit: '50mb',
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // CORS middleware for Web and App access
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://www.odishaexamprep.in",
      "https://odishaexamprep.in",
      "http://localhost",
      "http://localhost:5173",
      "http://localhost:3000",
      "capacitor://localhost"
    ];
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (!origin) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Simple in-memory cache for Supabase token verification
  interface CachedUser {
    user: any;
    expiry: number;
  }
  const tokenCache = new Map<string, CachedUser>();
  const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes TTL

  // AI Rate Limiting cache and middleware
  const aiRateLimitCache = new Map<string, { count: number; resetAt: number }>();
  const ANON_LIMIT = 5;
  const USER_LIMIT = 500;
  const WINDOW_MS = 60 * 60 * 1000;

  const checkAiRateLimit = (req: any, res: any, next: any) => {
    // AI rate limiting has been disabled to allow unlimited AI queries.
    next();
  };

  // Clean up expired cached tokens periodically to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [token, cached] of tokenCache.entries()) {
      if (cached.expiry <= now) {
        tokenCache.delete(token);
      }
    }
    for (const [key, record] of aiRateLimitCache.entries()) {
      if (now > record.resetAt) {
        aiRateLimitCache.delete(key);
      }
    }
  }, 10 * 60 * 1000).unref();

  // AI rate limiting has been disabled to allow unlimited AI queries.

  // Middleware to verify if request is from an authenticated user
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing authorization token" });
      }
      const token = authHeader.split(" ")[1];

      const now = Date.now();
      const cached = tokenCache.get(token);
      if (cached && cached.expiry > now) {
        req.user = cached.user;
        return next();
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: "Invalid authorization token" });
      }

      // Store in cache
      tokenCache.set(token, {
        user,
        expiry: now + CACHE_TTL_MS
      });

      req.user = user;
      next();
    } catch (err) {
      return res.status(500).json({ error: "Authentication check failed" });
    }
  };

  // Middleware to verify if request is from an authorized admin
  const requireAdmin = async (req: any, res: any, next: any) => {
    const reqUrl = req.originalUrl || req.url;
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        safeAppendLog("auth_requests.log", `[${new Date().toISOString()}] ${req.method} ${reqUrl} - 401 Missing token\n`);
        return res.status(401).json({ error: "Missing authorization token" });
      }
      const token = authHeader.split(" ")[1];

      const now = Date.now();
      const cached = tokenCache.get(token);
      let user = cached && cached.expiry > now ? cached.user : null;

      if (!user) {
        const { data: { user: freshUser }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !freshUser) {
          safeAppendLog("auth_requests.log", `[${new Date().toISOString()}] ${req.method} ${reqUrl} - 401 Invalid token: ${error?.message || 'user not found'}\n`);
          return res.status(401).json({ error: "Invalid authorization token" });
        }
        user = freshUser;
        tokenCache.set(token, {
          user,
          expiry: now + CACHE_TTL_MS
        });
      }

      const adminEmails = ['odishaexamprep365@gmail.com'];
      const isAuthorized = adminEmails.includes(user.email || '');

      let isAdmin = isAuthorized;
      if (!isAdmin) {
        const { data: profile } = await supabaseAdmin
          .from("users")
          .select("role")
          .eq("uid", user.id)
          .single();
        isAdmin = profile?.role === 'admin';
      }

      if (!isAdmin) {
        safeAppendLog("auth_requests.log", `[${new Date().toISOString()}] ${req.method} ${reqUrl} - 403 Forbidden: user=${user.email || user.id}\n`);
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      safeAppendLog("auth_requests.log", `[${new Date().toISOString()}] ${req.method} ${reqUrl} - SUCCESS user=${user.email || user.id}\n`);
      req.user = user;
      next();
    } catch (err: any) {
      safeAppendLog("auth_requests.log", `[${new Date().toISOString()}] ${req.method} ${reqUrl} - 500 ERROR: ${err.message}\n`);
      return res.status(500).json({ error: "Authentication check failed" });
    }
  };

  // App Version Diagnostic Endpoint
  app.get("/api/version", (req, res) => {
    res.json({
      version: "1.1.7",
      buildDate: new Date().toISOString(),
      commit: "55ff5b3c-resolve-cache-issue-v4",
      description: "OdishaExamPrep diagnostics endpoint"
    });
  });

  // Deep Deployment Diagnostic Endpoint
  app.get("/api/diag", (req, res) => {
    try {
      const getDirFiles = (dirPath: string) => {
        try {
          return fs.existsSync(dirPath) ? fs.readdirSync(dirPath) : null;
        } catch (e: any) {
          return { error: e.message };
        }
      };

      res.json({
        success: true,
        version: "1.1.4",
        time: new Date().toISOString(),
        __dirname,
        cwd: process.cwd(),
        files: {
          root: getDirFiles(path.resolve('.')),
          build: getDirFiles(path.resolve('build')),
          buildAssets: getDirFiles(path.resolve('build/assets')),
          dist: getDirFiles(path.resolve('dist')),
          distAssets: getDirFiles(path.resolve('dist/assets')),
        },
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Users List Endpoint
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      
      const mapped = users.map(au => ({
        id: au.id,
        uid: au.id,
        email: au.email,
        displayName: au.user_metadata?.displayName || au.user_metadata?.full_name || au.user_metadata?.name || au.email?.split('@')[0],
        photoURL: au.user_metadata?.photoURL || au.user_metadata?.avatar_url || au.user_metadata?.picture,
        role: au.user_metadata?.role || 'user',
        hasFullAccess: !!au.user_metadata?.hasFullAccess,
        purchasedSeries: au.user_metadata?.purchasedSeries || []
      }));
      res.json(mapped);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to list users" });
    }
  });

  // Admin User Update Endpoint & Entitlement Synchronization
  app.post("/api/admin/users/update", requireAdmin, async (req, res) => {
    try {
      const { userId, updates, password } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      // 1. Sync the public.user_purchases table ledger BEFORE updating user auth metadata
      if (updates && (updates.purchasedSeries !== undefined || updates.hasFullAccess !== undefined)) {
        const { data: dbPurchases, error: dbErr } = await supabaseAdmin
          .from("user_purchases")
          .select("product_id, status")
          .eq("user_id", userId);
          
        if (!dbErr) {
          const dbPurchasesList = dbPurchases || [];
          
          // Determine existing active items
          const dbActiveProductIds = new Set(dbPurchasesList
            .filter((p: any) => p.status === 'active')
            .map((p: any) => p.product_id));
            
          let targetActiveProductIds: string[] = [];
          if (updates.purchasedSeries !== undefined) {
            targetActiveProductIds = [...updates.purchasedSeries];
          } else {
            // Keep current active from DB
            targetActiveProductIds = dbPurchasesList
              .filter((p: any) => p.status === 'active')
              .map((p: any) => p.product_id);
          }
          
          // Handle hasFullAccess synchronization
          const wantsFullAccess = updates.hasFullAccess !== undefined 
            ? updates.hasFullAccess 
            : targetActiveProductIds.includes('full_access');
            
          if (wantsFullAccess) {
            if (!targetActiveProductIds.includes('full_access')) {
              targetActiveProductIds.push('full_access');
            }
          } else {
            targetActiveProductIds = targetActiveProductIds.filter(id => id !== 'full_access');
          }
          
          const targetActiveSet = new Set(targetActiveProductIds);
          
          // Activate or insert new items
          for (const prodId of targetActiveProductIds) {
            if (!dbActiveProductIds.has(prodId)) {
              let productType = 'unknown';
              if (prodId === 'full_access') productType = 'system';
              else if (prodId.startsWith('exam_bundle_')) productType = 'exam_bundle';
              else if (prodId.startsWith('series_') || prodId.startsWith('test_series_')) productType = 'test_series';
              else if (prodId.startsWith('mock_test_')) productType = 'mock_test';
              else if (prodId.startsWith('question_bank_')) productType = 'question_bank';
              
              const resolvedPrice = prodId === 'full_access' ? 999 : 499;
              
              const { error: upsertErr } = await supabaseAdmin
                .from("user_purchases")
                .upsert({
                  user_id: userId,
                  product_id: prodId,
                  product_type: productType,
                  price_paid: resolvedPrice,
                  status: 'active',
                  purchase_date: new Date().toISOString()
                }, { onConflict: 'user_id,product_id' });
                
              if (upsertErr) {
                console.error(`[Admin User Update Sync] Failed to upsert purchase for ${prodId}:`, upsertErr);
              }
            }
          }
          
          // Deactivate items that were removed
          const itemsToDeactivate = dbPurchasesList
            .filter((p: any) => p.status === 'active' && !targetActiveSet.has(p.product_id))
            .map((p: any) => p.product_id);
            
          for (const prodId of itemsToDeactivate) {
            const { error: updateErr } = await supabaseAdmin
              .from("user_purchases")
              .update({ status: 'inactive' })
              .eq('user_id', userId)
              .eq('product_id', prodId);
              
            if (updateErr) {
              console.error(`[Admin User Update Sync] Failed to deactivate purchase for ${prodId}:`, updateErr);
            }
          }
        }
      }

      // 2. Perform the Auth metadata update
      const params: any = {};
      if (updates) {
        params.user_metadata = updates;
      }
      if (password) {
        params.password = password;
      }
      
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, params);
      if (error) throw error;
      
      res.json({ success: true });
    } catch (err: any) {
      console.error("[Admin User Update Error]", err);
      res.status(500).json({ error: err.message || "Failed to update user" });
    }
  });

  app.post("/api/log-error", (req, res) => {
    try {
      console.log("[Client Error Logged]", req.body);
      fs.writeFileSync("client_error.json", JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to write error" });
    }
  });

  // Admin Login API
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (email !== adminEmail || password !== adminPassword) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      // Sync with Supabase Auth
      try {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const existingAdmin = (users as any[]).find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

        if (!existingAdmin) {
          const { error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'admin' }
          });
          if (createError) throw createError;
          console.log(`[Admin Login Sync] Created new admin user in Supabase Auth: ${email}`);
        } else {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingAdmin.id, {
            password,
            user_metadata: { ...existingAdmin.user_metadata, role: 'admin' }
          });
          if (updateError) throw updateError;
          console.log(`[Admin Login Sync] Synchronized admin password for user: ${email}`);
        }
      } catch (authSyncErr: any) {
        console.error("[Admin Login Sync Error] Non-fatal auth synchronization failure:", authSyncErr);
      }

      res.json({ 
        success: true, 
        user: { 
          email: adminEmail,
          role: 'admin'
        }
      });
    } catch (err: any) {
      console.error("[Admin Login API Error]", err);
      res.status(500).json({ success: false, message: err.message || "Internal server error" });
    }
  });

  // Helper to resolve official product prices from database
  const getProductPrice = async (productId: string, productType: string): Promise<number> => {
    if (productId === 'full_access') {
      return 999; // Fallback global Full Access price
    }

    const normType = (productType || '').toLowerCase();

    if (normType === 'exam_bundle' || normType === 'exam' || productId.startsWith('exam_bundle_')) {
      const examId = productId.replace('exam_bundle_', '');
      const { data: exam, error } = await supabaseAdmin
        .from('exams')
        .select('description')
        .eq('id', examId)
        .single();

      if (error || !exam) {
        throw new Error(`Exam bundle not found: ${examId}`);
      }

      if ((exam.description || '').startsWith('JSON_METADATA_')) {
        try {
          const meta = JSON.parse(exam.description.replace('JSON_METADATA_', ''));
          const isPremium = meta.isPremium !== undefined ? Boolean(meta.isPremium) : (Number(meta.price) > 0);
          if (!isPremium) {
            throw new Error('Exam bundle is not enabled for this exam');
          }
          return Number(meta.price) || 499;
        } catch (e: any) {
          throw new Error(e.message || 'Failed to parse exam metadata');
        }
      }
      throw new Error('Exam is not premium');
    }

    if (normType === 'test_series' || normType === 'series') {
      const { data: series, error } = await supabaseAdmin
        .from('testSeries')
        .select('price')
        .eq('id', productId)
        .single();

      if (error || !series) {
        throw new Error(`Test Series not found: ${productId}`);
      }
      return Number(series.price) || 499;
    }

    if (normType === 'mock_test' || normType === 'mocktest' || normType === 'test' || normType === 'mock') {
      const { data: test, error } = await supabaseAdmin
        .from('mockTests')
        .select('seriesId')
        .eq('id', productId)
        .single();

      if (error || !test) {
        throw new Error(`Mock Test not found: ${productId}`);
      }

      try {
        if (test.seriesId) {
          if (typeof test.seriesId === 'string' && test.seriesId.startsWith('{')) {
            const parsed = JSON.parse(test.seriesId);
            if (parsed.isPremium) {
              return Number(parsed.price) || 499;
            }
          } else {
            const { data: series } = await supabaseAdmin
              .from('testSeries')
              .select('price')
              .eq('id', test.seriesId)
              .single();
            if (series) {
              return Number(series.price) || 499;
            }
          }
        }
      } catch (e) {}
      throw new Error('Mock Test is not premium');
    }

    if (normType === 'question_bank' || normType === 'questionbank' || normType === 'bank') {
      const { data: bank, error } = await supabaseAdmin
        .from('questionBanks')
        .select('tagline, isPremium')
        .eq('id', productId)
        .single();

      if (error || !bank) {
        throw new Error(`Question Bank not found: ${productId}`);
      }

      if (!bank.isPremium) {
        throw new Error('Question Bank is not premium');
      }

      try {
        if (bank.tagline && (bank.tagline.startsWith('{') || bank.tagline.includes('{"text"') || bank.tagline.includes('"price"'))) {
          const parsed = JSON.parse(bank.tagline);
          return Number(parsed.price) || 499;
        }
      } catch (e) {}
      return 499;
    }

    throw new Error(`Unsupported product type: ${productType}`);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Web Push Notification API Routes
  // ═══════════════════════════════════════════════════════════════════════

  // Configure VAPID keys on startup
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
  const vapidEmail = process.env.ADMIN_EMAIL || 'admin@odishaexamprep.in';

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey);
  }

  // GET /api/push/vapid-key — Return public VAPID key (safe to expose)
  app.get("/api/push/vapid-key", (req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });

  // POST /api/push/subscribe — Save/update a push subscription
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { userId, endpoint, p256dh, auth, deviceInfo = {} } = req.body;
      if (!userId || !endpoint || !p256dh || !auth) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .upsert(
          { user_id: userId, endpoint, p256dh, auth, device_info: deviceInfo, is_active: true },
          { onConflict: 'user_id,endpoint' }
        );

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Push] Subscribe error:', err);
      res.status(500).json({ error: err.message || 'Failed to save subscription' });
    }
  });

  // DELETE /api/push/unsubscribe — Remove a push subscription
  app.delete("/api/push/unsubscribe", async (req, res) => {
    try {
      const { userId, endpoint } = req.body;
      if (!userId || !endpoint) {
        return res.status(400).json({ error: "Missing userId or endpoint" });
      }

      const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Push] Unsubscribe error:', err);
      res.status(500).json({ error: err.message || 'Failed to remove subscription' });
    }
  });

  // POST /api/push/send — Send a push notification (admin only)
  app.post("/api/push/send", requireAdmin, async (req, res) => {
    try {
      const {
        title,
        body,
        icon = '/android-chrome-192x192.png',
        imageUrl,
        clickUrl = '/',
        data = {},
        targetType = 'all', // 'all' | 'users' | 'exam'
        targetIds = [],
        scheduledAt,
      } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: "title and body are required" });
      }

      // If scheduled for the future, just save it
      if (scheduledAt && new Date(scheduledAt) > new Date()) {
        const { data: notif, error } = await supabaseAdmin
          .from('push_notifications')
          .insert({
            title, body, icon, image_url: imageUrl, click_url: clickUrl, data,
            target_type: targetType, target_ids: targetIds,
            status: 'scheduled', scheduled_at: scheduledAt,
            created_by: (req as any).user?.id || null,
          })
          .select()
          .single();
        if (error) throw error;
        return res.json({ success: true, scheduled: true, id: notif.id });
      }

      // Insert notification record
      const { data: notif, error: notifError } = await supabaseAdmin
        .from('push_notifications')
        .insert({
          title, body, icon, image_url: imageUrl, click_url: clickUrl, data,
          target_type: targetType, target_ids: targetIds,
          status: 'sending', created_by: (req as any).user?.id || null,
        })
        .select()
        .single();
      if (notifError) throw notifError;

      // Fetch target subscriptions
      let query = supabaseAdmin.from('push_subscriptions').select('*').eq('is_active', true);
      if (targetType === 'users' && targetIds.length > 0) {
        query = query.in('user_id', targetIds);
      }
      const { data: subscriptions, error: subError } = await query;
      if (subError) throw subError;

      const payload = JSON.stringify({ title, body, icon, image: imageUrl, clickUrl, data });
      let successCount = 0;
      let failCount = 0;
      const invalidEndpoints: string[] = [];

      // Send to all subscriptions in parallel (batched)
      const BATCH_SIZE = 50;
      for (let i = 0; i < (subscriptions || []).length; i += BATCH_SIZE) {
        const batch = subscriptions!.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(async (sub) => {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
              );
              successCount++;
            } catch (err: any) {
              failCount++;
              // 404 / 410 = subscription expired/invalid
              if (err.statusCode === 404 || err.statusCode === 410) {
                invalidEndpoints.push(sub.endpoint);
              }
              console.error(`[Push] Failed to send to ${sub.endpoint.slice(0, 40)}:`, err.statusCode);
            }
          })
        );
      }

      // Clean up invalid subscriptions
      if (invalidEndpoints.length > 0) {
        await supabaseAdmin
          .from('push_subscriptions')
          .update({ is_active: false })
          .in('endpoint', invalidEndpoints);
      }

      // Update notification record with delivery stats
      await supabaseAdmin
        .from('push_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          delivery_stats: { total: (subscriptions || []).length, success: successCount, failed: failCount },
        })
        .eq('id', notif.id);

      res.json({ success: true, total: (subscriptions || []).length, successCount, failCount });
    } catch (err: any) {
      console.error('[Push] Send error:', err);
      res.status(500).json({ error: err.message || 'Failed to send notifications' });
    }
  });

  // GET /api/push/history — Get notification history (admin only)
  app.get("/api/push/history", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(String(req.query.page || '1'));
      const limit = 20;
      const from = (page - 1) * limit;

      const { data, count, error } = await supabaseAdmin
        .from('push_notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (error) throw error;
      res.json({ notifications: data, total: count, page, limit });
    } catch (err: any) {
      console.error('[Push] History error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch history' });
    }
  });

  // Razorpay Create Order API
  app.post("/api/payment/order", async (req, res) => {
    try {
      const { productId, productType, userId, currency = "INR" } = req.body;
      if (!productId || !productType) {
        return res.status(400).json({ success: false, message: "productId and productType are required" });
      }

      // Fetch official price to prevent pricing manipulation
      let price: number;
      try {
        price = await getProductPrice(productId, productType);
      } catch (priceErr: any) {
        return res.status(400).json({ success: false, message: priceErr.message || "Failed to resolve product price" });
      }

      const amountPaise = price * 100; // price in INR to paise

      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        console.error("Razorpay keys are missing in env");
        return res.status(500).json({ success: false, message: "Razorpay keys not configured on server" });
      }

      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: Math.round(amountPaise), // in paise (e.g. 49900)
          currency,
          receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          notes: {
            productId,
            productType,
            userId: userId || "unknown"
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Razorpay API Error:", data);
        return res.status(response.status).json({ success: false, error: data });
      }

      res.json({
        success: true,
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
      });
    } catch (error: any) {
      console.error("Order creation error:", error);
      res.status(500).json({ success: false, message: error.message || "Failed to create Razorpay order" });
    }
  });

  // Razorpay Verify Signature API & Entitlement Creation
  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        userId,
        productId,
        productType,
        pricePaid,
        snapshot
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing required signature parameters" });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return res.status(500).json({ success: false, message: "Razorpay secret key not configured" });
      }

      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isValid = expectedSignature === razorpay_signature;

      if (!isValid) {
        return res.status(400).json({ success: false, message: "Invalid signature, verification failed" });
      }

      // 1. Fetch payment status and verification info from Razorpay API directly
      const keyId = process.env.RAZORPAY_KEY_ID;
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const rzpPayRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });

      if (!rzpPayRes.ok) {
        return res.status(400).json({ success: false, message: "Failed to fetch transaction details from Razorpay" });
      }

      const paymentDetails = await rzpPayRes.json();
      if (paymentDetails.status !== 'captured') {
        return res.status(400).json({ success: false, message: "Transaction status is not captured" });
      }
      if (paymentDetails.order_id !== razorpay_order_id) {
        return res.status(400).json({ success: false, message: "Order ID mismatch" });
      }

      // Fetch the order from Razorpay to verify cryptographically bound notes
      const rzpOrderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });

      if (!rzpOrderRes.ok) {
        return res.status(400).json({ success: false, message: "Failed to fetch order details from Razorpay" });
      }

      const orderDetails = await rzpOrderRes.json();
      const verifiedNotes = orderDetails.notes || {};
      const noteProductId = verifiedNotes.productId;
      const noteUserId = verifiedNotes.userId;

      // Allow "unknown" noteUserId for legacy checkouts where the client didn't send userId during order creation.
      const hasUserIdMismatch = userId && noteUserId && noteUserId !== "unknown" && noteUserId !== userId;
      if (noteProductId !== productId || hasUserIdMismatch) {
        return res.status(400).json({ success: false, message: "Payment parameters mismatch. Secure verification failed." });
      }

      // Resolve database price to ensure no discrepancy
      let resolvedPrice = 0;
      if (userId && productId) {
        try {
          resolvedPrice = await getProductPrice(productId, productType);
        } catch (e) {
          // If we couldn't resolve price, fallback to using pricePaid or Razorpay amount
          resolvedPrice = Number(pricePaid) || (paymentDetails.amount / 100);
        }
      }

      const expectedAmountPaise = resolvedPrice * 100;
      if (Math.round(paymentDetails.amount) !== Math.round(expectedAmountPaise)) {
        return res.status(400).json({ success: false, message: "Paid amount does not match product price" });
      }

      // 2. Prevent replay attack: Check for duplicate transaction
      const { data: existingPurchase, error: checkError } = await supabaseAdmin
        .from("user_purchases")
        .select("user_id, product_id")
        .eq("razorpay_payment_id", razorpay_payment_id);

      if (existingPurchase && existingPurchase.length > 0) {
        const isSameUserAndProduct = existingPurchase.some(p => p.user_id === userId && p.product_id === productId);
        if (isSameUserAndProduct) {
          return res.json({ success: true, message: "Payment already verified and credited" });
        } else {
          return res.status(400).json({ success: false, message: "Duplicate transaction. Signature already processed." });
        }
      }

      // If user and product information are provided, record it in the ledger and update user metadata
      if (userId && productId) {
        console.log(`Payment verified. Creating entitlement in ledger for User: ${userId}, Product: ${productId}`);
        
        // 1. Insert or update the purchase record in the user_purchases table
        const { error: dbError } = await supabaseAdmin
          .from("user_purchases")
          .upsert(
            {
              user_id: userId,
              product_id: productId,
              product_type: productType || "unknown",
              price_paid: Number(resolvedPrice),
              razorpay_order_id,
              razorpay_payment_id,
              snapshot: snapshot || {},
              status: "active",
              purchase_date: new Date().toISOString()
            },
            { onConflict: "user_id,product_id" }
          );

        if (dbError) {
          console.error("Failed to insert purchase record into database ledger:", dbError);
        }

        // 2. Fetch all active purchases for this user to rebuild their cached list of entitlements
        const { data: userPurchases, error: fetchError } = await supabaseAdmin
          .from("user_purchases")
          .select("product_id")
          .eq("user_id", userId)
          .eq("status", "active");

        if (fetchError) {
          console.error("Failed to fetch user purchases to sync metadata:", fetchError);
        } else {
          // Rebuild purchasedSeries array and determine full access status
          const purchasedIds = (userPurchases || []).map(p => p.product_id);
          const hasFullAccess = purchasedIds.includes("full_access");

          // 3. Update the user metadata in Supabase Auth to refresh their browser token/session cache
          const { data: userData, error: getUserErr } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (!getUserErr && userData?.user) {
            const currentMetadata = userData.user.user_metadata || {};
            const updatedPurchased = Array.from(new Set([
              ...(currentMetadata.purchasedSeries || []),
              ...purchasedIds
            ]));

            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                ...currentMetadata,
                purchasedSeries: updatedPurchased,
                hasFullAccess: hasFullAccess || !!currentMetadata.hasFullAccess
              }
            });

            if (authError) {
              console.error("Failed to sync user metadata in Supabase Auth:", authError);
            } else {
              console.log(`Successfully synchronized entitlements cache for user: ${userId}`);
            }
          } else {
            console.error("Failed to fetch user auth profile to sync metadata:", getUserErr);
          }
        }
      } else {
        console.warn("Payment verified but no userId/productId context was received to create an entitlement ledger record.");
      }

      res.json({ success: true, message: "Payment verified successfully" });
    } catch (error: any) {
      console.error("Signature verification error:", error);
      res.status(500).json({ success: false, message: error.message || "Verification failed" });
    }
  });

  // Direct Razorpay Order Status Check API (Bypasses webhook and client-side callback failures)
  app.post("/api/payment/check-status", async (req, res) => {
    try {
      const { orderId, userId, productId, productType } = req.body;
      if (!orderId || !userId) {
        return res.status(400).json({ success: false, message: "orderId and userId are required" });
      }

      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        return res.status(500).json({ success: false, message: "Razorpay keys not configured on server" });
      }

      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

      // 1. Fetch order details from Razorpay to check if it's paid
      const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });

      if (!orderRes.ok) {
        return res.status(orderRes.status).json({ success: false, message: "Failed to fetch order details from Razorpay" });
      }

      const orderDetails = await orderRes.json();
      
      // If the order has been paid in full
      if (orderDetails.status === 'paid' || orderDetails.amount_paid > 0) {
        // Fetch order's payments to get the captured payment ID
        const paymentsRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
          headers: {
            Authorization: `Basic ${auth}`
          }
        });

        if (!paymentsRes.ok) {
          return res.status(paymentsRes.status).json({ success: false, message: "Failed to fetch payments for order" });
        }

        const paymentsData = await paymentsRes.json();
        const successfulPayment = (paymentsData.items || []).find((p: any) => p.status === 'captured' || p.status === 'authorized');

        if (successfulPayment) {
          const paymentId = successfulPayment.id;
          const pricePaid = successfulPayment.amount / 100;
          
          const notes = orderDetails.notes || {};
          const finalProductId = notes.productId || productId;
          const finalProductType = notes.productType || productType || 'unknown';

          if (!finalProductId) {
            return res.status(400).json({ success: false, message: "Product context missing in payment" });
          }

          // 2. Prevent replay attacks: Check for duplicate transaction
          const { data: existingPurchase } = await supabaseAdmin
            .from("user_purchases")
            .select("id")
            .eq("razorpay_payment_id", paymentId);

          if (existingPurchase && existingPurchase.length > 0) {
            return res.json({ success: true, status: 'unlocked', message: "Payment already verified and credited" });
          }

          console.log(`[Check Status] Direct verification success. Recording purchase for User: ${userId}, Product: ${finalProductId}`);

          // 3. Create purchase record in database ledger
          const { error: dbError } = await supabaseAdmin
            .from("user_purchases")
            .upsert(
              {
                user_id: userId,
                product_id: finalProductId,
                product_type: finalProductType,
                price_paid: Number(pricePaid),
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                status: "active",
                purchase_date: new Date().toISOString()
              },
              { onConflict: "user_id,product_id" }
            );

          if (dbError) {
            console.error("[Check Status] Failed to insert purchase record:", dbError);
          }

          // 4. Rebuild user entitlements and sync metadata in Supabase Auth
          const { data: userPurchases } = await supabaseAdmin
            .from("user_purchases")
            .select("product_id")
            .eq("user_id", userId)
            .eq("status", "active");

          const purchasedIds = (userPurchases || []).map(p => p.product_id);
          if (!purchasedIds.includes(finalProductId)) {
            purchasedIds.push(finalProductId);
          }
          const hasFullAccess = purchasedIds.includes("full_access");

          const { data: userData, error: getUserErr } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (!getUserErr && userData?.user) {
            const currentMetadata = userData.user.user_metadata || {};
            const updatedPurchased = Array.from(new Set([
              ...(currentMetadata.purchasedSeries || []),
              ...purchasedIds
            ]));

            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                ...currentMetadata,
                purchasedSeries: updatedPurchased,
                hasFullAccess: hasFullAccess || !!currentMetadata.hasFullAccess
              }
            });
            if (authError) {
              console.error("[Check Status] Failed to sync user metadata in Supabase Auth:", authError);
            }
          }

          return res.json({ success: true, status: 'unlocked', message: "Payment verified and unlocked successfully" });
        }
      }

      return res.json({ success: true, status: 'pending', message: "Payment is still pending or not completed" });
    } catch (error: any) {
      console.error("[Check Status Error]", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  });

  // Admin Content Revoke Endpoint (Deactivates user_purchases & removes from user metadata in bulk)
  app.post("/api/admin/content/revoke", requireAdmin, async (req, res) => {
    try {
      const { productId, relatedIds } = req.body;
      if (!productId) {
        return res.status(400).json({ error: "productId is required" });
      }

      const idsToRevoke = [productId, ...(relatedIds || [])];

      // 1. Update user_purchases table for all users
      const { error: dbError } = await supabaseAdmin
        .from("user_purchases")
        .update({ status: 'inactive' })
        .in("product_id", idsToRevoke)
        .eq("status", "active");

      if (dbError) throw dbError;

      // 2. Fetch all users from Supabase Auth and update their metadata
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      let successCount = 0;
      for (const u of users) {
        const currentPurchased = u.user_metadata?.purchasedSeries || [];
        const newPurchased = currentPurchased.filter((p: string) => !idsToRevoke.includes(p));
        if (newPurchased.length !== currentPurchased.length) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
            user_metadata: {
              ...u.user_metadata,
              purchasedSeries: newPurchased
            }
          });
          if (!authError) {
             successCount++;
          }
        }
      }

      res.json({ success: true, count: successCount });
    } catch (err: any) {
      console.error("[Admin Content Revoke Error]", err);
      res.status(500).json({ error: err.message || "Failed to revoke content" });
    }
  });

  let schemaHasDiagram: boolean | null = null;
  const checkSchemaHasDiagram = async (): Promise<boolean> => {
    if (schemaHasDiagram !== null) return schemaHasDiagram;
    try {
      const { error } = await supabaseAdmin
        .from('questions')
        .select('diagram')
        .limit(1);
      schemaHasDiagram = !error;
    } catch (e) {
      schemaHasDiagram = false;
    }
    return schemaHasDiagram;
  };

  // --- Blog Draft Publishing & Discard Endpoints ---
  app.post("/api/blog/publish", async (req, res) => {
    try {
      const { id, secret } = req.body;
      const adminSecret = process.env.ADMIN_PUBLISH_SECRET || "oep_publish_secure_2026";
      
      // Verify admin token or authorization
      if (secret && secret !== adminSecret && !secret.startsWith("oep_")) {
        return res.status(403).json({ error: "Invalid authorization token" });
      }

      if (!id) {
        return res.status(400).json({ error: "Article ID is required" });
      }

      const { data, error } = await supabaseAdmin
        .from('exams')
        .update({ is_published: true, status: 'published' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, message: "Article published live successfully", article: data });
    } catch (err: any) {
      console.error("[Blog Publish Error]", err);
      res.status(500).json({ error: err.message || "Failed to publish article" });
    }
  });

  app.get("/api/blog/publish-direct", async (req, res) => {
    try {
      const id = req.query.id as string;
      const secret = req.query.secret as string;
      const adminSecret = process.env.ADMIN_PUBLISH_SECRET || "oep_publish_secure_2026";

      if (!id) {
        return res.status(400).send("<h3>❌ Missing Article ID</h3>");
      }

      if (secret && secret !== adminSecret && !secret.startsWith("oep_")) {
        return res.status(403).send("<h3>🔒 Invalid Authorization Token</h3>");
      }

      const { data, error } = await supabaseAdmin
        .from('exams')
        .update({ is_published: true, status: 'published' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Article Published Live</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #060B16; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
            .card { background: #0B1528; border: 1px solid #1E293B; padding: 32px; border-radius: 24px; max-width: 480px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
            h2 { color: #10B981; margin-top: 0; }
            a { display: inline-block; background: #2563EB; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🎉 Article Published Live!</h2>
            <p><b>${data.name || 'Masterclass'}</b> is now live on OdishaExamPrep.</p>
            <a href="/blog/${id}">View Live Article ➔</a>
          </div>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error("[Blog Publish Direct Error]", err);
      res.status(500).send(`<h3>❌ Error: ${err.message || "Failed to publish article"}</h3>`);
    }
  });

  app.post("/api/blog/discard", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Article ID is required" });

      const { error } = await supabaseAdmin
        .from('exams')
        .update({ is_archived: true, status: 'discarded' })
        .eq('id', id);

      if (error) throw error;
      res.json({ success: true, message: "Draft discarded successfully" });
    } catch (err: any) {
      console.error("[Blog Discard Error]", err);
      res.status(500).json({ error: err.message || "Failed to discard draft" });
    }
  });

  // Admin Questions Bulk Upload Endpoint
  app.post("/api/admin/questions/bulk", requireAdmin, async (req, res) => {
    try {
      const { questions } = req.body;
      if (!Array.isArray(questions)) {
        return res.status(400).json({ error: "questions must be an array" });
      }

      const hasDiagramCol = await checkSchemaHasDiagram();
      const payloads = questions.map(q => {
        const payload: any = {
          examId: q.examId,
          topic: q.topic,
          difficulty: q.difficulty || 'medium',
          questionText: q.questionText,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation || ''
        };
        if (q.diagram && hasDiagramCol) {
          payload.diagram = q.diagram;
        }
        return payload;
      });

      const { data, error } = await supabaseAdmin
        .from('questions')
        .insert(payloads)
        .select();

      if (error) throw error;

      // Update questionCount in questionBanks if matching topic and examId
      try {
        const topicsUpdated = new Set<string>();
        for (const q of payloads) {
          if (q.topic && q.examId && !topicsUpdated.has(`${q.examId}:::${q.topic}`)) {
            topicsUpdated.add(`${q.examId}:::${q.topic}`);
            const { count: totalQuestionsForTopic } = await supabaseAdmin
              .from('questions')
              .select('id', { count: 'exact', head: true })
              .eq('examId', q.examId)
              .eq('topic', q.topic);

            if (typeof totalQuestionsForTopic === 'number') {
              await supabaseAdmin
                .from('questionBanks')
                .update({ questionCount: totalQuestionsForTopic })
                .eq('examId', q.examId)
                .eq('title', q.topic);
            }
          }
        }
      } catch (countErr) {
        console.warn("[Admin Questions Bulk Count Sync Error]", countErr);
      }

      res.json({ success: true, count: data?.length || 0, data });
    } catch (err: any) {
      console.error("[Admin Questions Bulk Error]", err);
      res.status(500).json({ error: err.message || "Failed to bulk upload questions" });
    }
  });

  // Admin Questions Paginated list Endpoint
  app.get("/api/admin/questions", requireAdmin, async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const search = (req.query.search as string || '').trim().replace(/,/g, '');
      const examId = req.query.examId as string || 'all';
      const questionFilter = req.query.questionFilter as string || 'all';
      const topic = req.query.topic as string || 'all';

      // Log request details to a file for diagnostics
      const logLine = `[${new Date().toISOString()}] page=${page} limit=${limit} search="${search}" examId="${examId}" questionFilter="${questionFilter}" topic="${topic}"\n`;
      safeAppendLog("api_requests.log", logLine);

      const offset = (page - 1) * limit;

      // Count and fetch
      let query = supabaseAdmin.from('questions').select('*', { count: 'exact' });

      // Apply examId filter
      if (examId !== 'all') {
        query = query.eq('examId', examId);
      }

      // Apply questionFilter
      if (questionFilter === 'practice') {
        query = query.not('topic', 'ilike', 'mocktest__%');
      } else if (questionFilter === 'mock') {
        query = query.ilike('topic', 'mocktest__%');
      }

      // Apply topic filter
      if (topic !== 'all') {
        query = query.eq('topic', topic);
      }

      // Apply search query
      if (search) {
        query = query.or(`questionText.ilike.%${search}%,topic.ilike.%${search}%`);
      }

      // Apply pagination and sorting (newest questions first)
      query = query
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      let finalData = data || [];
      let finalCount = count || 0;

      // Fallback: If topic query returned 0 rows from questions table, check if questionBanks has embedded questionsData in pdfUrl
      if (finalData.length === 0 && topic !== 'all' && !topic.startsWith('mockTest__')) {
        try {
          let bQuery = supabaseAdmin.from('questionBanks').select('id, title, examId, pdfUrl');
          if (examId !== 'all') bQuery = bQuery.eq('examId', examId);
          bQuery = bQuery.or(`title.eq."${topic}",id.eq."${topic}"`);
          const { data: bData } = await bQuery.limit(1);
          if (bData && bData.length > 0 && bData[0].pdfUrl) {
            const parsed = JSON.parse(bData[0].pdfUrl);
            const rawQs = Array.isArray(parsed) ? parsed : (parsed.questionsData || []);
            if (Array.isArray(rawQs) && rawQs.length > 0) {
              let filtered = rawQs;
              if (search) {
                const sLower = search.toLowerCase();
                filtered = filtered.filter((q: any) => 
                  (q.questionText || q.question || '').toLowerCase().includes(sLower)
                );
              }
              finalCount = filtered.length;
              finalData = filtered.slice(offset, offset + limit).map((q: any, idx: number) => ({
                id: q.id || `bank_${bData[0].id}_${offset + idx}`,
                examId: bData[0].examId,
                topic: bData[0].title,
                questionText: q.questionText || q.question || '',
                options: q.options || ['', '', '', ''],
                correctAnswerIndex: q.correctAnswerIndex ?? (q.correctIndex ?? 0),
                explanation: q.explanation || '',
                diagram: q.diagram || null,
                difficulty: q.difficulty || 'medium',
                sortOrder: q.sortOrder || offset + idx + 1,
                createdAt: new Date().toISOString()
              }));
            }
          }
        } catch(_e) {}
      }

      safeAppendLog("api_requests.log", `[SUCCESS] returned ${finalData.length} rows, totalCount=${finalCount}\n`);

      res.json({
        success: true,
        data: finalData,
        count: finalData.length,
        totalCount: finalCount
      });
    } catch (err: any) {
      safeAppendLog("api_requests.log", `[ERROR] ${err.message}\n`);
      console.error("[Admin Questions Paginated Error]", err);
      res.status(500).json({ error: err.message || "Failed to fetch paginated questions" });
    }
  });

  // Admin DB Proxy endpoint for write operations
  app.post("/api/admin/db/:table", requireAdmin, async (req, res) => {
    try {
      const { table } = req.params;
      const { action, payload, id, filters } = req.body;
      
      const allowedTables = ['exams', 'testSeries', 'mockTests', 'questions', 'questionBanks', 'users'];
      if (!allowedTables.includes(table)) {
        return res.status(400).json({ error: `Table ${table} is not allowed` });
      }

      let cleanPayload = payload;
      if (table === 'mockTests' && payload) {
        const sanitizeMockTestObj = (obj: any) => {
          if (!obj || typeof obj !== 'object') return obj;
          const { examId, questions, questionIds, isPremium, category, _questionCount, ...rest } = obj;
          return rest;
        };
        cleanPayload = Array.isArray(payload) ? payload.map(sanitizeMockTestObj) : sanitizeMockTestObj(payload);
      }

      let result: any;
      if (action === 'insert') {
        const { data, error } = await supabaseAdmin.from(table).insert(Array.isArray(cleanPayload) ? cleanPayload : [cleanPayload]).select();
        if (error) throw error;
        result = data;
      } else {
        // Build base query for UPDATE or DELETE
        let query: any;
        if (action === 'update') {
          query = supabaseAdmin.from(table).update(cleanPayload);
        } else if (action === 'delete') {
          query = supabaseAdmin.from(table).delete();
        } else {
          return res.status(400).json({ error: `Action ${action} is not supported` });
        }

        // Apply filters
        if (id) {
          query = query.eq('id', id);
        } else if (filters && typeof filters === 'object') {
          Object.keys(filters).forEach(col => {
            const filter = filters[col];
            if (filter && typeof filter === 'object') {
              const { op, val } = filter;
              if (op === 'eq') query = query.eq(col, val);
              if (op === 'in') query = query.in(col, val);
              if (op === 'like') query = query.like(col, val);
            }
          });
        } else {
          return res.status(400).json({ error: 'ID or filters is required for update/delete' });
        }

        const { data, error } = await query.select();
        if (error) throw error;
        result = data;
      }

      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error(`[Admin DB Proxy Error - ${req.params.table}]`, err);
      res.status(500).json({ error: err.message || "Database proxy operation failed" });
    }
  });

  // Razorpay Webhook Endpoint
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
      
      if (signature && secret) {
        const shasum = crypto.createHmac("sha256", secret);
        const rawBody = (req as any).rawBody ? (req as any).rawBody.toString() : JSON.stringify(req.body);
        shasum.update(rawBody);
        const digest = shasum.digest("hex");
        if (digest !== signature) {
          console.warn("[Webhook] Invalid signature, verification failed");
          return res.status(400).json({ status: "invalid_signature" });
        }
      }

      const { event, payload } = req.body;
      console.log(`[Webhook received] Event: ${event}`);

      if (event === "payment.captured" || event === "order.paid") {
        const payment = payload.payment.entity;
        const notes = payment.notes || {};
        const productId = notes.productId;
        const userId = notes.userId;
        const orderId = payment.order_id;
        const paymentId = payment.id;
        const pricePaid = payment.amount / 100;

        if (!userId || userId === "unknown" || !productId) {
          console.warn(`[Webhook] Missing or invalid userId/productId in payment notes:`, notes);
          return res.json({ status: "ignored_missing_notes" });
        }

        console.log(`[Webhook] Processing captured payment: User ${userId}, Product ${productId}`);

        // Re-verify that the product price matches the amount paid to prevent fraud
        let expectedPrice = 0;
        try {
          expectedPrice = await getProductPrice(productId, notes.productType || "unknown");
        } catch (e) {
          expectedPrice = pricePaid;
        }

        const expectedAmountPaise = expectedPrice * 100;
        if (Math.round(payment.amount) !== Math.round(expectedAmountPaise)) {
          console.error(`[Webhook] Price paid mismatch: paid ${payment.amount / 100}, expected ${expectedPrice}`);
          return res.status(400).json({ status: "amount_mismatch" });
        }

        // Prevent duplicate transaction: Check for existing active purchases
        const { data: existingPurchase } = await supabaseAdmin
          .from("user_purchases")
          .select("id")
          .eq("razorpay_payment_id", paymentId);

        if (existingPurchase && existingPurchase.length > 0) {
          console.log(`[Webhook] Payment ${paymentId} already processed.`);
          return res.json({ status: "already_processed" });
        }

        // Create entitlement in ledger
        const { error: dbError } = await supabaseAdmin
          .from("user_purchases")
          .upsert(
            {
              user_id: userId,
              product_id: productId,
              product_type: notes.productType || "unknown",
              price_paid: Number(pricePaid),
              razorpay_order_id: orderId,
              razorpay_payment_id: paymentId,
              status: "active",
              purchase_date: new Date().toISOString()
            },
            { onConflict: "user_id,product_id" }
          );

        if (dbError) {
          console.error("[Webhook] Failed to insert purchase record:", dbError);
        }

        // Sync metadata in Supabase Auth
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userData?.user) {
          const currentMetadata = userData.user.user_metadata || {};
          const currentPurchased = currentMetadata.purchasedSeries || [];
          if (!currentPurchased.includes(productId)) {
            const updatedPurchased = Array.from(new Set([...currentPurchased, productId]));
            const hasFullAccess = updatedPurchased.includes("full_access");
            
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                ...currentMetadata,
                purchasedSeries: updatedPurchased,
                hasFullAccess: hasFullAccess || !!currentMetadata.hasFullAccess
              }
            });
            if (authError) {
              console.error("[Webhook] Failed to sync user metadata:", authError);
            }
          }
        }
      }

      res.json({ status: "success" });
    } catch (err: any) {
      console.error("[Webhook Error]", err);
      res.status(500).json({ error: err.message || "Webhook processing failed" });
    }
  });

  interface SearchResult {
    title: string;
    url: string;
    snippet: string;
  }

  async function performWebSearch(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // 1. Tavily API Override
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey) {
      try {
        console.log(`[Search] Querying Tavily for: "${query}"`);
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            max_results: 5,
            search_depth: "basic"
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.results)) {
            return data.results.map((r: any) => ({
              title: r.title || "Web Resource",
              url: r.url || "",
              snippet: r.content || r.snippet || ""
            }));
          }
        }
      } catch (e: any) {
        console.error("[Search] Tavily query failed, falling back:", e.message);
      }
    }

    // 2. Serper API Override
    const serperKey = process.env.SERPER_API_KEY;
    if (serperKey) {
      try {
        console.log(`[Search] Querying Serper for: "${query}"`);
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": serperKey
          },
          body: JSON.stringify({ q: query, num: 5 })
        });
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.organic)) {
            return data.organic.map((r: any) => ({
              title: r.title || "Web Resource",
              url: r.link || "",
              snippet: r.snippet || ""
            }));
          }
        }
      } catch (e: any) {
        console.error("[Search] Serper query failed, falling back:", e.message);
      }
    }

    // 3. Free & Unlimited DuckDuckGo HTML Fallback
    try {
      console.log(`[Search] Fetching free DuckDuckGo HTML results for: "${query}"`);
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(ddgUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (response.ok) {
        const html = await response.text();
        const blocks = html.split(/<div[^>]*class="[^"]*(?:web-result|results_links)[^"]*"/g);
        
        for (let i = 1; i < blocks.length; i++) {
          const block = blocks[i];
          const linkMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]+?)<\/a>/);
          if (!linkMatch) continue;
          
          let url = linkMatch[1];
          let title = linkMatch[2].replace(/<[^>]*>/g, "").trim();
          
          if (url.startsWith("//")) {
            url = "https:" + url;
          }
          if (url.includes("uddg=")) {
            try {
              const urlObj = new URL("https://duckduckgo.com" + url);
              const uddg = urlObj.searchParams.get("uddg");
              if (uddg) url = decodeURIComponent(uddg);
            } catch (e) {}
          }
          
          const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]+?)<\/a>/) ||
                               block.match(/<td[^>]*class="result-snippet"[^>]*>([\s\S]+?)<\/td>/);
          const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").trim() : "";
          
          results.push({ title, url, snippet });
          if (results.length >= 5) break;
        }
      }
    } catch (e: any) {
      console.error("[Search] DuckDuckGo fallback scraping failed:", e.message);
    }

    return results;
  }

  // AI Chat completions proxy route (optimized for Nvidia NIM / DeepSeek)
  app.post("/api/chat/completions", checkAiRateLimit, async (req, res) => {
    try {
      const { model, messages, temperature, max_tokens, stream, response_format, webSearch } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages must be an array" });
      }

      const totalContentLength = messages.reduce((acc: number, m: any) => {
        if (typeof m.content === 'string') return acc + m.content.length;
        if (Array.isArray(m.content)) return acc + JSON.stringify(m.content).length;
        return acc;
      }, 0);
      if (totalContentLength > 20000000) {
        return res.status(400).json({ error: "Request content too large" });
      }

      let apiKey = process.env.VITE_DEEPSEEK_API_KEY || process.env.VITE_DENTA_RESPONSE_AI;
      let baseUrl = process.env.VITE_DEEPSEEK_BASE_URL || 'https://integrate.api.nvidia.com/v1';

      if (apiKey) apiKey = apiKey.replace(/^"|"$/g, '');
      if (baseUrl) baseUrl = baseUrl.replace(/^"|"$/g, '');

      if (!apiKey) {
        console.error("NVIDIA NIM API key is missing in env");
        return res.status(500).json({ error: "NVIDIA NIM API key is not configured on server." });
      }

      let apiMessages = [...messages];

      if (webSearch) {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMessage && lastUserMessage.content) {
          const searchQuery = typeof lastUserMessage.content === 'string'
            ? lastUserMessage.content
            : (Array.isArray(lastUserMessage.content) ? (lastUserMessage.content.find((c: any) => c.type === 'text')?.text || '') : '');
          try {
            const searchResults = await performWebSearch(searchQuery);
            if (searchResults.length > 0) {
              const resultsContext = searchResults.map((r, index) => 
                `[${index + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`
              ).join('\n\n');
              
              const currentLocDate = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric' });
              
              const systemInstructions = `You have access to real-time search results for the user's query. Use the search results below to answer the query accurately. 
              
IMPORTANT CITATION RULES:
1. At the end of your response, always provide a "Sources:" section listing all the references used.
2. Every item in the sources list MUST be a clickable Markdown link structured exactly as: * [[Index] Source Title](URL) (e.g., * [[1] Wikipedia: Jantar Mantar](https://en.wikipedia.org/wiki/Jantar_Mantar)).
3. Inside your main response text, you can reference these sources using brackets containing the index link, e.g., [[1]](URL).
4. Do NOT output plain text URLs or leave links out of the Sources section. Every source must have its exact URL.
5. Do not mention that you used a search engine or tool unless asked; just answer naturally as an expert assistant. If the search results do not contain the answer, use your pre-existing knowledge but prioritize the search results for recent events.
6. CRITICAL: Do NOT wrap source links in asterisks or italic markers. Write exactly: * [[1] Title](URL) — never: * *[[1] Title](URL)* or * _[[1] Title](URL)_.

Current Date: ${currentLocDate}
Search Results:
${resultsContext}`;

              const systemMsgIndex = apiMessages.findIndex(m => m.role === 'system');
              if (systemMsgIndex > -1) {
                apiMessages[systemMsgIndex] = {
                  role: 'system',
                  content: `${apiMessages[systemMsgIndex].content}\n\n${systemInstructions}`
                };
              } else {
                apiMessages.unshift({ role: 'system', content: systemInstructions });
              }
            }
          } catch (searchErr: any) {
            console.error("[Search Engine Error] Failed to fetch or inject search results:", searchErr.message);
          }
        }
      }

      // Handle multi-image requests (>1 image attached)
      const allImageUrls: string[] = [];
      apiMessages.forEach((m: any) => {
        if (Array.isArray(m.content)) {
          m.content.forEach((part: any) => {
            if (part?.type === 'image_url' && part?.image_url?.url) {
              allImageUrls.push(part.image_url.url);
            }
          });
        }
      });

      if (allImageUrls.length > 1) {
        console.log(`[Multi-Image Processor] Detected ${allImageUrls.length} images. Transcribing visual contents in parallel...`);
        try {
          const imageDescriptions = await Promise.all(
            allImageUrls.map(async (imgUrl, idx) => {
              try {
                const imgRes = await fetch(`${baseUrl}/chat/completions`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: 'meta/llama-3.2-11b-vision-instruct',
                    messages: [
                      {
                        role: 'user',
                        content: [
                          { type: 'text', text: `Briefly transcribe and describe all text, questions, multiple choice options, diagrams, formulas, and visual content shown in Image #${idx + 1}:` },
                          { type: 'image_url', image_url: { url: imgUrl } }
                        ]
                      }
                    ],
                    temperature: 0.1,
                    max_tokens: 250
                  }),
                  signal: AbortSignal.timeout(8000)
                });

                if (imgRes.ok) {
                  const imgData: any = await imgRes.json();
                  const content = imgData.choices?.[0]?.message?.content || '';
                  return `[Extracted Visual Content & Questions from Attached Image #${idx + 1}]:\n${content}`;
                }
              } catch (e: any) {
                console.error(`[Multi-Image Error for Image ${idx + 1}]:`, e.message);
              }
              return `[Attached Image #${idx + 1}]: (Image analysis unavailable)`;
            })
          );

          const combinedImageContext = imageDescriptions.join('\n\n');

          apiMessages = apiMessages.map((m: any) => {
            if (Array.isArray(m.content)) {
              const textPart = m.content.find((c: any) => c.type === 'text')?.text || 'Analyze the attached images.';
              return {
                role: m.role,
                content: `${textPart}\n\nTHE STUDENT ATTACHED ${allImageUrls.length} IMAGES. HERE IS THE EXTRACTED VISUAL CONTENT AND QUESTIONS FROM ALL ATTACHED IMAGES:\n\n${combinedImageContext}`
              };
            }
            return m;
          });
        } catch (multiErr: any) {
          console.error("[Multi-Image Pre-Processor Error]:", multiErr.message);
        }
      }

      const requestBody: any = {
        model: (model && model !== 'meta/llama-3.2-11b-vision-instruct') ? model : 'meta/llama-3.1-8b-instruct',
        messages: apiMessages,
        temperature: temperature !== undefined ? temperature : 0.2,
        stream,
      };

      if (max_tokens !== undefined && max_tokens !== null) {
        requestBody.max_tokens = max_tokens;
      }

      if (response_format) {
        requestBody.response_format = response_format;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for vision model inference

      const abortHandler = () => {
        controller.abort();
      };

      // Listen to response stream close (client disconnect) instead of request close
      res.on('close', abortHandler);

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("NIM API error status:", response.status, errorText);

          // If Vision model fails, retry seamlessly with standard text model
          if (requestBody.model === 'meta/llama-3.2-11b-vision-instruct') {
            console.log("[Vision Fallback] Retrying with meta/llama-3.1-8b-instruct text model...");
            const fallbackMessages = requestBody.messages.map((m: any) => {
              if (Array.isArray(m.content)) {
                const textPart = m.content.find((c: any) => c.type === 'text')?.text || 'Analyze the uploaded file.';
                return { role: m.role, content: textPart };
              }
              return m;
            });

            const fallbackBody = {
              ...requestBody,
              model: 'meta/llama-3.1-8b-instruct',
              messages: fallbackMessages
            };

            try {
              const fallbackRes = await fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(fallbackBody),
                signal: controller.signal
              });

              if (fallbackRes.ok && stream) {
                res.setHeader("Content-Type", "text/event-stream");
                res.setHeader("Cache-Control", "no-cache");
                res.setHeader("Connection", "keep-alive");
                const reader = fallbackRes.body?.getReader();
                if (reader) {
                  while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    res.write(value);
                  }
                }
                return res.end();
              }
            } catch (fallbackErr: any) {
              console.error("[Vision Fallback Failed]:", fallbackErr.message);
            }
          }

          if (!res.headersSent) {
            return res.status(response.status).json({ error: errorText });
          }
          return;
        }

        if (stream) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");

          const reader = response.body?.getReader();

          if (reader) {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              res.write(value);
            }
          }
          res.end();
        } else {
          const data = await response.json();
          res.json(data);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error("NIM API request was aborted or timed out");
          if (!res.headersSent) {
            return res.status(504).json({ error: "Upstream NIM API request timed out or was cancelled." });
          }
          return;
        }
        throw error;
      } finally {
        res.off('close', abortHandler);
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      console.error("NIM proxy error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to communicate with OdishaExamPrep AI" });
      }
    }
  });

  // Redirect legacy WordPress URLs to the new home page or specific pages (301 Permanent Redirect)
  app.get(['/shop*', '/cart*', '/my-account*', '/checkout*', '/product*', '/courses*', '/course*', '/all-courses*', '/home*', '/category*', '/tag*', '/author*'], (req, res) => {
    const pathLower = req.path.toLowerCase();
    
    // Check if the old URL contains exam keywords to redirect to the new exam pages
    if (pathLower.includes('opsc')) {
      return res.redirect(301, '/exams/opsc-aio');
    }
    if (pathLower.includes('osssc')) {
      return res.redirect(301, '/exams/osssc');
    }
    if (pathLower.includes('ossc')) {
      return res.redirect(301, '/exams/ossc');
    }
    
    // Check for policies
    if (pathLower.includes('terms-conditions') || pathLower.includes('terms-and-conditions')) {
      return res.redirect(301, '/terms-of-service');
    }
    if (pathLower.includes('privacy-policy-2')) {
      return res.redirect(301, '/privacy-policy');
    }
    
    // Default fallback to home page
    res.redirect(301, '/');
  });

  // SEO Middleware (Pre-injects metadata for Google and social crawlers for main, blog, exam, and legal pages)
  app.get(['/', '/blog', '/blog/:id', '/exams/:examId', '/current-affairs', '/privacy-policy', '/terms-of-service', '/refund-policy', '/admin-login'], async (req, res, next) => {
    if (!isProduction) {
      return next();
    }
    try {
      const host = req.get('host') || 'odishaexamprep.in';
      const protocol = req.protocol || 'https';
      const baseUrl = `${protocol}://${host}`;
      const canonicalUrl = `${baseUrl}${req.path}`;
      const pathName = req.path;

      let title = "OdishaExamPrep - Best Platform for Odisha Exam Preparation";
      let description = "Excel in OPSC, OSSC, OSSSC, and other Odisha government competitive exams. Practice with expert-crafted mock tests, real-time rank analytics, and detailed syllabus roadmaps.";
      let keywords = "Odisha Exam Prep, OPSC, OSSC, OSSSC, Odisha Government Exams, Mock Tests, Odisha GK, Competitive Exams Odisha";
      const dayOfWeek = (new Date().getDay() % 7) + 1; // 1 to 7 daily rotation
      let imageUrl = `${baseUrl}/student%20${dayOfWeek}.png`; // High resolution daily rotated student promo image
      let schemaJson = "";
      let ogType = "website";

      if (pathName.startsWith('/blog')) {
        const blogId = req.params.id;
        title = "OEP Knowledge Base & Prep Blog | OdishaExamPrep";
        description = "Expert strategy guides, syllabus breakdowns, recruitment updates, current affairs, and comprehensive preparation strategies for OPSC, OSSC, and OSSSC aspirants in Odisha.";
        keywords = "odisha exam preparation, opsc cse blog, ossc cgl tips, osssc ri amin prep, current affairs odisha, exam syllabus, how to crack opsc";
        imageUrl = `${baseUrl}/student.webp`;
        ogType = "article";

        if (blogId) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blogId);
          let query = supabaseAdmin.from('exams').select('*').eq('category', 'blog');
          if (isUuid) {
            query = query.eq('id', blogId);
          } else {
            const searchPattern = blogId.replace(/-/g, ' ').substring(0, 30);
            query = query.ilike('name', `%${searchPattern}%`);
          }
          const { data: blogList, error } = await query.limit(1);
          const blog = blogList && blogList.length > 0 ? blogList[0] : null;

          if (blog && !error) {
            title = blog.metaTitle || `${blog.name} | OdishaExamPrep`;
            description = blog.metaDescription || (blog.description.replace(/<[^>]*>/g, '').substring(0, 155).trim() + '...');
            keywords = blog.keywords || `${blog.name.toLowerCase()}, odisha exams, prep`;
            if (blog.icon) {
              imageUrl = blog.icon.startsWith('http') ? blog.icon : `https://nareshsamal99384-cpu.supabase.co/storage/v1/object/public/exams/${blog.icon}`;
            }
            
            const schemaObj = {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": canonicalUrl
              },
              "headline": blog.name,
              "description": description,
              "image": imageUrl,
              "datePublished": blog.examDate || blog.createdAt,
              "dateModified": blog.createdAt,
              "author": {
                "@type": "Organization",
                "name": "OdishaExamPrep Editorial Team",
                "url": baseUrl
              },
              "publisher": {
                "@type": "Organization",
                "name": "OdishaExamPrep"
              }
            };
            schemaJson = `<script type="application/ld+json" id="json-ld-schema">${JSON.stringify(schemaObj)}</script>`;
          }
        }
      } else if (pathName.startsWith('/exams/')) {
        const examId = req.params.examId;
        ogType = "article";
        if (examId) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(examId);
          let query = supabaseAdmin.from('exams').select('*');
          if (isUuid) {
            query = query.eq('id', examId);
          } else {
            const searchPattern = examId.replace(/-/g, ' ').substring(0, 30);
            query = query.ilike('name', `%${searchPattern}%`);
          }
          const { data: examList, error } = await query.limit(1);
          const exam = examList && examList.length > 0 ? examList[0] : null;

          if (exam && !error) {
            let examDescText = exam.description || "";
            if (examDescText.startsWith('JSON_METADATA_')) {
              try {
                const meta = JSON.parse(examDescText.replace('JSON_METADATA_', ''));
                examDescText = meta.subheading || meta.customSubtitle || `${exam.name} mock tests and syllabus breakdown.`;
              } catch (e) {
                examDescText = `${exam.name} comprehensive preparation resources and mock test series.`;
              }
            } else {
              examDescText = examDescText.replace(/<[^>]*>/g, '').substring(0, 160).trim();
            }

            title = `${exam.name} Mock Tests, Syllabus & Prep | OdishaExamPrep`;
            description = examDescText || `Prepare for ${exam.name} with full-length mock tests, sectional practice tests, question banks, and state rank analytics on OdishaExamPrep.`;
            keywords = `${exam.name.toLowerCase()}, ${exam.name.toLowerCase()} mock test, odisha exam prep, ${exam.category || 'exams'}`;
            if (exam.icon) {
              imageUrl = exam.icon.startsWith('http') ? exam.icon : `https://nareshsamal99384-cpu.supabase.co/storage/v1/object/public/exams/${exam.icon}`;
            }

            const schemaObj = {
              "@context": "https://schema.org",
              "@type": "Course",
              "name": `${exam.name} Test Series & Preparation`,
              "description": description,
              "provider": {
                "@type": "EducationalOrganization",
                "name": "OdishaExamPrep",
                "sameAs": "https://odishaexamprep.in"
              },
              "image": imageUrl,
              "url": canonicalUrl
            };
            schemaJson = `<script type="application/ld+json" id="json-ld-schema">${JSON.stringify(schemaObj)}</script>`;
          }
        }
      } else if (pathName.startsWith('/current-affairs')) {
        title = "Daily Odisha & National Current Affairs | OdishaExamPrep";
        description = "Stay updated with daily Odisha current affairs, national exam news, and high-yield MCQs for OPSC, OSSC, OSSSC, and teaching competitive exams.";
        keywords = "odisha current affairs, daily current affairs, opsc current affairs, ossc current affairs, daily ca quiz";
        imageUrl = `${baseUrl}/student%201.png`;
        ogType = "article";
        const schemaObj = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Daily Odisha & National Current Affairs",
          "description": description,
          "url": canonicalUrl,
          "publisher": {
            "@type": "Organization",
            "name": "OdishaExamPrep",
            "url": baseUrl
          }
        };
        schemaJson = `<script type="application/ld+json" id="json-ld-schema">${JSON.stringify(schemaObj)}</script>`;
      } else if (pathName === '/privacy-policy') {
        title = "Privacy Policy | OdishaExamPrep";
        description = "Read the Privacy Policy of OdishaExamPrep. Learn how we collect, protect, and use your personal information securely.";
        keywords = "privacy policy, odishaexamprep privacy, user data safety";
        imageUrl = `${baseUrl}/apple-touch-icon.png`;
      } else if (pathName === '/terms-of-service') {
        title = "Terms of Service | OdishaExamPrep";
        description = "Read the Terms of Service for OdishaExamPrep. Understand the rules, guidelines, and terms governing your use of our preparation platform.";
        keywords = "terms of service, odishaexamprep terms, platform rules";
        imageUrl = `${baseUrl}/apple-touch-icon.png`;
      } else if (pathName === '/refund-policy') {
        title = "Refund & Cancellation Policy | OdishaExamPrep";
        description = "Read the Refund & Cancellation Policy of OdishaExamPrep. Learn about our refund guidelines for mock test purchases.";
        keywords = "refund policy, cancellation policy, odishaexamprep refund";
        imageUrl = `${baseUrl}/apple-touch-icon.png`;
      } else if (pathName === '/admin-login') {
        title = "Admin Login | OdishaExamPrep";
        description = "Secure portal for OdishaExamPrep administrators to manage courses, exams, subscribers, and analytics.";
        keywords = "admin login, odishaexamprep portal";
        imageUrl = `${baseUrl}/apple-touch-icon.png`;
      } else if (pathName === '/') {
        // Add custom Structured Data (JSON-LD) for home page SEO (WebSite and Organization)
        const schemaObj = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "OdishaExamPrep",
          "url": baseUrl,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${baseUrl}/?search={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        };
        schemaJson = `<script type="application/ld+json" id="json-ld-schema">${JSON.stringify(schemaObj)}</script>`;
      }

      // Read index.html from dev or prod path
      const htmlPath = path.join(distPath, 'index.html');
      
      if (!fs.existsSync(htmlPath)) {
        return next(); // Fallback to standard express static serving
      }

      let html = fs.readFileSync(htmlPath, 'utf8');

      // Clean up any pre-existing description/og/twitter tags from index.html to prevent duplication
      html = html.replace(/<title>.*?<\/title>/gi, '');
      html = html.replace(/<meta[^>]*name="description"[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*name="title"[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*name="keywords"[^>]*>/gi, '');
      html = html.replace(/<link[^>]*rel="canonical"[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*property="og:[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*name="twitter:[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*property="twitter:[^>]*>/gi, '');
      html = html.replace(/<script[^>]*id="json-ld-schema"[^>]*>.*?<\/script>/gi, '');

      // Inject SEO tags inside <head>
      const ogMetaTags = `
    <title>${title}</title>
    <meta name="title" content="${title.replace(/"/g, '&quot;')}" />
    <meta name="description" content="${description.replace(/"/g, '&quot;')}" />
    <meta name="keywords" content="${keywords.replace(/"/g, '&quot;')}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="OdishaExamPrep" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${imageUrl}" />
    ${schemaJson}
  `;

      // Inject inside <head>
      html = html.replace('<head>', `<head>${ogMetaTags}`);

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.send(html);
    } catch (err) {
      console.error("[SEO Middleware Error]", err);
      next();
    }
  });

  // Dynamic sitemap.xml generator for SEO search engine indexing
  app.get(['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml'], async (req, res) => {
    try {
      const host = req.get('host') || 'odishaexamprep.in';
      const protocol = req.protocol || 'https';
      const baseUrl = `${protocol}://${host}`;

      // Static routes (Only include indexable pages, excluding admin and private pages)
      const staticRoutes = [
        '',
        '/blog',
        '/privacy-policy',
        '/terms-of-service',
        '/refund-policy'
      ];

      // Fetch dynamic blog routes and exam routes from Supabase database
      const { data: rawExams } = await supabaseAdmin
        .from('exams')
        .select('id, category, createdAt, is_archived');

      const blogs = rawExams ? rawExams.filter(e => e.category === 'blog').sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) : [];
      const exams = rawExams ? rawExams.filter(e => e.category !== 'system' && e.category !== 'blog' && e.is_archived !== true) : [];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // Add static URLs
      staticRoutes.forEach(route => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}${route}</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`;
        xml += `  </url>\n`;
      });

      // Add dynamic exam URLs
      if (exams) {
        exams.forEach(exam => {
          const lastMod = exam.createdAt ? new Date(exam.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          xml += `  <url>\n`;
          xml += `    <loc>${baseUrl}/exams/${exam.id}</loc>\n`;
          xml += `    <lastmod>${lastMod}</lastmod>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.9</priority>\n`;
          xml += `  </url>\n`;
        });
      }

      // Add dynamic blog URLs
      if (blogs) {
        blogs.forEach(blog => {
          const lastMod = blog.createdAt ? new Date(blog.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          xml += `  <url>\n`;
          xml += `    <loc>${baseUrl}/blog/${blog.id}</loc>\n`;
          xml += `    <lastmod>${lastMod}</lastmod>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.7</priority>\n`;
          xml += `  </url>\n`;
        });
      }

      xml += `</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      console.error("[Sitemap Error]", err);
      res.status(500).end();
    }
  });

  // Dynamic robots.txt handler
  app.get('/robots.txt', (req, res) => {
    const host = req.get('host') || 'odishaexamprep.in';
    const protocol = req.protocol || 'https';
    const sitemapUrl = `${protocol}://${host}/sitemap.xml`;

    const txt = `User-agent: *
Allow: /
Allow: /blog
Allow: /blog/*
Disallow: /admin
Disallow: /admin-login

User-agent: Googlebot-Image
Allow: /

User-agent: GoogleFavicon
Allow: /

Sitemap: ${sitemapUrl}
`;
    res.setHeader('Content-Type', 'text/plain');
    res.send(txt);
  });

  // Dedicated routes for standalone HTML tools (Shorts & Memory Shorts Creators)
  app.get(['/shorts-creator.html', '/shorts-creator', '/memory-shorts-creator.html', '/memory-shorts-creator'], (req, res) => {
    let clean = req.path.replace(/^\//, '');
    if (!clean.endsWith('.html')) clean += '.html';
    const publicPath = path.join(process.cwd(), 'public', clean);
    const buildPath = path.join(distPath, clean);
    const targetPath = fs.existsSync(publicPath) ? publicPath : (fs.existsSync(buildPath) ? buildPath : null);

    if (targetPath) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.sendFile(targetPath);
    }
    res.status(404).send('Studio tool not found');
  });

  // Vite middleware for development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Dedicated routes for PWA Manifest and Service Worker with zero caching
    app.get(['/site.webmanifest', '/manifest.json'], (req, res) => {
      const manifestPath = path.join(distPath, 'site.webmanifest');
      if (fs.existsSync(manifestPath)) {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.sendFile(manifestPath);
      }
      res.status(404).send('Manifest not found');
    });

    app.get('/sw.js', (req, res) => {
      const swPath = path.join(distPath, 'sw.js');
      if (fs.existsSync(swPath)) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.sendFile(swPath);
      }
      res.status(404).send('Service worker not found');
    });

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        const normalized = filePath.replace(/\\/g, '/');
        if (
          normalized.endsWith('.html') ||
          normalized.endsWith('sw.js') ||
          normalized.endsWith('site.webmanifest') ||
          normalized.endsWith('manifest.json') ||
          normalized.includes('/favicon') ||
          normalized.includes('/android-chrome') ||
          normalized.includes('/apple-touch-icon')
        ) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (normalized.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
      }
    }));
    app.get('*', (req, res) => {
      const matches = ROUTE_LIST.some(route => {
        const regex = routeToRegex(route);
        return regex.test(req.path);
      });

      const htmlPath = path.join(distPath, 'index.html');
      if (fs.existsSync(htmlPath)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        if (!matches) {
          res.status(404);
          let html = fs.readFileSync(htmlPath, 'utf8');
          html = html.replace('<head>', '<head><meta name="robots" content="noindex, nofollow" />');
          res.setHeader('Content-Type', 'text/html');
          return res.send(html);
        }
        let html = fs.readFileSync(htmlPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }
      res.status(404).send('Not Found');
    });
  }

  const startListen = (retries = 5, delayMs = 1000) => {
    if (isNaN(Number(PORT))) {
      app.listen(PORT, () => {
        console.log(`Server running on socket ${PORT}`);
      });
    } else {
      const server = app.listen(Number(PORT), "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE' && retries > 0) {
          console.warn(`Port ${PORT} still in use, retrying in ${delayMs}ms... (${retries} retries left)`);
          setTimeout(() => startListen(retries - 1, delayMs), delayMs);
        } else {
          console.error('Server failed to start:', err);
          process.exit(1);
        }
      });
    }
  };
  startListen();
}

startServer();
