import LinkItemCover from '~/ui/grid/covers/LinkItemCover'
import { uiStore } from '~/stores'

import { fakeLinkItem } from '#/mocks/data'

jest.mock('../../../../app/javascript/stores')

let props, wrapper, rerender
describe('LinkItemCover', () => {
  beforeEach(() => {
    props = {
      item: fakeLinkItem,
      cardHeight: 1,
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
    const cardHeights = [1, 2]
    const breakpoints = [
      {
        name: 'mobile',
        width: 480,
        maxTitle: 53,
        maxBody: 90,
      },
      {
        name: 'small',
        width: 768,
        maxTitle: 46,
        maxBody: 79,
      },
      {
        name: 'medium',
        width: 1090,
        maxTitle: 35,
        maxBody: 61,
      },
      {
        name: 'large',
        width: 2000,
        maxTitle: 40,
        maxBody: 80,
      },
    ]

    describe('with a short name', () => {
      beforeEach(() => {
        props.item.name = 'The Verge '
        props.item.content =
          'E-sports like the Overwatch League, NBA 2K League, Mega Man II, and the League of Legends Championship Series are looking to taking on the NBA and NFL with more structure and big-name owners.'
        wrapper.setProps(props)
        rerender()
      })

      breakpoints.forEach(breakpoint => {
        describe(`on the ${breakpoint.name} breakpoint`, () => {
          cardHeights.forEach(height => {
            const heightLabel = height === 1 ? 'single' : 'double'
            describe(`at ${heightLabel} square height`, () => {
              beforeEach(() => {
                props.cardHeight = height
                uiStore.windowWidth = breakpoint.width
                rerender()
              })

              const limit = breakpoint.maxBody * height
              it(`should clamp the content down to ${limit} characters`, () => {
                expect(wrapper.find('.content').text().length).toEqual(limit)
              })
            })
          })
        })
      })
    })

    describe('with a name longer then 106 characters', () => {
      beforeEach(() => {
        props.item.name =
          'Soccer News, Live Scores, Results & Transfers | Goal.com US | The latest soccer news, live scores, results, and rumours from around the world'
        props.item.content =
          'The latest soccer news, live scores, results, rumours, transfers'
        wrapper.setProps(props)
        rerender()
      })

      it('should not render the content at all', () => {
        expect(wrapper.find('.content').text()).toEqual('')
      })

      breakpoints.forEach(breakpoint => {
        describe(`on the ${breakpoint.name} breakpoint`, () => {
          cardHeights.forEach(height => {
            const heightLabel = height === 1 ? 'single' : 'double'
            describe(`at ${heightLabel} square height`, () => {
              beforeEach(() => {
                props.cardHeight = height
                uiStore.windowWidth = breakpoint.width
                rerender()
              })

              const limit = breakpoint.maxTitle * height
              it(`should clamp the name down to ${limit} characters`, () => {
                expect(
                  wrapper
                    .find('.name')
                    .dive()
                    .text().length
                ).toEqual(limit)
              })
            })
          })
        })
      })
    })
  })
})
