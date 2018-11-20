import MeasureSelect from '~/ui/reporting/MeasureSelect'
import MenuItem from '@material-ui/core/MenuItem'
import { fakeItem } from '#/mocks/data'

const props = {}
let wrapper
describe('MeasureSelect', () => {
  beforeEach(() => {
    props.item = {
      ...fakeItem,
      data_settings: {
        d_measure: null,
      },
    }
    props.onSelect = jest.fn()
    wrapper = shallow(<MeasureSelect {...props} />)
  })

  describe('render', () => {
    it('renders 4 possible options', () => {
      expect(wrapper.find(MenuItem).length).toEqual(3)
    })
  })

  describe('on select change', () => {
    beforeEach(() => {
      const fakeEv = {
        target: { value: 'participants' },
        preventDefault: jest.fn(),
      }
      wrapper.instance().handleChange(fakeEv)
    })

    it('calls onSelect prop with value of select', () => {
      expect(props.onSelect).toHaveBeenCalledWith('participants')
    })
  })
})
