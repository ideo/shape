import { TOUCH_DEVICE_OS } from '~/utils/variables'

// https://stackoverflow.com/questions/21741841/detecting-ios-android-operating-system
export const getTouchDeviceOS = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera

  // Windows Phone must come first because its UA also contains "Android"
  if (/windows phone/i.test(userAgent)) {
    return TOUCH_DEVICE_OS.WINDOWS
  }

  if (/android/i.test(userAgent)) {
    return TOUCH_DEVICE_OS.ANDROID
  }

  // iOS detection from: http://stackoverflow.com/a/9039885/177710
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return TOUCH_DEVICE_OS.IOS
  }

  return TOUCH_DEVICE_OS.UNKNOWN
}
