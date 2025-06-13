
import { NextRequest, NextResponse } from 'next/server';
import { queryProjectData } from '@/lib/ai/query-assistant';
import { withBusinessServer } from '@/lib/auth/with-business-server';

export async function POST(request: NextRequest) {
  try {
    const { business } = await withBusinessServer();
    
    const { question } = await request.json();
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }
    
    const answer = await queryProjectData(question, business.id);
    
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
