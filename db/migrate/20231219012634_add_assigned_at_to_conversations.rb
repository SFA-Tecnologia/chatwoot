class AddAssignedAtToConversations < ActiveRecord::Migration[7.0]
  def change
    add_column :conversations, :assigned_at, :date
  end
end
