package com.syncclip.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Auto-starts the ClipboardListenerService when the Android device finishes booting.
 * Fulfills requirement: "端末起動時自動起動+同期"
 */
class BootCompletedReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (Intent.ACTION_BOOT_COMPLETED == action ||
            Intent.ACTION_MY_PACKAGE_REPLACED == action ||
            "android.intent.action.QUICKBOOT_POWERON" == action) {

            val prefs = context.getSharedPreferences("SyncClipPrefs", Context.MODE_PRIVATE)
            val autoStartOnBoot = prefs.getBoolean("autoStartOnBoot", true)

            if (autoStartOnBoot) {
                val serviceIntent = Intent(context, ClipboardListenerService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            }
        }
    }
}
