import _ from 'lodash'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import TextareaAutosize from 'react-autosize-textarea'
import styled from 'styled-components'

import { SmallHelperText } from '~/ui/global/styled/typography'
import { StyledCommentTextarea } from '~/ui/global/styled/forms'
import v from '~/utils/variables'

const TextInputHolder = StyledCommentTextarea.extend`
  color: white;
  padding: 6px;
  background-color: ${props => (props.hasFocus ? v.colors.testLightBlueBg : v.colors.ctaButtonBlue)};
  transition: background-color 0.2s;
`

const TextInput = styled(TextareaAutosize)`
  color: white !important;
  font-family: ${v.fonts.sans} !important;
  min-height: 105px;
  width: calc(100% - 20px);

  ::placeholder {
    color: white !important;
    opacity: 1;
  }
}
`

const StyledSmallText = SmallHelperText.extend`
  color: ${v.colors.ctaButtonBlue};
  margin-left: calc(100% - 35px);
`

const MAX_LEN = 500

@observer
class DescriptionQuestion extends React.Component {
  constructor(props) {
    super(props)
    const { item } = props
    const len = item.content ? item.content.length : 0
    this.save = _.debounce(this._save, 1000)
    this.state = {
      countLeft: MAX_LEN - len,
      focused: false,
    }
  }

  _save = () => {
    const { item } = this.props
    item.save()
  }

  handleChange = (ev) => {
    const { item } = this.props
    item.content = ev.target.value
    this.setState({ countLeft: MAX_LEN - item.content.length })
    this.save()
  }

  handleBlur = () => {
    this.save.flush()
    this.setState({ focused: false })
  }

  render() {
    const { item } = this.props
    return (
      <div>
        <TextInputHolder hasFocus={this.state.focused}>
          <TextInput
            onFocus={() => this.setState({ focused: true })}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            placeholder="Write Idea Description Here…"
            value={item.content || ''}
            maxLength={MAX_LEN}
          />
          <StyledSmallText>{this.state.countLeft}</StyledSmallText>
        </TextInputHolder>
      </div>
    )
  }
}
DescriptionQuestion.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}
export default DescriptionQuestion
