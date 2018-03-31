# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20180329211218) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "collection_cards", force: :cascade do |t|
    t.integer "order", null: false
    t.integer "width"
    t.integer "height"
    t.bigint "parent_id"
    t.bigint "collection_id"
    t.bigint "item_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "archived", default: false
    t.boolean "reference", default: false
    t.index ["collection_id"], name: "index_collection_cards_on_collection_id"
    t.index ["item_id"], name: "index_collection_cards_on_item_id"
    t.index ["parent_id"], name: "index_collection_cards_on_parent_id"
  end

  create_table "collections", force: :cascade do |t|
    t.string "name"
    t.string "type"
    t.bigint "organization_id"
    t.bigint "cloned_from_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "breadcrumb"
    t.boolean "archived", default: false
    t.index ["cloned_from_id"], name: "index_collections_on_cloned_from_id"
    t.index ["organization_id"], name: "index_collections_on_organization_id"
  end

  create_table "filestack_files", force: :cascade do |t|
    t.string "url"
    t.string "handle"
    t.string "filename"
    t.string "mimetype"
    t.integer "size"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "groups", force: :cascade do |t|
    t.string "name"
    t.bigint "organization_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "handle"
    t.integer "filestack_file_id"
    t.index ["handle"], name: "index_groups_on_handle"
    t.index ["organization_id"], name: "index_groups_on_organization_id"
  end

  create_table "groups_roles", force: :cascade do |t|
    t.bigint "group_id"
    t.bigint "role_id"
    t.index ["group_id", "role_id"], name: "index_groups_roles_on_group_id_and_role_id", unique: true
    t.index ["group_id"], name: "index_groups_roles_on_group_id"
    t.index ["role_id"], name: "index_groups_roles_on_role_id"
  end

  create_table "items", force: :cascade do |t|
    t.string "name"
    t.string "type"
    t.string "image"
    t.text "content"
    t.bigint "cloned_from_id"
    t.boolean "archived", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "breadcrumb"
    t.integer "filestack_file_id"
    t.string "url"
    t.jsonb "text_data"
    t.string "thumbnail_url"
    t.index ["cloned_from_id"], name: "index_items_on_cloned_from_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "primary_group_id"
    t.string "handle"
    t.integer "filestack_file_id"
    t.index ["handle"], name: "index_organizations_on_handle"
  end

  create_table "roles", force: :cascade do |t|
    t.string "name"
    t.string "resource_type"
    t.bigint "resource_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "resource_identifier"
    t.index ["name", "resource_type", "resource_id"], name: "index_roles_on_name_and_resource_type_and_resource_id"
    t.index ["resource_identifier"], name: "index_roles_on_resource_identifier"
    t.index ["resource_type", "resource_id"], name: "index_roles_on_resource_type_and_resource_id"
  end

  create_table "taggings", id: :serial, force: :cascade do |t|
    t.integer "tag_id"
    t.string "taggable_type"
    t.integer "taggable_id"
    t.string "tagger_type"
    t.integer "tagger_id"
    t.string "context", limit: 128
    t.datetime "created_at"
    t.index ["context"], name: "index_taggings_on_context"
    t.index ["tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type"], name: "taggings_idx", unique: true
    t.index ["tag_id"], name: "index_taggings_on_tag_id"
    t.index ["taggable_id", "taggable_type", "context"], name: "index_taggings_on_taggable_id_and_taggable_type_and_context"
    t.index ["taggable_id", "taggable_type", "tagger_id", "context"], name: "taggings_idy"
    t.index ["taggable_id"], name: "index_taggings_on_taggable_id"
    t.index ["taggable_type"], name: "index_taggings_on_taggable_type"
    t.index ["tagger_id", "tagger_type"], name: "index_taggings_on_tagger_id_and_tagger_type"
    t.index ["tagger_id"], name: "index_taggings_on_tagger_id"
  end

  create_table "tags", id: :serial, force: :cascade do |t|
    t.string "name"
    t.integer "taggings_count", default: 0
    t.index ["name"], name: "index_tags_on_name", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "first_name"
    t.string "last_name"
    t.string "pic_url_square"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.inet "current_sign_in_ip"
    t.inet "last_sign_in_ip"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "provider"
    t.string "uid"
    t.integer "current_organization_id"
    t.integer "status", default: 0
    t.string "invitation_token"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["invitation_token"], name: "index_users_on_invitation_token"
    t.index ["provider"], name: "index_users_on_provider"
    t.index ["uid"], name: "index_users_on_uid"
  end

  create_table "users_roles", id: :serial, force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "role_id"
    t.index ["role_id"], name: "index_users_roles_on_role_id"
    t.index ["user_id", "role_id"], name: "index_users_roles_on_user_id_and_role_id", unique: true
    t.index ["user_id"], name: "index_users_roles_on_user_id"
  end

  add_foreign_key "collections", "organizations"
end
