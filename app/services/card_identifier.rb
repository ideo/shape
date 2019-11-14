class CardIdentifier

  def self.call(*objects)
    objects = [objects] unless objects.is_a?(Array)
    objects.compact.map do |obj|
      if obj.is_a?(String)
        obj
      else
        "#{obj.class.name}_#{obj.id}"
      end
    end.join('-')
  end
end
