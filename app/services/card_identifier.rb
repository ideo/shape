class CardIdentifier
  def self.call(objects, custom_name = nil)
    identifiers = objects.compact.sort_by{ |obj| obj.class.name}.map do |obj|
      "#{obj.class.name}_#{obj.id}"
    end
    identifiers.push(custom_name) if custom_name.present?

    identifiers.join('-')
  end
end
