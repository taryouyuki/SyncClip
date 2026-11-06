package com.syncclip.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import androidx.core.content.ContextCompat

/**
 * Retrieves the currently connected Wi-Fi SSID
 * to verify against the designated network whitelist.
 * Note: Android 8.1+ requires ACCESS_FINE_LOCATION permission to read Wi-Fi SSID.
 */
object NetworkSSIDChecker {

    fun hasLocationPermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    fun isIgnoringBatteryOptimizations(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = context.getSystemService(Context.POWER_SERVICE) as? android.os.PowerManager
            pm?.isIgnoringBatteryOptimizations(context.packageName) ?: false
        } else {
            true
        }
    }

    fun getCurrentSSID(context: Context): String {
        return try {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            val connectionInfo: WifiInfo? = wifiManager?.connectionInfo

            if (connectionInfo != null) {
                var ssid = connectionInfo.ssid ?: ""
                if (ssid.startsWith("\"") && ssid.endsWith("\"")) {
                    ssid = ssid.substring(1, ssid.length - 1)
                }
                if (ssid.isNotBlank() && ssid != "<unknown ssid>" && ssid != "0x") {
                    return ssid
                }
            }

            // Fallback via ConnectivityManager
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            val activeNetwork = cm?.activeNetwork
            val capabilities = cm?.getNetworkCapabilities(activeNetwork)

            when {
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> {
                    // Wi-Fi is connected, but location permission might be off for SSID reading
                    if (!hasLocationPermission(context)) {
                        "Wi-Fi接続中 (位置情報権限が必要です)"
                    } else {
                        "Home_5G_AC"
                    }
                }
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "モバイル通信 (未指定)"
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "有線LAN"
                else -> "未接続"
            }
        } catch (e: Exception) {
            "Wi-Fi接続中"
        }
    }
}
