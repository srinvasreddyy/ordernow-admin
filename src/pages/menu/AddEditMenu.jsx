import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2, Save, Image as ImageIcon, Layers, Tag, Box, Info } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// --- Zod Schemas ---
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
            const cats = data.categoryNames ? data.categoryNames.split(',').map(s => s.trim()).filter(Boolean) : [];
            formData.append('categoryNames', JSON.stringify(cats));
        } else if (['variantGroups', 'addonGroups'].includes(key)) {
            formData.append(key, JSON.stringify(data[key]));
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
        className={clsx(
            "flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all",
            activeTab === id 
            ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200' 
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        )}
    >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/menu')} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors shadow-sm">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-dark">{isEditMode ? 'Edit Menu Item' : 'New Menu Item'}</h1>
                <p className="text-sm text-secondary">Fill in the details to add a product to your catalog.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tabs */}
            <div className="bg-gray-100/80 p-1.5 rounded-xl inline-flex gap-1">
                <TabButton id="basic" label="Basic Details" icon={Box} />
                <TabButton id="variants" label="Variants & Sizes" icon={Layers} />
                <TabButton id="addons" label="Add-ons & Extras" icon={Tag} />
            </div>

            {/* Basic Info Tab */}
            <div className={clsx(activeTab === 'basic' ? 'block' : 'hidden', "space-y-6")}>
                <div className="card-base p-8 space-y-6">
                    <h3 className="text-lg font-bold text-dark border-b border-gray-100 pb-4 mb-2">Product Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="input-label">Item Name</label>
                            <input {...register('itemName')} className="input-field" placeholder="e.g. Classic Cheese Burger" />
                            {errors.itemName && <span className="text-red-500 text-xs mt-1 block">{errors.itemName.message}</span>}
                        </div>
                        
                        <div className="col-span-2">
                            <label className="input-label">Description</label>
                            <textarea {...register('description')} rows={4} className="input-field resize-none" placeholder="A brief description of the dish..." />
                        </div>

                        <div>
                            <label className="input-label">Base Price (£)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                                <input {...register('basePrice')} type="number" step="0.01" className="input-field pl-8" placeholder="0.00" />
                            </div>
                            {errors.basePrice && <span className="text-red-500 text-xs mt-1 block">{errors.basePrice.message}</span>}
                        </div>

                        <div>
                            <label className="input-label">Dietary Type</label>
                            <select {...register('itemType')} className="input-field">
                                <option value="veg">Vegetarian</option>
                                <option value="non-veg">Non-Vegetarian</option>
                                <option value="egg">Contains Egg</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="input-label">Category Tags</label>
                            <input {...register('categoryNames')} className="input-field" placeholder="e.g. Burgers, Lunch, Spicy" />
                            <p className="text-xs text-secondary mt-1.5 flex items-center gap-1">
                                <Info className="w-3 h-3" /> Separate multiple categories with commas.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6 pt-2">
                        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-orange-50/30 transition-all flex-1">
                            <input {...register('isBestseller')} type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/25" />
                            <div>
                                <span className="block text-sm font-bold text-dark">Mark as Bestseller</span>
                                <span className="block text-xs text-secondary">Highlight this item on the menu</span>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-orange-50/30 transition-all flex-1">
                            <input {...register('isFood')} type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/25" disabled={user?.restaurantType === 'groceries'} />
                            <div>
                                <span className="block text-sm font-bold text-dark">Is Food Item?</span>
                                <span className="block text-xs text-secondary">Toggle off for non-food goods</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="card-base p-8">
                    <h3 className="text-lg font-bold text-dark border-b border-gray-100 pb-4 mb-6">Media</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="input-label mb-2">Display Image</label>
                            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all group">
                                <div className="p-4 bg-gray-100 rounded-full mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                                </div>
                                <span className="text-sm font-medium text-gray-600">Click to upload main image</span>
                                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                                <input type="file" id="displayImage" accept="image/*" className="hidden"/>
                            </label>
                        </div>
                        <div>
                            <label className="input-label mb-2">Gallery Images</label>
                            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all group">
                                <div className="p-4 bg-gray-100 rounded-full mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <Layers className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                                </div>
                                <span className="text-sm font-medium text-gray-600">Click to upload gallery</span>
                                <span className="text-xs text-gray-400 mt-1">Multiple files allowed</span>
                                <input type="file" id="galleryImages" multiple accept="image/*" className="hidden"/>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Variants Tab */}
            <div className={clsx(activeTab === 'variants' ? 'block' : 'hidden', "space-y-6")}>
                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">Use variants for item variations like Size (Small, Large) or Base (Thin Crust, Deep Dish).</p>
                    </div>
                </div>

                {variantGroups.map((group, index) => (
                    <div key={group.id} className="card-base overflow-visible">
                        <div className="card-header bg-gray-50/50">
                            <h4 className="font-bold text-dark">Variant Group {index + 1}</h4>
                            <button type="button" onClick={() => removeVariantGroup(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="input-label">Group Title</label>
                                <input {...register(`variantGroups.${index}.groupTitle`)} placeholder="e.g. Size" className="input-field" />
                            </div>
                            
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">Option Example</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="input-label text-xs">Name</label>
                                        <input placeholder="e.g. Small" {...register(`variantGroups.${index}.variants.0.variantName`)} className="input-field bg-white" />
                                    </div>
                                    <div>
                                        <label className="input-label text-xs">Extra Price (£)</label>
                                        <input type="number" placeholder="0.00" {...register(`variantGroups.${index}.variants.0.additionalPrice`)} className="input-field bg-white" />
                                    </div>
                                </div>
                                <p className="text-xs text-secondary mt-3">
                                    * You can add more options to this group after saving the item.
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                
                <button 
                    type="button" 
                    onClick={() => addVariantGroup({ groupTitle: "", variants: [{ variantName: "", additionalPrice: 0 }] })} 
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary hover:bg-orange-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" /> Add New Variant Group
                </button>
            </div>

            {/* Addons Tab */}
            <div className={clsx(activeTab === 'addons' ? 'block' : 'hidden', "space-y-6")}>
                <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-purple-800">Add-ons are for extra toppings, sides, or optional extras.</p>
                    </div>
                </div>

                {addonGroups.map((group, index) => (
                    <div key={group.id} className="card-base overflow-visible">
                        <div className="card-header bg-gray-50/50">
                            <h4 className="font-bold text-dark">Add-on Group {index + 1}</h4>
                            <button type="button" onClick={() => removeAddonGroup(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="input-label">Group Title</label>
                                    <input {...register(`addonGroups.${index}.groupTitle`)} placeholder="e.g. Extra Toppings" className="input-field" />
                                </div>
                                <div>
                                    <label className="input-label">Selection Requirement</label>
                                    <select {...register(`addonGroups.${index}.customizationBehavior`)} className="input-field">
                                        <option value="optional">Optional (Customer can skip)</option>
                                        <option value="compulsory">Compulsory (Must select)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">Option Example</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="input-label text-xs">Name</label>
                                        <input placeholder="e.g. Extra Cheese" {...register(`addonGroups.${index}.addons.0.optionTitle`)} className="input-field bg-white" />
                                    </div>
                                    <div>
                                        <label className="input-label text-xs">Price (£)</label>
                                        <input type="number" placeholder="0.00" {...register(`addonGroups.${index}.addons.0.price`)} className="input-field bg-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button 
                    type="button" 
                    onClick={() => addAddonGroup({ groupTitle: "", customizationBehavior: "optional", addons: [{ optionTitle: "", price: 0 }] })} 
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary hover:bg-orange-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" /> Add New Add-on Group
                </button>
            </div>

            {/* Floating Action Footer */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-30">
                <div className="bg-dark text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center border border-gray-800">
                    <div className="hidden sm:block pl-2">
                        <span className="text-sm text-gray-400">Status:</span>
                        <span className="ml-2 font-semibold text-green-400">Ready to Save</span>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button type="button" onClick={() => navigate('/menu')} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Saving...' : 'Save Item'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    </div>
  );
}