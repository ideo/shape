import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import DataItemCoverDisplayOnly from '~/ui/grid/covers/data-item/DataItemCoverDisplayOnly'
import { fakeDataItemRecordAttrs } from '#/mocks/data'

const props = {}
let wrapper, render

describe('DataItemCoverDisplayOnly', () => {
  beforeEach(() => {
    props.item = fakeDataItemRecordAttrs
    props.card = { id: 1, record: props.item, width: 1, height: 1 }
    render = () => (wrapper = shallow(<DataItemCoverDisplayOnly {...props} />))
    render()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('should render measure name', () => {
    expect(
      wrapper
        .find('StyledDisplayText')
        .children()
        .first()
        .text()
    ).toEqual(props.item.primaryDataset.measure)
  })

  it('should render a chart', () => {
    expect(wrapper.find('ChartGroup').exists()).toBe(true)
    expect(wrapper.find('ChartGroup').props()).toEqual({
      datasets: props.item.datasets,
      simpleDateTooltip: true,
      width: 1,
      height: 1,
    })
  })

  it('renders a tooltip', () => {
    const tooltip = wrapper.find('Tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.props().title).toEqual(props.item.datasets[0].description)
  })
})
