import CardCoverEditor from '~/ui/grid/CardCoverEditor'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import FilestackUpload from '~/utils/FilestackUpload'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

jest.mock('../../../app/javascript/utils/FilestackUpload')
jest.mock('../../../app/javascript/utils/parseURLMeta', () =>
  jest.fn().mockReturnValue(
    Promise.resolve({
      title: 'new title',
      description: 'a new description',
    })
  )
)

let apiStore, card, collection, uiStore
let props = {}
let rerender
const fakeEv = { preventDefault: jest.fn() }
let component, wrapper, innerWrapper

describe('CardCoverEditor', () => {
  beforeEach(() => {
    card = fakeCollectionCard
    card.record = {
      ...fakeCollection,
      id: '3',
      collection_cards: [
        { id: 1, record: { id: 1, name: '', filestack_file_url: '' } },
      ],
      sortedCoverCards: [
        { id: 1, record: { id: 1, name: 'CoverImg', imageUrl: jest.fn() } },
      ],
      sortedBackgroundCards: [
        { id: 1, record: { id: 1, name: 'CoverImg', imageUrl: jest.fn() } },
      ],
      cover: {
        hardcoded_subtitle: 'Lorem ipsum hardcoded',
        subtitle_hidden: false,
      },
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
      wrapper = shallow(<CardCoverEditor.wrappedComponent {...newProps} />)
      component = wrapper.instance()
      const Inner = () => component.renderInner()
      innerWrapper = shallow(<Inner />)
    }
    rerender()
  })

  describe('render()', () => {
    it('should render a card action holder', () => {
      expect(wrapper.find(CardActionHolder).exists()).toBe(true)
    })
  })

  describe('renderInner()', () => {
    describe('with a collection', () => {
      it('should render the QuickOptionSelectors for cover, bg images, font and filters', () => {
        expect(innerWrapper.find('QuickOptionSelector').length).toEqual(4)
      })

      it('should render a TextareaAutosize for editing card title and subtitle', () => {
        expect(innerWrapper.find('TextareaAutosize').length).toEqual(2)
      })
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

      it('should only render the single option selector for cover images', () => {
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

    it('should set the list of options from the api', async () => {
      await component.populateAllImageOptions()
      expect(component.coverImageOptions.length).toEqual(4)
      expect(component.coverImageOptions.map(i => i.title)).toEqual([
        'remove image',
        'CoverImg',
        'gray',
        'upload new image',
      ])
    })
  })

  describe('updating name and cover', () => {
    beforeEach(() => {
      props.isEditingCardCover = collection.id
      wrapper.setProps(props)
    })
    describe('closing the cover editor', () => {
      beforeEach(() => {
        component.handleClose(fakeEv)
      })
      it('should close the selector', () => {
        expect(uiStore.setEditingCardCover).toHaveBeenCalledWith(null)
      })
      it('should call API_updateNameAndCover with the edited title text', () => {
        expect(uiStore.setEditingCardCover).toHaveBeenCalled()
      })
    })
  })

  describe('onImageOptionSelect', () => {
    describe('with an image', () => {
      beforeEach(() => {
        apiStore.find.mockReset()
        apiStore.find.mockReturnValue(collection)
        collection.patch.mockReset()
        component.onImageOptionSelect({ cardId: 'something' })
      })

      it('should update the selected card cover to true', () => {
        expect(collection.patch).toHaveBeenCalledWith({
          attributes: { is_cover: true },
        })
      })
    })

    describe('with a remove action', () => {
      beforeEach(() => {
        apiStore.find.mockReset()
        apiStore.find.mockReturnValue(collection)
        component.onImageOptionSelect({ type: 'remove' })
      })

      describe('when removing a collection cover', () => {
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
      })

      it('should call the filestack upload picker', () => {
        expect(FilestackUpload.pickImage).toHaveBeenCalled()
      })
    })
  })

  describe('onBackgroundImageOptionSelect', () => {
    describe('with an image', () => {
      beforeEach(() => {
        apiStore.find.mockReset()
        apiStore.find.mockReturnValue(collection)
        collection.patch.mockReset()
        component.onBackgroundImageOptionSelect({ cardId: 'something' })
      })

      it('should update the selected card cover to true', () => {
        expect(collection.patch).toHaveBeenCalledWith({
          attributes: { is_background: true },
        })
      })
    })

    describe('with a remove action', () => {
      beforeEach(() => {
        apiStore.find.mockReset()
        apiStore.find.mockReturnValue(collection)
        component.onBackgroundImageOptionSelect({ type: 'remove' })
      })

      it('should call clear collection cover for the collection', () => {
        expect(collection.API_clearBackgroundImage).toHaveBeenCalled()
      })

      it('should close the selector', () => {
        expect(uiStore.setEditingCardCover).toHaveBeenCalledWith(null)
      })
    })

    describe('with an upload action', () => {
      beforeEach(() => {
        component.onBackgroundImageOptionSelect({ type: 'upload' })
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
      expect(props.card.API_updateCardFilter).toHaveBeenCalled()
    })
  })

  describe('handleRestore()', () => {
    beforeEach(() => {
      rerender()
      component.cardTitle = 'First title'
      component.hardcodedSubtitle = 'First description'
      component.handleRestore()
    })

    it('should set the subtitle to the metadata', () => {
      expect(component.cardTitle).toEqual('new title')
    })

    it('should set the title to the metadata title', () => {
      expect(component.hardcodedSubtitle).toEqual('a new description')
    })
  })
})
