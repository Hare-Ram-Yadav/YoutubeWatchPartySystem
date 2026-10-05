import { Router } from 'express';
import { getDb } from '../db/database.js';
import { searchYouTubeVideos, fetchYouTubeVideoDetails } from '../services/youtubeService.js';

const router = Router();

// 1. YouTube Search Endpoint
router.get('/youtube/search', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const results = await searchYouTubeVideos(q);
    return res.json({ results });
  } catch (err: any) {
    console.error('YouTube Search API Error:', err);
    return res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

// 2. YouTube Video Details Endpoint
router.get('/youtube/details/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const details = await fetchYouTubeVideoDetails(videoId);
    return res.json({ details });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

// 3. Save Watch History Record
router.post('/history', async (req, res) => {
  try {
    const { userId, roomId, roomName, hostName, videoId, videoTitle, videoDescription, thumbnailUrl } = req.body;

    if (!userId || !roomId || !videoId) {
      return res.status(400).json({ error: 'Missing required history parameters' });
    }

    const db = await getDb();
    const id = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const watchedAt = Date.now();

    await db.run(
      `INSERT INTO watch_history (id, user_id, room_id, room_name, host_name, video_id, video_title, video_description, thumbnail_url, watched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        roomId,
        roomName || 'Watch Room',
        hostName || 'Host',
        videoId,
        videoTitle || 'YouTube Stream Video',
        videoDescription || '',
        thumbnailUrl || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        watchedAt,
      ]
    );

    return res.json({ success: true, historyId: id });
  } catch (err: any) {
    console.error('Save history error:', err);
    return res.status(500).json({ error: 'Failed to save watch history' });
  }
});

// 4. Get Watch History for a User
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await getDb();

    const rows = await db.all(
      `SELECT id, user_id as userId, room_id as roomId, room_name as roomName, host_name as hostName, 
              video_id as videoId, video_title as videoTitle, video_description as videoDescription, 
              thumbnail_url as thumbnailUrl, watched_at as watchedAt 
       FROM watch_history 
       WHERE user_id = ? 
       ORDER BY watched_at DESC 
       LIMIT 20`,
      [userId]
    );

    return res.json({ history: rows });
  } catch (err: any) {
    console.error('Get history error:', err);
    return res.status(500).json({ error: 'Failed to fetch watch history' });
  }
});

// 5. Get User Preferences
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await getDb();

    const row = await db.get(
      `SELECT user_id as userId, autoplay, sync_threshold as syncThreshold, theme, notifications 
       FROM user_preferences WHERE user_id = ?`,
      [userId]
    );

    if (!row) {
      return res.json({
        preferences: {
          userId,
          autoplay: true,
          syncThreshold: 1.5,
          theme: 'light',
          notifications: true,
        },
      });
    }

    return res.json({
      preferences: {
        userId: row.userId,
        autoplay: Boolean(row.autoplay),
        syncThreshold: row.syncThreshold,
        theme: row.theme,
        notifications: Boolean(row.notifications),
      },
    });
  } catch (err: any) {
    console.error('Get preferences error:', err);
    return res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// 6. Save/Update User Preferences
router.post('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { autoplay, syncThreshold, theme, notifications } = req.body;

    const db = await getDb();
    const updatedAt = Date.now();

    await db.run(
      `INSERT INTO user_preferences (user_id, autoplay, sync_threshold, theme, notifications, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         autoplay = excluded.autoplay,
         sync_threshold = excluded.sync_threshold,
         theme = excluded.theme,
         notifications = excluded.notifications,
         updated_at = excluded.updated_at`,
      [
        userId,
        autoplay ? 1 : 0,
        syncThreshold ?? 1.5,
        theme || 'light',
        notifications ? 1 : 0,
        updatedAt,
      ]
    );

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Save preferences error:', err);
    return res.status(500).json({ error: 'Failed to save preferences' });
  }
});

export default router;
