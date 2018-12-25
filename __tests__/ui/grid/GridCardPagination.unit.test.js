import GridCardPagination from '~/ui/grid/GridCardPagination'
import { fakeCollection } from '#/mocks/data'

let wrapper, component, props
describe('GridCardPagination', () => {
  beforeEach(() => {
    props = {
      collection: fakeCollection,
      nextPage: 2,
    }
    props.collection.hasMore = true
    props.collection.API_fetchCards.mockClear()
    wrapper = shallow(<GridCardPagination {...props} />)
    component = wrapper.instance()
  })

  it('renders a VisibilitySensor with a Loader inside', () => {
    expect(wrapper.find('VisibilitySensor > Loader').exists()).toBeTruthy()
  })

  it('calls collection.API_fetchCards on visibility trigger', () => {
    component.handleVisibilityChange(true)
    expect(props.collection.API_fetchCards).toHaveBeenCalledWith({
      page: props.nextPage,
    })
  })

  describe('when collection.hasMore == false', () => {
    beforeEach(() => {
      wrapper.setProps({
        collection: {
          ...props.collection,
          hasMore: false,
        },
      })
      wrapper.update()
    })

    it('does not call collection.API_fetchCards', () => {
      component.handleVisibilityChange(true)
      expect(props.collection.API_fetchCards).not.toHaveBeenCalled()
    })
  })
})
