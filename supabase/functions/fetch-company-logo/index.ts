// supabase/functions/fetch-company-logo/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompanyLogo {
  id: number
  domain: string
  logo_url: string
  created_at: string
}

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabaseClient = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  console.log('🚀 Starting function execution')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('👋 Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📥 Parsing request body')
    const body = await req.json()
    console.log('Request body:', body)
    const { domain, website, email } = body

    // Extract domain from website or email if not provided directly
    let targetDomain = domain
    if (!targetDomain) {
      if (website) {
        targetDomain = website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
      } else if (email) {
        targetDomain = email.split('@')[1]
      }
    }
    console.log('🎯 Target domain:', targetDomain)

    if (!targetDomain) {
      console.log('❌ No valid domain provided')
      return new Response(
        JSON.stringify({ error: 'No valid domain provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if we already have the logo in our database
    console.log('🔍 Checking for existing logo in database')
    const { data: existingLogo, error: existingLogoError } = await supabaseClient
      .from('company_logos')
      .select('*')
      .eq('domain', targetDomain)
      .single()

    if (existingLogoError) {
      console.log('⚠️ Error checking existing logo:', existingLogoError)
    }

    if (existingLogo) {
      console.log('✅ Found existing logo:', existingLogo)
      return new Response(
        JSON.stringify({ logo_url: existingLogo.logo_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try different logo services
    console.log('🔄 Trying different logo services')
    const services = [
      `https://logo.clearbit.com/${targetDomain}`,
      `https://www.google.com/s2/favicons?domain=${targetDomain}&sz=64`,
      `https://icons.duckduckgo.com/ip3/${targetDomain}.ico`
    ]

    let logoBuffer: ArrayBuffer | null = null
    let contentType: string | null = null
    let successfulService: string | null = null

    for (const serviceUrl of services) {
      console.log(`📡 Trying service: ${serviceUrl}`)
      try {
        const response = await fetch(serviceUrl)
        console.log(`Response status for ${serviceUrl}:`, response.status)
        if (response.ok) {
          logoBuffer = await response.arrayBuffer()
          contentType = response.headers.get('content-type')
          successfulService = serviceUrl
          console.log(`✅ Successfully fetched from ${serviceUrl}`)
          console.log('Content-Type:', contentType)
          break
        }
      } catch (error) {
        console.error(`❌ Error fetching from ${serviceUrl}:`, error)
        continue
      }
    }

    if (!logoBuffer || !contentType) {
      console.log('❌ No logo found from any service')
      return new Response(
        JSON.stringify({ error: 'No logo found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Upload the logo to Supabase Storage
    console.log('📤 Uploading logo to storage')
    const extension = contentType.split('/')[1] || 'png'
    const fileName = `${targetDomain.replace(/\./g, '_')}_${Date.now()}.${extension}`
    console.log('Generated filename:', fileName)

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('company-logos')
      .upload(fileName, logoBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      throw uploadError
    }
    console.log('✅ Upload successful:', uploadData)

    // Get the public URL for the uploaded file
    console.log('🔗 Getting public URL')
    const { data: { publicUrl } } = supabaseClient.storage
      .from('company-logos')
      .getPublicUrl(fileName)
    console.log('Public URL:', publicUrl)

    // Store the logo information in the database
    console.log('💾 Storing logo information in database')
    const { data: logoData, error: dbError } = await supabaseClient
      .from('company_logos')
      .insert([
        {
          domain: targetDomain,
          logo_url: publicUrl,
        },
      ])
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      throw dbError
    }
    console.log('✅ Logo data stored:', logoData)

    console.log('🎉 Function completed successfully')
    return new Response(
      JSON.stringify({
        logo_url: publicUrl,
        service_used: successfulService,
        content_type: contentType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})