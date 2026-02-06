module Api
  module V1
    class ItemsController < ApplicationController
      before_action :set_item, only: [:show, :update, :destroy]
      
      # GET /api/v1/lists/:list_id/items
      def index
        @items = Item.where(list_id: params[:list_id])
        render json: @items
      end
      
      # GET /api/v1/items/:id
      def show
        render json: @item
      end
      
      # POST /api/v1/lists/:list_id/items
      def create
        @item = Item.new(item_params)
        @item.list_id = params[:list_id]
        
        if @item.save
          render json: @item, status: :created
        else
          render json: @item.errors, status: :unprocessable_entity
        end
      end
      
      # PATCH/PUT /api/v1/items/:id
      def update
        if @item.update(item_params)
          render json: @item
        else
          render json: @item.errors, status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/items/:id
      def destroy
        @item.destroy
        head :no_content
      end
      
      private
      
      def set_item
        @item = Item.find(params[:id])
      end
      
      def item_params
        params.require(:item).permit(:name, :category, :notes, :rating, :list_id)
      end
    end
  end
end
