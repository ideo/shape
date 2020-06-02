import CollectionDateRange, {
  formatDateRange,
} from '~/ui/grid/CollectionDateRange'

import { fakeCollection } from '#/mocks/data'

let props, wrapper
describe('CollectionDateRange', () => {
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

  it('renders DateRangeDisplay with date props', () => {
    expect(wrapper.find('DateRangeDisplay').props().dateRange).toEqual([
      props.collection.start_date,
      props.collection.end_date,
    ])
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
    wrapper.find('.date-range-wrapper').simulate('click', fakeEv)
    expect(wrapper.find('InlineModal').props().open).toEqual(true)
  })
})

describe('formatDateRange', () => {
  let dateRange
  beforeEach(() => {
    dateRange = ['2025-05-22T20:25:02.962Z', '2025-06-26T20:25:02.962Z']
  })

  it('renders dates', () => {
    expect(formatDateRange(dateRange)).toMatch('5.22.25 to 6.26.25')
  })

  describe('without dates selected', () => {
    beforeEach(() => {
      dateRange = [null, null]
    })

    it('renders no dates selected', () => {
      expect(formatDateRange(dateRange)).toMatch('No dates selected')
    })
  })
})
