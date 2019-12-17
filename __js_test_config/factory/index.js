import { apiStore } from '~/stores'

const Factory = {
  async create(factoryName, overrides = {}) {
    let factoryData = { data: {} }
    try {
      factoryData = await import(`./data/${factoryName}.json`)
    } catch (e) {
      throw new Error(`Not valid data for this factory, ${factoryName}, object will be empty`)
    } finally {
      const mergedData = Object.assign({}, factoryData.data, overrides)
      const record = apiStore.add(mergedData, mergedData.type)
      return record
    }
  }
}

export default Factory
