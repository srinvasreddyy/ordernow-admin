import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, ChevronLeft, CheckCircle2, MapPin, Loader2, Search, X, Info, PlayCircle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

// Environment variable checks
const GLOBAL_ONLINE_PAYMENTS_ENABLED = import.meta.env.VITE_ENABLE_ONLINE_PAYMENTS === 'true';
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

// --- Helper: Time Comparison ---
const isTimeBefore = (start, end) => {
  if (!start || !end) return true;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return startH < endH || (startH === endH && startM < endM);
};

// --- Schema Definition ---
const timeSlotSchema = z.object({
  day: z.string(),
  isOpen: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.isOpen && data.openTime && data.closeTime) {
    if (!isTimeBefore(data.openTime, data.closeTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Closing time must be after opening time",
        path: ["closeTime"],
      });
    }
  }
});

const ukPhoneRegex = /^(?:(?:\(?(?:0(?:0|11)\)?[\s-]?\(?|\+)44\)?[\s-]?(?:\(?0\)?[\s-]?)?)|(?:\(?0))(?:(?:\d{5}\)?[\s-]?\d{4,5})|(?:\d{4}\)?[\s?]?(?:\d{5}|\d{3}[\s-]?\d{3}))|(?:\d{3}\)?[\s-]?\d{3}[\s-]?\d{3,4})|(?:\d{2}\)?[\s-]?\d{4}[\s-]?\d{4}))(?:[\s-]?(?:x|ext\.?|\#)\d{3,4})?$/;

const registerSchema = z.object({
  restaurantName: z.string().min(1, "Restaurant Name is required"),
  ownerFullName: z.string().min(1, "Owner Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 chars"),
  phoneNumber: z.string().regex(ukPhoneRegex, "Valid UK phone number required"),
  restaurantType: z.enum(['food_delivery_and_dining', 'groceries', 'food_delivery']),
  
  shopNo: z.string().min(1, "Shop No/Building Name required"),
  floor: z.string().optional(),
  area: z.string().min(1, "Area/Postcode required"),
  city: z.string().min(1, "City required"),
  landmark: z.string().optional(),
  longitude: z.coerce.number().refine(val => val !== 0, "Location not detected (0.0)"),
  latitude: z.coerce.number().refine(val => val !== 0, "Location not detected (0.0)"),

  handlingChargesPercentage: z.string()
    .transform(val => parseFloat(val || 0))
    .refine(val => val >= 0 && val <= 100, "Must be 0-100%"),
    
  acceptsOnlineOrders: z.boolean().optional(),
  
  freeDeliveryRadius: z.string().transform(val => parseFloat(val || 0)),
  chargePerMile: z.string().transform(val => parseFloat(val || 0)),
  maxDeliveryRadius: z.string().transform(val => parseFloat(val || 0)),

  timings: z.array(timeSlotSchema),
  
  businessLicenseNumber: z.string().min(1, "License No required"),
  foodHygieneCertificateNumber: z.string().min(1, "Certificate No required"),
  vatNumber: z.string().min(1, "VAT No required"),
  
  beneficiaryName: z.string().min(1, "Beneficiary Name required"),
  sortCode: z.string().regex(/^\d{2}-?\d{2}-?\d{2}$|^\d{6}$/, "Sort code must be 6 digits"),
  accountNumber: z.string().regex(/^\d{8}$/, "Account number must be 8 digits"),
  bankAddress: z.string().min(1, "Bank Address required"),
}).superRefine((data, ctx) => {
  if (data.maxDeliveryRadius > 0 && data.freeDeliveryRadius > data.maxDeliveryRadius) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Free radius cannot be larger than Max radius",
      path: ["freeDeliveryRadius"],
    });
  }
});

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const STEPS = [
  { id: 'basic', title: 'Basic Info', fields: ['restaurantName', 'ownerFullName', 'email', 'password', 'phoneNumber', 'restaurantType'] },
  { id: 'location', title: 'Location', fields: ['shopNo', 'floor', 'city', 'area', 'landmark', 'latitude', 'longitude'] },
  { id: 'financials', title: 'Financials & Delivery', fields: ['handlingChargesPercentage', 'acceptsOnlineOrders', 'freeDeliveryRadius', 'chargePerMile', 'maxDeliveryRadius'] },
  { id: 'timings', title: 'Operating Hours', fields: ['timings'] },
  { id: 'documents', title: 'Docs & Banking', fields: ['businessLicenseNumber', 'foodHygieneCertificateNumber', 'vatNumber', 'beneficiaryName', 'sortCode', 'accountNumber', 'bankAddress'] }
];

const InputGroup = ({ label, name, type = "text", placeholder, helpText, readOnly = false, register, errors }) => (
  <div>
    <div className="flex items-baseline justify-between">
        <label className="input-label mb-1.5 block">{label}</label>
    </div>
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
    {helpText && !errors[name] && (
        <p className="text-[11px] text-gray-500 mt-1.5 flex gap-1 items-start leading-tight">
            <Info className="w-3 h-3 shrink-0 mt-[1px]" /> {helpText}
        </p>
    )}
    {errors[name] && <span className="text-red-500 text-xs mt-1 block font-medium">{errors[name].message}</span>}
  </div>
);

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // --- Search State ---
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { register, control, handleSubmit, trigger, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      acceptsOnlineOrders: false,
      handlingChargesPercentage: "0",
      freeDeliveryRadius: "0",
      chargePerMile: "0",
      maxDeliveryRadius: "5",
      timings: DAYS.map(day => ({ day, isOpen: true, openTime: "09:00", closeTime: "22:00" }))
    }
  });

  const acceptsOnlineOrdersValue = watch('acceptsOnlineOrders');
  const { fields: timingFields } = useFieldArray({ control, name: "timings" });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (addressQuery.length > 2) {
        performGeoapifySearch(addressQuery);
      } else {
        setAddressResults([]);
        setShowDropdown(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [addressQuery]);

  const performGeoapifySearch = async (query) => {
    if (!GEOAPIFY_API_KEY) return;
    setIsSearchingAddress(true);
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_API_KEY}&filter=countrycode:gb&lang=en&limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.features) {
          setAddressResults(data.features);
          setShowDropdown(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectAddress = (feature) => {
    const props = feature.properties;
    setValue('latitude', props.lat);
    setValue('longitude', props.lon);
    
    if (props.name) setValue('restaurantName', props.name);
    if (props.city) setValue('city', props.city);
    
    const area = props.suburb || props.district || props.postcode;
    if (area) setValue('area', area);

    const street = props.street || "";
    const housenumber = props.housenumber || "";
    const shopInfo = housenumber ? `${housenumber} ${street}` : street;
    if (shopInfo) setValue('shopNo', shopInfo);
    
    setValue('landmark', props.formatted);
    setAddressQuery(props.formatted); 
    setShowDropdown(false);
    toast.success("Location details auto-filled!");
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
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
        setIsLocating(false);
        toast.error("Unable to retrieve location.");
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
        'handlingChargesPercentage', 'businessLicenseNumber', 
        'foodHygieneCertificateNumber', 'vatNumber', 'beneficiaryName', 'sortCode', 
        'accountNumber', 'bankAddress'
      ];
      simpleFields.forEach(field => formData.append(field, data[field]));

      const finalAcceptsOnlineOrders = GLOBAL_ONLINE_PAYMENTS_ENABLED && data.acceptsOnlineOrders;
      formData.append('acceptsOnlineOrders', finalAcceptsOnlineOrders);

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

      const response = await api.post('/owner-registrations/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
          toast.success("Registration successful!");
          
          // Auto-Login
          if (response.data.restaurant) {
             login(response.data.restaurant);
          }
          
          // Redirect to Success Page instead of Stripe
          navigate('/auth/success');
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Side: Progress & Info */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="p-6">
                <h1 className="text-3xl font-extrabold text-dark mb-2">Join OrderNow</h1>
                <p className="text-secondary">Complete the steps to register your restaurant.</p>
                <Link to="/guide" className="inline-flex items-center gap-2 mt-4 text-primary font-bold hover:underline text-sm">
                    <PlayCircle className="w-4 h-4" /> Watch Onboarding Guide
                </Link>
            </div>

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
                        <InputGroup label="Restaurant Name" name="restaurantName" register={register} errors={errors} placeholder="e.g. The Tasty Burger Co." helpText="Will auto-fill if you select a business from the search." />
                        <InputGroup label="Owner Full Name" name="ownerFullName" register={register} errors={errors} placeholder="e.g. John Smith" helpText="Legal name of the business owner." />
                        <InputGroup label="Email Address" name="email" type="email" register={register} errors={errors} placeholder="e.g. contact@restaurant.com" helpText="We'll send your login details here." />
                        <InputGroup label="Password" name="password" type="password" register={register} errors={errors} placeholder="••••••••" helpText="Min. 8 chars, mix of letters & numbers recommended." />
                        <InputGroup label="Phone Number" name="phoneNumber" placeholder="e.g. 07700 900000" register={register} errors={errors} helpText="UK mobile (07) or landline (01/02) format." />
                        <div>
                            <label className="input-label mb-1.5 block">Restaurant Type</label>
                            <select {...register('restaurantType')} className="input-field">
                                <option value="food_delivery_and_dining">Delivery & Dining</option>
                                <option value="food_delivery">Delivery Only</option>
                                <option value="groceries">Groceries</option>
                            </select>
                            <p className="text-[11px] text-gray-500 mt-1.5 flex gap-1 items-start leading-tight">
                                <Info className="w-3 h-3 shrink-0 mt-[1px]" /> Select the category that best describes your business.
                            </p>
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
                        <div className="md:col-span-2 relative">
                             <label className="input-label">Search Restaurant / Address (UK)</label>
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={addressQuery}
                                    onChange={(e) => setAddressQuery(e.target.value)}
                                    placeholder="Start typing business name, street or postcode..."
                                    className="input-field pl-10"
                                    autoComplete="off"
                                />
                                {isSearchingAddress && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary"/>
                                    </div>
                                )}
                                {addressQuery && !isSearchingAddress && (
                                    <button type="button" onClick={() => { setAddressQuery(""); setAddressResults([]); setShowDropdown(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                             </div>
                             {showDropdown && addressResults.length > 0 && (
                                 <ul className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto w-full left-0">
                                     {addressResults.map((item, i) => (
                                         <li key={i} onClick={() => handleSelectAddress(item)} className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0 text-dark flex items-start gap-2">
                                             <MapPin className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                                             <div className="flex flex-col text-left">
                                                <span className="font-semibold">{item.properties.name || item.properties.street || "Address"}</span>
                                                <span className="text-xs text-gray-500">{item.properties.formatted}</span>
                                             </div>
                                         </li>
                                     ))}
                                 </ul>
                             )}
                             <p className="text-[11px] text-gray-500 mt-1.5 flex gap-1 items-start leading-tight">
                                <Info className="w-3 h-3 shrink-0 mt-[1px]" /> Typing your address here will auto-fill the fields below.
                            </p>
                        </div>

                        <InputGroup label="Shop No / Building" name="shopNo" register={register} errors={errors} placeholder="e.g. 15B" helpText="Unit number, building name, or house number." />
                        <InputGroup label="Floor" name="floor" register={register} errors={errors} placeholder="e.g. Ground Floor" helpText="Optional. Useful for large buildings." />
                        <InputGroup label="City" name="city" register={register} errors={errors} placeholder="e.g. London" />
                        <InputGroup label="Area / Postcode" name="area" register={register} errors={errors} placeholder="e.g. Camden / NW1 8QL" helpText="Important for delivery calculations." />
                        <div className="md:col-span-2"><InputGroup label="Landmark (Auto-filled)" name="landmark" register={register} errors={errors} placeholder="Full address string" readOnly={true} /></div>
                        
                        <div className="md:col-span-2 flex justify-between items-end border-t border-gray-100 pt-4 mt-2">
                            <div>
                                <p className="text-sm font-bold text-dark">Coordinates</p>
                                <p className="text-xs text-secondary">Auto-detected from search or 'Detect Location'.</p>
                            </div>
                            <button type="button" onClick={handleGetLocation} disabled={isLocating} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                                {isLocating ? <Loader2 className="w-4 h-4 animate-spin"/> : <MapPin className="w-4 h-4" />}
                                {isLocating ? "Detecting..." : "Detect Location"}
                            </button>
                        </div>
                        <InputGroup label="Latitude" name="latitude" type="number" readOnly={true} placeholder="Auto-filled" register={register} errors={errors} />
                        <InputGroup label="Longitude" name="longitude" type="number" readOnly={true} placeholder="Auto-filled" register={register} errors={errors} />
                     </div>
                  </div>

                  {/* Step 3: Financials */}
                  <div className={clsx(currentStep === 2 ? 'block' : 'hidden', "space-y-5")}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputGroup 
                            label="Handling Charge (%)" 
                            name="handlingChargesPercentage" 
                            type="number" 
                            register={register} 
                            errors={errors} 
                            placeholder="e.g. 2.5"
                            helpText="Percentage fee added to every customer order total." 
                        />
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                           <label className={clsx("flex items-start gap-3 cursor-pointer", !GLOBAL_ONLINE_PAYMENTS_ENABLED && "opacity-50 grayscale cursor-not-allowed")}>
                                <input type="checkbox" {...register('acceptsOnlineOrders')} disabled={!GLOBAL_ONLINE_PAYMENTS_ENABLED} className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary/25 border-gray-300" />
                                <div>
                                    <span className="font-bold text-dark block">Accept Online Payments</span>
                                    <span className="text-xs text-secondary block mt-0.5">
                                        {GLOBAL_ONLINE_PAYMENTS_ENABLED ? "You must connect Stripe later in Settings > Configuration." : "Online payments are currently disabled."}
                                    </span>
                                </div>
                           </label>
                        </div>
                        <InputGroup 
                            label="Free Delivery Radius (miles)" 
                            name="freeDeliveryRadius" 
                            type="number" 
                            register={register} 
                            errors={errors} 
                            placeholder="e.g. 3" 
                            helpText="Orders within this distance get free delivery."
                        />
                        <InputGroup 
                            label="Max Delivery Radius (miles)" 
                            name="maxDeliveryRadius" 
                            type="number" 
                            register={register} 
                            errors={errors} 
                            placeholder="e.g. 8" 
                            helpText="You will not receive orders from customers beyond this distance."
                        />
                        <InputGroup 
                            label="Charge Per Mile (£)" 
                            name="chargePerMile" 
                            type="number" 
                            register={register} 
                            errors={errors} 
                            placeholder="e.g. 1.50" 
                            helpText="Fee charged for every mile BEYOND the free delivery radius."
                        />
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
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 ml-auto">
                                    <div className="flex items-center gap-2">
                                      <input type="time" {...register(`timings.${index}.openTime`)} className="input-field py-1 w-32 text-center" />
                                      <span className="text-secondary text-sm">to</span>
                                      <input type="time" {...register(`timings.${index}.closeTime`)} className={clsx("input-field py-1 w-32 text-center", errors.timings?.[index]?.closeTime && "border-red-500")} />
                                    </div>
                                    {errors.timings?.[index]?.closeTime && (
                                        <p className="text-red-500 text-[10px] sm:ml-2">{errors.timings[index].closeTime.message}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                     </div>
                  </div>

                  {/* Step 5: Docs & Bank */}
                  <div className={clsx(currentStep === 4 ? 'block' : 'hidden', "space-y-6")}>
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                        <h4 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-wide">Business Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Business License No." name="businessLicenseNumber" register={register} errors={errors} placeholder="e.g. LN-2024-883" helpText="Provided by your local council." />
                            <InputGroup label="Hygiene Cert No." name="foodHygieneCertificateNumber" register={register} errors={errors} placeholder="e.g. FH-992-X" helpText="Food Standards Agency rating ID." />
                            <InputGroup label="VAT Number" name="vatNumber" register={register} errors={errors} placeholder="e.g. GB 123 4567 89" helpText="If applicable. Write 'N/A' if not registered." />
                        </div>
                     </div>
                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                        <h4 className="font-bold text-dark mb-3 text-sm uppercase tracking-wide">Bank Details (UK)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Beneficiary Name" name="beneficiaryName" register={register} errors={errors} placeholder="e.g. John Smith" helpText="Name on the bank account." />
                            <InputGroup label="Sort Code" name="sortCode" placeholder="12-34-56" register={register} errors={errors} helpText="6 digits, usually hyphenated." />
                            <InputGroup label="Account Number" name="accountNumber" placeholder="12345678" register={register} errors={errors} helpText="8 digits exactly." />
                            <InputGroup label="Bank Address" name="bankAddress" register={register} errors={errors} placeholder="e.g. 1 High St, London" helpText="Address of your bank branch." />
                        </div>
                     </div>
                     <div>
                        <h4 className="font-bold text-dark mb-3 text-sm uppercase tracking-wide">Upload Proofs</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                {id: 'businessLicenseImage', label: 'Business License', help: 'Scan or clear photo.'},
                                {id: 'foodHygieneCertificateImage', label: 'Hygiene Cert', help: 'Must be valid.'},
                                {id: 'vatCertificateImage', label: 'VAT Cert', help: 'If applicable.'},
                                {id: 'bankDocumentImage', label: 'Bank Proof', help: 'Statement header showing Sort/Acc No.'},
                                {id: 'images', label: 'Gallery Images', multiple: true, help: 'Photos of food/interior (Max 5).'}
                            ].map(file => (
                                <div key={file.id}>
                                    <label className="text-xs font-semibold text-secondary mb-1 block">{file.label}</label>
                                    <input type="file" id={file.id} multiple={file.multiple} className="block w-full text-xs text-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-dark hover:file:bg-gray-200 border border-gray-200 rounded-lg" />
                                    <p className="text-[10px] text-gray-400 mt-1">{file.help}</p>
                                </div>
                            ))}
                        </div>
                     </div>
                  </div>

                  {/* Navigation */}
                  <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-center">
                    {currentStep > 0 ? (
                        <button type="button" onClick={prevStep} className="btn-secondary px-5 py-2.5"><ChevronLeft className="w-4 h-4" /> Back</button>
                    ) : <div></div>}
                    {currentStep < STEPS.length - 1 ? (
                        <button type="button" onClick={nextStep} className="btn-primary px-6 py-2.5">Next Step <ChevronRight className="w-4 h-4" /></button>
                    ) : (
                        <button type="submit" disabled={isSubmitting} className="btn-primary px-8 py-2.5 shadow-lg shadow-primary/30">
                            {isSubmitting ? 'Register & Submit' : 'Register & Submit'}
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