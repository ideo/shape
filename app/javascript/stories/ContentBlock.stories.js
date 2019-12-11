// eslint-disable-next-line no-unused-vars
import React from 'react'
import ContentBlock from '~/ui/marketing/ContentBlock'

export default {
  title: 'UI|Marketing/ContentBlock',
}

const props = {
  order: 1,
  title: 'Gather inspiration and ideas',
  content:
    'Create visual spaces to brainstorm a new idea or share design inspiration across an organization. Develop your early ideas in a collaborative space, and easily request feedback directly within the platform.',
  imageUrl:
    'https://firebasestorage.googleapis.com/v0/b/shape-marketing.appspot.com/o/marketing%2Fweb%2FHome%20Page%2F1.%20Inspiration%20Gathering.jpg?alt=media&token=5f3c73be-068d-4d70-a595-8095dc93f5be',
  imageShadow: true,
}

const noShadowProps = Object.assign({}, props, { imageShadow: false })

export const withImageShadow = () => <ContentBlock {...props} />
export const withoutImageShadow = () => <ContentBlock {...noShadowProps} />
