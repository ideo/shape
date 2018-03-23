import CollectionCover from '~/ui/grid/covers/CollectionCover'

import {
  fakeCollection,
} from '#/mocks/data'

const props = {
  collection: fakeCollection,
  width: 2,
  height: 1,
}
const { cover } = fakeCollection

let wrapper
describe('CollectionCover', () => {
  beforeEach(() => {
    wrapper = shallow(
      <CollectionCover {...props} />
    )
  })

  it('renders the cover image_url', () => {
    expect(wrapper.find('StyledCollectionCover').props().url).toEqual(cover.image_url)
  })

  it('renders the cover name and text', () => {
    // NOTE: will truncate if it's too long, mock data is currently short enough to fit
    expect(wrapper.find('StyledCardContent').find('h3').text()).toContain(cover.name)
    expect(wrapper.find('StyledCardContent').find('p').text()).toContain(cover.text)
  })

  it('truncates text that is too long', () => {
    cover.text = `
      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
    `
    props.width = 1
    props.collection.cover = cover
    wrapper = shallow(
      <CollectionCover {...props} />
    )
    expect(wrapper.find('StyledCardContent').find('p').text().length).toBeLessThan(cover.text.length)
  })
})
