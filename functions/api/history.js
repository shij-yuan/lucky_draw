/**
 * History API Endpoint
 * GET: Fetch history records
 * POST: Add new history record
 * DELETE: Clear all history
 */

export async function onRequest(context) {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // GET: Fetch history
    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT id, prize_name, prize_color, created_at FROM history ORDER BY created_at DESC LIMIT 50'
      ).all();
      
      return Response.json({ 
        success: true, 
        data: results 
      }, { headers: corsHeaders });
    }
    
    // POST: Add new record
    if (request.method === 'POST') {
      const { prize_name, prize_color } = await request.json();
      
      if (!prize_name) {
        return Response.json({ 
          success: false, 
          error: 'prize_name is required' 
        }, { status: 400, headers: corsHeaders });
      }
      
      await env.DB.prepare(
        'INSERT INTO history (prize_name, prize_color) VALUES (?, ?)'
      ).bind(prize_name, prize_color || null).run();
      
      return Response.json({ 
        success: true 
      }, { headers: corsHeaders });
    }
    
    // DELETE: Clear all history
    if (request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM history').run();
      
      return Response.json({ 
        success: true 
      }, { headers: corsHeaders });
    }
    
    return Response.json({ 
      success: false, 
      error: 'Method not allowed' 
    }, { status: 405, headers: corsHeaders });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500, headers: corsHeaders });
  }
}

