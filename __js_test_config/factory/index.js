import { apiStore } from '~/stores'

const Factory = {
  async create(factoryName, overrides = {}, mockedApiStore) {
    const toUseApiStore = !mockedApiStore ? apiStore : mockedApiStore
    let factoryData = { data: {} }
    try {
      factoryData = await import(`./data/${factoryName}.json`)
    } catch (e) {
      throw new Error(`Not valid data for this factory, ${factoryName}, object will be empty`)
    } finally {
      const mergedData = Object.assign({}, factoryData.data.attributes, overrides)
      const mergedObject = Object.assign({}, factoryData.data, {
        attributes: mergedData
      })
      if (mergedObject.attributes.id) delete mergedObject.attributes.id
      let record = toUseApiStore.find(mergedObject.type, mergedObject.id)
      if (record) {
        record.update(mergedData)
      } else {
        record = toUseApiStore.add(mergedObject, mergedObject.type)
      }
      return record
    }
  }
}

export default Factory
