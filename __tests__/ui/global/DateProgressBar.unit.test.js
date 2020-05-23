import moment from 'moment-mini'
import DateProgressBar, {
  percentOfDateRange,
} from '~/ui/global/DateProgressBar'

describe('DateProgressBar', () => {
  let wrapper, props
  beforeEach(() => {
    props = {
      startDate: moment()
        .subtract(1, 'day')
        .toDate()
        .toUTCString(),
      endDate: moment()
        .add(2, 'days')
        .toDate()
        .toUTCString(),
    }
    wrapper = shallow(<DateProgressBar {...props} />)
  })

  describe('render', () => {
    it('renders progress with progress bar', () => {
      expect(wrapper.find('Progress').exists()).toBe(true)
      expect(wrapper.find('ProgressBar').exists()).toBe(true)
      expect(wrapper.find('ProgressBar').props().width).toEqual(33)
    })
  })

  describe('percentOfDateRange', () => {
    it('returns 0 if dates are null', () => {
      expect(percentOfDateRange(null, null)).toEqual(0)
    })

    it('returns 100 if now > end', () => {
      expect(
        percentOfDateRange(
          moment().subtract(10, 'days'),
          moment().subtract(3, 'days')
        )
      ).toEqual(100)
    })

    it('returns 0 if now < start', () => {
      expect(
        percentOfDateRange(moment().add(1, 'day'), moment().add(3, 'days'))
      ).toEqual(0)
    })

    it('returns percent within range', () => {
      expect(
        percentOfDateRange(
          moment().subtract(2, 'days'),
          moment().add(2, 'days')
        )
      ).toEqual(50)
    })
  })
})
