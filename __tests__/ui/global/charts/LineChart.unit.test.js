import LineChart, {
  formatValuesWithoutDates,
} from '~/ui/global/charts/LineChart'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
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

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders VictoryLine', () => {
    expect(wrapper.find('VictoryLine').exists()).toBe(true)
  })
})

describe('formatValuesWithoutDates', () => {
  let data
  beforeEach(() => {
    data = [{ value: 25 }]
  })

  it('duplicates value n times for use in VictoryLine', () => {
    expect(formatValuesWithoutDates(data, 4)).toEqual([
      { value: 25, x: 1, y: 25 },
      { value: 25, x: 2, y: 25, isDuplicate: true },
      { value: 25, x: 3, y: 25, isDuplicate: true },
      { value: 25, x: 4, y: 25, isDuplicate: true },
    ])
  })
})
