import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// --- Zod Schema ---
const timeSlotSchema = z.object({
  day: z.string(),
  isOpen: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});

const registerSchema = z.object({
  restaurantName: z.string().min(1, "Restaurant Name is required"),
  ownerFullName: z.string().min(1, "Owner Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 chars"),
  phoneNumber: z.string().min(10, "Valid phone number required"), // Add UK regex if needed
  restaurantType: z.enum(['food_delivery_and_dining', 'groceries', 'food_delivery']),
  
  // Address
  shopNo: z.string(),
  floor: z.string().optional(),
  area: z.string(),
  city: z.string(),
  landmark: z.string().optional(),
  longitude: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a number"),
  latitude: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a number"),

  // Financials
  handlingChargesPercentage: z.string().transform(val => parseFloat(val)),
  stripeSecretKey: z.string().startsWith('sk_', "Must start with sk_"),

  // Delivery
  freeDeliveryRadius: z.string().transform(val => parseFloat(val)),
  chargePerMile: z.string().transform(val => parseFloat(val)),
  maxDeliveryRadius: z.string().transform(val => parseFloat(val)),

  // Timings - Pre-filled in default values
  timings: z.array(timeSlotSchema),
  
  // Document data fields
  businessLicenseNumber: z.string(),
  foodHygieneCertificateNumber: z.string(),
  vatNumber: z.string(),
  beneficiaryName: z.string(),
  sortCode: z.string(),
  accountNumber: z.string(),
  bankAddress: z.string(),
});

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Register() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      timings: DAYS.map(day => ({ day, isOpen: true, openTime: "09:00", closeTime: "22:00" }))
    }
  });

  const { fields: timingFields } = useFieldArray({
    control,
    name: "timings"
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // 1. Append Simple Fields
      formData.append('restaurantName', data.restaurantName);
      formData.append('ownerFullName', data.ownerFullName);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('restaurantType', data.restaurantType);
      formData.append('handlingChargesPercentage', data.handlingChargesPercentage);
      formData.append('stripeSecretKey', data.stripeSecretKey);
      
      // 2. Append Nested JSON Fields
      const addressObj = {
        shopNo: data.shopNo,
        floor: data.floor,
        area: data.area,
        city: data.city,
        landmark: data.landmark,
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)] // [Lon, Lat]
        }
      };
      formData.append('address', JSON.stringify(addressObj));

      const deliverySettingsObj = {
        freeDeliveryRadius: data.freeDeliveryRadius,
        chargePerMile: data.chargePerMile,
        maxDeliveryRadius: data.maxDeliveryRadius
      };
      formData.append('deliverySettings', JSON.stringify(deliverySettingsObj));
      formData.append('timings', JSON.stringify(data.timings));

      // Append Document Metadata
      formData.append('businessLicenseNumber', data.businessLicenseNumber);
      formData.append('foodHygieneCertificateNumber', data.foodHygieneCertificateNumber);
      formData.append('vatNumber', data.vatNumber);
      formData.append('beneficiaryName', data.beneficiaryName);
      formData.append('sortCode', data.sortCode);
      formData.append('accountNumber', data.accountNumber);
      formData.append('bankAddress', data.bankAddress);

      // 3. Append Files (Helper function)
      const appendFile = (fieldName, elementId) => {
        const fileInput = document.getElementById(elementId);
        if (fileInput?.files?.length > 0) {
          if (elementId === 'images') {
             // Handle multiple gallery images
             for (let i = 0; i < fileInput.files.length; i++) {
                formData.append(fieldName, fileInput.files[i]);
             }
          } else {
             formData.append(fieldName, fileInput.files[0]);
          }
        }
      };

      appendFile('profileImage', 'profileImage');
      appendFile('images', 'images'); // Gallery
      appendFile('businessLicenseImage', 'businessLicenseImage');
      appendFile('foodHygieneCertificateImage', 'foodHygieneCertificateImage');
      appendFile('vatCertificateImage', 'vatCertificateImage');
      appendFile('bankDocumentImage', 'bankDocumentImage');

      // 4. API Call
      await api.post('/ownerRegistration/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Application submitted! Please wait for admin approval.");
      navigate('/auth/login');

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Registration failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for input classes
  const inputClass = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";
  const sectionClass = "bg-white p-6 rounded-lg shadow mb-6";

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Partner Registration</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          
          {/* Basic Info */}
          <div className={sectionClass}>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Restaurant Name</label>
                <input type="text" {...register('restaurantName')} className={inputClass} />
                {errors.restaurantName && <span className="text-red-500 text-xs">{errors.restaurantName.message}</span>}
              </div>
              <div>
                <label className={labelClass}>Owner Full Name</label>
                <input type="text" {...register('ownerFullName')} className={inputClass} />
                {errors.ownerFullName && <span className="text-red-500 text-xs">{errors.ownerFullName.message}</span>}
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" {...register('email')} className={inputClass} />
                {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input type="password" {...register('password')} className={inputClass} />
                {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
              </div>
              <div>
                <label className={labelClass}>Phone Number (UK format)</label>
                <input type="text" {...register('phoneNumber')} className={inputClass} />
                {errors.phoneNumber && <span className="text-red-500 text-xs">{errors.phoneNumber.message}</span>}
              </div>
              <div>
                <label className={labelClass}>Restaurant Type</label>
                <select {...register('restaurantType')} className={inputClass}>
                  <option value="food_delivery_and_dining">Food Delivery & Dining</option>
                  <option value="food_delivery">Food Delivery Only</option>
                  <option value="groceries">Groceries</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Location</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="col-span-2">
                <label className={labelClass}>Shop No</label>
                <input type="text" {...register('shopNo')} className={inputClass} />
              </div>
              <div className="col-span-2">
                 <label className={labelClass}>Floor</label>
                 <input type="text" {...register('floor')} className={inputClass} />
              </div>
              <div className="col-span-2">
                 <label className={labelClass}>City</label>
                 <input type="text" {...register('city')} className={inputClass} />
              </div>
              <div className="col-span-3">
                 <label className={labelClass}>Area</label>
                 <input type="text" {...register('area')} className={inputClass} />
              </div>
              <div className="col-span-3">
                 <label className={labelClass}>Landmark</label>
                 <input type="text" {...register('landmark')} className={inputClass} />
              </div>
              <div className="col-span-3">
                 <label className={labelClass}>Latitude</label>
                 <input type="number" step="any" {...register('latitude')} className={inputClass} />
              </div>
              <div className="col-span-3">
                 <label className={labelClass}>Longitude</label>
                 <input type="number" step="any" {...register('longitude')} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Financials & Delivery */}
          <div className={sectionClass}>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Settings & Financials</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                   <label className={labelClass}>Handling Charge (%)</label>
                   <input type="number" step="0.01" {...register('handlingChargesPercentage')} className={inputClass} />
                </div>
                <div>
                   <label className={labelClass}>Stripe Secret Key</label>
                   <input type="password" {...register('stripeSecretKey')} className={inputClass} />
                   {errors.stripeSecretKey && <span className="text-red-500 text-xs">{errors.stripeSecretKey.message}</span>}
                </div>
                <div>
                   <label className={labelClass}>Free Delivery Radius (miles)</label>
                   <input type="number" step="0.1" {...register('freeDeliveryRadius')} className={inputClass} />
                </div>
                <div>
                   <label className={labelClass}>Charge Per Mile (£)</label>
                   <input type="number" step="0.01" {...register('chargePerMile')} className={inputClass} />
                </div>
                <div>
                   <label className={labelClass}>Max Delivery Radius (miles)</label>
                   <input type="number" step="0.1" {...register('maxDeliveryRadius')} className={inputClass} />
                </div>
            </div>
          </div>

           {/* Documents & Files */}
           <div className={sectionClass}>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Documents & Images</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
               {/* Documents Metadata */}
               <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Business License No.</label>
                    <input type="text" {...register('businessLicenseNumber')} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Food Hygiene Cert No.</label>
                    <input type="text" {...register('foodHygieneCertificateNumber')} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>VAT Number</label>
                    <input type="text" {...register('vatNumber')} className={inputClass} />
                  </div>
               </div>

               {/* Bank Details */}
               <div className="col-span-2 mt-4 border-t pt-4">
                  <h4 className="text-md font-medium text-gray-700">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <input type="text" placeholder="Beneficiary Name" {...register('beneficiaryName')} className={inputClass} />
                    <input type="text" placeholder="Sort Code" {...register('sortCode')} className={inputClass} />
                    <input type="text" placeholder="Account Number" {...register('accountNumber')} className={inputClass} />
                    <input type="text" placeholder="Bank Address" {...register('bankAddress')} className={inputClass} />
                  </div>
               </div>

               {/* File Inputs (Uncontrolled, using getElementById in submit) */}
               <div className="col-span-2 border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Profile Image</label>
                    <input type="file" id="profileImage" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
                  <div>
                    <label className={labelClass}>Gallery Images (Max 5)</label>
                    <input type="file" id="images" multiple accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
                  <div>
                    <label className={labelClass}>Business License Image</label>
                    <input type="file" id="businessLicenseImage" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
                  <div>
                    <label className={labelClass}>Food Hygiene Cert Image</label>
                    <input type="file" id="foodHygieneCertificateImage" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
                  <div>
                    <label className={labelClass}>VAT Cert Image</label>
                    <input type="file" id="vatCertificateImage" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
                  <div>
                    <label className={labelClass}>Bank Proof Image</label>
                    <input type="file" id="bankDocumentImage" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
               </div>
            </div>
          </div>

          {/* Timings */}
          <div className={sectionClass}>
             <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Operating Hours</h3>
             <div className="space-y-2">
                {timingFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-4">
                        <span className="w-24 capitalize font-medium">{field.day}</span>
                        <label className="flex items-center space-x-2">
                           <input type="checkbox" {...register(`timings.${index}.isOpen`)} className="rounded text-indigo-600" />
                           <span className="text-sm">Open</span>
                        </label>
                        <input type="time" {...register(`timings.${index}.openTime`)} className="border rounded px-2 py-1 text-sm" />
                        <span>to</span>
                        <input type="time" {...register(`timings.${index}.closeTime`)} className="border rounded px-2 py-1 text-sm" />
                    </div>
                ))}
             </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Submitting Application...' : 'Register Restaurant'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}