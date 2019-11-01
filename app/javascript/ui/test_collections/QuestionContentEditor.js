import styled from 'styled-components'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import {
  QuestionHelperText,
  TextInputHolder,
  TextInput,
} from '~/ui/test_collections/shared'

const StyledSmallText = styled(QuestionHelperText)`
  position: absolute;
  right: 16px;
  bottom: 10px;
`

const QuestionHelperWrapper = styled.div`
  position: relative;
  top: -10px;
  left: 10px;
`

@observer
class QuestionContentEditor extends React.Component {
  constructor(props) {
    super(props)
    const { value } = this
    const len = value ? value.length : 0
    this.inputRef = React.createRef()
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

  get value() {
    const { item, itemAttribute } = this.props
    return item[itemAttribute] || ''
  }

  handleChange = ev => {
    const { item, itemAttribute, maxLength } = this.props
    const { value } = ev.target
    item[itemAttribute] = value
    this.setState({ countLeft: maxLength - value.length })
    this.save()
  }

  handleBlur = () => {
    this.save.flush()
    this.setState({ focused: false })
  }

  render() {
    const { maxLength, placeholder, canEdit, optional } = this.props
    const { focused, countLeft } = this.state
    return (
      <TextInputHolder hasFocus={focused}>
        <TextInput
          ref={this.inputRef}
          data-cy="QuestionContentEditorText"
          disabled={!canEdit}
          onFocus={() => this.setState({ focused: true })}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          type="descriptionText"
          placeholder={placeholder}
          value={this.value}
          maxLength={maxLength}
          // for ignoring global keypress
          className="test-designer-text-input"
        />
        {optional && (
          <QuestionHelperWrapper
            onClick={() => {
              if (this.inputRef.current) {
                // this allows you to enter the text area even when you click below
                this.inputRef.current.textarea.focus()
              }
            }}
          >
            <QuestionHelperText>this question is optional.</QuestionHelperText>
          </QuestionHelperWrapper>
        )}
        <StyledSmallText block>{focused ? countLeft : ''}</StyledSmallText>
      </TextInputHolder>
    )
  }
}
QuestionContentEditor.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  itemAttribute: PropTypes.string,
  placeholder: PropTypes.string.isRequired,
  maxLength: PropTypes.number,
  canEdit: PropTypes.bool,
  optional: PropTypes.bool,
}
QuestionContentEditor.defaultProps = {
  itemAttribute: 'content',
  maxLength: 500,
  canEdit: false,
  optional: false,
}

export default QuestionContentEditor