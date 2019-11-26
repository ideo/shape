import PropTypes from 'prop-types'
import _ from 'lodash'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action } from 'mobx'
import styled from 'styled-components'

import { Checkbox, Radio } from '~/ui/global/styled/forms'
import { TextInput } from '~/ui/test_collections/shared'
import TrashIcon from '~/ui/icons/TrashIcon'
import v from '~/utils/variables'

const ChoiceHolder = styled.div`
  background: ${props => props.theme.responseHolder};
  color: ${props => props.theme.questionText};
  padding: 12px 17px;
  vertical-align: baseline;

  .TrashIcon {
    display: none;
  }

  &:hover {
    filter: brightness(110%);

    .TrashIcon {
      display: inline-block;
      &:focus,
      &:hover {
        color: ${v.colors.commonDarkest};
      }
    }
  }
`
ChoiceHolder.displayName = 'ChoiceHolder'

const IconHolder = styled.button`
  color: ${props => props.theme.questionTrashIcon};
  display: inline-block;
  height: 22px;
  vertical-align: middle;
  width: 27px;
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
            classes={{ root: 'remove-padding' }}
          />
        ) : (
          <Checkbox
            disabled={editing}
            checked={isChecked}
            onClick={onChange}
            value={choice.value}
            color="primary"
            classes={{ root: 'remove-padding' }}
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
            value={choice.text || ''}
            data-cy="CustomizableQuestionTextInput"
            disabled={!editing}
            inline="true"
          />
        </label>
        {editing && (
          <IconHolder
            className="TrashIcon"
            data-cy="TrashIconHolder"
            onClick={this.handleDelete}
          >
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
