import ExpoModulesCore
import MediaPlayer

public class MusicPickerModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoMusicPicker")
    
    function("sayHello") { (promise: Promise) in
      promise.resolve("Hello World")
    }
    
    function("openPicker") { (options: Dictionary<String, Any>, promise: Promise) in
      self.delegate = PickerDelegate(promise: promise)
      DispatchQueue.main.async {
        self.picker = MPMediaPickerController(mediaTypes: .anyAudio)
        self.picker?.delegate = self.delegate
        self.picker?.allowsPickingMultipleItems = false
        self.picker?.showsCloudItems = false
        
        guard let viewController = RCTPresentedViewController() else {
          promise.reject("E", "ViewController is null")
          return
        }
        viewController.present(self.picker!, animated: true)
      }
    }
  }
  
  private var picker: MPMediaPickerController? = nil
  private var delegate: PickerDelegate? = nil
}

class PickerDelegate: NSObject, MPMediaPickerControllerDelegate {
  private let promise: Promise
  init(promise: Promise) {
    self.promise = promise
  }
  
  public func mediaPicker(_ mediaPicker: MPMediaPickerController,
                          didPickMediaItems mediaItemCollection: MPMediaItemCollection) {
    // Get the system music player.
    DispatchQueue.main.async {
      mediaPicker.dismiss(animated: true, completion: {
        guard mediaItemCollection.count == 1 else {
          self.promise.resolve()
          return
        }
        
        let song = mediaItemCollection.items[0]
        
        let result: NSDictionary = [
          "canceled": false,
          "artist": song.artist as Any,
          "uri": song.assetURL?.absoluteString as Any,
          "title": song.title as Any
        ]
        
        self.promise.resolve(result)
      })
    }
  }
  
  public func mediaPickerDidCancel(_ mediaPicker: MPMediaPickerController) {
    DispatchQueue.main.async {
      mediaPicker.dismiss(animated: true, completion: {
        self.promise.resolve([
          "canceled": true
        ])
      })
    }
  }
}
