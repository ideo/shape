import DataItemCover from '~/ui/grid/covers/DataItemCover'
import { fakeItem } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'

import { Heading3 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

const props = {}
const fakeEv = { preventDefault: jest.fn() }
let wrapper, render
const uiStore = fakeUiStore
describe('DataItemCover', () => {
  beforeEach(() => {
    props.uiStore = uiStore
    props.item = {
      ...fakeItem,
      can_edit_content: true,
      data: {
        value: 5,
        values: [],
      },
      data_settings: {
        d_measure: 'participants',
        d_timeframe: 'ever',
      },
    }
    props.card = { id: 1, record: props.item, width: 1, height: 1 }
    props.uiStore.editingCardId = 0
    render = () =>
      (wrapper = shallow(<DataItemCover.wrappedComponent {...props} />))

    render()
  })

  describe('without edit access', () => {
    beforeEach(() => {
      props.item.can_edit_content = false
      wrapper.setProps(props)
    })

    it('should not enter editing state when clicking on things', () => {
      wrapper
        .find(Heading3)
        .at(0)
        .simulate('click', fakeEv)

      expect(uiStore.toggleEditingCardId).not.toHaveBeenCalled()
    })
  })

  describe('with an ever timeframe', () => {
    beforeEach(() => {
      props.item.data_settings.d_timeframe = 'ever'
      wrapper.setProps(props)
    })

    it('renders the single data value', () => {
      expect(
        wrapper
          .find('.count')
          .children()
          .text()
      ).toContain(props.item.data.value)
    })

    it('will enter editing state if user clicks on measure', () => {
      wrapper
        .find(Heading3)
        .at(0)
        .find('EditableButton')
        .simulate('click', fakeEv)

      expect(uiStore.toggleEditingCardId).toHaveBeenCalledWith(props.card.id)
    })

    it('renders the within text explaining the data', () => {
      expect(wrapper.find('.withinText').text()).toContain('within the')
    })

    describe('when editing', () => {
      beforeEach(() => {
        props.uiStore.editingCardId = props.card.id
        render()
      })

      it('should show the measure select', () => {
        expect(
          wrapper
            .find('.metric-measure MeasureSelect')
            .dive()
            .find('StyledSelect')
            .props().value
        ).toContain('participants')
      })

      it('should show data properties in hover editing style', () => {
        expect(wrapper.find('StyledDataItemCover')).toHaveStyleRule(
          'background-color',
          v.colors.primaryLight,
          {
            modifier: '.editableMetric',
          }
        )
      })
    })
  })

  describe('with a month timeframe', () => {
    beforeEach(() => {
      props.item.data_settings.d_timeframe = 'month'
      props.item.data.values = [
        { date: '2018-07-10', amount: 25 },
        { date: '2018-08-10', amount: 30 },
        { date: '2018-09-10', amount: 10 },
      ]
      render()
    })

    it('should render a chart', () => {
      expect(wrapper.find('VictoryChart').exists()).toBe(true)
    })

    it('renders two editable buttons for measure and timeframe', () => {
      expect(wrapper.find('EditableButton').length).toEqual(2)
    })

    it('renders text for the label with month and year', () => {
      // NOTE: code pulls the actual month back by 1
      const datum = { date: '2018-10-01', amount: 34, month: 'Sep' }
      const label = wrapper.instance().renderLabelText(datum)
      expect(label).toContain('in September 2018')
    })

    it('renders in last 30 days for label for last data item', () => {
      // NOTE: code pulls the actual month back by 1
      const datum = { date: '2018-10-01', amount: 34, month: 'Sep' }
      const label = wrapper.instance().renderLabelText(datum, true)
      expect(label).toContain('in last 30 days')
    })

    describe('with not enough timeline data', () => {
      beforeEach(() => {
        props.item.data.values = []
        render()
      })

      it('should show a not enough data message', () => {
        expect(
          wrapper
            .find('.noDataMessage')
            .children()
            .at(1)
            .text()
        ).toContain('Not enough data yet')
      })
    })

    describe('when editing', () => {
      beforeEach(() => {
        props.uiStore.editingCardId = props.card.id
        render()
      })

      it('should show selects for timeframe and measure', () => {
        expect(wrapper.find('MeasureSelect').length).toEqual(2)
      })
    })
  })
})
