export default function initZendesk(user) {
  // for some reason zE will be initialized but zE.identify is undefined
  // unless we wait a few secs
  setTimeout(() => {
    const { zE } = window
    if (!zE) return
    zE(() => {
      if (zE.identify) {
        const { name, email } = user
        zE.identify({ name, email })
      }
    })
  }, 5000)
}
