import { tagColor } from '~/ui/pages/shared/StyledReactTags'
import v from '~/utils/variables'

describe('tagColor', () => {
  it('returns default color if none given', () => {
    expect(tagColor('Cats')).toEqual(v.colors.commonMediumTint)
  })

  it('returns color if default given', () => {
    expect(tagColor('Cats', 'white')).toEqual('white')
  })

  it('returns color if it matches a Creative Quality', () => {
    expect(tagColor('Purpose', 'white')).toEqual('#9874AB')
  })

  it('returns color if it matches a Creative Subquality', () => {
    expect(tagColor('Process Clarity', 'white')).toEqual('#83CCB1')
  })
})
