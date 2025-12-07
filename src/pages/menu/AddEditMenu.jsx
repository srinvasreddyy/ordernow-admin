import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2, Save, Image as ImageIcon } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// --- Zod Schema ---
const variantSchema = z.object({
  variantName: z.string().min(1, "Name required"),
  additionalPrice: z.coerce.number().min(0)
});

const variantGroupSchema = z.object({
  groupTitle: z.string().min(1, "Group Title required"),
  variants: z.array(variantSchema).min(1, "At least one variant required")
});

const addonSchema = z.object({
  optionTitle: z.string().min(1, "Option title required"),
  price: z.coerce.number().min(0)
});

const addonGroupSchema = z.object({
  groupTitle: z.string().min(1, "Title required"),
  customizationBehavior: z.enum(['compulsory', 'optional']),
  minSelection: z.coerce.number().min(0).default(0),
  maxSelection: z.coerce.number().optional(),
  addons: z.array(addonSchema).min(1, "At least one addon option required")
});

const menuSchema = z.object({
  itemName: z.string().min(1, "Item Name is required"),
  description: z.string().optional(),
  isFood: z.boolean(), // Will be string 'true'/'false' in form but parsed manually if needed
  itemType: z.enum(['veg', 'non-veg', 'egg']),
  basePrice: z.coerce.number().min(0, "Price must be positive"),
  categoryNames: z.string().optional(), // Comma separated string for UI
  packageType: z.string().optional(),
  isBestseller: z.boolean().optional(),
  
  // Dynamic Arrays
  variantGroups: z.array(variantGroupSchema).optional(),
  addonGroups: z.array(addonGroupSchema).optional(),
});

export default function AddEditMenu() {
  const { id } = useParams(); // If ID exists, we are in Edit mode
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('basic'); // basic, variants, addons

  // Default values
  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      isFood: true,
      itemType: 'veg',
      isBestseller: false,
      variantGroups: [],
      addonGroups: []
    }
  });

  // Dynamic Fields
  const { fields: variantGroups, append: addVariantGroup, remove: removeVariantGroup } = useFieldArray({
    control,
    name: "variantGroups"
  });

  const { fields: addonGroups, append: addAddonGroup, remove: removeAddonGroup } = useFieldArray({
    control,
    name: "addonGroups"
  });

  // Watch restaurant type to enforce rules
  const restaurantType = user?.restaurantType;
  useEffect(() => {
      if (restaurantType === 'groceries') {
          setValue('isFood', false);
      }
  }, [restaurantType, setValue]);

  // Fetch Item for Edit Mode
  useQuery({
    queryKey: ['menuItem', id],
    queryFn: async () => {
        const { data } = await api.get(`/menuItems/${id}`);
        return data.data;
    },
    enabled: isEditMode,
    onSuccess: (data) => {
        // Transform data for form
        reset({
            ...data,
            categoryNames: data.categories?.map(c => c.categoryName).join(', '),
            // Ensure arrays are initialized
            variantGroups: data.variantGroups || [],
            addonGroups: data.addonGroups || []
        });
    }
  });

  const mutation = useMutation({
    mutationFn: async (formData) => {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        if (isEditMode) {
            await api.put(`/menuItems/${id}`, formData, config);
        } else {
            await api.post('/menuItems', formData, config);
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['menuItems']);
        toast.success(`Item ${isEditMode ? 'updated' : 'created'} successfully!`);
        navigate('/menu');
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || "Operation failed");
    }
  });

  const onSubmit = async (data) => {
    const formData = new FormData();
    
    // Append simple fields
    formData.append('itemName', data.itemName);
    formData.append('description', data.description || '');
    formData.append('isFood', data.isFood);
    formData.append('itemType', data.itemType);
    formData.append('basePrice', data.basePrice);
    formData.append('packageType', data.packageType || '');
    formData.append('isBestseller', data.isBestseller);

    // Process Categories (Split string into array)
    if (data.categoryNames) {
        const cats = data.categoryNames.split(',').map(s => s.trim()).filter(Boolean);
        formData.append('categoryNames', JSON.stringify(cats));
    }

    // Process Complex Arrays
    formData.append('variantGroups', JSON.stringify(data.variantGroups));
    formData.append('addonGroups', JSON.stringify(data.addonGroups));

    // Files (Uncontrolled)
    const displayImageInput = document.getElementById('displayImage');
    if (displayImageInput?.files[0]) {
        formData.append('displayImage', displayImageInput.files[0]);
    }
    
    const galleryInput = document.getElementById('galleryImages');
    if (galleryInput?.files?.length) {
        for (let i = 0; i < galleryInput.files.length; i++) {
            formData.append('galleryImages', galleryInput.files[i]);
        }
    }

    mutation.mutate(formData);
  };

  // Helper Component for Tabs
  const TabButton = ({ id, label }) => (
    <button
        type="button"
        onClick={() => setActiveTab(id)}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === id 
            ? 'bg-indigo-100 text-indigo-700' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
    >
        {label}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/menu')} className="p-2 hover:bg-gray-200 rounded-full">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Menu Item' : 'Add Menu Item'}</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2 mb-6">
                <TabButton id="basic" label="Basic Info" />
                <TabButton id="variants" label="Variants" />
                <TabButton id="addons" label="Add-ons" />
            </div>

            {/* Basic Info Tab */}
            <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                            <input {...register('itemName')} type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            {errors.itemName && <span className="text-red-500 text-xs">{errors.itemName.message}</span>}
                        </div>
                        
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea {...register('description')} rows={3} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (£)</label>
                            <input {...register('basePrice')} type="number" step="0.01" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            {errors.basePrice && <span className="text-red-500 text-xs">{errors.basePrice.message}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                            <select {...register('itemType')} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="veg">Veg</option>
                                <option value="non-veg">Non-Veg</option>
                                <option value="egg">Egg</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categories (Comma separated)</label>
                            <input {...register('categoryNames')} type="text" placeholder="e.g. Starters, spicy, New" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            <p className="text-xs text-gray-400 mt-1">We will automatically tag existing categories or create new ones.</p>
                        </div>

                        <div className="flex items-center gap-6 pt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input {...register('isBestseller')} type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm font-medium text-gray-700">Mark as Bestseller</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input {...register('isFood')} type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" disabled={restaurantType === 'groceries'} />
                                <span className="text-sm font-medium text-gray-700">Is Food Item?</span>
                            </label>
                        </div>
                    </div>

                    {/* Images Section */}
                    <div className="border-t border-gray-100 pt-6 mt-6">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Media</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Display Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                                    <input type="file" id="displayImage" accept="image/*" className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                                    <input type="file" id="galleryImages" multiple accept="image/*" className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Variants Tab (Nested Field Array) */}
            <div className={activeTab === 'variants' ? 'block' : 'hidden'}>
                <div className="space-y-4">
                    {variantGroups.map((group, index) => (
                        <div key={group.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 mr-4">
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Group Title</label>
                                    <input {...register(`variantGroups.${index}.groupTitle`)} placeholder="e.g. Size" className="mt-1 w-full border-gray-300 rounded-md shadow-sm sm:text-sm" />
                                </div>
                                <button type="button" onClick={() => removeVariantGroup(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Nested Variants Logic would go here - simplified for this demo, usually requires a separate component to useFieldArray recursively or manual array management */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-2">Variants (JSON Editor for simplicity in this demo)</p>
                                {/* In a real robust app, create a sub-component for this. Here we assume the user adds at least one variant via JSON or similar if doing quick POC, but let's do a simple array mapping for the first level */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input placeholder="Variant Name (e.g. Small)" {...register(`variantGroups.${index}.variants.0.variantName`)} className="border-gray-300 rounded-md text-sm" />
                                        <input type="number" placeholder="Add. Price" {...register(`variantGroups.${index}.variants.0.additionalPrice`)} className="border-gray-300 rounded-md text-sm" />
                                    </div>
                                    <p className="text-xs text-orange-600">To add more variants to this group, save and edit later (Simplified).</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button type="button" onClick={() => addVariantGroup({ groupTitle: "", variants: [{ variantName: "", additionalPrice: 0 }] })} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add Variant Group
                    </button>
                </div>
            </div>

            {/* Addons Tab */}
            <div className={activeTab === 'addons' ? 'block' : 'hidden'}>
                <div className="space-y-4">
                    {addonGroups.map((group, index) => (
                        <div key={group.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="grid grid-cols-2 gap-4 flex-1 mr-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Group Title</label>
                                        <input {...register(`addonGroups.${index}.groupTitle`)} placeholder="e.g. Toppings" className="mt-1 w-full border-gray-300 rounded-md shadow-sm sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Type</label>
                                        <select {...register(`addonGroups.${index}.customizationBehavior`)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                                            <option value="optional">Optional</option>
                                            <option value="compulsory">Compulsory</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeAddonGroup(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-2">First Option (Simplified)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <input placeholder="Option Name (e.g. Cheese)" {...register(`addonGroups.${index}.addons.0.optionTitle`)} className="border-gray-300 rounded-md text-sm" />
                                    <input type="number" placeholder="Price" {...register(`addonGroups.${index}.addons.0.price`)} className="border-gray-300 rounded-md text-sm" />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => addAddonGroup({ groupTitle: "", customizationBehavior: "optional", addons: [{ optionTitle: "", price: 0 }] })} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add Add-on Group
                    </button>
                </div>
            </div>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10 sm:pl-72">
                <div className="max-w-5xl mx-auto flex justify-end">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm flex items-center gap-2 disabled:bg-gray-400"
                    >
                        <Save className="w-5 h-5" />
                        {isSubmitting ? 'Saving...' : 'Save Item'}
                    </button>
                </div>
            </div>
        </form>
    </div>
  );
}