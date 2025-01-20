import { ref } from 'vue';
import { useToast } from '@/components/ui/toast/use-toast';

interface Country {
  id: string;
  name: string;
}

interface RawCountry {
  id: number;
  name: string;
}

export const useCountries = () => {
  const countries = ref<Country[]>([]);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .order('name');

      if (error) throw error;
      countries.value = (data as RawCountry[]).map(country => ({
        id: String(country.id),
        name: country.name
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des pays:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des pays",
        variant: "destructive"
      });
    }
  };

  return {
    countries,
    loadCountries
  };
};