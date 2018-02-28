import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import fakeApiStore from '#/mocks/fakeApiStore'
import FilestackUpload from '~/utils/FilestackUpload'

// replace FilestackUpload with a mock, no need to hit actual filestack API
jest.mock('../../../../app/javascript/utils/FilestackUpload')

let props, wrapper
beforeEach(() => {
  props = {
    uiStore: {
      blankContentToolState: null
    },
    apiStore: fakeApiStore(),
    height: 100,
  }
  wrapper = shallow(
    <GridCardBlank.wrappedComponent {...props} />
  )
  FilestackUpload.pickImage = jest.fn()
    .mockReturnValue(Promise.resolve({ filesUploaded: [] }))
})

describe('GridCardBlank', () => {
  it('renders the content creation buttons', () => {
    expect(wrapper.find('BctButton').length).toBe(4)
  })

  it('opens CollectionCreator when clicking button 1', () => {
    wrapper.find('BctButton').at(0).simulate('click')
    expect(wrapper.state().creating).toEqual('collection')
    expect(wrapper.find('CollectionCreator').exists()).toBe(true)
  })

  it('triggers FilestackUpload when clicking button 2', () => {
    wrapper.find('BctButton').at(1).simulate('click')
    expect(wrapper.state().creating).toEqual(null)
    expect(FilestackUpload.pickImage).toHaveBeenCalled()
  })

  it('opens VideoCreator when clicking button 3', () => {
    wrapper.find('BctButton').at(2).simulate('click')
    expect(wrapper.state().creating).toEqual('video')
    expect(wrapper.find('VideoCreator').exists()).toBe(true)
  })

  it('opens TextItemCreator when clicking button 4', () => {
    wrapper.find('BctButton').at(3).simulate('click')
    expect(wrapper.state().creating).toEqual('text')
    expect(wrapper.find('TextItemCreator').exists()).toBe(true)
  })
})
