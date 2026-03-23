import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-webhook-secret',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method Not Allowed', message: 'Only POST requests are allowed' },
      { 
        status: 405,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }

  try {
    // Validate webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    
    if (!expectedSecret || webhookSecret !== expectedSecret) {
      console.warn('Unauthorized webhook attempt');
      return Response.json(
        { error: 'Unauthorized', message: 'Invalid or missing webhook secret' },
        { 
          status: 401,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // Parse request body
    const payload = await req.json();
    
    // Log the webhook payload
    console.log('n8n webhook received:', JSON.stringify(payload, null, 2));

    // Return success response
    return Response.json(
      { ok: true },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    
    return Response.json({
      error: 'Internal Server Error',
      message: error.message,
    }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
});