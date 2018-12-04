import { shallow } from 'enzyme'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

const expectToMatchSnapshot = toRender => {
  const tree = shallow(toRender)
  expectTreeToMatchSnapshot(tree)
}
