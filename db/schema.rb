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

ActiveRecord::Schema.define(version: 20190220192800) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "pg_stat_statements"

  create_table "activities", force: :cascade do |t|
    t.bigint "actor_id"
    t.string "target_type"
    t.bigint "target_id"
    t.integer "action"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "organization_id"
    t.text "content"
    t.string "source_type"
    t.bigint "source_id"
    t.string "destination_type"
    t.bigint "destination_id"
    t.index ["actor_id"], name: "index_activities_on_actor_id"
    t.index ["created_at"], name: "index_activities_on_created_at"
    t.index ["destination_type", "destination_id"], name: "index_activities_on_destination_type_and_destination_id"
    t.index ["organization_id"], name: "index_activities_on_organization_id"
    t.index ["source_type", "source_id"], name: "index_activities_on_source_type_and_source_id"
    t.index ["target_type", "target_id"], name: "index_activities_on_target_type_and_target_id"
  end

  create_table "activity_subjects", force: :cascade do |t|
    t.bigint "activity_id"
    t.string "subject_type"
    t.bigint "subject_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["activity_id"], name: "index_activity_subjects_on_activity_id"
    t.index ["subject_type", "subject_id"], name: "index_activity_subjects_on_subject_type_and_subject_id"
  end

  create_table "api_tokens", force: :cascade do |t|
    t.text "token"
    t.bigint "application_id"
    t.bigint "organization_id"
    t.bigint "created_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["application_id", "organization_id"], name: "index_api_tokens_on_app_id_org_id"
    t.index ["token"], name: "index_api_tokens_on_token"
  end

  create_table "application_organizations", force: :cascade do |t|
    t.bigint "application_id"
    t.bigint "organization_id"
    t.bigint "root_collection_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["application_id", "organization_id"], name: "index_app_org_on_app_id_org_id", unique: true
  end

  create_table "applications", force: :cascade do |t|
    t.string "name"
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_applications_on_user_id"
  end

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
    t.string "type"
    t.boolean "pinned", default: false
    t.integer "templated_from_id"
    t.datetime "archived_at"
    t.string "archive_batch"
    t.boolean "image_contain", default: false
    t.boolean "is_cover", default: false
    t.datetime "unarchived_at"
    t.boolean "hidden", default: false
    t.integer "filter", default: 1
    t.index ["collection_id"], name: "index_collection_cards_on_collection_id"
    t.index ["item_id"], name: "index_collection_cards_on_item_id"
    t.index ["parent_id"], name: "index_collection_cards_on_parent_id"
    t.index ["templated_from_id"], name: "index_collection_cards_on_templated_from_id"
    t.index ["type"], name: "index_collection_cards_on_type"
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
    t.integer "created_by_id"
    t.jsonb "cached_attributes", default: {}
    t.integer "template_id"
    t.datetime "archived_at"
    t.string "archive_batch"
    t.boolean "master_template", default: false
    t.integer "submission_template_id"
    t.integer "submission_box_type"
    t.bigint "submission_box_id"
    t.integer "test_status"
    t.integer "processing_status"
    t.integer "question_item_id"
    t.bigint "test_collection_id"
    t.bigint "collection_to_test_id"
    t.datetime "unarchived_at"
    t.jsonb "cached_test_scores"
    t.bigint "roles_anchor_collection_id"
    t.boolean "hide_submissions", default: false
    t.boolean "shared_with_organization", default: false
    t.index ["breadcrumb"], name: "index_collections_on_breadcrumb", using: :gin
    t.index ["cached_test_scores"], name: "index_collections_on_cached_test_scores", using: :gin
    t.index ["cloned_from_id"], name: "index_collections_on_cloned_from_id"
    t.index ["created_at"], name: "index_collections_on_created_at"
    t.index ["organization_id"], name: "index_collections_on_organization_id"
    t.index ["roles_anchor_collection_id"], name: "index_collections_on_roles_anchor_collection_id"
    t.index ["submission_box_id"], name: "index_collections_on_submission_box_id"
    t.index ["submission_template_id"], name: "index_collections_on_submission_template_id"
    t.index ["template_id"], name: "index_collections_on_template_id"
    t.index ["test_status"], name: "index_collections_on_test_status"
    t.index ["type"], name: "index_collections_on_type"
  end

  create_table "comment_threads", force: :cascade do |t|
    t.integer "record_id"
    t.string "record_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "organization_id"
    t.index ["organization_id"], name: "index_comment_threads_on_organization_id"
    t.index ["record_id"], name: "index_comment_threads_on_record_id", unique: true
  end

  create_table "comments", force: :cascade do |t|
    t.integer "comment_thread_id"
    t.integer "author_id"
    t.text "message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "draftjs_data"
    t.index ["comment_thread_id"], name: "index_comments_on_comment_thread_id"
  end

  create_table "external_records", force: :cascade do |t|
    t.string "external_id"
    t.bigint "application_id"
    t.string "externalizable_type"
    t.bigint "externalizable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["application_id"], name: "index_external_records_on_application_id"
    t.index ["external_id", "application_id", "externalizable_type"], name: "index_uniq_external_id", unique: true
    t.index ["externalizable_type", "externalizable_id"], name: "index_on_externalizable"
  end

  create_table "filestack_files", force: :cascade do |t|
    t.string "url"
    t.string "handle"
    t.string "filename"
    t.string "mimetype"
    t.integer "size"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "docinfo"
  end

  create_table "friendly_id_slugs", force: :cascade do |t|
    t.string "slug", null: false
    t.integer "sluggable_id", null: false
    t.string "sluggable_type", limit: 50
    t.string "scope"
    t.datetime "created_at"
    t.index ["slug", "sluggable_type", "scope"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope", unique: true
    t.index ["slug", "sluggable_type"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type"
    t.index ["sluggable_id"], name: "index_friendly_id_slugs_on_sluggable_id"
    t.index ["sluggable_type"], name: "index_friendly_id_slugs_on_sluggable_type"
  end

  create_table "groups", force: :cascade do |t|
    t.string "name"
    t.bigint "organization_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "handle"
    t.integer "filestack_file_id"
    t.boolean "archived", default: false
    t.integer "current_shared_collection_id"
    t.datetime "archived_at"
    t.string "archive_batch"
    t.jsonb "autojoin_emails", default: []
    t.index ["autojoin_emails"], name: "index_groups_on_autojoin_emails", using: :gin
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

  create_table "groups_threads", force: :cascade do |t|
    t.bigint "group_id"
    t.bigint "comment_thread_id"
    t.datetime "created_at", null: false
    t.index ["group_id", "comment_thread_id"], name: "by_groups_comment_thread", unique: true
  end

  create_table "items", force: :cascade do |t|
    t.string "name"
    t.string "type"
    t.text "content"
    t.bigint "cloned_from_id"
    t.boolean "archived", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "breadcrumb"
    t.integer "filestack_file_id"
    t.string "url"
    t.jsonb "data_content"
    t.string "thumbnail_url"
    t.jsonb "cached_attributes", default: {}
    t.datetime "archived_at"
    t.string "archive_batch"
    t.string "icon_url"
    t.integer "question_type"
    t.string "data_source_type"
    t.bigint "data_source_id"
    t.datetime "unarchived_at"
    t.jsonb "data_settings"
    t.bigint "roles_anchor_collection_id"
    t.integer "report_type"
    t.index ["breadcrumb"], name: "index_items_on_breadcrumb", using: :gin
    t.index ["cloned_from_id"], name: "index_items_on_cloned_from_id"
    t.index ["created_at"], name: "index_items_on_created_at"
    t.index ["data_source_type", "data_source_id"], name: "index_items_on_data_source_type_and_data_source_id"
    t.index ["roles_anchor_collection_id"], name: "index_items_on_roles_anchor_collection_id"
    t.index ["type"], name: "index_items_on_type"
  end

  create_table "notifications", force: :cascade do |t|
    t.boolean "read", default: false
    t.bigint "activity_id"
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "combined_activities_ids", default: [], array: true
    t.index ["activity_id"], name: "index_notifications_on_activity_id"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "primary_group_id"
    t.integer "filestack_file_id"
    t.integer "guest_group_id"
    t.jsonb "domain_whitelist", default: []
    t.integer "admin_group_id"
    t.integer "template_collection_id"
    t.integer "profile_template_id"
    t.integer "profile_collection_id"
    t.string "slug"
    t.integer "getting_started_collection_id"
    t.string "network_subscription_id"
    t.integer "active_users_count", default: 0, null: false
    t.datetime "trial_ends_at"
    t.integer "trial_users_count", default: 0, null: false
    t.boolean "in_app_billing", default: true, null: false
    t.boolean "trial_users_count_exceeded_email_sent", default: false, null: false
    t.boolean "trial_expired_email_sent", default: false, null: false
    t.datetime "overdue_at"
    t.boolean "has_payment_method", default: false, null: false
    t.boolean "sent_high_charges_low_email", default: false, null: false
    t.boolean "sent_high_charges_middle_email", default: false, null: false
    t.boolean "sent_high_charges_high_email", default: false, null: false
    t.boolean "deactivated", default: false, null: false
    t.jsonb "autojoin_domains", default: []
    t.bigint "terms_text_item_id"
    t.index ["autojoin_domains"], name: "index_organizations_on_autojoin_domains", using: :gin
    t.index ["slug"], name: "index_organizations_on_slug", unique: true
  end

  create_table "question_answers", force: :cascade do |t|
    t.bigint "survey_response_id"
    t.bigint "question_id"
    t.text "answer_text"
    t.integer "answer_number"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "open_response_item_id"
    t.index ["question_id"], name: "index_question_answers_on_question_id"
    t.index ["survey_response_id"], name: "index_question_answers_on_survey_response_id"
  end

  create_table "roles", force: :cascade do |t|
    t.string "name"
    t.string "resource_type"
    t.bigint "resource_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "resource_identifier"
    t.index ["name", "resource_type", "resource_id"], name: "index_roles_on_name_and_resource_type_and_resource_id"
    t.index ["resource_identifier", "name"], name: "index_roles_on_resource_identifier_and_name", unique: true
    t.index ["resource_type", "resource_id"], name: "index_roles_on_resource_type_and_resource_id"
  end

  create_table "survey_responses", force: :cascade do |t|
    t.bigint "test_collection_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "session_uid"
    t.integer "status", default: 0
    t.bigint "user_id"
    t.index ["session_uid"], name: "index_survey_responses_on_session_uid", unique: true
    t.index ["test_collection_id"], name: "index_survey_responses_on_test_collection_id"
    t.index ["user_id"], name: "index_survey_responses_on_user_id"
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
    t.integer "current_user_collection_id"
    t.boolean "terms_accepted", default: false
    t.boolean "show_helper", default: true
    t.string "handle"
    t.boolean "notify_through_email", default: true
    t.jsonb "cached_attributes"
    t.jsonb "network_data", default: {}
    t.datetime "last_notification_mail_sent"
    t.boolean "show_move_helper", default: true
    t.boolean "show_template_helper", default: true
    t.boolean "mailing_list", default: false
    t.datetime "last_active_at"
    t.index ["email"], name: "index_users_on_email"
    t.index ["handle"], name: "index_users_on_handle", unique: true
    t.index ["invitation_token"], name: "index_users_on_invitation_token"
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
  end

  create_table "users_roles", id: :serial, force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "role_id"
    t.index ["role_id"], name: "index_users_roles_on_role_id"
    t.index ["user_id", "role_id"], name: "index_users_roles_on_user_id_and_role_id", unique: true
    t.index ["user_id"], name: "index_users_roles_on_user_id"
  end

  create_table "users_threads", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "comment_thread_id"
    t.datetime "last_viewed_at"
    t.datetime "created_at", null: false
    t.boolean "subscribed", default: true
    t.index ["user_id", "comment_thread_id"], name: "by_users_comment_thread", unique: true
  end

  add_foreign_key "collections", "organizations"
end
