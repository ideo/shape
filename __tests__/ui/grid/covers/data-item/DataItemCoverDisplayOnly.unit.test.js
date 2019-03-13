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

  it('should render name', () => {
    expect(
      wrapper
        .find('StyledDisplayText')
        .children()
        .first()
        .text()
    ).toEqual(props.item.name)
  })

  it('should render a chart', () => {
    expect(wrapper.find('ChartGroup').exists()).toBe(true)
    expect(wrapper.find('ChartGroup').props()).toEqual({
      datasets: props.item.datasets,
      showMeasureInTooltip: false,
      width: 1,
      height: 1,
    })
  })
})
