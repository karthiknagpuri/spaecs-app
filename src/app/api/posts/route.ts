import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { CreatePostInput, PostQueryParams } from '@/types/posts';

// GET /api/posts - List posts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const visibility = searchParams.get('visibility');
    const category = searchParams.get('category');
    const is_published = searchParams.get('is_published');
    const is_featured = searchParams.get('is_featured');
    const creator_id = searchParams.get('creator_id');
    const search = searchParams.get('search');
    const sort_by = searchParams.get('sort_by') || 'recent';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('posts')
      .select('*, membership_tiers(*)', { count: 'exact' });

    // Apply filters
    if (visibility) {
      query = query.eq('visibility', visibility);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (is_published !== null) {
      query = query.eq('is_published', is_published === 'true');
    }

    if (is_featured !== null) {
      query = query.eq('is_featured', is_featured === 'true');
    }

    if (creator_id) {
      query = query.eq('creator_id', creator_id);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sort_by) {
      case 'popular':
        query = query.order('like_count', { ascending: false });
        break;
      case 'trending':
        query = query.order('view_count', { ascending: false });
        break;
      case 'oldest':
        query = query.order('published_at', { ascending: true });
        break;
      case 'recent':
      default:
        query = query.order('published_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(from, to);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      page,
      limit,
      hasMore: count ? count > to + 1 : false
    });
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreatePostInput = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Insert post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        creator_id: user.id,
        title: body.title,
        content: body.content,
        post_type: body.post_type || 'text',
        media_url: body.media_url,
        thumbnail_url: body.thumbnail_url,
        visibility: body.visibility || 'public',
        required_tier_id: body.required_tier_id,
        category: body.category,
        tags: body.tags,
        is_featured: body.is_featured || false,
        scheduled_for: body.scheduled_for,
        is_published: body.is_published || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
