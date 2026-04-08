# Solid Cache is enabled in production (config.cache_store = :solid_cache_store).
# Rack::Attack uses Rails.cache for throttles; without this table, signup and other
# API requests can raise PG::UndefinedTable and return 500.
# db/cache_schema.rb alone is not applied by db:migrate on the primary DB.
class CreateSolidCacheEntries < ActiveRecord::Migration[8.1]
  def change
    create_table :solid_cache_entries do |t|
      t.binary :key, limit: 1024, null: false
      t.binary :value, limit: 536_870_912, null: false
      t.datetime :created_at, null: false
      t.integer :key_hash, limit: 8, null: false
      t.integer :byte_size, limit: 4, null: false
    end

    add_index :solid_cache_entries, :byte_size, name: "index_solid_cache_entries_on_byte_size"
    add_index :solid_cache_entries, %i[key_hash byte_size],
              name: "index_solid_cache_entries_on_key_hash_and_byte_size"
    add_index :solid_cache_entries, :key_hash, unique: true, name: "index_solid_cache_entries_on_key_hash"
  end
end
