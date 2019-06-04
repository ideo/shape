import Banner from '~/ui/layout/Banner'

const bannerProps = {
  leftComponent: <div>Important information</div>,
  rightComponent: <div>Take action</div>,
}

function render() {
  return shallow(<Banner {...bannerProps} />)
}

describe('Banner', () => {
  describe('it renders', () => {
    it('left component', () => {
      expect(render().html()).toMatch('Important information')
    })

    it('right component', () => {
      expect(render().html()).toMatch('Take action')
    })
  })
})
