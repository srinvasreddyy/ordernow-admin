import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, ChevronLeft, CheckCircle2, Upload, MapPin, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// --- Schema Definition ---
const timeSlotSchema = z.object({
  day: z.string(),
  isOpen: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});

const registerSchema = z.object({
  restaurantName: z.string().min(1, "Restaurant Name is required"),
  ownerFullName: z.string().min(1, "Owner Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 chars"),
  phoneNumber: z.string().min(10, "Valid phone number required"),
  restaurantType: z.enum(['food_delivery_and_dining', 'groceries', 'food_delivery']),
  
  shopNo: z.string().min(1, "Shop No required"),
  floor: z.string().optional(),
  area: z.string().min(1, "Area required"),
  city: z.string().min(1, "City required"),
  landmark: z.string().optional(),
  longitude: z.coerce.number({ invalid_type_error: "Required (Use Detect Location)" }),
  latitude: z.coerce.number({ invalid_type_error: "Required (Use Detect Location)" }),

  handlingChargesPercentage: z.string().transform(val => parseFloat(val)),
  stripeSecretKey: z.string().startsWith('sk_', "Must start with sk_"),
  freeDeliveryRadius: z.string().transform(val => parseFloat(val)),
  chargePerMile: z.string().transform(val => parseFloat(val)),
  maxDeliveryRadius: z.string().transform(val => parseFloat(val)),

  timings: z.array(timeSlotSchema),
  
  businessLicenseNumber: z.string().min(1, "License No required"),
  foodHygieneCertificateNumber: z.string().min(1, "Certificate No required"),
  vatNumber: z.string().min(1, "VAT No required"),
  beneficiaryName: z.string().min(1, "Beneficiary Name required"),
  sortCode: z.string().min(1, "Sort Code required"),
  accountNumber: z.string().min(1, "Account No required"),
  bankAddress: z.string().min(1, "Bank Address required"),
});

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// --- Step Configuration ---
const STEPS = [
  { id: 'basic', title: 'Basic Info', fields: ['restaurantName', 'ownerFullName', 'email', 'password', 'phoneNumber', 'restaurantType'] },
  { id: 'location', title: 'Location', fields: ['shopNo', 'floor', 'city', 'area', 'landmark', 'latitude', 'longitude'] },
  { id: 'financials', title: 'Financials & Delivery', fields: ['handlingChargesPercentage', 'stripeSecretKey', 'freeDeliveryRadius', 'chargePerMile', 'maxDeliveryRadius'] },
  { id: 'timings', title: 'Operating Hours', fields: ['timings'] },
  { id: 'documents', title: 'Docs & Banking', fields: ['businessLicenseNumber', 'foodHygieneCertificateNumber', 'vatNumber', 'beneficiaryName', 'sortCode', 'accountNumber', 'bankAddress'] }
];

export default function Register() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const { register, control, handleSubmit, trigger, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      timings: DAYS.map(day => ({ day, isOpen: true, openTime: "09:00", closeTime: "22:00" }))
    }
  });

  const { fields: timingFields } = useFieldArray({ control, name: "timings" });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', position.coords.latitude);
        setValue('longitude', position.coords.longitude);
        setIsLocating(false);
        toast.success("Location detected!");
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        toast.error("Unable to retrieve location. Please check browser permissions.");
      }
    );
  };

  const nextStep = async () => {
    const fieldsToValidate = STEPS[currentStep].fields;
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      const simpleFields = [
        'restaurantName', 'ownerFullName', 'email', 'password', 'phoneNumber', 'restaurantType',
        'handlingChargesPercentage', 'stripeSecretKey', 'businessLicenseNumber', 
        'foodHygieneCertificateNumber', 'vatNumber', 'beneficiaryName', 'sortCode', 
        'accountNumber', 'bankAddress'
      ];
      simpleFields.forEach(field => formData.append(field, data[field]));

      const addressObj = {
        shopNo: data.shopNo,
        floor: data.floor,
        area: data.area,
        city: data.city,
        landmark: data.landmark,
        coordinates: { type: 'Point', coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)] }
      };
      formData.append('address', JSON.stringify(addressObj));

      const deliverySettingsObj = {
        freeDeliveryRadius: data.freeDeliveryRadius,
        chargePerMile: data.chargePerMile,
        maxDeliveryRadius: data.maxDeliveryRadius
      };
      formData.append('deliverySettings', JSON.stringify(deliverySettingsObj));
      formData.append('timings', JSON.stringify(data.timings));

      const fileIds = [
        'profileImage', 'businessLicenseImage', 
        'foodHygieneCertificateImage', 'vatCertificateImage', 'bankDocumentImage'
      ];
      
      fileIds.forEach(id => {
        const element = document.getElementById(id);
        if (element?.files?.[0]) formData.append(id, element.files[0]);
      });

      const galleryElement = document.getElementById('images');
      if (galleryElement?.files?.length > 0) {
        for (let i = 0; i < galleryElement.files.length; i++) {
          formData.append('images', galleryElement.files[i]);
        }
      }

      await api.post('/ownerRegistration/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Application submitted successfully!");
      navigate('/auth/login');

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const InputGroup = ({ label, name, type = "text", placeholder, readOnly = false }) => (
    <div>
      <label className="input-label">{label}</label>
      <input 
        type={type} 
        {...register(name)} 
        readOnly={readOnly}
        className={clsx(
            "input-field", 
            readOnly && "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200 focus:ring-0",
            errors[name] && "border-red-500 focus:border-red-500 focus:ring-red-200"
        )} 
        placeholder={placeholder}
      />
      {errors[name] && <span className="text-red-500 text-xs mt-1 block">{errors[name].message}</span>}
    </div>
  );

  return (
    <div className="min-h-screen bg-cream py-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Side: Progress & Info */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="p-6">
                <h1 className="text-3xl font-extrabold text-dark mb-2">Join OrderNow</h1>
                <p className="text-secondary">Complete the steps to register your restaurant.</p>
            </div>

            {/* Vertical Stepper (Desktop) */}
            <div className="hidden lg:flex flex-col gap-0 px-6">
                {STEPS.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    return (
                        <div key={step.id} className="flex gap-4 relative pb-8 last:pb-0">
                            {index !== STEPS.length - 1 && (
                                <div className={clsx("absolute top-8 left-3.5 w-0.5 h-[calc(100%-20px)]", isCompleted ? "bg-green-500" : "bg-gray-200")} />
                            )}
                            <div className={clsx(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors z-10",
                                isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : 
                                isCompleted ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                            )}>
                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                            </div>
                            <div className={clsx("pt-1 transition-opacity", isActive ? "opacity-100" : "opacity-60")}>
                                <h4 className="text-sm font-bold text-dark leading-none">{step.title}</h4>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mx-6">
                <p className="text-sm text-secondary mb-2">Have an account?</p>
                <Link to="/auth/login" className="text-primary font-bold hover:underline text-sm">Log in here</Link>
            </div>
          </div>

          {/* Right Side: Form Wizard */}
          <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-card border border-gray-100 flex flex-col overflow-hidden">
            {/* Mobile Progress Bar */}
            <div className="lg:hidden w-full bg-gray-100 h-1.5">
               <div className="bg-primary h-1.5 transition-all duration-300" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
            </div>

            <div className="p-6 sm:p-8 flex-1">
                <div className="mb-6 lg:hidden">
                   <h2 className="text-xl font-bold text-dark">{STEPS[currentStep].title}</h2>
                   <p className="text-xs text-secondary">Step {currentStep + 1} of {STEPS.length}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="h-full flex flex-col">
                  
                  {/* Step 1: Basic Information */}
                  <div className={clsx(currentStep === 0 ? 'block' : 'hidden', "space-y-5")}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputGroup label="Restaurant Name" name="restaurantName" />
                        <InputGroup label="Owner Full Name" name="ownerFullName" />
                        <InputGroup label="Email Address" name="email" type="email" />
                        <InputGroup label="Password" name="password" type="password" />
                        <InputGroup label="Phone Number" name="phoneNumber" placeholder="e.g. 07700 900000" />
                        <div>
                            <label className="input-label">Restaurant Type</label>
                            <select {...register('restaurantType')} className="input-field">
                                <option value="food_delivery_and_dining">Delivery & Dining</option>
                                <option value="food_delivery">Delivery Only</option>
                                <option value="groceries">Groceries</option>
                            </select>
                        </div>
                     </div>
                     
                     <div className="mt-6 border-t border-gray-100 pt-6">
                        <label className="input-label mb-3 block">Profile Image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                            <input type="file" id="profileImage" accept="image/*" className="block w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"/>
                        </div>
                     </div>
                  </div>

                  {/* Step 2: Location */}
                  <div className={clsx(currentStep === 1 ? 'block' : 'hidden', "space-y-5")}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputGroup label="Shop No" name="shopNo" />
                        <InputGroup label="Floor / Building" name="floor" />
                        <InputGroup label="City" name="city" />
                        <InputGroup label="Area / Locality" name="area" />
                        <div className="md:col-span-2"><InputGroup label="Landmark" name="landmark" /></div>
                        
                        <div className="md:col-span-2 flex justify-between items-end border-t border-gray-100 pt-4 mt-2">
                            <div>
                                <p className="text-sm font-bold text-dark">Coordinates</p>
                                <p className="text-xs text-secondary">Click the button to auto-detect.</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={handleGetLocation} 
                                disabled={isLocating}
                                className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                            >
                                {isLocating ? <Loader2 className="w-4 h-4 animate-spin"/> : <MapPin className="w-4 h-4" />}
                                {isLocating ? "Detecting..." : "Detect Location"}
                            </button>
                        </div>

                        <InputGroup label="Latitude" name="latitude" type="number" readOnly={true} placeholder="Auto-filled" />
                        <InputGroup label="Longitude" name="longitude" type="number" readOnly={true} placeholder="Auto-filled" />
                     </div>
                  </div>

                  {/* Step 3: Financials */}
                  <div className={clsx(currentStep === 2 ? 'block' : 'hidden', "space-y-5")}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputGroup label="Handling Charge (%)" name="handlingChargesPercentage" type="number" />
                        <InputGroup label="Stripe Secret Key" name="stripeSecretKey" type="password" />
                        <InputGroup label="Free Delivery Radius (miles)" name="freeDeliveryRadius" type="number" />
                        <InputGroup label="Charge Per Mile (£)" name="chargePerMile" type="number" />
                        <InputGroup label="Max Delivery Radius (miles)" name="maxDeliveryRadius" type="number" />
                     </div>
                  </div>

                  {/* Step 4: Timings */}
                  <div className={clsx(currentStep === 3 ? 'block' : 'hidden', "space-y-4")}>
                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {timingFields.map((field, index) => (
                            <div key={field.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-gray-200 last:border-0">
                                <span className="w-28 capitalize font-bold text-dark">{field.day}</span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" {...register(`timings.${index}.isOpen`)} className="rounded text-primary focus:ring-primary/25 w-4 h-4" />
                                   <span className="text-sm font-medium">Open</span>
                                </label>
                                <div className="flex items-center gap-2 ml-auto">
                                    <input type="time" {...register(`timings.${index}.openTime`)} className="input-field py-1 w-32 text-center" />
                                    <span className="text-secondary text-sm">to</span>
                                    <input type="time" {...register(`timings.${index}.closeTime`)} className="input-field py-1 w-32 text-center" />
                                </div>
                            </div>
                        ))}
                     </div>
                  </div>

                  {/* Step 5: Docs & Bank (Final) */}
                  <div className={clsx(currentStep === 4 ? 'block' : 'hidden', "space-y-6")}>
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                        <h4 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-wide">Business Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Business License No." name="businessLicenseNumber" />
                            <InputGroup label="Hygiene Cert No." name="foodHygieneCertificateNumber" />
                            <InputGroup label="VAT Number" name="vatNumber" />
                        </div>
                     </div>

                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                        <h4 className="font-bold text-dark mb-3 text-sm uppercase tracking-wide">Bank Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Beneficiary Name" name="beneficiaryName" />
                            <InputGroup label="Sort Code" name="sortCode" />
                            <InputGroup label="Account Number" name="accountNumber" />
                            <InputGroup label="Bank Address" name="bankAddress" />
                        </div>
                     </div>

                     <div>
                        <h4 className="font-bold text-dark mb-3 text-sm uppercase tracking-wide">Upload Proofs</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                {id: 'businessLicenseImage', label: 'Business License'},
                                {id: 'foodHygieneCertificateImage', label: 'Hygiene Cert'},
                                {id: 'vatCertificateImage', label: 'VAT Cert'},
                                {id: 'bankDocumentImage', label: 'Bank Proof'},
                                {id: 'images', label: 'Gallery Images', multiple: true}
                            ].map(file => (
                                <div key={file.id}>
                                    <label className="text-xs font-semibold text-secondary mb-1 block">{file.label}</label>
                                    <input 
                                        type="file" 
                                        id={file.id} 
                                        multiple={file.multiple}
                                        className="block w-full text-xs text-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-dark hover:file:bg-gray-200 border border-gray-200 rounded-lg"
                                    />
                                </div>
                            ))}
                        </div>
                     </div>
                  </div>

                  {/* Navigation Footer */}
                  <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-center">
                    {currentStep > 0 ? (
                        <button type="button" onClick={prevStep} className="btn-secondary px-5 py-2.5">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    ) : <div></div>}

                    {currentStep < STEPS.length - 1 ? (
                        <button type="button" onClick={nextStep} className="btn-primary px-6 py-2.5">
                            Next Step <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button type="submit" disabled={isSubmitting} className="btn-primary px-8 py-2.5 shadow-lg shadow-primary/30">
                            {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                        </button>
                    )}
                  </div>

                </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}