module StringifiedAttributes
  extend ActiveSupport::Concern

  included do
    class_attribute :dingled_attrs
    dingled_attrs ||= []

    dingled_attrs.each do |attr|
      attribute attr do
        @object.send(attr).to_s
      end
    end
  end

  module ClassMethods
    # Assign multiple cached attributes
    def stringified_attributes(*attrs)
      self.dingled_attrs = attrs
    end
  end
end
