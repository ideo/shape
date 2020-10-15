import v from '~/utils/variables'
import { uiStore as globalUiStore } from '~/stores'

export const SCROLL_ANIMATION_SPEED = 1.5

export default class ScrollNearPageBoundsService {
  // stores can be passed in e.g. for unit testing, but default to the imported ones
  constructor({ uiStore = globalUiStore } = {}) {
    this.uiStore = uiStore
    this.scrolling = false
    this.speed = 1
  }

  scrollIfNearPageBounds = (e, { horizontalScroll = true, speed = 1 } = {}) => {
    const { uiStore } = this
    const { gridW } = uiStore.gridSettings
    this.speed = speed
    this.setScrolling(false)

    let topScrollTriggerDyn = v.topScrollTrigger
    if (window.innerHeight < 800) {
      topScrollTriggerDyn = window.innerHeight / 8
    }

    // NOTE: these hide so that we can fully control the page scroll
    // otherwise the browser will *also* try to scroll when you hit the edges;
    // however, there is some UI helpfulness lost if you can't see the scrollbars :(
    if (!horizontalScroll) {
      document.body.style['overflow-x'] = 'hidden'
      document.body.style['overflow-y'] = 'hidden'
    }

    const changedTouch = e.changedTouches ? e.changedTouches[0] : {}
    // Vertical Scroll
    if (
      e.clientY < topScrollTriggerDyn ||
      (uiStore.isTouchDevice && changedTouch.clientY < topScrollTriggerDyn)
    ) {
      // At top of viewport
      this.scrolling = true
      this.scrollUp(null, e.clientY)
    } else if (
      e.clientY > window.innerHeight - topScrollTriggerDyn ||
      (uiStore.isTouchDevice &&
        changedTouch.clientY > window.innerHeight - v.topScrollTriggerDyn)
    ) {
      // At bottom of viewport
      this.scrolling = true
      this.scrollDown()
    }

    // Horizontal Scroll
    if (!horizontalScroll) {
      return
    }
    const leftMargin = v.containerPadding.horizontal * 16
    const cardWidth = gridW / 2

    // At right of viewport
    if (
      e.clientX > window.innerWidth - cardWidth + leftMargin ||
      (uiStore.isTouchDevice &&
        changedTouch.clientX > window.innerWidth - cardWidth + leftMargin)
    ) {
      this.scrolling = true
      this.scrollRight()
      // At left of viewport
    } else if (
      e.clientX - cardWidth - leftMargin < 0 ||
      (uiStore.isTouchDevice &&
        changedTouch.clientX - cardWidth - leftMargin < 0)
    ) {
      this.scrolling = true
      this.scrollLeft()
    }
  }

  setScrolling(val) {
    this.scrolling = val
  }

  get scrollAmount() {
    // When zooming browser in or out, it doesn't work to use `1` as the unit,
    // There aren't any reliable ways to get the zoom level from all browsers.
    // This library doesn't work: https://github.com/tombigel/detect-zoom.
    // window.devicePixelRatio doesn't work on all browsers.
    // Setting a div of a fixed width on the page and measuring it's width doesn't work.
    //
    // What we need is to return a value that is > 1 for zoomed in screens
    // window.devicePixelRatio will be 1 for non-retina
    // and retina is likely at 2, but if zoomed out to 50% is 1
    //
    let amount
    if (window.devicePixelRatio >= 2) {
      amount = window.devicePixelRatio * (SCROLL_ANIMATION_SPEED / 2)
    } else if (window.devicePixelRatio >= 1) {
      amount = SCROLL_ANIMATION_SPEED
    } else {
      // After testing out multiple values, this seemed to be the right balance
      amount = SCROLL_ANIMATION_SPEED / window.devicePixelRatio
    }
    return amount * this.speed
  }

  scrollUp = (timestamp, clientY) => {
    if (!this.scrolling) return null
    const { scrollAmount } = this
    if (clientY) this.clientY = clientY
    const scrollY = window.scrollY || window.pageYOffset
    if (scrollY < 10) {
      return window.requestAnimationFrame(this.scrollUp)
    }

    window.scrollBy(0, -scrollAmount)

    return window.requestAnimationFrame(this.scrollUp)
  }

  scrollDown = timestamp => {
    if (!this.scrolling) return null
    const { uiStore } = this
    const { scrollAmount } = this
    const scrollY = window.scrollY || window.pageYOffset

    if (
      window.innerHeight + scrollY >=
      document.body.offsetHeight + uiStore.gridSettings.gridH * 2
    ) {
      return window.requestAnimationFrame(this.scrollDown)
    }

    window.scrollBy(0, scrollAmount)

    return window.requestAnimationFrame(this.scrollDown)
  }

  scrollLeft = timestamp => {
    if (!this.scrolling) return null
    const { scrollAmount } = this

    window.scrollBy(-scrollAmount, 0)
    return window.requestAnimationFrame(this.scrollLeft)
  }

  scrollRight = timestamp => {
    if (!this.scrolling) return null
    const { scrollAmount } = this

    window.scrollBy(scrollAmount, 0)
    return window.requestAnimationFrame(this.scrollRight)
  }
}

export const pageBoundsScroller = new ScrollNearPageBoundsService()
