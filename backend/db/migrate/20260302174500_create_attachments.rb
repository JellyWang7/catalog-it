class CreateAttachments < ActiveRecord::Migration[8.1]
  def change
    create_table :attachments do |t|
      t.references :user, null: false, foreign_key: true
      t.references :attachable, polymorphic: true, null: false
      t.string :kind, null: false
      t.string :title, null: false
      t.string :url
      t.string :mime_type
      t.bigint :size_bytes
      t.string :storage_key

      t.timestamps
    end

    add_index :attachments, :kind
  end
end
