import LinkItemCover from '~/ui/grid/covers/LinkItemCover'
import { uiStore } from '~/stores'

import { fakeLinkItem } from '#/mocks/data'

jest.mock('../../../../app/javascript/stores')

let props, wrapper, rerender
describe('LinkItemCover', () => {
  beforeEach(() => {
    props = {
      item: fakeLinkItem,
      dragging: false,
    }
    rerender = () => {
      wrapper = shallow(<LinkItemCover {...props} />)
    }
    rerender()
  })

  it('renders the StyledLinkCover', () => {
    expect(wrapper.find('StyledLinkCover').exists()).toBe(true)
  })

  it('passes the thumbnail_url to StyledImageCover', () => {
    expect(wrapper.find('StyledImageCover').props().url).toEqual(
      fakeLinkItem.thumbnail_url
    )
  })

  describe('clamp', () => {
    describe('with a short name', () => {
      beforeEach(() => {
        props.item.name = 'The Verge '
        props.item.content =
          'E-sports like the Overwatch League, NBA 2K League, and the League of Legends Championship Series are looking to taking on the NBA and NFL with more structure and big-name owners.'
        wrapper.setProps(props)
        rerender()
      })

      describe('on the middle breakpoint', () => {
        beforeEach(() => {
          uiStore.windowWidth = 1090
          rerender()
        })

        it('should clamp the content down to 40 characters', () => {
          expect(wrapper.find('.content').text().length).toEqual(40)
        })
      })

      describe('on the large breakpoint', () => {
        beforeEach(() => {
          uiStore.windowWidth = 2000
          rerender()
        })

        it('should clamp the content down to 80 characters', () => {
          expect(wrapper.find('.content').text().length).toEqual(80)
        })
      })
    })

    describe('with a name longer then 30 characters', () => {
      beforeEach(() => {
        props.item.name =
          'Soccer News, Live Scores, Results & Transfers | Goal.com US'
        props.item.content =
          'The latest soccer news, live scores, results, rumours, transfers'
        wrapper.setProps(props)
        rerender()
      })

      it('should not render the content at all', () => {
        expect(wrapper.find('.content').text()).toEqual('')
      })

      describe('on the middle breakpoint', () => {
        beforeEach(() => {
          uiStore.windowWidth = 1090
          rerender()
        })

        it('should clamp the name to 28 characters', () => {
          expect(
            wrapper
              .find('.name')
              .dive()
              .text().length
          ).toEqual(28)
        })
      })

      describe('on the large breakpoint', () => {
        beforeEach(() => {
          uiStore.windowWidth = 2090
          rerender()
        })

        it('should clamp the name to 40 characters', () => {
          expect(
            wrapper
              .find('.name')
              .dive()
              .text().length
          ).toEqual(40)
        })
      })
    })
  })
})
