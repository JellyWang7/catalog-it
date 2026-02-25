require 'rails_helper'

RSpec.describe "Api::V1::Likes", type: :request do
  let(:user) { create(:user) }
  let(:token) { JsonWebToken.encode(user_id: user.id) }
  let(:auth_headers) { { 'Authorization' => "Bearer #{token}" } }
  let(:list) { create(:list, :public) }
  let(:item) { create(:item, list: list) }

  describe "list likes" do
    it "creates list like" do
      expect do
        post "/api/v1/lists/#{list.id}/like", headers: auth_headers
      end.to change(ListLike, :count).by(1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['liked_by_current_user']).to eq(true)
      expect(json['likes_count']).to eq(1)
    end

    it "removes list like" do
      create(:list_like, list: list, user: user)

      expect do
        delete "/api/v1/lists/#{list.id}/like", headers: auth_headers
      end.to change(ListLike, :count).by(-1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['liked_by_current_user']).to eq(false)
      expect(json['likes_count']).to eq(0)
    end

    it "forbids list owner from liking own list" do
      owned_list = create(:list, :public, user: user)

      expect do
        post "/api/v1/lists/#{owned_list.id}/like", headers: auth_headers
      end.not_to change(ListLike, :count)

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']).to eq('List owners cannot like their own lists')
    end
  end

  describe "item likes" do
    it "creates item like" do
      expect do
        post "/api/v1/items/#{item.id}/like", headers: auth_headers
      end.to change(ItemLike, :count).by(1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['liked_by_current_user']).to eq(true)
      expect(json['likes_count']).to eq(1)
    end

    it "removes item like" do
      create(:item_like, item: item, user: user)

      expect do
        delete "/api/v1/items/#{item.id}/like", headers: auth_headers
      end.to change(ItemLike, :count).by(-1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['liked_by_current_user']).to eq(false)
      expect(json['likes_count']).to eq(0)
    end
  end
end
