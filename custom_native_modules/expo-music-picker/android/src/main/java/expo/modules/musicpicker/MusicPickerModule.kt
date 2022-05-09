package expo.modules.musicpicker

import android.app.Activity
import android.app.Activity.RESULT_CANCELED
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val moduleName = "ExpoMusicPicker"
const val TAG = "expo-music-picker"
private const val INTENT_REQUEST_ID = 2317

class MusicPickerModule : Module() {
  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name(moduleName)

    AsyncFunction("sayHello") {
      "Hello World! Android"
    }

    AsyncFunction("openPicker") { options: Map<String, String>, promise: Promise ->
      val intent = Intent(
              Intent.ACTION_GET_CONTENT,
              MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      ).apply {
        type = "audio/*"
        addCategory(Intent.CATEGORY_OPENABLE)
//        putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/ogg", "application/x-ogg"))
      }

      pendingPromise = promise
      appContext.activityProvider!!.currentActivity.startActivityForResult(
              Intent.createChooser(intent, "Select Audio"),
              INTENT_REQUEST_ID,
              null
      )
    }

    OnActivityResult { _, (requestCode, resultCode, data) ->
      when(requestCode) {
        INTENT_REQUEST_ID -> processPickerResult(resultCode, data)
      }
    }
  }

  private fun processPickerResult(resultCode: Int, intent: Intent?) {
    val resultBundle: Bundle = Bundle().apply {
      if (resultCode == RESULT_CANCELED) {
        putBoolean("canceled", true)
      } else {
        putBoolean("canceled", false)
        val audioInfo = getAudioInfo(intent!!.data!!)
        audioInfo.toBundle(this)
      }
    }
    pendingPromise?.resolve(resultBundle)

    pendingPromise = null
  }

  private fun getAudioInfo(uri: Uri): AudioFileInfo {

    val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.DISPLAY_NAME,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
    )

     return appContext.reactContext!!.contentResolver.query(
            uri,
            projection,
            null,
            null,
            null
    )?.use { cursor ->
      if (!cursor.moveToFirst()) {
        Log.w(TAG, "The cursor of picked media is empty")
        return@use null
      }
      val nameColumn =
              cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME)
      val durationColumn =
              cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
      val titleColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
       val artistColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)

       val name = cursor.getString(nameColumn)
       val duration = cursor.getInt(durationColumn)
       val title = cursor.getString(titleColumn)
       val artist = cursor.getString(artistColumn)

       Log.d(TAG, "Picked song: $name ($artist - $title)")

       return@use AudioFileInfo(
               uri.toString(),
               title,
               artist,
               duration = duration.toDouble(),
               displayName = name)
    } ?: AudioFileInfo(uri.toString()).also {
      Log.w(TAG, "Couldn't get audio metadata, returning only uri")
     }

  }
}

data class AudioFileInfo(
        val uri: String,
        val title: String? = "Untitled",
        val artist: String? = "Unknown artist",
        val duration: Double? = 0.0,
        val displayName: String = "$artist - $title"
) {
  fun toBundle(initialBundle: Bundle = Bundle()) = initialBundle.apply {
    putString("uri", uri)
    putString("title", title)
    putString("artist", artist)
    putDouble("duration", duration ?: 0.0)
    putString("displayName", displayName)
  }
}
