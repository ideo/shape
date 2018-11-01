import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import FilestackUpload from '~/utils/FilestackUpload'
import { fakeCollectionCard } from '#/mocks/data'

// replace FilestackUpload with a mock, no need to hit actual filestack API
jest.mock('../../../../app/javascript/utils/FilestackUpload')
// in order to mock our way past `new CollectionCard(attrs, apiStore)`
jest.mock('../../../../app/javascript/stores/jsonApi/CollectionCard')
// solving a mysterious `property 'type' of undefined` error that traces to Item.js -> routingStore
jest.mock('../../../../app/javascript/stores/index')

let props, wrapper, replacingCard, component
beforeEach(() => {
  CollectionCard.mockClear()
  replacingCard = fakeCollectionCard
  props = {
    uiStore: fakeUiStore,
    apiStore: fakeApiStore({ findResult: replacingCard }),
    height: 100,
    parent: { id: 1 },
  }
  wrapper = shallow(<GridCardBlank.wrappedComponent {...props} />)
  component = wrapper.instance()
  FilestackUpload.pickImage = jest
    .fn()
    .mockReturnValue(Promise.resolve({ filesUploaded: [] }))
})

describe('GridCardBlank', () => {
  describe('when creating a new card', () => {
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

    it('opens TextItemCreator with onClick handler', () => {
      component.startCreating('text')()
      wrapper.update()
      expect(wrapper.state().creating).toEqual('text')
      expect(wrapper.find('TextItemCreator').exists()).toBe(true)
    })

    it('opens LinkCreator (link) with onClick handler', () => {
      component.startCreating('link')()
      wrapper.update()
      expect(wrapper.state().creating).toEqual('link')
      expect(wrapper.find('LinkCreator').props().type).toEqual('link')
    })

    it('calls API_create when creating', async () => {
      await wrapper.instance().createCard()
      expect(wrapper.state().loading).toBeTruthy()
      const newCard = CollectionCard.mock.instances[0]
      expect(newCard.API_create).toHaveBeenCalled()
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
      expect(wrapper.find('BctButtonBox').length).toBe(2)
    })

    it('calls API_replace with replacingId', async () => {
      await wrapper.instance().createCard()
      expect(wrapper.state().loading).toBeTruthy()
      const newCard = CollectionCard.mock.instances[0]
      expect(newCard.API_replace).toHaveBeenCalledWith({ replacingId })
    })
  })
})
