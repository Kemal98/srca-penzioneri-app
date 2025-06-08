import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, code } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabaseClient.auth.admin.sendRawEmail({
      to: email,
      subject: 'Verifikacijski kod za rezervaciju',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5C4033;">Verifikacijski kod za rezervaciju</h2>
          <p>Poštovani,</p>
          <p>Vaš verifikacijski kod za rezervaciju je:</p>
          <div style="background-color: #FFFDF5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #5C4033; border: 2px solid #ffd700; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p>Ovaj kod će isteći za 1 sat.</p>
          <p>Hvala vam na rezervaciji!</p>
          <p>Vaš Penzion Villa tim</p>
        </div>
      `,
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 