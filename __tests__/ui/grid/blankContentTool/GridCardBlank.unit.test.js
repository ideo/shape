import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import FilestackUpload from '~/utils/FilestackUpload'
import { fakeCollectionCard } from '#/mocks/data'
import googleTagManager from '~/vendor/googleTagManager'
import { ITEM_TYPES } from '~/utils/variables'

jest.mock('../../../../app/javascript/vendor/googleTagManager')

const mockCardMethods = {
  API_create: jest.fn().mockResolvedValue({ record: { id: 1 } }),
  API_replace: jest.fn().mockResolvedValue({ record: { id: 1 } }),
}

// replace FilestackUpload with a mock, no need to hit actual filestack API
jest.mock('../../../../app/javascript/utils/FilestackUpload')
// in order to mock our way past `new CollectionCard(attrs, apiStore)`
jest.mock('../../../../app/javascript/stores/jsonApi/CollectionCard', () =>
  jest.fn().mockImplementation(() => mockCardMethods)
)
jest.mock('../../../../app/javascript/stores/jsonApi/Item', () =>
  jest.fn().mockImplementation(() => mockCardMethods)
)

let props, wrapper, replacingCard, component
beforeEach(() => {
  CollectionCard.mockClear()
  replacingCard = fakeCollectionCard
  props = {
    uiStore: fakeUiStore,
    apiStore: fakeApiStore({ findResult: replacingCard }),
    parent: { id: 1 },
  }
  wrapper = shallow(<GridCardBlank.wrappedComponent {...props} />)
  component = wrapper.instance()
  FilestackUpload.pickImage = jest
    .fn()
    .mockReturnValue(Promise.resolve({ filesUploaded: [] }))
})

describe('GridCardBlank', () => {
  describe('when starting to create a new card (choosing an option)', () => {
    it('renders the content creation buttons', () => {
      expect(wrapper.find('BctButtonBox').length).toBe(7)
    })

    it('renders the close button', () => {
      expect(wrapper.find('CloseButton').exists()).toBeTruthy()
    })

    it('opens CollectionCreator with onClick handler', () => {
      component.startCreating('collection')()
      wrapper.update()
      expect(wrapper.state().creating).toEqual('collection')
      expect(wrapper.find('CollectionCreator').exists()).toBe(true)
    })

    it('triggers FilestackUpload with onClick handler', () => {
      component.pickImages()
      wrapper.update()
      expect(wrapper.state().creating).toEqual(null)
      expect(FilestackUpload.pickImages).toHaveBeenCalled()
    })

    it('opens LinkCreator (video) with onClick handler', () => {
      component.startCreating('video')()
      wrapper.update()
      expect(wrapper.state().creating).toEqual('video')
      expect(wrapper.find('LinkCreator').props().type).toEqual('video')
    })

    it('opens LinkCreator (link) with onClick handler', () => {
      component.startCreating('link')()
      wrapper.update()
      expect(wrapper.state().creating).toEqual('link')
      expect(wrapper.find('LinkCreator').props().type).toEqual('link')
    })

    describe('when creating a card', () => {
      it('synchronously calls API_create with TextItem onClick handler', () => {
        component.createTextItem()
        expect(mockCardMethods.API_create).toHaveBeenCalled()
        expect(props.uiStore.closeBlankContentTool).toHaveBeenCalled()
      })

      it('calls API_create when creating', async () => {
        await component.createCard()
        expect(wrapper.state().loading).toBeTruthy()
        expect(mockCardMethods.API_create).toHaveBeenCalled()
      })
    })
  })

  describe('with an empty collection', () => {
    beforeEach(() => {
      props.uiStore.blankContentToolState = {
        order: 0,
        width: 1,
        height: 1,
        emptyCollection: true,
      }
      wrapper = shallow(<GridCardBlank.wrappedComponent {...props} />)
    })

    it('does not render the close button', () => {
      expect(wrapper.find('button.close').exists()).toBeFalsy()
    })
  })

  describe('when replacing a new card', () => {
    const replacingId = 99
    beforeEach(() => {
      props.uiStore.blankContentToolState = {
        order: 1,
        width: 1,
        height: 1,
        replacingId,
      }
      wrapper = shallow(<GridCardBlank.wrappedComponent {...props} />)
    })

    it('only renders video and image content creation buttons', () => {
      // only render video + image buttons
      expect(wrapper.find('BctButtonBox').length).toBe(3)
    })

    it('calls API_replace with replacingId', async () => {
      await wrapper.instance().createCard()
      expect(wrapper.state().loading).toBeTruthy()
      expect(mockCardMethods.API_replace).toHaveBeenCalledWith({ replacingId })
    })
  })

  describe('createCardWith to create multiple files', () => {
    const file = { url: 'x', handle: 'z' }
    const attrs = {
      order: expect.any(Number),
      item_attributes: expect.any(Object),
    }
    const afterCreate = expect.any(Function)
    beforeEach(() => {
      props.uiStore.blankContentToolState = {
        row: 1,
        col: 14,
      }
      props.uiStore.viewingCollection = {
        maxColumnIndex: 15,
      }
      wrapper = shallow(<GridCardBlank.wrappedComponent {...props} />)
      component = wrapper.instance()
      // mock this to test how it is called
      component.createCard = jest.fn()
    })

    it('should create multiple files in stacked rows 4 across', () => {
      component.createCardWith(file, 0)
      expect(component.createCard).toHaveBeenCalledWith(
        {
          ...attrs,
          row: 1,
          col: 14,
        },
        { afterCreate }
      )
      component.createCardWith(file, 2)
      expect(component.createCard).toHaveBeenCalledWith(
        {
          ...attrs,
          row: 1,
          // even though it is over max of 15, the API will place this card appropriately
          col: 16,
        },
        { afterCreate }
      )
    })
  })

  describe('afterCreate', () => {
    describe('when creating a TextItem', () => {
      it('pushes an event to google tag manager', () => {
        const afterCreate = component.afterCreate(ITEM_TYPES.TEXT)
        afterCreate({ record: {} })

        expect(googleTagManager.push).toHaveBeenCalledWith({
          event: 'formSubmission',
          formType: `Create ${ITEM_TYPES.TEXT}`,
          parentType: 'anywhere',
        })
      })
    })
  })
})
