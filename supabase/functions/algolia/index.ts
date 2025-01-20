import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import algoliasearch from 'npm:algoliasearch@4.20.0';

const supabaseUrl = 'https://dzwlhpmkmnwzxaaeupqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6d2xocG1rbW53enhhYWV1cHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NDI4MDEsImV4cCI6MjA1MDUxODgwMX0.IPMxn4T6HnpME8lRdkT9ol9WcOG3JjlfxA9UxEGk6lc';
const supabase = createClient(supabaseUrl, supabaseKey);

const algoliaAppId = '66XBNAELBW';
const algoliaApiKey = '73aba9b28f7af248c57c2b047560c174';
const algoliaIndexName = 'vehicles';
const algoliaClient = algoliasearch(algoliaAppId, algoliaApiKey);
const algoliaIndex = algoliaClient.initIndex(algoliaIndexName);

serve(async (req) => {
  const { data, error } = await supabase
    .from('api_vehicles')
    .select('*')
    // .gte('updated_at', 'timestamp_of_last_sync');

  if (error) {
    return new Response(`Erreur lors de la récupération des données: ${error.message}`, { status: 500 });
  }

  if (data.length === 0) {
    return new Response('Aucune donnée à synchroniser.', { status: 200 });
  }

  const algoliaObjects = data.map((vehicle) => ({
    objectID: vehicle.id,
    ...vehicle,
  }));

  try {
    await algoliaIndex.saveObjects(algoliaObjects);
    return new Response('Synchronisation réussie.', { status: 200 });
  } catch (err) {
    return new Response(`Erreur lors de la synchronisation avec Algolia: ${err.message}`, { status: 500 });
  }
});