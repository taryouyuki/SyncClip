package com.syncclip.app

import android.util.Base64
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import java.security.MessageDigest

data class EncryptedBundle(
    val ciphertext: String,
    val iv: String,
    val salt: String,
    val hash: String
)

/**
 * AES-256-GCM Cryptographic Engine for SyncClip Android
 * Uses PBKDF2 with 100,000 iterations for key derivation, compatible with Web Crypto API.
 */
object CryptoManager {
    private const val ITERATIONS = 100000
    private const val KEY_LENGTH = 256
    private const val GCM_TAG_LENGTH = 128

    fun encrypt(plainText: String, passphrase: String): EncryptedBundle {
        val random = SecureRandom()
        val salt = ByteArray(16).also { random.nextBytes(it) }
        val iv = ByteArray(12).also { random.nextBytes(it) }

        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val spec = PBEKeySpec(passphrase.toCharArray(), salt, ITERATIONS, KEY_LENGTH)
        val secretKey = SecretKeySpec(factory.generateSecret(spec).encoded, "AES")

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, GCMParameterSpec(GCM_TAG_LENGTH, iv))
        val cipherBytes = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))

        val md = MessageDigest.getInstance("SHA-256")
        val hashBytes = md.digest(plainText.toByteArray(Charsets.UTF_8))
        val hashHex = hashBytes.joinToString("") { "%02x".format(it) }

        return EncryptedBundle(
            ciphertext = Base64.encodeToString(cipherBytes, Base64.NO_WRAP),
            iv = Base64.encodeToString(iv, Base64.NO_WRAP),
            salt = Base64.encodeToString(salt, Base64.NO_WRAP),
            hash = hashHex
        )
    }

    fun decrypt(ciphertext: String, iv: String, salt: String, passphrase: String): String {
        val cipherBytes = Base64.decode(ciphertext, Base64.NO_WRAP)
        val ivBytes = Base64.decode(iv, Base64.NO_WRAP)
        val saltBytes = Base64.decode(salt, Base64.NO_WRAP)

        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val spec = PBEKeySpec(passphrase.toCharArray(), saltBytes, ITERATIONS, KEY_LENGTH)
        val secretKey = SecretKeySpec(factory.generateSecret(spec).encoded, "AES")

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, secretKey, GCMParameterSpec(GCM_TAG_LENGTH, ivBytes))
        val decryptedBytes = cipher.doFinal(cipherBytes)

        return String(decryptedBytes, Charsets.UTF_8)
    }
}
