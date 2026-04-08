class AddBodyToAttachmentsNullableTitle < ActiveRecord::Migration[8.1]
  def change
    change_column_null :attachments, :title, true
    add_column :attachments, :body, :text
  end
end
