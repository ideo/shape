import CoverImageSelector from '~/ui/grid/CoverImageSelector'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import FilestackUpload from '~/utils/FilestackUpload'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

jest.mock('../../../app/javascript/utils/FilestackUpload')

let apiStore, card, collection, uiStore
let props = {}
let rerender
const fakeEv = { preventDefault: jest.fn() }
let component, wrapper, innerWrapper

describe('CoverImageSelector', () => {
  beforeEach(() => {
    card = fakeCollectionCard
    card.record = {
      id: 3,
      internalType: 'collections',
      API_fetchCards: jest.fn(),
      collection_cards: [
        { id: 1, record: { id: 1, name: '', filestack_file_url: '' } },
      ],
    }
    collection = fakeCollection
    const requestResult = { data: collection }
    apiStore = fakeApiStore({
      requestResult,
      findResult: collection,
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
    rerender = (opts = {}) => {
      const newProps = { ...props, ...opts }
      wrapper = shallow(<CoverImageSelector.wrappedComponent {...newProps} />)
      component = wrapper.instance()
      const Inner = () => component.renderInner()
      innerWrapper = shallow(<Inner />)
    }
    rerender()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  describe('render()', () => {
    it('should render a card action holder', () => {
      expect(wrapper.find(CardActionHolder).exists()).toBe(true)
    })
  })

  describe('renderInner()', () => {
    it('should render the QuickOptionSelectors for images and filters', () => {
      expect(innerWrapper.find('QuickOptionSelector').length).toEqual(2)
    })

    it('should render a TextareaAutosize for editing card titles', () => {
      expect(innerWrapper.find('TextareaAutosize').length).toEqual(1)
    })

    describe('with a VideoItem that has no thumbnail_url', () => {
      beforeEach(() => {
        rerender({
          card: {
            record: {
              internalType: 'items',
              type: 'Item::VideoItem',
              thumbnail_url: null,
            },
          },
        })
      })

      it('should not render the second QuickOptionSelector for filters', () => {
        expect(innerWrapper.find('QuickOptionSelector').length).toEqual(1)
      })
    })
  })

  describe('on click', () => {
    beforeEach(() => {
      const holder = wrapper.find(CardActionHolder)
      holder.simulate('click', fakeEv)
    })

    it('should set an editing card cover', () => {
      expect(uiStore.setEditingCardCover).toHaveBeenCalledWith(card.id)
    })

    it('should set the list of options from the api', () => {
      expect(component.imageOptions.length).toEqual(3)
    })
  })

  describe('onImageOpionSelect', () => {
    describe('with an image', () => {
      it('should set the selecteds card cover to true', () => {})

      it('should save the card', () => {})
    })

    describe('with a remove action', () => {
      beforeEach(() => {
        apiStore.find.mockReset()
        apiStore.find.mockReturnValue(collection)
        component.onImageOptionSelect({ type: 'remove' })
      })

      describe('when removing a collection cover', () => {
        beforeEach(() => {
          apiStore.find.mockReset()
          apiStore.find.mockReturnValue(collection)
          component.onImageOptionSelect({ type: 'remove' })
        })

        it('should call clear collection cover for the collection', () => {
          expect(collection.API_clearCollectionCover).toHaveBeenCalled()
        })
      })

      describe('when removing an item cover', () => {
        beforeEach(() => {
          props.card.record = {
            internalType: 'items',
            id: 3,
            thumbnail_url: '',
            save: jest.fn(),
          }
          wrapper.setProps(props)
          component.onImageOptionSelect({ type: 'remove' })
        })

        it('should set the thumbnail_url on the item and save', () => {
          expect(props.card.record.save).toHaveBeenCalled()
        })
      })

      it('should close the selector', () => {
        expect(uiStore.setEditingCardCover).toHaveBeenCalledWith(null)
      })
    })

    describe('with an upload action', () => {
      beforeEach(() => {
        component.onImageOptionSelect({ type: 'upload' })
        wrapper.update()
      })

      it('should call the filestack upload picker', () => {
        expect(FilestackUpload.pickImage).toHaveBeenCalled()
      })
    })
  })

  describe('onFilterOptionSelect', () => {
    beforeEach(() => {
      apiStore.find.mockReset()
      apiStore.find.mockReturnValue(collection)
      component.onFilterOptionSelect({ type: 'nothing' })
    })

    it('should close the menu', () => {
      expect(uiStore.setEditingCardCover).toHaveBeenCalledWith(null)
    })

    it('should save the card', () => {
      expect(props.card.save).toHaveBeenCalled()
    })
  })
})
