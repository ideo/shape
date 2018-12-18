import DataItemCover from '~/ui/grid/covers/DataItemCover'
import { fakeTextItem } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

import { Heading3 } from '~/ui/global/styled/typography'
import v from '~/utils/variables'

const props = {}
const fakeEv = { preventDefault: jest.fn() }
let wrapper, render
const uiStore = fakeUiStore
const apiStore = fakeApiStore()
describe('DataItemCover', () => {
  beforeEach(() => {
    props.uiStore = uiStore
    props.apiStore = apiStore
    props.item = {
      ...fakeTextItem,
      can_edit_content: true,
      data: {
        value: 5,
        values: [],
      },
      data_settings: {
        d_measure: 'participants',
        d_timeframe: 'ever',
      },
      // simulate model helper methods
      measure: 'participants',
      measureTooltip: 'participants',
      timeframe: 'ever',
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
      props.item.timeframe = 'ever'
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
      props.item.timeframe = 'month'
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
      expect(label).toContain('in September')
    })

    it('renders in last 30 days for label for last data item', () => {
      // NOTE: code pulls the actual month back by 1
      const datum = { date: '2018-10-01', amount: 34, month: 'Sep' }
      const label = wrapper.instance().renderLabelText(datum, true)
      expect(label).toContain('in last 30 days')
    })

    it('displays x-axis labels for dates near the end of the month', () => {
      let label
      // if it's not near month end, the label is blank
      label = wrapper.instance().displayXAxisText('2018-10-06')
      expect(label).toEqual('')
      // should display the short name of the month that previously ended
      label = wrapper.instance().displayXAxisText('2018-01-02')
      expect(label).toEqual('Dec')
      label = wrapper.instance().displayXAxisText('2018-12-31')
      expect(label).toEqual('Dec')
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

  describe('with a target collection', () => {
    beforeEach(() => {
      props.item.collectionFilter = { target: 123 }
      render()
    })

    it('should call apiStore.fetch with target id', () => {
      expect(apiStore.fetch).toHaveBeenCalledWith('collections', 123)
    })

    describe('onSelectTarget', () => {
      it('should work with a collection object', () => {
        wrapper
          .instance()
          .onSelectTarget({ id: 1, internalType: 'collections' })
        expect(apiStore.fetch).toHaveBeenCalledWith('collections', 1)
      })
      it('should work with a custom object', () => {
        wrapper.instance().onSelectTarget({ custom: 1 })
        expect(apiStore.fetch).toHaveBeenCalledWith('collections', 1)
      })
    })
  })
})
