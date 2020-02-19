import ScrollNearPageBoundsService, {
  SCROLL_ANIMATION_SPEED,
} from '~/utils/ScrollNearPageBoundsService'
import fakeUiStore from '#/mocks/fakeUiStore'

const uiStore = fakeUiStore

window.scrollBy = jest.fn()
let service
const ev = {
  clientX: 0,
  clientY: 0,
}
const reinitialize = () => {
  window.scrollBy.mockClear()
  service = new ScrollNearPageBoundsService({ uiStore })
}
describe('ScrollNearPageBoundsService', () => {
  beforeEach(() => {
    reinitialize()
  })

  describe('scrollIfNearPageBounds', () => {
    it('sets speed multiplier', () => {
      service.scrollIfNearPageBounds(ev, { speed: 3 })
      expect(service.speed).toEqual(3)
      expect(window.scrollBy).toHaveBeenCalledWith(
        -1 * SCROLL_ANIMATION_SPEED * 3,
        0
      )
    })

    it('calls scroll up if clientY is at the top', () => {
      service.scrollIfNearPageBounds(ev)
      expect(window.scrollBy).toHaveBeenCalledWith(
        -1 * SCROLL_ANIMATION_SPEED,
        0
      )
    })
  })

  describe('scrollRight', () => {
    it('calls window.scrollBy to the right', () => {
      service.setScrolling(true)
      service.scrollRight()
      expect(window.scrollBy).toHaveBeenCalledWith(SCROLL_ANIMATION_SPEED, 0)
    })
  })

  describe('scrollLeft', () => {
    it('calls window.scrollBy to the left', () => {
      service.setScrolling(true)
      service.scrollLeft()
      expect(window.scrollBy).toHaveBeenCalledWith(
        -1 * SCROLL_ANIMATION_SPEED,
        0
      )
    })
    it('does not calls window.scrollBy if scrolling is false', () => {
      service.setScrolling(false)
      service.scrollLeft()
      expect(window.scrollBy).not.toHaveBeenCalled()
    })
  })
})
