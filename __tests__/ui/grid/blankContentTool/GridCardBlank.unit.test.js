import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import FilestackUpload from '~/utils/FilestackUpload'
import {
  fakeCollectionCard
} from '#/mocks/data'

// replace FilestackUpload with a mock, no need to hit actual filestack API
jest.mock('../../../../app/javascript/utils/FilestackUpload')
// in order to mock our way past `new CollectionCard(attrs, apiStore)`
jest.mock('../../../../app/javascript/stores/jsonApi/CollectionCard')

let props, wrapper, replacingCard
beforeEach(() => {
  CollectionCard.mockClear()
  replacingCard = fakeCollectionCard
  props = {
    uiStore: fakeUiStore,
    apiStore: fakeApiStore({ findResult: replacingCard }),
    height: 100,
    parent: { id: 1 },
  }
  wrapper = shallow(
    <GridCardBlank.wrappedComponent {...props} />
  )
  FilestackUpload.pickImage = jest.fn()
    .mockReturnValue(Promise.resolve({ filesUploaded: [] }))
})

describe('GridCardBlank', () => {
  describe('when creating a new card', () => {
    it('renders the content creation buttons', () => {
      expect(wrapper.find('BctButton').length).toBe(4)
    })

    it('renders the close button', () => {
      expect(wrapper.find('CloseButton').exists()).toBeTruthy()
    })

    it('opens CollectionCreator when clicking button 1', () => {
      wrapper.find('.createCollection').at(0).simulate('click')
      expect(wrapper.state().creating).toEqual('collection')
      expect(wrapper.find('CollectionCreator').exists()).toBe(true)
    })

    it('triggers FilestackUpload when clicking button 2', () => {
      wrapper.find('.createFile').at(0).simulate('click')
      expect(wrapper.state().creating).toEqual(null)
      expect(FilestackUpload.pickImage).toHaveBeenCalled()
    })

    it('opens VideoCreator when clicking button 3', () => {
      wrapper.find('.createVideo').at(0).simulate('click')
      expect(wrapper.state().creating).toEqual('video')
      expect(wrapper.find('VideoCreator').exists()).toBe(true)
    })

    it('opens TextItemCreator when clicking button 4', () => {
      wrapper.find('.createText').at(0).simulate('click')
      expect(wrapper.state().creating).toEqual('text')
      expect(wrapper.find('TextItemCreator').exists()).toBe(true)
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
      wrapper = shallow(
        <GridCardBlank.wrappedComponent {...props} />
      )
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
      wrapper = shallow(
        <GridCardBlank.wrappedComponent {...props} />
      )
    })

    it('only renders video and image content creation buttons', () => {
      // only render video + image buttons
      expect(wrapper.find('BctButton').length).toBe(2)
    })

    it('triggers FilestackUpload when clicking button 1', () => {
      wrapper.find('BctButton').at(0).simulate('click')
      expect(wrapper.state().creating).toEqual(null)
      expect(FilestackUpload.pickImage).toHaveBeenCalled()
    })

    it('opens VideoCreator when clicking button 2', () => {
      wrapper.find('BctButton').at(1).simulate('click')
      expect(wrapper.state().creating).toEqual('video')
      expect(wrapper.find('VideoCreator').exists()).toBe(true)
    })

    it('calls API_replace with replacingId', async () => {
      await wrapper.instance().createCard()
      expect(wrapper.state().loading).toBeTruthy()
      const newCard = CollectionCard.mock.instances[0]
      expect(newCard.API_replace).toHaveBeenCalledWith({ replacingId })
    })
  })
})
