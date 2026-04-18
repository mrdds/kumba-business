
from typing import List, Optional
from ninja_extra import api_controller, route, ControllerBase
from ninja import Schema
from django.shortcuts import get_object_or_404
from ninja_jwt.authentication import JWTAuth
from kumba_id.auth import KumbaJWTAuth
from .models import Post, Like, Comment
from django.db.models import Count, F

class UserSchema(Schema):
    id: int
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    bio: Optional[str] = None

class PostSchema(Schema):
    id: int
    user: UserSchema
    content: str
    media_url: Optional[str] = None
    created_at: str
    likes_count: int
    comments_count: int
    is_liked: bool = False

class StorySchema(Schema):
    id: int
    user: UserSchema
    media_url: str
    created_at: str
    expires_at: Optional[str]
    is_viewed: bool = False

class CreateStorySchema(Schema):
    media_url: str

class ProfileSchema(Schema):
    user: UserSchema
    posts_count: int
    followers_count: int = 0
    following_count: int = 0
    posts: List[PostSchema]

class UpdateProfileSchema(Schema):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_image_url: Optional[str] = None

class CreatePostSchema(Schema):
    content: str
    media_url: Optional[str] = None

class CommentSchema(Schema):
    id: int
    user: UserSchema
    content: str
    created_at: str

class CreateCommentSchema(Schema):
    content: str

@api_controller('/social', tags=['Social'], auth=KumbaJWTAuth())
class SocialController(ControllerBase):
    
    # ... existing methods (get_feed, etc) ... 

    @route.get('/stories', response=List[StorySchema])
    def get_stories(self, request):
        # Return stories from followed users (or all for MVP)
        # Filter active stories (expires_at > now)
        # In MVP we grab all recent stories
        from .models import Story
        from django.utils import timezone
        now = timezone.now()
        stories = Story.objects.filter(expires_at__gt=now).select_related('user').order_by('-created_at')
        return [
            {
                "id": s.id,
                "user": s.user,
                "media_url": s.media_url,
                "created_at": str(s.created_at),
                "expires_at": str(s.expires_at),
                "is_viewed": False # Implement view logic later
            } for s in stories
        ]

    @route.post('/stories', response=StorySchema)
    def create_story(self, request, data: CreateStorySchema):
        from .models import Story
        from django.utils import timezone
        from datetime import timedelta
        
        expires_at = timezone.now() + timedelta(hours=24)
        story = Story.objects.create(
            user=request.user,
            media_url=data.media_url,
            expires_at=expires_at
        )
        return {
            "id": story.id,
            "user": story.user,
            "media_url": story.media_url,
            "created_at": str(story.created_at),
            "expires_at": str(story.expires_at),
            "is_viewed": False
        }

    @route.get('/profile/me', response=ProfileSchema)
    def get_my_profile(self, request):
        user = request.user
        posts = Post.objects.filter(user=user).select_related('user').order_by('-created_at')
        posts_data = []
        for p in posts:
             posts_data.append({
                "id": p.id,
                "user": p.user,
                "content": p.content,
                "media_url": p.media_url,
                "created_at": str(p.created_at),
                "likes_count": p.likes_count,
                "comments_count": p.comments_count,
                "is_liked": False # Optimization needed
            })

        return {
            "user": user,
            "posts_count": posts.count(),
            "followers_count": 0,
            "following_count": 0,
            "posts": posts_data
        }

    @route.get('/users/{user_id}/profile', response=ProfileSchema)
    def get_profile(self, request, user_id: int):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = get_object_or_404(User, id=user_id)
        
        posts = Post.objects.filter(user=user).select_related('user').order_by('-created_at')
        posts_data = []
        for p in posts:
             posts_data.append({
                "id": p.id,
                "user": p.user,
                "content": p.content,
                "media_url": p.media_url,
                "created_at": str(p.created_at),
                "likes_count": p.likes_count,
                "comments_count": p.comments_count,
                "is_liked": False # Optimization needed
            })

        return {
            "user": user,
            "posts_count": posts.count(),
            "followers_count": 0, # Implement Follow model later
            "following_count": 0,
            "posts": posts_data
        }
    
    @route.patch('/users/me', response=UserSchema)
    def update_profile(self, request, data: UpdateProfileSchema):
        user = request.user
        if data.bio is not None:
             user.bio = data.bio
        if data.avatar_url is not None:
             user.avatar_url = data.avatar_url
        if data.cover_image_url is not None:
             user.cover_image_url = data.cover_image_url
        user.save()
        return user

    @route.get('/feed', response=List[PostSchema])
    def get_feed(self, request):
        # Basic feed: all posts ordered by date
        # Optimize: select_related user 
        posts = Post.objects.select_related('user').order_by('-created_at')
        
        results = []
        liked_post_ids = set(Like.objects.filter(user=request.user, post__in=posts).values_list('post_id', flat=True))

        for p in posts:
            results.append({
                "id": p.id,
                "user": p.user,
                "content": p.content,
                "media_url": p.media_url,
                "created_at": str(p.created_at),
                "likes_count": p.likes_count,
                "comments_count": p.comments_count,
                "is_liked": p.id in liked_post_ids
            })
        return results

    @route.post('/posts', response=PostSchema)
    def create_post(self, request, data: CreatePostSchema):
        post = Post.objects.create(
            user=request.user,
            content=data.content,
            media_url=data.media_url
        )
        return {
            "id": post.id,
            "user": post.user,
            "content": post.content,
            "media_url": post.media_url,
            "created_at": str(post.created_at),
            "likes_count": 0,
            "comments_count": 0,
            "is_liked": False
        }

    @route.post('/posts/{post_id}/like')
    def like_post(self, request, post_id: int):
        post = get_object_or_404(Post, id=post_id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        
        if created:
            Post.objects.filter(id=post_id).update(likes_count=F('likes_count') + 1)
            return {"success": True, "action": "liked"}
        else:
            like.delete()
            Post.objects.filter(id=post_id).update(likes_count=F('likes_count') - 1)
            return {"success": True, "action": "unliked"}

    @route.get('/posts/{post_id}/comments', response=List[CommentSchema])
    def get_comments(self, request, post_id: int):
        comments = Comment.objects.filter(post_id=post_id).select_related('user').order_by('created_at')
        return [
            {
                "id": c.id,
                "user": c.user,
                "content": c.content,
                "created_at": str(c.created_at)
            } for c in comments
        ]

    @route.post('/posts/{post_id}/comments', response=CommentSchema)
    def add_comment(self, request, post_id: int, data: CreateCommentSchema):
        post = get_object_or_404(Post, id=post_id)
        comment = Comment.objects.create(
            user=request.user,
            post=post,
            content=data.content
        )
        Post.objects.filter(id=post_id).update(comments_count=F('comments_count') + 1)
        
        return {
            "id": comment.id,
            "user": comment.user,
            "content": comment.content,
            "created_at": str(comment.created_at)
        }
