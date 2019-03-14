import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import DataItemCoverCollectionsItems from '~/ui/grid/covers/data-item/DataItemCoverCollectionsItems'
import { fakeDataItemCollectionsItemsAttrs } from '#/mocks/data'
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
    props.item = fakeDataItemCollectionsItemsAttrs
    props.card = { id: 1, record: props.item, width: 1, height: 1 }
    props.uiStore.editingCardId = 0
    render = () =>
      (wrapper = shallow(
        <DataItemCoverCollectionsItems.wrappedComponent {...props} />
      ))

    render()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
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

  describe('with an ever timeframe and single value', () => {
    beforeEach(() => {
      props.item.can_edit_content = true
      props.item.primaryDataset.timeframe = 'ever'
      props.item.primaryDataset.single_value = 120
      props.item.datasets[0].timeframe = 'ever'
      props.item.datasets[0].single_value = 120
      wrapper.setProps(props)
      render()
    })

    it('renders the single data value', () => {
      expect(
        wrapper
          .find('.count')
          .children()
          .text()
      ).toContain(120)
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
      expect(wrapper.find('.titleAndControls').text()).toContain('within the')
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
      props.item.primaryDataset.timeframe = 'month'
      props.item.primaryDataset.data = [
        { date: '2018-07-10', amount: 25 },
        { date: '2018-08-10', amount: 30 },
        { date: '2018-09-10', amount: 10 },
      ]
      props.item.datasets[0] = props.item.primaryDataset
      render()
    })

    it('should render a chart', () => {
      expect(wrapper.find('ChartGroup').exists()).toBe(true)
      expect(wrapper.find('ChartGroup').props()).toEqual({
        datasets: props.item.datasets,
        showMeasureInTooltip: true,
        width: 1,
        height: 1,
      })
    })

    it('renders two editable buttons for measure and timeframe', () => {
      expect(wrapper.find('EditableButton').length).toEqual(2)
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

  describe('with a record report type with 2+ values', () => {
    beforeEach(() => {
      props.item.report_type = 'report_type_report'
      props.item.name = 'My Static Data'
      props.item.isReportTypeCollectionsItems = false
      props.item.isReportTypeRecord = true
      props.item.primaryDataset.data = [
        { amount: 24, date: '2018-09-10' },
        { amount: 27, date: '2018-09-11' },
        { amount: 23, date: '2018-09-12' },
      ]
      props.item.datasets[0].data = props.item.primaryDataset.data
      render()
    })

    it('should render name', () => {
      expect(
        wrapper
          .find('StyledDisplayText')
          .children()
          .first()
          .text()
      ).toEqual('My Static Data')
    })

    it('should not show editing controls', () => {
      expect(wrapper.find('.editableMetric').exists()).toBe(false)
    })

    describe('with a single data point in values', () => {
      beforeEach(() => {
        props.item.report_type = 'report_type_report'
        props.item.name = 'My Lone Value Chart'
        props.item.isReportTypeCollectionsItems = false
        props.item.isReportTypeRecord = true
        props.item.primaryDataset.data = [{ amount: 24, date: '2018-09-10' }]
        props.item.datasets[0].data = props.item.primaryDataset.data
        render()
      })

      it('should render name', () => {
        expect(
          wrapper
            .find('StyledDisplayText')
            .children()
            .first()
            .text()
        ).toEqual('My Lone Value Chart')
      })

      it('should not show editing controls', () => {
        expect(wrapper.find('.editableMetric').exists()).toBe(false)
      })
    })
  })
})
