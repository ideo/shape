import React from "react";
import PropTypes from "prop-types";

import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import MenuIcon from '@material-ui/icons/Menu';
import Typography from '@material-ui/core/Typography';

import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'

import v from '~/utils/variables'
import PageContainer from '~/ui/layout/PageContainer'
import { Heading1 } from '~/ui/global/styled/typography'
import { Heading2 } from '~/ui/global/styled/typography'


const styles = {
  rightToolbar: {
    marginLeft: 'auto',
    marginRight: -12,
  },
}

const CenteredFlex = styled.div`
  display: flex;
  flex: 1;
  align-self: center;
  justify-content: center;
  align-items: center;

  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  -webkit-flex-align: center;
  -ms-flex-align: center;
  -webkit-align-items: center;
`

const Centered = styled.div`
  align: center;
`

const RightFlex = styled.div`
  display: flex;
  flex: 1;
  align-self: right;
  justify-content: flex-end;

  -webkit-flex-align: right;
  -ms-flex-align: right;
  -webkit-align-items: right;
`

const Footer = styled.div`
  text-align: center;
  background: #73808f;
  font-family: ${v.fonts.sans};
  color: white;
`;

const PatternedBack = styled.div`
  background-image: url('https://i.imgur.com/RO9r0yS.png');
  background-repeat-x;
`

const GradientPattern = styled.div`
  text-align: center;
  background-repeat;
  overflow: auto;
  -webkit-box-sizing: content-box;
  -moz-box-sizing: content-box;
  box-sizing: content-box;
  width: 100%;
  border: none;
  color: rgb(247, 247, 247);
  background: -webkit-linear-gradient(-90deg, rgba(255,255,255,0.9) 0, rgba(255,255,255,1) 100%), -webkit-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -webkit-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -webkit-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -webkit-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -webkit-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), rgba(255,255,255,1);
  background: -moz-linear-gradient(180deg, rgba(255,255,255,0.9) 0, rgba(255,255,255,1) 100%), -moz-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -moz-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -moz-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -moz-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), -moz-radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), rgba(255,255,255,1);
  background: linear-gradient(180deg, rgba(255,255,255,0.9) 0 rgba(255,255,255,1) 100%), radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), radial-gradient(rgba(90,90,90,1) 0, rgb(255,255,255) 15%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 100%), rgba(255,255,255,1);
  background-position: 50% 50%, 43px 48px, 14px 24px, 49px 28px, 34px 36px, 36px 14px;
  -webkit-background-origin: padding-box;
  background-origin: padding-box;
  -webkit-background-clip: border-box;
  background-clip: border-box;
  -webkit-background-size: auto auto, 30px 40px, 40px 30px, 50px 40px, 30px 40px, 40px 30px;
  background-size: auto auto, 30px 40px, 40px 30px, 50px 40px, 30px 40px, 40px 30px;
`

const NavLink = styled.button`
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 0.75rem;
  color: black;
  margin: 1em;
  padding: 6px 12px;
  cursor: pointer;

    &:hover {
    color: ${v.colors.gray};
  }
`
const InvertHeading1 = Heading1.extend`
  color: white;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.bold};
  letter-spacing: 0px;
`
const InvertHeading2 = Heading2.extend`
  color: white;
  font-family: ${v.fonts.sans};
  letter-spacing: 0px;
`

const ContentLink = styled.button`
  font-weight: ${v.weights.book};
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  color: black;
  margin: 1em;
  padding: 6px 12px;
  cursor: pointer;
  letter-spacing: 1.5px;

  &:hover {
    color: ${v.colors.gray};
  }
`

const CallToAction = ContentLink.extend`
  background-color: #fcf113;
  border-radius: 4px;
  border: 1px solid #fcf113;
`

const VideoLink = ContentLink.extend`
  border-radius: 4px;
  border: 2px solid black;
`
const HeavyCTA = CallToAction.extend`
  font-weight: ${v.weights.bold};
  font: ${v.fonts.sans};
`

const InvertContent = styled.div`
  color: white;
  letter-spacing: -0.2px;
`

const InvertLink = styled.a`
    color: white;
    letter-spacing: -0.2px;
    font-size: 1rem;
`

const InvertSubscribe = styled.div`
  color: white;
  letter-spacing: -0.2px;
  font-size: 0.75rem;
`

const InvertLegal = styled.div`
  color: white;
  letter-spacing: -0.2px;
  font-size: 0.75rem;
`

class MarketingPage extends React.PureComponent {
  render() {
    return (
      <React.Fragment>
          <GradientPattern>
          <AppBar position="static" style={{background: 'transparent',  boxShadow: 'none'}}>
            <Toolbar>
                <NavLink>ABOUT</NavLink>
                <NavLink>PRODUCT</NavLink>
                <NavLink>PRICING</NavLink>
                <CenteredFlex>
                  <img src='https://i.imgur.com/3cTLhSu.png' />
                </CenteredFlex>
                <section className={styles.rightToolbar}>
                  <NavLink>CONTACT</NavLink>
                  <NavLink>LOGIN</NavLink>
                </section>
            </Toolbar>
          </AppBar>

          <RightFlex>In Beta Sticker</RightFlex>
          <Centered>
            <img src='https://i.imgur.com/rBsFQ0O.png' />
          </Centered>

          <CenteredFlex>
            <CallToAction>GET EARLY ACCESS</CallToAction>
            <VideoLink>WATCH THE VIDEO</VideoLink>
          </CenteredFlex>
        </GradientPattern>

        <CenteredFlex>
          Left Text Right Image <br/>
          Left Image Right Text <br/>
        </CenteredFlex>

        <Footer>
          <InvertHeading1>Access is just $5 / month per person.</InvertHeading1>
          <InvertHeading2>The first month is on us.</InvertHeading2>
          <br/>
          <HeavyCTA>GET EARLY ACCESS</HeavyCTA>
          <br/>
          <br/>
          <InvertContent>Curious to learn more? Drop us a line at:</InvertContent>
          <br/>
          <InvertLink>hello@shape.space</InvertLink>
          <br/>
          Stay current on new features and case studies by signing up for our mailing list:<br/>
          <InvertSubscribe />
          <InvertLegal />
        </Footer>

      </React.Fragment>
    )
  }
}

export default MarketingPage
