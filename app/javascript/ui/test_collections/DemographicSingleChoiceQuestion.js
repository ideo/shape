import PropTypes from 'prop-types'
import styled from 'styled-components'

import { DisplayText, SmallHelperText } from '~/ui/global/styled/typography'
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

class DemographicSingleChoiceQuestion extends React.Component {
  handleAnswer(event) {
    this.props.onAnswer({ text: event.target.value })
  }

  render() {
    return (
      <div style={{ width: '100%' }}>
        <Question editing={false}>
          <DisplayText color={v.colors.white}>
            What's the highest level of education you have completed?
          </DisplayText>
        </Question>
        <Scale>
          <SmallHelperText>This question is optional.</SmallHelperText>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>
              <input
                type="radio"
                id="demographics_education_highschool"
                name="demographics_education"
                value="High School Diploma"
                onChange={e => this.handleAnswer(e)}
              />
              <label htmlFor="demographics_education_highschool">
                High School Diploma
              </label>
            </span>

            <span>
              <input
                type="radio"
                id="demographics_education_college"
                name="demographics_education"
                value="College or Bachelor's Degree"
                onChange={e => this.handleAnswer(e)}
              />
              <label htmlFor="demographics_education_college">
                College or Bachelor's Degree
              </label>
            </span>
          </div>
        </Scale>
      </div>
    )
  }
}

DemographicSingleChoiceQuestion.propTypes = {
  onAnswer: PropTypes.func.isRequired,
}

export default DemographicSingleChoiceQuestion
