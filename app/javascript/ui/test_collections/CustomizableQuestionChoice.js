import PropTypes from 'prop-types'
import _ from 'lodash'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action } from 'mobx'
import styled from 'styled-components'

import { Checkbox, Radio } from '~/ui/global/styled/forms'
import { TextInput } from '~/ui/test_collections/shared'
import TrashIcon from '~/ui/icons/TrashIcon'

const ChoiceHolder = styled.div`
  background: ${props => props.theme.questionChoiceHolder};
  padding: 12px 17px;
  vertical-align: baseline;

  &:hover {
    background: white;
  }
`
ChoiceHolder.displayName = 'ChoiceHolder'

const IconHolder = styled.button`
  display: inline-block;
  height: 27px;
  vertical-align: middle;
  width: 22px;
`

@observer
class CustomizableQuestionChoice extends React.Component {
  constructor(props) {
    super(props)
    this.debouncedSaveChoice = _.debounce(this._saveChoice, 1050)
  }

  _saveChoice = () => {
    const { choice } = this.props
    choice.save()
  }

  handleLabelClick = ev => {
    const { editing, onChange } = this.props
    if (!editing) return onChange(ev)
  }

  @action
  handleInputChange = ev => {
    const { choice } = this.props
    choice.text = ev.target.value
    this.debouncedSaveChoice()
  }

  handleDelete = ev => {
    const { choice, onDelete } = this.props
    onDelete(choice)
  }

  render() {
    const {
      choice,
      isSingleChoiceQuestion,
      onChange,
      isChecked,
      editing,
      handleFocus,
      placeholder,
    } = this.props

    return (
      <ChoiceHolder>
        {isSingleChoiceQuestion ? (
          <Radio
            id={`option-${choice.id}`}
            disabled={editing}
            checked={isChecked}
            onClick={onChange}
            value={choice.value}
            color="primary"
            removePadding
          />
        ) : (
          <Checkbox
            disabled={editing}
            checked={isChecked}
            onClick={onChange}
            value={choice.value}
            color="primary"
            removePadding
          />
        )}
        <label
          htmlFor={`option-${choice.id}`}
          onClick={this.handleLabelClick}
          style={{
            width: 'calc(100% - 55px',
            display: 'inline-block',
            verticalAlign: 'middle',
          }}
        >
          <TextInput
            onFocus={handleFocus}
            onChange={this.handleInputChange}
            type="questionText"
            placeholder={placeholder}
            value={choice.text}
            data-cy="CustomizableQuestionTextInput"
            disabled={!editing}
            inline="true"
          />
        </label>
        {editing && (
          <IconHolder data-cy="TrashIconHolder" onClick={this.handleDelete}>
            <TrashIcon />
          </IconHolder>
        )}
      </ChoiceHolder>
    )
  }
}

CustomizableQuestionChoice.propTypes = {
  onChange: PropTypes.func.isRequired,
  isSingleChoiceQuestion: PropTypes.bool.isRequired,
  choice: MobxPropTypes.objectOrObservableObject.isRequired,
  questionAnswer: MobxPropTypes.objectOrObservableObject,
  isChecked: PropTypes.bool,
  editing: PropTypes.bool,
  onDelete: PropTypes.func,
  handleFocus: PropTypes.func,
  placeholder: PropTypes.string,
}

CustomizableQuestionChoice.defaultProps = {
  questionAnswer: null,
  isChecked: false,
  editing: false,
  onDelete: () => {},
  handleFocus: () => true,
  placeholder: 'Write your option here',
}

CustomizableQuestionChoice.displayName = 'CustomizableQuestionChoice'

export default CustomizableQuestionChoice
