module CachedAttributes
  extend ActiveSupport::Concern

  included do
    class_attribute :cached_attribute_names
  end

  module ClassMethods
    # Assign multiple cached attributes
    def cached_attributes(*attrs)
      attrs.each do |attr|
        cached_attribute(attr)
      end
    end

    # Assign single cached attribute with either a symbol or a block
    # e.g. cached_attribute :tag_list
    #      cached_attribute :tag_list { @object.get_tag_list }
    #
    def cached_attribute(name, options = {}, &block)
      name = name.to_s
      self.cached_attribute_names ||= []
      self.cached_attribute_names << name

      # Define attribute using the regular attribute DSL
      # Use a block that returns the cached value
      attribute(name, options) do
        # Only generate value if nothing was found
        if cached_attributes_values[name].nil?
          # Block used to get attribute value
          attr_block = block || proc { @object.public_send(name) }

          # Sets and returns value
          set_cached_attribute_value(name, instance_eval(&attr_block))
        else
          # Return cached value if present
          cached_attributes_values[name]
        end
      end
    end

    def cached_attribute?(name)
      return false if cached_attribute_names.blank?
      cached_attribute_names.include?(name.to_s)
    end
  end

  def initialize(*args)
    # Have to init this here,
    # because the super's initialize freezes the object
    @cached_attributes_values = {}
    super(*args)
  end

  private

  def set_cached_attribute_value(name, value)
    data = cached_attributes_values
    data[name] = value
    self.cached_attributes_values = data
    value
  end

  def cached_attributes_values
    # Must use merge because the class is frozen
    @cached_attributes_values.merge!(Cache.get(cached_attributes_cache_key) || {})
  end

  def cached_attributes_values=(data)
    Cache.set(cached_attributes_cache_key, data)
    @cached_attributes_values.merge!(data)
  end

  def cached_attributes_cache_key
    @object.jsonapi_cache_key
  end
end
