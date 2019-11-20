import BarChart from '~/ui/global/charts/BarChart'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import { fakeAreaChartDataset } from '#/mocks/data'

const props = {}
let wrapper, render

describe('BarChart', () => {
  beforeEach(() => {
    props.dataset = fakeAreaChartDataset
    props.routeToSearch = jest.fn()
    render = () => (wrapper = shallow(<BarChart {...props} />))
    render()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders VictoryBar', () => {
    expect(wrapper.find('VictoryBar').exists()).toBe(true)
  })

  it('adds click event handler', () => {
    expect(
      wrapper.find('VictoryBar').props().events[0].eventHandlers.onClick
    ).not.toBeNull()
  })
})
