import React from 'react'
import { observer } from 'mobx-react'
import { Grid } from '@material-ui/core'
import localStorage from 'mobx-localstorage'
import styled from 'styled-components'

import Button from '~/ui/global/Button'
import v from '~/utils/variables'

const FADE_OUT_MS = 350

const StyledCookiesMessage = styled.div`
  position: fixed;
  bottom: 0;
  z-index: 1000000; // To get it above zendesk widget
  padding: 25px;
  background-color: rgba(0, 0, 0, 0.75);
  width: 100%;
  transition: opacity ${FADE_OUT_MS}ms;
  transition-timing-function: ease-out;
  opacity: ${props => (props.justAccepted ? 0 : 1)};
  @media screen and (max-width: $screen-xs) {
    padding: 15px;
  }
`
const StyledCookiesMessageText = styled.div`
  text-align: center;
  color: #fff;
  line-height: 1.1rem;
  font-family: ${v.fonts.sans};
  font-size: 13px;
  font-weight: 100;
  margin: 0 auto;
  padding: 0 15% 0 0;
  position: relative;
  letter-spacing: 1px;
  max-width: 800px;
  text-transform: uppercase;
  a {
    color: #fff;
    margin-left: 5px;
    text-decoration: underline;
  }
  @media screen and (min-width: $screen-xs) and (max-width: $screen-sm-min) {
    padding-right: 20%;
  }
  @media screen and (max-width: $screen-xs) {
    padding: 0;
  }
`

const StyledCookiesMessageBtn = styled(Button)`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  @media screen and (min-width: $screen-xs) and (max-width: $screen-sm-min) {
    right: 15px;
  }
  @media screen and (max-width: $screen-xs) {
    position: relative;
    display: block;
    right: auto;
    top: auto;
    transform: none;
    margin-top: 15px;
  }
`
StyledCookiesMessageBtn.displayName = 'StyledCookiesMessageBtn'

@observer
class CookiesMessage extends React.Component {
  state = {
    justAccepted: false,
  }

  acceptCookiesHandler = () => {
    this.setState({
      justAccepted: true,
    })
    setTimeout(() => {
      localStorage.setItem('accepted_cookies', true)
    }, FADE_OUT_MS)
  }

  render() {
    const { justAccepted } = this.state
    const previouslyAccepted = localStorage.getItem('accepted_cookies')
    if (previouslyAccepted) return <div />
    return (
      <StyledCookiesMessage justAccepted={justAccepted}>
        <Grid container>
          <Grid item xs={12}>
            <StyledCookiesMessageText data-cy="accept-cookies-text">
              This site uses cookies to help us provide you with a positive
              experience when you browse our site. By continuing to use our
              site, you consent to use our cookies.
              <a href="https://www.ideo.com/privacy" target="_blank">
                Learn more
              </a>
              <StyledCookiesMessageBtn
                onClick={this.acceptCookiesHandler}
                data-cy="accept-cookies-btn"
                colorScheme={v.colors.white}
                size={'sm'}
              >
                Continue
              </StyledCookiesMessageBtn>
            </StyledCookiesMessageText>
          </Grid>
        </Grid>
      </StyledCookiesMessage>
    )
  }
}

export default CookiesMessage
