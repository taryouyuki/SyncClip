package com.syncclip.app

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * SyncClip Android Main Activity
 * Implements Android Material You Dynamic Color (Monet System Accent),
 * continuous background sync permission prompts, and 10-network whitelist management.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Start background clipboard listener service
        try {
            val serviceIntent = Intent(this, ClipboardListenerService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        setContent {
            SyncClipTheme {
                SyncClipAndroidApp()
            }
        }
    }
}

/**
 * Material You Theme supporting Android 12+ Dynamic Color & Dark Mode
 */
@Composable
fun SyncClipTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val context = LocalContext.current

    val colorScheme = when {
        // Android 12+ (API 31+) Material You Dynamic Accent Color from user's wallpaper
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> darkColorScheme(
            primary = Color(0xFF80D49E),
            onPrimary = Color(0xFF00381C),
            primaryContainer = Color(0xFF00522B),
            onPrimaryContainer = Color(0xFFA1F5BA),
            surface = Color(0xFF111411),
            onSurface = Color(0xFFE1E3DF),
            surfaceVariant = Color(0xFF1E241E),
            outline = Color(0xFF404940)
        )
        else -> lightColorScheme(
            primary = Color(0xFF056D3B),
            onPrimary = Color.White,
            primaryContainer = Color(0xFFA1F5BA),
            onPrimaryContainer = Color(0xFF00210E),
            surface = Color(0xFFF7FAF4),
            onSurface = Color(0xFF191C19),
            surfaceVariant = Color(0xFFE7ECE3),
            outline = Color(0xFF707970)
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SyncClipAndroidApp() {
    val context = LocalContext.current
    val isDark = isSystemInDarkTheme()
    val isDynamicColorSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S

    val prefs = remember { context.getSharedPreferences("SyncClipPrefs", Context.MODE_PRIVATE) }
    var maxHistory by remember { mutableStateOf(prefs.getInt("maxHistory", 5)) }
    var autoSync by remember { mutableStateOf(prefs.getBoolean("autoSync", true)) }
    var networkFilter by remember { mutableStateOf(prefs.getBoolean("networkFilterEnabled", true)) }

    // Whitelist with up to 10 networks
    val defaultNetworks = setOf("Home_5G_AC", "Office_Secure_WiFi")
    var allowedNetworks by remember {
        mutableStateOf(prefs.getStringSet("allowedNetworks", defaultNetworks)?.toList() ?: defaultNetworks.toList())
    }
    var newSsidInput by remember { mutableStateOf("") }

    // Permissions state tracking
    var hasNotifPerm by remember { mutableStateOf(NetworkSSIDChecker.hasNotificationPermission(context)) }
    var hasLocPerm by remember { mutableStateOf(NetworkSSIDChecker.hasLocationPermission(context)) }
    var isBatteryOptimizedIgnored by remember { mutableStateOf(NetworkSSIDChecker.isIgnoringBatteryOptimizations(context)) }
    var currentSSID by remember { mutableStateOf(NetworkSSIDChecker.getCurrentSSID(context)) }

    // Launcher for Android runtime permissions (Notification + Location)
    val permissionsLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        hasNotifPerm = NetworkSSIDChecker.hasNotificationPermission(context)
        hasLocPerm = NetworkSSIDChecker.hasLocationPermission(context)
        currentSSID = NetworkSSIDChecker.getCurrentSSID(context)
    }

    // Launcher for battery optimization exemption intent
    val batteryOptLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) {
        isBatteryOptimizedIgnored = NetworkSSIDChecker.isIgnoringBatteryOptimizations(context)
    }

    val requestAllPermissions = {
        val permsToRequest = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !hasNotifPerm) {
            permsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        if (!hasLocPerm) {
            permsToRequest.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        if (permsToRequest.isNotEmpty()) {
            permissionsLauncher.launch(permsToRequest.toTypedArray())
        }
    }

    val requestBatteryOptimizationExemption = {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${context.packageName}")
                }
                batteryOptLauncher.launch(intent)
            } catch (e: Exception) {
                // Fallback to battery optimization settings list
                val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                context.startActivity(intent)
            }
        }
    }

    val handleAddCurrentSSID = {
        val ssid = NetworkSSIDChecker.getCurrentSSID(context)
        if (ssid.contains("位置情報権限") || !hasLocPerm) {
            // Need permission to read SSID
            requestAllPermissions()
        } else if (ssid.isBlank() || ssid == "未接続" || ssid.startsWith("モバイル")) {
            Toast.makeText(context, "有効なWi-Fiに接続されていません", Toast.LENGTH_SHORT).show()
        } else if (allowedNetworks.contains(ssid)) {
            Toast.makeText(context, "「$ssid」は既に指定ネットワークに登録されています", Toast.LENGTH_SHORT).show()
        } else if (allowedNetworks.size >= 10) {
            Toast.makeText(context, "指定ネットワークは最大10件までです", Toast.LENGTH_SHORT).show()
        } else {
            val updated = allowedNetworks + ssid
            allowedNetworks = updated
            prefs.edit().putStringSet("allowedNetworks", updated.toSet()).apply()
            Toast.makeText(context, "「$ssid」を指定ネットワークに追加しました", Toast.LENGTH_SHORT).show()
        }
    }

    val handleAddManualSSID = {
        val trimmed = newSsidInput.trim()
        if (trimmed.isNotEmpty()) {
            if (allowedNetworks.contains(trimmed)) {
                Toast.makeText(context, "既に登録されています", Toast.LENGTH_SHORT).show()
            } else if (allowedNetworks.size >= 10) {
                Toast.makeText(context, "最大10件までです", Toast.LENGTH_SHORT).show()
            } else {
                val updated = allowedNetworks + trimmed
                allowedNetworks = updated
                prefs.edit().putStringSet("allowedNetworks", updated.toSet()).apply()
                newSsidInput = ""
                Toast.makeText(context, "「$trimmed」を追加しました", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val handleRemoveSSID = { ssid: String ->
        val updated = allowedNetworks.filter { it != ssid }
        allowedNetworks = updated
        prefs.edit().putStringSet("allowedNetworks", updated.toSet()).apply()
        Toast.makeText(context, "「$ssid」を削除しました", Toast.LENGTH_SHORT).show()
    }

    // Default initial sample clips if storage is empty
    val defaultClips = remember {
        listOf(
            "749-218 (SMSワンタイム2FA認証コード)",
            "git clone https://github.com/syncclip/syncclip-core.git",
            "https://developer.android.com/design/ui/mobile/guides/styles/color",
            "curl -X POST https://api.syncclip.local/ping",
            "ミーティング資料: https://docs.google.com/presentation/d/1XyZ..."
        )
    }

    // Mutable & persistent clipboard history
    var clipsList by remember {
        val raw = prefs.getString("savedClipsList", null)
        val initial = if (raw != null) {
            try {
                val jsonArr = org.json.JSONArray(raw)
                val list = mutableListOf<String>()
                for (i in 0 until jsonArr.length()) {
                    list.add(jsonArr.getString(i))
                }
                list
            } catch (e: Exception) {
                defaultClips
            }
        } else {
            defaultClips
        }
        mutableStateOf(initial)
    }

    val saveClipsList = { list: List<String> ->
        val jsonArr = org.json.JSONArray()
        list.forEach { jsonArr.put(it) }
        prefs.edit().putString("savedClipsList", jsonArr.toString()).apply()
    }

    val handleDeleteClip = { clipText: String ->
        val updated = clipsList.filter { it != clipText }
        clipsList = updated
        saveClipsList(updated)
        Toast.makeText(context, "履歴から削除しました", Toast.LENGTH_SHORT).show()
    }

    val handleClearAllClips = {
        clipsList = emptyList()
        saveClipsList(emptyList())
        Toast.makeText(context, "すべての履歴を消去しました", Toast.LENGTH_SHORT).show()
    }

    val allPermissionsGranted = hasNotifPerm && hasLocPerm && isBatteryOptimizedIgnored

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.ContentPaste,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "SyncClip",
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                actions = {
                    // System theme badge
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.primaryContainer,
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = if (isDark) "ダークモード" else "ライトモード",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.surface)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {

            // 1. Android Background Permissions Setup Card (Prompt if OFF)
            item {
                if (!allPermissionsGranted) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.4f)
                        ),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.error,
                                    modifier = Modifier.size(22.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "常時バックグラウンド同期の権限設定",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "画面消灯中もクリップボードを自動暗号化同期し、Wi-Fi名を正確に判定するために以下の権限をONにしてください。",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            // Individual permission checklist
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = if (hasNotifPerm) Icons.Default.Check else Icons.Default.Clear,
                                        contentDescription = null,
                                        tint = if (hasNotifPerm) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "通知の許可 (フォアグラウンド常駐サービス): ${if (hasNotifPerm) "有効" else "OFF"}",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = if (hasLocPerm) Icons.Default.Check else Icons.Default.Clear,
                                        contentDescription = null,
                                        tint = if (hasLocPerm) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Wi-Fi名(SSID)取得権限 (位置情報): ${if (hasLocPerm) "有効" else "OFF"}",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = if (isBatteryOptimizedIgnored) Icons.Default.Check else Icons.Default.Clear,
                                        contentDescription = null,
                                        tint = if (isBatteryOptimizedIgnored) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "バッテリー最適化の除外 (スリープ停止防止): ${if (isBatteryOptimizedIgnored) "除外済" else "未設定"}",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            // Action buttons
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                if (!hasNotifPerm || !hasLocPerm) {
                                    Button(
                                        onClick = { requestAllPermissions() },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("必要な権限を許可", fontSize = 12.sp)
                                    }
                                }
                                if (!isBatteryOptimizedIgnored) {
                                    FilledTonalButton(
                                        onClick = { requestBatteryOptimizationExemption() },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("バッテリー最適化除外", fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // All permissions active badge
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                        ),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "常時同期の準備完了 (すべての権限が有効です)",
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = "バックグラウンド常駐・Wi-Fi SSID検出・省電力除外が設定済みです",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                )
                            }
                        }
                    }
                }
            }

            // 2. Material You Dynamic Color Showcase
            item {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    ),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isDynamicColorSupported) "Material You ダイナミックカラー適用中" else "Material 3 カラーテーマ",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (isDynamicColorSupported) {
                                "Androidの壁紙アクセントカラーと${if (isDark) "ダークモード" else "ライトモード"}を自動取得し、UIに反映しています。"
                            } else {
                                "Androidの${if (isDark) "ダークモード" else "ライトモード"}を自動取得し、UIに反映しています。"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                        )

                        Spacer(modifier = Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(MaterialTheme.colorScheme.primary)
                            )
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(MaterialTheme.colorScheme.secondary)
                            )
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(MaterialTheme.colorScheme.tertiary)
                            )
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(MaterialTheme.colorScheme.primaryContainer)
                            )
                        }
                    }
                }
            }

            // 3. Designated Wi-Fi Whitelist (Up to 10 networks) + 1-Click Current Network Add
            item {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                    ),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column {
                                Text(
                                    text = "指定ネットワーク制限",
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.bodyLarge
                                )
                                Text(
                                    text = "接続中: $currentSSID",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.outline
                                )
                            }
                            Switch(
                                checked = networkFilter,
                                onCheckedChange = {
                                    networkFilter = it
                                    prefs.edit().putBoolean("networkFilterEnabled", it).apply()
                                }
                            )
                        }

                        // 1-Click Add Current Connected Wi-Fi Button
                        Button(
                            onClick = { handleAddCurrentSSID() },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("現在の接続中Wi-Fiを指定ネットワークに追加")
                        }

                        // Whitelist header with counter (up to 10)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "登録済みネットワーク (${allowedNetworks.size} / 10件)",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // Input field to manually add custom SSID
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = newSsidInput,
                                onValueChange = { newSsidInput = it },
                                placeholder = { Text("SSID名を手動入力...") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            FilledTonalButton(
                                onClick = { handleAddManualSSID() },
                                enabled = newSsidInput.isNotBlank() && allowedNetworks.size < 10
                            ) {
                                Text("追加")
                            }
                        }

                        // Network items list
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            allowedNetworks.forEach { ssid ->
                                val isCurrent = currentSSID == ssid
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (isCurrent) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f) else MaterialTheme.colorScheme.surface,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = ssid,
                                                fontFamily = FontFamily.Monospace,
                                                fontWeight = FontWeight.SemiBold,
                                                style = MaterialTheme.typography.bodyMedium
                                            )
                                            if (isCurrent) {
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(
                                                    text = "● 接続中",
                                                    color = MaterialTheme.colorScheme.primary,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }

                                        IconButton(
                                            onClick = { handleRemoveSSID(ssid) },
                                            modifier = Modifier.size(28.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Delete,
                                                contentDescription = "削除",
                                                tint = MaterialTheme.colorScheme.error,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 4. Clipboard History Header & List
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "クリップボード履歴 (${clipsList.size} / $maxHistory 件)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (clipsList.isNotEmpty()) {
                            TextButton(
                                onClick = { handleClearAllClips() }
                            ) {
                                Text(
                                    text = "全件削除",
                                    color = MaterialTheme.colorScheme.error,
                                    fontSize = 12.sp
                                )
                            }
                        }
                        TextButton(
                            onClick = {
                                val next = if (maxHistory >= 50) 5 else maxHistory + 5
                                maxHistory = next
                                prefs.edit().putInt("maxHistory", next).apply()
                            }
                        ) {
                            Text("上限変更 (${maxHistory}件)", fontSize = 12.sp)
                        }
                    }
                }
            }

            // Empty state if no clips
            if (clipsList.isEmpty()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.ContentPaste,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.outline,
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "クリップボード履歴はありません",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }
                    }
                }
            } else {
                // History Items List
                items(clipsList.take(maxHistory)) { clipText ->
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = clipText,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontFamily = FontFamily.Monospace,
                                    maxLines = 2
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "AES-256-GCM 暗号化同期済",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            // Copy button
                            IconButton(onClick = {
                                val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                cm.setPrimaryClip(android.content.ClipData.newPlainText("SyncClip", clipText))
                                Toast.makeText(context, "クリップボードにコピーしました", Toast.LENGTH_SHORT).show()
                            }) {
                                Icon(
                                    imageVector = Icons.Default.ContentCopy,
                                    contentDescription = "コピー",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                            // Delete button
                            IconButton(onClick = {
                                handleDeleteClip(clipText)
                            }) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "削除",
                                    tint = MaterialTheme.colorScheme.error.copy(alpha = 0.8f)
                                )
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}
