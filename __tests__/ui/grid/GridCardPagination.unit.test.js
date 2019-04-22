import GridCardPagination from '~/ui/grid/GridCardPagination'
import { fakeCollection } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

let wrapper, component, props
describe('GridCardPagination', () => {
  beforeEach(() => {
    props = {
      collection: fakeCollection,
      nextPage: 2,
      loadCollectionCards: jest.fn(() => Promise.resolve()),
    }
    props.collection.totalPages = 2
    wrapper = shallow(<GridCardPagination {...props} />)
    component = wrapper.instance()
  })

  it('renders a VisibilitySensor with a Loader inside', () => {
    expect(wrapper.find('VisibilitySensor > Loader').exists()).toBeTruthy()
  })

  it('calls collection.API_fetchCards on visibility trigger', () => {
    component.handleVisibilityChange(true)
    expect(props.loadCollectionCards).toHaveBeenCalledWith({
      page: props.nextPage,
    })
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  describe('when collection.totalPages < nextPage', () => {
    beforeEach(() => {
      wrapper.setProps({
        collection: {
          ...props.collection,
          totalPages: 1,
        },
      })
      wrapper.update()
    })

    it('does not call collection.API_fetchCards', () => {
      component.handleVisibilityChange(true)
      expect(props.loadCollectionCards).not.toHaveBeenCalled()
    })
  })
})
