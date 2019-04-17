import ChartTooltip from '~/ui/global/charts/ChartTooltip'

let props, wrapper, render, data
describe('ChartTooltip', () => {
  beforeEach(() => {
    data = [
      { date: '2018-07-01', value: 10, _x: 1 },
      { date: '2018-08-01', value: 26, _x: 2 },
      { date: '2018-09-01', value: 90, _x: 3 },
      { date: '2018-10-01', value: 60, _x: 4 },
    ]
    props = {
      minValue: 10,
      maxValue: 90,
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
      expect(props.textRenderer).toHaveBeenCalledWith(props.datum, false)
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

  describe('for an item with 2 data points (1 modified duplicate)', () => {
    beforeEach(() => {
      props.data = [
        { date: '2018-07-01', value: 10, _x: 1 },
        { date: '2018-10-01', value: 10, _x: 2 },
      ]
      render()
    })

    it('should render a tooltip', () => {
      expect(wrapper.find('VictoryTooltip').exists()).toBe(true)
    })

    it('should not render an active tooltip', () => {
      expect(wrapper.find('VictoryTooltip').length).toBe(1)
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

    describe('with two highest value items of same value', () => {
      beforeEach(() => {
        data.push({ date: '2018-11-01', value: 90 })
        data.push({ date: '2018-12-01', value: 58 })
        props.datum = data[4]
        props.index = 4
        render()
      })

      it('should only render the tooltip for the first', () => {
        expect(wrapper.find('VictoryTooltip').length).toBe(1)
        expect(wrapper.find('line').exists()).toBe(false)
      })
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
