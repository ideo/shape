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
      self.cached_attribute_names ||= []
      self.cached_attribute_names << name.to_sym

      # Define attribute using the regular attribute DSL
      # Use a block that returns the cached value
      attribute(name, options) do
        # Return cached value if present
        if cached_attributes_values[name].present?
          cached_attributes_values[name]
        else
          # Block used to get attribute value
          attr_block = block || proc { @object.public_send(name) }

          # Sets and returns value
          set_cached_attribute_value(name, instance_eval(&attr_block))
        end
      end
    end

    def cached_attribute?(name)
      return false if cached_attribute_names.blank?
      cached_attribute_names.include?(name.to_sym)
    end
  end

  private

  def set_cached_attribute_value(name, value)
    data = cached_attributes_values
    data[name] = value
    self.cached_attributes_values = data
    value
  end

  def cached_attributes_values
    @cached_attributes_values ||= Cache.get(cached_attributes_cache_key) || {}
  end

  def cached_attributes_values=(data)
    Cache.set(cached_attributes_cache_key, data)
    @cached_attributes_values = data
  end

  def cached_attributes_cache_key
    [
      @object.class.base_class.name,
      @object.id,
      (@object.updated_at || @object.created_at).to_i,
    ].compact.join('_')
  end
end
