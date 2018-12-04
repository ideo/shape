import toJson from 'enzyme-to-json'

const expectTreeToMatchSnapshot = tree => {
  expect(toJson(tree)).toMatchSnapshot()
}

export default expectTreeToMatchSnapshot
