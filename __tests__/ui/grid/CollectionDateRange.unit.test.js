import CollectionDateRange from '~/ui/grid/CollectionDateRange'

import { fakeCollection } from '#/mocks/data'

let props, wrapper
const rerender = () => {
  wrapper = shallow(<CollectionDateRange {...props} />)
}
beforeEach(() => {
  props = {
    collection: {
      ...fakeCollection,
      start_date: '2025-05-22T20:25:02.962Z',
      end_date: '2025-06-26T20:25:02.962Z',
    },
  }
  rerender()
})

describe('CollectionDateRange', () => {
  it('renders dates', () => {
    const dateRangeText = wrapper.find('.date-range').text()
    expect(dateRangeText).toMatch('5.22.25 to 6.26.25')
    expect(dateRangeText).not.toMatch('No dates selected')
  })

  it('renders InlineModal with CollectionDateRange picker', () => {
    const modal = wrapper.find('InlineModal')
    expect(modal.props().open).toEqual(false)
    const dateRangePickerProps = modal.props().children.props
    expect(dateRangePickerProps.value).toEqual([
      props.collection.start_date,
      props.collection.end_date,
    ])
  })

  it('opens InlineModal when clicked on', () => {
    const fakeEv = { preventDefault: jest.fn() }
    wrapper.find('.date-range').simulate('click', fakeEv)
    expect(wrapper.find('InlineModal').props().open).toEqual(true)
  })

  describe('without dates selected', () => {
    beforeEach(() => {
      props.collection.start_date = null
      props.collection.end_date = null
      rerender()
    })

    it('renders No dates selected', () => {
      expect(wrapper.find('.date-range').text()).toMatch('No dates selected')
    })
  })
})
