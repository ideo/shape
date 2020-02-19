import AreaChart from '~/ui/global/charts/AreaChart'
import { fakeAreaChartDataset } from '#/mocks/data'

const props = {}
let wrapper, render

describe('AreaChart', () => {
  beforeEach(() => {
    props.dataset = fakeAreaChartDataset
    props.simpleDateTooltip = true
    render = () => (wrapper = shallow(<AreaChart {...props} />))
    render()
  })

  it('renders VictoryArea', () => {
    expect(wrapper.find('VictoryArea').exists()).toBe(true)
  })
})
