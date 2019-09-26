import React from 'react'
import styled from 'styled-components'
import { Box } from 'reflexbox'
import v from '~/utils/variables'

import {
  MarketingH1,
  MarketingH2,
  MarketingContent,
  MarketingFlex,
  Card
} from '~/ui/global/styled/marketing.js'

/**
 * Price Section - SubText Component
 */
const SubText = styled(MarketingContent)`
  margin-top: 14px;
  margin-bottom: 18px;
  max-width: 849px;
  width: 100%;
`

/**
 * Price Card - Card Component
 */
const PriceCardBase = styled(Card)`
  font-family: ${v.fonts.sans};
  &:not(:last-child) {
    margin-right: 40px;

    @media (max-width: 768px) {
      margin-right: 0;
      margin-bottom: 20px;
    }
  }

  ul {
    text-align: left;
    list-style: disc outside none;
  }
`

/**
 * Price Card - Price Component
 */
const Price = styled.h2`
  font-family: Sentinel;
  font-size: 48px;
  font-weight: 500;
  font-style: italic;
  color: ${v.colors.black};
  text-align: center;
  margin: 0;
`

/**
 * Price Card - Unit Component
 */
const Unit = styled.p`
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.4px;
  text-align: center;
  color: ${v.colors.black};
  max-width: 275px;
  margin: 2px 0 10px 0;
`

/**
 * Price Card - Button Component
 */
const CTAButton = styled.button`
  margin: 10px 0;
  display: block;
  background-color: ${v.colors.caution};
  border-radius: 4px;
  border: 2px solid ${v.colors.caution};
  padding: 12px 16px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: ${v.weights.medium};
  width: 100%;
  text-decoration: none;
  text-align: center;
  color: ${v.colors.black};
`

/**
 * Price Card - Description Component
 */
const Description = styled(MarketingContent)`
  color: black;
  font-size: 16px;
  line-height: 1.31;
  letter-spacing: 0.6px;
  margin-bottom: 0;
  max-width: 100%;

  ul, li, p {
    text-align: left;
  }

  ul {
    font-size: 12px;
    margin-top: 20px;
    padding-left: 16px;
  }

  li {
    font-size: 12px;
    line-height: 16px;
    margin-bottom: 14px;
  }
`

/**
 * Price Card - Main Component
 */


const PriceCard = (props) => {
  const {
    title,
    price,
    price_unit,
    index,
    button,
    description,
    pageName,
  } = props
  return (
    <PriceCardBase>
      <MarketingFlex justify="center" px={40} py={40}>
        <Box flex column align="center" justify="flex-start" w={275}>
          <Box mb={[10, 10, 10]}>
            <MarketingH2 align="center" style={{ fontWeight: 500 }}>
              {title}
            </MarketingH2>
          </Box>
          <Price>{price}</Price>
          <Unit>
            <div dangerouslySetInnerHTML={{ __html: price_unit }} />
          </Unit>
          <Box mt={[0, 0, 0]} mb={[20, 20, 20]} w={[1, 1, 1]}>
            <CTAButton
              variant={'solid-yellow'}
              href={button.link}
            >
              {button.text}
            </CTAButton>
          </Box>
          <Description size="body" align="left">
            <div dangerouslySetInnerHTML={{ __html: description }} />
          </Description>
        </Box>
      </MarketingFlex>
    </PriceCardBase>
  )
}

/**
 * Pricing Section - Main Component
 */

const Pricing = (props) => (
  <MarketingFlex column align="center" px={24}>
    <MarketingH1 align="center">
      {props.title}
    </MarketingH1>
    <SubText align="center">
      {props.subtext}
    </SubText>
    <Box flex column={[true, true, false]} justify="center" mt={40} mb={31}>
      {props.pricing_cards.map((card, index) => (
        <PriceCard
          key={index.toString()}
          title={card.title}
          price={card.price}
          price_unit={card.price_unit}
          button={card.button}
          description={card.description}
          index={index}
          pageName={props.pageName}
        />
      ))}
    </Box>
  </MarketingFlex>
)

export { Pricing, PriceCard }
