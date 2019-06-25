import PropTypes from 'prop-types'
import styled from 'styled-components'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { FormControlLabel, Checkbox, FormGroup } from '@material-ui/core'
import { CheckCircle, CheckCircleOutline } from '@material-ui/icons'

import {
  DisplayText,
  SmallHelperText,
  DisplayTextCss,
} from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { validDemographicsCategories } from '~/ui/test_collections/RespondentDemographics'

// TODO duplication
const Question = styled.div`
  border-color: ${props => props.theme.borderColor};
  border-bottom-style: solid;
  border-bottom-width: 4px;
  box-sizing: border-box;
  color: white;
  padding: 12px 12px 16px 12px;
  width: 100%;
  .editable-text {
    margin: -1px -1px -1px 5px;
    padding: 2px 3px;
    transition: background-color 250ms;
    display: inline-block;
  }
  &:hover .editable-text {
    background-color: rgba(255, 255, 255, 0.5);
  }
`
Question.displayName = 'Question'

// TODO duplication
const Scale = styled.div`
  background-color: ${props => props.theme.responseHolder};
  box-sizing: border-box;
  padding: 7px 13px;
  width: 100%;
`

const StyledFormControlLabel = styled(FormControlLabel)`
  .label {
    ${DisplayTextCss};
    color: ${v.colors.primaryDark};
  }
`

@observer
class DemographicsMultipleChoiceQuestion extends React.Component {
  state = {
    selections: [],
  }

  componentDidMount() {
    const {
      question: { choices },
    } = this.props

    this.setState({ selections: new Array(choices.length).fill(false) })
  }

  handleAnswer(choiceIndex, checked) {
    const {
      onAnswer, // TODO: remove
      user,
      question: { category, choices },
    } = this.props

    onAnswer({ text: undefined }) // TODO: remove

    // update selections
    const { selections } = this.state

    selections[choiceIndex] = checked

    this.setState({ selections })

    // update demographic tags
    const tags = choices
      .map((choice, index) => (selections[index] ? choice.tags : []))
      .flat()

    if (user) {
      user.API_updateCurrentUserDemographics({
        category,
        tags,
      })
    }
  }

  // TODO: add ability to proceed to next question

  render() {
    const {
      question: { prompt, choices },
    } = this.props

    return (
      <div style={{ width: '100%' }}>
        <Question editing={false}>
          <DisplayText color={v.colors.white}>{prompt}</DisplayText>
          <SmallHelperText
            color={v.colors.demographicsHint}
            style={{ display: 'block' }}
          >
            Please select all that apply. This question is optional.
          </SmallHelperText>
        </Question>
        <Scale>
          <FormGroup
            style={{
              paddingTop: '1rem',
              paddingBottom: '1rem',
            }}
          >
            {choices.map((choice, index) => (
              <StyledFormControlLabel
                key={index}
                classes={{ label: 'label' }}
                label={choice.text}
                labelPlacement="end"
                control={
                  <Checkbox
                    checkedIcon={<CheckCircle />}
                    icon={<CheckCircleOutline />}
                    onChange={(_e, checked) =>
                      this.handleAnswer(index, checked)
                    }
                  />
                }
              />
            ))}
          </FormGroup>
        </Scale>
      </div>
    )
  }
}

DemographicsMultipleChoiceQuestion.propTypes = {
  question: PropTypes.shape({
    prompt: PropTypes.string.isRequired,
    category: PropTypes.oneOf(validDemographicsCategories()).isRequired,
    choices: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
        tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      })
    ),
  }).isRequired,
  user: MobxPropTypes.objectOrObservableObject,
  onAnswer: PropTypes.func.isRequired,
}
DemographicsMultipleChoiceQuestion.defaultProps = {
  user: null,
}

export default DemographicsMultipleChoiceQuestion
