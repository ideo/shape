import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import LineChart from '~/ui/global/charts/LineChart'
import { fakeDataset } from '#/mocks/data'

const props = {}
let wrapper, render

describe('LineChart', () => {
  beforeEach(() => {
    props.dataset = fakeDataset
    props.showMeasureInTooltip = true
    render = () => (wrapper = shallow(<LineChart {...props} />))
    render()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders VictoryLine', () => {
    expect(wrapper.find('VictoryLine').exists()).toBe(true)
  })
})
