package com.syncclip.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/**
 * SyncClip Background Clipboard Listener Service
 * Runs continuously in foreground mode and auto-syncs clipboard
 * when connected to designated/whitelisted Wi-Fi networks.
 */
class ClipboardListenerService : Service() {

    private lateinit var clipboardManager: ClipboardManager
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val client = OkHttpClient()
    private var lastSyncedHash: String = ""

    private val clipListener = ClipboardManager.OnPrimaryClipChangedListener {
        onClipboardChanged()
    }

    override fun onCreate() {
        super.onCreate()
        clipboardManager = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboardManager.addPrimaryClipChangedListener(clipListener)

        createNotificationChannel()
        val notification = buildNotification("SyncClip 監視中", "指定ネットワークで暗号化同期待機中")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun onClipboardChanged() {
        val clipData = clipboardManager.primaryClip ?: return
        if (clipData.itemCount == 0) return

        val text = clipData.getItemAt(0).text?.toString() ?: return
        if (text.isBlank()) return

        val prefs = getSharedPreferences("SyncClipPrefs", Context.MODE_PRIVATE)
        val autoSync = prefs.getBoolean("autoSync", true)
        if (!autoSync) return

        // 1. Check designated network restrictions
        val networkFilterEnabled = prefs.getBoolean("networkFilterEnabled", true)
        val currentSsid = NetworkSSIDChecker.getCurrentSSID(applicationContext)
        val allowedNetworks = prefs.getStringSet("allowedNetworks", setOf("Home_5G_AC", "Office_Secure_WiFi")) ?: emptySet()

        if (networkFilterEnabled && !allowedNetworks.contains(currentSsid)) {
            // Not on designated network -> do not broadcast clipboard
            updateNotification("同期一時停止", "未指定ネットワーク接続中: $currentSsid")
            return
        }

        // 2. Encrypt with AES-256-GCM
        val passphrase = prefs.getString("encryptionPassphrase", "SyncClipDefaultKey2026") ?: "SyncClipDefaultKey2026"
        scope.launch {
            try {
                val encryptedBundle = CryptoManager.encrypt(text, passphrase)
                if (encryptedBundle.hash == lastSyncedHash) return@launch // deduplicate
                lastSyncedHash = encryptedBundle.hash

                // 3. Post to Sync Server
                val serverUrl = prefs.getString("serverUrl", "https://your-sync-server.applet.run")
                val jsonPayload = JSONObject().apply {
                    put("id", "clip_" + System.currentTimeMillis())
                    put("encryptedPayload", encryptedBundle.ciphertext)
                    put("iv", encryptedBundle.iv)
                    put("salt", encryptedBundle.salt)
                    put("hash", encryptedBundle.hash)
                    put("device", JSONObject().apply {
                        put("id", Build.MODEL + "_" + Build.ID)
                        put("name", Build.MANUFACTURER + " " + Build.MODEL)
                        put("type", "android")
                        put("networkName", currentSsid)
                    })
                    put("timestamp", System.currentTimeMillis())
                }

                val body = jsonPayload.toString().toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("$serverUrl/api/sync/push")
                    .post(body)
                    .build()

                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    updateNotification("同期完了", "クリップボードを暗号化送信しました ($currentSsid)")
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SyncClip Background Sync",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "クリップボードの常時暗号化同期サービス"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, message: String): Notification {
        val launchIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_menu_agenda)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(title: String, message: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification(title, message))
    }

    override fun onDestroy() {
        super.onDestroy()
        clipboardManager.removePrimaryClipChangedListener(clipListener)
        scope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val CHANNEL_ID = "syncclip_service_channel"
        private const val NOTIFICATION_ID = 1001
    }
}
