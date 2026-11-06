package com.syncclip.app

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Start background clipboard listener service
        val serviceIntent = Intent(this, ClipboardListenerService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }

        setContent {
            SyncClipAndroidApp()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SyncClipAndroidApp() {
    var maxHistory by remember { mutableStateOf(5) }
    var autoSync by remember { mutableStateOf(true) }
    var networkFilter by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("SyncClip (Android)") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Text(
                text = "クリップボード自動同期・暗号化稼働中",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "履歴表示数: $maxHistory 件 (設定で拡張可能)",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("自動同期", modifier = Modifier.weight(1f))
                Switch(checked = autoSync, onCheckedChange = { autoSync = it })
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("指定ネットワーク制限", modifier = Modifier.weight(1f))
                Switch(checked = networkFilter, onCheckedChange = { networkFilter = it })
            }
        }
    }
}
