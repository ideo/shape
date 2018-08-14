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


const styles = {
  rightToolbar: {
    marginLeft: 'auto',
    marginRight: -12,
  },
};

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
`;

const RightFlex = styled.div`
  display: flex;
  flex: 1;
  align-self: right;
  justify-content: flex-end;

  -webkit-flex-align: right;
  -ms-flex-align: right;
  -webkit-align-items: right;
`;

const Footer = styled.div`
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
  background: #73818E;
`;

const PatternedBack = styled.div`
  background-image: url('https://i.imgur.com/RO9r0yS.png');
  background-repeat-x;
`;

class MarketingPage extends React.PureComponent {
  render() {
    return (
      <React.Fragment>
          <PatternedBack>

          <AppBar position="static" style={{background: 'transparent',  boxShadow: 'none'}}>
            <Toolbar>
                <Button>ABOUT</Button>
                <Button>PRODUCT</Button>
                <Button>PRICING</Button>
                <CenteredFlex>
                  <img src='https://i.imgur.com/3cTLhSu.png' />
                </CenteredFlex>
                <section className={styles.rightToolbar}>
                  <Button>CONTACT</Button>
                  <Button>LOGIN</Button>
                </section>
            </Toolbar>
          </AppBar>

          <RightFlex>In Beta Sticker</RightFlex>
          <CenteredFlex>
            <img src='https://i.imgur.com/rBsFQ0O.png' />
          </CenteredFlex>

          <CenteredFlex>
            <Button>GET EARLY ACCESS</Button>  <Button>WATCH THE VIDEO</Button> <br/>
          </CenteredFlex>
        </PatternedBack>

        <CenteredFlex>
          Left Text Right Image <br/>
          Left Image Right Text <br/>
        </CenteredFlex>

        <Footer>
        Footer
        </Footer>

      </React.Fragment>
    )
  }
}

export default MarketingPage
