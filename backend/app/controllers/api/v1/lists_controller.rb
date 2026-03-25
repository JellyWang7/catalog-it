module Api
  module V1
    class ListsController < ApplicationController
      skip_before_action :authenticate_request
      before_action :authenticate_request_optional, only: [:index, :show, :shared]
      before_action :authenticate_request_required, only: [:create, :update, :destroy, :share, :analytics]
      before_action :set_list, only: [:show, :update, :destroy, :share]
      before_action :authorize_list_owner, only: [:update, :destroy, :share]
      before_action :authorize_shareable_visibility, only: [:share]
      SORT_OPTIONS = %w[newest oldest name_asc name_desc most_items most_liked].freeze
      
      # GET /api/v1/lists
      # Returns public lists if not authenticated, or user's own lists + public lists if authenticated
      def index
        lists = base_list_scope
        return if performed?
        lists = apply_search_filter(lists)
        lists = apply_visibility_filter(lists)
        lists = lists.includes(:user, :items, :list_likes, :comments, :attachments).to_a
        lists = sort_lists(lists)

        render json: lists.map { |list| serialize_list(list, include_comments: false) }
      end

      # GET /api/v1/lists/analytics
      # Returns dashboard analytics for the authenticated user's lists
      def analytics
        user_lists = current_user.lists
        list_ids = user_lists.ids

        item_scope = Item.where(list_id: list_ids)
        item_ids = item_scope.ids

        comments_by_list = Comment.where(list_id: list_ids).group(:list_id).count
        list_likes_by_list = ListLike.where(list_id: list_ids).group(:list_id).count
        item_likes_by_list = if item_ids.empty?
                               {}
                             else
                               Item.joins(:item_likes).where(list_id: list_ids).group(:list_id).count('item_likes.id')
                             end

        top_lists = user_lists.map do |list|
          comments_count = comments_by_list[list.id] || 0
          list_likes_count = list_likes_by_list[list.id] || 0
          item_likes_count = item_likes_by_list[list.id] || 0
          item_count = list.items.count

          {
            id: list.id,
            title: list.title,
            visibility: list.visibility,
            items_count: item_count,
            comments_count: comments_count,
            list_likes_count: list_likes_count,
            item_likes_count: item_likes_count,
            engagement_score: comments_count + list_likes_count + item_likes_count
          }
        end.sort_by { |entry| -entry[:engagement_score] }.first(5)

        render json: {
          total_lists: user_lists.count,
          public_lists: user_lists.where(visibility: 'public').count,
          total_items: item_scope.count,
          total_comments_received: Comment.where(list_id: list_ids).count,
          total_list_likes_received: ListLike.where(list_id: list_ids).count,
          total_item_likes_received: item_ids.empty? ? 0 : ItemLike.where(item_id: item_ids).count,
          top_lists: top_lists
        }
      end
      
      # GET /api/v1/lists/:id
      # Allow viewing if list is public OR user owns it
      def show
        if @list.visibility == 'private' && (!current_user || @list.user_id != current_user.id)
          render json: { error: 'Not authorized to view this list' }, status: :forbidden
          return
        end
        
        render json: serialize_list(@list)
      end
      
      # POST /api/v1/lists
      def create
        unless current_user
          render json: { error: 'Unauthorized' }, status: :unauthorized
          return
        end
        
        @list = current_user.lists.build(list_params)
        
        if @list.save
          render json: @list, status: :created
        else
          render json: { errors: @list.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # PATCH/PUT /api/v1/lists/:id
      def update
        if @list.update(list_params)
          render json: @list
        else
          render json: { errors: @list.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/lists/:id
      def destroy
        @list.destroy
        head :no_content
      end

      # POST /api/v1/lists/:id/share
      # Generate a share code for the list
      def share
        code = @list.share_code || @list.generate_share_code!
        render json: {
          share_code: code,
          share_url: "/s/#{code}"
        }, status: :ok
      end

      # GET /api/v1/lists/shared/:share_code
      # Look up a list by its share code (public access)
      def shared
        @list = List.find_by(share_code: params[:share_code])

        if @list.nil?
          render json: { error: 'Shared list not found' }, status: :not_found
          return
        end

        render json: serialize_list(@list)
      end
      
      private
      
      def set_list
        @list = List.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'List not found' }, status: :not_found
      end
      
      def authorize_list_owner
        unless current_user
          render json: { error: 'Unauthorized' }, status: :unauthorized
          return
        end
        
        unless @list.user_id == current_user.id
          render json: { error: 'Not authorized to modify this list' }, status: :forbidden
        end
      end

      def authorize_shareable_visibility
        return unless @list.visibility == 'private'

        render json: { error: 'Private lists cannot be shared' }, status: :forbidden
      end
      
      def list_params
        params.require(:list).permit(:title, :description, :visibility)
      end

      def truthy_param?(value)
        ActiveModel::Type::Boolean.new.cast(value)
      end

      def base_list_scope
        if truthy_param?(params[:owner_only])
          unless current_user
            render json: { error: 'Unauthorized' }, status: :unauthorized
            return List.none
          end
          List.where(user_id: current_user.id)
        elsif truthy_param?(params[:public_only])
          List.where(visibility: 'public')
        elsif current_user
          List.where(user_id: current_user.id).or(List.where(visibility: 'public'))
        else
          List.where(visibility: 'public')
        end
      end

      def apply_search_filter(scope)
        return scope unless params[:search].present?

        query = "%#{params[:search].strip}%"
        scope.where('lists.title ILIKE ? OR lists.description ILIKE ?', query, query)
      end

      def apply_visibility_filter(scope)
        return scope unless params[:visibility].present?

        visibility = params[:visibility]
        return scope if visibility == 'all'
        return scope unless %w[public private shared].include?(visibility)

        scope.where(visibility: visibility)
      end

      def sort_lists(lists)
        sort = SORT_OPTIONS.include?(params[:sort]) ? params[:sort] : 'newest'

        case sort
        when 'oldest'
          lists.sort_by(&:created_at)
        when 'name_asc'
          lists.sort_by { |list| list.title.to_s.downcase }
        when 'name_desc'
          lists.sort_by { |list| list.title.to_s.downcase }.reverse
        when 'most_items'
          lists.sort_by { |list| -list.items.size }
        when 'most_liked'
          lists.sort_by { |list| -list.list_likes.size }
        else
          lists.sort_by(&:created_at).reverse
        end
      end

      def serialize_list(list, include_comments: true)
        {
          id: list.id,
          title: list.title,
          description: list.description,
          visibility: list.visibility,
          share_code: list.share_code,
          user_id: list.user_id,
          created_at: list.created_at,
          updated_at: list.updated_at,
          likes_count: list.likes_count,
          liked_by_current_user: list.liked_by?(current_user),
          comments_count: list.comments.size,
          attachments: list.attachments.order(created_at: :desc).map { |attachment| serialize_attachment(attachment) },
          user: {
            id: list.user.id,
            username: list.user.username,
            email: list.user.email
          },
          items: list.items.order(created_at: :desc).map { |item| serialize_item(item) },
          comments: include_comments ? list.comments.includes(:user).order(created_at: :desc).map { |comment| serialize_comment(comment) } : []
        }
      end

      def serialize_item(item)
        {
          id: item.id,
          name: item.name,
          category: item.category,
          notes: item.notes,
          rating: item.rating,
          list_id: item.list_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          likes_count: item.likes_count,
          liked_by_current_user: item.liked_by?(current_user),
          attachments: item.attachments.order(created_at: :desc).map { |attachment| serialize_attachment(attachment) }
        }
      end

      def serialize_comment(comment)
        {
          id: comment.id,
          body: comment.body,
          user_id: comment.user_id,
          list_id: comment.list_id,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user: {
            id: comment.user.id,
            username: comment.user.username
          }
        }
      end

      def serialize_attachment(attachment)
        {
          id: attachment.id,
          kind: attachment.kind,
          title: attachment.title,
          body: attachment.body,
          url: if attachment.link?
                 attachment.url
               elsif attachment.note?
                 nil
               elsif attachment.asset.attached?
                 rails_blob_url_for_attachment(attachment.asset)
               else
                 nil
               end,
          mime_type: attachment.mime_type,
          size_bytes: attachment.size_bytes,
          created_at: attachment.created_at,
          updated_at: attachment.updated_at
        }
      end
    end
  end
end
