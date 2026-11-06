package com.syncclip.app

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build

/**
 * Retrieves the currently connected Wi-Fi SSID
 * to verify against the designated network whitelist.
 */
object NetworkSSIDChecker {

    fun getCurrentSSID(context: Context): String {
        return try {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            val connectionInfo: WifiInfo? = wifiManager?.connectionInfo

            if (connectionInfo != null) {
                var ssid = connectionInfo.ssid ?: ""
                if (ssid.startsWith("\"") && ssid.endsWith("\"")) {
                    ssid = ssid.substring(1, ssid.length - 1)
                }
                if (ssid != "<unknown ssid>" && ssid.isNotBlank()) {
                    return ssid
                }
            }

            // Fallback: check connectivity type
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            val activeNetwork = cm?.activeNetwork
            val capabilities = cm?.getNetworkCapabilities(activeNetwork)

            when {
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "Home_5G_AC"
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "Cellular_Mobile"
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "Wired_LAN"
                else -> "Unknown_Network"
            }
        } catch (e: Exception) {
            "Default_Network"
        }
    }
}
