import PropTypes from 'prop-types'
import styled from 'styled-components'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { FormControlLabel, Radio, RadioGroup } from '@material-ui/core'

import {
  DisplayText,
  SmallHelperText,
  DisplayTextCss,
} from '~/ui/global/styled/typography'
import v from '~/utils/variables'

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
class DemographicSingleChoiceQuestion extends React.Component {
  state = {
    answer: null,
  }

  handleAnswer(value) {
    const { onAnswer, user } = this.props

    onAnswer({ text: value })
    user.API_updateCurrentUserDemographics({
      category: 'education_levels',
      tags: ['High school diploma'],
    })

    this.setState({
      answer: value,
    })
  }

  render() {
    return (
      <div style={{ width: '100%' }}>
        <Question editing={false}>
          <DisplayText color={v.colors.white}>
            What's the highest level of education you have completed?
          </DisplayText>
          <SmallHelperText color="#99b8c2" style={{ display: 'block' }}>
            This question is optional.
          </SmallHelperText>
        </Question>
        <Scale>
          <RadioGroup
            value={this.state.answer}
            name="demographics_education"
            onChange={(_e, value) => this.handleAnswer(value)}
            style={{
              paddingTop: '1rem',
              paddingBottom: '1rem',
            }}
          >
            <StyledFormControlLabel
              value="High School Diploma"
              classes={{ label: 'label' }}
              label="High School Diploma"
              labelPlacement="end"
              control={<Radio />}
            />
            <StyledFormControlLabel
              classes={{ label: 'label' }}
              value="College or Bachelor's Degree"
              label="College or Bachelor's Degree"
              labelPlacement="end"
              control={<Radio />}
            />
          </RadioGroup>
        </Scale>
      </div>
    )
  }
}

DemographicSingleChoiceQuestion.propTypes = {
  user: MobxPropTypes.objectOrObservableObject,
  onAnswer: PropTypes.func.isRequired,
}
DemographicSingleChoiceQuestion.defaultProps = {
  user: null,
}

export default DemographicSingleChoiceQuestion
