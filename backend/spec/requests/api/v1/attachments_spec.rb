require 'rails_helper'

RSpec.describe 'Api::V1::Attachments', type: :request do
  let(:owner) { create(:user) }
  let(:other_user) { create(:user) }
  let(:list) { create(:list, :public, user: owner) }
  let(:owner_token) { JsonWebToken.encode(user_id: owner.id) }
  let(:owner_headers) { { 'Authorization' => "Bearer #{owner_token}" } }
  let(:other_token) { JsonWebToken.encode(user_id: other_user.id) }
  let(:other_headers) { { 'Authorization' => "Bearer #{other_token}" } }

  describe 'GET /api/v1/lists/:list_id/attachments' do
    before do
      create(:attachment, user: owner, attachable: list, kind: 'link', title: 'Reference', url: 'https://example.com')
    end

    it 'returns attachments for public list without authentication' do
      get "/api/v1/lists/#{list.id}/attachments"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.size).to eq(1)
      expect(json.first['kind']).to eq('link')
      expect(json.first['title']).to eq('Reference')
    end
  end

  describe 'POST /api/v1/lists/:list_id/attachments' do
    it 'creates a link attachment for owner' do
      expect do
        post "/api/v1/lists/#{list.id}/attachments",
             params: {
               attachment: {
                 kind: 'link',
                 title: 'Project docs',
                 url: 'https://example.com/docs'
               }
             },
             headers: owner_headers,
             as: :json
      end.to change(Attachment, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['kind']).to eq('link')
      expect(json['url']).to eq('https://example.com/docs')
    end

    it 'forbids non-owner from creating attachments' do
      expect do
        post "/api/v1/lists/#{list.id}/attachments",
             params: { attachment: { kind: 'link', title: 'Hack', url: 'https://example.com' } },
             headers: other_headers,
             as: :json
      end.not_to change(Attachment, :count)

      expect(response).to have_http_status(:forbidden)
    end

    it 'creates a file attachment upload for owner' do
      file = fixture_file_upload('test_upload.txt', 'text/plain')

      expect do
        post "/api/v1/lists/#{list.id}/attachments",
             params: {
               attachment: {
                 kind: 'file',
                 title: 'Sample file',
                 asset: file
               }
             },
             headers: owner_headers
      end.to change(Attachment, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['kind']).to eq('file')
      expect(json['mime_type']).to eq('text/plain')
      expect(json['url']).to include('/rails/active_storage/blobs/')
    end

    it 'accepts zip file uploads for owner' do
      file = fixture_file_upload('sample.zip', 'application/zip')

      expect do
        post "/api/v1/lists/#{list.id}/attachments",
             params: {
               attachment: {
                 kind: 'file',
                 title: 'Archive',
                 asset: file
               }
             },
             headers: owner_headers
      end.to change(Attachment, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['kind']).to eq('file')
      expect(json['mime_type']).to eq('application/zip')
    end
  end

  describe 'DELETE /api/v1/attachments/:id' do
    let!(:attachment) do
      create(:attachment, user: owner, attachable: list, kind: 'link', title: 'Reference', url: 'https://example.com')
    end

    it 'allows owner to delete attachment' do
      expect do
        delete "/api/v1/attachments/#{attachment.id}", headers: owner_headers
      end.to change(Attachment, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it 'forbids non-owner from deleting attachment' do
      expect do
        delete "/api/v1/attachments/#{attachment.id}", headers: other_headers
      end.not_to change(Attachment, :count)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
