# TODO: move this behavior to ideo-translation gem
module Translatable
  extend ActiveSupport::Concern

  PREFIX = 'translated_'.freeze

  included do
    # `.translated_attribute_names` comes from globalize
    translated_attribute_names.each do |translated_attribute|
      base_attribute = translated_attribute.to_s.split(PREFIX).last
      # override translated fields:
      # e.g. the getter for 'content' will return `translated_content` if it exists
      define_method base_attribute do
        # if record is dirty, return the unpersisted change
        return send("#{base_attribute}_change").last if send("#{base_attribute}_changed?")

        send(translated_attribute).presence || send("#{base_attribute}_in_database")
      end
    end
  end
end
