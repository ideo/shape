module StringifiedAttributes
  extend ActiveSupport::Concern

  included do
    class_attribute :stringified_attribute_names
    stringified_attribute_names ||= []

    stringified_attribute_names.each do |attr|
      attribute attr do
        @object.send(attr).to_s
      end
    end
  end

  module ClassMethods
    # Assign multiple cached attributes
    def stringified_attributes(*attrs)
      self.stringified_attribute_names = attrs
    end
  end
end
