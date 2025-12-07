import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2, Save, Image as ImageIcon, Layers, Tag, Box } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ... (Keep existing Zod schemas same as before)
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
  isFood: z.boolean(),
  itemType: z.enum(['veg', 'non-veg', 'egg']),
  basePrice: z.coerce.number().min(0, "Price must be positive"),
  categoryNames: z.string().optional(),
  packageType: z.string().optional(),
  isBestseller: z.boolean().optional(),
  variantGroups: z.array(variantGroupSchema).optional(),
  addonGroups: z.array(addonGroupSchema).optional(),
});

export default function AddEditMenu() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');

  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(menuSchema),
    defaultValues: { isFood: true, itemType: 'veg', isBestseller: false, variantGroups: [], addonGroups: [] }
  });

  const { fields: variantGroups, append: addVariantGroup, remove: removeVariantGroup } = useFieldArray({ control, name: "variantGroups" });
  const { fields: addonGroups, append: addAddonGroup, remove: removeAddonGroup } = useFieldArray({ control, name: "addonGroups" });

  useEffect(() => {
      if (user?.restaurantType === 'groceries') setValue('isFood', false);
  }, [user?.restaurantType, setValue]);

  useQuery({
    queryKey: ['menuItem', id],
    queryFn: async () => {
        const { data } = await api.get(`/menuItems/${id}`);
        return data.data;
    },
    enabled: isEditMode,
    onSuccess: (data) => {
        reset({
            ...data,
            categoryNames: data.categories?.map(c => c.categoryName).join(', '),
            variantGroups: data.variantGroups || [],
            addonGroups: data.addonGroups || []
        });
    }
  });

  const mutation = useMutation({
    mutationFn: async (formData) => {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        isEditMode ? await api.put(`/menuItems/${id}`, formData, config) : await api.post('/menuItems', formData, config);
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['menuItems']);
        toast.success(`Item ${isEditMode ? 'updated' : 'created'} successfully!`);
        navigate('/menu');
    },
    onError: (err) => toast.error(err.response?.data?.message || "Operation failed")
  });

  const onSubmit = async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (key === 'categoryNames') {
            const cats = data.categoryNames.split(',').map(s => s.trim()).filter(Boolean);
            formData.append('categoryNames', JSON.stringify(cats));
        } else if (['variantGroups', 'addonGroups'].includes(key)) {
            formData.append(key, JSON.stringify(data[key]));
        } else if (key === 'isFood' || key === 'isBestseller') {
             formData.append(key, data[key]);
        } else {
             formData.append(key, data[key]);
        }
    });

    const displayImageInput = document.getElementById('displayImage');
    if (displayImageInput?.files[0]) formData.append('displayImage', displayImageInput.files[0]);
    
    const galleryInput = document.getElementById('galleryImages');
    if (galleryInput?.files?.length) {
        for (let i = 0; i < galleryInput.files.length; i++) formData.append('galleryImages', galleryInput.files[i]);
    }
    mutation.mutate(formData);
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
        type="button"
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
            activeTab === id 
            ? 'bg-primary text-white shadow-md shadow-primary/25' 
            : 'text-secondary hover:bg-white hover:text-dark'
        }`}
    >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto pb-24">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/menu')} className="p-2 hover:bg-gray-200 rounded-full text-secondary transition-colors">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-dark">{isEditMode ? 'Edit Menu Item' : 'Create New Item'}</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-gray-100/50 p-1.5 rounded-xl inline-flex gap-1 mb-4">
                <TabButton id="basic" label="Basic Info" icon={Box} />
                <TabButton id="variants" label="Variants" icon={Layers} />
                <TabButton id="addons" label="Add-ons" icon={Tag} />
            </div>

            <div className={activeTab === 'basic' ? 'block animate-fade-in' : 'hidden'}>
                <div className="card-base card-body space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="input-label">Item Name</label>
                            <input {...register('itemName')} type="text" className="input-field" placeholder="e.g. Chicken Burger" />
                            {errors.itemName && <span className="text-red-500 text-xs mt-1">{errors.itemName.message}</span>}
                        </div>
                        
                        <div className="col-span-2">
                            <label className="input-label">Description</label>
                            <textarea {...register('description')} rows={3} className="input-field" placeholder="Describe the dish..." />
                        </div>

                        <div>
                            <label className="input-label">Base Price (£)</label>
                            <input {...register('basePrice')} type="number" step="0.01" className="input-field" />
                            {errors.basePrice && <span className="text-red-500 text-xs mt-1">{errors.basePrice.message}</span>}
                        </div>

                        <div>
                            <label className="input-label">Item Type</label>
                            <select {...register('itemType')} className="input-field">
                                <option value="veg">Veg</option>
                                <option value="non-veg">Non-Veg</option>
                                <option value="egg">Egg</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="input-label">Categories</label>
                            <input {...register('categoryNames')} type="text" placeholder="e.g. Starters, Spicy, New" className="input-field" />
                            <p className="text-xs text-secondary mt-1">Separate tags with commas.</p>
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input {...register('isBestseller')} type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/25 cursor-pointer" />
                                <span className="text-sm font-medium text-dark group-hover:text-primary transition-colors">Mark as Bestseller</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input {...register('isFood')} type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/25 cursor-pointer" disabled={user?.restaurantType === 'groceries'} />
                                <span className="text-sm font-medium text-dark group-hover:text-primary transition-colors">Is Food Item?</span>
                            </label>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="font-bold text-dark mb-4 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Media</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="input-label mb-2 block">Display Image</label>
                                <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-all cursor-pointer block">
                                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-primary font-medium">Click to upload</span>
                                    <input type="file" id="displayImage" accept="image/*" className="hidden"/>
                                </label>
                            </div>
                            <div>
                                <label className="input-label mb-2 block">Gallery Images</label>
                                <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-all cursor-pointer block">
                                    <Layers className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-primary font-medium">Click to upload multiple</span>
                                    <input type="file" id="galleryImages" multiple accept="image/*" className="hidden"/>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Variants Tab */}
            <div className={activeTab === 'variants' ? 'block animate-fade-in' : 'hidden'}>
                <div className="space-y-4">
                    {variantGroups.map((group, index) => (
                        <div key={group.id} className="card-base p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 mr-4">
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-1 block">Group Title</label>
                                    <input {...register(`variantGroups.${index}.groupTitle`)} placeholder="e.g. Size" className="input-field" />
                                </div>
                                <button type="button" onClick={() => removeVariantGroup(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <p className="text-sm font-semibold text-dark mb-2">Options</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Name (e.g. Small)" {...register(`variantGroups.${index}.variants.0.variantName`)} className="input-field bg-white" />
                                    <input type="number" placeholder="Extra Price (£)" {...register(`variantGroups.${index}.variants.0.additionalPrice`)} className="input-field bg-white" />
                                </div>
                                <p className="text-xs text-orange-600 mt-2 font-medium">Note: Save first to edit detailed variants.</p>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => addVariantGroup({ groupTitle: "", variants: [{ variantName: "", additionalPrice: 0 }] })} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-secondary hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 font-medium">
                        <Plus className="w-5 h-5" /> Add Variant Group
                    </button>
                </div>
            </div>

            {/* Addons Tab */}
            <div className={activeTab === 'addons' ? 'block animate-fade-in' : 'hidden'}>
                <div className="space-y-4">
                    {addonGroups.map((group, index) => (
                        <div key={group.id} className="card-base p-6">
                            <div className="flex justify-between items-start mb-4 gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-1 block">Group Title</label>
                                    <input {...register(`addonGroups.${index}.groupTitle`)} placeholder="e.g. Extra Toppings" className="input-field" />
                                </div>
                                <div className="w-1/3">
                                    <label className="text-xs font-bold text-secondary uppercase tracking-wider mb-1 block">Type</label>
                                    <select {...register(`addonGroups.${index}.customizationBehavior`)} className="input-field">
                                        <option value="optional">Optional</option>
                                        <option value="compulsory">Compulsory</option>
                                    </select>
                                </div>
                                <button type="button" onClick={() => removeAddonGroup(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg mt-5">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Option Name (e.g. Cheese)" {...register(`addonGroups.${index}.addons.0.optionTitle`)} className="input-field bg-white" />
                                    <input type="number" placeholder="Price (£)" {...register(`addonGroups.${index}.addons.0.price`)} className="input-field bg-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => addAddonGroup({ groupTitle: "", customizationBehavior: "optional", addons: [{ optionTitle: "", price: 0 }] })} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-secondary hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 font-medium">
                        <Plus className="w-5 h-5" /> Add Add-on Group
                    </button>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 sm:pl-[280px]">
                <div className="max-w-5xl mx-auto flex justify-end">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="btn-primary w-full sm:w-auto shadow-xl"
                    >
                        <Save className="w-5 h-5" />
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </form>
    </div>
  );
}