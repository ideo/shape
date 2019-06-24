import PropTypes from 'prop-types'
import styled from 'styled-components'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
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
class DemographicsSingleChoiceQuestion extends React.Component {
  // TODO temp code (probably) so that the radio buttons act properly
  state = {
    selectedChoice: null,
  }

  handleAnswer(choiceIndex) {
    const {
      onAnswer,
      user,
      question: { category, choices },
    } = this.props

    const choice = choices[choiceIndex]

    onAnswer({ text: choice.text })

    user.API_updateCurrentUserDemographics({
      category,
      tags: choice.tags,
    })

    // TODO temp code (probably) so that the radio buttons act properly
    this.setState({
      selectedChoice: choiceIndex,
    })
  }

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
            This question is optional.
          </SmallHelperText>
        </Question>
        <Scale>
          <RadioGroup
            value={this.state.selectedChoice}
            onChange={(_e, value) => this.handleAnswer(value)}
            style={{
              paddingTop: '1rem',
              paddingBottom: '1rem',
            }}
          >
            {choices.map((choice, index) => (
              <StyledFormControlLabel
                key={index}
                value={index.toString()}
                classes={{ label: 'label' }}
                label={choice.text}
                labelPlacement="end"
                control={
                  <Radio
                    checkedIcon={<CheckCircle />}
                    icon={<CheckCircleOutline />}
                  />
                }
              />
            ))}
          </RadioGroup>
        </Scale>
      </div>
    )
  }
}

DemographicsSingleChoiceQuestion.propTypes = {
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
DemographicsSingleChoiceQuestion.defaultProps = {
  user: null,
}

export default DemographicsSingleChoiceQuestion
