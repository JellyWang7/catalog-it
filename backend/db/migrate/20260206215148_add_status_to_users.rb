class AddStatusToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :status, :string, default: 'active', null: false
    
    # Update existing users to be active
    reversible do |dir|
      dir.up do
        User.update_all(status: 'active')
      end
    end
  end
end
