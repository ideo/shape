import ChartTooltip from '~/ui/global/ChartTooltip'

let props, wrapper, render, data
describe('ChartTooltip', () => {
  beforeEach(() => {
    data = [
      { date: '2018-07-01', amount: 10 },
      { date: '2018-08-01', amount: 26 },
      { date: '2018-09-01', amount: 90 },
      { date: '2018-10-01', amount: 60 },
    ]
    props = {
      minAmount: 10,
      maxAmount: 90,
      textRenderer: jest.fn(),
      data,
      datum: data[0],
      index: '0',
      x: 10,
      y: 50,
    }
    render = () => (wrapper = shallow(<ChartTooltip {...props} />))

    render()
  })

  describe('on any item', () => {
    beforeEach(() => {
      props.datum = data[1]
      props.index = 1
      render()
    })

    it('should render with the text renderer', () => {
      expect(props.textRenderer).toHaveBeenCalledWith(props.datum)
    })

    it('should render a tooltip', () => {
      expect(wrapper.find('VictoryTooltip').exists()).toBe(true)
    })

    it('should not render an active tooltip', () => {
      expect(wrapper.find('VictoryTooltip').length).toBe(1)
    })

    it('should not render a line', () => {
      expect(wrapper.find('line').exists()).toBe(false)
    })
  })

  describe('on the lowest value item', () => {
    it('should render a tooltip', () => {
      expect(wrapper.find('VictoryTooltip').exists()).toBe(true)
    })

    it('should render an active tooltip', () => {
      expect(wrapper.find('VictoryTooltip').length).toBe(2)
    })

    it('should render a line', () => {
      expect(wrapper.find('line').exists()).toBe(true)
    })
  })

  describe('on the highest value item', () => {
    beforeEach(() => {
      props.datum = data[2]
      props.index = 2
      render()
    })

    it('should render a tooltip', () => {
      expect(wrapper.find('VictoryTooltip').exists()).toBe(true)
    })

    it('should render an active tooltip', () => {
      expect(wrapper.find('VictoryTooltip').length).toBe(2)
    })

    it('should render a line', () => {
      expect(wrapper.find('line').exists()).toBe(true)
    })
  })

  describe('on the last item', () => {
    beforeEach(() => {
      props.datum = data[3]
      props.index = '3'
      render()
    })

    it('should render a tooltip', () => {
      expect(wrapper.find('VictoryTooltip').exists()).toBe(true)
    })

    it('should render an active tooltip', () => {
      expect(wrapper.find('VictoryTooltip').length).toBe(2)
    })

    it('should render a line', () => {
      expect(wrapper.find('line').exists()).toBe(true)
    })
  })
})
