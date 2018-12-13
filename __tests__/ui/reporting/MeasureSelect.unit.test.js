import MeasureSelect from '~/ui/reporting/MeasureSelect'
import { SelectOption } from '~/ui/global/styled/forms'
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
    props.dataSettingsName = 'measure'
    wrapper = shallow(<MeasureSelect {...props} />)
  })

  describe('measure', () => {
    beforeEach(() => {
      props.dataSettingsName = 'measure'
      wrapper.setProps(props)
    })

    describe('render', () => {
      it('renders possible options', () => {
        expect(wrapper.find(SelectOption).length).toEqual(6)
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

  describe('timeframe', () => {
    beforeEach(() => {
      props.dataSettingsName = 'timeframe'
      wrapper.setProps(props)
    })

    describe('render', () => {
      it('renders possible options', () => {
        expect(wrapper.find(SelectOption).length).toEqual(3)
      })
    })

    describe('on select change', () => {
      beforeEach(() => {
        const fakeEv = {
          target: { value: 'ever' },
          preventDefault: jest.fn(),
        }
        wrapper.instance().handleChange(fakeEv)
      })

      it('calls onSelect prop with value of select', () => {
        expect(props.onSelect).toHaveBeenCalledWith('ever')
      })
    })
  })
})
