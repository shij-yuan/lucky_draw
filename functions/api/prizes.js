/**
 * Prizes API Endpoint
 * GET: Fetch all prizes
 * POST: Update prizes (replace all)
 * PUT: Reset to default prizes
 */

const DEFAULT_PRIZES = [
  { name: '一等奖', sort_order: 1 },
  { name: '二等奖', sort_order: 2 },
  { name: '三等奖', sort_order: 3 },
  { name: '幸运奖', sort_order: 4 },
  { name: '参与奖', sort_order: 5 },
  { name: '再来一次', sort_order: 6 },
];

export async function onRequest(context) {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // GET: Fetch all prizes
    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT id, name, sort_order FROM prizes ORDER BY sort_order ASC'
      ).all();
      
      // If no prizes exist, return defaults
      if (results.length === 0) {
        return Response.json({ 
          success: true, 
          data: DEFAULT_PRIZES.map((p, i) => ({ id: i + 1, ...p }))
        }, { headers: corsHeaders });
      }
      
      return Response.json({ 
        success: true, 
        data: results 
      }, { headers: corsHeaders });
    }
    
    // POST: Update prizes (replace all)
    if (request.method === 'POST') {
      const { prizes } = await request.json();
      
      if (!Array.isArray(prizes) || prizes.length < 2) {
        return Response.json({ 
          success: false, 
          error: 'At least 2 prizes are required' 
        }, { status: 400, headers: corsHeaders });
      }
      
      // Delete all existing prizes
      await env.DB.prepare('DELETE FROM prizes').run();
      
      // Insert new prizes
      const stmt = env.DB.prepare(
        'INSERT INTO prizes (name, sort_order) VALUES (?, ?)'
      );
      
      for (let i = 0; i < prizes.length; i++) {
        await stmt.bind(prizes[i].name, i + 1).run();
      }
      
      return Response.json({ 
        success: true 
      }, { headers: corsHeaders });
    }
    
    // PUT: Reset to default prizes
    if (request.method === 'PUT') {
      // Delete all existing prizes
      await env.DB.prepare('DELETE FROM prizes').run();
      
      // Insert default prizes
      const stmt = env.DB.prepare(
        'INSERT INTO prizes (name, sort_order) VALUES (?, ?)'
      );
      
      for (const prize of DEFAULT_PRIZES) {
        await stmt.bind(prize.name, prize.sort_order).run();
      }
      
      return Response.json({ 
        success: true,
        data: DEFAULT_PRIZES.map((p, i) => ({ id: i + 1, ...p }))
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

