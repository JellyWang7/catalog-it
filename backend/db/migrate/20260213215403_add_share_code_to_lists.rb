class AddShareCodeToLists < ActiveRecord::Migration[8.1]
  def change
    add_column :lists, :share_code, :string
    add_index :lists, :share_code, unique: true
  end
end
