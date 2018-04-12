# https://stackoverflow.com/a/31140850
# set up tags to "touch" the corresponding record with an updated_at
ActsAsTaggableOn::Tagging.belongs_to :taggable, polymorphic: true, touch: true
