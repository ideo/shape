import styled from 'styled-components'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'

import {
  QuestionHelperText,
  TextInputHolder,
  TextInput,
  SingleLineInput,
} from '~/ui/test_collections/shared'

const StyledSmallText = styled(QuestionHelperText)`
  position: absolute;
  right: 16px;
  bottom: 10px;
`

const QuestionHelperWrapper = styled.div`
  position: relative;
  top: -4px;
  left: 10px;
`

@inject('uiStore')
@observer
class QuestionContentEditor extends React.Component {
  constructor(props) {
    super(props)
    const { value } = this
    const len = value ? value.length : 0
    this.inputRef = React.createRef()
    this.save = _.debounce(this._save, 1000)
    this.instanceQuestionContentUpdate = _.debounce(
      this._instanceQuestionContentUpdate,
      30000
    )
    this.state = {
      countLeft: props.maxLength - len,
      focused: false,
      readOnly: false,
    }
  }

  _save = () => {
    const { item } = this.props
    item.save()
  }

  _instanceQuestionContentUpdate = () => {
    const { handleInstanceQuestionContentUpdate } = this.props

    if (handleInstanceQuestionContentUpdate) {
      handleInstanceQuestionContentUpdate()
    }
  }

  get value() {
    const { item, itemAttribute } = this.props
    return item[itemAttribute] || ''
  }

  handleChange = async ev => {
    const { item, itemAttribute, maxLength } = this.props
    const { value } = ev.target
    item[itemAttribute] = value
    this.setState({ countLeft: maxLength - value.length })
    await this.save()
    this.instanceQuestionContentUpdate()
  }

  handleBlur = () => {
    this.save.flush()
    this.instanceQuestionContentUpdate.flush()
    this.setState({ focused: false })
  }

  onClick = async ev => {
    const { handleFocus } = this.props
    const result = await handleFocus()
    if (!result) {
      // Make it temporarily readonly before we can blur the focus
      this.setState({ focused: false, readOnly: true })
      // Set timeout is needed to actually blur the element
      setTimeout(() => {
        this.inputRef.current.blur()
        this.setState({ readOnly: false })
      }, 250)
    }
  }

  render() {
    const { maxLength, placeholder, canEdit, singleLine, optional } = this.props
    const { focused, countLeft, readOnly } = this.state
    const InputComponent = singleLine ? SingleLineInput : TextInput

    return (
      <TextInputHolder hasFocus={focused}>
        <InputComponent
          ref={this.inputRef}
          data-cy="QuestionContentEditorText"
          disabled={!canEdit}
          onClick={this.onClick}
          onFocus={() => this.setState({ focused: true })}
          onBlur={this.handleBlur}
          readOnly={readOnly}
          onChange={this.handleChange}
          type="descriptionText"
          placeholder={placeholder}
          value={this.value}
          maxLength={maxLength}
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
  singleLine: PropTypes.bool,
  handleFocus: PropTypes.func,
  handleInstanceQuestionContentUpdate: PropTypes.func,
}
QuestionContentEditor.defaultProps = {
  itemAttribute: 'content',
  maxLength: 500,
  canEdit: false,
  optional: false,
  singleLine: false,
  handleFocus: () => true,
  handleInstanceQuestionContentUpdate: () => true,
}

QuestionContentEditor.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

QuestionContentEditor.displayName = 'QuestionContentEditor'

export default QuestionContentEditor
