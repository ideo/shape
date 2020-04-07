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

  // iOS detection from: https://stackoverflow.com/a/58065241
  if (/iPad|iPhone|iPod|Safari/.test(userAgent) && !window.MSStream) {
  }

  if (
    (/iPad|iPhone|iPod/.test(navigator.platform) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
    !window.MSStream
  ) {
    return TOUCH_DEVICE_OS.IOS
  }

  return TOUCH_DEVICE_OS.UNKNOWN
}
