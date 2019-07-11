import ArchivedBanner from '~/ui/layout/ArchivedBanner'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'

const props = {
  uiStore: fakeUiStore,
  routingStore: fakeRoutingStore,
}

let wrapper
function render() {
  return shallow(<ArchivedBanner.wrappedComponent {...props} />)
}

describe('ArchivedBanner', () => {
  describe('by default', () => {
    beforeEach(() => {
      wrapper = render()
    })

    it('should not render', () => {
      expect(wrapper.type()).toEqual(null)
    })
  })

  describe('with an archived record', () => {
    beforeEach(() => {
      props.uiStore.viewingRecord = {
        id: 1,
        name: 'collection',
        className: 'collection',
        archived: true,
      }
      wrapper = render()
    })

    it('should render the archived message', () => {
      const leftComponent = wrapper.find('Banner').prop('leftComponent')
      const html = shallow(leftComponent)
      expect(html.text()).toMatch('This collection has been archived')
    })

    it('should not render a RightComponent', () => {
      const rightComponent = wrapper.find('Banner').prop('rightComponent')
      const html = shallow(rightComponent)
      expect(html.text()).toEqual('')
    })

    describe('with a restorable parent', () => {
      beforeEach(() => {
        props.uiStore.viewingRecord.restorable_parent = {
          name: 'parent collection',
        }
        wrapper = render()
      })

      it('should render the archived message', () => {
        const leftComponent = wrapper.find('Banner').prop('leftComponent')
        const html = shallow(leftComponent)
        expect(html.text()).toMatch('This collection has been archived')
      })

      it('should render a link to the parent', () => {
        const rightComponent = wrapper.find('Banner').prop('rightComponent')
        const html = shallow(rightComponent)
        const link = html.find('Link')
        expect(link.children().text()).toMatch('parent collection')
      })
    })
  })
})
