# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_22_120000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "attachments", force: :cascade do |t|
    t.bigint "attachable_id", null: false
    t.string "attachable_type", null: false
    t.text "body"
    t.datetime "created_at", null: false
    t.string "kind", null: false
    t.string "mime_type"
    t.bigint "size_bytes"
    t.string "storage_key"
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "url"
    t.bigint "user_id", null: false
    t.index ["attachable_type", "attachable_id"], name: "index_attachments_on_attachable"
    t.index ["kind"], name: "index_attachments_on_kind"
    t.index ["user_id"], name: "index_attachments_on_user_id"
  end

  create_table "comments", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.bigint "list_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["list_id", "created_at"], name: "index_comments_on_list_id_and_created_at"
    t.index ["list_id"], name: "index_comments_on_list_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "item_likes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "item_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["item_id"], name: "index_item_likes_on_item_id"
    t.index ["user_id", "item_id"], name: "index_item_likes_on_user_id_and_item_id", unique: true
    t.index ["user_id"], name: "index_item_likes_on_user_id"
  end

  create_table "items", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.bigint "list_id", null: false
    t.string "name"
    t.text "notes"
    t.integer "rating"
    t.datetime "updated_at", null: false
    t.index ["list_id"], name: "index_items_on_list_id"
  end

  create_table "list_likes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "list_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["list_id"], name: "index_list_likes_on_list_id"
    t.index ["user_id", "list_id"], name: "index_list_likes_on_user_id_and_list_id", unique: true
    t.index ["user_id"], name: "index_list_likes_on_user_id"
  end

  create_table "lists", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "share_code"
    t.string "title"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "visibility", default: "private"
    t.index ["share_code"], name: "index_lists_on_share_code", unique: true
    t.index ["user_id"], name: "index_lists_on_user_id"
  end

  create_table "solid_cache_entries", force: :cascade do |t|
    t.integer "byte_size", null: false
    t.datetime "created_at", null: false
    t.binary "key", null: false
    t.bigint "key_hash", null: false
    t.binary "value", null: false
    t.index ["byte_size"], name: "index_solid_cache_entries_on_byte_size"
    t.index ["key_hash", "byte_size"], name: "index_solid_cache_entries_on_key_hash_and_byte_size"
    t.index ["key_hash"], name: "index_solid_cache_entries_on_key_hash", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.boolean "otp_required_for_login", default: false, null: false
    t.string "otp_secret"
    t.string "password_digest"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "user"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.string "username"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "attachments", "users"
  add_foreign_key "comments", "lists"
  add_foreign_key "comments", "users"
  add_foreign_key "item_likes", "items"
  add_foreign_key "item_likes", "users"
  add_foreign_key "items", "lists"
  add_foreign_key "list_likes", "lists"
  add_foreign_key "list_likes", "users"
  add_foreign_key "lists", "users"
end
