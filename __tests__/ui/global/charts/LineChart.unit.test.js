import LineChart from '~/ui/global/charts/LineChart'
import { fakeAreaChartDataset } from '#/mocks/data'

const props = {}
let wrapper, render

describe('LineChart', () => {
  beforeEach(() => {
    props.dataset = fakeAreaChartDataset
    props.simpleDateTooltip = true
    render = () => (wrapper = shallow(<LineChart {...props} />))
    render()
  })

  it('renders VictoryLine', () => {
    expect(wrapper.find('VictoryLine').exists()).toBe(true)
  })
})
