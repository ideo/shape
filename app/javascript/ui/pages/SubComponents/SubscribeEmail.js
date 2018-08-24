import { Fragment } from 'react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'

import _ from 'lodash'
import { action } from 'mobx'
import isEmail from '~/utils/isEmail'
import v from '~/utils/variables'

const SubscribeInput = styled.input`
  width: 90%;
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  margin: 1em;
  padding: 12px 12px;
  cursor: pointer;
  letter-spacing: 1.5px;
  border-radius: 4px;
  border: 2px solid white;
`

const SubscribeButton = styled.button`
  align: left;
  font-weight: ${v.weights.medium};
  font-family: ${v.fonts.sans};
  font-size: 14px;
  color: white;
  margin: 1em;
  padding: 12px 12px;
  cursor: pointer;
  letter-spacing: 0.5px;
  border-radius: 4px;
  border: 2px solid white;
  text-transform: uppercase;

  &:hover {
    color: ${v.colors.blackLava};
  }
`

class SubscribeEmail extends React.Component {
  constructor(props) {
    super(props)
    this.emailInput = React.createRef()
  }

  @action
  onSubscribe= (data) => {
    // check if the input is an email string e.g. "person@email.com"
    const emailInput = !data.id
    if (emailInput && !isEmail(data.custom)) {
      // try filtering out for emails within the string
      // NOTE: this will re-call onSubScribe with any valid emails
      this.handleEmailInput(_.filter(data.custom.match(/[^\s,]+/g), isEmail))
    }
    this.handleSubscribe(data.custom)
  }

  handleEmailInput = (emails) => {
    _.each(emails, email => {
      this.onSubScribe({
        custom: email,
      })
    })
  }

  handleSubscribe = (email) => {
    // TODO: Post to Mailchip, etc
  }

  handleTextChange = (ev) => {
    this.emailText = ev.target.value
  }

  render() {
    return (
      <Fragment>
        <Flex
          align="center"
          justify="center"
          wrap
          w={1}
        >
          <Box w={[1 / 8, 2 / 8]} />
          <Box w={[4 / 8, 3 / 8]}>
            <SubscribeInput
              ref={this.emailInput}
              type="text"
              placeholder="Email"
              value={this.emailText}
              onChange={this.handleTextChange}
            />
          </Box>
          <Box w={[2 / 8, 1 / 8]}>
            <SubscribeButton
              type="button"
              onClick={this.onSubscribe}
              disabled={this.emailInput.length === 0}
            >
              Subscribe
            </SubscribeButton>
          </Box>
          <Box w={[1 / 8, 2 / 8]} />
        </Flex>
      </Fragment>
    )
  }
}

export default SubscribeEmail
