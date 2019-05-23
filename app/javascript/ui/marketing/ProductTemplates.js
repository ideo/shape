import ProductTemplate from '~/ui/marketing/ProductTemplate'
import marketingFirestoreClient from '~/vendor/firebase/sites/marketing'
import styled from 'styled-components'
import v from '~/utils/variables'

const Content = styled.div`
  color: black;
  letter-spacing: -0.2px;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
`

export default class ProductTemplates extends React.PureComponent {
  constructor() {
    super()
    this.state = { templates: [] }
  }

  componentDidMount() {
    marketingFirestoreClient
      .getObjectFromCollection('productTemplates')
      .then(productTemplates => {
        const templatesToArray = Object.keys(productTemplates)
          .map(key => Object.assign({ id: key }, productTemplates[key]))
          .sort((a, b) => a.order - b.order)
        this.setState({ templates: templatesToArray }) // convert firestore collection object to iterable array
      })
  }

  render() {
    const { templates } = this.state
    return (
      <Content>
        {templates && templates.length > 0 ? (
          templates.map(t => (
            <ProductTemplate
              key={t.id}
              id={t.id}
              order={t.order}
              title={t.title}
              description={t.description}
              descriptionMarkdown={t.descriptionMarkdown}
              descriptionHTML={t.descriptionHTML}
              imageUrl={t.imageUrl}
            />
          ))
        ) : (
          <div />
        )}
      </Content>
    )
  }
}
