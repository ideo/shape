import CoverImageSelector from '~/ui/grid/CoverImageSelector'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import FilestackUpload from '~/utils/FilestackUpload'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

jest.mock('../../../app/javascript/utils/FilestackUpload')

let apiStore, card, collection, uiStore
let props = {}
let rerender
const fakeEv = { preventDefault: jest.fn() }
let component, wrapper

describe('CoverImageSelector', () => {
  beforeEach(() => {
    card = fakeCollectionCard
    collection = fakeCollection
    const requestResult = { data: collection }
    apiStore = fakeApiStore({
      requestResult,
    })
    uiStore = fakeUiStore

    const modalRoot = document.createElement('div')
    modalRoot.setAttribute('id', `gridCard-${card.id}`)
    const body = global.document.querySelector('body')
    body.appendChild(modalRoot)

    props = {
      card,
      apiStore,
      uiStore,
    }
    rerender = () => {
      wrapper = shallow(<CoverImageSelector.wrappedComponent {...props} />)
      component = wrapper.instance()
    }
    rerender()
  })

  describe('render()', () => {
    it('should render a card action holder', () => {
      expect(wrapper.find(CardActionHolder).exists()).toBe(true)
    })

    describe('when the selector is open', () => {
      beforeEach(() => {
        component.open = true
        wrapper.update()
      })
    })
  })

  describe('on click', () => {
    beforeEach(() => {
      const holder = wrapper.find(CardActionHolder)
      holder.simulate('click', fakeEv)
    })

    it('should set open to true', () => {
      expect(component.open).toBe(true)
    })

    it('should set the list of options from the api', () => {
      expect(component.options.length).toEqual(3)
    })
  })

  describe('onOpionSelect', () => {
    describe('with an image', () => {
      it('should set the selecteds card cover to true', () => {})

      it('should save the card', () => {})
    })

    describe('with a remove action', () => {
      beforeEach(() => {
        apiStore.find.mockReset()
        apiStore.find.mockReturnValue(collection)
        component.onOptionSelect({ type: 'remove' })
      })

      it('should call clear collection cover for the collection', () => {
        expect(collection.API_clearCollectionCover).toHaveBeenCalled()
      })

      it('should close the selector', () => {
        expect(component.open).toBe(false)
      })
    })

    describe('with an upload action', () => {
      beforeEach(() => {
        component.onOptionSelect({ type: 'upload' })
        wrapper.update()
      })

      it('should call the filestdk upload picker', () => {
        expect(FilestackUpload.pickImage).toHaveBeenCalled()
      })
    })
  })
})
