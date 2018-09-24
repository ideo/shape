import React from 'react'
import styled from 'styled-components'
import v from '~/utils/variables'

const BetaSticker = styled.div`
  width: 319px;
  height: 71px;
  top: 126px;
  background: url('https://firebasestorage.googleapis.com/v0/b/shape-marketing.appspot.com/o/marketing%2Fcommon%2Fbeta-sticker.png?alt=media&token=a54471e3-e119-489b-9871-a6bbe4972615');
  background-size: cover;
  background-repeat: no-repeat;
  right: 0;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;

  p {
    margin: 0;
    text-transform: uppercase;
    margin: 0;
    text-transform: uppercase;
    font-family: Gotham;
    font-size: 18px;
    font-weight: 500;
    letter-spacing: 0.6px;
    color: #f5f4f3;
    padding-bottom: 6px;
    padding-left: 10px;
  }

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    width: 218px;
    height: 55px;

    p {
      padding-bottom: 2px;
      font-size: 16px;
    }
  }

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    top: 79px;
    width: 126px;
    height: 29px;

    p {
      font-size: 8px;
      letter-spacing: 0.2px;
    }
  }
`

export default () => (
  <BetaSticker>
    <p>We&#39;re In Beta!</p>
  </BetaSticker>
)
