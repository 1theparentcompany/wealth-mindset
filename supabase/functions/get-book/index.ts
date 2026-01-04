import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Edge Function: get-book
 * Purpose: Fetch book metadata and chapter list with Edge-level caching.
 */
serve(async (req) => {
    const url = new URL(req.url)
    const bookId = url.searchParams.get("id")

    if (!bookId) {
        return new Response(JSON.stringify({ error: "Book ID missing" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Optimization: Only fetch metadata for the book and its chapters (no content field)
    const { data, error } = await supabase
        .from("books")
        .select(`
      id, 
      title, 
      language, 
      original_book_id,
      chapters (
        id, 
        title, 
        chapter_number
      )
    `)
        .eq("id", bookId)
        .single()

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        })
    }

    return new Response(JSON.stringify(data), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            // 🔥 EDGE CACHE: 1 hour (3600s)
            "Cache-Control": "public, max-age=3600"
        }
    })
})
