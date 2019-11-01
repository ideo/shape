import PropTypes from 'prop-types'
import _ from 'lodash'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { action } from 'mobx'
import styled from 'styled-components'

import { Checkbox, Radio } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'
import { TextInput } from '~/ui/test_collections/shared'
import v from '~/utils/variables'

const ChoiceHolder = styled.div`
  background: ${v.colors.commonLight};
  padding: 12px 17px;
  vertical-align: baseline;

  &:hover {
    background: white;
  }
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
    const { canEdit, onChange } = this.props
    if (!canEdit) return onChange(ev)
  }

  @action
  handleInputChange = ev => {
    const { choice } = this.props
    choice.text = ev.target.value
    this.debouncedSaveChoice()
  }

  render() {
    const { choice, questionType, onChange, isChecked, canEdit } = this.props

    return (
      <ChoiceHolder>
        {questionType === 'question_single_choice' ? (
          <Radio
            id={`option-${choice.id}`}
            disabled={canEdit}
            checked={isChecked}
            onClick={onChange}
            value={choice.value}
            color="primary"
          />
        ) : (
          <Checkbox
            disabled={canEdit}
            checked={isChecked}
            onClick={onChange}
            value={choice.value}
            color="primary"
          />
        )}
        <label htmlFor={`option-${choice.id}`} onClick={this.handleLabelClick}>
          <DisplayText color={v.colors.commonDark}>
            <TextInput
              onChange={this.handleInputChange}
              value={choice.text}
              type="questionText"
              placeholder="write question here"
              data-cy="CustomizableQuestionTextInput"
              disabled={!canEdit}
              inline
            />
          </DisplayText>
        </label>
      </ChoiceHolder>
    )
  }
}

CustomizableQuestionChoice.propTypes = {
  onChange: PropTypes.func.isRequired,
  questionType: PropTypes.string.isRequired,
  choice: MobxPropTypes.objectOrObservableObject.isRequired,
  questionAnswer: MobxPropTypes.objectOrObservableObject,
  isChecked: PropTypes.bool,
  editing: PropTypes.bool,
  canEdit: PropTypes.bool,
  onTextEditChange: PropTypes.func,
}

CustomizableQuestionChoice.defaultProps = {
  questionAnswer: null,
  isChecked: false,
  editing: false,
  canEdit: false,
  onTextEditChange: () => {},
}

export default CustomizableQuestionChoice
