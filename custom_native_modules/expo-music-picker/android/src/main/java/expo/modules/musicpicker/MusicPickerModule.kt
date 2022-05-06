package expo.modules.musicpicker

import android.app.Activity
import android.app.Activity.RESULT_CANCELED
import android.content.Intent
import android.os.Bundle
import android.provider.MediaStore
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val moduleName = "ExpoMusicPicker"
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

    OnActivityResult { activity, (requestCode, resultCode, data) ->
      if (requestCode != INTENT_REQUEST_ID || pendingPromise == null) {
        return@OnActivityResult
      }

      if (resultCode == RESULT_CANCELED) {
        pendingPromise?.resolve(Bundle().apply {
          putBoolean("canceled", true)
        })
      }

      /*
      ACTION_PICK -> data.mData = content:// uri, no other info
      GET_CONTENT -> the same
       */

      pendingPromise?.resolve(Bundle().apply {
        putString("uri", data?.data.toString())
        putBoolean("canceled", false)
      })
    }
  }

}
