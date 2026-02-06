class CreateItems < ActiveRecord::Migration[8.1]
  def change
    create_table :items do |t|
      t.string :name
      t.string :category
      t.text :notes
      t.integer :rating
      t.references :list, null: false, foreign_key: true

      t.timestamps
    end
  end
end
