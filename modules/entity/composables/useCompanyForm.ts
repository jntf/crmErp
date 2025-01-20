// useCompanyForm.ts
// useCompanyForm.ts
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { useToast } from '@/components/ui/toast/use-toast';
import { useRouter } from 'vue-router';
import { useCompanies } from './useCompanies';

const schema = yup.object().shape({
    name: yup.string().required('Le nom est requis'),
    status: yup.string().required('Le statut est requis'),
    domain: yup.string(),
    industry: yup.string(),
    email: yup.string().email('Email invalide'),
    phone: yup.string(),
    website: yup.string().url('URL invalide'),
    number_of_employees: yup.number().min(0),
    social_capital: yup.number().min(0),
    revenue: yup.number().min(0),
    fleet_size: yup.number().min(0),
    tax_number: yup.string(),
    vat_number: yup.string(),
    is_supplier: yup.boolean(),
    is_customer: yup.boolean(),
    address: yup.object({
        street_number: yup.string(),
        street_name: yup.string(),
        address_line2: yup.string(),
        postal_code: yup.string(),
        city: yup.string(),
        country_id: yup.string().required('Le pays est requis') // Changé en string
    })
});

export const useCompanyForm = () => {
    const router = useRouter();
    const { createCompany } = useCompanies();
    const { toast } = useToast();
    const isSubmitting = ref(false);
    const formPreFilled = ref(false);
    const rawApiData = ref(null);

    const initialValues = {
        name: '',
        status: 'active',
        domain: '',
        industry: '',
        email: '',
        phone: '',
        website: '',
        number_of_employees: 0,
        social_capital: 0,
        revenue: 0,
        fleet_size: 0,
        tax_number: '',
        vat_number: '',
        is_supplier: false,
        is_customer: false,
        address: {
            street_number: '',
            street_name: '',
            address_line2: '',
            postal_code: '',
            city: '',
            country_id: '1'
        }
    };

    const { handleSubmit, resetForm, setValues, values, errors, setFieldValue } = useForm({
        validationSchema: schema,
        initialValues
    });

    const handleCompanyData = async (apiData: any) => {
        console.log('Start');
        try {
            if (!apiData?.result) return;
            
            rawApiData.value = apiData;
            const { organization: org, contacts, web_infos, financials } = apiData.result;

            if (!org) return;

            const streetParts = org.address?.street?.split(' ') || ['', ''];
            const streetNumber = streetParts[0];
            const streetName = streetParts.slice(1).join(' ');

            // Déterminer le statut en fonction des données de l'API
            const companyStatus = org.status?.toLowerCase() === 'actif' ? 'active' : 'inactive';

            // Déterminer le pays (France = 75 par exemple, à adapter selon votre base de données)
            const countryId = org.address?.country_code === 'FR' ? '1' : '75';

            const formData = {
                name: org.name || '',
                domain: org.activity?.ape_code || '',
                industry: org.activity?.ape_name || '',
                status: org.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
                email: contacts?.email || '',
                website: web_infos?.website_url || '',
                number_of_employees: financials?.last_staff || 0,
                social_capital: parseFloat(org.capital) || 0,
                revenue: financials?.last_sales || 0,
                fleet_size: 0,
                tax_number: org.full_registration_number || '',
                vat_number: org.vat_number || '',
                phone: '',
                is_supplier: false,
                is_customer: false,
                address: {
                    street_number: streetNumber,
                    street_name: streetName,
                    address_line2: '',
                    postal_code: org.address?.postal_code || '',
                    city: org.address?.city || '',
                    country_id: String(1)
                }
            };

            // Mise à jour des champs un par un pour s'assurer de la réactivité
            for (const [key, value] of Object.entries(formData)) {
                if (typeof value === 'object') {
                    for (const [subKey, subValue] of Object.entries(value)) {
                        await setFieldValue(`${key}.${subKey}`,
                            subKey === 'country_id' ? String(subValue) : subValue
                        );;
                    }
                } else {
                    await setFieldValue(key, value);
                }
            }

            formPreFilled.value = true;

            toast({
                title: "Données récupérées",
                description: `Les informations ont été pré-remplies avec succès.`,
                duration: 5000,
            });

        } catch (error) {
            console.error('Erreur lors du pré-remplissage:', error);
            toast({
                title: "Erreur",
                description: "Impossible de pré-remplir le formulaire",
                variant: "destructive"
            });
        }
    };

    const onSubmit = handleSubmit(async (values) => {
        try {
            isSubmitting.value = true;
    
            // Préparation des données
            const companyData = {
                ...values,
                // Suppression des champs vides pour éviter les erreurs de conversion
                number_of_employees: values.number_of_employees || null,
                social_capital: values.social_capital || null,
                revenue: values.revenue || null,
                fleet_size: values.fleet_size || null,
                // Gestion de l'adresse
                address: values.address ? {
                    ...values.address,
                } : null
            };
    
            const result = await createCompany(companyData);
    
            // Si la création a réussi
            if (result.success) {
                toast({
                    title: "Succès",
                    description: "L'entreprise a été créée avec succès",
                    variant: "success"
                });
                router.push('/entity/companies');
                return;
            }
            
            // Si on arrive ici, c'est qu'il y a eu une erreur
            throw result;
    
        } catch (error: any) {
            console.error('Erreur lors de la création:', error);
            
            // Gestion des différents types d'erreurs
            switch (error.code) {
                case 'DUPLICATE_COMPANY':
                    toast({
                        title: "Entreprise existante",
                        description: error.message,
                        variant: "warning"
                    });
                    break;
    
                case 'VALIDATION_ERROR':
                    toast({
                        title: "Erreur de validation",
                        description: error.message,
                        variant: "destructive"
                    });
                    break;
    
                default:
                    toast({
                        title: "Erreur",
                        description: error.message || "Une erreur est survenue lors de la création de l'entreprise",
                        variant: "destructive"
                    });
            }
        } finally {
            isSubmitting.value = false;
        }
    });

    return {
        isSubmitting,
        formPreFilled,
        handleCompanyData,
        onSubmit,
        resetForm,
        values,
        errors,
        rawApiData,
        setFieldValue
    };
};