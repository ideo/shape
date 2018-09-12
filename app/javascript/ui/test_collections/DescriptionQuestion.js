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
`

const TextInput = styled(TextareaAutosize)`
  background-color: #9FC1CB;
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
  color: #5698AE;
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

  render() {
    const { item } = this.props
    return (
      <div>
        <TextInputHolder>
          <TextInput
            onChange={this.handleChange}
            placeholder="Write Idea Description Here…"
            value={item.content || ''}
            onBlur={this.save}
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
