import styled from 'styled-components'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { SmallHelperText } from '~/ui/global/styled/typography'
import { TextInputHolder, TextInput } from './shared'

const StyledSmallText = styled(SmallHelperText)`
  color: ${props => props.theme.questionText};
  margin-left: calc(100% - 35px);
`

@observer
class DescriptionQuestion extends React.Component {
  constructor(props) {
    super(props)
    const { item } = props
    const len = item.content ? item.content.length : 0
    this.save = _.debounce(this._save, 1000)
    this.state = {
      countLeft: props.maxLength - len,
      focused: false,
    }
  }

  _save = () => {
    const { item } = this.props
    item.save()
  }

  handleChange = ev => {
    const { item, maxLength } = this.props
    item.content = ev.target.value
    this.setState({ countLeft: maxLength - item.content.length })
    this.save()
  }

  handleBlur = () => {
    this.save.flush()
    this.setState({ focused: false })
  }

  render() {
    const { item, maxLength, placeholder, canEdit } = this.props
    return (
      <TextInputHolder hasFocus={this.state.focused || item.content === ''}>
        <TextInput
          data-cy="DescriptionQuestionText"
          disabled={!canEdit}
          onFocus={() => this.setState({ focused: true })}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          type="descriptionText"
          placeholder={placeholder}
          value={item.content || ''}
          maxLength={maxLength}
        />
        <StyledSmallText>{this.state.countLeft}</StyledSmallText>
      </TextInputHolder>
    )
  }
}
DescriptionQuestion.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  placeholder: PropTypes.string.isRequired,
  maxLength: PropTypes.number,
  canEdit: PropTypes.bool,
}
DescriptionQuestion.defaultProps = {
  maxLength: 500,
  canEdit: false,
}

export default DescriptionQuestion
