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

ActiveRecord::Schema[8.1].define(version: 2026_02_20_024058) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

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

  add_foreign_key "items", "lists"
  add_foreign_key "lists", "users"
end
