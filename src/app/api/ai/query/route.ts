
import { NextRequest, NextResponse } from 'next/server';
import { queryProjectData } from '@/lib/ai/query-assistant';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's business
    const supabase = createServerClient();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('business_id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData?.business_id) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 400 }
      );
    }
    
    const { question } = await request.json();
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }
    
    const answer = await queryProjectData(question, userData.business_id);
    
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
